import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { auth } from "../firebase/auth";
import { CloudinaryUploadResponse } from "./cloudinaryService";
import { handleFirestoreError, OperationType } from "./userService";

export interface ResumeMetadata {
  uploaded: boolean;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
  uploadedAt?: any;
}

/**
 * Saves or replaces the user's resume metadata in Firestore under users/{uid}.
 * Merge strategy ensures user document fields are preserved while updating resume.
 */
export async function saveResumeMetadata(
  uid: string,
  uploadData: CloudinaryUploadResponse
): Promise<ResumeMetadata> {
  if (!uid) {
    throw new Error("Authenticated user UID is required to save resume metadata.");
  }

  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  const resumeData: ResumeMetadata = {
    uploaded: true,
    fileName: uploadData.fileName,
    url: uploadData.secure_url,
    publicId: uploadData.public_id,
    size: uploadData.bytes,
    format: uploadData.format,
    uploadedAt: serverTimestamp()
  };

  try {
    await setDoc(userRef, { resume: resumeData }, { merge: true });
    return resumeData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Deletes/deactivates the user's resume metadata in Firestore at users/{uid}.
 */
export async function deleteResumeMetadata(uid: string): Promise<void> {
  if (!uid) return;

  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  try {
    await setDoc(
      userRef,
      {
        resume: {
          uploaded: false,
          fileName: "",
          url: "",
          publicId: "",
          size: 0,
          format: ""
        }
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Retrieves the saved resume metadata for a given user from users/{uid}.
 */
export async function getUserResumeMetadata(uid: string): Promise<ResumeMetadata | null> {
  if (!uid) return null;

  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.resume && data.resume.uploaded) {
        return data.resume as ResumeMetadata;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
