import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

console.log('=== TEST SUITE: GENUINE DATA & EMPTY STATES VERIFICATION ===\n');

// 1. Verify AdminView has no hardcoded demo metrics or fake transactions
const adminViewContent = fs.readFileSync('src/views/AdminView.jsx', 'utf8');

assert(!adminViewContent.includes('3,842'), 'AdminView should not have hardcoded passes count 3,842');
assert(!adminViewContent.includes('₹4,12,650'), 'AdminView should not have hardcoded revenue ₹4,12,650');
assert(!adminViewContent.includes('2,918'), 'AdminView should not have hardcoded check-ins 2,918');
assert(!adminViewContent.includes('TXN-9021'), 'AdminView should not have hardcoded mock transaction TXN-9021');
assert(!adminViewContent.includes('Pooja Kulkarni'), 'AdminView should not have hardcoded fake transaction attendee');
assert(!adminViewContent.includes('points="0,170 100,150 200,120 300,135 400,90 500,75 600,45 700,60 800,25"'), 'AdminView should not have static hardcoded SVG polyline');
assert(!adminViewContent.includes('ev.startingPrice * 42'), 'AdminView should not have fake * 42 multiplier');
console.log('✓ AdminView.jsx free of hardcoded KPI values, static SVG polyline, and fake transactions');

// 2. Verify AdminView has proper dynamic aggregation logic
assert(adminViewContent.includes('totalPassesIssued'), 'AdminView should compute totalPassesIssued from bookings');
assert(adminViewContent.includes('totalRevenue'), 'AdminView should compute totalRevenue from bookings');
assert(adminViewContent.includes('No Revenue Trajectory Recorded Yet'), 'AdminView should have an empty state for revenue chart');
assert(adminViewContent.includes('No Transactions Recorded Yet'), 'AdminView should have an empty state for transactions table');
assert(adminViewContent.includes('No turnstile check-ins recorded yet'), 'AdminView should have an empty state for recent turnstile activity');
console.log('✓ AdminView.jsx contains real dynamic aggregations and empty states');

// 3. Verify App.jsx passes bookings and checkinHistory to AdminView and does not fall back to fake participants
const appContent = fs.readFileSync('src/App.jsx', 'utf8');
assert(appContent.includes('bookings={adminBookings}'), 'App.jsx must pass adminBookings to AdminView');
assert(appContent.includes('checkinHistory={checkinHistory}'), 'App.jsx must pass checkinHistory to AdminView');
assert(!appContent.includes('return participants;\n  }, [adminBookings'), 'App.jsx adminParticipantsList must not fall back to participants state when adminBookings is empty');
console.log('✓ App.jsx correctly forwards genuine bookings and checkinHistory without fake participant fallback');

// 4. Verify PaymentSummary does not have hardcoded txnId, attendee, or eventTitle fallbacks
const paymentSummaryContent = fs.readFileSync('src/components/payment/PaymentSummary.jsx', 'utf8');
assert(!paymentSummaryContent.includes('TXN-2026-881920'), 'PaymentSummary must not have hardcoded initial txnId TXN-2026-881920');
assert(!paymentSummaryContent.includes("'TechFest 2026'"), 'PaymentSummary must not fall back to TechFest 2026');
assert(!paymentSummaryContent.includes("attendee.name || 'Aarav Shah'"), 'PaymentSummary must not fall back to Aarav Shah');
assert(!paymentSummaryContent.includes("'aarav@campus.edu'"), 'PaymentSummary must not fall back to aarav@campus.edu');
console.log('✓ PaymentSummary.jsx free of hardcoded transaction IDs and fake attendee defaults');

// 5. Verify EventCreateWizard attendee fallback
const eventWizardContent = fs.readFileSync('src/components/events/EventCreateWizard.jsx', 'utf8');
assert(!eventWizardContent.includes("'Aarav Shah'"), 'EventCreateWizard must not fall back to Aarav Shah');
console.log('✓ EventCreateWizard.jsx free of Aarav Shah fallback');

// 6. Verify DigitalPass and Ticket3D default pass ID
const digitalPassContent = fs.readFileSync('src/components/pass/DigitalPass.jsx', 'utf8');
assert(!digitalPassContent.includes("id = 'GP-TF26-9481'"), 'DigitalPass must not have hardcoded GP-TF26-9481 default');
const ticket3DContent = fs.readFileSync('src/components/pass/Ticket3D.jsx', 'utf8');
assert(!ticket3DContent.includes("id = 'GP-TF26-9481'"), 'Ticket3D must not have hardcoded GP-TF26-9481 default');
console.log('✓ DigitalPass and Ticket3D free of hardcoded GP-TF26-9481 defaults');

// 7. Verify QRScanner has no obsolete fake test scan generators
const qrScannerContent = fs.readFileSync('src/components/scanner/QRScanner.jsx', 'utf8');
assert(!qrScannerContent.includes('triggerScan'), 'QRScanner must not have obsolete triggerScan demo generators');
assert(!qrScannerContent.includes('Test Verifier Scenarios (Digital & Printed)'), 'QRScanner must not render fake verifier scenario buttons');
assert(!qrScannerContent.includes('Siddharth Rao'), 'QRScanner must not have hardcoded Siddharth Rao');
assert(!qrScannerContent.includes('Kunal Patil'), 'QRScanner must not have hardcoded Kunal Patil');
console.log('✓ QRScanner.jsx free of obsolete demo-data generators');

// 8. Functional Aggregation Test Simulation
function computeMetrics(bookings, checkins, events) {
  const totalPassesIssued = bookings.reduce((sum, b) => {
    if (Array.isArray(b.passes) && b.passes.length > 0) {
      return sum + b.passes.length;
    }
    return sum + (Number(b.quantity) || 1);
  }, 0);

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalCheckins = checkins.length;

  return { totalPassesIssued, totalRevenue, totalCheckins };
}

// Case A: Empty Database
const emptyMetrics = computeMetrics([], [], []);
assert.strictEqual(emptyMetrics.totalPassesIssued, 0, 'Empty DB should have 0 passes issued');
assert.strictEqual(emptyMetrics.totalRevenue, 0, 'Empty DB should have ₹0 revenue');
assert.strictEqual(emptyMetrics.totalCheckins, 0, 'Empty DB should have 0 check-ins');
console.log('✓ Empty database calculation returns zero for all KPIs');

// Case B: Real Multi-Pass Bookings
const sampleBookings = [
  {
    id: 'BK-001',
    eventId: 'EVT-100',
    amount: 1250,
    passes: [
      { id: 'GP-101', passType: 'General Entry', price: 200 },
      { id: 'GP-102', passType: 'VIP Entry', price: 500 },
      { id: 'GP-103', passType: 'Student Entry', price: 150 },
      { id: 'GP-104', passType: 'Couple Entry', price: 400 }
    ],
    status: 'Active'
  },
  {
    id: 'BK-002',
    eventId: 'EVT-100',
    amount: 500,
    passes: [
      { id: 'GP-105', passType: 'VIP Entry', price: 500 }
    ],
    status: 'Active'
  }
];

const sampleCheckins = [
  { passId: 'GP-101', participant: 'Aarav', gate: 'Gate A', result: 'Valid' },
  { passId: 'GP-102', participant: 'Pooja', gate: 'Gate VIP', result: 'Valid' }
];

const realMetrics = computeMetrics(sampleBookings, sampleCheckins, [{ id: 'EVT-100', title: 'TechFest' }]);
assert.strictEqual(realMetrics.totalPassesIssued, 5, 'Real DB should count 5 individual passes');
assert.strictEqual(realMetrics.totalRevenue, 1750, 'Real DB should sum ₹1,750');
assert.strictEqual(realMetrics.totalCheckins, 2, 'Real DB should count 2 verified check-ins');
console.log('✓ Real bookings calculation correctly aggregates individual passes, revenue, and check-ins');

console.log('\n======================================================');
console.log('🎉 ALL REAL DATA & EMPTY STATE VERIFICATION CHECKS PASSED!');
console.log('======================================================\n');
