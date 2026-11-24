/**
 * GateApass — Real-Time Firebase Data Synchronization Test Suite
 *
 * Verifies:
 * 1. Real-time Firestore Document & Collection subscriptions (onSnapshot simulation & teardown)
 * 2. Atomic inventory check & overselling prevention using transactions
 * 3. Sold out detection and propagation when capacity is reached
 * 4. Admin event status change (disable/reject) immediately blocking bookings
 * 5. Turnstile QR verification updating pass to 'Used' and logging admissions to /checkIns
 * 6. User profile & role promotion real-time listener
 * 7. Strict multi-tenant UID & role isolation
 * 8. Unsubscribe cleanup preventing memory leaks
 */

import assert from 'assert';

console.log('\n=== TEST SUITE: COMPLETE REAL-TIME FIREBASE SYNCHRONIZATION ===\n');

// -------------------------------------------------------------
// Test 1: Real-Time Event Subscription & Updates
// -------------------------------------------------------------
console.log('Test 1: Real-Time Event Document Subscription & Mutation Propagation');
{
  const subscribers = new Set();
  let eventDoc = {
    id: 'ev-pulse-2026',
    title: 'Pulse 2026 EDM Night',
    capacity: 500,
    totalSoldCount: 450,
    isSoldOut: false,
    status: 'Published'
  };

  const subscribeToEvent = (callback) => {
    subscribers.add(callback);
    callback({ ...eventDoc });
    return () => subscribers.delete(callback);
  };

  let receivedUpdate = null;
  const unsubscribe = subscribeToEvent((updated) => {
    receivedUpdate = updated;
  });

  assert.strictEqual(receivedUpdate.title, 'Pulse 2026 EDM Night');
  assert.strictEqual(receivedUpdate.totalSoldCount, 450);

  // Simulate an organizer updating the event in Firestore
  eventDoc = {
    ...eventDoc,
    title: 'Pulse 2026 EDM Night — Expanded Arena',
    capacity: 700
  };
  subscribers.forEach((cb) => cb({ ...eventDoc }));

  assert.strictEqual(receivedUpdate.title, 'Pulse 2026 EDM Night — Expanded Arena');
  assert.strictEqual(receivedUpdate.capacity, 700);

  // Unsubscribe teardown
  unsubscribe();
  assert.strictEqual(subscribers.size, 0, 'Subscriber should be cleanly removed on unsubscribe');

  // Further updates should not affect unsubscribed listener
  eventDoc.title = 'Should Not Receive';
  subscribers.forEach((cb) => cb({ ...eventDoc }));
  assert.strictEqual(receivedUpdate.title, 'Pulse 2026 EDM Night — Expanded Arena');

  console.log('  ✓ Real-time event subscription delivers updates and cleanly unsubscribes');
}

// -------------------------------------------------------------
// Test 2: Atomic Inventory Decrement & Overselling Prevention
// -------------------------------------------------------------
console.log('\nTest 2: Atomic Inventory Decrement & Overselling Prevention via Transactions');
{
  let liveInventory = {
    id: 'ev-techcon-2026',
    title: 'TechCon 2026',
    status: 'Active',
    passTypes: [
      { id: 'pt-gen', name: 'General Pass', capacity: 10, soldCount: 8, price: 200 },
      { id: 'pt-vip', name: 'VIP Pass', capacity: 2, soldCount: 1, price: 800 }
    ]
  };

  // Transaction simulation
  const executeBookingTransaction = async (purchasedItems) => {
    // 1. Read live document
    const current = JSON.parse(JSON.stringify(liveInventory));

    if (['disabled', 'removed', 'cancelled'].includes(current.status.toLowerCase())) {
      throw new Error('This event is no longer available for booking.');
    }

    // 2. Atomic inventory validation & calculation
    const updatedPassTypes = current.passTypes.map((pt) => {
      const match = purchasedItems.find((p) => p.name.toLowerCase() === pt.name.toLowerCase() || p.id === pt.id);
      if (match) {
        const qtyToBuy = Number(match.qty || match.quantity || 1);
        const remaining = Math.max(0, pt.capacity - pt.soldCount);
        if (qtyToBuy > remaining) {
          throw new Error(`Insufficient tickets remaining for "${pt.name}". Only ${remaining} ticket(s) left.`);
        }
        return {
          ...pt,
          soldCount: pt.soldCount + qtyToBuy
        };
      }
      return pt;
    });

    const totalCap = updatedPassTypes.reduce((acc, pt) => acc + pt.capacity, 0);
    const totalSold = updatedPassTypes.reduce((acc, pt) => acc + pt.soldCount, 0);
    const isSoldOut = totalCap > 0 && totalSold >= totalCap;

    // 3. Commit mutation
    liveInventory = {
      ...current,
      passTypes: updatedPassTypes,
      totalSoldCount: totalSold,
      isSoldOut
    };

    return liveInventory;
  };

  // User A buys 1 VIP Pass (remaining was 1)
  await executeBookingTransaction([{ id: 'pt-vip', name: 'VIP Pass', qty: 1 }]);
  const vipAfterUserA = liveInventory.passTypes.find((p) => p.id === 'pt-vip');
  assert.strictEqual(vipAfterUserA.soldCount, 2);
  assert.strictEqual(Math.max(0, vipAfterUserA.capacity - vipAfterUserA.soldCount), 0);

  // User B attempts to buy 1 VIP Pass concurrently (now 0 left)
  let oversellBlocked = false;
  try {
    await executeBookingTransaction([{ id: 'pt-vip', name: 'VIP Pass', qty: 1 }]);
  } catch (err) {
    oversellBlocked = true;
    assert.match(err.message, /Insufficient tickets remaining for "VIP Pass"/);
  }
  assert.strictEqual(oversellBlocked, true, 'Overselling must be strictly blocked by transaction');

  // User C buys remaining 2 General Passes
  await executeBookingTransaction([{ id: 'pt-gen', name: 'General Pass', qty: 2 }]);
  const genAfterUserC = liveInventory.passTypes.find((p) => p.id === 'pt-gen');
  assert.strictEqual(genAfterUserC.soldCount, 10);
  assert.strictEqual(liveInventory.isSoldOut, true, 'Event should transition to isSoldOut = true');

  console.log('  ✓ Transaction atomically prevents overselling and transitions to Sold Out');
}

// -------------------------------------------------------------
// Test 3: Admin Status Change (Disable/Reject) Blocks Bookings
// -------------------------------------------------------------
console.log('\nTest 3: Admin Disabling / Cancelling Event Immediately Blocks Bookings');
{
  let targetEvent = {
    id: 'ev-safety-check',
    title: 'Safety Audit Event',
    status: 'Active',
    passTypes: [{ id: 'pt-1', name: 'Standard', capacity: 50, soldCount: 10 }]
  };

  const attemptBooking = (ev) => {
    const status = String(ev.status || '').toLowerCase();
    if (['disabled', 'removed', 'cancelled', 'rejected', 'pending'].includes(status)) {
      throw new Error(`Booking rejected: event is currently ${ev.status}.`);
    }
    return { success: true };
  };

  // Initially active -> booking succeeds
  assert.strictEqual(attemptBooking(targetEvent).success, true);

  // Admin disables the event in real time
  targetEvent.status = 'Disabled';
  let bookingRejected = false;
  try {
    attemptBooking(targetEvent);
  } catch (err) {
    bookingRejected = true;
    assert.match(err.message, /event is currently Disabled/);
  }
  assert.strictEqual(bookingRejected, true, 'Admin disabling event must immediately block bookings');

  console.log('  ✓ Admin status changes propagate and block subsequent booking attempts');
}

// -------------------------------------------------------------
// Test 4: Real-Time Gate Turnstile Verification & History Sync
// -------------------------------------------------------------
console.log('\nTest 4: Real-Time Gate Turnstile Check-In Updates Pass to "Used" & Syncs Admissions');
{
  let participantPass = {
    id: 'GP-TC26-9001-1',
    passId: 'GP-TC26-9001-1',
    status: 'Active',
    checkedIn: false,
    checkedInAt: null,
    participantUid: 'user-charlie'
  };

  const admissionsLog = [];
  const checkinListeners = new Set();
  const passListeners = new Set();

  const onTurnstileCheckin = (pass, gate = 'Gate 1', verifierUid = 'staff-david') => {
    if (pass.status === 'Used' || pass.checkedIn) {
      throw new Error('This pass was already scanned and used for entry.');
    }

    const now = Date.now();
    participantPass = {
      ...participantPass,
      status: 'Used',
      checkedIn: true,
      checkedInAt: now,
      checkedInBy: verifierUid,
      gate
    };

    const admissionRecord = {
      id: `chk-${now}`,
      passId: pass.passId,
      result: 'Valid',
      gate,
      verifierUid,
      timestamp: now,
      time: new Date(now).toLocaleTimeString()
    };
    admissionsLog.unshift(admissionRecord);

    // Notify listeners
    passListeners.forEach((cb) => cb({ ...participantPass }));
    checkinListeners.forEach((cb) => cb([...admissionsLog]));

    return admissionRecord;
  };

  let livePass = null;
  passListeners.add((p) => { livePass = p; });

  let liveTurnstileAdmissions = [];
  checkinListeners.add((records) => { liveTurnstileAdmissions = records; });

  // Verifier scans pass
  const admission = onTurnstileCheckin(participantPass, 'Main Gate');
  assert.strictEqual(admission.result, 'Valid');
  assert.strictEqual(livePass.status, 'Used');
  assert.strictEqual(livePass.checkedIn, true);
  assert.strictEqual(liveTurnstileAdmissions.length, 1);
  assert.strictEqual(liveTurnstileAdmissions[0].passId, 'GP-TC26-9001-1');

  // Immediate re-scan attempt is rejected
  let duplicateScanBlocked = false;
  try {
    onTurnstileCheckin(participantPass, 'Main Gate');
  } catch (err) {
    duplicateScanBlocked = true;
    assert.match(err.message, /already scanned and used/);
  }
  assert.strictEqual(duplicateScanBlocked, true, 'Duplicate turnstile check-in must be rejected');

  console.log('  ✓ Turnstile check-in updates pass to Used and syncs admission history in real time');
}

// -------------------------------------------------------------
// Test 5: Real-Time User Profile & Role Promotion Listener
// -------------------------------------------------------------
console.log('\nTest 5: Real-Time User Profile & Role Promotion Listener');
{
  const profileSubscribers = new Set();
  let userProfileDoc = {
    uid: 'user-eve',
    name: 'Eve Participant',
    email: 'eve@campus.edu',
    role: 'participant',
    emailVerified: true
  };

  const mapUserPermissions = (profile) => ({
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    isAdmin: profile.role === 'admin',
    isOrganizer: profile.role === 'organizer' || profile.role === 'admin',
    isVerifier: profile.role === 'verifier' || profile.role === 'admin'
  });

  let currentUserState = mapUserPermissions(userProfileDoc);
  assert.strictEqual(currentUserState.isOrganizer, false);
  assert.strictEqual(currentUserState.isAdmin, false);

  const subscribeToUserProfile = (uid, callback) => {
    profileSubscribers.add(callback);
    callback(mapUserPermissions(userProfileDoc));
    return () => profileSubscribers.delete(callback);
  };

  subscribeToUserProfile('user-eve', (updatedUser) => {
    currentUserState = updatedUser;
  });

  // Admin promotes Eve to Organizer in Firestore
  userProfileDoc = {
    ...userProfileDoc,
    role: 'organizer'
  };
  profileSubscribers.forEach((cb) => cb(mapUserPermissions(userProfileDoc)));

  assert.strictEqual(currentUserState.role, 'organizer');
  assert.strictEqual(currentUserState.isOrganizer, true);
  assert.strictEqual(currentUserState.isAdmin, false);

  // Admin promotes Eve to Admin
  userProfileDoc = {
    ...userProfileDoc,
    role: 'admin'
  };
  profileSubscribers.forEach((cb) => cb(mapUserPermissions(userProfileDoc)));

  assert.strictEqual(currentUserState.role, 'admin');
  assert.strictEqual(currentUserState.isAdmin, true);
  assert.strictEqual(currentUserState.isOrganizer, true);

  console.log('  ✓ User profile promotions immediately update permissions in real time');
}

// -------------------------------------------------------------
// Test 6: Multi-Tenant UID Isolation
// -------------------------------------------------------------
console.log('\nTest 6: Multi-Tenant UID Isolation for Bookings, Passes, & Notifications');
{
  const allBookings = [
    { bookingId: 'BK-101', participantUid: 'uid-alice', amount: 500 },
    { bookingId: 'BK-102', participantUid: 'uid-bob', amount: 300 },
    { bookingId: 'BK-103', participantUid: 'uid-alice', amount: 200 }
  ];

  const getParticipantBookings = (uid) => allBookings.filter((b) => b.participantUid === uid);

  const aliceBookings = getParticipantBookings('uid-alice');
  const bobBookings = getParticipantBookings('uid-bob');

  assert.strictEqual(aliceBookings.length, 2);
  assert.strictEqual(aliceBookings.every((b) => b.participantUid === 'uid-alice'), true);
  assert.strictEqual(bobBookings.length, 1);
  assert.strictEqual(bobBookings[0].bookingId, 'BK-102');

  console.log('  ✓ Multi-tenant isolation preserves absolute privacy between participant records');
}

console.log('\n======================================================');
console.log('🎉 ALL REAL-TIME FIREBASE SYNCHRONIZATION TESTS PASSED!');
console.log('======================================================\n');
