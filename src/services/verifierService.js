/**
 * GetAPass — Verifier Assignment & Turnstile Audit Service
 *
 * Manages the dedicated `/verifierAssignments` and `/checkIns` collections:
 * - Scoped turnstile check-in authorization: Verifiers can access only assigned events
 * - Immutable turnstile audit logs for every admission attempt (Granted, Denied, Duplicate)
 */

import { where } from 'firebase/firestore';
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
 * Validates a pass against the offline cached roster when network is unavailable.
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

      // Check event match
      if (targetEventId && foundPass.eventId && foundPass.eventId !== targetEventId) {
        return {
          valid: false,
          status: 'Wrong-event',
          reason: `Pass is for "${foundPass.eventTitle || foundPass.eventId}", not the current event.`,
          pass: foundPass
        };
      }

      // Check used status
      if (foundPass.checkedIn || foundPass.status === 'Used') {
        return {
          valid: false,
          status: 'Already-used',
          reason: 'This pass was already scanned and used for entry.',
          pass: foundPass
        };
      }

      // Check payment status
      const paymentStatus = String(foundPass.paymentStatus || '').toUpperCase();
      if (
        foundPass.status === 'Pending Payment' ||
        paymentStatus === 'PENDING' ||
        paymentStatus === 'FAILED' ||
        paymentStatus === 'UNPAID' ||
        paymentStatus === 'DECLINED'
      ) {
        return {
          valid: false,
          status: 'Payment-pending',
          reason: 'Payment for this pass has not been completed or verified.',
          pass: foundPass
        };
      }

      // Check cancelled / expired
      if (foundPass.status === 'Cancelled' || foundPass.status === 'Refunded') {
        return {
          valid: false,
          status: 'Cancelled',
          reason: 'This pass has been cancelled or refunded.',
          pass: foundPass
        };
      }
      if (foundPass.status === 'Expired') {
        return {
          valid: false,
          status: 'Expired',
          reason: 'This pass has expired.',
          pass: foundPass
        };
      }

      // Valid
      return {
        valid: true,
        status: 'Valid',
        reason: 'Verified against local secure roster.',
        pass: foundPass,
        attendeeName: foundPass.attendeeName || foundPass.name || 'Attendee',
        passType: foundPass.passType || 'Standard',
        eventTitle: foundPass.eventTitle || 'Campus Event'
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
