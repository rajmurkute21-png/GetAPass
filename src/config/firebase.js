import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * GateApass — Firebase Client Configuration
 *
 * Values are read strictly from Vite environment variables (import.meta.env.VITE_*).
 * Direct member access ensures static replacement by Vite during production builds.
 * No configuration values are hard-coded in source code.
 */

export const REQUIRED_CONFIG_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

// Direct static property access for robust bundler variable replacement
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const keyMapping = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

/**
 * Validates the presence of required Firebase environment variables.
 * Never logs or returns variable values to protect sensitive secrets.
 */
export function validateFirebaseConfig() {
  const missing = [];
  const detected = [];

  for (const [key, val] of Object.entries(keyMapping)) {
    if (
      !val ||
      typeof val !== "string" ||
      val.trim() === "" ||
      val.includes("your_") ||
      val.includes("your-project-id")
    ) {
      missing.push(key);
    } else {
      detected.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    detected,
  };
}

const validation = validateFirebaseConfig();

let app = null;
let auth = null;
let db = null;

if (!validation.isValid) {
  // Clear warning showing missing variable names and exact environment instructions
  console.warn(
    `[GateApass Firebase Initialization Warning]: Missing required environment variables:\n` +
      validation.missing.map((key) => `  - ${key}`).join("\n") +
      `\n\nSetup Instructions:` +
      `\n• Local Development: Ensure .env.local defines these keys.` +
      `\n• Production (Vercel): Add these keys in Vercel Dashboard > Project Settings > Environment Variables, then redeploy.`
  );
} else {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Ensure session persistence across browser reloads and tabs
    if (typeof window !== "undefined" && auth) {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("[GateApass Firebase] Auth persistence notice:", err);
      });
    }
  } catch (error) {
    console.error(
      `[GateApass Firebase Initialization Error]: Failed to initialize Firebase app: ${error?.message || error}`
    );
  }
}

export const isFirebaseConfigured = Boolean(auth && db);
export { app, auth, db };
export default app;
