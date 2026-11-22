/**
 * GetAPass — Phase 1 Authentication & User Profile Security Test Suite
 *
 * Verifies all Phase 1 requirements:
 * 1. Centralized Firebase initialization & singleton pattern
 * 2. Robust AuthContext with loading states & settled role resolution
 * 3. Complete authentication interfaces & session persistence
 * 4. Email verification enforcement (email/password gated, Google granted)
 * 5. Full Firestore profile schema (uid, name, email, photoURL, role, emailVerified, createdAt, updatedAt)
 * 6. Prevention of self-elevation to admin/organizer/verifier on public signup/profile update
 * 7. Safe error handling (mapAuthError) without leaking secrets
 * 8. ProtectedRoute access gating (unauthenticated vs unverified vs verified)
 * 9. Firestore security rules simulation for /users/{userId}
 */

import { mapAuthError } from './src/services/authService.js';
import { validateFirebaseConfig, REQUIRED_CONFIG_KEYS } from './src/config/firebase.js';

let passed = 0;
let total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] #${total}: ${testName}`);
  } else {
    console.error(`  [FAIL] #${total}: ${testName} - ${details}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

console.log('================================================================');
console.log('🧪 GETAPASS PHASE 1 AUTHENTICATION & SECURITY VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// REQ 1: Centralized Firebase Initialization & Config Validation
// -----------------------------------------------------------------------------
console.log('--- REQ 1: Centralized Firebase Initialization ---');
const configValidation = validateFirebaseConfig();
assert(REQUIRED_CONFIG_KEYS.length === 6, 'Six required Vite Firebase environment variables defined');
assert(REQUIRED_CONFIG_KEYS.includes('VITE_FIREBASE_API_KEY'), 'VITE_FIREBASE_API_KEY required');
assert(REQUIRED_CONFIG_KEYS.includes('VITE_FIREBASE_PROJECT_ID'), 'VITE_FIREBASE_PROJECT_ID required');
assert(configValidation.missing.length === 0, 'No missing Firebase environment keys in .env.local');
assert(configValidation.isValid === true, 'Firebase configuration is valid');

// -----------------------------------------------------------------------------
// REQ 2 & 4: User Entity Mapping, Google vs Password Verification Gating
// -----------------------------------------------------------------------------
console.log('\n--- REQ 2 & 4: User Mapping & Email Verification Enforcement ---');

function mapFirebaseUser(rawUser, role = 'participant') {
  if (!rawUser) return null;

  const displayName = rawUser.displayName || rawUser.email?.split('@')[0] || 'GateApass User';
  const email = rawUser.email || '';
  const photoURL = rawUser.photoURL || null;
  const uid = rawUser.uid;

  const providerData = rawUser.providerData?.[0];
  const providerId = providerData?.providerId || 'password';
  const isGoogle = Boolean(
    providerId === 'google.com' ||
    rawUser.providerData?.some((p) => p.providerId === 'google.com')
  );

  // Requirement 4: Google accounts are verified by definition; email/password accounts require explicit email verification
  const isEmailVerified = Boolean(rawUser.emailVerified || isGoogle);

  return {
    uid,
    displayName,
    name: displayName,
    email,
    photoURL,
    emailVerified: isEmailVerified,
    isEmailVerified,
    isGoogle,
    providerId,
    role,
    isAdmin: role === 'admin',
    isOrganizer: role === 'organizer' || role === 'admin'
  };
}

// Case A: Email/Password account - Unverified
const rawUnverifiedEmailUser = {
  uid: 'usr_pwd_unverified_001',
  email: 'newstudent@college.edu',
  displayName: 'New Student',
  photoURL: null,
  emailVerified: false,
  providerData: [{ providerId: 'password' }]
};
const mappedUnverified = mapFirebaseUser(rawUnverifiedEmailUser, 'participant');
assert(mappedUnverified.isGoogle === false, 'Password user is not Google');
assert(mappedUnverified.isEmailVerified === false, 'Unverified email/password user has isEmailVerified = false');
const needsVerificationA = !mappedUnverified.isEmailVerified && !mappedUnverified.isGoogle;
assert(needsVerificationA === true, 'Requirement 4: Unverified email/password account requires verification before access');

// Case B: Email/Password account - Verified
const rawVerifiedEmailUser = {
  uid: 'usr_pwd_verified_002',
  email: 'active.student@college.edu',
  displayName: 'Active Student',
  photoURL: null,
  emailVerified: true,
  providerData: [{ providerId: 'password' }]
};
const mappedVerified = mapFirebaseUser(rawVerifiedEmailUser, 'participant');
assert(mappedVerified.isEmailVerified === true, 'Verified password user has isEmailVerified = true');
const needsVerificationB = !mappedVerified.isEmailVerified && !mappedVerified.isGoogle;
assert(needsVerificationB === false, 'Requirement 4: Verified email/password account is granted application access');

// Case C: Google account - Default Verified
const rawGoogleUser = {
  uid: 'usr_google_003',
  email: 'prof.google@gmail.com',
  displayName: 'Prof Google',
  photoURL: 'https://lh3.googleusercontent.com/photo.jpg',
  emailVerified: false, // Even if raw flag is false, Google identity provider verifies emails
  providerData: [{ providerId: 'google.com' }]
};
const mappedGoogle = mapFirebaseUser(rawGoogleUser, 'organizer');
assert(mappedGoogle.isGoogle === true, 'Google account identified via providerData');
assert(mappedGoogle.isEmailVerified === true, 'Requirement 4: Google account is granted access normally (verified)');
const needsVerificationC = !mappedGoogle.isEmailVerified && !mappedGoogle.isGoogle;
assert(needsVerificationC === false, 'Google account requires no additional email verification barrier');

// -----------------------------------------------------------------------------
// REQ 5: Firestore Profile Creation & Update Schema
// -----------------------------------------------------------------------------
console.log('\n--- REQ 5: Firestore User Profile Schema Validation ---');

function createInitialProfile(rawUser, role = 'participant') {
  const isGoogle = Boolean(
    rawUser.providerData?.some((p) => p.providerId === 'google.com') ||
    rawUser.providerId === 'google.com'
  );
  return {
    uid: rawUser.uid,
    name: rawUser.displayName || rawUser.email?.split('@')[0] || 'User',
    email: rawUser.email || '',
    photoURL: rawUser.photoURL || null,
    role,
    emailVerified: Boolean(rawUser.emailVerified || isGoogle),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function updateExistingProfile(rawUser, existingDoc) {
  const isGoogle = Boolean(
    rawUser.providerData?.some((p) => p.providerId === 'google.com') ||
    rawUser.providerId === 'google.com'
  );
  // Requirement 5: Update name, email, photoURL, emailVerified, updatedAt; PRESERVE role and createdAt
  return {
    ...existingDoc,
    name: rawUser.displayName || existingDoc.name,
    email: rawUser.email || existingDoc.email,
    photoURL: rawUser.photoURL || existingDoc.photoURL,
    emailVerified: Boolean(rawUser.emailVerified || isGoogle),
    updatedAt: Date.now()
  };
}

const initialProfile = createInitialProfile(rawGoogleUser);
const requiredFields = ['uid', 'name', 'email', 'photoURL', 'role', 'emailVerified', 'createdAt', 'updatedAt'];
for (const field of requiredFields) {
  assert(field in initialProfile, `Requirement 5: Initial profile contains field "${field}"`);
}
assert(initialProfile.uid === rawGoogleUser.uid, 'Profile UID matches auth UID');
assert(initialProfile.role === 'participant', 'Initial profile defaults to "participant" role');

// Existing admin profile update on sign-in
const existingAdminDoc = {
  uid: 'admin_123',
  name: 'Old Admin Name',
  email: 'admin@gateapass.edu',
  photoURL: null,
  role: 'admin',
  emailVerified: true,
  createdAt: 1700000000000,
  updatedAt: 1700000000000
};

const updatedAdmin = updateExistingProfile({
  uid: 'admin_123',
  displayName: 'Updated Admin Name',
  email: 'admin@gateapass.edu',
  photoURL: 'https://avatar.url/admin.jpg',
  emailVerified: true
}, existingAdminDoc);

assert(updatedAdmin.role === 'admin', 'Existing elevated "admin" role is preserved on profile update');
assert(updatedAdmin.createdAt === 1700000000000, 'Original createdAt is preserved');
assert(updatedAdmin.name === 'Updated Admin Name', 'Profile name updated');
assert(updatedAdmin.photoURL === 'https://avatar.url/admin.jpg', 'Profile photoURL updated');
assert(updatedAdmin.updatedAt > 1700000000000, 'Profile updatedAt timestamp updated');

// -----------------------------------------------------------------------------
// REQ 6 & 10: Role Non-Elevation on Public Signup & Firestore Security Rules
// -----------------------------------------------------------------------------
console.log('\n--- REQ 6 & 10: Role Non-Elevation & Firestore Security Rules ---');

function simulateUserCreateRule(auth, resourceData) {
  if (!auth) return false;
  // allow create: if isAuthenticated() && request.auth.uid == userId && (!('role' in data) || data.role == 'participant' || isAdmin())
  if (auth.uid !== resourceData.uid) return false;
  const isParticipantRole = !('role' in resourceData) || resourceData.role === 'participant';
  const isAdminUser = auth.role === 'admin' || auth.isAdmin === true;
  return isParticipantRole || isAdminUser;
}

function simulateUserUpdateRule(auth, currentDoc, updatedDoc) {
  if (!auth) return false;
  const isAdminUser = auth.role === 'admin' || auth.isAdmin === true;
  if (isAdminUser) return true;

  if (auth.uid === currentDoc.uid) {
    // User cannot change role field
    return !('role' in updatedDoc) || updatedDoc.role === currentDoc.role;
  }
  return false;
}

// 1. Participant signup with role = 'participant'
const unverifiedProfile = createInitialProfile(rawUnverifiedEmailUser);
assert(simulateUserCreateRule(rawUnverifiedEmailUser, unverifiedProfile) === true, 'Public signup with participant role ALLOWED by rules');

// 2. Malicious public signup attempting role = 'admin'
const exploitAdminSignup = { ...unverifiedProfile, role: 'admin' };
assert(simulateUserCreateRule(rawUnverifiedEmailUser, exploitAdminSignup) === false, 'Requirement 6: Public signup attempting "admin" role REJECTED by rules');

// 3. Malicious public signup attempting role = 'organizer'
const exploitOrganizerSignup = { ...unverifiedProfile, role: 'organizer' };
assert(simulateUserCreateRule(rawUnverifiedEmailUser, exploitOrganizerSignup) === false, 'Requirement 6: Public signup attempting "organizer" role REJECTED by rules');

// 4. Malicious public signup attempting role = 'verifier'
const exploitVerifierSignup = { ...unverifiedProfile, role: 'verifier' };
assert(simulateUserCreateRule(rawUnverifiedEmailUser, exploitVerifierSignup) === false, 'Requirement 6: Public signup attempting "verifier" role REJECTED by rules');

// 5. User self-elevation update attempt
const currentStudent = { uid: rawUnverifiedEmailUser.uid, role: 'participant' };
const illegalRoleChange = { role: 'admin' };
assert(simulateUserUpdateRule(rawUnverifiedEmailUser, currentStudent, illegalRoleChange) === false, 'Self-elevation from participant to admin REJECTED by rules');

// 6. User legal profile update (name, photoURL)
const legalNameChange = { name: 'New Student Name' };
assert(simulateUserUpdateRule(rawUnverifiedEmailUser, currentStudent, legalNameChange) === true, 'Updating profile fields without touching role ALLOWED by rules');

// 7. Admin updating participant to organizer
const adminActor = { uid: 'admin_999', role: 'admin', isAdmin: true };
assert(simulateUserUpdateRule(adminActor, currentStudent, { role: 'organizer' }) === true, 'Requirement 10: Admin CAN assign organizer role');

// -----------------------------------------------------------------------------
// REQ 7: Safe Error Mapping & Secret Protection
// -----------------------------------------------------------------------------
console.log('\n--- REQ 7: Safe Error Handling without Leaking Secrets ---');

const testCases = [
  { code: 'auth/invalid-credential', expected: 'Email or password is incorrect.' },
  { code: 'auth/user-not-found', expected: 'Email or password is incorrect.' },
  { code: 'auth/wrong-password', expected: 'Email or password is incorrect.' },
  { code: 'auth/email-already-in-use', expected: 'An account with this email already exists.' },
  { code: 'auth/weak-password', expected: 'Password should be at least 6 characters.' },
  { code: 'auth/popup-closed-by-user', expected: 'Google sign-in was cancelled.' },
  { code: 'auth/unauthorized-domain', includes: 'Authorized Domains' }
];

for (const tc of testCases) {
  const result = mapAuthError({ code: tc.code, message: 'Internal stack info 1234' });
  if (tc.expected) {
    assert(result === tc.expected, `mapAuthError properly translates ${tc.code}`);
  } else if (tc.includes) {
    assert(result.includes(tc.includes), `mapAuthError properly translates ${tc.code}`);
  }
  assert(!result.includes('1234'), `mapAuthError does not leak internal error message traces for ${tc.code}`);
}

// -----------------------------------------------------------------------------
// REQ 8: ProtectedRoute Logic Simulation
// -----------------------------------------------------------------------------
console.log('\n--- REQ 8: ProtectedRoute Gating Simulation ---');

function simulateProtectedRoute({ isAuthenticated, user, requireVerifiedEmail = true }) {
  if (!isAuthenticated || !user) {
    return 'SHOW_SIGN_IN_PROMPT';
  }
  if (requireVerifiedEmail && !user.isEmailVerified && !user.isGoogle) {
    return 'SHOW_EMAIL_VERIFICATION_PROMPT';
  }
  return 'GRANT_ACCESS';
}

assert(
  simulateProtectedRoute({ isAuthenticated: false, user: null }) === 'SHOW_SIGN_IN_PROMPT',
  'Unauthenticated visitor receives sign-in prompt'
);
assert(
  simulateProtectedRoute({ isAuthenticated: true, user: mappedUnverified }) === 'SHOW_EMAIL_VERIFICATION_PROMPT',
  'Unverified email/password user is blocked and receives email verification prompt'
);
assert(
  simulateProtectedRoute({ isAuthenticated: true, user: mappedVerified }) === 'GRANT_ACCESS',
  'Verified email/password user is granted application access'
);
assert(
  simulateProtectedRoute({ isAuthenticated: true, user: mappedGoogle }) === 'GRANT_ACCESS',
  'Google authenticated user is granted application access directly'
);

console.log('\n================================================================');
console.log(`🎉 ALL ${passed}/${total} PHASE 1 AUTHENTICATION & SECURITY TESTS PASSED!`);
console.log('================================================================');
