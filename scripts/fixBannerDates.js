import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

// -------------------- FIX ENV LOADING --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: load Next.js env file
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// -------------------- SAFETY CHECKS --------------------
const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key} in environment variables`);
  }
}

// -------------------- INIT FIREBASE ADMIN --------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// -------------------- MAIN SCRIPT --------------------
const run = async () => {
  console.log("🚀 Starting banner migration...");

  const snapshot = await db.collection("Banner").get();

  if (snapshot.empty) {
    console.log("No banners found");
    return;
  }

  console.log(`Found ${snapshot.size} banners`);

  let count = 0;

  for (const docSnap of snapshot.docs) {
    try {
      await docSnap.ref.update({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Updated: ${docSnap.id}`);
      count++;
    } catch (err) {
      console.error(`❌ Failed: ${docSnap.id}`, err.message);
    }
  }

  console.log(`🎯 Done. Updated ${count} banners`);

  process.exit(0);
};

run();