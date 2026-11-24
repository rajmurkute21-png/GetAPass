import assert from 'node:assert';

// Mock localStorage & window for node test environment
const memoryStore = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => memoryStore.get(k) || null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k)
  }
};

import {
  normalizeEventStatus,
  authorizeEvent,
  rejectEvent,
  disableEvent,
  removeUnauthorizedEvent,
  logEventAudit,
  getEventAuditLogs,
  saveStoredLocalEvents,
  getStoredLocalEvents
} from '../src/services/eventService.js';

console.log('=== TEST SUITE: EVENT MANAGEMENT & AUTHORIZATION ===\n');

// Test 1: normalizeEventStatus preserves all canonical states
console.log('Test 1: Status normalization for all canonical states');
assert.strictEqual(normalizeEventStatus('Pending'), 'Pending');
assert.strictEqual(normalizeEventStatus('pending'), 'Pending');
assert.strictEqual(normalizeEventStatus('Disabled'), 'Disabled');
assert.strictEqual(normalizeEventStatus('removed'), 'Removed');
assert.strictEqual(normalizeEventStatus('Draft'), 'Draft');
assert.strictEqual(normalizeEventStatus('Active'), 'Active');
assert.strictEqual(normalizeEventStatus('published'), 'Published');
assert.strictEqual(normalizeEventStatus('rejected'), 'Rejected');
assert.strictEqual(normalizeEventStatus('terminated'), 'Cancelled');
console.log('  ✓ normalizeEventStatus correctly handles Pending, Disabled, Removed, Rejected, Active, Draft');

// Seed test events into cache
const initialEvents = [
  {
    id: 'ev-pending-1',
    title: 'Robotics Workshop 2026',
    date: '2026-11-15',
    venue: 'Tech Auditorium',
    category: 'Workshops',
    status: 'Pending',
    organizerUid: 'org_user_1',
    startingPrice: 150
  },
  {
    id: 'ev-active-1',
    title: 'Codefest Hackathon',
    date: '2026-12-01',
    venue: 'Main Lab',
    category: 'Hackathons',
    status: 'Active',
    organizerUid: 'org_user_1',
    startingPrice: 200
  },
  {
    id: 'ev-inappropriate-1',
    title: 'Fake Unauthorized Gathering',
    date: '2026-11-10',
    venue: 'Unauthorized Rooftop',
    category: 'Cultural',
    status: 'Active',
    organizerUid: 'bad_actor_99',
    startingPrice: 999
  }
];
saveStoredLocalEvents(initialEvents);

const adminUser = { uid: 'admin_1', email: 'admin@campus.edu', role: 'admin' };
const regularUser = { uid: 'user_1', email: 'student@campus.edu', role: 'participant' };

// Test 2: Security checks on authorizeEvent
console.log('\nTest 2: Authorize event access controls & validation');
assert.rejects(
  async () => authorizeEvent('ev-pending-1', regularUser),
  /Only administrators can authorize events/,
  'Regular users must be blocked from authorizing events'
);

assert.rejects(
  async () => authorizeEvent('ev-active-1', adminUser),
  /already authorized and active/,
  'Already active events must not be double-authorized'
);

// Test 3: Successful authorization of pending event
console.log('\nTest 3: Authorize pending event with status change & audit log');
(async () => {
  const authorized = await authorizeEvent('ev-pending-1', adminUser);
  assert.strictEqual(authorized.status, 'Active', 'Status must transition to Active');
  assert.ok(authorized.authorizedAt, 'Must set authorizedAt timestamp');
  assert.strictEqual(authorized.authorizedBy, adminUser.email);
  console.log('  ✓ Pending event successfully authorized into Active status');

  // Test 4: Event Rejection
  console.log('\nTest 4: Reject event submission with mandatory reason');
  const rejected = await rejectEvent('ev-pending-1', 'Venue double-booked', adminUser);
  assert.strictEqual(rejected.status, 'Rejected');
  assert.strictEqual(rejected.rejectionReason, 'Venue double-booked');
  console.log('  ✓ Rejected event status and reason preserved');

  // Test 5: Disable active event
  console.log('\nTest 5: Disable active event (administrative pause)');
  const disabled = await disableEvent('ev-active-1', 'Security review in progress', adminUser);
  assert.strictEqual(disabled.status, 'Disabled');
  assert.strictEqual(disabled.disableReason, 'Security review in progress');
  console.log('  ✓ Event successfully disabled and paused');

  // Test 6: Unauthorized event soft-removal & permanent deletion
  console.log('\nTest 6: Unauthorized event soft-removal with reason & booking preservation');
  const removed = await removeUnauthorizedEvent(
    'ev-inappropriate-1',
    { reason: 'Violates campus event code of conduct', permanent: false, preserveBookings: true },
    adminUser
  );
  assert.strictEqual(removed.status, 'Removed');
  assert.strictEqual(removed.removalReason, 'Violates campus event code of conduct');
  assert.strictEqual(removed.bookingsPreserved, true);
  console.log('  ✓ Unauthorized event soft-removed with preserved attendee ticket integrity');

  // Test 7: Verify complete audit trail
  console.log('\nTest 7: Verify Event Audit Trail');
  const auditLogs = getEventAuditLogs();
  assert.ok(auditLogs.length >= 4, 'Must have recorded audit logs for actions');
  const actions = auditLogs.map(a => a.action);
  assert.ok(actions.includes('AUTHORIZE_EVENT'), 'Audit must contain AUTHORIZE_EVENT');
  assert.ok(actions.includes('REJECT_EVENT'), 'Audit must contain REJECT_EVENT');
  assert.ok(actions.includes('DISABLE_EVENT'), 'Audit must contain DISABLE_EVENT');
  assert.ok(actions.includes('EVENT_SOFT_REMOVED'), 'Audit must contain EVENT_SOFT_REMOVED');
  console.log(`  ✓ Audit trail verified with ${auditLogs.length} logged administrative actions`);

  console.log('\n=== ALL EVENT MANAGEMENT & AUTHORIZATION TESTS PASSED ===\n');
})();
