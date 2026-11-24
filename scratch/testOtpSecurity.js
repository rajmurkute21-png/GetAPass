import assert from 'node:assert';

// Mock localStorage/sessionStorage for node testing
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
globalThis.sessionStorage = globalThis.localStorage;

import {
  generateVerificationCode,
  verifyCode,
  checkCodeStatus,
  clearCodeRecord,
  getActiveCodeRecord
} from '../src/services/otpSecurityService.js';

console.log('=== TEST SUITE: OTP & TIME-LIMIT SECURITY ===\n');

const testEmail = 'aarav.security@test.com';
clearCodeRecord(testEmail, 'password-reset');

// Test 1: Generate Code with 5-minute window & 60s cooldown
console.log('Test 1: Code generation with 5-min validity and 60s cooldown');
const genResult = generateVerificationCode(testEmail, 'password-reset');
assert(genResult.success === true, 'Should generate successfully');
assert.strictEqual(genResult.expiresInSeconds, 300, 'Validity must be 300 seconds (5 mins)');
assert.strictEqual(genResult.resendCooldownSeconds, 60, 'Cooldown must be 60 seconds');
assert.strictEqual(genResult.code.length, 6, 'Code must be 6 digits');
console.log('  ✓ Generated 6-digit code:', genResult.code);

// Test 2: Resend cooldown enforcement
console.log('\nTest 2: Resend cooldown blocks rapid requests');
assert.throws(() => {
  generateVerificationCode(testEmail, 'password-reset');
}, /Please wait \d+s before requesting a new verification code/, 'Should throw cooldown error');
console.log('  ✓ Blocked request during 60s cooldown');

// Test 3: Incorrect code attempt tracking
console.log('\nTest 3: Incorrect code validation and attempt decrementing');
const invalidCheck = verifyCode(testEmail, '000000', 'password-reset');
assert.strictEqual(invalidCheck.valid, false);
assert(invalidCheck.error.includes('Incorrect code'), 'Error should report incorrect code');
console.log('  ✓ Incorrect code correctly rejected with remaining attempts');

// Test 4: Correct code validation & single-use consumption
console.log('\nTest 4: Correct code validates and consumes token');
const validCheck = verifyCode(testEmail, genResult.code, 'password-reset');
assert.strictEqual(validCheck.valid, true);
assert.strictEqual(validCheck.identifier, testEmail);
console.log('  ✓ Code successfully verified');

// Test 5: Replay / reuse prevention
console.log('\nTest 5: Reusing the same code is strictly blocked');
const reuseCheck = verifyCode(testEmail, genResult.code, 'password-reset');
assert.strictEqual(reuseCheck.valid, false);
assert.strictEqual(reuseCheck.reused, true);
assert(reuseCheck.error.includes('already been used'), 'Should state code already used');
console.log('  ✓ Single-use rule strictly prevents reuse');

// Test 6: Expired code validation
console.log('\nTest 6: Expired code rejection');
clearCodeRecord('expired@test.com', 'password-reset');
// Manually write an expired record
const expiredRecord = {
  identifier: 'expired@test.com',
  purpose: 'password-reset',
  code: '123456',
  createdAt: Date.now() - 400000,
  expiresAt: Date.now() - 100000, // in the past
  resendAvailableAt: Date.now() - 100000,
  attempts: 0,
  maxAttempts: 5,
  used: false
};
localStorage.setItem('getapass_otp_password-reset_expired@test.com', JSON.stringify(expiredRecord));

const expiredCheck = verifyCode('expired@test.com', '123456', 'password-reset');
assert.strictEqual(expiredCheck.valid, false);
assert.strictEqual(expiredCheck.expired, true);
assert(expiredCheck.error.includes('expired'), 'Error message must specify code has expired');
console.log('  ✓ Expired code blocked with clear expiry message');

console.log('\n=== ALL PROMPT 1 OTP SECURITY TESTS PASSED ===\n');
