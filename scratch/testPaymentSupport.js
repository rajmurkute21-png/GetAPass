import assert from 'node:assert';

// Mock browser localStorage for node test runner
const memoryStore = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => memoryStore.get(k) || null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k)
  }
};

import {
  PAYMENT_ISSUE_CATEGORIES,
  acquirePaymentLock,
  releasePaymentLock,
  submitPaymentSupportTicket,
  getStoredPaymentSupportTickets
} from '../src/services/paymentSupportService.js';

console.log('=== TEST SUITE: PAYMENT HELP & SUPPORT ===\n');

// Test 1: Validate 5 payment issue categories
console.log('Test 1: Payment issue categories validation');
assert.strictEqual(PAYMENT_ISSUE_CATEGORIES.length, 5, 'Should have exactly 5 categories');
const categoryIds = PAYMENT_ISSUE_CATEGORIES.map(c => c.id);
assert.ok(categoryIds.includes('deducted-not-confirmed'), 'Should support deducted-not-confirmed');
assert.ok(categoryIds.includes('payment-pending'), 'Should support payment-pending');
assert.ok(categoryIds.includes('payment-failed'), 'Should support payment-failed');
assert.ok(categoryIds.includes('duplicate-payment'), 'Should support duplicate-payment');
assert.ok(categoryIds.includes('confirmation-not-received'), 'Should support confirmation-not-received');
console.log('  ✓ All 5 payment issue categories present and verified');

// Test 2: In-flight payment duplicate lock
console.log('\nTest 2: In-flight payment idempotency lock');
const testOrderId = 'ORD_TEST_101';
const lock1 = acquirePaymentLock(testOrderId);
assert.strictEqual(lock1, true, 'First lock acquisition must succeed');

const lock2 = acquirePaymentLock(testOrderId);
assert.strictEqual(lock2, false, 'Duplicate lock acquisition must be blocked');

releasePaymentLock(testOrderId);
const lock3 = acquirePaymentLock(testOrderId);
assert.strictEqual(lock3, true, 'Lock re-acquisition after release must succeed');
releasePaymentLock(testOrderId);
console.log('  ✓ In-flight payment duplicate lock strictly blocks double-clicks & concurrent charges');

// Test 3: Support ticket validation & generation
console.log('\nTest 3: Support ticket validation and generation');
assert.throws(() => {
  submitPaymentSupportTicket({ issueCategory: '', description: 'Help' });
}, /Please select an issue category/, 'Should require issue category');

assert.throws(() => {
  submitPaymentSupportTicket({ issueCategory: 'payment-failed', description: '  ' });
}, /Please provide a brief description/, 'Should require description');

const ticket = submitPaymentSupportTicket({
  issueCategory: 'deducted-not-confirmed',
  bookingId: 'BK-991283',
  transactionId: 'TXN-UPI-991283',
  amount: 450,
  eventTitle: 'HackIndia 2026',
  description: 'Money was deducted from GPay but tickets not showing in app.',
  user: { uid: 'user_123', email: 'attendee@campus.edu', displayName: 'Aarav Shah' }
});

assert.ok(ticket.ticketId.startsWith('PAY-HELP-'), 'Ticket reference must start with PAY-HELP-');
assert.strictEqual(ticket.bookingId, 'BK-991283');
assert.strictEqual(ticket.transactionId, 'TXN-UPI-991283');
assert.strictEqual(ticket.amount, '₹450');
assert.strictEqual(ticket.status, 'Under Review');
assert.strictEqual(ticket.estimatedResolution, '2–4 hours');
console.log(`  ✓ Generated support ticket: ${ticket.ticketId} with resolution: ${ticket.estimatedResolution}`);

// Test 4: Stored ticket retrieval
console.log('\nTest 4: Stored ticket retrieval');
const stored = getStoredPaymentSupportTickets();
assert.ok(stored.length >= 1, 'Should find stored ticket');
assert.strictEqual(stored[0].ticketId, ticket.ticketId);
console.log(`  ✓ Successfully persisted and retrieved ${stored.length} ticket(s)`);

console.log('\n=== ALL PAYMENT SUPPORT TESTS PASSED ===\n');
