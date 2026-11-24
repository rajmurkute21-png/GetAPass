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

// Direct static property access for robust bundler variable replacement.
// Vite statically replaces import.meta.env.VITE_* during production builds.
// Safe guard ensures zero crashes when executed in Node test environments.
export const firebaseConfig = {
  apiKey:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_API_KEY
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_API_KEY
      : "") ||
    "",
  authDomain:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_AUTH_DOMAIN
      : "") ||
    "",
  projectId:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_PROJECT_ID
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_PROJECT_ID
      : "") ||
    "",
  storageBucket:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_STORAGE_BUCKET
      : "") ||
    "",
  messagingSenderId:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
      : "") ||
    "",
  appId:
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_FIREBASE_APP_ID
      : "") ||
    (typeof process !== "undefined" && process.env
      ? process.env.VITE_FIREBASE_APP_ID
      : "") ||
    "",
};

/**
 * Validates the presence of required Firebase environment variables.
 * Never logs or returns variable values to protect sensitive secrets.
 */
export function validateFirebaseConfig(config = firebaseConfig) {
  const missing = [];
  const detected = [];

  const keyMapping = {
    VITE_FIREBASE_API_KEY: config.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
    VITE_FIREBASE_PROJECT_ID: config.projectId,
    VITE_FIREBASE_STORAGE_BUCKET: config.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
    VITE_FIREBASE_APP_ID: config.appId,
  };

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

export const validation = validateFirebaseConfig();

let app = null;
let auth = null;
let db = null;

if (!validation.isValid) {
  // Clear warning showing missing variable names and exact environment instructions
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      `[GateApass Firebase Initialization Notice]: Incomplete Firebase environment configuration.\n` +
        `Missing Keys: ${validation.missing.join(", ")}\n\n` +
        `Setup Instructions:\n` +
        `• Local Development: Define these keys in your .env.local file.\n` +
        `• Vercel (Production/Preview): Add these keys under Project Settings > Environment Variables, then redeploy.`
    );
  }
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

export function getFirebaseConfigStatus() {
  return validateFirebaseConfig();
}

export const isFirebaseConfigured = Boolean(auth && db);
export { app, auth, db };
export default app;
