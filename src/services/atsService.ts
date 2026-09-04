import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { handleFirestoreError, OperationType, getUserDocument } from "./userService";
import { extractTextFromPdfUrl } from "./pdfService";
import { analyzeResumeWithGemini, AtsGeminiAnalysis } from "./geminiService";

export interface AtsData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  grammarSuggestions: string[];
  formattingSuggestions: string[];
  improvementSuggestions: string[];
  overallFeedback: string;
  analyzedAt?: any;
}

/**
 * Saves or updates ATS analysis result in Firestore under users/{uid}.ats using merge strategy.
 */
export async function saveAtsData(
  uid: string, 
  analysis: AtsGeminiAnalysis
): Promise<AtsData> {
  if (!uid) {
    throw new Error("User UID is required to save ATS data.");
  }

  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  const atsRecord: AtsData = {
    score: typeof analysis.score === 'number' ? analysis.score : 70,
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
    missingKeywords: Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [],
    grammarSuggestions: Array.isArray(analysis.grammarSuggestions) ? analysis.grammarSuggestions : [],
    formattingSuggestions: Array.isArray(analysis.formattingSuggestions) ? analysis.formattingSuggestions : [],
    improvementSuggestions: Array.isArray(analysis.improvementSuggestions) ? analysis.improvementSuggestions : [],
    overallFeedback: analysis.overallFeedback || "",
    analyzedAt: serverTimestamp()
  };

  try {
    await setDoc(userRef, { ats: atsRecord }, { merge: true });
    return atsRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Fetches ATS data stored in users/{uid}.ats.
 */
export async function getUserAtsData(uid: string): Promise<AtsData | null> {
  if (!uid) return null;

  const path = `users/${uid}`;
  const userRef = doc(db, "users", uid);

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.ats && typeof data.ats.score === "number") {
        return data.ats as AtsData;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Executes full ATS Resume Analysis pipeline:
 * 1. Downloads and extracts text from Cloudinary PDF URL via pdf.js
 * 2. Retrieves target role from user's Firestore profile
 * 3. Sends prompt & extracted text to Gemini API
 * 4. Stores resulting ATS JSON inside users/{uid}.ats
 */
export async function runAtsAnalysisPipeline(
  uid: string,
  pdfUrl: string,
  overrideTargetRole?: string
): Promise<AtsData> {
  if (!uid) {
    throw new Error("User UID is required to run ATS analysis.");
  }
  if (!pdfUrl) {
    throw new Error("Uploaded resume PDF URL is required to run ATS analysis.");
  }

  // 1. Extract text from PDF
  const resumeText = await extractTextFromPdfUrl(pdfUrl);

  // 2. Fetch target role from user document if not provided
  let role = overrideTargetRole;
  if (!role) {
    const userDoc = await getUserDocument(uid);
    role = userDoc?.targetRole || "Software Engineer";
  }

  // 3. Analyze with Gemini
  const geminiResult = await analyzeResumeWithGemini(resumeText, role);

  // 4. Save to Firestore
  const savedAtsData = await saveAtsData(uid, geminiResult);

  return savedAtsData;
}
