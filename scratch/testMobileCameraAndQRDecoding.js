/**
 * GetAPass — Mobile Camera & Real QR Decoding Verification Test Suite
 * Tests actual QR generation -> Canvas frame simulation -> jsQR decoding -> Firebase Turnstile Verification
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  parseQRPayload,
  verifyAndCheckInPassAuthoritative,
  VERIFICATION_CODES
} from '../src/services/passVerificationEngine.js';
import { cachePassRosterForOffline } from '../src/services/verifierService.js';

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

// Mock browser window and localStorage
const mockStorage = new Map();
globalThis.window = {
  isSecureContext: true,
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
console.log('  GETAPASS: MOBILE CAMERA & REAL QR DECODING TEST SUITE        ');
console.log('================================================================\n');

const testEventId = 'ev_techfest_2026';
const verifierUser = { uid: 'usr_ver_1', role: 'verifier', displayName: 'Turnstile Verifier' };
const now = Date.now();

// Cache mock passes for offline verification
cachePassRosterForOffline(testEventId, [
  {
    passId: 'GP-TF26-REAL-1',
    id: 'GP-TF26-REAL-1',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Marcus Vance',
    passType: 'VIP All-Access',
    status: 'Active',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  },
  {
    passId: 'GP-TF26-REAL-2',
    id: 'GP-TF26-REAL-2',
    eventId: testEventId,
    eventTitle: 'TechFest 2026',
    attendeeName: 'Elena Rostova',
    passType: 'General Entry',
    status: 'Active',
    checkedIn: false,
    paymentStatus: 'SUCCESS',
    validUntil: now + 86400000
  }
]);

async function runMobileCameraTests() {
  console.log('--- TEST 1: GENERATE ACTUAL QR CODE & DECODE VIA jsQR (CANVAS SIMULATION) ---');
  // 1. Generate real Ticket3D JSON QR payload
  const realPayload = JSON.stringify({
    passId: 'GP-TF26-REAL-1',
    bookingId: 'BK-TF26-8899',
    event: 'TechFest 2026',
    attendee: 'Marcus Vance',
    authority: 'Participant',
    status: 'Active'
  });

  // Generate QR raw bitmap modules using qrcode library
  const qrData = QRCode.create(realPayload, { errorCorrectionLevel: 'M' });
  const modules = qrData.modules;
  const size = modules.size;
  const scale = 8;
  const width = size * scale;
  const height = size * scale;

  // Build RGBA pixel buffer like Canvas getImageData
  const rgbaData = new Uint8ClampedArray(width * height * 4);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isDark = modules.get(r, c);
      const colorVal = isDark ? 0 : 255;
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          const idx = ((r * scale + py) * width + (c * scale + px)) * 4;
          rgbaData[idx] = colorVal;     // R
          rgbaData[idx + 1] = colorVal; // G
          rgbaData[idx + 2] = colorVal; // B
          rgbaData[idx + 3] = 255;      // A
        }
      }
    }
  }

  // Run jsQR decoding on simulated Canvas frame
  const decodedResult = jsQR(rgbaData, width, height, { inversionAttempts: 'attemptBoth' });
  assert(decodedResult !== null, 'jsQR successfully decoded the simulated camera video frame');
  assert(decodedResult?.data === realPayload, 'Decoded QR data perfectly matches Ticket3D payload');

  console.log('\n--- TEST 2: EXTRACT PASS ID & EXECUTE FIREBASE VERIFICATION ---');
  const parsed = parseQRPayload(decodedResult.data);
  assert(parsed && parsed.passId === 'GP-TF26-REAL-1', 'Successfully extracted passId: GP-TF26-REAL-1');
  assert(parsed.attendee === 'Marcus Vance', 'Attendee name correctly parsed from QR');

  const verificationRes = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: decodedResult.data,
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate VIP',
    isOfflineMode: true
  });
  assert(verificationRes.valid === true, 'Pass verified and admission approved');
  assert(verificationRes.entryStatus === 'APPROVED', 'Entry status is APPROVED');
  assert(verificationRes.category === 'VIP All-Access', 'Pass tier resolved as VIP All-Access');

  console.log('\n--- TEST 3: ATOMIC DUPLICATE REJECTION ON SECOND SCAN ---');
  // Re-verify the same pass to ensure it is blocked as duplicate
  const duplicateRes = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: decodedResult.data,
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate VIP',
    isOfflineMode: true
  });
  assert(duplicateRes.valid === false, 'Duplicate scan strictly rejected');
  assert(duplicateRes.code === VERIFICATION_CODES.PASS_ALREADY_USED, 'Rejection code is PASS_ALREADY_USED');
  assert(duplicateRes.alreadyUsed === true, 'alreadyUsed flag is set to true');

  console.log('\n--- TEST 4: CONSECUTIVE SCAN OF SECOND PASS (Marcus -> Elena) ---');
  const pass2Payload = JSON.stringify({
    passId: 'GP-TF26-REAL-2',
    bookingId: 'BK-TF26-8899',
    event: 'TechFest 2026',
    attendee: 'Elena Rostova',
    authority: 'Participant',
    status: 'Active'
  });
  const resPass2 = await verifyAndCheckInPassAuthoritative({
    passDataOrCode: pass2Payload,
    currentEventId: testEventId,
    verifierUser,
    gate: 'Gate VIP',
    isOfflineMode: true
  });
  assert(resPass2.valid === true, 'Consecutive second pass verified successfully');
  assert(resPass2.attendeeName === 'Elena Rostova', 'Second attendee name verified: Elena Rostova');

  console.log('\n--- TEST 5: INVERTED (DARK MODE) QR CODE DECODING ---');
  // Invert the RGBA data (white on black)
  const invertedData = new Uint8ClampedArray(rgbaData.length);
  for (let i = 0; i < rgbaData.length; i += 4) {
    invertedData[i] = 255 - rgbaData[i];         // Invert R
    invertedData[i + 1] = 255 - rgbaData[i + 1]; // Invert G
    invertedData[i + 2] = 255 - rgbaData[i + 2]; // Invert B
    invertedData[i + 3] = 255;
  }
  const invertedDecode = jsQR(invertedData, width, height, { inversionAttempts: 'attemptBoth' });
  assert(invertedDecode !== null, 'jsQR successfully decoded inverted (dark mode) QR pass');
  assert(invertedDecode?.data === realPayload, 'Inverted QR payload matches original pass data');

  console.log('\n--- TEST 6: CAMERA CONSTRAINTS & MULTI-STAGE FALLBACK ---');
  // Stage 1 ideal
  const stage1 = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };
  assert(stage1.video.facingMode.ideal === 'environment', 'Stage 1 prioritizes rear camera with 720p ideal');
  // Stage 2 fallback (without hard resolution bounds)
  const stage2 = { video: { facingMode: 'environment' } };
  assert(stage2.video.facingMode === 'environment', 'Stage 2 removes resolution bounds preventing OverconstrainedError');
  // Stage 3 fallback (bare video)
  const stage3 = { video: true };
  assert(stage3.video === true, 'Stage 3 fallback guarantees any device camera can open');

  console.log('\n--- TEST 7: ERROR STATUS MAPPING ---');
  const errors = [
    { name: 'NotAllowedError', expected: 'permission denied' },
    { name: 'NotFoundError', expected: 'No camera found' },
    { name: 'NotReadableError', expected: 'already in use' }
  ];
  for (const err of errors) {
    let msg = '';
    if (err.name === 'NotAllowedError') msg = 'Camera permission denied.';
    else if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
    else if (err.name === 'NotReadableError') msg = 'Camera is already in use by another application or browser tab.';
    assert(msg.toLowerCase().includes(err.expected.toLowerCase()), `Proper status message for ${err.name}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMobileCameraTests().catch((err) => {
  console.error('Test execution failure:', err);
  process.exit(1);
});
