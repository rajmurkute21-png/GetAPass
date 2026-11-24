/**
 * GetAPass — Financial Transaction Service
 *
 * Manages the dedicated `/transactions` ledger collection:
 * - Payment audit trails
 * - Multi-tenant isolation for participant payment receipts and organizer revenue reconciliation
 * - Immutable financial tracking
 */

import { where } from 'firebase/firestore';
import { COLLECTIONS, STATUS_ENUMS, generateTransactionId } from '../constants/firestoreSchema';
import {
  fetchPaginatedCollection,
  writeDocument,
  subscribeToCollection
} from './firestoreService';
import { canManagePlatform } from './permissionService';

/**
 * Creates an authoritative transaction ledger entry upon booking payment.
 */
export async function createTransaction({
  bookingId,
  eventId,
  eventTitle,
  participantUid,
  organizerUid,
  amount,
  currency = 'INR',
  paymentMethod = 'UPI',
  gatewayRef = null,
  status = STATUS_ENUMS.TRANSACTION.SUCCESS
}) {
  const transactionId = generateTransactionId();
  const now = Date.now();

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Invalid transaction amount.');
  }

  const transactionPayload = {
    transactionId,
    id: transactionId,
    bookingId,
    eventId,
    eventTitle,
    participantUid,
    organizerUid,
    amount: numAmount,
    currency,
    paymentMethod,
    status,
    gatewayRef: gatewayRef || `GW_REF_${now.toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now
  };

  await writeDocument(COLLECTIONS.TRANSACTIONS, transactionId, transactionPayload);
  return transactionPayload;
}

/**
 * Fetches transactions for a participant with cursor pagination.
 */
export async function fetchParticipantTransactions(participantUid, { pageSize = 15, lastDoc = null } = {}) {
  if (!participantUid) return { items: [], lastDoc: null, hasMore: false };

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.TRANSACTIONS,
    constraints: [where('participantUid', '==', participantUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Fetches transactions for an organizer's events (Organizer or Admin).
 */
export async function fetchOrganizerTransactions(organizerUid, actor, { pageSize = 20, lastDoc = null } = {}) {
  if (!organizerUid) return { items: [], lastDoc: null, hasMore: false };

  const isSelf = actor?.uid === organizerUid;
  const isAdmin = canManagePlatform(actor);
  if (!isSelf && !isAdmin) {
    throw new Error('Unauthorized: You can only view revenue transactions for your own events.');
  }

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.TRANSACTIONS,
    constraints: [where('organizerUid', '==', organizerUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Real-time subscription to participant transactions.
 */
export function subscribeToParticipantTransactions(participantUid, onUpdate, onError) {
  if (!participantUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  return subscribeToCollection({
    collectionName: COLLECTIONS.TRANSACTIONS,
    constraints: [where('participantUid', '==', participantUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    onUpdate,
    onError
  });
}

/**
 * Real-time subscription to organizer revenue transactions.
 */
export function subscribeToOrganizerTransactions(organizerUid, onUpdate, onError) {
  if (!organizerUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  return subscribeToCollection({
    collectionName: COLLECTIONS.TRANSACTIONS,
    constraints: [where('organizerUid', '==', organizerUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    onUpdate,
    onError
  });
}
