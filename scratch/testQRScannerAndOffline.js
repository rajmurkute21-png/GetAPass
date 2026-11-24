import assert from 'node:assert';

// Mock localStorage for node test runner
const memoryStore = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => memoryStore.get(k) || null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k),
    get length() { return memoryStore.size; },
    key: (i) => Array.from(memoryStore.keys())[i] || null
  }
};

import {
  cachePassRosterForOffline,
  verifyPassOffline,
  queueOfflineCheckin,
  OFFLINE_CHECKINS_QUEUE_KEY
} from '../src/services/verifierService.js';

console.log('=== TEST SUITE: QR SCANNING (ONLINE & OFFLINE) ===\n');

const testEventId = 'ev-hackathon-2026';
const sampleRoster = [
  {
    passId: 'GP-2026-VAL-101',
    id: 'GP-2026-VAL-101',
    eventId: testEventId,
    eventTitle: 'Hackathon 2026',
    attendeeName: 'Aarav Shah',
    passType: 'VIP Hacker',
    status: 'Active',
    checkedIn: false
  },
  {
    passId: 'GP-2026-USD-202',
    id: 'GP-2026-USD-202',
    eventId: testEventId,
    eventTitle: 'Hackathon 2026',
    attendeeName: 'Rohan Sharma',
    passType: 'General Admission',
    status: 'Used',
    checkedIn: true
  },
  {
    passId: 'GP-2026-WRG-303',
    id: 'GP-2026-WRG-303',
    eventId: 'ev-different-music-fest',
    eventTitle: 'Waves College Fest',
    attendeeName: 'Priya Patel',
    passType: 'Concert Entry',
    status: 'Active',
    checkedIn: false
  },
  {
    passId: 'GP-2026-CNL-404',
    id: 'GP-2026-CNL-404',
    eventId: testEventId,
    eventTitle: 'Hackathon 2026',
    attendeeName: 'Karan Mehra',
    passType: 'General Admission',
    status: 'Cancelled',
    checkedIn: false
  },
  {
    passId: 'GP-2026-EXP-505',
    id: 'GP-2026-EXP-505',
    eventId: testEventId,
    eventTitle: 'Hackathon 2026',
    attendeeName: 'Sneha Roy',
    passType: 'Early Bird',
    status: 'Expired',
    checkedIn: false
  }
];

// Test 1: Offline Roster Caching
console.log('Test 1: Offline Roster Caching');
const cached = cachePassRosterForOffline(testEventId, sampleRoster);
assert.strictEqual(cached, true, 'Roster must be successfully cached in storage');
console.log('  ✓ Pass roster successfully saved for offline gate turnstiles');

// Test 2: Valid Pass Verification
console.log('\nTest 2: Valid Pass Verification (Digital & Printed)');
const validCheck = verifyPassOffline('GP-2026-VAL-101', testEventId);
assert.strictEqual(validCheck.valid, true, 'Valid pass must verify successfully');
assert.strictEqual(validCheck.status, 'Valid');
assert.strictEqual(validCheck.attendeeName, 'Aarav Shah');
assert.strictEqual(validCheck.passType, 'VIP Hacker');
console.log('  ✓ Valid pass verified with attendee & tier details');

// Test 3: Already-used Duplicate Pass Verification
console.log('\nTest 3: Already-used Pass (Duplicate Scan Prevention)');
const usedCheck = verifyPassOffline('GP-2026-USD-202', testEventId);
assert.strictEqual(usedCheck.valid, false, 'Used pass must not be granted re-entry');
assert.strictEqual(usedCheck.status, 'Already-used');
assert.ok(usedCheck.reason.includes('already scanned and used'), 'Reason must explain duplicate use');
console.log('  ✓ Duplicate scan blocked with Already-used status');

// Test 4: Wrong-Event Pass Verification
console.log('\nTest 4: Wrong-Event Pass Verification');
const wrongCheck = verifyPassOffline('GP-2026-WRG-303', testEventId);
assert.strictEqual(wrongCheck.valid, false, 'Wrong event pass must be rejected');
assert.strictEqual(wrongCheck.status, 'Wrong-event');
assert.ok(wrongCheck.reason.includes('Waves College Fest'), 'Reason must name mismatched event');
console.log('  ✓ Wrong-event pass rejected with clear event mismatch notice');

// Test 5: Cancelled Pass Verification
console.log('\nTest 5: Cancelled Pass Verification');
const cnlCheck = verifyPassOffline('GP-2026-CNL-404', testEventId);
assert.strictEqual(cnlCheck.valid, false, 'Cancelled pass must be rejected');
assert.strictEqual(cnlCheck.status, 'Cancelled');
console.log('  ✓ Cancelled pass denied admission');

// Test 6: Expired Pass Verification
console.log('\nTest 6: Expired Pass Verification');
const expCheck = verifyPassOffline('GP-2026-EXP-505', testEventId);
assert.strictEqual(expCheck.valid, false, 'Expired pass must be rejected');
assert.strictEqual(expCheck.status, 'Expired');
console.log('  ✓ Expired pass denied admission');

// Test 7: Unregistered / Fake Pass Verification
console.log('\nTest 7: Unregistered / Fake Pass Verification');
const fakeCheck = verifyPassOffline('GP-FAKE-9999', testEventId);
assert.strictEqual(fakeCheck.valid, false, 'Unknown code must be marked invalid');
assert.strictEqual(fakeCheck.status, 'Invalid');
console.log('  ✓ Unknown pass blocked with Invalid status');

// Test 8: Offline Check-in Queue
console.log('\nTest 8: Offline Check-in Queuing');
const queued = queueOfflineCheckin({
  passId: 'GP-2026-VAL-101',
  attendeeName: 'Aarav Shah',
  gate: 'Gate A',
  status: 'Granted'
});
assert.strictEqual(queued, true, 'Check-in must be queued for sync');
const storedQueue = JSON.parse(memoryStore.get(OFFLINE_CHECKINS_QUEUE_KEY));
assert.strictEqual(storedQueue.length, 1);
assert.strictEqual(storedQueue[0].passId, 'GP-2026-VAL-101');
console.log('  ✓ Offline check-in record queued for cloud synchronization');

console.log('\n=== ALL QR SCANNING (ONLINE & OFFLINE) TESTS PASSED ===\n');
