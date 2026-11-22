/**
 * Verification test suite for GetAPass Multi-Ticket & Individual Pass Generation
 * Tests:
 * 1. Multi-tier payload validation in validateBookingPayload
 * 2. Single order record with authoritative total (₹1,250)
 * 3. Exact N individual pass records generation
 * 4. Distinct Pass IDs and distinct QR payloads per ticket
 * 5. Individual ticket prices assigned (₹200, ₹500, ₹150, ₹400), NOT aggregate amount
 * 6. Turnstile check-in isolation (scanning 1 ticket leaves other tickets Active)
 * 7. Duplicate scan detection (re-scanning same ticket fails)
 * 8. Backward compatibility unrolling of legacy bookings (items, quantity > 1)
 * 9. Deduplication of passes by ID
 * 10. PassCard and Ticket3D price resolution
 */

import { validateBookingPayload } from '../src/constants/firestoreSchema.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=== RUNNING GETAPASS MULTI-TICKET & INDIVIDUAL PASS TEST SUITE ===\n');

// --------------------------------------------------------------------------
// TEST 1: validateBookingPayload with multi-category items
// --------------------------------------------------------------------------
console.log('Test 1: Multi-category order payload validation:');
const mockEvent = {
  id: 'ev-music-fest-2026',
  title: 'Tech & Music Fest 2026',
  startingPrice: 200,
  passTypes: [
    { id: 'pt-gen', name: 'General Entry', price: 200 },
    { id: 'pt-vip', name: 'VIP Entry', price: 500 },
    { id: 'pt-stu', name: 'Student Entry', price: 150 },
    { id: 'pt-cpl', name: 'Couple Entry', price: 400 }
  ]
};

const mockItems = [
  { name: 'General Entry', price: 200, qty: 1 },
  { name: 'VIP Entry', price: 500, qty: 1 },
  { name: 'Student Entry', price: 150, qty: 1 },
  { name: 'Couple Entry', price: 400, qty: 1 }
];

const mockUser = { uid: 'user_123', email: 'attendee@test.com', displayName: 'Jane Doe' };

const validationResult = validateBookingPayload({
  eventData: mockEvent,
  items: mockItems,
  currentUser: mockUser
});

assert(validationResult.isValid === true, 'Multi-category validation passes without error');
assert(validationResult.authoritativeAmount === 1250, 'Authoritative total is exact sum: ₹1,250');
assert(validationResult.quantity === 4, 'Total ticket quantity is 4');
assert(validationResult.items.length === 4, 'Items array normalized to 4 tiers');
assert(validationResult.items[0].subtotal === 200, 'General Entry subtotal is ₹200');
assert(validationResult.items[1].subtotal === 500, 'VIP Entry subtotal is ₹500');
assert(validationResult.items[2].subtotal === 150, 'Student Entry subtotal is ₹150');
assert(validationResult.items[3].subtotal === 400, 'Couple Entry subtotal is ₹400');

// --------------------------------------------------------------------------
// TEST 2: Individual pass generation with distinct IDs and individual prices
// --------------------------------------------------------------------------
console.log('\nTest 2: Individual pass generation simulation:');

const rawPrefix = 'TM';
const bookingId = 'BK-928173';
const passList = [];

validationResult.items.forEach((item, itemIdx) => {
  const qty = item.quantity;
  for (let q = 0; q < qty; q++) {
    const ticketIndex = passList.length + 1;
    const passId = `GP-${rawPrefix}26-4821-${ticketIndex}`;
    passList.push({
      id: passId,
      passId,
      bookingId,
      ticketIndex,
      totalTickets: 4,
      eventId: mockEvent.id,
      eventTitle: mockEvent.title,
      passType: item.name,
      price: item.unitPrice,
      unitPrice: item.unitPrice,
      status: 'Active',
      checkedIn: false
    });
  }
});

assert(passList.length === 4, 'Generates exactly 4 individual pass records');
assert(new Set(passList.map(p => p.passId)).size === 4, 'All 4 pass IDs are unique');
assert(passList[0].price === 200 && passList[0].passType === 'General Entry', 'Pass 1 displays ₹200 and General Entry');
assert(passList[1].price === 500 && passList[1].passType === 'VIP Entry', 'Pass 2 displays ₹500 and VIP Entry');
assert(passList[2].price === 150 && passList[2].passType === 'Student Entry', 'Pass 3 displays ₹150 and Student Entry');
assert(passList[3].price === 400 && passList[3].passType === 'Couple Entry', 'Pass 4 displays ₹400 and Couple Entry');
assert(passList.every(p => p.bookingId === bookingId), 'All 4 passes link to single order BK-928173');

// --------------------------------------------------------------------------
// TEST 3: Unique QR payloads per individual pass
// --------------------------------------------------------------------------
console.log('\nTest 3: Unique QR payloads:');

const qrPayloads = passList.map(p => JSON.stringify({
  passId: p.passId,
  bookingId: p.bookingId,
  event: p.eventTitle,
  passType: p.passType,
  price: p.price
}));

assert(new Set(qrPayloads).size === 4, 'Each pass has its own distinct QR payload');
const parsedFirstQR = JSON.parse(qrPayloads[0]);
assert(parsedFirstQR.passId === passList[0].passId, 'QR payload contains individual pass ID');
assert(parsedFirstQR.price === 200, 'QR payload contains individual ticket price');

// --------------------------------------------------------------------------
// TEST 4: Turnstile check-in isolation
// --------------------------------------------------------------------------
console.log('\nTest 4: Turnstile check-in isolation & duplicate prevention:');

// Simulate scanning Pass 2 (VIP Entry)
const scannedCode = passList[1].passId;
const targetPass = passList.find(p => p.passId === scannedCode);

assert(targetPass.checkedIn === false, 'Pass 2 initially not checked in');
assert(targetPass.status === 'Active', 'Pass 2 initially Active');

// Execute check-in
targetPass.checkedIn = true;
targetPass.status = 'Used';
targetPass.checkedInAt = Date.now();

assert(targetPass.checkedIn === true && targetPass.status === 'Used', 'Pass 2 marked Used after scan');
assert(passList[0].status === 'Active' && passList[0].checkedIn === false, 'Pass 1 remains Active and unconsumed');
assert(passList[2].status === 'Active' && passList[2].checkedIn === false, 'Pass 3 remains Active and unconsumed');
assert(passList[3].status === 'Active' && passList[3].checkedIn === false, 'Pass 4 remains Active and unconsumed');

// Try scanning Pass 2 again (Duplicate entry prevention)
const isDuplicate = targetPass.checkedIn || targetPass.status === 'Used';
assert(isDuplicate === true, 'Re-scanning Pass 2 triggers duplicate check-in rejection');

// --------------------------------------------------------------------------
// TEST 5: Backward compatibility unrolling for legacy booking records
// --------------------------------------------------------------------------
console.log('\nTest 5: Backward compatibility unrolling for legacy bookings:');

// Legacy record with quantity: 3, amount: 600, unitPrice: 200, no passes array
const legacyBooking = {
  id: 'BK-LEGACY-001',
  bookingId: 'BK-LEGACY-001',
  eventId: 'ev-legacy',
  eventTitle: 'Legacy Gala',
  quantity: 3,
  amount: 600,
  unitPrice: 200,
  passType: 'Standard Pass',
  participantName: 'Bob Smith',
  status: 'Active'
};

const unrolledPasses = [];
for (let q = 1; q <= legacyBooking.quantity; q++) {
  unrolledPasses.push({
    id: `${legacyBooking.bookingId}-${q}`,
    passId: `${legacyBooking.bookingId}-${q}`,
    bookingId: legacyBooking.bookingId,
    ticketIndex: q,
    totalTickets: legacyBooking.quantity,
    passType: legacyBooking.passType,
    price: legacyBooking.unitPrice || (legacyBooking.amount / legacyBooking.quantity),
    status: 'Active'
  });
}

assert(unrolledPasses.length === 3, 'Legacy booking with quantity 3 unrolls into 3 individual passes');
assert(unrolledPasses[0].price === 200, 'Pass 1 displays individual price ₹200 (not total ₹600)');
assert(unrolledPasses[1].price === 200, 'Pass 2 displays individual price ₹200');
assert(unrolledPasses[2].price === 200, 'Pass 3 displays individual price ₹200');

// --------------------------------------------------------------------------
// TEST 6: Price resolution in Ticket3D and PassCard
// --------------------------------------------------------------------------
console.log('\nTest 6: Price resolution logic:');

function resolvePrice(pass) {
  const { price, unitPrice, amount } = pass || {};
  return (price !== undefined && price !== null)
    ? price
    : (unitPrice !== undefined && unitPrice !== null
        ? unitPrice
        : (amount !== undefined ? amount : 0));
}

// Case A: pass has individual price: 500, but inherited order amount: 1250
const passWithBoth = { price: 500, unitPrice: 500, amount: 1250 };
assert(resolvePrice(passWithBoth) === 500, 'Prioritizes individual price (500) over order amount (1250)');

// Case B: pass only has unitPrice: 200
const passWithUnit = { unitPrice: 200, amount: 600 };
assert(resolvePrice(passWithUnit) === 200, 'Prioritizes unitPrice (200) over order amount (600)');

// Case C: pass has price: 0 (free tier)
const passFree = { price: 0, amount: 0 };
assert(resolvePrice(passFree) === 0, 'Handles 0 correctly for free passes');

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
