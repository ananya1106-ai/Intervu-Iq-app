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
  increment
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
