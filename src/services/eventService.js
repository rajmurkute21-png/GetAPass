import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { INITIAL_EVENTS } from '../data/mockData';
import { savePassType } from '../data/passTypes';

export const EVENTS_COLLECTION = 'events';
export const EVENTS_STORAGE_KEY = 'gateapass_events';

const LEGACY_PREDEFINED_EVENT_IDS = [
  'techfest-2026',
  'buildathon-2026',
  'ai-conf-2026',
  'devops-workshop',
  'waves-college-fest',
  'inter-sports-league'
];

// In-memory cache for ultra-fast instant UI rendering
let memoryEventsCache = null;
let isMigrating = false;

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
 * Safely reads cached events from localStorage with memory fallback.
 */
export function getStoredLocalEvents() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((e) => !LEGACY_PREDEFINED_EVENT_IDS.includes(e?.id));
          memoryEventsCache = cleaned;
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.warn('[GateApass] Could not read events from localStorage:', err);
  }

  if (memoryEventsCache && Array.isArray(memoryEventsCache)) {
    return memoryEventsCache;
  }

  const initialCopy = JSON.parse(JSON.stringify(INITIAL_EVENTS || []));
  memoryEventsCache = initialCopy;
  return initialCopy;
}

/**
 * Saves events to local cache and dispatches cross-component event.
 */
export function saveStoredLocalEvents(eventsArray) {
  if (!Array.isArray(eventsArray)) {
    console.error('[GateApass] saveStoredLocalEvents requires an array, received:', typeof eventsArray);
    return;
  }
  memoryEventsCache = eventsArray;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsArray));
      window.dispatchEvent(new CustomEvent('gateapass_events_changed', { detail: eventsArray }));
    }
  } catch (err) {
    console.warn('[GateApass] Could not save events to localStorage:', err);
  }
}

/**
 * Subscribes in real-time to Firestore published events.
 * Updates local cache and notifies subscriber on every change across all devices.
 */
export function subscribeToEvents(onEventsUpdate, onError) {
  // If Firestore is not initialized, return cached local events
  if (!db) {
    const local = getStoredLocalEvents();
    if (onEventsUpdate) onEventsUpdate(local);
    return () => {};
  }

  try {
    const eventsRef = collection(db, EVENTS_COLLECTION);

    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const firestoreEvents = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
            firestoreEvents.push({
              ...data,
              id: docSnap.id,
              title: data.title || data.name || 'Untitled Event',
              name: data.title || data.name || 'Untitled Event',
              status: data.status || 'Active'
            });
          }
        });

        // Sort descending by createdAt or updatedAt
        firestoreEvents.sort((a, b) => {
          const timeA = a.createdAt || a.updatedAt || 0;
          const timeB = b.createdAt || b.updatedAt || 0;
          return timeB - timeA;
        });

        // Also register any embedded passTypes into passTypes store
        firestoreEvents.forEach((ev) => {
          if (Array.isArray(ev.passTypes) && ev.passTypes.length > 0) {
            ev.passTypes.forEach((pt) => {
              try {
                savePassType(pt);
              } catch {
                // ignore passType cache sync warnings
              }
            });
          }
        });

        // Update local cache for offline resilience and fast loads
        saveStoredLocalEvents(firestoreEvents);

        if (onEventsUpdate) {
          onEventsUpdate(firestoreEvents);
        }
      },
      (error) => {
        console.error('[GateApass] Firestore real-time sync error:', error);
        if (onError) onError(error);
        // Fall back to local cache if Firestore encounters an error
        const local = getStoredLocalEvents();
        if (onEventsUpdate) onEventsUpdate(local);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[GateApass] Failed to establish Firestore snapshot listener:', err);
    if (onError) onError(err);
    const local = getStoredLocalEvents();
    if (onEventsUpdate) onEventsUpdate(local);
    return () => {};
  }
}

/**
 * Fetches all published events once from Firestore (public to all authenticated users).
 * Does not filter by user UID or email.
 */
export async function fetchPublishedEvents() {
  if (!db) {
    return getStoredLocalEvents();
  }

  try {
    const snapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    const events = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
        events.push({
          ...data,
          id: docSnap.id,
          title: data.title || data.name || 'Untitled Event',
          name: data.title || data.name || 'Untitled Event'
        });
      }
    });

    events.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    saveStoredLocalEvents(events);
    return events;
  } catch (err) {
    console.error('[GateApass] Error fetching events from Firestore:', err);
    return getStoredLocalEvents();
  }
}

/**
 * Checks whether an actor is authorized to manage (edit/delete) an event.
 */
export function canManageEvent(currentUser, event) {
  if (!currentUser) return false;

  // Plain attendees or optical gate verifiers cannot manage events
  if (currentUser.role === 'participant' || currentUser.role === 'verifier') {
    return false;
  }

  // Admins have full access
  if (currentUser.role === 'admin') {
    return true;
  }

  // If event has an organizer UID, only creator or admin can mutate
  if (event?.organizerUid && currentUser.uid) {
    return event.organizerUid === currentUser.uid;
  }

  // Fallback to organizer email match
  if (event?.organizerEmail && currentUser.email) {
    return event.organizerEmail.toLowerCase() === currentUser.email.toLowerCase();
  }

  // If no ownership was recorded, allowed for authenticated organizers
  return true;
}

/**
 * Creates an event in Firebase Firestore and updates local cache.
 */
export async function createEventInFirestore(eventData, currentUser) {
  if (!eventData) throw new Error('Event data is required.');

  const uniqueId = eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = eventData.title || eventData.name || 'Untitled Event';

  const newEvent = {
    ...eventData,
    id: uniqueId,
    title,
    name: title,
    status: eventData.status || 'Active',
    organizerUid: currentUser?.uid || eventData.organizerUid || '',
    organizerEmail: currentUser?.email || eventData.organizerEmail || '',
    organizerName: eventData.organizerName || currentUser?.displayName || 'Event Organizer',
    createdAt: eventData.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // 1. Immediately persist to local cache for instant responsive UI
  const currentLocal = getStoredLocalEvents();
  const updatedLocal = [newEvent, ...currentLocal.filter((e) => e.id !== uniqueId)];
  saveStoredLocalEvents(updatedLocal);

  // 2. Persist to Firebase Firestore
  if (db) {
    try {
      const cleanData = sanitizeForFirestore(newEvent);
      await setDoc(doc(db, EVENTS_COLLECTION, uniqueId), cleanData);
      console.info(`[GateApass] Event ${uniqueId} (${title}) successfully stored in Firestore.`);
    } catch (firestoreError) {
      console.error('[GateApass] Error saving event to Firestore:', firestoreError);
      throw firestoreError;
    }
  } else {
    console.warn('[GateApass] Firestore is not configured. Event saved to local cache only.');
  }

  return newEvent;
}

/**
 * Updates an existing event in Firestore and local cache.
 */
export async function updateEventInFirestore(id, updates, currentUser) {
  if (!id) throw new Error('Event ID is required for update.');

  const currentLocal = getStoredLocalEvents();
  const existingEvent = currentLocal.find((e) => e.id === id);

  if (existingEvent && currentUser && !canManageEvent(currentUser, existingEvent)) {
    throw new Error('Permission denied: You do not have permission to edit this event.');
  }

  const title = updates.title || updates.name || existingEvent?.title || 'Untitled Event';
  const mergedEvent = {
    ...(existingEvent || {}),
    ...updates,
    id,
    title,
    name: title,
    updatedAt: Date.now()
  };

  // 1. Update local cache
  const updatedList = currentLocal.map((ev) => (ev.id === id ? mergedEvent : ev));
  if (!currentLocal.some((e) => e.id === id)) {
    updatedList.unshift(mergedEvent);
  }
  saveStoredLocalEvents(updatedList);

  // 2. Update Firestore
  if (db) {
    try {
      const cleanUpdates = sanitizeForFirestore(mergedEvent);
      await setDoc(doc(db, EVENTS_COLLECTION, id), cleanUpdates, { merge: true });
      console.info(`[GateApass] Event ${id} updated in Firestore.`);
    } catch (err) {
      console.error('[GateApass] Error updating event in Firestore:', err);
      throw err;
    }
  }

  return mergedEvent;
}

/**
 * Deletes an event from Firestore and local cache.
 */
export async function deleteEventFromFirestore(id, currentUser) {
  if (!id) return false;

  const currentLocal = getStoredLocalEvents();
  const existingEvent = currentLocal.find((e) => e.id === id);

  if (existingEvent && currentUser && !canManageEvent(currentUser, existingEvent)) {
    throw new Error('Permission denied: You do not have permission to delete this event.');
  }

  // 1. Remove from local cache
  const filtered = currentLocal.filter((e) => e.id !== id);
  saveStoredLocalEvents(filtered);

  // 2. Remove from Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, id));
      console.info(`[GateApass] Event ${id} deleted from Firestore.`);
    } catch (err) {
      console.error('[GateApass] Error deleting event from Firestore:', err);
      throw err;
    }
  }

  return true;
}

/**
 * Safe migration mechanism: transfers existing local events into Firestore without creating duplicates.
 * Preserves local events in localStorage.
 */
export async function migrateLocalEventsToFirestore(currentUser) {
  if (!db || isMigrating) return { migrated: 0 };

  const localEvents = getStoredLocalEvents();
  if (!localEvents || localEvents.length === 0) {
    return { migrated: 0 };
  }

  isMigrating = true;
  let migratedCount = 0;

  try {
    // Fetch existing document IDs in Firestore to prevent overwriting or duplicates
    const snapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    const existingIds = new Set();
    const existingTitles = new Set();

    snapshot.forEach((d) => {
      existingIds.add(d.id);
      const data = d.data();
      if (data?.title) existingTitles.add(data.title.toLowerCase().trim());
      if (data?.name) existingTitles.add(data.name.toLowerCase().trim());
    });

    for (const event of localEvents) {
      if (LEGACY_PREDEFINED_EVENT_IDS.includes(event.id)) continue;

      const eventTitle = (event.title || event.name || '').toLowerCase().trim();
      // Skip if event with same ID or same title already exists in Firestore
      if (existingIds.has(event.id) || (eventTitle && existingTitles.has(eventTitle))) {
        continue;
      }

      const eventToUpload = {
        ...event,
        organizerUid: event.organizerUid || currentUser?.uid || '',
        organizerEmail: event.organizerEmail || currentUser?.email || '',
        status: event.status || 'Active',
        createdAt: event.createdAt || Date.now(),
        updatedAt: Date.now(),
        migratedFromLocal: true
      };

      const clean = sanitizeForFirestore(eventToUpload);
      await setDoc(doc(db, EVENTS_COLLECTION, event.id), clean);
      existingIds.add(event.id);
      if (eventTitle) existingTitles.add(eventTitle);
      migratedCount += 1;
      console.info(`[GateApass Migration] Migrated local event "${event.title || event.id}" to Firestore.`);
    }
  } catch (err) {
    console.warn('[GateApass Migration] Could not migrate local events to Firestore:', err);
  } finally {
    isMigrating = false;
  }

  return { migrated: migratedCount };
}
