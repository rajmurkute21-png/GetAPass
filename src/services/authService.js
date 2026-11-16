import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

/**
 * GetApass — Authentication Service
 * Wraps Firebase Auth SDK functions with clean application-level interfaces
 * and user-friendly error translations.
 */

const googleProvider = new GoogleAuthProvider();
// Request standard profile and email scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Prompt user to select an account if multiple are available
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Map Firebase error codes to user-friendly messages.
 * Never exposes raw error codes, internal stack traces, or database details.
 */
export function mapAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  if (
    message.includes('Firebase Auth is not initialized') ||
    message.includes('Firebase Authentication is not initialized')
  ) {
    return 'Firebase Authentication is not initialized on this deployment. Please configure your VITE_FIREBASE_* environment variables in Vercel Project Settings and redeploy.';
  }

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This deployment domain is not authorized in Firebase. In the Firebase Console, go to Authentication > Settings > Authorized Domains and add your Vercel domain (e.g. get-a-pass-sooty.vercel.app).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Please allow popups and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily disabled; please try again later.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled in your Firebase Console. Please enable Email/Password and Google in Authentication > Sign-in method.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please log in again to continue this operation.';
    default:
      return error.message || 'Authentication failed. Please verify your details.';
  }
}

function ensureAuthInitialized() {
  if (!auth) {
    throw new Error(
      'Firebase Authentication is not initialized on this deployment. Please configure your VITE_FIREBASE_* environment variables in Vercel Project Settings and redeploy.'
    );
  }
}

/**
 * Sign up with Email and Password.
 * Updates profile display name and sends email verification.
 */
export async function signupUserWithEmail(email, password, displayName) {
  ensureAuthInitialized();

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name if provided
  if (displayName && displayName.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch {
      // Non-fatal if display name update fails
    }
  }

  // Send verification email
  let verificationSent = false;
  try {
    await sendEmailVerification(user);
    verificationSent = true;
  } catch {
    verificationSent = false;
  }

  return { user, verificationSent };
}

/**
 * Sign in with Email and Password.
 */
export async function loginUserWithEmail(email, password) {
  ensureAuthInitialized();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Google Popup.
 */
export async function loginUserWithGoogle() {
  ensureAuthInitialized();
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
}

/**
 * Sign out current user.
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Send password reset email.
 */
export async function sendUserPasswordReset(email) {
  ensureAuthInitialized();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Resend email verification link.
 */
export async function resendUserVerification(user) {
  if (!user) throw new Error('No user is currently signed in.');
  await sendEmailVerification(user);
}

/**
 * Reload user to refresh emailVerified state.
 */
export async function reloadUserState(user) {
  if (!user) return null;
  await reload(user);
  return auth?.currentUser || user;
}
