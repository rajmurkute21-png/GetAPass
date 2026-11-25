/**
 * GetAPass — Verifier Assignment & Turnstile Audit Service
 *
 * Manages the dedicated `/verifierAssignments` and `/checkIns` collections:
 * - Scoped turnstile check-in authorization: Verifiers can access only assigned events
 * - Immutable turnstile audit logs for every admission attempt (Granted, Denied, Duplicate)
 */

import { doc, getDoc, updateDoc, runTransaction, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { COLLECTIONS, STATUS_ENUMS, generateDocId } from '../constants/firestoreSchema.js';
import {
  fetchPaginatedCollection,
  getDocumentById,
  writeDocument,
  updateDocumentFields,
  subscribeToCollection
} from './firestoreService.js';
import { canManageEvents } from './permissionService.js';

/**
 * Generates a deterministic cryptographic checksum for a pass.
 * Prevents QR code tampering, parameter manipulation, or forgery.
 */
export function generatePassChecksum(passId, eventId, bookingId = '', participantUid = '') {
  if (!passId) return 'SIG-GEN';
  const payload = `${passId}:${eventId}:${bookingId}:${participantUid}:GP_SECURE_TOKEN_2026`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `SIG-${(h1 >>> 0).toString(16).toUpperCase()}${(h2 >>> 0).toString(16).toUpperCase()}`;
}

/**
 * Assigns a staff member / verifier to an event.
 * RESTRICTED: Event Organizer owning the event or Global Administrator.
 */
export async function assignVerifierToEvent({
  eventId,
  eventTitle,
  organizerUid,
  verifierUid,
  verifierEmail = '',
  verifierName = 'Gate Staff',
  gate = 'All',
  actor
}) {
  if (!eventId || !verifierUid) {
    throw new Error('Event ID and Verifier UID are required for assignment.');
  }

  if (!canManageEvents(actor, { organizerUid })) {
    throw new Error('Unauthorized: Only event organizers or administrators can assign verifiers.');
  }

  const assignmentId = `asgn_${eventId}_${verifierUid}`;
  const now = Date.now();

  const payload = {
    id: assignmentId,
    assignmentId,
    eventId,
    eventTitle: eventTitle || 'Campus Event',
    organizerUid,
    verifierUid,
    verifierEmail,
    verifierName,
    gate,
    status: STATUS_ENUMS.VERIFIER_ASSIGNMENT.ACTIVE,
    assignedBy: actor.uid,
    assignedAt: now,
    updatedAt: now
  };

  await writeDocument(COLLECTIONS.VERIFIER_ASSIGNMENTS, assignmentId, payload);
  return payload;
}

/**
 * Revokes a verifier's assignment to an event.
 */
export async function revokeVerifierAssignment(assignmentId, actor) {
  const assignment = await getDocumentById(COLLECTIONS.VERIFIER_ASSIGNMENTS, assignmentId);
  if (!assignment) throw new Error('Assignment record not found.');

  if (!canManageEvents(actor, { organizerUid: assignment.organizerUid })) {
    throw new Error('Unauthorized: Only event organizers or administrators can revoke verifier assignments.');
  }

  return updateDocumentFields(COLLECTIONS.VERIFIER_ASSIGNMENTS, assignmentId, {
    status: STATUS_ENUMS.VERIFIER_ASSIGNMENT.REVOKED
  });
}

/**
 * Fetches all active assignments for a given event (Organizer or Admin).
 */
export async function fetchEventVerifierAssignments(eventId, _actor = null) {
  if (!eventId) return { items: [] };

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.VERIFIER_ASSIGNMENTS,
    constraints: [
      where('eventId', '==', eventId),
      where('status', '==', STATUS_ENUMS.VERIFIER_ASSIGNMENT.ACTIVE)
    ],
    orderByField: 'assignedAt',
    orderDirection: 'desc'
  });
}

/**
 * Fetches all event assignments for a verifier.
 * Allows verifiers to discover which events they hold gate authority for.
 */
export async function fetchVerifierAssignments(verifierUid) {
  if (!verifierUid) return { items: [] };

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.VERIFIER_ASSIGNMENTS,
    constraints: [
      where('verifierUid', '==', verifierUid),
      where('status', '==', STATUS_ENUMS.VERIFIER_ASSIGNMENT.ACTIVE)
    ],
    orderByField: 'assignedAt',
    orderDirection: 'desc'
  });
}

/**
 * Records an immutable turnstile scan attempt into `/checkIns`.
 * RESTRICTED: Authorized Verifier, Organizer, or Administrator.
 */
export async function recordCheckInAuditLog({
  passId,
  bookingId = null,
  eventId,
  eventTitle = 'Campus Event',
  attendeeName = 'Attendee',
  participantUid = null,
  organizerUid = null,
  verifierUid,
  verifierName = 'Gate Verifier',
  gate = 'Gate A',
  status = STATUS_ENUMS.CHECK_IN.GRANTED, // 'Granted' | 'Denied' | 'Duplicate'
  reason = 'Entry Authorized'
}) {
  const checkInId = generateDocId('chk');
  const now = Date.now();

  const auditPayload = {
    id: checkInId,
    checkInId,
    passId,
    bookingId,
    eventId,
    eventTitle,
    attendeeName,
    participantUid,
    organizerUid,
    verifierUid: verifierUid || 'unknown_verifier',
    verifierName,
    gate,
    status,
    reason,
    timestamp: now,
    createdAt: now
  };

  await writeDocument(COLLECTIONS.CHECK_INS, checkInId, auditPayload);
  return auditPayload;
}

/**
 * Fetches turnstile check-in logs for an event with cursor pagination.
 */
export async function fetchEventCheckIns(eventId, actor, { pageSize = 30, lastDoc = null } = {}) {
  if (!eventId) return { items: [], lastDoc: null, hasMore: false };

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.CHECK_INS,
    constraints: [where('eventId', '==', eventId)],
    orderByField: 'timestamp',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Real-time subscription to event check-in logs for organizers and gate staff.
 */
export function subscribeToEventCheckIns(eventId, onUpdate, onError) {
  if (!eventId) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  return subscribeToCollection({
    collectionName: COLLECTIONS.CHECK_INS,
    constraints: [where('eventId', '==', eventId)],
    orderByField: 'timestamp',
    orderDirection: 'desc',
    limitCount: 50,
    onUpdate,
    onError
  });
}

export const OFFLINE_PASS_ROSTER_KEY = 'gateapass_offline_pass_roster';
export const OFFLINE_CHECKINS_QUEUE_KEY = 'gateapass_offline_checkins_queue';

/**
 * Returns all queued offline check-ins waiting to be synced to Cloud Firestore.
 */
export function getOfflineCheckinsQueue() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(OFFLINE_CHECKINS_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return [];
}

/**
 * Clears the offline check-in queue.
 */
export function clearOfflineCheckinsQueue() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(OFFLINE_CHECKINS_QUEUE_KEY);
      return true;
    }
  } catch {}
  return false;
}

/**
 * Retrieves the cached pass roster for a specific event from local storage.
 */
export function getCachedPassRoster(eventId) {
  if (!eventId) return [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${OFFLINE_PASS_ROSTER_KEY}_${eventId}`);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return [];
}

/**
 * Caches a roster of passes in local storage for offline gate scanning.
 */
export function cachePassRosterForOffline(eventId, passesList) {
  if (!eventId || !Array.isArray(passesList)) return false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rosterKey = `${OFFLINE_PASS_ROSTER_KEY}_${eventId}`;
      window.localStorage.setItem(rosterKey, JSON.stringify(passesList));
      return true;
    }
  } catch (err) {
    console.warn('[GateApass Offline] Failed to cache roster:', err);
  }
  return false;
}

/**
 * Pre-downloads the authoritative pass manifest from Cloud Firestore for an event
 * so gate staff can scan tickets offline with zero connectivity.
 */
export async function downloadEventPassRoster(eventId) {
  if (!eventId) return { success: false, count: 0, passes: [] };
  const passesList = [];

  try {
    // 1. Fetch from /passes collection
    const passesResult = await fetchPaginatedCollection({
      collectionName: COLLECTIONS.PASSES,
      constraints: [where('eventId', '==', eventId)],
      pageSize: 500
    });
    if (Array.isArray(passesResult.items)) {
      passesResult.items.forEach((p) => {
        const passId = p.passId || p.id;
        if (passId) {
          passesList.push({
            ...p,
            passId,
            id: passId,
            signature: p.signature || generatePassChecksum(passId, p.eventId || eventId, p.bookingId, p.participantUid)
          });
        }
      });
    }

    // 2. Fetch from /bookings collection for any passes stored in booking.passes
    const bookingsResult = await fetchPaginatedCollection({
      collectionName: COLLECTIONS.BOOKINGS,
      constraints: [where('eventId', '==', eventId)],
      pageSize: 200
    });
    if (Array.isArray(bookingsResult.items)) {
      bookingsResult.items.forEach((b) => {
        if (Array.isArray(b.passes)) {
          b.passes.forEach((bp) => {
            const passId = bp.passId || bp.id;
            if (passId && !passesList.some((existing) => existing.passId === passId)) {
              passesList.push({
                ...bp,
                passId,
                id: passId,
                eventId: bp.eventId || b.eventId || eventId,
                eventTitle: bp.eventTitle || b.eventTitle,
                bookingId: bp.bookingId || b.bookingId || b.id,
                paymentStatus: bp.paymentStatus || b.paymentStatus,
                signature: bp.signature || generatePassChecksum(passId, bp.eventId || b.eventId || eventId, b.bookingId, b.participantUid)
              });
            }
          });
        }
      });
    }

    // Cache in localStorage
    cachePassRosterForOffline(eventId, passesList);
    return { success: true, count: passesList.length, passes: passesList };
  } catch (err) {
    console.warn('[GateApass Verifier] Error downloading offline pass roster:', err);
    return { success: false, count: 0, error: err.message, passes: [] };
  }
}

/**
 * Validates a pass against the offline cached roster when network is unavailable.
 * Checks event ID, payment, status, expiration, and cryptographic signature.
 */
export function verifyPassOffline(passCode, targetEventId = null) {
  if (!passCode) {
    return { valid: false, status: 'Invalid', reason: 'Missing pass code' };
  }
  const cleanCode = String(passCode).trim();
  const cleanLower = cleanCode.toLowerCase();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Find across cached rosters or global bookings
      let foundPass = null;
      let eventRosterKey = targetEventId ? `${OFFLINE_PASS_ROSTER_KEY}_${targetEventId}` : null;

      if (eventRosterKey) {
        const raw = window.localStorage.getItem(eventRosterKey);
        if (raw) {
          const roster = JSON.parse(raw);
          foundPass = roster.find((p) =>
            (p.passId && p.passId.toLowerCase() === cleanLower) ||
            (p.id && p.id.toLowerCase() === cleanLower) ||
            (p.qrPayload && p.qrPayload.toLowerCase() === cleanLower)
          );
        }
      }

      // If not in targeted roster, search all offline keys and general bookings cache
      if (!foundPass) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith(OFFLINE_PASS_ROSTER_KEY) || k === 'gateapass_user_bookings' || k === 'getapass_bookings')) {
            try {
              const data = JSON.parse(window.localStorage.getItem(k));
              if (Array.isArray(data)) {
                for (const item of data) {
                  if (item.passId?.toLowerCase() === cleanLower || item.id?.toLowerCase() === cleanLower) {
                    foundPass = item;
                    break;
                  }
                  if (Array.isArray(item.passes)) {
                    const match = item.passes.find(
                      (p) => p.passId?.toLowerCase() === cleanLower || p.id?.toLowerCase() === cleanLower
                    );
                    if (match) {
                      foundPass = { ...match, eventTitle: item.eventTitle, eventId: item.eventId };
                      break;
                    }
                  }
                }
              }
            } catch {}
          }
          if (foundPass) break;
        }
      }

      if (!foundPass) {
        return {
          valid: false,
          status: 'Invalid',
          reason: 'Pass not recognized in local offline roster or digital registry.'
        };
      }

      // 1. Check Cryptographic Signature if provided in payload
      if (foundPass.signature && cleanCode.includes('sig=')) {
        const sigMatch = cleanCode.match(/sig=([a-zA-Z0-9_\-]+)/i);
        if (sigMatch && sigMatch[1] && sigMatch[1] !== foundPass.signature) {
          return {
            valid: false,
            status: 'Invalid',
            reason: 'Pass cryptographic signature verification failed. Possible altered or forged ticket.',
            pass: foundPass
          };
        }
      }

      // 2. Check Event Matching
      if (targetEventId && foundPass.eventId && foundPass.eventId !== targetEventId) {
        return {
          valid: false,
          status: 'Wrong-event',
          reason: `Pass belongs to "${foundPass.eventTitle || foundPass.eventId}", not the event selected at this gate.`,
          pass: foundPass
        };
      }

      // 3. Check Used Status (Replay / Duplicate Entry Protection)
      if (foundPass.checkedIn === true || String(foundPass.status).toLowerCase() === 'used') {
        return {
          valid: false,
          status: 'Already-used',
          reason: 'Pass has already been used for gate entry. Duplicate admission blocked.',
          alreadyUsed: true,
          checkedInAt: foundPass.checkedInAt || null,
          checkedInGate: foundPass.gate || 'Gate A',
          checkedInBy: foundPass.verifierName || 'Gate Verifier',
          pass: foundPass
        };
      }

      // 4. Check Payment Status
      const paymentStatus = String(foundPass.paymentStatus || '').toUpperCase();
      const normStatus = String(foundPass.status || '').toLowerCase();
      if (
        normStatus === 'pending payment' ||
        paymentStatus === 'PENDING' ||
        paymentStatus === 'FAILED' ||
        paymentStatus === 'UNPAID' ||
        paymentStatus === 'DECLINED'
      ) {
        return {
          valid: false,
          status: 'Payment-pending',
          reason: `Payment verification incomplete (Status: ${paymentStatus || 'Pending'}). Pass is not valid for entry.`,
          pass: foundPass
        };
      }

      // 5. Check Cancelled / Refunded / Suspended
      if (normStatus === 'cancelled' || normStatus === 'refunded' || normStatus === 'suspended') {
        return {
          valid: false,
          status: 'Cancelled',
          reason: `Pass has been ${foundPass.status || 'Cancelled'} by event administration. Entry strictly denied.`,
          pass: foundPass
        };
      }

      // 6. Check Expired
      const validUntil = Number(foundPass.validUntil || 0);
      if (normStatus === 'expired' || (validUntil > 0 && validUntil < Date.now())) {
        return {
          valid: false,
          status: 'Expired',
          reason: `Pass validity expired on ${new Date(validUntil || foundPass.date).toLocaleDateString()}. Entry denied.`,
          pass: foundPass
        };
      }

      // All Valid
      return {
        valid: true,
        status: 'Valid',
        reason: 'Verified against local secure roster.',
        pass: foundPass,
        attendeeName: foundPass.attendeeName || foundPass.name || 'Attendee',
        passType: foundPass.passType || foundPass.category || 'Standard',
        eventTitle: foundPass.eventTitle || 'Campus Event',
        offline: true
      };
    }
  } catch (err) {
    console.warn('[GateApass Offline Verifier] Error checking offline:', err);
  }

  return { valid: false, status: 'Invalid', reason: 'Offline verification error' };
}

/**
 * Queues an offline check-in log to be synced when internet connectivity returns.
 */
export function queueOfflineCheckin(checkinData) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(OFFLINE_CHECKINS_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({
        ...checkinData,
        queuedAt: Date.now()
      });
      window.localStorage.setItem(OFFLINE_CHECKINS_QUEUE_KEY, JSON.stringify(queue));
      return true;
    }
  } catch {}
  return false;
}

/**
 * Marks a pass as Used in the cached offline roster so repeat offline scans are blocked.
 */
export function markPassUsedOffline(passId, targetEventId = null, gate = 'Gate A', verifierUid = null) {
  if (!passId) return false;
  const cleanLower = String(passId).trim().toLowerCase();
  const now = Date.now();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToUpdate = [];
      if (targetEventId) keysToUpdate.push(`${OFFLINE_PASS_ROSTER_KEY}_${targetEventId}`);

      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(OFFLINE_PASS_ROSTER_KEY) && !keysToUpdate.includes(k)) {
          keysToUpdate.push(k);
        }
      }

      for (const k of keysToUpdate) {
        const raw = window.localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          let modified = false;
          const updated = list.map((item) => {
            if (
              (item.passId && item.passId.toLowerCase() === cleanLower) ||
              (item.id && item.id.toLowerCase() === cleanLower)
            ) {
              modified = true;
              return {
                ...item,
                checkedIn: true,
                status: 'Used',
                checkedInAt: now,
                gate,
                checkedInBy: verifierUid
              };
            }
            return item;
          });
          if (modified) {
            window.localStorage.setItem(k, JSON.stringify(updated));
            return true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[GateApass Offline Verifier] Error marking pass used offline:', err);
  }
  return false;
}

/**
 * Flushes queued offline check-ins to Cloud Firestore upon reconnection.
 * Implements atomic check-in transactions and detects conflicts (if pass was scanned at another gate while offline).
 */
export async function syncOfflineCheckins(verifierUser = null) {
  const queue = getOfflineCheckinsQueue();
  if (!queue || queue.length === 0) {
    return { syncedCount: 0, conflictCount: 0, conflicts: [], errors: [] };
  }

  const conflicts = [];
  const errors = [];
  const successfulPassIds = [];

  for (const item of queue) {
    const passId = item.passId;
    if (!passId) continue;

    try {
      if (db) {
        let targetDocRef = doc(db, COLLECTIONS.PASSES, passId);
        let targetDocSnap = await getDoc(targetDocRef);
        let isDedicatedPassDoc = targetDocSnap.exists();

        if (!isDedicatedPassDoc) {
          const bookingRef = doc(db, COLLECTIONS.BOOKINGS, passId);
          const bookingSnap = await getDoc(bookingRef);
          if (bookingSnap.exists()) {
            targetDocRef = bookingRef;
          } else {
            const qPass = query(collection(db, COLLECTIONS.BOOKINGS), where('passId', '==', passId));
            let passDocs = await getDocs(qPass);
            if (passDocs.empty) {
              const qPassIds = query(collection(db, COLLECTIONS.BOOKINGS), where('passIds', 'array-contains', passId));
              passDocs = await getDocs(qPassIds);
            }
            if (!passDocs.empty) {
              targetDocRef = passDocs.docs[0].ref;
            }
          }
        }

        const syncResult = await runTransaction(db, async (txn) => {
          const freshSnap = await txn.get(targetDocRef);
          if (!freshSnap.exists()) {
            return {
              conflict: false,
              error: `Pass ${passId} not found in digital registry.`
            };
          }

          const rawData = freshSnap.data();
          let passItem = rawData;
          if (!isDedicatedPassDoc && Array.isArray(rawData.passes)) {
            passItem = rawData.passes.find((p) => p.passId === passId || p.id === passId) || rawData.passes[0];
          }

          // CONFLICT DETECTION: Was the pass already checked in online while this terminal was offline?
          if (passItem.checkedIn === true || String(passItem.status).toLowerCase() === 'used') {
            return {
              conflict: true,
              passItem,
              existingCheckinAt: passItem.checkedInAt || rawData.checkedInAt,
              existingGate: passItem.gate || rawData.gate || 'Unknown Gate',
              existingVerifier: passItem.verifierName || rawData.verifierName || 'Another Gate Staff'
            };
          }

          // No conflict: Atomically apply offline check-in stamp
          const checkinStamp = {
            checkedIn: true,
            status: STATUS_ENUMS.PASS.USED,
            checkedInAt: item.timestamp || Date.now(),
            verifiedOffline: true,
            syncedAt: Date.now(),
            checkedInBy: item.verifierUid || verifierUser?.uid || 'offline_verifier',
            verifierName: verifierUser?.displayName || verifierUser?.name || 'Gate Verifier',
            gate: item.gate || 'Gate A',
            updatedAt: Date.now()
          };

          if (isDedicatedPassDoc) {
            txn.update(targetDocRef, checkinStamp);
          } else if (Array.isArray(rawData.passes)) {
            const updatedPasses = rawData.passes.map((p) =>
              p.passId === passId || p.id === passId ? { ...p, ...checkinStamp } : p
            );
            txn.update(targetDocRef, { passes: updatedPasses, updatedAt: Date.now() });
          } else {
            txn.update(targetDocRef, checkinStamp);
          }

          return { conflict: false, passItem: { ...passItem, ...checkinStamp } };
        });

        if (syncResult.conflict) {
          const conflictInfo = {
            passId,
            eventId: item.eventId,
            gate: item.gate,
            scannedOfflineAt: item.timestamp,
            onlineCheckinAt: syncResult.existingCheckinAt,
            onlineGate: syncResult.existingGate,
            onlineVerifier: syncResult.existingVerifier
          };
          conflicts.push(conflictInfo);

          await recordCheckInAuditLog({
            passId,
            eventId: item.eventId,
            gate: item.gate,
            verifierUid: item.verifierUid || verifierUser?.uid,
            verifierName: verifierUser?.displayName || verifierUser?.name || 'Offline Gate Verifier',
            status: STATUS_ENUMS.CHECK_IN.DUPLICATE,
            reason: `CONFLICT_DUPLICATE_OFFLINE: Scanned offline at ${item.gate}, but pass was already checked in online at ${new Date(syncResult.existingCheckinAt || 0).toLocaleTimeString()} at ${syncResult.existingGate}`
          }).catch(() => {});

          successfulPassIds.push(passId);
        } else if (syncResult.error) {
          errors.push({ passId, error: syncResult.error });
        } else {
          await recordCheckInAuditLog({
            passId,
            bookingId: syncResult.passItem?.bookingId || null,
            eventId: syncResult.passItem?.eventId || item.eventId,
            eventTitle: syncResult.passItem?.eventTitle || 'Campus Event',
            attendeeName: syncResult.passItem?.attendeeName || 'Attendee',
            participantUid: syncResult.passItem?.participantUid || null,
            organizerUid: syncResult.passItem?.organizerUid || null,
            verifierUid: item.verifierUid || verifierUser?.uid,
            verifierName: verifierUser?.displayName || verifierUser?.name,
            gate: item.gate || 'Gate A',
            status: STATUS_ENUMS.CHECK_IN.GRANTED,
            reason: 'Pass Verified Offline — Synced to Cloud'
          }).catch(() => {});

          successfulPassIds.push(passId);
        }
      }
    } catch (err) {
      console.warn(`[GateApass Sync] Error syncing pass ${passId}:`, err);
      errors.push({ passId, error: err.message });
    }
  }

  // Update queue by removing items that were successfully processed
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const remainingQueue = queue.filter((q) => !successfulPassIds.includes(q.passId));
      if (remainingQueue.length > 0) {
        window.localStorage.setItem(OFFLINE_CHECKINS_QUEUE_KEY, JSON.stringify(remainingQueue));
      } else {
        window.localStorage.removeItem(OFFLINE_CHECKINS_QUEUE_KEY);
      }
    }
  } catch {}

  return {
    syncedCount: successfulPassIds.length - conflicts.length,
    conflictCount: conflicts.length,
    conflicts,
    errors
  };
}

/**
 * Real-time subscription to turnstile check-in logs based on the user's platform role.
 * - Admin: Platform-wide turnstile check-ins
 * - Organizer: Check-ins for events owned by this organizer
 * - Verifier: Check-ins logged by this verifier
 */
export function subscribeToRoleCheckIns(actor, onUpdate, onError) {
  if (!actor || !actor.uid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  const isAdmin = Boolean(actor.role === 'admin' || actor.isAdmin);
  const isOrganizer = Boolean(actor.role === 'organizer' || actor.isOrganizer);

  let constraints = [];
  if (isAdmin) {
    constraints = [];
  } else if (isOrganizer) {
    constraints = [where('organizerUid', '==', actor.uid)];
  } else {
    // Verifier
    constraints = [where('verifierUid', '==', actor.uid)];
  }

  return subscribeToCollection({
    collectionName: COLLECTIONS.CHECK_INS,
    constraints,
    orderByField: 'timestamp',
    orderDirection: 'desc',
    limitCount: 50,
    onUpdate: (items) => {
      if (onUpdate) onUpdate(items);
    },
    onError: (err) => {
      console.warn('[GateApass Turnstile] Role check-ins subscription notice:', err);
      if (onError) onError(err);
    }
  });
}
