import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyAzoEN_GViyv58WXTmScQN3VStjA7NkGVk",
  authDomain: "intervuiq-01.firebaseapp.com",
  projectId: "intervuiq-01",
  storageBucket: "intervuiq-01.firebasestorage.app",
  messagingSenderId: "535353806137",
  appId: "1:535353806137:web:ec478f524dc2d362fb2ce8",
  measurementId: "G-E0L2KVN14E"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
