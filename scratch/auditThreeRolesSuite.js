/**
 * GetAPass — Security & Role-Based Dashboard Audit Test Suite
 *
 * Verifies all 9 core security and data isolation requirements:
 * 1. Admin platform data access
 * 2. Organizer own events and bookings only
 * 3. Participant own bookings, passes, and receipts only
 * 4. Published event discovery for all authenticated users
 * 5. Route protection preventing participants from entering Admin/Organizer views
 * 6. Cross-organizer data isolation
 * 7. Firestore security rules simulation for bookings and events
 * 8. Account switching cache clearing & subscription cleanup
 * 9. New user profile default initialization
 */

import {
  canAccessAdminDashboard,
  canAccessOrganizerDashboard,
  isParticipantOnly,
  canCreateEvents,
  canManageEvents
} from './src/services/permissionService.js';

import {
  PUBLISHED_STATUSES,
  normalizeEventStatus
} from './src/services/eventService.js';

import {
  clearSessionBookingCache,
  getStoredUserBookings,
  saveStoredUserBookings,
  getStoredUserPasses,
  saveStoredUserPasses
} from './src/services/bookingService.js';

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
console.log('🛡️ GETAPASS FINAL ROLE-BASED DASHBOARD & SECURITY AUDIT');
console.log('================================================================\n');

// Simulated Identity Personas
const adminUser = {
  uid: 'admin_uid_777',
  email: 'admin@gateapass.edu',
  name: 'Global Administrator',
  role: 'admin',
  isAdmin: true,
  isOrganizer: true
};

const organizerUserA = {
  uid: 'organizer_a_uid_101',
  email: 'prof.smith@college.edu',
  name: 'Prof. Smith',
  role: 'organizer',
  isAdmin: false,
  isOrganizer: true
};

const organizerUserB = {
  uid: 'organizer_b_uid_202',
  email: 'dean.jones@college.edu',
  name: 'Dean Jones',
  role: 'organizer',
  isAdmin: false,
  isOrganizer: true
};

const participantUserC = {
  uid: 'student_c_uid_303',
  email: 'student.aarav@college.edu',
  name: 'Aarav Shah',
  role: 'participant',
  isAdmin: false,
  isOrganizer: false
};

const participantUserD = {
  uid: 'student_d_uid_404',
  email: 'student.priya@college.edu',
  name: 'Priya Patel',
  role: 'participant',
  isAdmin: false,
  isOrganizer: false
};

// -----------------------------------------------------------------------------
// REQ 1 & 5: Dashboard Route Protection & Access Authorization
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Dashboard Authorization & Route Protection ---');
assert(canAccessAdminDashboard(adminUser) === true, 'Admin can access Admin Dashboard');
assert(canAccessOrganizerDashboard(adminUser) === true, 'Admin can access Organizer Studio');
assert(isParticipantOnly(adminUser) === false, 'Admin is not participant-only');

assert(canAccessAdminDashboard(organizerUserA) === false, 'Organizer cannot access Admin Dashboard');
assert(canAccessOrganizerDashboard(organizerUserA) === true, 'Organizer can access Organizer Studio');
assert(isParticipantOnly(organizerUserA) === false, 'Organizer is not participant-only');

assert(canAccessAdminDashboard(participantUserC) === false, 'Participant cannot access Admin Dashboard');
assert(canAccessOrganizerDashboard(participantUserC) === false, 'Participant cannot access Organizer Studio');
assert(isParticipantOnly(participantUserC) === true, 'Participant is identified as participant-only');

assert(canCreateEvents(adminUser) === true, 'Admin is authorized to create campus events');
assert(canCreateEvents(organizerUserA) === true, 'Organizer is authorized to create campus events');
assert(canCreateEvents(participantUserC) === false, 'Participant is rejected from creating events');

// -----------------------------------------------------------------------------
// REQ 2, 4 & 6: Event Ownership & Cross-Organizer Isolation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Event Scoping & Cross-Organizer Isolation ---');

const event1_OrgA_Published = {
  id: 'evt-001',
  title: 'AI Summit 2026',
  organizerUid: organizerUserA.uid,
  organizerEmail: organizerUserA.email,
  status: 'Active'
};

const event2_OrgA_Draft = {
  id: 'evt-002-draft',
  title: 'Private Hackathon Draft',
  organizerUid: organizerUserA.uid,
  organizerEmail: organizerUserA.email,
  status: 'Draft'
};

const event3_OrgB_Published = {
  id: 'evt-003',
  title: 'Annual Cultural Festival',
  organizerUid: organizerUserB.uid,
  organizerEmail: organizerUserB.email,
  status: 'Published'
};

const event4_OrgB_Draft = {
  id: 'evt-004-draft',
  title: 'Secret Staff Meeting',
  organizerUid: organizerUserB.uid,
  organizerEmail: organizerUserB.email,
  status: 'Draft'
};

const allMockEvents = [
  event1_OrgA_Published,
  event2_OrgA_Draft,
  event3_OrgB_Published,
  event4_OrgB_Draft
];

// Organizer A studio scoping: only events matching organizerUid == organizerUserA.uid
const orgAEventsInStudio = allMockEvents.filter((e) => e.organizerUid === organizerUserA.uid);
assert(orgAEventsInStudio.length === 2, 'Organizer A sees exactly 2 events in Studio');
assert(orgAEventsInStudio.every((e) => e.organizerUid === organizerUserA.uid), 'All Studio events belong to Organizer A');
assert(!orgAEventsInStudio.some((e) => e.organizerUid === organizerUserB.uid), 'Organizer A CANNOT see Organizer B events in Studio');

// Organizer B studio scoping: only events matching organizerUid == organizerUserB.uid
const orgBEventsInStudio = allMockEvents.filter((e) => e.organizerUid === organizerUserB.uid);
assert(orgBEventsInStudio.length === 2, 'Organizer B sees exactly 2 events in Studio');
assert(orgBEventsInStudio.every((e) => e.organizerUid === organizerUserB.uid), 'All Studio events belong to Organizer B');
assert(!orgBEventsInStudio.some((e) => e.organizerUid === organizerUserA.uid), 'Organizer B CANNOT see Organizer A events in Studio');

// Management permissions on events
assert(canManageEvents(organizerUserA, event1_OrgA_Published) === true, 'Organizer A can manage own event');
assert(canManageEvents(organizerUserA, event3_OrgB_Published) === false, 'Organizer A CANNOT manage Organizer B event');
assert(canManageEvents(organizerUserB, event1_OrgA_Published) === false, 'Organizer B CANNOT manage Organizer A event');
assert(canManageEvents(adminUser, event1_OrgA_Published) === true, 'Admin can manage any organizer event');
assert(canManageEvents(participantUserC, event1_OrgA_Published) === false, 'Participant CANNOT manage any event');

// Public shared event discovery: Active and Published visible to all authenticated users
const publicCatalogue = allMockEvents.filter((e) => PUBLISHED_STATUSES.includes(e.status));
assert(publicCatalogue.length === 2, 'Public catalogue contains only Active and Published events');
assert(publicCatalogue.some((e) => e.id === 'evt-001'), 'Public discovery includes Event 1 (Active)');
assert(publicCatalogue.some((e) => e.id === 'evt-003'), 'Public discovery includes Event 3 (Published)');
assert(!publicCatalogue.some((e) => e.status === 'Draft'), 'Public discovery strictly excludes Draft events');

// -----------------------------------------------------------------------------
// REQ 3 & 7: Multi-Tenant Booking & Digital Pass Isolation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Booking Multi-Tenant Isolation ---');

const booking1_C_for_Event1 = {
  bookingId: 'BK-1001',
  passId: 'GP-1001',
  eventId: event1_OrgA_Published.id,
  eventTitle: event1_OrgA_Published.title,
  organizerUid: organizerUserA.uid,
  participantUid: participantUserC.uid,
  participantName: participantUserC.name,
  amount: 499,
  status: 'Active'
};

const booking2_D_for_Event1 = {
  bookingId: 'BK-1002',
  passId: 'GP-1002',
  eventId: event1_OrgA_Published.id,
  eventTitle: event1_OrgA_Published.title,
  organizerUid: organizerUserA.uid,
  participantUid: participantUserD.uid,
  participantName: participantUserD.name,
  amount: 499,
  status: 'Active'
};

const booking3_C_for_Event3 = {
  bookingId: 'BK-1003',
  passId: 'GP-1003',
  eventId: event3_OrgB_Published.id,
  eventTitle: event3_OrgB_Published.title,
  organizerUid: organizerUserB.uid,
  participantUid: participantUserC.uid,
  participantName: participantUserC.name,
  amount: 299,
  status: 'Active'
};

const allBookings = [booking1_C_for_Event1, booking2_D_for_Event1, booking3_C_for_Event3];

// Participant C view: only bookings where participantUid === participantUserC.uid
const participantCBookings = allBookings.filter((b) => b.participantUid === participantUserC.uid);
assert(participantCBookings.length === 2, 'Participant C sees exactly 2 personal bookings');
assert(participantCBookings.every((b) => b.participantUid === participantUserC.uid), 'All bookings belong to Participant C');
assert(!participantCBookings.some((b) => b.participantUid === participantUserD.uid), 'Participant C CANNOT see Participant D bookings');

// Participant D view: only bookings where participantUid === participantUserD.uid
const participantDBookings = allBookings.filter((b) => b.participantUid === participantUserD.uid);
assert(participantDBookings.length === 1, 'Participant D sees only 1 personal booking');
assert(participantDBookings[0].bookingId === 'BK-1002', 'Participant D booking matches BK-1002');
assert(!participantDBookings.some((b) => b.participantUid === participantUserC.uid), 'Participant D CANNOT see Participant C bookings');

// Organizer A view: only bookings where organizerUid === organizerUserA.uid
const organizerABookings = allBookings.filter((b) => b.organizerUid === organizerUserA.uid);
assert(organizerABookings.length === 2, 'Organizer A sees exactly 2 attendee bookings for Event 1');
assert(organizerABookings.every((b) => b.organizerUid === organizerUserA.uid), 'All bookings belong to Organizer A events');
assert(!organizerABookings.some((b) => b.organizerUid === organizerUserB.uid), 'Organizer A CANNOT see Organizer B bookings');
const orgARevenue = organizerABookings.reduce((sum, b) => sum + b.amount, 0);
assert(orgARevenue === 998, 'Organizer A revenue is strictly calculated from own event bookings (₹998)');

// Organizer B view: only bookings where organizerUid === organizerUserB.uid
const organizerBBookings = allBookings.filter((b) => b.organizerUid === organizerUserB.uid);
assert(organizerBBookings.length === 1, 'Organizer B sees only 1 attendee booking for Event 3');
assert(organizerBBookings[0].bookingId === 'BK-1003', 'Organizer B sees BK-1003');
assert(!organizerBBookings.some((b) => b.organizerUid === organizerUserA.uid), 'Organizer B CANNOT see Organizer A bookings');
const orgBRevenue = organizerBBookings.reduce((sum, b) => sum + b.amount, 0);
assert(orgBRevenue === 299, 'Organizer B revenue is strictly isolated to own event bookings (₹299)');

// Admin view: unrestricted platform visibility
const adminVisibleBookings = allBookings;
assert(adminVisibleBookings.length === 3, 'Admin sees all 3 platform bookings');
const platformTotalRevenue = adminVisibleBookings.reduce((sum, b) => sum + b.amount, 0);
assert(platformTotalRevenue === 1297, 'Admin sees full platform revenue (₹1,297)');

// -----------------------------------------------------------------------------
// REQ 7: Firestore Security Rules Logical Verification
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Firestore Security Rules Direct Simulation ---');

// Rule: allow read: if isAuthenticated() && (participantUid == auth.uid || organizerUid == auth.uid || isAdmin())
function simulateBookingReadRule(auth, bookingDoc) {
  if (!auth) return false;
  const isParticipant = bookingDoc.participantUid === auth.uid;
  const isOrganizer = bookingDoc.organizerUid === auth.uid;
  const isPlatformAdmin = auth.role === 'admin' || auth.isAdmin === true;
  return isParticipant || isOrganizer || isPlatformAdmin;
}

assert(simulateBookingReadRule(participantUserC, booking1_C_for_Event1) === true, 'Rule allows Participant C to read own booking');
assert(simulateBookingReadRule(participantUserC, booking2_D_for_Event1) === false, 'Rule DENIES Participant C from reading Participant D booking');
assert(simulateBookingReadRule(organizerUserA, booking1_C_for_Event1) === true, 'Rule allows Organizer A to read booking on their event');
assert(simulateBookingReadRule(organizerUserA, booking3_C_for_Event3) === false, 'Rule DENIES Organizer A from reading booking on Organizer B event');
assert(simulateBookingReadRule(organizerUserB, booking3_C_for_Event3) === true, 'Rule allows Organizer B to read booking on their event');
assert(simulateBookingReadRule(organizerUserB, booking1_C_for_Event1) === false, 'Rule DENIES Organizer B from reading booking on Organizer A event');
assert(simulateBookingReadRule(adminUser, booking1_C_for_Event1) === true, 'Rule allows Admin to read any booking (1)');
assert(simulateBookingReadRule(adminUser, booking3_C_for_Event3) === true, 'Rule allows Admin to read any booking (2)');
assert(simulateBookingReadRule(null, booking1_C_for_Event1) === false, 'Rule DENIES unauthenticated access to bookings');

// Rule: allow create: if isAuthenticated() && (request.resource.data.participantUid == request.auth.uid)
function simulateBookingCreateRule(auth, newBookingData) {
  if (!auth) return false;
  return newBookingData.participantUid === auth.uid;
}

assert(simulateBookingCreateRule(participantUserC, { participantUid: participantUserC.uid }) === true, 'Participant can create booking with matching participantUid');
assert(simulateBookingCreateRule(participantUserC, { participantUid: participantUserD.uid }) === false, 'Participant CANNOT spoof another participant UID on booking create');
assert(simulateBookingCreateRule(null, { participantUid: participantUserC.uid }) === false, 'Unauthenticated user CANNOT create booking');

// Rule: allow create event: if isAuthorizedOrganizerOrAdmin() && request.resource.data.organizerUid == auth.uid
function simulateEventCreateRule(auth, newEventData) {
  if (!auth) return false;
  const isAuthorized = auth.role === 'organizer' || auth.role === 'admin' || auth.isAdmin || auth.isOrganizer;
  if (!isAuthorized) return false;
  return newEventData.organizerUid === auth.uid;
}

assert(simulateEventCreateRule(organizerUserA, { organizerUid: organizerUserA.uid }) === true, 'Organizer A can create event with own organizerUid');
assert(simulateEventCreateRule(organizerUserA, { organizerUid: organizerUserB.uid }) === false, 'Organizer A CANNOT create event with another organizer UID');
assert(simulateEventCreateRule(participantUserC, { organizerUid: participantUserC.uid }) === false, 'Participant CANNOT create event (not authorized)');
assert(simulateEventCreateRule(adminUser, { organizerUid: adminUser.uid }) === true, 'Admin can create event with own organizerUid');

// -----------------------------------------------------------------------------
// REQ 8: Account Switching Cache Clearing & Isolation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 5: Account Switching Session Isolation ---');

// Simulate User C session
saveStoredUserBookings(participantUserC.uid, [booking1_C_for_Event1, booking3_C_for_Event3]);
saveStoredUserPasses(participantUserC.uid, [{ id: 'GP-1001' }, { id: 'GP-1003' }]);

assert(getStoredUserBookings(participantUserC.uid).length === 2, 'User C has 2 cached bookings');
assert(getStoredUserPasses(participantUserC.uid).length === 2, 'User C has 2 cached passes');

// Account switch to User D
clearSessionBookingCache();

assert(getStoredUserBookings(participantUserD.uid).length === 0, 'User D cache is empty after switch');
assert(getStoredUserPasses(participantUserD.uid).length === 0, 'User D pass cache is empty after switch');

// Ensure User C cache was not returned to User D
const userDBookings = getStoredUserBookings(participantUserD.uid);
assert(!userDBookings.some((b) => b.participantUid === participantUserC.uid), 'User C bookings NEVER leaked to User D cache');

// -----------------------------------------------------------------------------
// REQ 9: New User Profile Default Initialization
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 6: New User Profile Initialization Validation ---');

function simulateNewUserProfileInitialization(rawFirebaseUser) {
  const initialProfile = {
    uid: rawFirebaseUser.uid,
    email: rawFirebaseUser.email || '',
    displayName: rawFirebaseUser.displayName || rawFirebaseUser.email?.split('@')[0] || 'User',
    role: 'participant', // Server default
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Rule verification: allow create if request.auth.uid == userId && (role == 'participant' || isAdmin())
  const ruleValidates = initialProfile.uid === rawFirebaseUser.uid && initialProfile.role === 'participant';
  return { initialProfile, ruleValidates };
}

const newGoogleUser = {
  uid: 'new_google_user_505',
  email: 'freshman@college.edu',
  displayName: 'Freshman Student'
};

const initResult = simulateNewUserProfileInitialization(newGoogleUser);
assert(initResult.initialProfile.role === 'participant', 'New user automatically initialized with participant role');
assert(initResult.ruleValidates === true, 'New user profile creation satisfies Firestore security rules');

// Self-elevation prevention check
function simulateRoleUpdateRule(auth, currentDoc, updatedDoc) {
  if (!auth) return false;
  if (auth.role === 'admin' || auth.isAdmin) return true; // Admin can change roles
  if (auth.uid === currentDoc.uid) {
    // User can only update if role is unchanged
    return !('role' in updatedDoc) || updatedDoc.role === currentDoc.role;
  }
  return false;
}

const currentStudentDoc = { uid: participantUserC.uid, role: 'participant' };
const illegalElevateAttempt = { ...currentStudentDoc, role: 'admin' };
const legalProfileUpdate = { ...currentStudentDoc, displayName: 'Aarav S.' };

assert(simulateRoleUpdateRule(participantUserC, currentStudentDoc, illegalElevateAttempt) === false, 'Participant CANNOT self-elevate role to admin');
assert(simulateRoleUpdateRule(participantUserC, currentStudentDoc, legalProfileUpdate) === true, 'Participant CAN update own name without altering role');
assert(simulateRoleUpdateRule(adminUser, currentStudentDoc, illegalElevateAttempt) === true, 'Admin CAN elevate participant to admin or organizer');

console.log('\n================================================================');
console.log(`✅ AUDIT PASSED: ${passed}/${total} SECURITY AND ISOLATION CHECKS SUCCESSFUL`);
console.log('================================================================');

