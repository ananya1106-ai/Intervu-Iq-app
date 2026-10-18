import { auth } from "../firebase/auth";
import { recordUserPaymentAndCredit } from "./userService";

export type PaymentPlanId = 'standard' | 'advanced';

export interface PaymentOrderResponse {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  planId: PaymentPlanId;
  planName: string;
  description: string;
  displayPrice: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  paymentId: string;
  orderId: string;
  planId: PaymentPlanId;
  planName: string;
  creditsGranted: number;
}

/**
 * Dynamically loads the Razorpay checkout script if not already loaded in the DOM.
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).Razorpay) return true;

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Creates a server-side verified Razorpay Order via POST /api/payments/create-order.
 */
export async function createRazorpayOrder(planId: PaymentPlanId): Promise<PaymentOrderResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in to purchase interview sessions.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create payment order with backend.");
  }

  return data as PaymentOrderResponse;
}

/**
 * Verifies Razorpay payment signature via POST /api/payments/verify
 * and syncs the updated credit to Firestore.
 */
export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: PaymentPlanId;
}): Promise<PaymentVerificationResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Authentication missing during payment verification.");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch("/api/payments/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.verified) {
    throw new Error(data.error || "Payment signature verification failed.");
  }

  // Idempotently persist into client Firestore (avoids duplicate crediting if server already updated)
  try {
    const amountInRupees = payload.planId === 'advanced' ? 29 : 15;
    await recordUserPaymentAndCredit(
      currentUser.uid,
      {
        paymentId: payload.razorpay_payment_id,
        orderId: payload.razorpay_order_id,
        planId: payload.planId,
        planName: payload.planId === 'advanced' ? 'Advanced Interview' : 'Standard Interview',
        amount: amountInRupees * 100,
        currency: "INR",
        status: "verified",
      },
      1,
      Boolean((data as any).firestoreUpdated)
    );
  } catch (syncErr) {
    console.warn("Client Firestore payment record sync notice:", syncErr);
  }

  return data as PaymentVerificationResponse;
}

export interface CheckoutOptions {
  planId: PaymentPlanId;
  onSuccess: (result: PaymentVerificationResponse) => void;
  onError: (error: string) => void;
  onDismiss?: () => void;
}

/**
 * Full Razorpay Standard Checkout flow:
 * 1. Checks auth
 * 2. Loads SDK
 * 3. Creates server order
 * 4. Displays Razorpay Modal
 * 5. Verifies signature on backend
 * 6. Credits user in Firestore
 */
export async function startRazorpayCheckout({
  planId,
  onSuccess,
  onError,
  onDismiss,
}: CheckoutOptions): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      onError("Please log in or sign up before purchasing interview sessions.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      onError("Unable to load Razorpay payment gateway. Please check your internet connection.");
      return;
    }

    // Create server-side order
    const orderData = await createRazorpayOrder(planId);

    if (!orderData.keyId) {
      onError(
        "Razorpay Key ID is not configured in backend environment variables. Please add RAZORPAY_KEY_ID to your Render / backend environment."
      );
      return;
    }

    const rzpOptions = {
      key: orderData.keyId,
      amount: orderData.amount, // strictly in paise from backend order
      currency: orderData.currency || "INR",
      name: "IntervuIQ",
      description: `${orderData.planName} (${orderData.displayPrice})`,
      order_id: orderData.orderId,
      prefill: {
        name: currentUser.displayName || "",
        email: currentUser.email || "",
      },
      notes: {
        planId: orderData.planId,
        planName: orderData.planName,
        userId: currentUser.uid,
      },
      theme: {
        color: "#10b981", // IntervuIQ emerald brand color
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: orderData.planId,
          });
          onSuccess(verifyResult);
        } catch (verifyError: any) {
          onError(verifyError?.message || "Payment verification failed.");
        }
      },
    };

    const rzp = new (window as any).Razorpay(rzpOptions);

    rzp.on("payment.failed", (response: any) => {
      console.error("Razorpay payment failed:", response.error);
      const desc = response.error?.description || response.error?.reason || "Payment was declined or cancelled.";
      onError(`Payment failed: ${desc}`);
    });

    rzp.open();
  } catch (err: any) {
    console.error("Error starting Razorpay checkout:", err);
    onError(err?.message || "Could not initialize checkout. Please try again.");
  }
}
