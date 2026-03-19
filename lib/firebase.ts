import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD1Htx96q128uUbP4Q90P8nsFdEHkxCbTM",
  authDomain: "the-owensboro-app.firebaseapp.com",
  projectId: "the-owensboro-app",
  storageBucket: "the-owensboro-app.firebasestorage.app",
  messagingSenderId: "98602473214",
  appId: "1:98602473214:web:43b833f1b76d4ba92237af",
};

// ✅ prevent re-initialization (important in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ EXPORT THESE
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;