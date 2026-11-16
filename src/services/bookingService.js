/**
 * GetAPass — Booking & Digital Pass Service
 *
 * Enforces strict multi-tenant isolation based on Firebase UID:
 * - Participant UID (participantUid) owns attendee bookings, purchased passes, and payment receipts.
 * - Organizer UID (organizerUid) owns event-level ticket sales, check-in records, and revenue analytics.
 * - Global Administrator holds platform-wide read and audit privileges.
 */

import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const BOOKINGS_COLLECTION = 'bookings';
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

/**
 * Reset memory caches upon account switch to prevent data leakage.
 */
export function clearSessionBookingCache() {
  _currentParticipantUid = null;
  memoryBookingsCache = [];
  memoryPassesCache = [];
}

/**
 * Read cached bookings for a specific user from localStorage with memory fallback.
 */
export function getStoredUserBookings(userId) {
  if (!userId) return [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(`${BOOKINGS_STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn('[GateApass Bookings] Could not read local bookings cache:', err);
  }
  return memoryBookingsCache || [];
}

/**
 * Save cached bookings for a specific user to localStorage.
 */
export function saveStoredUserBookings(userId, bookingsArray) {
  if (!userId || !Array.isArray(bookingsArray)) return;
  memoryBookingsCache = bookingsArray;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${BOOKINGS_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(bookingsArray));
    }
  } catch (err) {
    console.warn('[GateApass Bookings] Could not save local bookings cache:', err);
  }
}

/**
 * Read cached passes for a specific user from localStorage.
 */
export function getStoredUserPasses(userId) {
  if (!userId) return [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(`${PASSES_STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn('[GateApass Passes] Could not read local passes cache:', err);
  }
  return memoryPassesCache || [];
}

/**
 * Save cached passes for a specific user to localStorage.
 */
export function saveStoredUserPasses(userId, passesArray) {
  if (!userId || !Array.isArray(passesArray)) return;
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
 * Create a new booking and digital pass in Firestore and local user cache.
 * Strictly binds participantUid to currentUser.uid and organizerUid to event.organizerUid.
 */
export async function createBooking(bookingData, currentUser, eventData = null) {
  if (!bookingData) throw new Error('Booking data is required.');
  if (!currentUser?.uid) {
    throw new Error('Authentication required: You must be signed in to purchase a pass.');
  }

  const bookingId = bookingData.bookingId || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  const passId = bookingData.passId || `GP-${Math.floor(100000 + Math.random() * 900000)}`;
  const eventId = bookingData.eventId || eventData?.id || '';
  const eventTitle = bookingData.eventTitle || eventData?.title || eventData?.name || 'Campus Event';
  const organizerUid = bookingData.organizerUid || eventData?.organizerUid || '';
  const organizerEmail = bookingData.organizerEmail || eventData?.organizerEmail || '';

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
    amount: Number(bookingData.amount || 0),
    status: bookingData.status || 'Active',
    paymentMethod: bookingData.paymentMethod || 'UPI',
    date: bookingData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdAt: Date.now(),
    updatedAt: Date.now()
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
    gate: bookingData.gate || 'Gate A',
    status: 'Active',
    price: newBooking.amount,
    paymentMethod: newBooking.paymentMethod,
    issuedAt: 'Just now',
    permissions: bookingData.permissions || ['General Area'],
    templateId: bookingData.templateId || 'tpl-classic-violet',
    templateVersion: bookingData.templateVersion || 1,
    templateSnapshot: bookingData.templateSnapshot || null,
    createdAt: Date.now()
  };

  // Embed pass snapshot into booking
  newBooking.pass = newPass;

  // 1. Immediately update user local storage cache
  const localBookings = getStoredUserBookings(currentUser.uid);
  const updatedBookings = [newBooking, ...localBookings.filter((b) => b.bookingId !== bookingId)];
  saveStoredUserBookings(currentUser.uid, updatedBookings);

  const localPasses = getStoredUserPasses(currentUser.uid);
  const updatedPasses = [newPass, ...localPasses.filter((p) => p.passId !== passId)];
  saveStoredUserPasses(currentUser.uid, updatedPasses);

  // 2. Persist to Firestore
  if (db) {
    try {
      const cleanBooking = sanitizeForFirestore(newBooking);
      await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), cleanBooking);
      console.log(`[GateApass Bookings] Booking ${bookingId} stored in Firestore for participant ${currentUser.uid}`);
    } catch (err) {
      console.error('[GateApass Bookings] Error storing booking in Firestore:', err);
      // Saved in local cache; non-fatal for offline/resilient UX
    }
  }

  return { booking: newBooking, pass: newPass };
}

/**
 * Real-time subscription to a participant's own bookings and passes.
 * Uses `where('participantUid', '==', participantUid)` matching Firestore security rules.
 */
export function subscribeToParticipantBookings(participantUid, onUpdate, onError) {
  if (!participantUid) {
    if (onUpdate) onUpdate([], []);
    return () => {};
  }

  _currentParticipantUid = participantUid;

  // Deliver cached local state immediately
  const cachedBookings = getStoredUserBookings(participantUid);
  const cachedPasses = getStoredUserPasses(participantUid);
  if (onUpdate) onUpdate(cachedBookings, cachedPasses);

  if (!db) return () => {};

  try {
    console.log(`[GateApass Bookings] Subscribing to bookings for participant UID: ${participantUid}`);
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
            // Reconstruct pass if not embedded
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
              status: data.status || 'Active',
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

        console.log(`[GateApass Bookings] Participant received ${bookings.length} booking(s) and ${passes.length} pass(es).`);
        if (onUpdate) onUpdate(bookings, passes);
      },
      (error) => {
        console.error('[GateApass Bookings] Participant bookings listener error:', {
          code: error.code || 'unknown',
          message: error.message
        });
        if (onError) onError(error);
      }
    );

    return () => {
      console.log(`[GateApass Bookings] Unsubscribing participant bookings for: ${participantUid}`);
      unsubscribe();
    };
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish participant bookings listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time subscription to an organizer's event bookings and attendee list.
 * Uses `where('organizerUid', '==', organizerUid)` matching Firestore security rules.
 * NEVER leaks bookings belonging to other organizers.
 */
export function subscribeToOrganizerBookings(organizerUid, onUpdate, onError) {
  if (!organizerUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  if (!db) return () => {};

  try {
    console.log(`[GateApass Bookings] Subscribing to bookings for organizer UID: ${organizerUid}`);
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('organizerUid', '==', organizerUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bookings.push({ ...data, id: docSnap.id });
        });

        bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log(`[GateApass Bookings] Organizer received ${bookings.length} booking(s) across their events.`);
        if (onUpdate) onUpdate(bookings);
      },
      (error) => {
        console.error('[GateApass Bookings] Organizer bookings listener error:', {
          code: error.code || 'unknown',
          message: error.message
        });
        if (onError) onError(error);
      }
    );

    return () => {
      console.log(`[GateApass Bookings] Unsubscribing organizer bookings for: ${organizerUid}`);
      unsubscribe();
    };
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish organizer bookings listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Real-time subscription to all platform bookings for Global Administrator only.
 * Satisfies `isAdmin()` Firestore security rule.
 */
export function subscribeToAllBookingsAdmin(onUpdate, onError) {
  if (!db) return () => {};

  try {
    console.log('[GateApass Bookings] Subscribing to all platform bookings (Admin Mode)');
    const q = collection(db, BOOKINGS_COLLECTION);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allBookings = [];
        snapshot.forEach((docSnap) => {
          allBookings.push({ ...docSnap.data(), id: docSnap.id });
        });
        allBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log(`[GateApass Bookings] Admin received ${allBookings.length} total platform booking(s).`);
        if (onUpdate) onUpdate(allBookings);
      },
      (error) => {
        console.error('[GateApass Bookings] Admin bookings listener error:', error);
        if (onError) onError(error);
      }
    );

    return () => {
      console.log('[GateApass Bookings] Unsubscribing admin all-bookings listener.');
      unsubscribe();
    };
  } catch (err) {
    console.error('[GateApass Bookings] Failed to establish admin bookings listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

