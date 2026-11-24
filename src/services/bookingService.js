/**
 * GetAPass — Booking & Digital Pass Service
 *
 * Enforces strict multi-tenant isolation based on Firebase UID:
 * - Participant UID (participantUid) owns attendee bookings, purchased passes, and payment receipts.
 * - Organizer UID (organizerUid) owns event-level ticket sales, check-in records, and revenue analytics.
 * - Global Administrator holds platform-wide read and audit privileges.
 *
 * Coordinated Architecture:
 * Automatically synchronizes related records across:
 * - /bookings
 * - /passes
 * - /transactions
 * - /notifications
 * - /checkIns
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { canValidatePasses, canManagePlatform } from './permissionService';
import {
  COLLECTIONS,
  STATUS_ENUMS,
  generateBookingId,
  generatePassId,
  validateBookingPayload
} from '../constants/firestoreSchema';
import { fetchPaginatedCollection, getServerTimestamp } from './firestoreService';
import { createDigitalPass } from './passService';
import { createTransaction } from './transactionService';
import { createNotification } from './notificationService';
import { recordCheckInAuditLog } from './verifierService';
import { verifyAndConfirmPayment } from './paymentVerificationService';

export const BOOKINGS_COLLECTION = COLLECTIONS.BOOKINGS;
export const BOOKINGS_STORAGE_KEY_PREFIX = 'gateapass_bookings_';
export const PASSES_STORAGE_KEY_PREFIX = 'gateapass_passes_';

// In-memory caches isolated per user
let _currentParticipantUid = null;
let memoryBookingsCache = [];
let memoryPassesCache = [];

/**
 * Strips undefined values to prevent Firestore serialization errors.
 */
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((v) => v !== undefined);
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

export function clearSessionBookingCache() {
  _currentParticipantUid = null;
  memoryBookingsCache = [];
  memoryPassesCache = [];
}

export function getStoredUserBookings(userId) {
  if (!userId) return [];
  if (_currentParticipantUid === userId && memoryBookingsCache.length > 0) {
    return memoryBookingsCache;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(`${BOOKINGS_STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryBookingsCache = parsed;
          _currentParticipantUid = userId;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[GateApass Bookings] Could not load local bookings cache:', err);
  }
  return [];
}

export function saveStoredUserBookings(userId, bookingsArray) {
  if (!userId || !Array.isArray(bookingsArray)) return;
  _currentParticipantUid = userId;
  memoryBookingsCache = bookingsArray;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${BOOKINGS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(bookingsArray));
    }
  } catch (err) {
    console.warn('[GateApass Bookings] Could not save local bookings cache:', err);
  }
}

export function getStoredUserPasses(userId) {
  if (!userId) return [];
  if (_currentParticipantUid === userId && memoryPassesCache.length > 0) {
    return memoryPassesCache;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(`${PASSES_STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryPassesCache = parsed;
          _currentParticipantUid = userId;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[GateApass Passes] Could not load local passes cache:', err);
  }
  return [];
}

export function saveStoredUserPasses(userId, passesArray) {
  if (!userId || !Array.isArray(passesArray)) return;
  _currentParticipantUid = userId;
  memoryPassesCache = passesArray;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${PASSES_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(passesArray));
    }
  } catch (err) {
    console.warn('[GateApass Passes] Could not save local passes cache:', err);
  }
}

/**
 * Authoritative Booking & Pass Creation
 *
 * Security:
 * - Validates prices against the event/passType model (never blindly trusts client price)
 * - Automatically writes /bookings, /passes, /transactions, and /notifications
 * - Strictly binds participantUid to currentUser.uid
 */
export async function createBooking(bookingData, currentUser, eventData = null) {
  if (!bookingData) throw new Error('Booking data is required.');
  if (!currentUser?.uid) {
    throw new Error('Authentication required: You must be signed in to purchase a pass.');
  }

  // 1. Authoritative price resolution & multi-tier item validation (Never trust client prices)
  const validation = validateBookingPayload({
    eventData,
    passTypeData: bookingData.passTypeData,
    quantity: bookingData.quantity || (bookingData.passes ? bookingData.passes.length : 1),
    items: bookingData.items,
    bookedPasses: bookingData.bookedPasses,
    passes: bookingData.passes,
    clientAmount: bookingData.amount,
    currentUser
  });

  if (!validation.isValid) {
    throw new Error(`Booking validation failed: ${validation.errors.join(' ')}`);
  }

  const authoritativeAmount = validation.authoritativeAmount || Number(bookingData.amount || 0);
  const bookingId = bookingData.bookingId || generateBookingId();
  const eventId = bookingData.eventId || eventData?.id || '';
  const eventTitle = bookingData.eventTitle || eventData?.title || eventData?.name || 'Campus Event';
  const organizerUid = bookingData.organizerUid || eventData?.organizerUid || '';
  const organizerEmail = bookingData.organizerEmail || eventData?.organizerEmail || '';
  const now = Date.now();
  const rawPrefix = String(eventTitle).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'GP';

  const paymentReference = bookingData.paymentReference ||
    bookingData.paymentDetails?.reference ||
    `PAY_${now.toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 1b. Server-Side Payment Verification & Idempotency / Replay Guard
  const paymentVerification = await verifyAndConfirmPayment({
    bookingId,
    eventId,
    authoritativeAmount,
    paymentMethod: bookingData.paymentMethod || 'UPI',
    paymentDetails: {
      ...(bookingData.paymentDetails || {}),
      amountPaid: authoritativeAmount
    },
    paymentReference,
    currentUser
  });

  if (!paymentVerification.verified || paymentVerification.status === 'FAILED') {
    throw new Error(`Payment verification declined: ${paymentVerification.reason || 'Payment could not be verified by gateway.'}`);
  }

  const isConfirmed = paymentVerification.status === 'SUCCESS';
  const bookingStatus = isConfirmed ? STATUS_ENUMS.BOOKING.ACTIVE : 'Pending Payment';
  const passStatus = isConfirmed ? STATUS_ENUMS.PASS.ACTIVE : 'Pending Payment';

  // 2. Build canonical individual pass list (1 distinct pass per purchased ticket)
  const passList = [];

  if (Array.isArray(bookingData.passes) && bookingData.passes.length > 0) {
    // If pre-constructed individual pass records were passed (e.g. from handlePaymentSuccess)
    bookingData.passes.forEach((p, idx) => {
      const ticketNum = idx + 1;
      const passId = p.passId || p.id || `GP-${rawPrefix}26-${Math.floor(1000 + Math.random() * 9000)}-${ticketNum}`;
      const itemPrice = Number(p.price !== undefined ? p.price : (p.unitPrice !== undefined ? p.unitPrice : 0));

      passList.push({
        ...p,
        id: passId,
        passId,
        bookingId,
        ticketIndex: ticketNum,
        totalTickets: bookingData.passes.length,
        eventId,
        eventTitle,
        organizerUid,
        participantUid: currentUser.uid,
        participantEmail: currentUser.email || '',
        attendeeName: p.attendeeName || bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
        passType: p.passType || p.name || 'Standard Pass',
        authority: p.authority || bookingData.authority || 'Participant',
        date: p.date || eventData?.date || bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: p.time || eventData?.time || bookingData.time || '09:00 AM – 06:00 PM',
        venue: p.venue || eventData?.venue || bookingData.venue || 'Campus Venue',
        category: p.category || eventData?.category || bookingData.category || 'Concert',
        coverImage: p.coverImage || eventData?.coverImage || eventData?.image || bookingData.coverImage || '',
        eventCover: p.eventCover || eventData?.coverImage || eventData?.image || bookingData.eventCover || '',
        gate: p.gate || bookingData.gate || 'Gate A',
        status: passStatus,
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        price: itemPrice,
        unitPrice: itemPrice,
        paymentMethod: bookingData.paymentMethod || 'UPI',
        paymentReference,
        issuedAt: 'Just now',
        permissions: p.permissions || bookingData.permissions || ['General Area'],
        templateId: p.templateId || bookingData.templateId || 'tpl-classic-violet',
        templateVersion: p.templateVersion || 1,
        templateSnapshot: p.templateSnapshot || bookingData.templateSnapshot || null,
        createdAt: p.createdAt || now,
        updatedAt: p.updatedAt || now
      });
    });
  } else if (validation.items && validation.items.length > 0) {
    // Unroll directly from validated items array
    let ticketNum = 1;
    const totalTickets = validation.quantity;

    validation.items.forEach((item) => {
      const qty = item.quantity || item.qty || 1;
      const itemPrice = Number(item.unitPrice !== undefined ? item.unitPrice : item.price);

      for (let q = 0; q < qty; q++) {
        const passId = `GP-${rawPrefix}26-${Math.floor(1000 + Math.random() * 9000)}-${ticketNum}`;
        passList.push({
          id: passId,
          passId,
          bookingId,
          ticketIndex: ticketNum,
          totalTickets,
          eventId,
          eventTitle,
          organizerUid,
          participantUid: currentUser.uid,
          participantEmail: currentUser.email || '',
          attendeeName: bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
          passType: item.passType || item.name || 'Standard Pass',
          authority: bookingData.authority || 'Participant',
          date: eventData?.date || bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: eventData?.time || bookingData.time || '09:00 AM – 06:00 PM',
          venue: eventData?.venue || bookingData.venue || 'Campus Venue',
          category: eventData?.category || bookingData.category || 'Concert',
          coverImage: eventData?.coverImage || eventData?.image || bookingData.coverImage || '',
          eventCover: eventData?.coverImage || eventData?.image || bookingData.eventCover || '',
          gate: bookingData.gate || 'Gate A',
          status: passStatus,
          checkedIn: false,
          checkedInAt: null,
          checkedInBy: null,
          price: itemPrice,
          unitPrice: itemPrice,
          paymentMethod: bookingData.paymentMethod || 'UPI',
          paymentReference,
          issuedAt: 'Just now',
          permissions: bookingData.permissions || ['General Area'],
          templateId: item.templateId || bookingData.templateId || 'tpl-classic-violet',
          templateVersion: 1,
          templateSnapshot: bookingData.templateSnapshot || null,
          createdAt: now,
          updatedAt: now
        });
        ticketNum++;
      }
    });
  } else {
    // Single ticket fallback
    const passId = bookingData.passId || `GP-${rawPrefix}26-${Math.floor(1000 + Math.random() * 9000)}-1`;
    passList.push({
      id: passId,
      passId,
      bookingId,
      ticketIndex: 1,
      totalTickets: 1,
      eventId,
      eventTitle,
      organizerUid,
      participantUid: currentUser.uid,
      participantEmail: currentUser.email || '',
      attendeeName: bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
      passType: bookingData.passType || 'Standard Pass',
      authority: bookingData.authority || 'Participant',
      date: eventData?.date || bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: eventData?.time || bookingData.time || '09:00 AM – 06:00 PM',
      venue: eventData?.venue || bookingData.venue || 'Campus Venue',
      category: eventData?.category || bookingData.category || 'Concert',
      coverImage: eventData?.coverImage || eventData?.image || bookingData.coverImage || '',
      eventCover: eventData?.coverImage || eventData?.image || bookingData.eventCover || '',
      gate: bookingData.gate || 'Gate A',
      status: STATUS_ENUMS.PASS.ACTIVE,
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      price: validation.unitPrice,
      unitPrice: validation.unitPrice,
      paymentMethod: bookingData.paymentMethod || 'UPI',
      issuedAt: 'Just now',
      permissions: bookingData.permissions || ['General Area'],
      templateId: bookingData.templateId || 'tpl-classic-violet',
      templateVersion: 1,
      templateSnapshot: bookingData.templateSnapshot || null,
      createdAt: now,
      updatedAt: now
    });
  }

  // 3. Construct unified parent Booking record (One order covering all purchased passes)
  const passTypeSummary = passList.length === 1
    ? passList[0].passType
    : `${passList.length} Passes (${[...new Set(passList.map((p) => p.passType))].join(', ')})`;

  const newBooking = {
    ...bookingData,
    id: bookingId,
    bookingId,
    passId: passList[0]?.passId || '', // backward compatibility pointer
    passIds: passList.map((p) => p.passId),
    eventId,
    eventTitle,
    organizerUid,
    organizerEmail,
    participantUid: currentUser.uid,
    participantEmail: currentUser.email || '',
    participantName: currentUser.displayName || currentUser.name || bookingData.attendeeName || 'Participant',
    passType: passTypeSummary,
    unitPrice: validation.unitPrice,
    quantity: passList.length,
    totalTickets: passList.length,
    amount: authoritativeAmount,
    items: validation.items || [],
    passes: passList,
    pass: passList[0], // backward compatibility
    status: bookingStatus,
    paymentMethod: bookingData.paymentMethod || 'UPI',
    paymentReference,
    paymentStatus: paymentVerification.status,
    date: bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: now,
    updatedAt: now
  };

  // 4. Update local storage caches for instant zero-latency UI
  const localBookings = getStoredUserBookings(currentUser.uid);
  const updatedBookings = [newBooking, ...localBookings.filter((b) => b.bookingId !== bookingId)];
  saveStoredUserBookings(currentUser.uid, updatedBookings);

  const localPasses = getStoredUserPasses(currentUser.uid);
  const newPassIds = new Set(passList.map((p) => p.passId));
  const updatedPasses = [...passList, ...localPasses.filter((p) => !newPassIds.has(p.passId))];
  saveStoredUserPasses(currentUser.uid, updatedPasses);

  // 5. Coordinated persistence to Firestore: /bookings, /passes, /transactions, /notifications
  let createdTransaction = null;
  if (db) {
    try {
      // 5a. Atomic inventory check & decrement (Strict overselling prevention)
      if (eventId) {
        try {
          const eventRef = doc(db, 'events', eventId);
          await runTransaction(db, async (txn) => {
            const eventSnap = await txn.get(eventRef);
            if (!eventSnap.exists()) {
              throw new Error('Event does not exist.');
            }
            const liveEvent = eventSnap.data();

            // Status guard
            const liveStatus = String(liveEvent.status || 'Active').toLowerCase();
            if (!['active', 'published'].includes(liveStatus)) {
              throw new Error(`This event is no longer available for booking (status: ${liveEvent.status}).`);
            }

            // Inventory check & update
            if (Array.isArray(liveEvent.passTypes) && liveEvent.passTypes.length > 0) {
              const updatedPassTypes = liveEvent.passTypes.map((pt) => {
                const purchased = (validation.items || []).find((it) =>
                  (it.passType && it.passType.toLowerCase() === pt.name.toLowerCase()) ||
                  (it.name && it.name.toLowerCase() === pt.name.toLowerCase()) ||
                  it.id === pt.id
                );

                if (purchased) {
                  const qtyToBuy = Number(purchased.quantity || purchased.qty || 1);
                  const cap = Number(pt.capacity !== undefined ? pt.capacity : 100);
                  const sold = Number(pt.soldCount || 0);
                  const remaining = Math.max(0, cap - sold);

                  if (qtyToBuy > remaining) {
                    throw new Error(`Insufficient tickets remaining for "${pt.name}". Only ${remaining} ticket(s) left.`);
                  }

                  return {
                    ...pt,
                    soldCount: sold + qtyToBuy
                  };
                }
                return pt;
              });

              const totalCap = updatedPassTypes.reduce((s, pt) => s + (Number(pt.capacity) || 0), 0);
              const totalSold = updatedPassTypes.reduce((s, pt) => s + (Number(pt.soldCount) || 0), 0);
              const isSoldOut = totalCap > 0 && totalSold >= totalCap;

              txn.update(eventRef, {
                passTypes: updatedPassTypes,
                totalSoldCount: totalSold,
                isSoldOut,
                updatedAt: Date.now()
              });
            }
          });
        } catch (invErr) {
          if (
            invErr.message.includes('Insufficient tickets') ||
            invErr.message.includes('no longer available') ||
            invErr.message.includes('does not exist')
          ) {
            throw invErr; // Abort booking on overselling or disabled event!
          }
          console.warn('[GateApass Bookings] Event inventory transaction notice:', invErr.message);
        }
      }

      // 5b. Save Booking into /bookings collection with server timestamp
      const cleanBooking = sanitizeForFirestore({
        ...newBooking,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp()
      });
      await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), cleanBooking);

      // 5c. Save each individual Pass into dedicated /passes collection (only if payment confirmed)
      if (isConfirmed) {
        for (const passItem of passList) {
          try {
            await createDigitalPass({
              ...passItem,
              customPassId: passItem.passId
            });
          } catch (passErr) {
            console.warn('[GateApass Bookings] Coordinated pass write notice:', passErr);
          }
        }
      }

      // 5d. Save Transaction into dedicated /transactions collection
      try {
        createdTransaction = await createTransaction({
          bookingId,
          eventId,
          eventTitle,
          participantUid: currentUser.uid,
          organizerUid,
          amount: authoritativeAmount,
          currency: 'INR',
          paymentMethod: newBooking.paymentMethod,
          gatewayRef: paymentReference,
          status: isConfirmed ? STATUS_ENUMS.TRANSACTION.SUCCESS : 'Pending'
        });
      } catch (txErr) {
        console.warn('[GateApass Bookings] Coordinated transaction write notice:', txErr);
      }

      // 5e. Dispatch confirmation notification
      try {
        await createNotification({
          recipientUid: currentUser.uid,
          title: 'Tickets Confirmed!',
          message: `Your booking for ${eventTitle} (₹${authoritativeAmount}) with ${passList.length} digital ${passList.length === 1 ? 'pass' : 'passes'} is confirmed. Digital tickets are ready in your wallet.`,
          type: 'ticket',
          actionUrl: '/profile'
        });
      } catch (notifErr) {
        console.warn('[GateApass Bookings] Coordinated notification write notice:', notifErr);
      }

      console.log(`[GateApass Bookings] Successfully created booking ${bookingId} with ${passList.length} individual passes.`);
    } catch (err) {
      console.error('[GateApass Bookings] Error storing booking in Firestore:', err);
      throw err;
    }
  }

  return { booking: newBooking, passes: passList, pass: passList[0], transaction: createdTransaction };
}

/**
 * Paginated query for participant bookings.
 */
export async function fetchParticipantBookingsPaginated(participantUid, { pageSize = 15, lastDoc = null } = {}) {
  if (!participantUid) return { items: [], lastDoc: null, hasMore: false };

  return fetchPaginatedCollection({
    collectionName: BOOKINGS_COLLECTION,
    constraints: [where('participantUid', '==', participantUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Paginated query for organizer bookings.
 */
export async function fetchOrganizerBookingsPaginated(organizerUid, actor, { pageSize = 20, lastDoc = null } = {}) {
  if (!organizerUid) return { items: [], lastDoc: null, hasMore: false };

  const isSelf = actor?.uid === organizerUid;
  const isAdmin = canManagePlatform(actor);
  if (!isSelf && !isAdmin) {
    throw new Error('Unauthorized: You can only view bookings for events you organize.');
  }

  return fetchPaginatedCollection({
    collectionName: BOOKINGS_COLLECTION,
    constraints: [where('organizerUid', '==', organizerUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Real-time subscription to a participant's bookings and passes.
 */
export function subscribeToParticipantBookings(participantUid, onUpdate, onError) {
  if (!participantUid) {
    if (onUpdate) onUpdate([], []);
    return () => {};
  }

  const cachedBookings = getStoredUserBookings(participantUid);
  const cachedPasses = getStoredUserPasses(participantUid);
  if (cachedBookings.length > 0 || cachedPasses.length > 0) {
    if (onUpdate) onUpdate(cachedBookings, cachedPasses);
  }

  if (!db) return () => {};

  try {
    let latestBookings = cachedBookings;
    const passMap = new Map();
    cachedPasses.forEach((p) => passMap.set(p.passId || p.id, p));

    const notify = () => {
      const passes = Array.from(passMap.values());
      latestBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      passes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      saveStoredUserBookings(participantUid, latestBookings);
      saveStoredUserPasses(participantUid, passes);

      if (onUpdate) onUpdate(latestBookings, passes);
    };

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('participantUid', '==', participantUid)
    );

    const unsubBookings = onSnapshot(
      q,
      (snapshot) => {
        const bookings = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const bookingItem = { ...data, id: docSnap.id };
          bookings.push(bookingItem);

          // 1. If booking has an array of individual passes (Multi-pass architecture)
          if (Array.isArray(data.passes) && data.passes.length > 0) {
            data.passes.forEach((p, idx) => {
              const passId = p.passId || p.id || `${data.bookingId || docSnap.id}-${idx + 1}`;
              const individualPrice = p.price !== undefined
                ? Number(p.price)
                : (p.unitPrice !== undefined
                    ? Number(p.unitPrice)
                    : Math.round(Number(data.amount || 0) / data.passes.length));

              const existing = passMap.get(passId);
              passMap.set(passId, {
                ...p,
                ...existing,
                id: passId,
                passId,
                bookingId: data.bookingId || docSnap.id,
                eventId: data.eventId,
                eventTitle: data.eventTitle,
                organizerUid: data.organizerUid,
                participantUid: data.participantUid,
                attendeeName: p.attendeeName || data.participantName || 'Attendee',
                passType: p.passType || p.name || 'Standard Pass',
                price: individualPrice,
                unitPrice: individualPrice,
                ticketIndex: p.ticketIndex || idx + 1,
                totalTickets: p.totalTickets || data.passes.length,
                date: p.date || data.date,
                time: p.time || data.time || '09:00 AM – 06:00 PM',
                venue: p.venue || data.venue || 'Campus Venue',
                gate: p.gate || data.gate || 'Gate A',
                status: existing?.status || p.status || data.status || STATUS_ENUMS.PASS.ACTIVE,
                checkedIn: existing?.checkedIn !== undefined ? existing.checkedIn : Boolean(p.checkedIn),
                checkedInAt: existing?.checkedInAt || p.checkedInAt || null,
                paymentMethod: p.paymentMethod || data.paymentMethod,
                category: p.category || data.category || 'Concert',
                coverImage: p.coverImage || data.coverImage || '',
                eventCover: p.eventCover || data.coverImage || '',
                createdAt: p.createdAt || data.createdAt || Date.now(),
                updatedAt: p.updatedAt || data.updatedAt || Date.now()
              });
            });
          }
          // 2. Legacy booking with itemized breakdown but without data.passes
          else if (Array.isArray(data.items) && data.items.length > 0) {
            let passIndex = 1;
            const totalTickets = data.items.reduce((acc, it) => acc + Number(it.quantity || it.qty || 1), 0);

            data.items.forEach((it) => {
              const qty = Number(it.quantity || it.qty || 1);
              const itemPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price !== undefined ? it.price : 0));

              for (let q = 0; q < qty; q++) {
                const passId = `${data.bookingId || docSnap.id}-${passIndex}`;
                const existing = passMap.get(passId);
                passMap.set(passId, {
                  ...existing,
                  id: passId,
                  passId,
                  bookingId: data.bookingId || docSnap.id,
                  ticketIndex: passIndex,
                  totalTickets,
                  eventId: data.eventId,
                  eventTitle: data.eventTitle,
                  organizerUid: data.organizerUid,
                  participantUid: data.participantUid,
                  attendeeName: data.participantName || 'Attendee',
                  passType: it.passType || it.name || 'Standard Pass',
                  authority: 'Participant',
                  date: data.date,
                  time: data.time || '09:00 AM – 06:00 PM',
                  venue: data.venue || 'Campus Venue',
                  gate: data.gate || 'Gate A',
                  status: existing?.status || data.status || STATUS_ENUMS.PASS.ACTIVE,
                  checkedIn: existing?.checkedIn !== undefined ? existing.checkedIn : false,
                  price: itemPrice,
                  unitPrice: itemPrice,
                  paymentMethod: data.paymentMethod,
                  permissions: ['General Area'],
                  category: data.category || 'Concert',
                  coverImage: data.coverImage || '',
                  eventCover: data.coverImage || '',
                  createdAt: data.createdAt || Date.now()
                });
                passIndex++;
              }
            });
          }
          // 3. Legacy booking with quantity > 1
          else if (Number(data.quantity) > 1) {
            const qty = Number(data.quantity);
            const unitPrice = Number(data.unitPrice !== undefined ? data.unitPrice : Math.round(Number(data.amount || 0) / qty));

            for (let q = 1; q <= qty; q++) {
              const passId = `${data.passId || docSnap.id}-${q}`;
              const existing = passMap.get(passId);
              passMap.set(passId, {
                ...existing,
                id: passId,
                passId,
                bookingId: data.bookingId || docSnap.id,
                ticketIndex: q,
                totalTickets: qty,
                eventId: data.eventId,
                eventTitle: data.eventTitle,
                organizerUid: data.organizerUid,
                participantUid: data.participantUid,
                attendeeName: data.participantName || 'Attendee',
                passType: data.passType || 'Standard Pass',
                authority: data.authority || 'Participant',
                date: data.date,
                time: data.time || '09:00 AM – 06:00 PM',
                venue: data.venue || 'Campus Venue',
                gate: data.gate || 'Gate A',
                status: existing?.status || data.status || STATUS_ENUMS.PASS.ACTIVE,
                checkedIn: existing?.checkedIn !== undefined ? existing.checkedIn : false,
                price: unitPrice,
                unitPrice: unitPrice,
                paymentMethod: data.paymentMethod,
                permissions: data.permissions || ['General Area'],
                category: data.category || 'Concert',
                coverImage: data.coverImage || '',
                eventCover: data.coverImage || '',
                createdAt: data.createdAt || Date.now()
              });
            }
          }
          // 4. Single pass inside data.pass
          else if (data.pass) {
            const p = data.pass;
            const passId = p.passId || p.id || data.passId || docSnap.id;
            const individualPrice = p.price !== undefined
              ? Number(p.price)
              : (p.unitPrice !== undefined
                  ? Number(p.unitPrice)
                  : (data.unitPrice !== undefined ? Number(data.unitPrice) : Number(data.amount || 0)));

            const existing = passMap.get(passId);
            passMap.set(passId, {
              ...p,
              ...existing,
              id: passId,
              passId,
              bookingId: data.bookingId || docSnap.id,
              ticketIndex: 1,
              totalTickets: 1,
              price: individualPrice,
              unitPrice: individualPrice
            });
          }
          // 5. Bare single pass fallback
          else {
            const passId = data.passId || docSnap.id;
            const individualPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : Number(data.amount || 0);
            const existing = passMap.get(passId);

            passMap.set(passId, {
              ...existing,
              id: passId,
              passId,
              bookingId: data.bookingId || docSnap.id,
              ticketIndex: 1,
              totalTickets: 1,
              eventId: data.eventId,
              eventTitle: data.eventTitle,
              organizerUid: data.organizerUid,
              participantUid: data.participantUid,
              attendeeName: data.participantName || 'Attendee',
              passType: data.passType || 'Standard Pass',
              authority: data.authority || 'Participant',
              date: data.date,
              time: data.time || '09:00 AM – 06:00 PM',
              venue: data.venue || 'Campus Venue',
              gate: data.gate || 'Gate A',
              status: existing?.status || data.status || STATUS_ENUMS.PASS.ACTIVE,
              checkedIn: existing?.checkedIn !== undefined ? existing.checkedIn : false,
              price: individualPrice,
              unitPrice: individualPrice,
              paymentMethod: data.paymentMethod,
              permissions: data.permissions || ['General Area'],
              category: data.category || 'Concert',
              coverImage: data.coverImage || '',
              eventCover: data.coverImage || '',
              createdAt: data.createdAt || Date.now()
            });
          }
        });

        latestBookings = bookings;
        notify();
      },
      (error) => {
        console.error('[GateApass Bookings] Participant bookings listener error:', error);
        if (onError) onError(error);
      }
    );

    // 2. Synchronize dedicated /passes collection for immediate gate turnstile status updates
    const qPasses = query(
      collection(db, COLLECTIONS.PASSES),
      where('participantUid', '==', participantUid)
    );

    const unsubPasses = onSnapshot(
      qPasses,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const passData = docSnap.data();
          const passId = passData.passId || docSnap.id;
          const existing = passMap.get(passId);

          passMap.set(passId, {
            ...existing,
            ...passData,
            id: passId,
            passId,
            status: passData.status || STATUS_ENUMS.PASS.ACTIVE,
            checkedIn: Boolean(passData.checkedIn),
            checkedInAt: passData.checkedInAt || null
          });
        });
        notify();
      },
      (passErr) => {
        console.warn('[GateApass Passes] Participant passes listener notice:', passErr);
      }
    );

    return () => {
      unsubBookings();
      unsubPasses();
    };
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish participant listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time subscription to an organizer's bookings.
 */
export function subscribeToOrganizerBookings(organizerUid, onUpdate, onError) {
  if (!organizerUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  if (!db) return () => {};

  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('organizerUid', '==', organizerUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = [];
        snapshot.forEach((docSnap) => {
          bookings.push({ ...docSnap.data(), id: docSnap.id });
        });
        bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (onUpdate) onUpdate(bookings);
      },
      (error) => {
        console.error('[GateApass Bookings] Organizer bookings listener error:', error);
        if (onError) onError(error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish organizer listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time subscription to all platform bookings for Global Administrator only.
 */
export function subscribeToAllBookingsAdmin(onUpdate, onError) {
  if (!db) return () => {};

  try {
    const q = collection(db, BOOKINGS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allBookings = [];
        snapshot.forEach((docSnap) => {
          allBookings.push({ ...docSnap.data(), id: docSnap.id });
        });
        allBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (onUpdate) onUpdate(allBookings);
      },
      (error) => {
        console.error('[GateApass Bookings] Admin bookings listener error:', error);
        if (onError) onError(error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish admin bookings listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Validates and records turnstile check-in for a digital pass.
 * Writes immutable audit log into `/checkIns` and updates `/passes` + `/bookings`.
 * RESTRICTED: Authorized Verifier, Event Organizer, or Administrator.
 */
export async function verifyAndCheckinPass({
  passCode,
  eventId = null,
  verifierUser = null,
  gate = 'Gate A'
}) {
  if (!passCode) {
    return { valid: false, reason: 'Pass identifier or QR code missing.' };
  }

  if (!canValidatePasses(verifierUser)) {
    throw new Error('Unauthorized: Only authorized verifiers, organizers, or administrators can validate passes.');
  }

  const cleanCode = String(passCode).trim();
  const now = Date.now();

  // 1. Try finding in Firestore /passes or /bookings
  if (db) {
    try {
      // 1a. Check dedicated /passes collection first
      let targetDocSnap = await getDoc(doc(db, COLLECTIONS.PASSES, cleanCode));
      let isDedicatedPass = targetDocSnap.exists();
      let docRef = isDedicatedPass ? doc(db, COLLECTIONS.PASSES, cleanCode) : null;
      let matchedPassData = null;
      let parentBookingData = null;

      if (isDedicatedPass) {
        matchedPassData = targetDocSnap.data();
      } else {
        // 1b. Check if cleanCode matches a direct booking doc
        targetDocSnap = await getDoc(doc(db, BOOKINGS_COLLECTION, cleanCode));
        if (targetDocSnap.exists()) {
          docRef = doc(db, BOOKINGS_COLLECTION, cleanCode);
          parentBookingData = targetDocSnap.data();
          matchedPassData = Array.isArray(parentBookingData.passes) && parentBookingData.passes.length > 0
            ? parentBookingData.passes[0]
            : (parentBookingData.pass || parentBookingData);
        } else {
          // 1c. Search /bookings where passId == cleanCode or passIds contains cleanCode
          const qPass = query(collection(db, BOOKINGS_COLLECTION), where('passId', '==', cleanCode));
          let passSnap = await getDocs(qPass);

          if (passSnap.empty) {
            const qPassIds = query(collection(db, BOOKINGS_COLLECTION), where('passIds', 'array-contains', cleanCode));
            passSnap = await getDocs(qPassIds);
          }

          if (!passSnap.empty) {
            targetDocSnap = passSnap.docs[0];
            docRef = targetDocSnap.ref;
            parentBookingData = targetDocSnap.data();

            if (Array.isArray(parentBookingData.passes)) {
              matchedPassData = parentBookingData.passes.find(
                (p) => p.passId === cleanCode || p.id === cleanCode
              ) || parentBookingData.passes[0];
            } else {
              matchedPassData = parentBookingData.pass || parentBookingData;
            }
          }
        }
      }

      if (matchedPassData) {
        const passRecord = matchedPassData;

        // Check Event scope
        if (eventId && passRecord.eventId && passRecord.eventId !== eventId) {
          await recordCheckInAuditLog({
            passId: passRecord.passId || cleanCode,
            bookingId: passRecord.bookingId,
            eventId: passRecord.eventId,
            eventTitle: passRecord.eventTitle,
            attendeeName: passRecord.attendeeName || passRecord.participantName,
            participantUid: passRecord.participantUid,
            organizerUid: passRecord.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DENIED,
            reason: `Wrong event: expected ${eventId}, pass was for ${passRecord.eventId}`
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass belongs to different event: "${passRecord.eventTitle || passRecord.eventId}".`,
            booking: passRecord
          };
        }

        // Duplicate / already checked-in check
        if (passRecord.checkedIn || passRecord.status === STATUS_ENUMS.PASS.USED) {
          await recordCheckInAuditLog({
            passId: passRecord.passId || cleanCode,
            bookingId: passRecord.bookingId,
            eventId: passRecord.eventId,
            eventTitle: passRecord.eventTitle,
            attendeeName: passRecord.attendeeName || passRecord.participantName,
            participantUid: passRecord.participantUid,
            organizerUid: passRecord.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DUPLICATE,
            reason: 'Pass already scanned previously'
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass already used. Checked in at ${passRecord.checkedInAt ? new Date(passRecord.checkedInAt).toLocaleTimeString() : 'earlier today'} at ${passRecord.gate || 'Gate'}.`,
            booking: passRecord,
            alreadyUsed: true
          };
        }

        // Status check
        if (passRecord.status && passRecord.status !== STATUS_ENUMS.PASS.ACTIVE) {
          await recordCheckInAuditLog({
            passId: passRecord.passId || cleanCode,
            bookingId: passRecord.bookingId,
            eventId: passRecord.eventId,
            eventTitle: passRecord.eventTitle,
            attendeeName: passRecord.attendeeName || passRecord.participantName,
            participantUid: passRecord.participantUid,
            organizerUid: passRecord.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DENIED,
            reason: `Pass status is ${passRecord.status}`
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass status is "${passRecord.status}" (expected Active).`,
            booking: passRecord
          };
        }

        // Authorized: Update ONLY this individual pass
        const checkinUpdate = {
          checkedIn: true,
          checkedInAt: now,
          checkedInBy: verifierUser?.uid || 'verifier',
          verifierName: verifierUser?.name || verifierUser?.displayName || 'Gate Verifier',
          gate,
          status: STATUS_ENUMS.PASS.USED,
          updatedAt: now
        };

        // If it was in /passes, update /passes document
        if (isDedicatedPass && docRef) {
          await updateDoc(docRef, checkinUpdate);

          // Also synchronize matching pass inside parent booking in /bookings
          if (passRecord.bookingId) {
            try {
              const bRef = doc(db, BOOKINGS_COLLECTION, passRecord.bookingId);
              const bSnap = await getDoc(bRef);
              if (bSnap.exists()) {
                const bData = bSnap.data();
                if (Array.isArray(bData.passes)) {
                  const updatedPasses = bData.passes.map((p) =>
                    (p.passId === cleanCode || p.id === cleanCode) ? { ...p, ...checkinUpdate } : p
                  );
                  await updateDoc(bRef, { passes: updatedPasses, updatedAt: now });
                }
              }
            } catch (syncErr) {
              console.warn('[GateApass Bookings] Booking pass status sync notice:', syncErr);
            }
          }
        } else if (docRef && parentBookingData) {
          // If updated from parent booking directly
          if (Array.isArray(parentBookingData.passes)) {
            const updatedPasses = parentBookingData.passes.map((p) =>
              (p.passId === cleanCode || p.id === cleanCode) ? { ...p, ...checkinUpdate } : p
            );
            await updateDoc(docRef, { passes: updatedPasses, updatedAt: now });
          } else {
            await updateDoc(docRef, checkinUpdate);
          }
        }

        // Synchronize local memory & storage caches
        if (passRecord.participantUid) {
          const userPasses = getStoredUserPasses(passRecord.participantUid);
          const updatedUserPasses = userPasses.map((p) =>
            (p.passId === cleanCode || p.id === cleanCode) ? { ...p, ...checkinUpdate } : p
          );
          saveStoredUserPasses(passRecord.participantUid, updatedUserPasses);

          const userBookings = getStoredUserBookings(passRecord.participantUid);
          const updatedUserBookings = userBookings.map((b) => {
            if (b.bookingId === passRecord.bookingId && Array.isArray(b.passes)) {
              return {
                ...b,
                passes: b.passes.map((p) =>
                  (p.passId === cleanCode || p.id === cleanCode) ? { ...p, ...checkinUpdate } : p
                )
              };
            }
            return b;
          });
          saveStoredUserBookings(passRecord.participantUid, updatedUserBookings);
        }

        // Record immutable audit log in /checkIns
        await recordCheckInAuditLog({
          passId: passRecord.passId || cleanCode,
          bookingId: passRecord.bookingId,
          eventId: passRecord.eventId,
          eventTitle: passRecord.eventTitle,
          attendeeName: passRecord.attendeeName || passRecord.participantName,
          participantUid: passRecord.participantUid,
          organizerUid: passRecord.organizerUid,
          verifierUid: verifierUser?.uid,
          verifierName: verifierUser?.name || verifierUser?.displayName,
          gate,
          status: STATUS_ENUMS.CHECK_IN.GRANTED,
          reason: 'Entry Authorized'
        }).catch((err) => console.warn('[GateApass Bookings] Audit log write notice:', err));

        return {
          valid: true,
          message: 'Entry Authorized',
          attendeeName: passRecord.participantName || passRecord.attendeeName || 'Attendee',
          eventTitle: passRecord.eventTitle,
          passType: passRecord.passType || 'Standard Pass',
          authority: passRecord.authority || 'Participant',
          booking: { ...passRecord, ...checkinUpdate }
        };
      }
    } catch (err) {
      console.error('[GateApass Bookings] Firestore pass validation notice:', err);
    }
  }

  // 2. Fallback to memory and local storage cache for offline/mock passes
  let localPass = memoryPassesCache.find(
    (p) => p.passId === cleanCode || p.id === cleanCode
  );

  if (!localPass) {
    for (const b of memoryBookingsCache) {
      if (Array.isArray(b.passes)) {
        const found = b.passes.find((p) => p.passId === cleanCode || p.id === cleanCode);
        if (found) {
          localPass = found;
          break;
        }
      }
      if (b.passId === cleanCode || b.bookingId === cleanCode || b.id === cleanCode) {
        localPass = b.pass || b;
        break;
      }
    }
  }

  if (localPass) {
    if (localPass.checkedIn || localPass.status === STATUS_ENUMS.PASS.USED) {
      return {
        valid: false,
        reason: 'Pass already used.',
        booking: localPass,
        alreadyUsed: true
      };
    }

    localPass.checkedIn = true;
    localPass.status = STATUS_ENUMS.PASS.USED;
    localPass.checkedInAt = Date.now();
    localPass.gate = gate;

    return {
      valid: true,
      message: 'Entry Authorized',
      attendeeName: localPass.participantName || localPass.attendeeName || 'Attendee',
      eventTitle: localPass.eventTitle,
      passType: localPass.passType,
      authority: localPass.authority,
      booking: localPass
    };
  }

  return {
    valid: false,
    reason: `Pass "${cleanCode}" not found in system ledger.`
  };
}
