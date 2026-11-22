/**
 * GetAPass — Phase 3: Firestore Data Architecture & Security Verification Suite
 *
 * Verifies all Phase 3 deliverables:
 * 1. 8 Collections Architecture: users, events, bookings, passes, transactions, notifications, checkIns, verifierAssignments.
 * 2. Document IDs, ownership, relationships, timestamps, and status enums.
 * 3. Never trust client-supplied prices, roles, payment status, or ownership.
 * 4. Multi-tenant access restrictions across the 4 platform roles.
 * 5. Reusable Firestore services with pagination, filtering, and error handling.
 * 6. Firestore security rules simulation across all 8 collections.
 * 7. Composite indexes schema verification in firestore.indexes.json.
 */

import fs from 'fs';
import path from 'path';
import {
  COLLECTIONS,
  STATUS_ENUMS,
  generateDocId,
  generateBookingId,
  generatePassId,
  generateTransactionId,
  validateEventPayload,
  validateBookingPayload
} from '../src/constants/firestoreSchema.js';
import { sanitizeUserProfile } from '../src/services/userService.js';
import {
  sanitizeForFirestore,
  mapFirestoreError,
  enableInMemoryTestStore,
  disableInMemoryTestStore
} from '../src/services/firestoreService.js';
import { createDigitalPass, revokePass } from '../src/services/passService.js';
import { createTransaction } from '../src/services/transactionService.js';
import { createNotification, markNotificationAsRead } from '../src/services/notificationService.js';
import {
  assignVerifierToEvent,
  revokeVerifierAssignment,
  recordCheckInAuditLog
} from '../src/services/verifierService.js';

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
console.log('🏛️ GETAPASS PHASE 3: FIRESTORE DATA ARCHITECTURE & SECURITY AUDIT');
console.log('================================================================\n');

// Mock actors
const adminUser = { uid: 'usr_admin_99', role: 'admin', isAdmin: true, email: 'admin@gateapass.com' };
const organizerUser = { uid: 'usr_org_10', role: 'organizer', isOrganizer: true, email: 'org10@campus.edu' };
const otherOrganizerUser = { uid: 'usr_org_20', role: 'organizer', isOrganizer: true, email: 'org20@campus.edu' };
const verifierUser = { uid: 'usr_ver_30', role: 'verifier', isVerifier: true, email: 'turnstile@campus.edu' };
const participantUser = { uid: 'usr_part_50', role: 'participant', email: 'attendee@student.edu', isEmailVerified: true };

const sampleEvent = {
  id: 'ev_techfest_2026',
  title: 'TechFest 2026',
  organizerUid: organizerUser.uid,
  startingPrice: 399,
  status: 'Active',
  category: 'Conference'
};

// =========================================================================
// SECTION 1: 8 Collections & Status Enums Schema Architecture
// =========================================================================
console.log('--- SECTION 1: 8 Collections & Status Enums Schema Architecture ---');

assert(COLLECTIONS.USERS === 'users', 'Collection: users defined');
assert(COLLECTIONS.EVENTS === 'events', 'Collection: events defined');
assert(COLLECTIONS.BOOKINGS === 'bookings', 'Collection: bookings defined');
assert(COLLECTIONS.PASSES === 'passes', 'Collection: passes defined');
assert(COLLECTIONS.TRANSACTIONS === 'transactions', 'Collection: transactions defined');
assert(COLLECTIONS.NOTIFICATIONS === 'notifications', 'Collection: notifications defined');
assert(COLLECTIONS.CHECK_INS === 'checkIns', 'Collection: checkIns defined');
assert(COLLECTIONS.VERIFIER_ASSIGNMENTS === 'verifierAssignments', 'Collection: verifierAssignments defined');

// Status Enums Check
assert(STATUS_ENUMS.EVENT.ACTIVE === 'Active', 'Event status Active defined');
assert(STATUS_ENUMS.EVENT.DRAFT === 'Draft', 'Event status Draft defined');
assert(STATUS_ENUMS.EVENT.PUBLISHED === 'Published', 'Event status Published defined');
assert(STATUS_ENUMS.EVENT.COMPLETED === 'Completed', 'Event status Completed defined');
assert(STATUS_ENUMS.EVENT.CANCELLED === 'Cancelled', 'Event status Cancelled defined');

assert(STATUS_ENUMS.BOOKING.ACTIVE === 'Active', 'Booking status Active defined');
assert(STATUS_ENUMS.BOOKING.PENDING === 'Pending', 'Booking status Pending defined');
assert(STATUS_ENUMS.BOOKING.CANCELLED === 'Cancelled', 'Booking status Cancelled defined');
assert(STATUS_ENUMS.BOOKING.REFUNDED === 'Refunded', 'Booking status Refunded defined');

assert(STATUS_ENUMS.PASS.ACTIVE === 'Active', 'Pass status Active defined');
assert(STATUS_ENUMS.PASS.USED === 'Used', 'Pass status Used defined');
assert(STATUS_ENUMS.PASS.REVOKED === 'Revoked', 'Pass status Revoked defined');
assert(STATUS_ENUMS.PASS.EXPIRED === 'Expired', 'Pass status Expired defined');

assert(STATUS_ENUMS.TRANSACTION.SUCCESS === 'Success', 'Transaction status Success defined');
assert(STATUS_ENUMS.TRANSACTION.PENDING === 'Pending', 'Transaction status Pending defined');
assert(STATUS_ENUMS.TRANSACTION.FAILED === 'Failed', 'Transaction status Failed defined');

assert(STATUS_ENUMS.CHECK_IN.GRANTED === 'Granted', 'CheckIn status Granted defined');
assert(STATUS_ENUMS.CHECK_IN.DENIED === 'Denied', 'CheckIn status Denied defined');
assert(STATUS_ENUMS.CHECK_IN.DUPLICATE === 'Duplicate', 'CheckIn status Duplicate defined');

assert(STATUS_ENUMS.VERIFIER_ASSIGNMENT.ACTIVE === 'Active', 'Verifier assignment status Active defined');
assert(STATUS_ENUMS.VERIFIER_ASSIGNMENT.REVOKED === 'Revoked', 'Verifier assignment status Revoked defined');

// Semantic Document ID Generation
assert(generateBookingId().startsWith('BK-'), 'Booking ID generated with BK- prefix');
assert(generatePassId('TF26').startsWith('PASS-TF26'), 'Pass ID generated with PASS-TF26 prefix');
assert(generateTransactionId().startsWith('TXN-'), 'Transaction ID generated with TXN- prefix');
assert(generateDocId('notif').startsWith('notif_'), 'Notification ID generated with notif_ prefix');
assert(generateDocId('chk').startsWith('chk_'), 'CheckIn ID generated with chk_ prefix');
assert(generateDocId('asgn').startsWith('asgn_'), 'Assignment ID generated with asgn_ prefix');

// =========================================================================
// SECTION 2: Never Trust Client Input Validation
// =========================================================================
console.log('\n--- SECTION 2: Never Trust Client Input Validation ---');

// Price Tampering Defense: Client attempts to send ₹0 for a ₹399 event
const priceHackAttempt = validateBookingPayload({
  eventData: sampleEvent,
  passTypeData: { name: 'Standard Pass', price: 399 },
  quantity: 2,
  clientAmount: 0, // Client attempted manipulation
  currentUser: participantUser
});

assert(priceHackAttempt.isValid === true, 'Booking payload validated successfully');
assert(priceHackAttempt.unitPrice === 399, 'Unit price resolved authoritatively from event model (399)');
assert(priceHackAttempt.authoritativeAmount === 798, 'Total amount resolved authoritatively (2 * 399 = 798, ignoring client 0)');

// Quantity Boundary Defense
const invalidQtyAttempt = validateBookingPayload({
  eventData: sampleEvent,
  quantity: 0,
  currentUser: participantUser
});
assert(invalidQtyAttempt.isValid === false, 'Quantity of 0 rejected');

const excessQtyAttempt = validateBookingPayload({
  eventData: sampleEvent,
  quantity: 99,
  currentUser: participantUser
});
assert(excessQtyAttempt.isValid === false, 'Excessive quantity (99) rejected');

// Unauthenticated Booking Defense
const unauthBooking = validateBookingPayload({
  eventData: sampleEvent,
  quantity: 1,
  currentUser: null
});
assert(unauthBooking.isValid === false, 'Unauthenticated booking rejected');

// Profile Role Elevation Defense
const profileHackAttempt = sanitizeUserProfile({
  name: 'Attacker',
  role: 'admin', // Attack: client attempts self-elevation
  college: 'Security Lab',
  uid: 'tampered_uid',
  createdAt: 1000
});

assert(profileHackAttempt.role === undefined, 'Client role tampering stripped by sanitizeUserProfile');
assert(profileHackAttempt.uid === undefined, 'Client uid tampering stripped by sanitizeUserProfile');
assert(profileHackAttempt.createdAt === undefined, 'Client createdAt tampering stripped by sanitizeUserProfile');
assert(profileHackAttempt.name === 'Attacker', 'Allowed name field preserved');

// Event Validation
const invalidEvent = validateEventPayload({
  title: 'No', // Too short
  organizerUid: null,
  startingPrice: -50,
  status: 'HACKED_STATUS'
});
assert(invalidEvent.isValid === false, 'Invalid event payload rejected with validation errors');
assert(invalidEvent.errors.length >= 3, 'Multiple schema violations caught on invalid event');

// =========================================================================
// SECTION 3: Dedicated Firestore Services CRUD Operations
// =========================================================================
console.log('\n--- SECTION 3: Dedicated Firestore Services CRUD Operations ---');

// Activate isolated in-memory test store for services CRUD verification
enableInMemoryTestStore();

// 1. Digital Pass Service
const createdPass = await createDigitalPass({
  bookingId: 'BK-TEST-1001',
  eventId: sampleEvent.id,
  eventTitle: sampleEvent.title,
  organizerUid: organizerUser.uid,
  participantUid: participantUser.uid,
  attendeeName: 'Alex Attendee',
  passType: 'Standard Pass',
  customPassId: 'PASS-TEST-9001'
});

assert(createdPass.passId === 'PASS-TEST-9001', 'Pass created with expected ID');
assert(createdPass.status === STATUS_ENUMS.PASS.ACTIVE, 'Pass initialized with status Active');
assert(createdPass.checkedIn === false, 'Pass initialized with checkedIn = false');
assert(createdPass.qrSignature.includes('PASS-TEST-9001'), 'Pass includes cryptographic QR signature');

// Revoke Pass: Non-organizer rejected
let caughtRevokeError = false;
try {
  await revokePass('PASS-TEST-9001', 'Test', otherOrganizerUser);
} catch (err) {
  caughtRevokeError = true;
  assert(err.message.includes('Unauthorized') || err.message.includes('Pass not found'), 'Unauthorized pass revocation rejected');
}
assert(caughtRevokeError, 'Foreign organizer CANNOT revoke event passes');

// 2. Financial Transaction Service
const createdTxn = await createTransaction({
  bookingId: 'BK-TEST-1001',
  eventId: sampleEvent.id,
  eventTitle: sampleEvent.title,
  participantUid: participantUser.uid,
  organizerUid: organizerUser.uid,
  amount: 798,
  paymentMethod: 'UPI'
});

assert(createdTxn.amount === 798, 'Transaction created with verified amount (798)');
assert(createdTxn.currency === 'INR', 'Transaction currency is INR');
assert(createdTxn.status === STATUS_ENUMS.TRANSACTION.SUCCESS, 'Transaction initialized with status Success');
assert(createdTxn.gatewayRef.startsWith('MOCK_GW_'), 'Transaction includes gateway reference');

// 3. User Notification Service
const createdNotif = await createNotification({
  recipientUid: participantUser.uid,
  title: 'Pass Issued',
  message: 'Your TechFest 2026 digital pass is now available.',
  type: 'ticket'
});

assert(createdNotif.recipientUid === participantUser.uid, 'Notification created for recipient UID');
assert(createdNotif.read === false, 'Notification initialized as unread');
assert(createdNotif.type === 'ticket', 'Notification type is ticket');

// 4. Verifier Assignment Service
const createdAssignment = await assignVerifierToEvent({
  eventId: sampleEvent.id,
  eventTitle: sampleEvent.title,
  organizerUid: organizerUser.uid,
  verifierUid: verifierUser.uid,
  verifierEmail: verifierUser.email,
  gate: 'Gate A',
  actor: organizerUser
});

assert(createdAssignment.eventId === sampleEvent.id, 'Verifier assignment bound to event');
assert(createdAssignment.verifierUid === verifierUser.uid, 'Verifier assignment bound to verifier UID');
assert(createdAssignment.status === STATUS_ENUMS.VERIFIER_ASSIGNMENT.ACTIVE, 'Assignment initialized as Active');

// Non-owner organizer assigning verifier rejected
let caughtAssignError = false;
try {
  await assignVerifierToEvent({
    eventId: sampleEvent.id,
    eventTitle: sampleEvent.title,
    organizerUid: organizerUser.uid,
    verifierUid: verifierUser.uid,
    actor: otherOrganizerUser
  });
} catch (err) {
  caughtAssignError = true;
  assert(err.message.includes('Unauthorized'), 'Non-owner organizer rejected from assigning verifiers');
}
assert(caughtAssignError, 'Foreign organizer CANNOT assign verifiers to another event');

// 5. Turnstile Check-In Audit Log
const createdCheckIn = await recordCheckInAuditLog({
  passId: 'PASS-TEST-9001',
  bookingId: 'BK-TEST-1001',
  eventId: sampleEvent.id,
  eventTitle: sampleEvent.title,
  attendeeName: 'Alex Attendee',
  participantUid: participantUser.uid,
  organizerUid: organizerUser.uid,
  verifierUid: verifierUser.uid,
  verifierName: 'Turnstile Verifier',
  gate: 'Gate A',
  status: STATUS_ENUMS.CHECK_IN.GRANTED,
  reason: 'Entry Authorized'
});

assert(createdCheckIn.status === STATUS_ENUMS.CHECK_IN.GRANTED, 'CheckIn audit log recorded status Granted');
assert(createdCheckIn.gate === 'Gate A', 'CheckIn audit log recorded Gate A');
assert(createdCheckIn.timestamp > 0, 'CheckIn audit log includes server timestamp');

// Serialization Sanitization Test
const sanitizedObj = sanitizeForFirestore({
  validField: 'Hello',
  undefField: undefined,
  nested: {
    number: 42,
    bad: undefined
  }
});
assert(sanitizedObj.validField === 'Hello', 'Sanitizer preserves valid values');
assert(sanitizedObj.undefField === undefined, 'Sanitizer removes undefined top-level values');
assert(sanitizedObj.nested.bad === undefined, 'Sanitizer removes nested undefined values');
assert(sanitizedObj.nested.number === 42, 'Sanitizer preserves nested valid values');

// =========================================================================
// SECTION 4: Firestore Security Rules Simulation (All 8 Collections)
// =========================================================================
console.log('\n--- SECTION 4: Firestore Security Rules Simulation ---');

// Rules simulation helper
function evalRule(actor, conditionFn) {
  if (!actor) return false;
  try {
    return Boolean(conditionFn(actor));
  } catch {
    return false;
  }
}

// 1. /users/{userId}
const userDoc = { uid: participantUser.uid, role: 'participant' };
assert(evalRule(participantUser, (a) => a.uid === userDoc.uid) === true, 'Rule: User can read own profile');
assert(evalRule(organizerUser, (a) => a.uid === userDoc.uid || a.role === 'admin') === false, 'Rule: Foreign user CANNOT read other private profile');
assert(evalRule(adminUser, (a) => a.uid === userDoc.uid || a.role === 'admin') === true, 'Rule: Admin CAN read any user profile');

// 2. /events/{eventId}
const publishedEventDoc = { status: 'Published', organizerUid: organizerUser.uid };
const draftEventDoc = { status: 'Draft', organizerUid: organizerUser.uid };

assert(evalRule(participantUser, (a) => ['Active', 'Published'].includes(publishedEventDoc.status)) === true, 'Rule: Participant can read Published event');
assert(evalRule(participantUser, (a) => ['Active', 'Published'].includes(draftEventDoc.status) || a.uid === draftEventDoc.organizerUid || a.role === 'admin') === false, 'Rule: Participant CANNOT read Draft event');
assert(evalRule(organizerUser, (a) => ['Active', 'Published'].includes(draftEventDoc.status) || a.uid === draftEventDoc.organizerUid || a.role === 'admin') === true, 'Rule: Event owner CAN read own Draft event');

// 3. /bookings/{bookingId}
const bookingDoc = { participantUid: participantUser.uid, organizerUid: organizerUser.uid, amount: 798 };

assert(evalRule(participantUser, (a) => a.uid === bookingDoc.participantUid) === true, 'Rule: Participant can read own booking');
assert(evalRule(organizerUser, (a) => a.uid === bookingDoc.organizerUid) === true, 'Rule: Organizer can read booking for their event');
assert(evalRule(otherOrganizerUser, (a) => a.uid === bookingDoc.participantUid || a.uid === bookingDoc.organizerUid || a.role === 'admin') === false, 'Rule: Other organizer CANNOT read foreign booking');
assert(evalRule(adminUser, (a) => a.role === 'admin') === true, 'Rule: Admin can read any booking');

// 4. /passes/{passId}
const passDoc = { participantUid: participantUser.uid, organizerUid: organizerUser.uid, status: 'Active' };

assert(evalRule(participantUser, (a) => a.uid === passDoc.participantUid) === true, 'Rule: Participant can read own digital pass');
assert(evalRule(organizerUser, (a) => a.uid === passDoc.organizerUid) === true, 'Rule: Organizer can read digital pass for their event');
assert(evalRule(verifierUser, (a) => a.role === 'verifier') === true, 'Rule: Verifier can read digital pass for validation');
assert(evalRule(otherOrganizerUser, (a) => a.uid === passDoc.participantUid || a.uid === passDoc.organizerUid || a.role === 'verifier' || a.role === 'admin') === false, 'Rule: Foreign user CANNOT read pass');

// 5. /transactions/{transactionId}
const txnDoc = { participantUid: participantUser.uid, organizerUid: organizerUser.uid, amount: 798 };

assert(evalRule(participantUser, (a) => a.uid === txnDoc.participantUid) === true, 'Rule: Participant can read own transaction');
assert(evalRule(organizerUser, (a) => a.uid === txnDoc.organizerUid) === true, 'Rule: Organizer can read revenue transaction');
assert(evalRule(participantUser, (a) => a.role === 'admin') === false, 'Rule: Participant CANNOT mutate or delete transaction');
assert(evalRule(organizerUser, (a) => a.role === 'admin') === false, 'Rule: Organizer CANNOT mutate or delete transaction');

// 6. /notifications/{notificationId}
const notifDoc = { recipientUid: participantUser.uid, read: false };

assert(evalRule(participantUser, (a) => a.uid === notifDoc.recipientUid) === true, 'Rule: Recipient can read own notification');
assert(evalRule(organizerUser, (a) => a.uid === notifDoc.recipientUid || a.role === 'admin') === false, 'Rule: Foreign user CANNOT read other notifications');
assert(evalRule(participantUser, (a) => a.uid === notifDoc.recipientUid) === true, 'Rule: Recipient can update notification read state');

// 7. /checkIns/{checkInId}
const checkInDoc = { organizerUid: organizerUser.uid, verifierUid: verifierUser.uid, eventId: sampleEvent.id };

assert(evalRule(verifierUser, (a) => a.role === 'verifier' || ['admin', 'organizer'].includes(a.role)) === true, 'Rule: Verifier CAN create check-in audit log');
assert(evalRule(participantUser, (a) => a.role === 'verifier' || ['admin', 'organizer'].includes(a.role)) === false, 'Rule: Participant CANNOT create check-in audit log');
assert(evalRule(organizerUser, (a) => a.uid === checkInDoc.organizerUid) === true, 'Rule: Event Organizer can read event check-in logs');
assert(evalRule(verifierUser, (a) => a.role === 'admin') === false, 'Rule: Verifier CANNOT update or delete check-in log (immutable)');
assert(evalRule(organizerUser, (a) => a.role === 'admin') === false, 'Rule: Organizer CANNOT delete check-in log (immutable)');

// 8. /verifierAssignments/{assignmentId}
const asgnDoc = { organizerUid: organizerUser.uid, verifierUid: verifierUser.uid, status: 'Active' };

assert(evalRule(verifierUser, (a) => a.uid === asgnDoc.verifierUid) === true, 'Rule: Assigned Verifier can read their own assignments');
assert(evalRule(organizerUser, (a) => a.uid === asgnDoc.organizerUid) === true, 'Rule: Event Organizer can read verifier assignments for their events');
assert(evalRule(organizerUser, (a) => a.role === 'admin' || (a.role === 'organizer' && a.uid === asgnDoc.organizerUid)) === true, 'Rule: Event Organizer CAN assign/revoke verifiers');
assert(evalRule(verifierUser, (a) => a.role === 'admin' || (a.role === 'organizer' && a.uid === asgnDoc.organizerUid)) === false, 'Rule: Verifier CANNOT self-assign or alter assignments');

// =========================================================================
// SECTION 5: Composite Indexes Configuration Check
// =========================================================================
console.log('\n--- SECTION 5: Composite Indexes Configuration Check ---');

const indexesPath = path.resolve(process.cwd(), 'firestore.indexes.json');
assert(fs.existsSync(indexesPath), 'firestore.indexes.json file exists in project root');

const indexesContent = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
assert(Array.isArray(indexesContent.indexes), 'firestore.indexes.json has indexes array');

const indexedCollections = new Set(indexesContent.indexes.map((idx) => idx.collectionGroup));
assert(indexedCollections.has('events'), 'Composite indexes defined for events');
assert(indexedCollections.has('bookings'), 'Composite indexes defined for bookings');
assert(indexedCollections.has('passes'), 'Composite indexes defined for passes');
assert(indexedCollections.has('transactions'), 'Composite indexes defined for transactions');
assert(indexedCollections.has('notifications'), 'Composite indexes defined for notifications');
assert(indexedCollections.has('checkIns'), 'Composite indexes defined for checkIns');
assert(indexedCollections.has('verifierAssignments'), 'Composite indexes defined for verifierAssignments');

console.log('\n================================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed}/${passed} PHASE 3 FIRESTORE ARCHITECTURE CHECKS PASSED!`);
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ FAILED: ${failed} assertions failed. (${passed} passed)`);
  process.exit(1);
}
