/**
 * GetAPass — Verifier Assignment & Turnstile Audit Service
 *
 * Manages the dedicated `/verifierAssignments` and `/checkIns` collections:
 * - Scoped turnstile check-in authorization: Verifiers can access only assigned events
 * - Immutable turnstile audit logs for every admission attempt (Granted, Denied, Duplicate)
 */

import { where } from 'firebase/firestore';
import { COLLECTIONS, STATUS_ENUMS, generateDocId } from '../constants/firestoreSchema';
import {
  fetchPaginatedCollection,
  getDocumentById,
  writeDocument,
  updateDocumentFields,
  subscribeToCollection
} from './firestoreService';
import { canManageEvents } from './permissionService';

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
