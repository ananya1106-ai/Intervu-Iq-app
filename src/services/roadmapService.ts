import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { handleFirestoreError, OperationType, getUserDocument } from "./userService";
import { getUserAtsData } from "./atsService";
import { getUserInterviews } from "./interviewService";
import { RoadmapData, RoadmapMilestone } from "../types";

/**
 * Fetches stored personalized roadmap from users/{uid}/roadmap/current
 */
export async function getUserRoadmap(uid: string): Promise<RoadmapData | null> {
  if (!uid) return null;

  const path = `users/${uid}/roadmap/current`;
  const roadmapRef = doc(db, "users", uid, "roadmap", "current");

  try {
    const snap = await getDoc(roadmapRef);
    if (snap.exists()) {
      const data = snap.data() as RoadmapData;
      if (data && Array.isArray(data.milestones)) {
        return data;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Saves or updates roadmap in users/{uid}/roadmap/current
 */
export async function saveUserRoadmap(uid: string, roadmapData: RoadmapData): Promise<RoadmapData> {
  if (!uid) {
    throw new Error("User UID is required to save roadmap.");
  }

  const path = `users/${uid}/roadmap/current`;
  const roadmapRef = doc(db, "users", uid, "roadmap", "current");

  const completedCount = roadmapData.milestones.filter(
    m => m.status === 'COMPLETED' || m.status === 'completed'
  ).length;

  const totalMilestones = roadmapData.milestones.length;
  const overallProgress = totalMilestones > 0 
    ? Math.round((completedCount / totalMilestones) * 100) 
    : 0;

  const payload: RoadmapData = {
    ...roadmapData,
    completedCount,
    totalMilestones,
    overallProgress,
    lastUpdated: serverTimestamp()
  };

  try {
    await setDoc(roadmapRef, payload, { merge: true });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Updates the completion status of a single milestone in Firestore
 */
export async function updateMilestoneStatusInFirestore(
  uid: string,
  milestoneId: string,
  nextStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
): Promise<RoadmapData | null> {
  if (!uid) return null;

  const currentRoadmap = await getUserRoadmap(uid);
  if (!currentRoadmap || !Array.isArray(currentRoadmap.milestones)) {
    return null;
  }

  const updatedMilestones = currentRoadmap.milestones.map((m) => {
    if (m.id === milestoneId) {
      return { ...m, status: nextStatus };
    }
    return m;
  });

  const updatedData: RoadmapData = {
    ...currentRoadmap,
    milestones: updatedMilestones
  };

  return await saveUserRoadmap(uid, updatedData);
}

/**
 * Generates a new roadmap from user's real ATS and Interview data or loads existing
 */
export async function generateAndFetchRoadmap(
  uid: string,
  forceRegenerate: boolean = false
): Promise<RoadmapData | null> {
  if (!uid) return null;

  // 1. Fetch current stored roadmap from Firestore
  const existing = await getUserRoadmap(uid);

  // 2. Fetch latest data sources (ATS, Interviews, User Profile)
  const [atsData, interviews, userDoc] = await Promise.all([
    getUserAtsData(uid),
    getUserInterviews(uid),
    getUserDocument(uid)
  ]);

  const hasAts = Boolean(atsData && typeof atsData.score === 'number');
  const hasInterviews = Boolean(interviews && interviews.length > 0);

  // If candidate has no ATS analysis and no interviews, return null for empty state
  if (!hasAts && !hasInterviews) {
    return null;
  }

  const targetRole = userDoc?.targetRole || "Software Engineer";
  const latestInterview = interviews && interviews.length > 0 ? interviews[0] : null;

  // 3. CHECK FOR ADAPTATION vs SERVING CACHED ROADMAP
  if (existing && !forceRegenerate) {
    const hasNewUnprocessedInterview = Boolean(
      latestInterview?.id && (latestInterview.id !== existing.lastProcessedInterviewId)
    );

    if (!hasNewUnprocessedInterview) {
      // No new interview completed! Return cached roadmap without making any unnecessary Gemini API calls.
      return existing;
    }

    // NEW INTERVIEW DETECTED! Adapt the roadmap based on latest performance while preserving completed milestones.
    try {
      const response = await fetch("/api/gemini/roadmap/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          atsData,
          existingMilestones: existing.milestones,
          latestInterview,
          interviews
        })
      });

      if (response.ok) {
        const data = await response.json();
        const milestones: RoadmapMilestone[] = data.milestones || [];
        if (milestones && milestones.length > 0) {
          const formattedMilestones: RoadmapMilestone[] = milestones.map((m, idx) => ({
            ...m,
            milestoneNumber: m.milestoneNumber || (idx + 1),
            status: m.status || (idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED')
          }));

          const sourceInterviewIds = interviews.map((i: any) => i.id || '').filter(Boolean);

          const adaptedRoadmap: RoadmapData = {
            ...existing,
            targetRole,
            sourceInterviewIds,
            sourceATSScore: atsData?.score || null,
            milestones: formattedMilestones,
            lastProcessedInterviewId: latestInterview?.id,
            updatedAfterInterview: true
          };

          return await saveUserRoadmap(uid, adaptedRoadmap);
        }
      }
    } catch (err) {
      console.error("Error adapting roadmap with latest interview:", err);
    }

    // If adaptation call failed, return existing cached roadmap
    return existing;
  }

  // 4. INITIAL ROADMAP GENERATION (if no roadmap exists yet or forceRegenerate is requested)
  try {
    const response = await fetch("/api/gemini/roadmap/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetRole,
        atsData,
        interviews
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    const milestones: RoadmapMilestone[] = data.milestones || [];

    if (!milestones || milestones.length === 0) {
      throw new Error("No milestones generated");
    }

    const formattedMilestones: RoadmapMilestone[] = milestones.map((m, idx) => ({
      ...m,
      milestoneNumber: m.milestoneNumber || (idx + 1),
      status: m.status || (idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED')
    }));

    const sourceInterviewIds = interviews.map((i: any) => i.id || '').filter(Boolean);

    const newRoadmap: RoadmapData = {
      targetRole,
      sourceInterviewIds,
      sourceATSScore: atsData?.score || null,
      milestones: formattedMilestones,
      lastProcessedInterviewId: latestInterview?.id || undefined,
      updatedAfterInterview: Boolean(latestInterview),
      overallProgress: 0,
      completedCount: 0,
      totalMilestones: formattedMilestones.length
    };

    return await saveUserRoadmap(uid, newRoadmap);
  } catch (error) {
    console.error("Error generating roadmap from server:", error);
    throw error;
  }
}
