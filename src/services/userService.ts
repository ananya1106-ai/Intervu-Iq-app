import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  increment,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebase/firestore";
import { auth } from "../firebase/auth";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * UserDocument schema for Firestore collection `users/{uid}`.
 */
export interface UserDocument {
  fullName: string;
  email: string;
  targetRole: string;
  onboardingCompleted: boolean;
  profilePhotoUrl?: string | null;
  purchasedInterviewsCount?: number;
  purchasedInterviewCredits?: number;
  freeTrialRemaining?: number;
  freeTrialUsed?: number;
  activeTier?: 'standard' | 'advanced' | 'free';
  lastPurchasedPlan?: 'standard' | 'advanced';
  lastPaymentAt?: any;
  createdAt?: any;
  updatedAt?: any;

  /*
   * FUTURE ENHANCEMENT PLACEHOLDER:
   * When onboarding or profile forms are extended in the UI later,
   * the following fields can be uncommented and saved to Firestore:
   *
   * college?: string;
   * branch?: string;
   * graduationYear?: string | number;
   */
}

export interface UserCreditBalance {
  totalFreeAllowance: number;      // 15
  freeTrialUsed: number;           // 0 to 15
  freeTrialRemaining: number;      // 0 to 15
  purchasedCredits: number;        // On-demand purchased credits
  totalAvailable: number;          // freeTrialRemaining + purchasedCredits
  isTrialExhausted: boolean;       // freeTrialRemaining === 0
  hasAvailableInterviews: boolean; // totalAvailable > 0
}

/**
 * Calculates current available interviews from preserved free-trial allowance plus purchased credits.
 * Fully additive: purchasing a plan NEVER resets or replaces free trial interviews.
 */
export function getUserCreditBalance(
  userDoc?: UserDocument | null,
  completedInterviewsCount: number = 0
): UserCreditBalance {
  const TOTAL_FREE_ALLOWANCE = 15;

  const purchased = Math.max(0, Number(
    userDoc?.purchasedInterviewCredits ?? 
    userDoc?.purchasedInterviewsCount ?? 
    0
  ));

  let freeTrialRemaining: number;
  let freeTrialUsed: number;

  if (typeof userDoc?.freeTrialRemaining === 'number') {
    freeTrialRemaining = Math.max(0, Math.min(TOTAL_FREE_ALLOWANCE, userDoc.freeTrialRemaining));
    freeTrialUsed = typeof userDoc?.freeTrialUsed === 'number'
      ? Math.max(0, userDoc.freeTrialUsed)
      : Math.max(0, TOTAL_FREE_ALLOWANCE - freeTrialRemaining);
  } else if (typeof userDoc?.freeTrialUsed === 'number') {
    freeTrialUsed = Math.max(0, Math.min(TOTAL_FREE_ALLOWANCE, userDoc.freeTrialUsed));
    freeTrialRemaining = Math.max(0, TOTAL_FREE_ALLOWANCE - freeTrialUsed);
  } else {
    freeTrialUsed = Math.max(0, Math.min(TOTAL_FREE_ALLOWANCE, completedInterviewsCount));
    freeTrialRemaining = Math.max(0, TOTAL_FREE_ALLOWANCE - freeTrialUsed);
  }

  const totalAvailable = freeTrialRemaining + purchased;

  return {
    totalFreeAllowance: TOTAL_FREE_ALLOWANCE,
    freeTrialUsed,
    freeTrialRemaining,
    purchasedCredits: purchased,
    totalAvailable,
    isTrialExhausted: freeTrialRemaining === 0,
    hasAvailableInterviews: totalAvailable > 0
  };
}

export interface UserPaymentRecord {
  paymentId: string;
  orderId: string;
  planId: 'standard' | 'advanced';
  planName?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt?: any;
}

/**
 * Creates the user's Firestore document at `users/{uid}` if it does not exist.
 * If the document already exists, returns existing user data without overwriting.
 */
export async function ensureUserDocument(
  uid: string,
  initialData?: { fullName?: string; email?: string; targetRole?: string }
): Promise<UserDocument> {
  if (!uid) {
    throw new Error('User UID is required to access Firestore user document.');
  }

  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserDocument;
    }

    const newUserDoc: UserDocument = {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      targetRole: initialData?.targetRole || 'Software Engineer',
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, newUserDoc);
    return newUserDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Fetches the user document from `users/{uid}`.
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  if (!uid) return null;

  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDocument;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Updates the authenticated user's document at `users/{uid}`.
 */
export async function updateUserDocument(
  uid: string,
  updates: Partial<Omit<UserDocument, 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!uid) return;

  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Saves a verified payment transaction into the user's subcollection at `users/{uid}/payments/{paymentId}`.
 */
export async function recordUserPayment(
  uid: string,
  paymentData: {
    paymentId: string;
    orderId: string;
    planId: 'standard' | 'advanced';
    planName?: string;
    amount: number;
    currency: string;
    status: string;
  }
): Promise<void> {
  if (!uid || !paymentData.paymentId) return;

  const path = `users/${uid}/payments/${paymentData.paymentId}`;
  const paymentRef = doc(db, 'users', uid, 'payments', paymentData.paymentId);

  try {
    await setDoc(paymentRef, {
      ...paymentData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Increments purchased interview credits for the user after verified payment.
 * Maintains both purchasedInterviewsCount and purchasedInterviewCredits in sync.
 */
export async function incrementUserCredits(
  uid: string,
  creditsToAdd: number = 1,
  tier: 'standard' | 'advanced' = 'standard'
): Promise<void> {
  if (!uid) return;

  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    await setDoc(userRef, {
      purchasedInterviewsCount: increment(creditsToAdd),
      purchasedInterviewCredits: increment(creditsToAdd),
      activeTier: tier,
      lastPurchasedPlan: tier,
      lastPaymentAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Idempotently records verified payment and credits the user.
 * Avoids double-crediting if the backend server already credited the payment in Firestore.
 */
export async function recordUserPaymentAndCredit(
  uid: string,
  paymentData: {
    paymentId: string;
    orderId: string;
    planId: 'standard' | 'advanced';
    planName?: string;
    amount: number;
    currency: string;
    status: string;
  },
  creditsToAdd: number = 1,
  alreadyCreditedByServer: boolean = false
): Promise<void> {
  if (!uid || !paymentData.paymentId) return;

  const paymentRef = doc(db, 'users', uid, 'payments', paymentData.paymentId);
  const userRef = doc(db, 'users', uid);

  try {
    const paymentDoc = await getDoc(paymentRef);
    const alreadyCredited = paymentDoc.exists() && paymentDoc.data()?.credited === true;

    await setDoc(paymentRef, {
      ...paymentData,
      credited: true,
      updatedAt: serverTimestamp(),
      createdAt: paymentDoc.exists() ? (paymentDoc.data()?.createdAt || serverTimestamp()) : serverTimestamp(),
    }, { merge: true });

    // Only increment user document if not already credited by the server and not already credited in Firestore
    if (!alreadyCreditedByServer && !alreadyCredited) {
      await setDoc(userRef, {
        purchasedInterviewsCount: increment(creditsToAdd),
        purchasedInterviewCredits: increment(creditsToAdd),
        activeTier: paymentData.planId,
        lastPurchasedPlan: paymentData.planId,
        lastPaymentAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.warn("Notice: payment record or credit sync error:", error);
  }
}

/**
 * Deducts exactly one interview credit from the appropriate balance when an interview is completed.
 * - If user has free trial sessions remaining (freeTrialRemaining > 0):
 *   deduct from free trial (freeTrialRemaining - 1, freeTrialUsed + 1). Purchased balance is preserved.
 * - If free trial is exhausted (freeTrialRemaining === 0) and user has purchased credits (purchasedCredits > 0):
 *   deduct from purchased credits (purchasedInterviewCredits - 1, purchasedInterviewsCount - 1).
 * - Idempotency: If interviewId is provided, checks if this interview was already deducted.
 */
export async function consumeUserInterviewCredit(
  uid: string,
  interviewId?: string
): Promise<{
  deductedFrom: 'trial' | 'purchased';
  freeTrialRemaining: number;
  purchasedCredits: number;
  totalAvailable: number;
}> {
  if (!uid) {
    throw new Error('User UID is required to consume an interview credit.');
  }

  const userRef = doc(db, 'users', uid);
  const interviewRef = interviewId ? doc(db, 'users', uid, 'interviews', interviewId) : null;

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. If interviewId provided, check if already deducted
      if (interviewRef) {
        const interviewSnap = await transaction.get(interviewRef);
        if (interviewSnap.exists() && interviewSnap.data()?.creditDeducted === true) {
          const userSnap = await transaction.get(userRef);
          const uData = userSnap.data() as UserDocument | undefined;
          const currentBal = getUserCreditBalance(uData);
          return {
            deductedFrom: interviewSnap.data()?.creditType || 'trial',
            freeTrialRemaining: currentBal.freeTrialRemaining,
            purchasedCredits: currentBal.purchasedCredits,
            totalAvailable: currentBal.totalAvailable,
          };
        }
      }

      // 2. Read user document
      const userSnap = await transaction.get(userRef);
      const uData = userSnap.exists() ? (userSnap.data() as UserDocument) : null;
      const balance = getUserCreditBalance(uData);

      if (balance.totalAvailable <= 0) {
        throw new Error('No interview sessions available. Please purchase a Standard or Advanced session.');
      }

      let deductedFrom: 'trial' | 'purchased' = 'trial';
      let nextTrialRemaining = balance.freeTrialRemaining;
      let nextTrialUsed = balance.freeTrialUsed;
      let nextPurchased = balance.purchasedCredits;

      if (balance.freeTrialRemaining > 0) {
        // Case A: Free trial has remaining sessions -> preserve purchased balance, decrement trial
        deductedFrom = 'trial';
        nextTrialRemaining = Math.max(0, balance.freeTrialRemaining - 1);
        nextTrialUsed = balance.freeTrialUsed + 1;
      } else if (balance.purchasedCredits > 0) {
        // Case B: Free trial is exhausted -> decrement purchased credits
        deductedFrom = 'purchased';
        nextPurchased = Math.max(0, balance.purchasedCredits - 1);
      }

      transaction.set(userRef, {
        freeTrialRemaining: nextTrialRemaining,
        freeTrialUsed: nextTrialUsed,
        purchasedInterviewCredits: nextPurchased,
        purchasedInterviewsCount: nextPurchased,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (interviewRef) {
        transaction.set(interviewRef, {
          creditDeducted: true,
          creditType: deductedFrom,
          deductedAt: serverTimestamp()
        }, { merge: true });
      }

      return {
        deductedFrom,
        freeTrialRemaining: nextTrialRemaining,
        purchasedCredits: nextPurchased,
        totalAvailable: nextTrialRemaining + nextPurchased
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}

/**
 * Fetches the user's payment records from `users/{uid}/payments`.
 */
export async function getUserPayments(uid: string): Promise<UserPaymentRecord[]> {
  if (!uid) return [];

  const path = `users/${uid}/payments`;
  const paymentsRef = collection(db, 'users', uid, 'payments');

  try {
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data()
    })) as UserPaymentRecord[];
  } catch (error) {
    console.warn("Could not fetch user payments:", error);
    return [];
  }
}
