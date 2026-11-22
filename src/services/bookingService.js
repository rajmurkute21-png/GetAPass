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
  where
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
import { fetchPaginatedCollection } from './firestoreService';
import { createDigitalPass } from './passService';
import { createTransaction } from './transactionService';
import { createNotification } from './notificationService';
import { recordCheckInAuditLog } from './verifierService';

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

  // 1. Authoritative price resolution & validation (Never trust client prices)
  const validation = validateBookingPayload({
    eventData,
    passTypeData: bookingData.passTypeData,
    quantity: bookingData.quantity || 1,
    clientAmount: bookingData.amount,
    currentUser
  });

  if (!validation.isValid) {
    throw new Error(`Booking validation failed: ${validation.errors.join(' ')}`);
  }

  const authoritativeAmount = validation.authoritativeAmount || Number(bookingData.amount || 0);
  const bookingId = bookingData.bookingId || generateBookingId();
  const passId = bookingData.passId || generatePassId(eventData?.title || bookingData.eventTitle || 'GP');
  const eventId = bookingData.eventId || eventData?.id || '';
  const eventTitle = bookingData.eventTitle || eventData?.title || eventData?.name || 'Campus Event';
  const organizerUid = bookingData.organizerUid || eventData?.organizerUid || '';
  const organizerEmail = bookingData.organizerEmail || eventData?.organizerEmail || '';
  const now = Date.now();

  const newBooking = {
    ...bookingData,
    id: bookingId,
    bookingId,
    passId,
    eventId,
    eventTitle,
    organizerUid,
    organizerEmail,
    participantUid: currentUser.uid,
    participantEmail: currentUser.email || '',
    participantName: currentUser.displayName || currentUser.name || 'Participant',
    passType: bookingData.passType || 'Standard Pass',
    unitPrice: validation.unitPrice,
    quantity: validation.quantity,
    amount: authoritativeAmount,
    status: STATUS_ENUMS.BOOKING.ACTIVE,
    paymentMethod: bookingData.paymentMethod || 'UPI',
    date: bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: now,
    updatedAt: now
  };

  const newPass = {
    id: passId,
    passId,
    bookingId,
    eventId,
    eventTitle,
    organizerUid,
    participantUid: currentUser.uid,
    participantEmail: currentUser.email || '',
    attendeeName: newBooking.participantName,
    passType: newBooking.passType,
    authority: bookingData.authority || 'Participant',
    date: eventData?.date || newBooking.date,
    time: eventData?.time || '09:00 AM – 06:00 PM',
    venue: eventData?.venue || 'Campus Venue',
    category: eventData?.category || bookingData.category || 'Concert',
    coverImage: eventData?.coverImage || eventData?.image || bookingData.coverImage || '',
    eventCover: eventData?.coverImage || eventData?.image || bookingData.eventCover || '',
    gate: bookingData.gate || 'Gate A',
    status: STATUS_ENUMS.PASS.ACTIVE,
    price: authoritativeAmount,
    paymentMethod: newBooking.paymentMethod,
    issuedAt: 'Just now',
    permissions: bookingData.permissions || ['General Area'],
    templateId: bookingData.templateId || 'tpl-classic-violet',
    templateVersion: bookingData.templateVersion || 1,
    templateSnapshot: bookingData.templateSnapshot || null,
    createdAt: now,
    updatedAt: now
  };

  newBooking.pass = newPass;

  // 1. Immediately update local storage cache for instant UI
  const localBookings = getStoredUserBookings(currentUser.uid);
  const updatedBookings = [newBooking, ...localBookings.filter((b) => b.bookingId !== bookingId)];
  saveStoredUserBookings(currentUser.uid, updatedBookings);

  const localPasses = getStoredUserPasses(currentUser.uid);
  const updatedPasses = [newPass, ...localPasses.filter((p) => p.passId !== passId)];
  saveStoredUserPasses(currentUser.uid, updatedPasses);

  // 2. Coordinated persistence to Firestore: /bookings, /passes, /transactions, /notifications
  let createdTransaction = null;
  if (db) {
    try {
      // 2a. Save Booking
      const cleanBooking = sanitizeForFirestore(newBooking);
      await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), cleanBooking);

      // 2b. Save Pass into dedicated /passes collection
      try {
        await createDigitalPass({
          ...newPass,
          customPassId: passId
        });
      } catch (passErr) {
        console.warn('[GateApass Bookings] Coordinated pass write notice:', passErr);
      }

      // 2c. Save Transaction into dedicated /transactions collection
      try {
        createdTransaction = await createTransaction({
          bookingId,
          eventId,
          eventTitle,
          participantUid: currentUser.uid,
          organizerUid,
          amount: authoritativeAmount,
          paymentMethod: newBooking.paymentMethod
        });
      } catch (txErr) {
        console.warn('[GateApass Bookings] Coordinated transaction write notice:', txErr);
      }

      // 2d. Dispatch confirmation notification
      try {
        await createNotification({
          recipientUid: currentUser.uid,
          title: 'Ticket Confirmed!',
          message: `Your booking for ${eventTitle} (₹${authoritativeAmount}) is confirmed. Digital pass is ready in your wallet.`,
          type: 'ticket',
          actionUrl: '/profile'
        });
      } catch (notifErr) {
        console.warn('[GateApass Bookings] Coordinated notification write notice:', notifErr);
      }

      console.log(`[GateApass Bookings] Successfully created booking ${bookingId} across collections.`);
    } catch (err) {
      console.error('[GateApass Bookings] Error storing booking in Firestore:', err);
    }
  }

  return { booking: newBooking, pass: newPass, transaction: createdTransaction };
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
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('participantUid', '==', participantUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = [];
        const passes = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const bookingItem = { ...data, id: docSnap.id };
          bookings.push(bookingItem);

          if (data.pass) {
            passes.push(data.pass);
          } else {
            passes.push({
              id: data.passId || docSnap.id,
              passId: data.passId || docSnap.id,
              bookingId: data.bookingId || docSnap.id,
              eventId: data.eventId,
              eventTitle: data.eventTitle,
              organizerUid: data.organizerUid,
              participantUid: data.participantUid,
              attendeeName: data.participantName || 'Attendee',
              passType: data.passType || 'Standard Pass',
              authority: data.authority || 'Participant',
              date: data.date,
              time: data.time || '09:00 AM',
              venue: data.venue || 'Campus Venue',
              gate: data.gate || 'Gate A',
              status: data.status || STATUS_ENUMS.PASS.ACTIVE,
              price: data.amount,
              paymentMethod: data.paymentMethod,
              permissions: data.permissions || ['General Area'],
              createdAt: data.createdAt
            });
          }
        });

        bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        passes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        saveStoredUserBookings(participantUid, bookings);
        saveStoredUserPasses(participantUid, passes);

        if (onUpdate) onUpdate(bookings, passes);
      },
      (error) => {
        console.error('[GateApass Bookings] Participant bookings listener error:', error);
        if (onError) onError(error);
      }
    );

    return () => unsubscribe();
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

  // Try finding in /passes or /bookings
  if (db) {
    try {
      let targetDocSnap = await getDoc(doc(db, COLLECTIONS.PASSES, cleanCode));
      let docRef = doc(db, COLLECTIONS.PASSES, cleanCode);

      if (!targetDocSnap.exists()) {
        targetDocSnap = await getDoc(doc(db, BOOKINGS_COLLECTION, cleanCode));
        docRef = doc(db, BOOKINGS_COLLECTION, cleanCode);
      }

      if (!targetDocSnap.exists()) {
        const qPass = query(collection(db, BOOKINGS_COLLECTION), where('passId', '==', cleanCode));
        const passSnap = await getDocs(qPass);
        if (!passSnap.empty) {
          targetDocSnap = passSnap.docs[0];
          docRef = targetDocSnap.ref;
        }
      }

      if (targetDocSnap.exists()) {
        const data = targetDocSnap.data();

        // 1. Event scope check
        if (eventId && data.eventId && data.eventId !== eventId) {
          await recordCheckInAuditLog({
            passId: data.passId || cleanCode,
            bookingId: data.bookingId,
            eventId: data.eventId,
            eventTitle: data.eventTitle,
            attendeeName: data.attendeeName || data.participantName,
            participantUid: data.participantUid,
            organizerUid: data.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DENIED,
            reason: `Wrong event: expected ${eventId}, pass was for ${data.eventId}`
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass belongs to different event: "${data.eventTitle || data.eventId}".`,
            booking: data
          };
        }

        // 2. Duplicate / already checked-in check
        if (data.checkedIn || data.status === STATUS_ENUMS.PASS.USED) {
          await recordCheckInAuditLog({
            passId: data.passId || cleanCode,
            bookingId: data.bookingId,
            eventId: data.eventId,
            eventTitle: data.eventTitle,
            attendeeName: data.attendeeName || data.participantName,
            participantUid: data.participantUid,
            organizerUid: data.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DUPLICATE,
            reason: 'Pass already scanned previously'
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass already used. Checked in at ${data.checkedInAt ? new Date(data.checkedInAt).toLocaleTimeString() : 'earlier today'} at ${data.gate || 'Gate'}.`,
            booking: data,
            alreadyUsed: true
          };
        }

        // 3. Status check
        if (data.status && data.status !== STATUS_ENUMS.PASS.ACTIVE) {
          await recordCheckInAuditLog({
            passId: data.passId || cleanCode,
            bookingId: data.bookingId,
            eventId: data.eventId,
            eventTitle: data.eventTitle,
            attendeeName: data.attendeeName || data.participantName,
            participantUid: data.participantUid,
            organizerUid: data.organizerUid,
            verifierUid: verifierUser?.uid,
            verifierName: verifierUser?.name || verifierUser?.displayName,
            gate,
            status: STATUS_ENUMS.CHECK_IN.DENIED,
            reason: `Pass status is ${data.status}`
          }).catch(() => {});

          return {
            valid: false,
            reason: `Pass status is "${data.status}" (expected Active).`,
            booking: data
          };
        }

        // 4. Valid check-in: Update record and write audit log
        const now = Date.now();
        const checkinUpdate = {
          checkedIn: true,
          checkedInAt: now,
          checkedInBy: verifierUser?.uid || 'verifier',
          verifierName: verifierUser?.name || verifierUser?.displayName || 'Gate Verifier',
          gate,
          status: STATUS_ENUMS.PASS.USED,
          updatedAt: now
        };

        await updateDoc(docRef, checkinUpdate);

        // Record immutable audit log in /checkIns
        await recordCheckInAuditLog({
          passId: data.passId || cleanCode,
          bookingId: data.bookingId,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          attendeeName: data.attendeeName || data.participantName,
          participantUid: data.participantUid,
          organizerUid: data.organizerUid,
          verifierUid: verifierUser?.uid,
          verifierName: verifierUser?.name || verifierUser?.displayName,
          gate,
          status: STATUS_ENUMS.CHECK_IN.GRANTED,
          reason: 'Entry Authorized'
        }).catch((err) => console.warn('[GateApass Bookings] Audit log write notice:', err));

        return {
          valid: true,
          message: 'Entry Authorized',
          attendeeName: data.participantName || data.attendeeName || 'Attendee',
          eventTitle: data.eventTitle,
          passType: data.passType || 'Standard Pass',
          authority: data.authority || 'Participant',
          booking: { ...data, ...checkinUpdate }
        };
      }
    } catch (err) {
      console.error('[GateApass Bookings] Firestore pass validation notice:', err);
    }
  }

  // Fallback to local memory cache for mock/offline passes
  const localMatch = memoryBookingsCache.find(
    (b) => b.passId === cleanCode || b.bookingId === cleanCode || b.id === cleanCode
  );

  if (localMatch) {
    if (localMatch.checkedIn || localMatch.status === STATUS_ENUMS.PASS.USED) {
      return {
        valid: false,
        reason: 'Pass already used.',
        booking: localMatch,
        alreadyUsed: true
      };
    }
    localMatch.checkedIn = true;
    localMatch.status = STATUS_ENUMS.PASS.USED;
    localMatch.checkedInAt = Date.now();
    localMatch.gate = gate;
    return {
      valid: true,
      message: 'Entry Authorized',
      attendeeName: localMatch.participantName || localMatch.attendeeName || 'Attendee',
      eventTitle: localMatch.eventTitle,
      passType: localMatch.passType,
      authority: localMatch.authority,
      booking: localMatch
    };
  }

  return {
    valid: false,
    reason: `Pass "${cleanCode}" not found in system ledger.`
  };
}
