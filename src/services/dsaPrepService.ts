import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import {
  DSAQuestionItem,
  DSAResourceItem,
  DSACompanyItem,
  DSASheetItem,
  DSATopicItem,
  DSAVideoResourceItem,
  DSAVideoTopicItem
} from "../types/dsaPrep";

// Import dataset files directly as raw static source of truth / fallback
import rawQuestions from "../data/raw/questions.json";
import rawCompanies from "../data/raw/companies.json";
import rawResources from "../data/raw/resources.json";
import rawDsaSheets from "../data/raw/dsa_sheets.json";
import rawTopics from "../data/raw/topics.json";
import rawVideoResources from "../data/raw/video_resources.json";
import rawVideoTopics from "../data/raw/video_topics.json";

// Typed default dataset
export const DEFAULT_QUESTIONS = rawQuestions as DSAQuestionItem[];
export const DEFAULT_COMPANIES = rawCompanies as DSACompanyItem[];
export const DEFAULT_RESOURCES = rawResources as DSAResourceItem[];
export const DEFAULT_DSA_SHEETS = rawDsaSheets as DSASheetItem[];
export const DEFAULT_TOPICS = rawTopics as DSATopicItem[];
export const DEFAULT_VIDEO_RESOURCES = rawVideoResources as DSAVideoResourceItem[];
export const DEFAULT_VIDEO_TOPICS = rawVideoTopics as DSAVideoTopicItem[];

/**
 * Service for managing DSA Prep Hub data with Firestore & local dataset fallback
 */
export const dsaPrepService = {
  /**
   * Fetch questions from Firestore 'questions' collection, fallback to dataset if empty
   */
  async getQuestions(): Promise<DSAQuestionItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "questions"));
      if (!querySnapshot.empty) {
        const items: DSAQuestionItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSAQuestionItem;
          if (data && data.title) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore questions collection fetch error, using dataset fallback:", error);
    }
    return DEFAULT_QUESTIONS.map((q, idx) => ({ ...q, id: `q-${idx + 1}` }));
  },

  /**
   * Fetch companies from Firestore 'companies' collection, fallback to dataset
   */
  async getCompanies(): Promise<DSACompanyItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      if (!querySnapshot.empty) {
        const items: DSACompanyItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSACompanyItem;
          if (data && data.name) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore companies fetch error, using dataset fallback:", error);
    }
    return DEFAULT_COMPANIES.map((c, idx) => ({ ...c, id: `c-${idx + 1}` }));
  },

  /**
   * Fetch topics from Firestore 'dsaTopics' collection, fallback to dataset
   */
  async getTopics(): Promise<DSATopicItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "dsaTopics"));
      if (!querySnapshot.empty) {
        const items: DSATopicItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSATopicItem;
          if (data && data.topic) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore dsaTopics fetch error, using dataset fallback:", error);
    }
    return DEFAULT_TOPICS.map((t, idx) => ({ ...t, id: `t-${idx + 1}` }));
  },

  /**
   * Fetch DSA Sheets from Firestore 'dsaSheets' collection, fallback to dataset
   */
  async getDsaSheets(): Promise<DSASheetItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "dsaSheets"));
      if (!querySnapshot.empty) {
        const items: DSASheetItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSASheetItem;
          if (data && data.name) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore dsaSheets fetch error, using dataset fallback:", error);
    }
    return DEFAULT_DSA_SHEETS.map((s, idx) => ({ ...s, id: `s-${idx + 1}` }));
  },

  /**
   * Fetch resources from Firestore 'resources' collection, fallback to dataset
   */
  async getResources(): Promise<DSAResourceItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "resources"));
      if (!querySnapshot.empty) {
        const items: DSAResourceItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSAResourceItem;
          if (data && data.title) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore resources fetch error, using dataset fallback:", error);
    }
    return DEFAULT_RESOURCES.map((r, idx) => ({ ...r, id: `r-${idx + 1}` }));
  },

  /**
   * Fetch video topics from Firestore 'videoTopics' collection, fallback to dataset
   */
  async getVideoTopics(): Promise<DSAVideoTopicItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "videoTopics"));
      if (!querySnapshot.empty) {
        const items: DSAVideoTopicItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSAVideoTopicItem;
          if (data && data.topic) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore videoTopics fetch error, using dataset fallback:", error);
    }
    return DEFAULT_VIDEO_TOPICS.map((vt, idx) => ({ ...vt, id: `vt-${idx + 1}` }));
  },

  /**
   * Fetch video resources from Firestore 'videoResources' collection, fallback to dataset
   */
  async getVideoResources(): Promise<DSAVideoResourceItem[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "videoResources"));
      if (!querySnapshot.empty) {
        const items: DSAVideoResourceItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as DSAVideoResourceItem;
          if (data && data.name) {
            items.push({ id: docSnap.id, ...data });
          }
        });
        if (items.length > 0) {
          return items;
        }
      }
    } catch (error) {
      console.warn("Firestore videoResources fetch error, using dataset fallback:", error);
    }
    return DEFAULT_VIDEO_RESOURCES.map((vr, idx) => ({ ...vr, id: `vr-${idx + 1}` }));
  },

  /**
   * Fetch solved question titles or IDs for a given user UID from Firestore
   */
  async getUserSolvedQuestions(uid: string): Promise<string[]> {
    if (!uid) return [];
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.solvedDsaQuestions && Array.isArray(data.solvedDsaQuestions)) {
          return data.solvedDsaQuestions;
        }
      }
    } catch (error) {
      console.warn("Error fetching user solved questions from Firestore:", error);
    }
    return [];
  },

  /**
   * Toggle a question solved status for a user and save in Firestore
   */
  async toggleQuestionSolved(uid: string, questionTitleOrId: string, shouldBeSolved: boolean): Promise<boolean> {
    if (!uid || !questionTitleOrId) return false;
    try {
      const userDocRef = doc(db, "users", uid);
      if (shouldBeSolved) {
        await setDoc(userDocRef, {
          solvedDsaQuestions: arrayUnion(questionTitleOrId)
        }, { merge: true });
      } else {
        await updateDoc(userDocRef, {
          solvedDsaQuestions: arrayRemove(questionTitleOrId)
        });
      }
      return true;
    } catch (error) {
      console.error("Error updating solved DSA question in Firestore:", error);
      return false;
    }
  },

  /**
   * Seed the uploaded dataset into Firestore collections safely
   */
  async seedFirestoreDataset(options?: { overwrite?: boolean }): Promise<{ success: boolean; message: string }> {
    try {
      // Check if questions collection already has items
      if (!options?.overwrite) {
        const questionsSnap = await getDocs(collection(db, "questions"));
        if (!questionsSnap.empty) {
          return {
            success: true,
            message: `Firestore already contains ${questionsSnap.size} questions. Dataset seeding skipped to protect existing data.`
          };
        }
      }

      // Seed Questions
      let batch = writeBatch(db);
      let opCount = 0;

      for (let i = 0; i < DEFAULT_QUESTIONS.length; i++) {
        const q = DEFAULT_QUESTIONS[i];
        const docRef = doc(collection(db, "questions"));
        batch.set(docRef, { ...q, createdAt: new Date().toISOString() });
        opCount++;

        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed Companies
      for (const c of DEFAULT_COMPANIES) {
        const docRef = doc(db, "companies", c.slug);
        batch.set(docRef, { ...c, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed Resources
      for (const r of DEFAULT_RESOURCES) {
        const docRef = doc(collection(db, "resources"));
        batch.set(docRef, { ...r, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed DSA Sheets
      for (const s of DEFAULT_DSA_SHEETS) {
        const docRef = doc(collection(db, "dsaSheets"));
        batch.set(docRef, { ...s, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed DSA Topics
      for (const t of DEFAULT_TOPICS) {
        const docRef = doc(collection(db, "dsaTopics"));
        batch.set(docRef, { ...t, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed Video Topics
      for (const vt of DEFAULT_VIDEO_TOPICS) {
        const docRef = doc(collection(db, "videoTopics"));
        batch.set(docRef, { ...vt, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Seed Video Resources
      for (const vr of DEFAULT_VIDEO_RESOURCES) {
        const docRef = doc(collection(db, "videoResources"));
        batch.set(docRef, { ...vr, createdAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        message: "Successfully seeded DSA Prep Hub dataset to Firestore collections!"
      };
    } catch (error: any) {
      console.error("Error seeding Firestore dataset:", error);
      return {
        success: false,
        message: `Failed to seed dataset: ${error?.message || "Unknown error"}`
      };
    }
  }
};
