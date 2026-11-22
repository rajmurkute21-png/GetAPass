/**
 * GetAPass — Phase 2: User and Role Management Automated Verification Suite
 *
 * Verifies all Phase 2 requirements:
 * 1. Exactly four roles: admin, organizer, verifier, participant.
 * 2. Role permission helpers & matrices.
 * 3. ProtectedRoute gating (Auth, Email Verification, Allowed Roles, Direct URL access).
 * 4. User and role service (admin-only role assignment, non-admin rejection, client non-elevation).
 * 5. Pass verification & turnstile check-in (Verifier permissions).
 * 6. Firestore security rules simulations for all 4 roles.
 */

import { ROLES, ALL_ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_LABELS } from '../src/constants/roles.js';
import {
  getUserRole,
  hasRole,
  hasPermission,
  canManagePlatform,
  canAssignRoles,
  canCreateEvents,
  canManageEvents,
  canAccessAdminDashboard,
  canAccessOrganizerDashboard,
  canAccessVerifierPortal,
  canValidatePasses,
  isVerifier,
  isParticipantOnly,
  canBookEvents
} from '../src/services/permissionService.js';
import { assignUserRole, updateUserProfile, sanitizeUserProfile } from '../src/services/userService.js';
import { verifyAndCheckinPass } from '../src/services/bookingService.js';

let passed = 0;
let failed = 0;
let checkIndex = 0;

function assert(condition, description) {
  checkIndex++;
  if (condition) {
    passed++;
    console.log(`  [PASS] #${checkIndex}: ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] #${checkIndex}: ${description}`);
  }
}

console.log('================================================================');
console.log('🛡️ GETAPASS PHASE 2: FOUR-ROLE & ACCESS CONTROL VERIFICATION');
console.log('================================================================\n');

// Mock User Objects for the 4 Roles
const adminUser = {
  uid: 'usr_admin_001',
  name: 'Platform Admin',
  email: 'admin@gateapass.com',
  role: ROLES.ADMIN,
  isAdmin: true,
  isEmailVerified: true
};

const organizerUser = {
  uid: 'usr_org_001',
  name: 'Event Organizer',
  email: 'organizer@campus.edu',
  role: ROLES.ORGANIZER,
  isOrganizer: true,
  isEmailVerified: true
};

const verifierUser = {
  uid: 'usr_ver_001',
  name: 'Gate Verifier',
  email: 'verifier@campus.edu',
  role: ROLES.VERIFIER,
  isVerifier: true,
  isEmailVerified: true
};

const participantUser = {
  uid: 'usr_part_001',
  name: 'Participant Alex',
  email: 'alex@student.edu',
  role: ROLES.PARTICIPANT,
  isEmailVerified: true
};

const unverifiedParticipant = {
  uid: 'usr_part_unverified',
  name: 'Unverified Sam',
  email: 'sam@student.edu',
  role: ROLES.PARTICIPANT,
  isEmailVerified: false,
  isGoogle: false
};

const eventOwnedByOrg = {
  id: 'ev_101',
  title: 'HackSprint 2026',
  organizerUid: 'usr_org_001',
  status: 'Active'
};

const eventOwnedByOther = {
  id: 'ev_102',
  title: 'RoboWars 2026',
  organizerUid: 'usr_org_999',
  status: 'Active'
};

// =========================================================================
// SECTION 1: Exact 4 Roles & Permission Matrix
// =========================================================================
console.log('--- SECTION 1: Exact 4 Roles & Permission Matrix ---');

assert(ALL_ROLES.length === 4, 'Exactly four roles defined in ALL_ROLES');
assert(ALL_ROLES.includes('admin'), 'Roles include "admin"');
assert(ALL_ROLES.includes('organizer'), 'Roles include "organizer"');
assert(ALL_ROLES.includes('verifier'), 'Roles include "verifier"');
assert(ALL_ROLES.includes('participant'), 'Roles include "participant"');
assert(ROLE_LABELS[ROLES.ADMIN] !== undefined, 'Human-readable label exists for Admin');
assert(ROLE_LABELS[ROLES.ORGANIZER] !== undefined, 'Human-readable label exists for Organizer');
assert(ROLE_LABELS[ROLES.VERIFIER] !== undefined, 'Human-readable label exists for Verifier');
assert(ROLE_LABELS[ROLES.PARTICIPANT] !== undefined, 'Human-readable label exists for Participant');

// Permissions verification
assert(hasPermission(adminUser, PERMISSIONS.ASSIGN_ROLES), 'Admin has ASSIGN_ROLES permission');
assert(hasPermission(adminUser, PERMISSIONS.MANAGE_PLATFORM), 'Admin has MANAGE_PLATFORM permission');
assert(!hasPermission(organizerUser, PERMISSIONS.ASSIGN_ROLES), 'Organizer CANNOT assign roles');
assert(!hasPermission(verifierUser, PERMISSIONS.ASSIGN_ROLES), 'Verifier CANNOT assign roles');
assert(!hasPermission(participantUser, PERMISSIONS.ASSIGN_ROLES), 'Participant CANNOT assign roles');

assert(hasPermission(organizerUser, PERMISSIONS.CREATE_EVENT), 'Organizer has CREATE_EVENT permission');
assert(!hasPermission(verifierUser, PERMISSIONS.CREATE_EVENT), 'Verifier CANNOT create events');
assert(!hasPermission(participantUser, PERMISSIONS.CREATE_EVENT), 'Participant CANNOT create events');

assert(hasPermission(verifierUser, PERMISSIONS.VALIDATE_PASSES), 'Verifier has VALIDATE_PASSES permission');
assert(hasPermission(verifierUser, PERMISSIONS.CHECKIN_ATTENDEE), 'Verifier has CHECKIN_ATTENDEE permission');
assert(!hasPermission(participantUser, PERMISSIONS.VALIDATE_PASSES), 'Participant CANNOT validate passes');

assert(hasPermission(participantUser, PERMISSIONS.DISCOVER_EVENTS), 'Participant can discover events');
assert(hasPermission(participantUser, PERMISSIONS.BOOK_TICKETS), 'Participant can book tickets');
assert(hasPermission(participantUser, PERMISSIONS.MANAGE_OWN_PROFILE), 'Participant can manage own profile');

// =========================================================================
// SECTION 2: Role Authorization Helper Functions
// =========================================================================
console.log('\n--- SECTION 2: Role Authorization Helper Functions ---');

// Admin Capabilities
assert(canManagePlatform(adminUser) === true, 'Admin can manage platform');
assert(canAssignRoles(adminUser) === true, 'Admin can assign roles');
assert(canAccessAdminDashboard(adminUser) === true, 'Admin can access Admin Dashboard');
assert(canAccessOrganizerDashboard(adminUser) === true, 'Admin can access Organizer Studio');
assert(canAccessVerifierPortal(adminUser) === true, 'Admin can access Verifier Portal');
assert(canCreateEvents(adminUser) === true, 'Admin can create campus events');
assert(canManageEvents(adminUser, eventOwnedByOrg) === true, 'Admin can manage any event (1)');
assert(canManageEvents(adminUser, eventOwnedByOther) === true, 'Admin can manage any event (2)');
assert(canValidatePasses(adminUser, eventOwnedByOrg) === true, 'Admin can validate passes for any event');

// Organizer Capabilities
assert(canManagePlatform(organizerUser) === false, 'Organizer CANNOT manage platform');
assert(canAssignRoles(organizerUser) === false, 'Organizer CANNOT assign roles');
assert(canAccessAdminDashboard(organizerUser) === false, 'Organizer CANNOT access Admin Dashboard');
assert(canAccessOrganizerDashboard(organizerUser) === true, 'Organizer can access Organizer Studio');
assert(canAccessVerifierPortal(organizerUser) === true, 'Organizer can access Verifier Portal');
assert(canCreateEvents(organizerUser) === true, 'Organizer can create campus events');
assert(canManageEvents(organizerUser, eventOwnedByOrg) === true, 'Organizer CAN manage own event');
assert(canManageEvents(organizerUser, eventOwnedByOther) === false, 'Organizer CANNOT manage other organizer event');
assert(canValidatePasses(organizerUser, eventOwnedByOrg) === true, 'Organizer can validate passes for own event');
assert(canValidatePasses(organizerUser, eventOwnedByOther) === false, 'Organizer CANNOT validate passes for other event');

// Verifier Capabilities
assert(canManagePlatform(verifierUser) === false, 'Verifier CANNOT manage platform');
assert(canAssignRoles(verifierUser) === false, 'Verifier CANNOT assign roles');
assert(canAccessAdminDashboard(verifierUser) === false, 'Verifier CANNOT access Admin Dashboard');
assert(canAccessOrganizerDashboard(verifierUser) === false, 'Verifier CANNOT access Organizer Studio');
assert(canAccessVerifierPortal(verifierUser) === true, 'Verifier CAN access Verifier Portal');
assert(canCreateEvents(verifierUser) === false, 'Verifier CANNOT create campus events');
assert(canManageEvents(verifierUser, eventOwnedByOrg) === false, 'Verifier CANNOT manage events');
assert(canValidatePasses(verifierUser, eventOwnedByOrg) === true, 'Verifier CAN validate passes');
assert(isVerifier(verifierUser) === true, 'isVerifier helper accurately recognizes verifier');

// Participant Capabilities
assert(canManagePlatform(participantUser) === false, 'Participant CANNOT manage platform');
assert(canAssignRoles(participantUser) === false, 'Participant CANNOT assign roles');
assert(canAccessAdminDashboard(participantUser) === false, 'Participant CANNOT access Admin Dashboard');
assert(canAccessOrganizerDashboard(participantUser) === false, 'Participant CANNOT access Organizer Studio');
assert(canAccessVerifierPortal(participantUser) === false, 'Participant CANNOT access Verifier Portal');
assert(canCreateEvents(participantUser) === false, 'Participant CANNOT create campus events');
assert(canManageEvents(participantUser, eventOwnedByOrg) === false, 'Participant CANNOT manage events');
assert(canValidatePasses(participantUser, eventOwnedByOrg) === false, 'Participant CANNOT validate passes');
assert(isParticipantOnly(participantUser) === true, 'isParticipantOnly accurately recognizes participant');
assert(canBookEvents(participantUser) === true, 'Verified participant CAN book events');
assert(canBookEvents(unverifiedParticipant) === false, 'Unverified participant CANNOT book events');

// =========================================================================
// SECTION 3: Direct URL Access & ProtectedRoute Simulation
// =========================================================================
console.log('\n--- SECTION 3: Direct URL Access & ProtectedRoute Simulation ---');

/**
 * Simulates ProtectedRoute authorization outcome for a given route and user
 * Returns: 'AUTHORIZED' | 'SIGN_IN_REQUIRED' | 'EMAIL_VERIFICATION_REQUIRED' | 'ACCESS_RESTRICTED'
 */
function simulateProtectedRoute({ route, user, requireVerifiedEmail = true }) {
  const routeRoleMap = {
    '/admin': ['admin'],
    '/organizer': ['admin', 'organizer'],
    '/verifier': ['admin', 'organizer', 'verifier'],
    '/profile': ['admin', 'organizer', 'verifier', 'participant'],
    '/events': null // public
  };

  const allowedRoles = routeRoleMap[route];

  // Public route
  if (!allowedRoles) {
    return 'AUTHORIZED';
  }

  // 1. Unauthenticated check
  if (!user) {
    return 'SIGN_IN_REQUIRED';
  }

  // 2. Email verification check
  if (requireVerifiedEmail && !user.isEmailVerified && !user.isGoogle) {
    return 'EMAIL_VERIFICATION_REQUIRED';
  }

  // 3. Role authorization check
  if (!hasRole(user, allowedRoles)) {
    return 'ACCESS_RESTRICTED';
  }

  return 'AUTHORIZED';
}

// Unauthenticated direct URL visits
assert(simulateProtectedRoute({ route: '/events', user: null }) === 'AUTHORIZED', 'Visitor can directly access /events (public)');
assert(simulateProtectedRoute({ route: '/admin', user: null }) === 'SIGN_IN_REQUIRED', 'Visitor directly accessing /admin receives Sign In prompt');
assert(simulateProtectedRoute({ route: '/organizer', user: null }) === 'SIGN_IN_REQUIRED', 'Visitor directly accessing /organizer receives Sign In prompt');
assert(simulateProtectedRoute({ route: '/verifier', user: null }) === 'SIGN_IN_REQUIRED', 'Visitor directly accessing /verifier receives Sign In prompt');
assert(simulateProtectedRoute({ route: '/profile', user: null }) === 'SIGN_IN_REQUIRED', 'Visitor directly accessing /profile receives Sign In prompt');

// Participant direct URL visits
assert(simulateProtectedRoute({ route: '/events', user: participantUser }) === 'AUTHORIZED', 'Participant directly accessing /events is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/profile', user: participantUser }) === 'AUTHORIZED', 'Participant directly accessing /profile is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/admin', user: participantUser }) === 'ACCESS_RESTRICTED', 'Participant directly accessing /admin is ACCESS_RESTRICTED');
assert(simulateProtectedRoute({ route: '/organizer', user: participantUser }) === 'ACCESS_RESTRICTED', 'Participant directly accessing /organizer is ACCESS_RESTRICTED');
assert(simulateProtectedRoute({ route: '/verifier', user: participantUser }) === 'ACCESS_RESTRICTED', 'Participant directly accessing /verifier is ACCESS_RESTRICTED');

// Verifier direct URL visits
assert(simulateProtectedRoute({ route: '/events', user: verifierUser }) === 'AUTHORIZED', 'Verifier directly accessing /events is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/profile', user: verifierUser }) === 'AUTHORIZED', 'Verifier directly accessing /profile is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/verifier', user: verifierUser }) === 'AUTHORIZED', 'Verifier directly accessing /verifier is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/organizer', user: verifierUser }) === 'ACCESS_RESTRICTED', 'Verifier directly accessing /organizer is ACCESS_RESTRICTED');
assert(simulateProtectedRoute({ route: '/admin', user: verifierUser }) === 'ACCESS_RESTRICTED', 'Verifier directly accessing /admin is ACCESS_RESTRICTED');

// Organizer direct URL visits
assert(simulateProtectedRoute({ route: '/events', user: organizerUser }) === 'AUTHORIZED', 'Organizer directly accessing /events is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/profile', user: organizerUser }) === 'AUTHORIZED', 'Organizer directly accessing /profile is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/organizer', user: organizerUser }) === 'AUTHORIZED', 'Organizer directly accessing /organizer is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/verifier', user: organizerUser }) === 'AUTHORIZED', 'Organizer directly accessing /verifier is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/admin', user: organizerUser }) === 'ACCESS_RESTRICTED', 'Organizer directly accessing /admin is ACCESS_RESTRICTED');

// Admin direct URL visits
assert(simulateProtectedRoute({ route: '/events', user: adminUser }) === 'AUTHORIZED', 'Admin directly accessing /events is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/profile', user: adminUser }) === 'AUTHORIZED', 'Admin directly accessing /profile is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/verifier', user: adminUser }) === 'AUTHORIZED', 'Admin directly accessing /verifier is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/organizer', user: adminUser }) === 'AUTHORIZED', 'Admin directly accessing /organizer is AUTHORIZED');
assert(simulateProtectedRoute({ route: '/admin', user: adminUser }) === 'AUTHORIZED', 'Admin directly accessing /admin is AUTHORIZED');

// Unverified email/password account direct URL visit
assert(simulateProtectedRoute({ route: '/admin', user: unverifiedParticipant }) === 'EMAIL_VERIFICATION_REQUIRED', 'Unverified account receives Email Verification Required prompt');
assert(simulateProtectedRoute({ route: '/profile', user: unverifiedParticipant }) === 'EMAIL_VERIFICATION_REQUIRED', 'Unverified account on /profile receives Email Verification Required prompt');

// =========================================================================
// SECTION 4: User & Role Service Security
// =========================================================================
console.log('\n--- SECTION 4: User & Role Service Security ---');

// Non-admin assigning role
let caughtNonAdminError = false;
try {
  await assignUserRole('usr_target_001', 'organizer', participantUser);
} catch (err) {
  caughtNonAdminError = true;
  assert(err.message.includes('Only platform administrators'), 'Participant role assignment blocked with unauthorized message');
}
assert(caughtNonAdminError, 'Participant CANNOT assign user roles');

let caughtOrgAssignError = false;
try {
  await assignUserRole('usr_target_001', 'organizer', organizerUser);
} catch (err) {
  caughtOrgAssignError = true;
  assert(err.message.includes('Only platform administrators'), 'Organizer role assignment blocked with unauthorized message');
}
assert(caughtOrgAssignError, 'Organizer CANNOT assign user roles');

// Admin assigning invalid role
let caughtInvalidRoleError = false;
try {
  await assignUserRole('usr_target_001', 'superadmin_elevated', adminUser);
} catch (err) {
  caughtInvalidRoleError = true;
  assert(err.message.includes('Invalid role'), 'Assigning invalid role rejected with validation error');
}
assert(caughtInvalidRoleError, 'Assigning non-existent role rejected');

// Profile update stripping role (prevents self-elevation)
const updateResult = sanitizeUserProfile({
  name: 'Alex Student',
  role: 'admin', // Attack attempt: client sending role: 'admin'
  college: 'Campus Tech',
  uid: 'spoofed_uid',
  createdAt: 0
});

assert(updateResult.name === 'Alex Student', 'Profile name updated');
assert(updateResult.college === 'Campus Tech', 'Profile college updated');
assert(updateResult.role === undefined, 'sanitizeUserProfile STRIPS role field to prevent self-elevation');
assert(updateResult.uid === undefined, 'sanitizeUserProfile STRIPS uid field to prevent identity tampering');
assert(updateResult.createdAt === undefined, 'sanitizeUserProfile STRIPS createdAt field to preserve registration time');

// Non-self profile update rejection
let caughtNonSelfError = false;
try {
  await updateUserProfile('usr_other_person', { name: 'Tampered' }, participantUser);
} catch (err) {
  caughtNonSelfError = true;
  assert(err.message.includes('You can only update your own profile'), 'Non-self profile update rejected with unauthorized error');
}
assert(caughtNonSelfError, 'Participant CANNOT update another user profile');

// =========================================================================
// SECTION 5: Turnstile Pass Verification & Check-in Logic
// =========================================================================
console.log('\n--- SECTION 5: Turnstile Pass Verification & Check-in Logic ---');

// Participant attempting to validate passes
let caughtParticipantVerifyError = false;
try {
  await verifyAndCheckinPass({
    passCode: 'GP-TF26-9481',
    eventId: 'ev_101',
    verifierUser: participantUser,
    gate: 'Gate A'
  });
} catch (err) {
  caughtParticipantVerifyError = true;
  assert(err.message.includes('Unauthorized'), 'Participant pass validation blocked with unauthorized error');
}
assert(caughtParticipantVerifyError, 'Participant CANNOT execute turnstile pass validation');

// Missing pass code
const emptyCheck = await verifyAndCheckinPass({
  passCode: '',
  eventId: 'ev_101',
  verifierUser: verifierUser
});
assert(emptyCheck.valid === false, 'Empty pass code correctly rejected');

// Verifier validation authorized
const validCheck = await verifyAndCheckinPass({
  passCode: 'PASS-DEMO-2026',
  eventId: null,
  verifierUser: verifierUser,
  gate: 'Gate A'
});
// (Will return not found or local pass since offline, but MUST NOT throw Unauthorized)
assert(validCheck.valid !== undefined, 'Verifier successfully authorized to execute pass validation without unauthorized error');

// =========================================================================
// SECTION 6: Firestore Security Rules Direct Simulation (All 4 Roles)
// =========================================================================
console.log('\n--- SECTION 6: Firestore Security Rules Direct Simulation ---');

/**
 * Simulates firestore.rules for /users/{userId} update:
 * allow update: if isAuthenticated() && (
 *   (isAdmin() && (!('role' in request.resource.data) || request.resource.data.role in ['admin', 'organizer', 'verifier', 'participant'])) ||
 *   (request.auth.uid == userId && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role))
 * );
 */
function simulateUserUpdateRule(authActor, resourceData, requestResourceData) {
  if (!authActor) return false;
  const isAdminActor = authActor.role === 'admin' || authActor.isAdmin;
  const isSelf = authActor.uid === resourceData.uid;

  if (isAdminActor) {
    if (!('role' in requestResourceData)) return true;
    return ['admin', 'organizer', 'verifier', 'participant'].includes(requestResourceData.role);
  }

  if (isSelf) {
    if (!('role' in requestResourceData)) return true;
    return requestResourceData.role === resourceData.role;
  }

  return false;
}

assert(
  simulateUserUpdateRule(participantUser, { uid: participantUser.uid, role: 'participant' }, { name: 'Alex M' }) === true,
  'Firestore Rule: Participant updating own name without changing role is ALLOWED'
);
assert(
  simulateUserUpdateRule(participantUser, { uid: participantUser.uid, role: 'participant' }, { role: 'admin' }) === false,
  'Firestore Rule: Participant attempting to change own role to admin is REJECTED'
);
assert(
  simulateUserUpdateRule(participantUser, { uid: participantUser.uid, role: 'participant' }, { role: 'organizer' }) === false,
  'Firestore Rule: Participant attempting to change own role to organizer is REJECTED'
);
assert(
  simulateUserUpdateRule(organizerUser, { uid: 'usr_part_001', role: 'participant' }, { role: 'organizer' }) === false,
  'Firestore Rule: Organizer attempting to elevate another user is REJECTED'
);
assert(
  simulateUserUpdateRule(adminUser, { uid: 'usr_part_001', role: 'participant' }, { role: 'verifier' }) === true,
  'Firestore Rule: Admin assigning verifier role to user is ALLOWED'
);
assert(
  simulateUserUpdateRule(adminUser, { uid: 'usr_part_001', role: 'participant' }, { role: 'organizer' }) === true,
  'Firestore Rule: Admin assigning organizer role to user is ALLOWED'
);
assert(
  simulateUserUpdateRule(adminUser, { uid: 'usr_part_001', role: 'participant' }, { role: 'superuser_hacked' }) === false,
  'Firestore Rule: Admin assigning invalid role value is REJECTED by rule constraint'
);

/**
 * Simulates firestore.rules for /bookings/{bookingId} update:
 * allow update: if isAuthenticated() && (
 *   isAdmin() ||
 *   (organizerUid == request.auth.uid && ...) ||
 *   (isVerifier() && request.resource.data.organizerUid == resource.data.organizerUid && request.resource.data.amount == resource.data.amount ...)
 * );
 */
function simulateBookingUpdateRule(authActor, resourceData, requestResourceData) {
  if (!authActor) return false;
  const isAdminActor = authActor.role === 'admin' || authActor.isAdmin;
  if (isAdminActor) return true;

  const isOrg = (authActor.role === 'organizer' || authActor.isOrganizer) && resourceData.organizerUid === authActor.uid;
  if (isOrg) {
    return (
      requestResourceData.organizerUid === resourceData.organizerUid &&
      requestResourceData.participantUid === resourceData.participantUid
    );
  }

  const isVer = authActor.role === 'verifier' || authActor.isVerifier;
  if (isVer) {
    return (
      requestResourceData.organizerUid === resourceData.organizerUid &&
      requestResourceData.participantUid === resourceData.participantUid &&
      requestResourceData.amount === resourceData.amount
    );
  }

  return false;
}

const sampleBooking = {
  bookingId: 'BK-1001',
  eventId: 'ev_101',
  organizerUid: 'usr_org_001',
  participantUid: 'usr_part_001',
  amount: 299,
  status: 'Active',
  checkedIn: false
};

assert(
  simulateBookingUpdateRule(verifierUser, sampleBooking, { ...sampleBooking, checkedIn: true, status: 'Used' }) === true,
  'Firestore Rule: Verifier checking in pass (updating status/checkedIn) is ALLOWED'
);
assert(
  simulateBookingUpdateRule(verifierUser, sampleBooking, { ...sampleBooking, amount: 0 }) === false,
  'Firestore Rule: Verifier attempting to modify booking financial amount is REJECTED'
);
assert(
  simulateBookingUpdateRule(verifierUser, sampleBooking, { ...sampleBooking, organizerUid: 'usr_attacker' }) === false,
  'Firestore Rule: Verifier attempting to tamper with organizerUid is REJECTED'
);
assert(
  simulateBookingUpdateRule(participantUser, sampleBooking, { ...sampleBooking, checkedIn: true }) === false,
  'Firestore Rule: Participant attempting to check-in their own pass is REJECTED'
);
assert(
  simulateBookingUpdateRule(organizerUser, sampleBooking, { ...sampleBooking, checkedIn: true }) === true,
  'Firestore Rule: Organizer checking in pass for their own event is ALLOWED'
);

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed}/${passed} PHASE 2 FOUR-ROLE & ACCESS CONTROL CHECKS PASSED!`);
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ FAILED: ${failed} assertions failed. (${passed} passed)`);
  process.exit(1);
}
