/**
 * GetAPass — Centralized Reusable Firestore Service
 *
 * Provides standardized pagination, query constraint builder, real-time subscriptions,
 * server timestamp management, serialization sanitization, and robust error handling.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

let _inMemoryStore = null;

/**
 * Activates an isolated in-memory document store for testing environments.
 */
export function enableInMemoryTestStore() {
  _inMemoryStore = new Map();
}

/**
 * Deactivates the test store and restores standard Firestore client operations.
 */
export function disableInMemoryTestStore() {
  _inMemoryStore = null;
}

/**
 * Strips undefined values to prevent Firestore serialization exceptions.
 */
export function sanitizeForFirestore(obj) {
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
 * Standard error mapping for user-facing and diagnostic logs.
 */
export function mapFirestoreError(error, defaultMsg = 'Database operation failed.') {
  if (!error) return defaultMsg;
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Permission Denied: You are not authorized to perform this action. Check your account role and resource ownership.';
  }
  if (code === 'unavailable' || message.includes('offline')) {
    return 'The database is currently unreachable. Operating in offline resilient mode.';
  }
  if (code === 'not-found') {
    return 'The requested record was not found.';
  }
  if (code === 'already-exists') {
    return 'A record with this identifier already exists.';
  }

  return message || defaultMsg;
}

/**
 * Reusable paginated collection query.
 *
 * @param {Object} options
 * @param {string} options.collectionName
 * @param {Array}  options.constraints - where() clauses
 * @param {string} [options.orderByField='createdAt']
 * @param {string} [options.orderDirection='desc']
 * @param {number} [options.pageSize=20]
 * @param {any}    [options.lastDoc=null] - DocumentSnapshot for cursor pagination
 * @returns {Promise<{ items: Array, lastDoc: any, hasMore: boolean }>}
 */
export async function fetchPaginatedCollection({
  collectionName,
  constraints = [],
  orderByField = 'createdAt',
  orderDirection = 'desc',
  pageSize = 20,
  lastDoc = null
}) {
  if (_inMemoryStore) {
    const prefix = `${collectionName}/`;
    const items = [];
    for (const [key, val] of _inMemoryStore.entries()) {
      if (key.startsWith(prefix)) {
        items.push({ ...val });
      }
    }
    return {
      items,
      lastDoc: null,
      hasMore: false,
      count: items.length
    };
  }

  if (!db) {
    return { items: [], lastDoc: null, hasMore: false };
  }

  try {
    const colRef = collection(db, collectionName);
    const queryParts = [colRef, ...constraints];

    if (orderByField) {
      queryParts.push(orderBy(orderByField, orderDirection));
    }

    if (lastDoc) {
      queryParts.push(startAfter(lastDoc));
    }

    queryParts.push(limit(pageSize));

    const q = query(...queryParts);
    const snapshot = await getDocs(q);

    const items = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id });
    });

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    const hasMore = snapshot.docs.length === pageSize;

    return {
      items,
      lastDoc: newLastDoc,
      hasMore,
      count: items.length
    };
  } catch (err) {
    console.error(`[FirestoreService] Error querying ${collectionName}:`, err);
    throw new Error(mapFirestoreError(err, `Failed to query ${collectionName}.`));
  }
}

/**
 * Fetches a single document by ID with fallback.
 */
export async function getDocumentById(collectionName, docId) {
  if (_inMemoryStore) {
    const item = _inMemoryStore.get(`${collectionName}/${docId}`);
    return item ? { ...item } : null;
  }

  if (!db || !docId) return null;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    }
    return null;
  } catch (err) {
    console.error(`[FirestoreService] Error fetching ${collectionName}/${docId}:`, err);
    throw new Error(mapFirestoreError(err, `Failed to fetch record from ${collectionName}.`));
  }
}

/**
 * Creates or overwrites a document with automatic timestamps.
 */
export async function writeDocument(collectionName, docId, data, merge = false) {
  const now = Date.now();
  const payload = {
    ...data,
    updatedAt: now
  };

  if (!merge && !payload.createdAt) {
    payload.createdAt = now;
  }

  const sanitized = sanitizeForFirestore(payload);

  if (_inMemoryStore) {
    const key = `${collectionName}/${docId}`;
    const existing = _inMemoryStore.get(key) || {};
    const finalDoc = merge ? { ...existing, ...sanitized, id: docId } : { ...sanitized, id: docId };
    _inMemoryStore.set(key, finalDoc);
    return finalDoc;
  }

  if (!db) {
    return { ...sanitized, id: docId };
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, sanitized, { merge });
    return { ...sanitized, id: docId };
  } catch (err) {
    console.error(`[FirestoreService] Error writing ${collectionName}/${docId}:`, err);
    throw new Error(mapFirestoreError(err, `Failed to save record to ${collectionName}.`));
  }
}

/**
 * Updates specific fields on an existing document.
 */
export async function updateDocumentFields(collectionName, docId, fields) {
  const now = Date.now();
  const payload = sanitizeForFirestore({
    ...fields,
    updatedAt: now
  });

  if (_inMemoryStore) {
    const key = `${collectionName}/${docId}`;
    const existing = _inMemoryStore.get(key) || { id: docId };
    const updated = { ...existing, ...payload };
    _inMemoryStore.set(key, updated);
    return payload;
  }

  if (!db) return fields;

  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, payload);
    return payload;
  } catch (err) {
    console.error(`[FirestoreService] Error updating ${collectionName}/${docId}:`, err);
    throw new Error(mapFirestoreError(err, `Failed to update record in ${collectionName}.`));
  }
}

/**
 * Deletes a document by ID.
 */
export async function deleteDocumentById(collectionName, docId) {
  if (_inMemoryStore) {
    _inMemoryStore.delete(`${collectionName}/${docId}`);
    return true;
  }

  if (!db) return true;

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`[FirestoreService] Error deleting ${collectionName}/${docId}:`, err);
    throw new Error(mapFirestoreError(err, `Failed to delete record from ${collectionName}.`));
  }
}

/**
 * Establishes a real-time subscription with query constraints and clean teardown.
 */
export function subscribeToCollection({
  collectionName,
  constraints = [],
  orderByField = null,
  orderDirection = 'desc',
  limitCount = null,
  onUpdate,
  onError
}) {
  if (_inMemoryStore) {
    const prefix = `${collectionName}/`;
    const items = [];
    for (const [key, val] of _inMemoryStore.entries()) {
      if (key.startsWith(prefix)) {
        items.push({ ...val });
      }
    }
    if (onUpdate) onUpdate(items);
    return () => {};
  }

  if (!db) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    const colRef = collection(db, collectionName);
    const queryParts = [colRef, ...constraints];

    if (orderByField) {
      queryParts.push(orderBy(orderByField, orderDirection));
    }
    if (limitCount) {
      queryParts.push(limit(limitCount));
    }

    const q = query(...queryParts);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id });
        });
        if (onUpdate) onUpdate(items);
      },
      (error) => {
        console.error(`[FirestoreService] Snapshot error on ${collectionName}:`, error);
        if (onError) onError(new Error(mapFirestoreError(error)));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error(`[FirestoreService] Failed to establish listener on ${collectionName}:`, err);
    if (onError) onError(new Error(mapFirestoreError(err)));
    return () => {};
  }
}

/**
 * Returns a Firestore server timestamp or numeric epoch in local/test mode.
 */
export function getServerTimestamp() {
  if (_inMemoryStore || !db) {
    return Date.now();
  }
  return serverTimestamp();
}

/**
 * Establishes a real-time subscription to a single document with automatic teardown.
 */
export function subscribeToDocument(collectionName, docId, onUpdate, onError) {
  if (_inMemoryStore) {
    const key = `${collectionName}/${docId}`;
    const item = _inMemoryStore.get(key);
    if (onUpdate) onUpdate(item ? { ...item, id: docId } : null);
    return () => {};
  }

  if (!db || !docId) {
    if (onUpdate) onUpdate(null);
    return () => {};
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          if (onUpdate) onUpdate({ ...docSnap.data(), id: docSnap.id });
        } else {
          if (onUpdate) onUpdate(null);
        }
      },
      (error) => {
        console.warn(`[FirestoreService] Document snapshot error on ${collectionName}/${docId}:`, error);
        if (onError) onError(new Error(mapFirestoreError(error)));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`[FirestoreService] Failed to establish document listener on ${collectionName}/${docId}:`, err);
    if (onError) onError(new Error(mapFirestoreError(err)));
    return () => {};
  }
}

/**
 * Executes an atomic Firestore transaction across documents with test-environment simulation.
 */
export async function runFirestoreTransaction(updateFunction) {
  if (_inMemoryStore) {
    const mockTxn = {
      get: async (docRef) => {
        const path = docRef._path || docRef.path || (docRef.id ? `${docRef.parent?.id || 'events'}/${docRef.id}` : 'events/doc');
        const item = _inMemoryStore.get(path);
        return {
          exists: () => Boolean(item),
          data: () => (item ? { ...item } : null),
          id: docRef.id || 'doc'
        };
      },
      set: (docRef, data, options = {}) => {
        const path = docRef._path || docRef.path || (docRef.id ? `${docRef.parent?.id || 'events'}/${docRef.id}` : 'events/doc');
        const existing = options.merge ? (_inMemoryStore.get(path) || {}) : {};
        _inMemoryStore.set(path, { ...existing, ...sanitizeForFirestore(data), id: docRef.id });
      },
      update: (docRef, data) => {
        const path = docRef._path || docRef.path || (docRef.id ? `${docRef.parent?.id || 'events'}/${docRef.id}` : 'events/doc');
        const existing = _inMemoryStore.get(path) || {};
        _inMemoryStore.set(path, { ...existing, ...sanitizeForFirestore(data), id: docRef.id });
      },
      delete: (docRef) => {
        const path = docRef._path || docRef.path || (docRef.id ? `${docRef.parent?.id || 'events'}/${docRef.id}` : 'events/doc');
        _inMemoryStore.delete(path);
      }
    };
    return await updateFunction(mockTxn);
  }

  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  return await runTransaction(db, updateFunction);
}
