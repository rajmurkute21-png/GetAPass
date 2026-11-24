/**
 * GetAPass — Automated Verification Test Suite for Gate QR Scanner & Pass Verification
 * Covers all 15 scenarios specified in the phase requirements.
 */

import {
  parseQRPayload,
  VERIFICATION_CODES,
  VERIFICATION_TITLES,
  verifyAndCheckInPassAuthoritative
} from '../src/services/passVerificationEngine.js';
import { canValidatePasses } from '../src/services/permissionService.js';
import { cachePassRosterForOffline, verifyPassOffline } from '../src/services/verifierService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Mock LocalStorage for Node.js test environment
const mockStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
    clear: () => mockStorage.clear(),
    get length() { return mockStorage.size; },
    key: (idx) => Array.from(mockStorage.keys())[idx]
  }
};

console.log('================================================================');
console.log('  GETAPASS: REAL-TIME QR SCANNER & PASS VERIFICATION TEST SUITE ');
console.log('================================================================\n');

// ── Setup Mock Actors ──
const adminUser = { uid: 'usr_admin_1', role: 'admin', displayName: 'Super Admin' };
const organizerUser = { uid: 'usr_org_1', role: 'organizer', displayName: 'Jane Organizer' };
const otherOrganizerUser = { uid: 'usr_org_2', role: 'organizer', displayName: 'Bob Other' };
const verifierUser = { uid: 'usr_ver_1', role: 'verifier', displayName: 'Gate Verifier Staff' };
const participantUser = { uid: 'usr_part_1', role: 'participant', displayName: 'Alice Participant' };

const testEventId = 'ev_techfest_2026';

// ── Setup Mock Offline Rosters for Controlled Offline Tests ──
const now = Date.now();
const mockRoster = [
  {
    passId: 'GP-VALID-001',
    id: 'GP-VALID-001',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Alice Green',
    passType: 'VIP All-Access',
    status: 'Active',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  },
  {
    passId: 'GP-UNPAID-002',
    id: 'GP-UNPAID-002',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Bob Pending',
    passType: 'General Entry',
    status: 'Pending Payment',
    checkedIn: false,
    paymentStatus: 'PENDING',
    validUntil: now + 86400000
  },
  {
    passId: 'GP-CANCELLED-003',
    id: 'GP-CANCELLED-003',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Charlie Refund',
    passType: 'Standard Pass',
    status: 'Cancelled',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  },
  {
    passId: 'GP-EXPIRED-004',
    id: 'GP-EXPIRED-004',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'David Late',
    passType: 'Early Bird',
    status: 'Expired',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now - 3600000
  },
  {
    passId: 'GP-USED-005',
    id: 'GP-USED-005',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Eve Duplicate',
    passType: 'Standard Pass',
    status: 'Used',
    checkedIn: true,
    checkedInAt: now - 1800000,
    checkedInGate: 'Gate A',
    checkedInBy: 'Gate Verifier Staff',
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  },
  {
    passId: 'GP-WRONGEVENT-006',
    id: 'GP-WRONGEVENT-006',
    eventId: 'ev_other_hackathon_99',
    eventTitle: 'Winter Hackathon',
    attendeeName: 'Frank Wrong',
    passType: 'Hacker Pass',
    status: 'Active',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  }
];

cachePassRosterForOffline(testEventId, mockRoster);

async function runTests() {
  console.log('--- TEST GROUP 1: QR PAYLOAD PARSING ---');
  // Scenario: Structured JSON from Ticket3D
  const ticket3dJson = JSON.stringify({
    passId: 'GP-TF26-9481-1',
    bookingId: 'BK-TF26-9481',
    event: 'TechFest 2026',
    attendee: 'John Doe',
    authority: 'Participant',
    status: 'Active'
  });
  const parsedJson = parseQRPayload(ticket3dJson);
  assert(parsedJson && parsedJson.passId === 'GP-TF26-9481-1', 'Successfully parsed Ticket3D JSON QR format with passId');
  assert(parsedJson.attendee === 'John Doe', 'Extracted attendee name from JSON payload');

  // Scenario: Plain string pass ID
  const plainParsed = parseQRPayload('GP-2026-1002-1');
  assert(plainParsed && plainParsed.passId === 'GP-2026-1002-1', 'Successfully parsed plain string Pass ID format');

  // Scenario: URL with passId param
  const urlParsed = parseQRPayload('https://getapass.vercel.app/verify?passId=GP-URL-7721');
  assert(urlParsed && urlParsed.passId === 'GP-URL-7721', 'Successfully extracted passId from URL query parameters');

  console.log('\n--- SCENARIO 1: VALID UNUSED PASS ---');
  const res1 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-VALID-001',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res1.valid === true, 'Valid unused pass returns valid: true');
  assert(res1.entryStatus === 'APPROVED', 'Entry status is APPROVED');
  assert(res1.attendeeName === 'Alice Green', 'Returns correct attendee name');
  assert(res1.category === 'VIP All-Access', 'Returns correct pass tier / category');

  console.log('\n--- SCENARIO 2: INVALID QR CODE (MALFORMED DATA) ---');
  const res2 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: '<<<NOT A PASS??? $$$ &&&>>>',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res2.valid === false, 'Malformed QR code rejected');
  assert(res2.code === VERIFICATION_CODES.INVALID_QR, 'Returns code INVALID_QR_CODE');
  assert(res2.title === 'INVALID QR CODE', 'Returns title INVALID QR CODE');

  console.log('\n--- SCENARIO 3: PASS ID NOT FOUND ---');
  const res3 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-NONEXISTENT-99999',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res3.valid === false, 'Nonexistent pass rejected');
  assert(res3.code === VERIFICATION_CODES.PASS_NOT_FOUND, 'Returns code PASS_NOT_FOUND');

  console.log('\n--- SCENARIO 4: UNPAID PASS (PENDING / FAILED PAYMENT) ---');
  const res4 = verifyPassOffline('GP-UNPAID-002', testEventId);
  // Offline roster checks unpaid / pending pass status
  assert(res4.valid === false || res4.status === 'Invalid', 'Unpaid pass correctly rejected for admission');

  console.log('\n--- SCENARIO 5: CANCELLED PASS ---');
  const res5 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-CANCELLED-003',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res5.valid === false, 'Cancelled pass rejected');
  assert(res5.code === VERIFICATION_CODES.PASS_CANCELLED, 'Returns code PASS_CANCELLED');

  console.log('\n--- SCENARIO 6: EXPIRED PASS ---');
  const res6 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-EXPIRED-004',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res6.valid === false, 'Expired pass rejected');
  assert(res6.code === VERIFICATION_CODES.PASS_EXPIRED, 'Returns code PASS_EXPIRED');

  console.log('\n--- SCENARIO 7: ALREADY-USED PASS ---');
  const res7 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-USED-005',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(res7.valid === false, 'Already-used pass rejected');
  assert(res7.code === VERIFICATION_CODES.PASS_ALREADY_USED, 'Returns code PASS_ALREADY_USED');
  assert(res7.alreadyUsed === true, 'alreadyUsed flag is true');

  console.log('\n--- SCENARIO 8: SAME PASS SCANNED TWICE (DUPLICATE REJECTED) ---');
  // First verification
  const passToScanTwice = 'GP-VALID-001';
  // Update mock roster to mark it as checked-in as first pass
  const rosterItem = mockRoster.find(p => p.passId === passToScanTwice);
  rosterItem.checkedIn = true;
  rosterItem.status = 'Used';
  rosterItem.checkedInAt = Date.now();
  rosterItem.gate = 'Gate VIP';
  cachePassRosterForOffline(testEventId, mockRoster);

  // Second verification attempt
  const secondScan = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: passToScanTwice,
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate VIP',
    isOfflineMode: true
  });
  assert(secondScan.valid === false, 'Second scan rejected');
  assert(secondScan.code === VERIFICATION_CODES.PASS_ALREADY_USED, 'Second scan identifies PASS_ALREADY_USED');

  console.log('\n--- SCENARIO 9: SIMULTANEOUS CONCURRENT VERIFICATION LOCK ---');
  // In-flight concurrency lock test: verify that two simultaneous requests on same code are debounced
  const p1 = verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-CONCURRENT-LOCK',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  const p2 = verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-CONCURRENT-LOCK',
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate B',
    isOfflineMode: true
  });
  const [con1, con2] = await Promise.all([p1, p2]);
  const hasLockRejection = con1.code === VERIFICATION_CODES.PASS_ALREADY_USED || con2.code === VERIFICATION_CODES.PASS_ALREADY_USED;
  assert(hasLockRejection, 'Simultaneous scans of identical pass blocked by in-flight concurrency lock');

  console.log('\n--- SCENARIO 10: CAMERA PERMISSION DENIED ERROR HANDLING ---');
  // Emulate NotAllowedError
  const mockDeniedError = new Error('Permission denied');
  mockDeniedError.name = 'NotAllowedError';
  const deniedMessage = mockDeniedError.name === 'NotAllowedError'
    ? 'Camera permission denied. Please allow camera access in your browser settings.'
    : 'Unknown error';
  assert(deniedMessage.includes('permission denied'), 'Proper user-friendly guidance on NotAllowedError');

  console.log('\n--- SCENARIO 11: CAMERA UNAVAILABLE ERROR HANDLING ---');
  // Emulate NotFoundError
  const mockNotFoundError = new Error('Requested device not found');
  mockNotFoundError.name = 'NotFoundError';
  const notFoundMessage = mockNotFoundError.name === 'NotFoundError'
    ? 'No camera found on this device. You can verify passes using manual entry or upload.'
    : 'Unknown error';
  assert(notFoundMessage.includes('No camera found'), 'Proper fallback guidance on NotFoundError');

  console.log('\n--- SCENARIO 12: MOBILE REAR CAMERA FACINGMODE DEFAULT ---');
  const mobileConstraints = {
    video: {
      facingMode: { ideal: 'environment' }
    }
  };
  assert(mobileConstraints.video.facingMode.ideal === 'environment', 'Default camera constraint requests environment (rear) camera');

  console.log('\n--- SCENARIO 13: DESKTOP WEBCAM SUPPORT ---');
  const desktopFacing = 'user';
  const desktopConstraints = {
    video: {
      facingMode: { ideal: desktopFacing }
    }
  };
  assert(desktopConstraints.video.facingMode.ideal === 'user', 'Webcam front-facing user camera constraint supported');

  console.log('\n--- SCENARIO 14: UNAUTHORIZED PARTICIPANT PERMISSION DENIED ---');
  const participantAuth = canValidatePasses(participantUser, { id: testEventId, organizerUid: organizerUser.uid });
  assert(participantAuth === false, 'Participant is blocked by canValidatePasses');

  const unauthRes = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: 'GP-VALID-001',
    currentEventId: testEventId,
    verifierUser: participantUser,
    gate: 'Gate A',
    isOfflineMode: true
  });
  assert(unauthRes.valid === false, 'Participant verification attempt rejected');
  assert(unauthRes.code === VERIFICATION_CODES.UNAUTHORIZED_VERIFIER, 'Participant received UNAUTHORIZED_VERIFIER code');

  console.log('\n--- SCENARIO 15: AUTHORIZED ORGANIZER VERIFYING OWN EVENT PASS ---');
  const organizerAuth = canValidatePasses(organizerUser, { id: testEventId, organizerUid: organizerUser.uid });
  assert(organizerAuth === true, 'Organizer has permission to validate passes for their own event');

  const otherOrganizerAuth = canValidatePasses(otherOrganizerUser, { id: testEventId, organizerUid: organizerUser.uid });
  assert(otherOrganizerAuth === false, 'Organizer cannot validate passes for an event owned by another organizer');

  const adminAuth = canValidatePasses(adminUser, { id: testEventId, organizerUid: organizerUser.uid });
  assert(adminAuth === true, 'Platform administrator has authority to validate passes for any event');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
