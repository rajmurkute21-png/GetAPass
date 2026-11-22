/**
 * GetAPass — Notifications Service
 *
 * Manages the dedicated `/notifications` collection:
 * - Real-time push updates for ticket confirmations, gate changes, and receipts
 * - Strict multi-tenant isolation where users only receive notifications addressed to their UID
 */

import { where } from 'firebase/firestore';
import { COLLECTIONS, generateDocId } from '../constants/firestoreSchema';
import {
  fetchPaginatedCollection,
  writeDocument,
  updateDocumentFields,
  deleteDocumentById,
  subscribeToCollection
} from './firestoreService';

/**
 * Creates a notification for a target user.
 */
export async function createNotification({
  recipientUid,
  title,
  message,
  type = 'info',
  actionUrl = null,
  metadata = {}
}) {
  if (!recipientUid) {
    throw new Error('Recipient UID is required to create a notification.');
  }

  const notificationId = generateDocId('notif');
  const now = Date.now();

  const payload = {
    id: notificationId,
    notificationId,
    recipientUid,
    title,
    message,
    type, // 'info' | 'success' | 'warning' | 'ticket'
    actionUrl,
    read: false,
    metadata,
    createdAt: now,
    updatedAt: now
  };

  await writeDocument(COLLECTIONS.NOTIFICATIONS, notificationId, payload);
  return payload;
}

/**
 * Fetches notifications for a user with cursor pagination.
 */
export async function fetchUserNotifications(recipientUid, { pageSize = 20, lastDoc = null, unreadOnly = false } = {}) {
  if (!recipientUid) return { items: [], lastDoc: null, hasMore: false };

  const constraints = [where('recipientUid', '==', recipientUid)];
  if (unreadOnly) {
    constraints.push(where('read', '==', false));
  }

  return fetchPaginatedCollection({
    collectionName: COLLECTIONS.NOTIFICATIONS,
    constraints,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    pageSize,
    lastDoc
  });
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId, currentUser) {
  if (!notificationId || !currentUser?.uid) return;

  return updateDocumentFields(COLLECTIONS.NOTIFICATIONS, notificationId, {
    read: true,
    readAt: Date.now()
  });
}

/**
 * Deletes a notification.
 */
export async function deleteNotification(notificationId) {
  return deleteDocumentById(COLLECTIONS.NOTIFICATIONS, notificationId);
}

/**
 * Real-time subscription to a user's notification feed.
 */
export function subscribeToUserNotifications(recipientUid, onUpdate, onError) {
  if (!recipientUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  return subscribeToCollection({
    collectionName: COLLECTIONS.NOTIFICATIONS,
    constraints: [where('recipientUid', '==', recipientUid)],
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: 30,
    onUpdate,
    onError
  });
}
