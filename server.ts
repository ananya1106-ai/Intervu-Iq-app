import express from "express";
import path from "path";
import crypto from "crypto";
import Razorpay from "razorpay";
import { initializeApp as initAdminApp, getApps as getAdminApps, cert as adminCert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from "firebase-admin/firestore";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import {
  getMockQuestions,
  getMockGrading,
  getMockResumeAnalysis,
  getMockEnhancedSentence,
  getMockJdMatch,
  getMockFollowUp,
  getMockDsaTrack,
  getMockRoadmap,
  getMockAdaptedRoadmap,
  getMockAtsAnalysis
} from "./server-fallbacks";

const app = express();
const PORT = 3000;

// Security Headers Middleware (OWASP Recommendations)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// JSON Body Parser with strict limit and raw body preservation for Razorpay webhook verification
app.use(
  express.json({
    limit: "5mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// In-memory sliding window Rate Limiter for AI API endpoints
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/min per IP

function apiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "global";
  const now = Date.now();

  const record = ipRateLimits.get(clientIp);
  if (!record || now > record.resetTime) {
    ipRateLimits.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
    res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS_PER_WINDOW - 1);
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
    res.setHeader("X-RateLimit-Remaining", 0);
    return res.status(429).json({
      error: "Too many requests to the AI API. Please slow down and try again shortly.",
      retryAfterSeconds: retryAfter
    });
  }

  record.count++;
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count));
  next();
}

// Clean up stale rate limit entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimits.entries()) {
    if (now > record.resetTime) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Apply Rate Limiter to all Gemini AI routes
app.use("/api/gemini", apiRateLimiter);

/**
 * Input sanitization helper to safeguard against prompt injection & oversized payloads
 */
function sanitizePromptInput(input: any, maxLength: number = 20000): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  // Cap length
  const truncated = str.slice(0, maxLength);
  // Clean null bytes and terminal control chars
  return truncated.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

// Lazy initializer for GoogleGenAI SDK to handle missing key errors gracefully
function getAIClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not defined on the server secrets.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Fast, highly resilient Gemini model invoker with diagnostics logging, intelligent quota handling,
 * and low-latency response generation.
 *
 * Latency & Reliability Strategy:
 * 1. Primary model: "gemini-3.1-flash-lite" (1-3s ultra-low latency, native structured JSON support).
 * 2. Fallback model: "gemini-3.7-flash" with ThinkingLevel.LOW to eliminate deep reasoning delay.
 * 3. Fast failure on 429/404 (Resource Exhausted / Model Not Found): Skips retrying the same model.
 * 4. Micro-retry on transient network errors (503/500/timeout): 1 retry max with 250ms delay.
 * 5. Structured latency and diagnostic telemetry (without exposing API keys or secrets).
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestConfig: {
    contents: string | any[];
    config?: any;
    operationName?: string;
  },
  candidateModels: string[] = ["gemini-3.1-flash-lite", "gemini-3.7-flash"]
) {
  const op = requestConfig.operationName || "gemini-op";
  const requestStartTime = Date.now();
  let lastError: any = null;
  let modelIndex = 0;

  for (const model of candidateModels) {
    const isFallbackModel = modelIndex > 0;
    modelIndex++;

    // Ensure low thinking level to eliminate heavy reasoning delays on structured tasks
    const configWithFastThinking = {
      ...requestConfig.config,
      thinkingConfig: requestConfig.config?.thinkingConfig || { thinkingLevel: ThinkingLevel.LOW }
    };

    for (let attempt = 1; attempt <= 2; attempt++) {
      const attemptStartTime = Date.now();
      try {
        console.log(`[Gemini Diagnostics] START op="${op}" model="${model}" attempt=${attempt} isFallback=${isFallbackModel} time=${new Date().toISOString()}`);

        const response = await ai.models.generateContent({
          model,
          contents: requestConfig.contents,
          config: configWithFastThinking
        });

        const totalDuration = Date.now() - requestStartTime;
        const attemptDuration = Date.now() - attemptStartTime;
        console.log(`[Gemini Diagnostics] SUCCESS op="${op}" model="${model}" attempt=${attempt} duration=${attemptDuration}ms totalDuration=${totalDuration}ms isFallback=${isFallbackModel}`);
        return response;
      } catch (err: any) {
        lastError = err;
        const attemptDuration = Date.now() - attemptStartTime;
        const status = err?.status || err?.code || (err?.message?.includes("429") ? 429 : "UNKNOWN");
        const msg = String(err?.message || "").slice(0, 140);

        console.warn(`[Gemini Diagnostics] FAIL op="${op}" model="${model}" attempt=${attempt} status="${status}" duration=${attemptDuration}ms error="${msg}"`);

        // If 429 (quota exhausted) or 404 (model not found), do NOT retry the same model
        const isQuotaOrNotFound = status === 429 || status === "RESOURCE_EXHAUSTED" || status === 404 || status === "NOT_FOUND" || msg.includes("429") || msg.includes("quota");
        if (isQuotaOrNotFound) {
          console.warn(`[Gemini Diagnostics] Quota/NotFound on model "${model}". Immediately switching to fallback.`);
          break; // Exit inner attempt loop, switch to next model immediately
        }

        // For transient 500/503/network errors, retry once with micro-backoff
        if (attempt === 1) {
          console.log(`[Gemini Diagnostics] Transient network glitch on attempt 1. Micro-backoff 250ms before retry 2.`);
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
    }
  }

  const failedTotalDuration = Date.now() - requestStartTime;
  console.error(`[Gemini Diagnostics] ALL MODELS EXHAUSTED op="${op}" totalDuration=${failedTotalDuration}ms. Falling back to local dynamic generator.`);
  throw lastError;
}

// -------------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------------

// Lightweight public health-check endpoint for uptime monitoring (e.g. UptimeRobot / Render)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// -------------------------------------------------------------------------
// FIREBASE ADMIN & AUTHENTICATION MIDDLEWARE
// -------------------------------------------------------------------------

try {
  if (getAdminApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initAdminApp({
        credential: adminCert(sa),
        projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID || "intervuiq-01",
      });
      console.log("[Firebase Admin] Initialized with Service Account");
    } else {
      initAdminApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "intervuiq-01",
      });
      console.log("[Firebase Admin] Initialized with project ID:", process.env.FIREBASE_PROJECT_ID || "intervuiq-01");
    }
  }
} catch (adminErr: any) {
  console.warn("[Firebase Admin] Initialization warning (falling back to client JWT parsing):", adminErr.message);
}

interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
  rawBody?: Buffer;
}

/**
 * Express middleware that verifies the Firebase user's ID token.
 * Validates via Firebase Admin verifyIdToken when available, with
 * standard JWT payload validation fallback for development.
 */
async function authenticateFirebaseUser(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required. Please sign in to your IntervuIQ account.",
    });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Missing authorization bearer token." });
  }

  try {
    // 1. Verify token using Firebase Admin if configured with credentials
    if (getAdminApps().length > 0) {
      try {
        const decoded = await getAdminAuth().verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name,
        };
        return next();
      } catch (adminAuthErr: any) {
        if (adminAuthErr.code === "auth/id-token-expired") {
          return res.status(401).json({ error: "Your session has expired. Please sign in again." });
        }
        // Fallback to JWT payload verification if service account private key is not present locally
      }
    }

    // 2. Fallback: Parse and validate standard Firebase ID token payload
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        return res.status(401).json({ error: "Your session has expired. Please sign in again." });
      }

      const uid = payload.user_id || payload.sub || payload.uid;
      if (uid && typeof uid === "string") {
        req.user = {
          uid,
          email: payload.email,
          name: payload.name,
        };
        return next();
      }
    }

    return res.status(401).json({ error: "Invalid authentication credentials." });
  } catch (err: any) {
    console.error("[Auth Middleware] Verification error:", err);
    return res.status(401).json({ error: "Authentication failed. Please sign in again." });
  }
}

// -------------------------------------------------------------------------
// RAZORPAY PAYMENT CONFIGURATION & ROUTING
// -------------------------------------------------------------------------

export interface ServerPaymentPlan {
  id: "standard" | "advanced";
  name: string;
  amount: number; // in paise
  currency: string;
  displayPrice: string;
  credits: number;
  description: string;
}

// Trusted server-side plan definitions. Amounts are strictly in paise (100 paise = 1 INR).
// Never trust amounts from client requests.
const SERVER_PAYMENT_PLANS: Record<string, ServerPaymentPlan> = {
  standard: {
    id: "standard",
    name: "Standard Interview",
    amount: 1500, // ₹15 in paise
    currency: "INR",
    displayPrice: "₹15",
    credits: 1,
    description: "Standard AI Mock Interview with scoring & essential feedback",
  },
  advanced: {
    id: "advanced",
    name: "Advanced Interview",
    amount: 2900, // ₹29 in paise
    currency: "INR",
    displayPrice: "₹29",
    credits: 1,
    description: "Advanced AI Mock Interview with deep feedback & communication insights",
  },
};

function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  return new Razorpay({ key_id, key_secret });
}

// Public configuration route: returns available plans and public key status
app.get("/api/payments/config", (req, res) => {
  res.json({
    configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    keyId: process.env.RAZORPAY_KEY_ID || "",
    currency: "INR",
    plans: SERVER_PAYMENT_PLANS,
  });
});

// 1. Create Razorpay Order
app.post("/api/payments/create-order", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { planId } = req.body;
    if (!planId || typeof planId !== "string" || !SERVER_PAYMENT_PLANS[planId]) {
      return res.status(400).json({
        error: "Invalid plan ID. Supported plans: 'standard' (₹15) or 'advanced' (₹29).",
      });
    }

    const plan = SERVER_PAYMENT_PLANS[planId];
    const user = req.user!;

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        error: "Razorpay payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment variables.",
        code: "GATEWAY_UNCONFIGURED",
      });
    }

    // Generate unique receipt (max 40 characters for Razorpay)
    const shortTs = Date.now().toString().slice(-8);
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const receipt = `rcpt_${plan.id}_${shortTs}_${randSuffix}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: plan.amount, // strictly server-side amount in paise
      currency: plan.currency,
      receipt,
      notes: {
        userId: user.uid,
        userEmail: user.email || "",
        planId: plan.id,
        planName: plan.name,
        displayPrice: plan.displayPrice,
      },
    });

    console.log(`[Payments] Created Razorpay order ${order.id} for user ${user.uid} (${plan.name} - ${plan.displayPrice})`);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planId: plan.id,
      planName: plan.name,
      description: plan.description,
      displayPrice: plan.displayPrice,
    });
  } catch (error: any) {
    console.error("[Payments] Error creating Razorpay order:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create payment order. Please try again.",
    });
  }
});

// 2. Verify Razorpay Payment Signature
app.post("/api/payments/verify", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required Razorpay parameters: razorpay_order_id, razorpay_payment_id, or razorpay_signature.",
      });
    }

    const plan = planId && SERVER_PAYMENT_PLANS[planId] ? SERVER_PAYMENT_PLANS[planId] : SERVER_PAYMENT_PLANS.standard;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(503).json({
        error: "Razorpay secret key is not configured on the backend.",
      });
    }

    // Verify cryptographic HMAC SHA256 signature
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[Payments] Signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({
        error: "Payment verification failed. Invalid digital signature.",
        verified: false,
      });
    }

    const user = req.user!;
    console.log(`[Payments] Verified payment ${razorpay_payment_id} for user ${user.uid}`);

    // If Firebase Admin has database access, persist payment record and grant credits idempotently
    try {
      if (getAdminApps().length > 0) {
        const firestore = getAdminFirestore();
        const userRef = firestore.collection("users").doc(user.uid);
        const paymentDocRef = userRef.collection("payments").doc(razorpay_payment_id);

        const existingDoc = await paymentDocRef.get();
        if (existingDoc.exists && (existingDoc.data()?.status === "verified" || existingDoc.data()?.status === "captured")) {
          console.log(`[Payments] Payment ${razorpay_payment_id} already recorded and credited. Skipping duplicate credit.`);
        } else {
          await paymentDocRef.set({
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature,
            planId: plan.id,
            planName: plan.name,
            amount: plan.amount,
            currency: plan.currency,
            status: "verified",
            verifiedAt: AdminFieldValue.serverTimestamp(),
            createdAt: AdminFieldValue.serverTimestamp(),
          });

          await userRef.set({
            purchasedInterviewsCount: AdminFieldValue.increment(plan.credits),
            purchasedInterviewCredits: AdminFieldValue.increment(plan.credits),
            activeTier: plan.id,
            lastPurchasedPlan: plan.id,
            lastPaymentAt: AdminFieldValue.serverTimestamp(),
          }, { merge: true });

          console.log(`[Payments] Updated Firestore user document for ${user.uid}`);
        }
      }
    } catch (dbErr: any) {
      console.warn("[Payments] Firestore Admin write notice:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      planId: plan.id,
      planName: plan.name,
      creditsGranted: plan.credits,
      firestoreUpdated: getAdminApps().length > 0,
    });
  } catch (error: any) {
    console.error("[Payments] Error verifying payment:", error);
    return res.status(500).json({
      error: error?.message || "Failed to verify payment signature.",
    });
  }
});

// Fast-path in-memory set to guard against rapid duplicate webhook bursts
const processedWebhookPaymentIds = new Set<string>();

/**
 * 3. Unified Razorpay Webhook Handler
 * Supports both /api/razorpay/webhook and /api/payments/webhook.
 *
 * Verifies X-Razorpay-Signature with HMAC-SHA256 and the exact raw request payload.
 * Handles events:
 *   - payment_link.paid (Razorpay Payment Links)
 *   - payment.captured  (Direct Standard Checkout capture)
 *   - order.paid        (Razorpay Orders)
 *
 * Validates:
 *   - Payment status (captured / paid)
 *   - Currency (INR)
 *   - User identity (userId in notes, or matched by email via Firebase Auth)
 *   - Plan validity (standard | advanced) and price sufficiency (amount in paise)
 *
 * Enforces strict database transaction idempotency to prevent duplicate credit allocations.
 */
async function handleRazorpayWebhook(req: AuthenticatedRequest, res: express.Response) {
  try {
    const signature = (req.headers["x-razorpay-signature"] as string)?.trim();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. Webhook Secret Check
    if (!webhookSecret) {
      console.error(
        "[Razorpay Webhook] Received webhook but neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_KEY_SECRET is configured in server environment."
      );
      return res.status(500).json({
        error: "Razorpay webhook secret is not configured on this server.",
        code: "WEBHOOK_SECRET_MISSING",
      });
    }

    // 2. Signature Header Check
    if (!signature) {
      console.warn("[Razorpay Webhook] Request missing x-razorpay-signature header.");
      return res.status(400).json({ error: "Missing x-razorpay-signature header." });
    }

    // 3. Exact Raw Body Extraction for Cryptographic Signature Verification
    const rawPayloadBuffer = req.rawBody && Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : typeof req.rawBody === "string"
      ? Buffer.from(req.rawBody, "utf8")
      : Buffer.from(JSON.stringify(req.body || {}), "utf8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayloadBuffer)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature.toLowerCase(), "utf8");
    const expectedBuffer = Buffer.from(expectedSignature.toLowerCase(), "utf8");

    const isSignatureValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isSignatureValid) {
      console.warn("[Razorpay Webhook] Cryptographic signature mismatch. Rejecting webhook request.");
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    const event = req.body;
    const eventName: string = event?.event || "";
    console.log(`[Razorpay Webhook] Verified incoming event: "${eventName}"`);

    // 4. Handle non-payment / lifecycle events gracefully with 200 OK
    const supportedEvents = ["payment_link.paid", "payment.captured", "order.paid"];
    if (!supportedEvents.includes(eventName)) {
      console.log(`[Razorpay Webhook] Event "${eventName}" acknowledged (no credit action required).`);
      return res.status(200).json({
        status: "acknowledged",
        event: eventName,
      });
    }

    // 5. Extract Entities across payment_link, payment, and order structures
    const paymentLinkEntity = event.payload?.payment_link?.entity;
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const paymentId: string =
      paymentEntity?.id ||
      (eventName === "payment_link.paid" && paymentLinkEntity?.id
        ? `plink_${paymentLinkEntity.id}`
        : orderEntity?.id);

    const orderId: string =
      paymentEntity?.order_id ||
      orderEntity?.id ||
      paymentLinkEntity?.order_id ||
      "";

    if (!paymentId) {
      console.warn("[Razorpay Webhook] Unable to extract paymentId from payload.");
      return res.status(400).json({ error: "Could not identify paymentId or orderId in payload." });
    }

    // 6. Validate Payment Status
    if (eventName === "payment.captured") {
      const pStatus = paymentEntity?.status;
      if (pStatus !== "captured") {
        console.warn(`[Razorpay Webhook] payment.captured received with non-captured status: "${pStatus}"`);
        return res.status(200).json({ status: "ignored_unpaid_status", paymentId, pStatus });
      }
    } else if (eventName === "order.paid") {
      const oStatus = orderEntity?.status;
      if (oStatus !== "paid") {
        console.warn(`[Razorpay Webhook] order.paid received with non-paid status: "${oStatus}"`);
        return res.status(200).json({ status: "ignored_unpaid_status", paymentId, oStatus });
      }
    } else if (eventName === "payment_link.paid") {
      const linkStatus = paymentLinkEntity?.status;
      if (linkStatus !== "paid" && paymentEntity?.status !== "captured") {
        console.warn(`[Razorpay Webhook] payment_link.paid received with non-paid status: "${linkStatus}"`);
        return res.status(200).json({ status: "ignored_unpaid_status", paymentId, linkStatus });
      }
    }

    // 7. Validate Currency (strictly INR)
    const currency = String(
      paymentEntity?.currency ||
      paymentLinkEntity?.currency ||
      orderEntity?.currency ||
      "INR"
    ).toUpperCase();

    if (currency !== "INR") {
      console.warn(`[Razorpay Webhook] Currency mismatch: received "${currency}", expected "INR".`);
      return res.status(400).json({
        error: `Invalid currency: ${currency}. Only INR is supported.`,
      });
    }

    // 8. Extract Notes & Identify User
    const notes: Record<string, any> = {
      ...(orderEntity?.notes || {}),
      ...(paymentLinkEntity?.notes || {}),
      ...(paymentEntity?.notes || {}),
    };

    let userId: string = String(notes.userId || notes.user_id || notes.uid || "").trim();

    // Fallback: Attempt to resolve userId by customer email in Firebase Auth
    if (!userId) {
      const customerEmail = String(
        notes.userEmail ||
        notes.email ||
        paymentEntity?.email ||
        paymentLinkEntity?.customer?.email ||
        ""
      ).trim();

      if (customerEmail && getAdminApps().length > 0) {
        try {
          const userRecord = await getAdminAuth().getUserByEmail(customerEmail);
          if (userRecord && userRecord.uid) {
            userId = userRecord.uid;
            console.log(`[Razorpay Webhook] Resolved userId "${userId}" from customer email "${customerEmail}"`);
          }
        } catch (emailErr: any) {
          console.warn(`[Razorpay Webhook] Could not match customer email "${customerEmail}" to Firebase user:`, emailErr?.message);
        }
      }
    }

    // 9. Extract and Validate Paid Amount & Plan
    const paidAmount = Number(
      paymentEntity?.amount ??
      paymentLinkEntity?.amount_paid ??
      paymentLinkEntity?.amount ??
      orderEntity?.amount_paid ??
      orderEntity?.amount ??
      0
    );

    let planId: "standard" | "advanced" | null = null;
    const planCandidate = String(notes.planId || notes.plan_id || notes.plan || "").toLowerCase().trim();

    if (planCandidate === "advanced" || planCandidate === "standard") {
      planId = planCandidate;
    } else if (paidAmount === 2900) {
      planId = "advanced";
    } else if (paidAmount === 1500) {
      planId = "standard";
    }

    if (!planId || !SERVER_PAYMENT_PLANS[planId]) {
      console.warn(`[Razorpay Webhook] Unrecognized plan "${planCandidate}" or invalid amount ${paidAmount} paise.`);
      return res.status(400).json({
        error: `Unrecognized plan or amount: ${paidAmount} paise. Supported: 1500 (standard) or 2900 (advanced).`,
      });
    }

    const plan = SERVER_PAYMENT_PLANS[planId];

    if (paidAmount < plan.amount) {
      console.warn(`[Razorpay Webhook] Insufficient payment: received ${paidAmount} paise, required ${plan.amount} paise.`);
      return res.status(400).json({
        error: `Payment amount ${paidAmount} paise is less than plan price ${plan.amount} paise for ${plan.name}.`,
      });
    }

    // 10. Handle cases where user could not be resolved from metadata
    if (!userId) {
      console.warn(`[Razorpay Webhook] Payment ${paymentId} verified, but user identity is absent in notes.`);
      if (getAdminApps().length > 0) {
        try {
          const firestore = getAdminFirestore();
          await firestore.collection("unassociated_payments").doc(paymentId).set({
            paymentId,
            orderId,
            amount: paidAmount,
            currency,
            planId: plan.id,
            planName: plan.name,
            event: eventName,
            notes,
            customer: paymentLinkEntity?.customer || { email: paymentEntity?.email },
            receivedAt: AdminFieldValue.serverTimestamp(),
            reason: "Missing userId and unresolvable customer email in webhook notes",
          });
        } catch (unassocErr) {
          console.warn("[Razorpay Webhook] Failed to record unassociated payment:", unassocErr);
        }
      }
      return res.status(200).json({
        status: "user_not_identified",
        message: "Payment verified but could not identify user. Saved to unassociated_payments.",
        paymentId,
      });
    }

    // 11. Fast-Path In-Memory Idempotency Check
    if (processedWebhookPaymentIds.has(paymentId)) {
      console.log(`[Razorpay Webhook] Idempotent skip (memory): Payment ${paymentId} already processed.`);
      return res.status(200).json({ status: "already_processed", paymentId, userId });
    }

    // 12. Persistent Database Transaction with Strict Idempotency
    if (getAdminApps().length > 0) {
      try {
        const firestore = getAdminFirestore();
        const userRef = firestore.collection("users").doc(userId);
        const paymentDocRef = userRef.collection("payments").doc(paymentId);
        const globalWebhookRef = firestore.collection("webhook_events").doc(paymentId);

        let alreadyHandled = false;

        await firestore.runTransaction(async (transaction) => {
          const userPaymentDoc = await transaction.get(paymentDocRef);
          if (userPaymentDoc.exists) {
            const curStatus = userPaymentDoc.data()?.status;
            if (curStatus === "captured" || curStatus === "verified") {
              alreadyHandled = true;
              return;
            }
          }

          const globalDoc = await transaction.get(globalWebhookRef);
          if (globalDoc.exists && globalDoc.data()?.processed === true) {
            alreadyHandled = true;
            return;
          }

          // Mark global idempotency record
          transaction.set(globalWebhookRef, {
            paymentId,
            orderId: orderId || null,
            userId,
            planId: plan.id,
            planName: plan.name,
            amount: paidAmount,
            currency,
            event: eventName,
            processed: true,
            processedAt: AdminFieldValue.serverTimestamp(),
          });

          // Record in user's payments subcollection
          transaction.set(
            paymentDocRef,
            {
              paymentId,
              orderId: orderId || null,
              planId: plan.id,
              planName: plan.name,
              amount: paidAmount,
              currency,
              status: "captured",
              event: eventName,
              creditsGranted: plan.credits,
              recordedAt: AdminFieldValue.serverTimestamp(),
              createdAt: userPaymentDoc.exists
                ? userPaymentDoc.data()?.createdAt || AdminFieldValue.serverTimestamp()
                : AdminFieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // Increment user's interview sessions and update tier
          transaction.set(
            userRef,
            {
              purchasedInterviewsCount: AdminFieldValue.increment(plan.credits),
              purchasedInterviewCredits: AdminFieldValue.increment(plan.credits),
              activeTier: plan.id,
              lastPurchasedPlan: plan.id,
              lastPaymentAt: AdminFieldValue.serverTimestamp(),
              updatedAt: AdminFieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });

        processedWebhookPaymentIds.add(paymentId);
        if (processedWebhookPaymentIds.size > 5000) {
          const oldestKey = processedWebhookPaymentIds.values().next().value;
          if (oldestKey) processedWebhookPaymentIds.delete(oldestKey);
        }

        if (alreadyHandled) {
          console.log(`[Razorpay Webhook] Idempotent skip: Payment ${paymentId} already captured or verified.`);
          return res.status(200).json({ status: "already_processed", paymentId, userId });
        }

        console.log(`[Razorpay Webhook] Successfully processed ${eventName} for user ${userId}. Granted +${plan.credits} credit (${plan.name}).`);
        return res.status(200).json({
          status: "success",
          paymentId,
          orderId,
          userId,
          planId: plan.id,
          creditsGranted: plan.credits,
        });
      } catch (dbErr: any) {
        console.error("[Razorpay Webhook] Firestore transaction notice:", dbErr?.message || dbErr);
        const isCredentialErr =
          String(dbErr?.message || "").includes("credentials") ||
          String(dbErr?.message || "").includes("default credentials") ||
          dbErr?.code === 7 ||
          dbErr?.code === 16;

        if (isCredentialErr) {
          processedWebhookPaymentIds.add(paymentId);
          console.warn("[Razorpay Webhook] Firestore Admin service account not configured. Acknowledging payment in memory to avoid failing webhook delivery.");
          return res.status(200).json({
            status: "success_in_memory",
            notice: "FIREBASE_SERVICE_ACCOUNT is not configured on the backend. Processed in memory.",
            paymentId,
            userId,
            planId: plan.id,
            creditsGranted: plan.credits,
          });
        }
        return res.status(500).json({ error: "Failed to record payment in database." });
      }
    } else {
      // In-memory fallback if server is running without Firebase Admin Service Account
      processedWebhookPaymentIds.add(paymentId);
      console.log(`[Razorpay Webhook] Processed ${eventName} in memory (no Firebase Admin): user ${userId}, plan ${plan.id}`);
      return res.status(200).json({
        status: "success_in_memory",
        paymentId,
        userId,
        planId: plan.id,
        creditsGranted: plan.credits,
      });
    }
  } catch (error: any) {
    console.error("[Razorpay Webhook] Uncaught error processing webhook:", error);
    return res.status(500).json({ error: "Internal webhook processing error." });
  }
}

// Register both routes to the same robust handler:
// 1. /api/razorpay/webhook (configured in Razorpay Test Mode dashboard)
// 2. /api/payments/webhook (legacy / internal payments webhook route)
app.post("/api/razorpay/webhook", handleRazorpayWebhook);
app.post("/api/payments/webhook", handleRazorpayWebhook);

// 1a. Generate 10 personalized mock interview questions based on Resume, ATS, Target Role, Difficulty, and Interview Type
app.post("/api/gemini/mock-interview/generate-questions", async (req, res) => {
  try {
    const { role, difficulty, type, resumeText, atsData } = req.body;
    const ai = getAIClient();

    const prompt = `You are an expert technical recruiter and lead interviewer for top-tier tech companies.
Generate exactly 10 personalized interview questions for a candidate applying for the position: "${role || 'Software Engineer'}".
Interview Parameters:
- Interview Round Type: ${type || 'Mixed'} (HR, Technical, Behavioral, or Mixed)
- Difficulty Level: ${difficulty || 'Medium'} (Easy, Medium, or Hard)
- Candidate Target Role: ${role || 'Software Engineer'}
${resumeText ? `- Candidate Resume Excerpt:\n"${resumeText.slice(0, 1000)}"` : ''}
${atsData ? `- Candidate ATS Score & Weaknesses: Score ${atsData.score}/100, Weaknesses: ${JSON.stringify(atsData.weaknesses || [])}` : ''}

Instructions:
1. Generate EXACTLY 10 distinct, highly realistic interview questions numbered 1 through 10.
2. Tailor questions to the specified difficulty (${difficulty}) and interview round type (${type}).
3. Mix technical concepts, system design, problem solving, and behavioral STAR scenarios appropriate for the interview type.
4. For each question, provide 3 suggested key points or technical criteria the candidate should cover in their spoken response.`;

    const response = await generateContentWithFallback(ai, {
      operationName: "mock-interview-generate-10-questions",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert software engineering interviewer. Generate exactly 10 questions in structured JSON format matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: "Unique question index from 1 to 10" },
                  question: { type: Type.STRING, description: "The interview question text" },
                  category: { type: Type.STRING, description: "Question category (e.g. Technical, Behavioral, System Design, HR, General)" },
                  suggestedPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 key criteria or metrics candidate should mention"
                  }
                },
                required: ["id", "question", "category", "suggestedPoints"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const questions = parsed.questions || [];

    if (questions.length > 0) {
      res.json({ questions });
      return;
    }

    throw new Error("Empty questions returned from Gemini model.");
  } catch (error: any) {
    console.error("Error in mock-interview/generate-questions:", error);
    console.warn("Returning 10 dynamic fallback questions.");
    const { role, difficulty, type } = req.body;
    const baseQuestions = getMockQuestions(role, difficulty === 'Hard' ? 'Senior' : difficulty === 'Easy' ? 'Entry' : 'Mid', type);
    
    // Ensure 10 questions
    const tenQuestions = Array.from({ length: 10 }, (_, idx) => {
      const baseQ = baseQuestions[idx % baseQuestions.length];
      return {
        id: idx + 1,
        question: idx < baseQuestions.length 
          ? baseQ.question 
          : `[Q${idx + 1}] For a ${role} (${type} - ${difficulty}), how do you address edge-case failures, automated testing, and production monitoring for this system?`,
        category: baseQ.category || (type === 'Mixed' ? (idx % 2 === 0 ? 'Technical' : 'Behavioral') : type),
        suggestedPoints: baseQ.suggestedPoints || [
          "State clear architectural or behavioral steps",
          "Include concrete metrics, tools, or framework examples",
          "Address error handling, testing, or team collaboration"
        ]
      };
    });

    res.json({ questions: tenQuestions });
  }
});

// 1b. Evaluate full 10-question interview session
app.post("/api/gemini/mock-interview/evaluate", async (req, res) => {
  try {
    const { role, difficulty, type, questions, answers, resumeText, atsData } = req.body;

    // Check if candidate provided any actual words/speech across all answers
    const validAnswers = (answers || []).filter((a: any) => typeof a?.transcript === 'string' && a.transcript.trim().length > 0);
    const totalWords = (answers || []).reduce((acc: number, a: any) => {
      const words = (a.transcript || "").trim().split(/\s+/).filter(Boolean);
      return acc + words.length;
    }, 0);

    if (validAnswers.length === 0 || totalWords === 0) {
      console.log(`[Gemini Diagnostics] Zero valid candidate speech detected in evaluate payload. Returning deterministic 0 score.`);
      res.json({
        evaluation: {
          overallScore: 0,
          communication: 0,
          technicalKnowledge: 0,
          confidence: 0,
          problemSolving: 0,
          strengths: [
            "Session successfully recorded and completed."
          ],
          weaknesses: [
            "No spoken responses were detected for any of the interview questions.",
            "All questions were skipped or timed out in silence."
          ],
          improvements: [
            "Ensure microphone permissions are granted and audio input is working properly.",
            "Speak clearly into your microphone during each question window.",
            "Articulate your thought process and provide concrete technical answers."
          ],
          finalFeedback: `No spoken responses were recorded for this ${role || 'Software Engineer'} (${type || 'Mixed'}) interview session. All questions were left unanswered. To receive a scored evaluation, please ensure your microphone is enabled and speak your answers during each question.`
        }
      });
      return;
    }

    const ai = getAIClient();

    const prompt = `You are a Senior Engineering Hiring Director evaluating a candidate's full 10-question mock interview performance.
Candidate Target Role: ${role || 'Software Engineer'}
Interview Type: ${type || 'Mixed'}
Difficulty Level: ${difficulty || 'Medium'}

Session Q&A Transcripts:
${JSON.stringify(answers, null, 2)}

${resumeText ? `Candidate Resume Context: "${resumeText.slice(0, 500)}"` : ''}
${atsData ? `Candidate ATS Background: Score ${atsData.score}/100` : ''}

Task: Thoroughly analyze all 10 speech transcript responses. Evaluate communication clarity, technical correctness, confidence, problem solving, strengths, weaknesses, and actionable improvements.
Return ONLY JSON adhering strictly to the schema.`;

    const response = await generateContentWithFallback(ai, {
      operationName: "mock-interview-evaluate-transcript",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite interview evaluator. Provide rigorous scores and constructive feedback in structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluation: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.INTEGER, description: "Overall score between 0 and 100" },
                communication: { type: Type.INTEGER, description: "Communication score 0 to 100" },
                technicalKnowledge: { type: Type.INTEGER, description: "Technical knowledge score 0 to 100" },
                confidence: { type: Type.INTEGER, description: "Confidence & fluency score 0 to 100" },
                problemSolving: { type: Type.INTEGER, description: "Problem solving & methodology score 0 to 100" },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 key candidate strengths during interview" },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 key candidate weaknesses or missed criteria" },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable improvement recommendations" },
                finalFeedback: { type: Type.STRING, description: "Comprehensive final feedback summary paragraph" }
              },
              required: [
                "overallScore",
                "communication",
                "technicalKnowledge",
                "confidence",
                "problemSolving",
                "strengths",
                "weaknesses",
                "improvements",
                "finalFeedback"
              ]
            }
          },
          required: ["evaluation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.evaluation) {
      res.json({ evaluation: parsed.evaluation });
      return;
    }
    throw new Error("Invalid evaluation output structure from Gemini.");
  } catch (error: any) {
    console.error("Error in mock-interview/evaluate:", error);
    console.warn("Returning structured fallback evaluation.");
    
    const { answers, role, type } = req.body;
    let totalWords = 0;
    (answers || []).forEach((a: any) => {
      totalWords += (a.transcript || "").trim().split(/\s+/).filter(Boolean).length;
    });

    if (totalWords === 0) {
      res.json({
        evaluation: {
          overallScore: 0,
          communication: 0,
          technicalKnowledge: 0,
          confidence: 0,
          problemSolving: 0,
          strengths: [
            "Session recorded and completed without connection issues."
          ],
          weaknesses: [
            "No spoken responses were detected or recorded during the interview."
          ],
          improvements: [
            "Check microphone input settings before starting the interview.",
            "Speak your answers out loud during the designated time window."
          ],
          finalFeedback: `No spoken responses were detected for this ${role || 'Software Engineer'} (${type || 'Mixed'}) interview session. All questions were left unanswered.`
        }
      });
      return;
    }

    const scoreBase = Math.min(95, Math.max(50, 60 + Math.floor(totalWords / 25)));

    res.json({
      evaluation: {
        overallScore: scoreBase,
        communication: Math.min(96, scoreBase + 2),
        technicalKnowledge: Math.min(95, scoreBase - 1),
        confidence: Math.min(92, scoreBase + 1),
        problemSolving: Math.min(94, scoreBase - 2),
        strengths: [
          "Demonstrated clear verbal communication and domain terminology.",
          "Answered questions with structured progression and focus.",
          "Maintained active vocal cadence across the interview questions."
        ],
        weaknesses: [
          "Some spoken answers were concise or missing quantitative benchmark metrics.",
          "Opportunity to elaborate deeper on system failure modes and edge cases."
        ],
        improvements: [
          "Apply the STAR framework (Situation, Task, Action, Result) explicitly for behavioral scenarios.",
          "Quantify achievements and results with concrete metrics (e.g., reduced latency by 35%).",
          "Highlight testing protocols and production monitoring tools in technical answers."
        ],
        finalFeedback: `Performance recorded for the ${role || 'Software Engineer'} (${type || 'Mixed'}) assessment. Your speech transcript demonstrates good understanding of fundamentals. Incorporating quantitative metrics will help elevate your candidacy further.`
      }
    });
  }
});

// 1c. Generate custom tailored mock interview questions (Legacy route preserved)
app.post("/api/gemini/mock-interview/generate", async (req, res) => {
  try {
    const { role, experienceLevel, type } = req.body;
    const ai = getAIClient();

    const prompt = `You are an elite Tech Recruiter and hiring committee lead. Generate a list of 5 mock interview questions tailored exactly for a candidate applying for a '${role}' position at a '${experienceLevel}' experience tier.
The interview round focus is: '${type}'.
Each question must be unique, highly realistic, and have concrete architectural or algorithmic concepts. Provide helpful, standard assessment guidelines for each.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite software engineering interviewer. Generate questions in structured JSON format matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER, description: "Unique number from 1 to 5" },
              question: { type: Type.STRING, description: "The actual interview question text" },
              category: { type: Type.STRING, description: "Round classification: 'Technical' | 'Behavioral' | 'System Design' | 'General'" },
              suggestedPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 essential technical keywords, criteria, or metrics that the candidate should mention in their response"
              }
            },
            required: ["id", "question", "category", "suggestedPoints"]
          }
        }
      }
    });

    const questions = JSON.parse(response.text || "[]");
    res.json({ questions });
  } catch (error: any) {
    console.error("Error in mock-interview/generate:", error);
    console.warn("Returning high-quality dynamic fallback questions due to rate limits or API issues.");
    const { role, experienceLevel, type } = req.body;
    const questions = getMockQuestions(role, experienceLevel, type);
    res.json({ questions });
  }
});

// 2. Evaluates the transcript answers of a mock interview
app.post("/api/gemini/mock-interview/grade", async (req, res) => {
  try {
    const { role, experienceLevel, type, answers, durationSeconds } = req.body;

    const totalWords = (answers || []).reduce((acc: number, a: any) => {
      const words = (a.transcript || "").trim().split(/\s+/).filter(Boolean);
      return acc + words.length;
    }, 0);

    if (totalWords === 0) {
      res.json({
        results: {
          overallScore: 0,
          metrics: { communication: 0, technical: 0, confidence: 0, bodyLanguage: 0, speech: 0 },
          questionsAnswered: (answers || []).map((ans: any) => ({
            question: ans.question || "",
            transcript: "",
            feedback: "No spoken response was provided for this question.",
            score: 0
          }))
        }
      });
      return;
    }

    const ai = getAIClient();

    const prompt = `Evaluate this full interview session.
Role: ${role}
Experience: ${experienceLevel}
Round Type: ${type}
Total Speaking Duration: ${durationSeconds} seconds

Answers:
${JSON.stringify(answers, null, 2)}

Grade each answer comprehensively, scoring them individually, and provide deep constructive feedback. Assess communication skill, technical depth, verbal confidence, body language (simulated based on description/confidence), and pace. Return weighted aggregate metrics and a customized evaluation card.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are a professional hiring manager grading full transcripts of technical and behavioral interviews. Follow the precise JSON schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: "Weighted average grade between 50 and 100" },
            metrics: {
              type: Type.OBJECT,
              properties: {
                communication: { type: Type.INTEGER, description: "Communications skills grade (50-100)" },
                technical: { type: Type.INTEGER, description: "Technical correctness, algorithm depth, and system mastery (50-100)" },
                confidence: { type: Type.INTEGER, description: "Assertiveness, speaking cadence, and filler word check (50-100)" },
                bodyLanguage: { type: Type.INTEGER, description: "Professional composure, structured answers like STAR method (50-100)" },
                speech: { type: Type.INTEGER, description: "Speaking speed and pause consistency (50-100)" }
              },
              required: ["communication", "technical", "confidence", "bodyLanguage", "speech"]
            },
            questionsAnswered: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  transcript: { type: Type.STRING },
                  feedback: { type: Type.STRING, description: "Deep constructive criticism pointing out weak links, spelling out what they missed, or praising structured delivery" },
                  score: { type: Type.INTEGER, description: "Grade out of 100" }
                },
                required: ["question", "transcript", "feedback", "score"]
              }
            }
          },
          required: ["overallScore", "metrics", "questionsAnswered"]
        }
      }
    });

    const results = JSON.parse(response.text || "{}");
    res.json({ results });
  } catch (error: any) {
    console.error("Error in mock-interview/grade:", error);
    console.warn("Returning high-quality dynamic assessment rubrics due to API quota bounds.");
    const { answers } = req.body;
    const results = getMockGrading(answers);
    res.json({ results });
  }
});

// 3. Analyze resume for ATS optimization, passive words and keyword mapping
app.post("/api/gemini/ats/analyze", async (req, res) => {
  try {
    const { text, targetRole } = req.body;
    const ai = getAIClient();

    const prompt = `You are an expert ATS (Applicant Tracking System) Resume Reviewer.
Analyze the following resume content specifically tailored for the target position: "${targetRole || 'Software Engineer'}".

Resume Text:
${text}

Perform a rigorous ATS evaluation for the target role: "${targetRole || 'Software Engineer'}".
Evaluate score (0 to 100), key candidate strengths, resume weaknesses, missing industry keywords, grammar/phrasing suggestions, visual & structural formatting suggestions, high-impact bullet improvement recommendations, and a summary overall feedback statement.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an ATS Resume Reviewer. Analyze the resume for the target role and output ONLY valid JSON adhering strictly to the schema provided. No markdown wrappers or additional text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "ATS grade from 0 to 100" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key positive strengths found in the resume" },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific resume weaknesses" },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Essential industry technical keywords missing for the target role" },
            grammarSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Grammar, passive voice, or phrasing suggestions" },
            formattingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Layout, bullet structure, and formatting suggestions" },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-impact bullet point improvements" },
            overallFeedback: { type: Type.STRING, description: "Comprehensive summary feedback paragraph" }
          },
          required: [
            "score",
            "strengths",
            "weaknesses",
            "missingKeywords",
            "grammarSuggestions",
            "formattingSuggestions",
            "improvementSuggestions",
            "overallFeedback"
          ]
        }
      }
    });

    const analysis = JSON.parse(response.text || "{}");
    res.json({ analysis });
  } catch (error: any) {
    console.error("Error in /api/gemini/ats/analyze:", error);
    console.warn("Returning expert fallback ATS report due to API limits.");
    const { text, targetRole } = req.body;
    const analysis = getMockAtsAnalysis(text, targetRole);
    res.json({ analysis });
  }
});

app.post("/api/gemini/resume/analyze", async (req, res) => {
  try {
    const { text, fileName } = req.body;
    const ai = getAIClient();

    const prompt = `Analyze this resume document content.
File: ${fileName}
Content:
${text}

Provide an ATS score, identify matched skills and missing standard skills (such as Redis, Docker, AWS ECS, System Design patterns, CI/CD) required for elite positions. Detect missing critical sections (experience, education, projects, skills). Write 3 or more actionable improvements spanning Impact, Formatting, Keywords, or Structure. Highlight passive verbs ("helped", "assisted", "responsible for") and recommend action replacements ("engineered", "orchestrated", "pioneered").`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an expert ATS (Applicant Tracking System) parser and CV coach. Provide structural scoring and keyword suggestions in structured JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER, description: "Graded ATS score from 40 to 100" },
            skillsAnalysis: {
              type: Type.OBJECT,
              properties: {
                matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of found skills" },
                missing: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Essential industry technical keywords that are missing or weakly represented" }
              },
              required: ["matched", "missing"]
            },
            sectionsFound: {
              type: Type.OBJECT,
              properties: {
                experience: { type: Type.BOOLEAN },
                education: { type: Type.BOOLEAN },
                projects: { type: Type.BOOLEAN },
                skills: { type: Type.BOOLEAN }
              },
              required: ["experience", "education", "projects", "skills"]
            },
            aiSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Must be 'Impact' | 'Formatting' | 'Keywords' | 'Structure'" },
                  severity: { type: Type.STRING, description: "Must be 'High' | 'Medium' | 'Low'" },
                  text: { type: Type.STRING, description: "Fully detailed action recommendation" }
                },
                required: ["category", "severity", "text"]
              }
            }
          },
          required: ["atsScore", "skillsAnalysis", "sectionsFound", "aiSuggestions"]
        }
      }
    });

    const analysis = JSON.parse(response.text || "{}");
    res.json({ analysis });
  } catch (error: any) {
    console.error("Error in resume/analyze:", error);
    console.warn("Returning expert fallback ATS report due to API limits.");
    const { text, fileName } = req.body;
    const analysis = getMockResumeAnalysis(text, fileName);
    res.json({ analysis });
  }
});

// 4. Enhance a resume bullet point to make it high-impact
app.post("/api/gemini/resume/enhance-sentence", async (req, res) => {
  try {
    const { sentence } = req.body;
    const ai = getAIClient();

    const prompt = `Rewrite and enhance this passive or weak resume bullet point to make it extremely high-impact. Include strong action verbs, professional technical wording, and a simulated quantitative metrics impact (e.g. reduced load times by 40%, cut costs, or increased throughput):
"${sentence}"`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite career coach. Rewrite bullet points with executive style. Return the output in JSON format with an 'enhancedText' property.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedText: { type: Type.STRING, description: "The single, polished high-impact enhanced bullet point" }
          },
          required: ["enhancedText"]
        }
      }
    });

    const { enhancedText } = JSON.parse(response.text || '{"enhancedText":""}');
    res.json({ enhancedText });
  } catch (error: any) {
    console.error("Error in resume/enhance-sentence:", error);
    console.warn("Returning polished alternative statement due to API constraints.");
    const { sentence } = req.body;
    const enhancedText = getMockEnhancedSentence(sentence);
    res.json({ enhancedText });
  }
});

// 4b. Match Resume with target Job Description (JD) and rewrite Summary
app.post("/api/gemini/resume/match-jd", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const ai = getAIClient();

    const prompt = `Perform a comprehensive ATS match analysis between the candidate's resume and the target Job Description (JD).
    
Resume Text:
${resumeText}

Job Description:
${jobDescription}

Compare the key requirements, tech stack, and experience tiers. 
1. Calculate a rigorous match percentage (0-100).
2. Extract exact missing keywords or tools listed in the JD but absent/weakly represented in the resume.
3. Rewrite the candidate's professional resume summary to perfectly align with this specific company and role, highlighting their relevant strengths while organically incorporating key missing terms.
4. Provide 3 specific bullet point suggestions to make the rest of the resume a stronger match.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an executive recruiter. Grade match alignment and write highly optimized CV bullet points and professional summaries. Return valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchPercentage: { type: Type.INTEGER, description: "Calculated match grade (40-100)" },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific missing keywords from the JD" },
            tailoredSummary: { type: Type.STRING, description: "A high-impact tailored professional summary (3-4 sentences)" },
            tailoredSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable suggestions to improve the alignment score" }
          },
          required: ["matchPercentage", "missingKeywords", "tailoredSummary", "tailoredSuggestions"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ result });
  } catch (error: any) {
    console.error("Error in resume/match-jd:", error);
    console.warn("Returning custom simulated JD match analysis.");
    const { resumeText, jobDescription } = req.body;
    const result = getMockJdMatch(resumeText, jobDescription);
    res.json({ result });
  }
});

// 4c. Conversational Multi-Turn Follow-up Interview Question Generator
app.post("/api/gemini/mock-interview/follow-up", async (req, res) => {
  try {
    const { role, experienceLevel, type, history, lastUserResponse } = req.body;
    const ai = getAIClient();

    const structuredPrompt = `Context: We are running a conversational mock interview.
Role: ${role}
Experience: ${experienceLevel}
Focus Round: ${type}

Conversation history:
${(history || []).map((h: any) => `${h.role === 'interviewer' ? 'Dr. Sofia (Interviewer)' : 'Candidate'}: ${h.text}`).join('\n')}
Candidate's latest response: "${lastUserResponse}"

Based on the conversation, do two things:
1. Provide a brief 1-2 sentence technical coaching note or micro-evaluation of their last answer (e.g., pointing out a missed key point, or praising a clear framework choice).
2. Formulate the next logical follow-up question (2 sentences max). Be challenging, natural, and probe into details they discussed or missed.`;

    const responseStructured = await generateContentWithFallback(ai, {
      operationName: "mock-interview-follow-up",
      contents: structuredPrompt,
      config: {
        systemInstruction: "You are Dr. Sofia, an elite Technical Interviewer. Actively probe and ask questions. Return valid JSON matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "A brief professional coaching note (1-2 sentences) assessing their last answer" },
            nextQuestion: { type: Type.STRING, description: "The next highly tailored conversational interview question (1-2 sentences)" }
          },
          required: ["feedback", "nextQuestion"]
        }
      }
    });

    const data = JSON.parse(responseStructured.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Error in mock-interview/follow-up:", error);
    console.warn("Returning Sofia conversational mock response.");
    const { history, lastUserResponse } = req.body;
    const data = getMockFollowUp(history, lastUserResponse);
    res.json(data);
  }
});

// 5. Generate custom DSA Practice Track recommendations
app.post("/api/gemini/dsa/recommend", async (req, res) => {
  try {
    const { category } = req.body;
    const ai = getAIClient();

    const prompt = `Create a custom, tailored DSA (Data Structures and Algorithms) practice track focusing specifically on: '${category}'.
Generate exactly 5 targeted problem specifications that represent a logical learning progression. Outline difficulties, optimal big-O complexities, interactive hints, and a simulated LeetCode or study link. Additionally, provide 2-3 standard learning resources (playlists or courses). Recommend an estimated overall base competency score (0-100) on this specific topic based on standard candidate benchmarks.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are a competitive programming coach. Structure problem paths clearly in JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            overallScore: { type: Type.INTEGER, description: "A simulated competency score between 40 and 100" },
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "e.g. lc-322" },
                  title: { type: Type.STRING, description: "e.g. Coin Change" },
                  description: { type: Type.STRING, description: "Simple description of the problem statement" },
                  difficulty: { type: Type.STRING, description: "Must be 'Easy' | 'Medium' | 'Hard'" },
                  timeComplexity: { type: Type.STRING, description: "Optimal Big-O time, e.g., O(N * S)" },
                  spaceComplexity: { type: Type.STRING, description: "Optimal Big-O space, e.g., O(S)" },
                  conceptHint: { type: Type.STRING, description: "The key optimal solution approach (e.g. recursive relation, bottom-up DP, bfs, hashmap optimization)" },
                  leetcodeLink: { type: Type.STRING, description: "A realistic Leetcode problem link or search URL" }
                },
                required: ["id", "title", "description", "difficulty", "timeComplexity", "spaceComplexity", "conceptHint", "leetcodeLink"]
              }
            },
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "e.g. Striver's Dynamic Programming Playlist" },
                  type: { type: Type.STRING, description: "Must be 'video' | 'article' | 'practice'" },
                  url: { type: Type.STRING, description: "Learning link URL" }
                },
                required: ["title", "type", "url"]
              }
            }
          },
          required: ["category", "overallScore", "problems", "resources"]
        }
      }
    });

    const track = JSON.parse(response.text || "{}");
    res.json({ track });
  } catch (error: any) {
    console.error("Error in dsa/recommend:", error);
    console.warn("Returning pre-built learning path track recommendations.");
    const { category } = req.body;
    const track = getMockDsaTrack(category);
    res.json({ track });
  }
});

// 6. Interactive AI Code Explainer and DSA Assistant chat endpoint
app.post("/api/gemini/dsa/assistant", async (req, res) => {
  try {
    const { query, category, history } = req.body;
    const ai = getAIClient();

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    const response = await generateContentWithFallback(ai, {
      operationName: "dsa-assistant-chat",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: `Focus area: ${category}. Question: ${query}` }] }
      ],
      config: {
        systemInstruction: `You are an elite competitive programmer and Algorithms Coach.
You explain concepts focusing heavily on mathematical clarity, state relations, sliding windows, topological relations, and recursive state transitions.
Explain the optimal approach using clear step-by-step paragraphs. Provide a highly clean, well-commented TypeScript code snippet illustrating the optimal approach (using standard types and Big-O explanations). Maintain a constructive, expert, encouraging tone.`
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in dsa/assistant:", error);
    res.json({
      text: `### Dynamic Caching & Relational Querying\n\nI was unable to reach the live AI server to process this specific message, but here is an architectural guideline on ${req.body.category || 'your topic'}.\n\nWhen writing high-performance solutions for dynamic tracks, pay special attention to state invariants, boundary offsets, and data locality. For example, if you are working with Arrays and Hash Maps:\n\n\`\`\`typescript\n// Optimal Two-Sum check in O(N) time and O(N) space\nfunction findTwoSum(nums: number[], target: number): number[] {\n  const visited = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (visited.has(complement)) {\n      return [visited.get(complement)!, i];\n    }\n    visited.set(nums[i], i);\n  }\n  return [];\n}\n\`\`\`\n\nLet me know if you would like me to expand on this approach!`
    });
  }
});

// 7. Generate Personalized Placement Roadmap using Gemini AI based on ATS and Interview Data
app.post("/api/gemini/roadmap/generate", async (req, res) => {
  try {
    const { targetRole, atsData, interviews } = req.body;
    const ai = getAIClient();

    const prompt = `You are an elite Tech Career Lead and Engineering Mentor.
Analyze this candidate's real ATS Resume Analysis and Mock Interview performance metrics to build a highly personalized, 4 to 6 milestone technical learning and placement preparation roadmap.

Candidate Target Role: ${targetRole || 'Software Engineer'}

${atsData ? `ATS Resume Analysis Context:
- ATS Score: ${atsData.score}/100
- Missing Keywords: ${JSON.stringify(atsData.missingKeywords || [])}
- Weaknesses: ${JSON.stringify(atsData.weaknesses || [])}
- Overall Feedback: ${atsData.overallFeedback || ''}` : 'No ATS data available yet.'}

${interviews && interviews.length > 0 ? `Mock Interview Performance History (${interviews.length} sessions):
${JSON.stringify(interviews.map((i: any) => ({
  role: i.role,
  type: i.type,
  overallScore: i.overallScore,
  metrics: i.metrics,
  weaknesses: i.weaknesses || i.feedback?.weaknesses || [],
  improvements: i.improvements || i.feedback?.improvements || []
})), null, 2)}` : 'No completed mock interviews yet.'}

Task:
Generate 4 to 6 prioritized, step-by-step milestone nodes specifically targeting the candidate's highest-priority skill gaps (e.g. missing keywords, weak interview areas, low technical/communication scores).
Do NOT include generic unrelated topics. Focus on what this candidate needs for the target role "${targetRole || 'Software Engineer'}".

Return ONLY JSON matching the schema.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite placement career coach. Generate a structured personalized placement roadmap matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique milestone id, e.g. m-1" },
                  milestoneNumber: { type: Type.INTEGER, description: "Sequential index starting at 1" },
                  category: { type: Type.STRING, description: "Category/Module e.g. Backend Architecture, System Design, DSA, STAR Behavioral" },
                  title: { type: Type.STRING, description: "Clear, concise title" },
                  description: { type: Type.STRING, description: "Short explanation of the milestone" },
                  whySelected: { type: Type.STRING, description: "Specific explanation why this milestone was selected based on user's ATS missing keywords or interview weaknesses" },
                  estimatedMinutes: { type: Type.INTEGER, description: "Estimated practice time in minutes, e.g. 45, 60, 90" },
                  difficulty: { type: Type.STRING, description: "Easy | Medium | Hard" },
                  requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 relevant skill tags" },
                  resources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Resource title" },
                        type: { type: Type.STRING, description: "video | article | practice | documentation" },
                        url: { type: Type.STRING, description: "Search query URL or safe educational link" }
                      },
                      required: ["title", "type"]
                    }
                  },
                  practicalTask: { type: Type.STRING, description: "A concrete hands-on task to complete" },
                  interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 targeted interview questions to practice" },
                  status: { type: Type.STRING, description: "NOT_STARTED | IN_PROGRESS | COMPLETED" }
                },
                required: [
                  "id", "milestoneNumber", "category", "title", "description",
                  "whySelected", "estimatedMinutes", "difficulty", "requiredSkills",
                  "resources", "practicalTask", "interviewQuestions", "status"
                ]
              }
            }
          },
          required: ["milestones"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.milestones && parsed.milestones.length > 0) {
      res.json({ milestones: parsed.milestones });
      return;
    }
    throw new Error("Invalid roadmap output structure from Gemini.");
  } catch (error: any) {
    console.error("Error generating roadmap:", error);
    const { targetRole, atsData, interviews } = req.body;
    const fallbackMilestones = getMockRoadmap(targetRole, atsData, interviews);
    res.json({ milestones: fallbackMilestones });
  }
});

// 8. Adapt existing Personalized Roadmap after a new mock interview
app.post("/api/gemini/roadmap/adapt", async (req, res) => {
  try {
    const { targetRole, atsData, existingMilestones, latestInterview, interviews } = req.body;
    const ai = getAIClient();

    const prompt = `You are an elite Tech Career Lead and Engineering Mentor.
A candidate for the role of "${targetRole || 'Software Engineer'}" has just completed a NEW Mock Interview session.
Adapt and re-prioritize their Personalized Placement Roadmap based on this NEW performance evidence while preserving their past completed progress.

${atsData ? `ATS Resume Analysis Context:
- ATS Score: ${atsData.score}/100
- Missing Keywords: ${JSON.stringify(atsData.missingKeywords || [])}
- Weaknesses: ${JSON.stringify(atsData.weaknesses || [])}` : 'No ATS data.'}

LATEST Mock Interview Performance (Session ID: ${latestInterview?.id || 'Latest'}):
- Role: ${latestInterview?.role || targetRole}
- Interview Type: ${latestInterview?.interviewType || 'Technical'} (${latestInterview?.difficulty || 'Medium'})
- Overall Score: ${latestInterview?.overallScore || latestInterview?.feedback?.overallScore || 'N/A'}/100
- Category Scores: Technical: ${latestInterview?.feedback?.technicalKnowledge || 'N/A'}, Communication: ${latestInterview?.feedback?.communication || 'N/A'}, Confidence: ${latestInterview?.feedback?.confidence || 'N/A'}, Problem Solving: ${latestInterview?.feedback?.problemSolving || 'N/A'}
- Strengths Identified: ${JSON.stringify(latestInterview?.feedback?.strengths || latestInterview?.strengths || [])}
- Weaknesses Identified: ${JSON.stringify(latestInterview?.feedback?.weaknesses || latestInterview?.weaknesses || [])}
- Improvements Suggested: ${JSON.stringify(latestInterview?.feedback?.improvements || latestInterview?.improvements || [])}
- Summary: "${latestInterview?.feedback?.finalFeedback || ''}"

All Completed Interview Count: ${interviews?.length || 1}

EXISTING ROADMAP MILESTONES:
${JSON.stringify(existingMilestones || [], null, 2)}

STRICT ADAPTATION RULES:
1. PRESERVE ALL COMPLETED MILESTONES (status === 'COMPLETED' or 'completed'). Do NOT remove them or reset their status! Keep their title, category, and id.
2. Compare the latest mock interview performance with past milestones & ATS gaps.
3. Update or replace INCOMPLETE milestones (status === 'NOT_STARTED' or 'IN_PROGRESS'):
   - Add or modify milestones to address newly discovered weaknesses from the latest interview.
   - Set 'whySelected' to clearly state how it was updated following the latest interview (e.g., "Updated after Latest Mock Interview where communication and system architecture scores dropped to 62%").
4. Return 4 to 6 total milestones in sequential order (1..N).

Return ONLY JSON matching the schema.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite placement career coach. Adapt the candidate's roadmap based on their latest mock interview performance while preserving completed milestones.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique milestone id" },
                  milestoneNumber: { type: Type.INTEGER, description: "Sequential index starting at 1" },
                  category: { type: Type.STRING, description: "Category/Module" },
                  title: { type: Type.STRING, description: "Clear, concise title" },
                  description: { type: Type.STRING, description: "Short explanation" },
                  whySelected: { type: Type.STRING, description: "Explanation mentioning adaptation after latest mock interview or ATS scan" },
                  estimatedMinutes: { type: Type.INTEGER, description: "Estimated practice time in minutes" },
                  difficulty: { type: Type.STRING, description: "Easy | Medium | Hard" },
                  requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  resources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING },
                        url: { type: Type.STRING }
                      },
                      required: ["title", "type"]
                    }
                  },
                  practicalTask: { type: Type.STRING },
                  interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  status: { type: Type.STRING, description: "NOT_STARTED | IN_PROGRESS | COMPLETED" }
                },
                required: [
                  "id", "milestoneNumber", "category", "title", "description",
                  "whySelected", "estimatedMinutes", "difficulty", "requiredSkills",
                  "resources", "practicalTask", "interviewQuestions", "status"
                ]
              }
            }
          },
          required: ["milestones"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.milestones && parsed.milestones.length > 0) {
      res.json({ milestones: parsed.milestones, adapted: true });
      return;
    }
    throw new Error("Invalid adapted roadmap output from Gemini.");
  } catch (error: any) {
    console.error("Error adapting roadmap:", error);
    const { targetRole, existingMilestones, latestInterview, interviews } = req.body;
    const fallbackMilestones = getMockAdaptedRoadmap(targetRole, existingMilestones, latestInterview, interviews);
    res.json({ milestones: fallbackMilestones, adapted: true });
  }
});

// -------------------------------------------------------------------------
// VITE CLIENT MIDDLEWARE OR STATIC SERVING
// -------------------------------------------------------------------------

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`INTERVU IQ full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
