import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * GateApass — Firebase Client Configuration
 *
 * Values are read strictly from Vite environment variables (import.meta.env.VITE_*).
 * No configuration values are hard-coded in source code.
 */

const REQUIRED_CONFIG_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const getEnv = () => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env;
  }
  return {};
};

/**
 * Validates the presence of required Firebase environment variables.
 * Never logs or returns variable values to protect sensitive secrets.
 */
export function validateFirebaseConfig() {
  const env = getEnv();
  const missing = [];
  const detected = [];

  for (const key of REQUIRED_CONFIG_KEYS) {
    const val = env[key];
    if (!val || typeof val !== "string" || val.trim() === "") {
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

const env = getEnv();

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const validation = validateFirebaseConfig();

let app = null;
let auth = null;

if (!validation.isValid) {
  // Clear development warning showing ONLY missing variable names
  console.error(
    `[GateApass Firebase Configuration Warning]: Missing required environment variables:\n` +
      validation.missing.map((key) => `  - ${key}`).join("\n") +
      `\nPlease ensure .env.local in the project root defines all required VITE_FIREBASE_* variables.`
  );
} else {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error(
      `[GateApass Firebase Initialization Error]: Failed to initialize Firebase app: ${error?.message || error}`
    );
  }
}

export { app, auth };
export default app;
