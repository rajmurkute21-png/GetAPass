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
import { db } from '../config/firebase.js';
import { canValidatePasses, canManagePlatform } from './permissionService.js';
import {
  COLLECTIONS,
  STATUS_ENUMS,
  generateBookingId,
  generatePassId,
  validateBookingPayload
} from '../constants/firestoreSchema.js';
import { fetchPaginatedCollection, getServerTimestamp } from './firestoreService.js';
import { createDigitalPass } from './passService.js';
import { createTransaction } from './transactionService.js';
import { createNotification } from './notificationService.js';
import { recordCheckInAuditLog, generatePassChecksum } from './verifierService.js';
import { verifyAndConfirmPayment } from './paymentVerificationService.js';
import { verifyAndCheckInPassAuthoritative } from './passVerificationEngine.js';
import { getStoredLocalEvents, saveStoredLocalEvents } from './eventService.js';

export const BOOKINGS_COLLECTION = COLLECTIONS.BOOKINGS;
export const BOOKINGS_STORAGE_KEY_PREFIX = 'gateapass_bookings_';
export const PASSES_STORAGE_KEY_PREFIX = 'gateapass_passes_';

// In-flight concurrency lock to prevent duplicate concurrent submissions
const inFlightBookingLocks = new Set();

export function resetBookingServiceLocks() {
  inFlightBookingLocks.clear();
}

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

  // Replay guard: Check if this bookingId or paymentReference has already been processed locally or in memory
  const localExistingBookings = getStoredUserBookings(currentUser.uid);
  const foundExisting = localExistingBookings.find(
    (b) => (bookingId && b.bookingId === bookingId) || (paymentReference && b.paymentReference === paymentReference)
  );
  if (foundExisting && Array.isArray(foundExisting.passes) && foundExisting.passes.length > 0) {
    return {
      booking: foundExisting,
      passes: foundExisting.passes,
      pass: foundExisting.passes[0],
      isDuplicateReplay: true
    };
  }

  // Concurrency lock to prevent duplicate in-flight booking submissions
  const bookingLockKey = `in_flight_${bookingId}_${paymentReference}`;
  if (inFlightBookingLocks.has(bookingLockKey)) {
    throw new Error('Duplicate booking submission in progress. Please wait.');
  }
  inFlightBookingLocks.add(bookingLockKey);

  try {
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

    if (paymentVerification.status === 'CANCELLED') {
      throw new Error(`Payment cancelled: ${paymentVerification.reason || 'Transaction was cancelled.'}`);
    }

    const isConfirmed = paymentVerification.status === 'SUCCESS';
    const bookingStatus = isConfirmed ? STATUS_ENUMS.BOOKING.ACTIVE : 'Pending Payment';
    const passStatus = isConfirmed ? STATUS_ENUMS.PASS.ACTIVE : 'Pending Payment';

  // 2. Build canonical individual pass list (1 distinct pass per purchased ticket)
  const candidateList = (Array.isArray(bookingData.passes) && bookingData.passes.length > 0)
    ? bookingData.passes
    : (Array.isArray(validation.items) && validation.items.length > 0)
        ? validation.items
        : (Array.isArray(bookingData.items) && bookingData.items.length > 0)
            ? bookingData.items
            : null;

  const passList = [];

  if (candidateList && candidateList.length > 0) {
    // Total count of tickets across all items (accounting for qty > 1 per item)
    const totalTicketCount = candidateList.reduce((acc, it) => {
      const q = Number(it.quantity || it.qty || 1);
      return acc + (q > 0 ? q : 1);
    }, 0);

    let ticketNum = 1;
    candidateList.forEach((it) => {
      const itemQty = Number(it.quantity || it.qty || 1);
      const tierName = it.passType || it.name || it.tier || 'Standard Pass';
      const itemPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price !== undefined ? it.price : 0));

      for (let q = 0; q < itemQty; q++) {
        // If the item was already a single pre-built pass with its own passId and itemQty === 1, keep it; otherwise generate unique ID
        const passId = (itemQty === 1 && (it.passId || it.id))
          ? (it.passId || it.id)
          : `GP-${rawPrefix}26-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}-${ticketNum}`;

        const signature = it.signature || generatePassChecksum(passId, eventId, bookingId, currentUser.uid);

        const deterministicQrPayload = JSON.stringify({
          passId,
          bookingId,
          eventId,
          eventTitle,
          attendee: it.attendeeName || bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
          passType: tierName,
          ticketIndex: ticketNum,
          totalTickets: totalTicketCount,
          status: passStatus,
          issuedAt: it.createdAt || now,
          sig: signature
        });

        passList.push({
          ...it,
          id: passId,
          passId,
          bookingId,
          ticketIndex: ticketNum,
          totalTickets: totalTicketCount,
          eventId,
          eventTitle,
          organizerUid,
          organizerEmail: organizerEmail || it.organizerEmail || '',
          participantUid: currentUser.uid,
          participantEmail: currentUser.email || '',
          attendeeName: it.attendeeName || bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
          passType: tierName,
          ticketCategory: tierName,
          authority: it.authority || bookingData.authority || 'Participant',
          date: it.date || eventData?.date || bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: it.time || eventData?.time || bookingData.time || '09:00 AM – 06:00 PM',
          venue: it.venue || eventData?.venue || bookingData.venue || 'Campus Venue',
          category: it.category || eventData?.category || bookingData.category || 'Concert',
          coverImage: it.coverImage || eventData?.coverImage || eventData?.image || bookingData.coverImage || '',
          eventCover: it.eventCover || eventData?.coverImage || eventData?.image || bookingData.eventCover || '',
          gate: it.gate || bookingData.gate || 'Gate A',
          status: passStatus,
          checkedIn: Boolean(it.checkedIn),
          checkedInAt: it.checkedInAt || null,
          checkedInBy: it.checkedInBy || null,
          price: itemPrice,
          unitPrice: itemPrice,
          paymentMethod: bookingData.paymentMethod || 'UPI',
          paymentReference,
          issuedAt: it.issuedAt || 'Just now',
          permissions: it.permissions || bookingData.permissions || ['General Area'],
          templateId: it.templateId || bookingData.templateId || 'tpl-classic-violet',
          templateVersion: it.templateVersion || 1,
          templateSnapshot: it.templateSnapshot || bookingData.templateSnapshot || null,
          signature,
          qrPayload: it.qrPayload || deterministicQrPayload,
          createdAt: it.createdAt || now,
          updatedAt: it.updatedAt || now
        });

        ticketNum++;
      }
    });
  } else {
    // Single ticket fallback
    const passId = bookingData.passId || `GP-${rawPrefix}26-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}-1`;
    const singlePrice = validation.unitPrice !== undefined ? Number(validation.unitPrice) : authoritativeAmount;
    const deterministicQrPayload = JSON.stringify({
      passId,
      bookingId,
      eventId,
      eventTitle,
      attendee: bookingData.attendeeName || currentUser.displayName || currentUser.name || 'Participant',
      passType: bookingData.passType || 'Standard Pass',
      ticketIndex: 1,
      totalTickets: 1,
      status: passStatus,
      issuedAt: now
    });

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
      ticketCategory: bookingData.passType || 'Standard Pass',
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
      price: singlePrice,
      unitPrice: singlePrice,
      paymentMethod: bookingData.paymentMethod || 'UPI',
      paymentReference,
      issuedAt: 'Just now',
      permissions: bookingData.permissions || ['General Area'],
      templateId: bookingData.templateId || 'tpl-classic-violet',
      templateVersion: 1,
      templateSnapshot: bookingData.templateSnapshot || null,
      qrPayload: deterministicQrPayload,
      createdAt: now,
      updatedAt: now
    });
  }

  // 3. Construct unified parent Booking record (One order covering all purchased passes)
  const passTypeSummary = passList.length === 1
    ? passList[0].passType
    : `${passList.length} Passes (${[...new Set(passList.map((p) => p.passType))].join(', ')})`;

  // Group by passType to compute itemized category breakdown (Requirement 8)
  const categoryBreakdownMap = new Map();
  passList.forEach((p) => {
    const cat = p.passType || 'Standard Pass';
    const cur = categoryBreakdownMap.get(cat) || { name: cat, passType: cat, quantity: 0, qty: 0, unitPrice: p.unitPrice, price: p.unitPrice, subtotal: 0 };
    cur.quantity += 1;
    cur.qty += 1;
    cur.subtotal += p.unitPrice;
    categoryBreakdownMap.set(cat, cur);
  });
  const itemizedSummary = Array.from(categoryBreakdownMap.values());

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
    items: itemizedSummary.length > 0 ? itemizedSummary : (validation.items || []),
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
            if (!['active', 'published'].includes(liveStatus) || liveEvent.isSoftRemoved || liveEvent.isDisabled || liveEvent.isRemoved) {
              throw new Error(`This event is no longer available for booking (status: ${liveEvent.status || 'Unavailable'}).`);
            }

            // Check total event capacity if defined
            if (liveEvent.capacity !== undefined && liveEvent.capacity !== null) {
              const cap = Number(liveEvent.capacity);
              const sold = Number(liveEvent.totalSoldCount || 0);
              const remaining = Math.max(0, cap - sold);
              if (validation.quantity > remaining) {
                throw new Error(`Insufficient tickets remaining for this event. Requested ${validation.quantity}, but only ${remaining} remain.`);
              }
            }

            // Inventory check & update
            if (Array.isArray(liveEvent.passTypes) && liveEvent.passTypes.length > 0) {
              const updatedPassTypes = liveEvent.passTypes.map((pt) => {
                const purchased = (validation.items || []).find((it) =>
                  (it.passType && it.passType.toLowerCase() === pt.name.toLowerCase()) ||
                  (it.name && it.name.toLowerCase() === pt.name.toLowerCase()) ||
                  (it.id && pt.id && it.id === pt.id)
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
            } else if (liveEvent.capacity !== undefined && liveEvent.capacity !== null) {
              const sold = Number(liveEvent.totalSoldCount || 0) + validation.quantity;
              const cap = Number(liveEvent.capacity);
              txn.update(eventRef, {
                totalSoldCount: sold,
                isSoldOut: sold >= cap,
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
            throw invErr; // Abort booking on overselling, inventory exhaustion, or disabled event!
          }
          console.warn('[GateApass Bookings] Event inventory transaction notice:', invErr.message);
        }
      }

      // Synchronously decrement local storage event inventory so UI is immediately consistent
      try {
        const localEvents = getStoredLocalEvents();
        const targetIndex = localEvents.findIndex((e) => e.id === eventId);
        if (targetIndex !== -1) {
          const ev = localEvents[targetIndex];
          let newPassTypes = ev.passTypes;
          if (Array.isArray(ev.passTypes) && ev.passTypes.length > 0) {
            newPassTypes = ev.passTypes.map((pt) => {
              const purchased = (validation.items || []).find((it) =>
                (it.passType && it.passType.toLowerCase() === pt.name.toLowerCase()) ||
                (it.name && it.name.toLowerCase() === pt.name.toLowerCase()) ||
                (it.id && pt.id && it.id === pt.id)
              );
              if (purchased) {
                const qty = Number(purchased.quantity || purchased.qty || 1);
                const sold = Number(pt.soldCount || 0) + qty;
                return {
                  ...pt,
                  soldCount: sold,
                  isSoldOut: pt.capacity !== undefined && sold >= Number(pt.capacity)
                };
              }
              return pt;
            });
          }
          const newTotalSold = (Number(ev.totalSoldCount) || 0) + validation.quantity;
          const isSoldOut = ev.capacity !== undefined && newTotalSold >= Number(ev.capacity);
          const updatedEvents = [...localEvents];
          updatedEvents[targetIndex] = {
            ...ev,
            passTypes: newPassTypes,
            totalSoldCount: newTotalSold,
            isSoldOut
          };
          saveStoredLocalEvents(updatedEvents);
        }
      } catch (locErr) {
        console.warn('[GateApass Bookings] Local events inventory update notice:', locErr);
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
} finally {
  inFlightBookingLocks.delete(bookingLockKey);
}
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
                ...existing,
                ...p,
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
              ...existing,
              ...p,
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

          const individualPrice = (passData.unitPrice !== undefined && passData.unitPrice !== null)
            ? Number(passData.unitPrice)
            : (passData.price !== undefined && passData.price !== null)
                ? Number(passData.price)
                : existing?.unitPrice || existing?.price || 0;

          passMap.set(passId, {
            ...existing,
            ...passData,
            id: passId,
            passId,
            price: individualPrice,
            unitPrice: individualPrice,
            ticketCategory: passData.ticketCategory || passData.passType || existing?.ticketCategory || 'Standard Pass',
            status: passData.status || existing?.status || STATUS_ENUMS.PASS.ACTIVE,
            checkedIn: passData.checkedIn !== undefined ? Boolean(passData.checkedIn) : Boolean(existing?.checkedIn),
            checkedInAt: passData.checkedInAt || existing?.checkedInAt || null
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
  return verifyAndCheckInPassAuthoritative({
    passDataOrCode: passCode,
    currentEventId: eventId,
    verifierUser,
    gate
  });
}
