import { doc, collection, setDoc, getDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { handleFirestoreError, OperationType, getUserDocument, UserDocument } from "./userService";
import { getUserResumeMetadata, ResumeMetadata } from "./resumeService";
import { getUserAtsData, AtsData } from "./atsService";
import { ExpressionSummaryData, SpeechAnalysisData } from "../types";
import { aggregateInterviewSpeechAnalysis } from "./speechAnalysisService";

export interface InterviewQuestionItem {
  id: number;
  question: string;
  category: string;
  suggestedPoints: string[];
}

export interface UserInterviewProfile {
  fullName: string;
  targetRole: string;
  resume: ResumeMetadata | null;
  ats: AtsData | null;
}

export interface AnswerItem {
  questionId: number;
  question: string;
  transcript: string;
  answeredAt: string;
}

export interface EvaluationResultData {
  overallScore: number;
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  problemSolving: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  finalFeedback: string;
}

export interface InterviewSessionData {
  id?: string;
  role?: string;
  interviewType: 'HR' | 'Technical' | 'Behavioral' | 'Mixed';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: InterviewQuestionItem[];
  answers: AnswerItem[];
  feedback: EvaluationResultData;
  expressionSummary?: ExpressionSummaryData;
  speechAnalysis?: SpeechAnalysisData;
  createdAt?: any;
}

export function getFormattedInterviewDate(createdAt: any): string {
  if (!createdAt) return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (createdAt.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    return new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Fetches user profile, resume metadata, and ATS analysis from Firestore (users/{uid}).
 */
export async function getUserInterviewProfile(uid: string): Promise<UserInterviewProfile> {
  if (!uid) {
    return {
      fullName: 'Candidate',
      targetRole: 'Software Engineer',
      resume: null,
      ats: null
    };
  }

  try {
    const [userDoc, resumeMeta, atsData] = await Promise.all([
      getUserDocument(uid),
      getUserResumeMetadata(uid),
      getUserAtsData(uid)
    ]);

    return {
      fullName: userDoc?.fullName || 'Candidate',
      targetRole: userDoc?.targetRole || 'Software Engineer',
      resume: resumeMeta,
      ats: atsData
    };
  } catch (error) {
    console.error('Error fetching user interview profile:', error);
    return {
      fullName: 'Candidate',
      targetRole: 'Software Engineer',
      resume: null,
      ats: null
    };
  }
}

/**
 * Calls Gemini API via backend route to generate 10 personalized interview questions.
 */
export async function generateInterviewQuestions(params: {
  role: string;
  difficulty: string;
  type: string;
  resumeText?: string;
  atsData?: AtsData | null;
}): Promise<InterviewQuestionItem[]> {
  const { role, difficulty, type, resumeText, atsData } = params;

  try {
    const response = await fetch("/api/gemini/mock-interview/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: role || "Software Engineer",
        difficulty: difficulty || "Medium",
        type: type || "Mixed",
        resumeText: resumeText || "",
        atsData: atsData || null
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions as InterviewQuestionItem[];
      }
    }
  } catch (err) {
    console.warn("Failed to generate questions from /generate-questions endpoint:", err);
  }

  // Pure client fallback question set if network fails completely
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    question: `[Q${i + 1}] As a ${role} (${type} round - ${difficulty}), how do you optimize system performance, architecture design, and code modularity under heavy load?`,
    category: type === 'Mixed' ? (i % 2 === 0 ? 'Technical' : 'Behavioral') : type,
    suggestedPoints: [
      'Structure answer clearly using STAR method or architectural tiers',
      'Mention specific tools, frameworks, metrics, or trade-offs',
      'Highlight testing protocols, failovers, or team collaboration'
    ]
  }));
}

/**
 * Saves or updates a completed interview session to Firestore under users/{uid}/interviews/{interviewId}.
 * Merges speechAnalysis and expressionSummary into the existing/new interview document.
 */
export async function saveInterviewSession(
  uid: string,
  sessionData: InterviewSessionData
): Promise<string> {
  if (!uid) {
    throw new Error("User UID is required to save interview session to Firestore.");
  }

  const interviewsRef = collection(db, "users", uid, "interviews");
  const docRef = sessionData.id ? doc(db, "users", uid, "interviews", sessionData.id) : doc(interviewsRef);
  const path = `users/${uid}/interviews/${docRef.id}`;

  try {
    // Derive speech analysis from passed data or calculate from real answer transcripts
    const calculatedSpeech: SpeechAnalysisData = sessionData.speechAnalysis || aggregateInterviewSpeechAnalysis([], sessionData.answers);

    // Construct sanitized payload guaranteeing speechAnalysis and expressionSummary are fully persisted
    const docData: any = {
      role: sessionData.role || "Software Engineer",
      interviewType: sessionData.interviewType || "Mixed",
      difficulty: sessionData.difficulty || "Medium",
      questions: sessionData.questions || [],
      answers: sessionData.answers || [],
      feedback: sessionData.feedback || {},
      createdAt: sessionData.createdAt || serverTimestamp(),
      speechAnalysis: {
        speakingRate: Number(calculatedSpeech.speakingRate ?? 125),
        fillerWordCount: Number(calculatedSpeech.fillerWordCount ?? 0),
        fillerBreakdown: calculatedSpeech.fillerBreakdown ? {
          um: Number(calculatedSpeech.fillerBreakdown.um ?? 0),
          uh: Number(calculatedSpeech.fillerBreakdown.uh ?? 0),
          like: Number(calculatedSpeech.fillerBreakdown.like ?? 0),
          actually: Number(calculatedSpeech.fillerBreakdown.actually ?? 0),
          basically: Number(calculatedSpeech.fillerBreakdown.basically ?? 0),
          youKnow: Number(calculatedSpeech.fillerBreakdown.youKnow ?? 0)
        } : { um: 0, uh: 0, like: 0, actually: 0, basically: 0, youKnow: 0 },
        pauseCount: Number(calculatedSpeech.pauseCount ?? 0),
        averagePauseDuration: Number(calculatedSpeech.averagePauseDuration ?? 1.5),
        speechDuration: Number(calculatedSpeech.speechDuration ?? 0),
        responseDuration: Number(calculatedSpeech.responseDuration ?? 0),
        speechActivityRatio: Number(calculatedSpeech.speechActivityRatio ?? 75),
        fluencyScore: Number(calculatedSpeech.fluencyScore ?? 88),
        fluencyAssessment: String(calculatedSpeech.fluencyAssessment || "Solid speaking pace and vocal cadence."),
        vocalFeedback: String(calculatedSpeech.vocalFeedback || "Maintained natural rhythm throughout responses.")
      }
    };

    if (sessionData.expressionSummary) {
      docData.expressionSummary = {
        averageEyeContact: Number(sessionData.expressionSummary.averageEyeContact ?? 90),
        averageSmile: Number(sessionData.expressionSummary.averageSmile ?? 15),
        totalBlinks: Number(sessionData.expressionSummary.totalBlinks ?? 0),
        dominantEmotion: String(sessionData.expressionSummary.dominantEmotion || "Focused"),
        postureStatus: String(sessionData.expressionSummary.postureStatus || "Good"),
        eyeContactAssessment: String(sessionData.expressionSummary.eyeContactAssessment || "Maintained stable eye contact."),
        expressionFeedback: String(sessionData.expressionSummary.expressionFeedback || "Maintained good composure.")
      };
    }

    await setDoc(docRef, docData, { merge: true });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Merges speech analysis directly into an existing interview document.
 */
export async function updateInterviewSpeechAnalysis(
  uid: string,
  interviewId: string,
  speechAnalysis: SpeechAnalysisData
): Promise<void> {
  if (!uid || !interviewId) return;

  const docRef = doc(db, "users", uid, "interviews", interviewId);
  const path = `users/${uid}/interviews/${interviewId}`;

  try {
    await setDoc(docRef, {
      speechAnalysis: {
        speakingRate: Number(speechAnalysis.speakingRate ?? 125),
        fillerWordCount: Number(speechAnalysis.fillerWordCount ?? 0),
        fillerBreakdown: speechAnalysis.fillerBreakdown ? {
          um: Number(speechAnalysis.fillerBreakdown.um ?? 0),
          uh: Number(speechAnalysis.fillerBreakdown.uh ?? 0),
          like: Number(speechAnalysis.fillerBreakdown.like ?? 0),
          actually: Number(speechAnalysis.fillerBreakdown.actually ?? 0),
          basically: Number(speechAnalysis.fillerBreakdown.basically ?? 0),
          youKnow: Number(speechAnalysis.fillerBreakdown.youKnow ?? 0)
        } : { um: 0, uh: 0, like: 0, actually: 0, basically: 0, youKnow: 0 },
        pauseCount: Number(speechAnalysis.pauseCount ?? 0),
        averagePauseDuration: Number(speechAnalysis.averagePauseDuration ?? 1.5),
        speechDuration: Number(speechAnalysis.speechDuration ?? 0),
        responseDuration: Number(speechAnalysis.responseDuration ?? 0),
        speechActivityRatio: Number(speechAnalysis.speechActivityRatio ?? 75),
        fluencyScore: Number(speechAnalysis.fluencyScore ?? 88),
        fluencyAssessment: String(speechAnalysis.fluencyAssessment || "Solid speaking pace and vocal cadence."),
        vocalFeedback: String(speechAnalysis.vocalFeedback || "Maintained natural rhythm throughout responses.")
      }
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Fetches all past interview sessions for a user from Firestore (users/{uid}/interviews).
 */
export async function getUserInterviews(uid: string): Promise<Array<InterviewSessionData & { id: string }>> {
  if (!uid) return [];

  const interviewsRef = collection(db, "users", uid, "interviews");
  const path = `users/${uid}/interviews`;

  try {
    const q = query(interviewsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const interviews: Array<InterviewSessionData & { id: string }> = [];
    querySnapshot.forEach((docSnap) => {
      interviews.push({
        id: docSnap.id,
        ...(docSnap.data() as InterviewSessionData)
      });
    });

    return interviews;
  } catch (error) {
    console.warn("Could not fetch user interviews from Firestore:", error);
    return [];
  }
}
