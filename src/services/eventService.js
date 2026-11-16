import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { INITIAL_EVENTS } from '../data/mockData';
import { savePassType } from '../data/passTypes';

export const EVENTS_COLLECTION = 'events';
export const EVENTS_STORAGE_KEY = 'gateapass_events';

export const PUBLISHED_STATUSES = ['Active', 'Published'];

/**
 * Standardizes event status to canonical 'Active', 'Published', or 'Draft'.
 */
export function normalizeEventStatus(status) {
  if (!status) return 'Active';
  const s = String(status).trim().toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'published') return 'Published';
  return 'Active';
}

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
 * Maps Firestore errors to user-actionable messages.
 */
export function mapFirestoreError(error) {
  if (!error) return 'An unexpected database error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Permission Denied: Only authorized organizers or administrators can create, edit, or publish events. In the Firebase Console (Firestore Database > "users" collection), please set your user document\'s "role" field to "organizer" or "admin".';
  }
  if (code === 'unavailable' || message.includes('offline')) {
    return 'The database is currently unreachable. Changes are saved to your local offline cache.';
  }
  return message || 'Database request failed. Please check your network connection.';
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
 * Checks whether an actor is authorized to create events.
 * Enforces server-verified role: admin or organizer.
 */
export function canCreateEvents(currentUser) {
  if (!currentUser) return false;
  return Boolean(currentUser.role === 'admin' || currentUser.role === 'organizer' || currentUser.isAdmin || currentUser.isOrganizer);
}

/**
 * Checks whether an actor is authorized to manage (edit/delete/publish) an event.
 * Enforces UID-based ownership check.
 */
export function canManageEvent(currentUser, event) {
  if (!currentUser) return false;

  // Administrators have full access
  if (currentUser.role === 'admin' || currentUser.isAdmin) {
    return true;
  }

  // Organizers can manage events they own (strictly based on Firebase UID)
  if (currentUser.role === 'organizer' || currentUser.isOrganizer) {
    if (!event) return true;
    if (event.organizerUid && currentUser.uid) {
      return event.organizerUid === currentUser.uid;
    }
    return !event.organizerUid;
  }

  return false;
}

/**
 * Subscribes in real-time to Firestore events.
 *
 * Query-Rule Alignment (RULES ARE NOT FILTERS):
 * - Published events query uses `where('status', 'in', ['Active', 'Published'])`
 *   which exactly satisfies `resource.data.status in ['Active', 'Published']`.
 * - Organizers additionally query their own drafts using `where('organizerUid', '==', uid), where('status', '==', 'Draft')`
 *   which exactly satisfies `resource.data.organizerUid == request.auth.uid`.
 * - Admins query the full collection which satisfies `isAdmin()`.
 */
export function subscribeToEvents(onEventsUpdate, onError, currentUser = null) {
  if (!db) {
    const local = getStoredLocalEvents();
    if (onEventsUpdate) onEventsUpdate(local);
    return () => {};
  }

  // Resolve the active authenticated user
  const activeUser = (currentUser && currentUser.uid)
    ? currentUser
    : (auth?.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || '',
        role: 'participant'
      } : null);

  const userId = activeUser?.uid;
  const isAdminUser = Boolean(activeUser?.role === 'admin' || activeUser?.isAdmin);
  const isOrganizerUser = Boolean(activeUser?.role === 'organizer' || activeUser?.isOrganizer);

  // Diagnostic logging (Requirement 5)
  console.log('[GateApass Sync] Initializing subscribeToEvents:', {
    hasActiveUser: Boolean(activeUser),
    uid: userId || '(unauthenticated)',
    role: activeUser?.role || '(none)',
    isAdmin: isAdminUser,
    isOrganizer: isOrganizerUser
  });

  // If there is no authenticated user, do not execute a Firestore query that will fail rules
  if (!userId) {
    console.log('[GateApass Sync] User is not authenticated yet. Returning cached events.');
    const local = getStoredLocalEvents();
    if (onEventsUpdate) onEventsUpdate(local);

    // Attach an auth listener so if auth restores shortly, we auto-subscribe
    if (auth) {
      let activeChildUnsub = null;
      const unsubAuth = onAuthStateChanged(auth, (rawUser) => {
        if (rawUser) {
          console.log('[GateApass Sync] Auth state became active in fallback listener for:', rawUser.uid);
          unsubAuth();
          activeChildUnsub = subscribeToEvents(onEventsUpdate, onError, {
            uid: rawUser.uid,
            email: rawUser.email || '',
            role: 'participant'
          });
        }
      });
      return () => {
        unsubAuth();
        if (activeChildUnsub) activeChildUnsub();
      };
    }
    return () => {};
  }

  try {
    let publishedEvents = [];
    let userDrafts = [];

    const notifyCombined = () => {
      const mergedMap = new Map();
      publishedEvents.forEach((ev) => mergedMap.set(ev.id, ev));
      userDrafts.forEach((ev) => mergedMap.set(ev.id, ev));

      const combined = Array.from(mergedMap.values());
      combined.sort((a, b) => {
        const timeA = a.createdAt || a.updatedAt || 0;
        const timeB = b.createdAt || b.updatedAt || 0;
        return timeB - timeA;
      });

      // Sync embedded pass types
      combined.forEach((ev) => {
        if (Array.isArray(ev.passTypes) && ev.passTypes.length > 0) {
          ev.passTypes.forEach((pt) => {
            try { savePassType(pt); } catch {}
          });
        }
      });

      saveStoredLocalEvents(combined);
      if (onEventsUpdate) onEventsUpdate(combined);
    };

    const unsubscribers = [];

    if (isAdminUser) {
      // Diagnostic log (Requirement 5)
      console.log('[GateApass Sync] Executing query: collection("events") [Admin full collection]');
      const q = collection(db, EVENTS_COLLECTION);
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          publishedEvents = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
              publishedEvents.push({
                ...data,
                id: docSnap.id,
                title: data.title || data.name || 'Untitled Event',
                name: data.title || data.name || 'Untitled Event',
                status: data.status || 'Active'
              });
            }
          });
          console.log(`[GateApass Sync] Admin snapshot: ${publishedEvents.length} event(s) received from Firestore.`);
          notifyCombined();
        },
        (error) => {
          console.error('[GateApass Sync] Admin Firestore listener error:', {
            code: error.code || 'unknown',
            message: error.message
          });
          if (onError) onError(error);
        }
      );
      unsubscribers.push(unsub);
    } else {
      // Diagnostic log (Requirement 5): Query for all participants & organizers
      console.log('[GateApass Sync] Executing query: query(collection("events"), where("status", "in", ["Active", "Published"]))');
      const publishedQ = query(
        collection(db, EVENTS_COLLECTION),
        where('status', 'in', PUBLISHED_STATUSES)
      );

      const unsubPublished = onSnapshot(
        publishedQ,
        (snapshot) => {
          publishedEvents = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
              publishedEvents.push({
                ...data,
                id: docSnap.id,
                title: data.title || data.name || 'Untitled Event',
                name: data.title || data.name || 'Untitled Event',
                status: data.status || 'Active'
              });
            }
          });
          console.log(`[GateApass Sync] Published snapshot: ${publishedEvents.length} published event(s) received from Firestore.`);
          notifyCombined();
        },
        (error) => {
          console.error('[GateApass Sync] Published events listener error:', {
            code: error.code || 'unknown',
            message: error.message
          });
          if (onError) onError(error);
        }
      );
      unsubscribers.push(unsubPublished);

      // Personal drafts query for organizers
      if (isOrganizerUser && userId) {
        console.log(`[GateApass Sync] Executing drafts query for organizer UID: ${userId}`);
        const draftsQ = query(
          collection(db, EVENTS_COLLECTION),
          where('organizerUid', '==', userId),
          where('status', '==', 'Draft')
        );

        const unsubDrafts = onSnapshot(
          draftsQ,
          (snapshot) => {
            userDrafts = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
                userDrafts.push({
                  ...data,
                  id: docSnap.id,
                  title: data.title || data.name || 'Untitled Event',
                  name: data.title || data.name || 'Untitled Event',
                  status: 'Draft'
                });
              }
            });
            console.log(`[GateApass Sync] Organizer drafts snapshot: ${userDrafts.length} draft(s) received.`);
            notifyCombined();
          },
          (error) => {
            console.warn('[GateApass Sync] Drafts listener error:', {
              code: error.code || 'unknown',
              message: error.message
            });
          }
        );
        unsubscribers.push(unsubDrafts);
      }
    }

    console.log('[GateApass Sync] Subscription established successfully for UID:', userId);

    return () => {
      console.log('[GateApass Sync] Unsubscribing listeners for UID:', userId);
      unsubscribers.forEach((fn) => fn());
    };
  } catch (err) {
    console.error('[GateApass Sync] Failed to establish Firestore snapshot listener:', {
      code: err.code || 'unknown',
      message: err.message
    });
    if (onError) onError(err);
    const local = getStoredLocalEvents();
    if (onEventsUpdate) onEventsUpdate(local);
    return () => {};
  }
}

/**
 * Fetches all published events from Firestore.
 * Query uses `where('status', 'in', ['Active', 'Published'])` to comply with security rules.
 */
export async function fetchPublishedEvents() {
  if (!db) {
    return getStoredLocalEvents();
  }

  try {
    console.log('[GateApass Sync] fetchPublishedEvents executing: where("status", "in", ["Active", "Published"])');
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', 'in', PUBLISHED_STATUSES)
    );
    const snapshot = await getDocs(q);
    const events = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!LEGACY_PREDEFINED_EVENT_IDS.includes(docSnap.id)) {
        events.push({
          ...data,
          id: docSnap.id,
          title: data.title || data.name || 'Untitled Event',
          name: data.title || data.name || 'Untitled Event',
          status: data.status || 'Active'
        });
      }
    });

    events.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    console.log(`[GateApass Sync] fetchPublishedEvents returned ${events.length} event(s).`);
    saveStoredLocalEvents(events);
    return events;
  } catch (err) {
    console.error('[GateApass Sync] Error fetching published events from Firestore:', {
      code: err.code || 'unknown',
      message: err.message
    });
    return getStoredLocalEvents();
  }
}

/**
 * Fetches single event details by immutable unique ID from Firestore with local fallback.
 */
export async function fetchEventById(id) {
  if (!id) return null;

  const localList = getStoredLocalEvents();
  const cached = localList.find((e) => e.id === id);

  if (!db) {
    return cached || null;
  }

  try {
    const docRef = doc(db, EVENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const resolved = {
        ...data,
        id: docSnap.id,
        title: data.title || data.name || 'Untitled Event',
        name: data.title || data.name || 'Untitled Event',
        status: data.status || 'Active'
      };

      const updatedLocal = localList.map((e) => (e.id === id ? resolved : e));
      if (!localList.some((e) => e.id === id)) updatedLocal.push(resolved);
      saveStoredLocalEvents(updatedLocal);

      return resolved;
    }
    return cached || null;
  } catch (err) {
    console.warn(`[GateApass] Could not fetch event ${id} from Firestore:`, err);
    return cached || null;
  }
}

/**
 * Creates an event in Firebase Firestore and updates local cache.
 * Enforces organizer/admin privileges and binds organizerUid to currentUser.uid.
 */
export async function createEvent(eventData, currentUser) {
  if (!eventData) throw new Error('Event data is required.');

  if (currentUser && !canCreateEvents(currentUser)) {
    throw new Error(
      'Authorization Required: Only authorized organizers or administrators can create campus events. Please contact the administrator to grant organizer privileges.'
    );
  }

  const uniqueId = eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = eventData.title || eventData.name || 'Untitled Event';

  const newEvent = {
    ...eventData,
    id: uniqueId,
    title,
    name: title,
    status: normalizeEventStatus(eventData.status),
    organizerUid: currentUser?.uid || eventData.organizerUid || '',
    organizerEmail: currentUser?.email || eventData.organizerEmail || '',
    organizerName: eventData.organizerName || currentUser?.displayName || 'Event Organizer',
    createdAt: eventData.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // 1. Immediately persist to local cache for instant UI response
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
      throw new Error(mapFirestoreError(firestoreError));
    }
  } else {
    console.warn('[GateApass] Firestore is not configured. Event saved to local cache only.');
  }

  return newEvent;
}

/**
 * Updates an existing event in Firestore and local cache.
 * Restricts mutations to event owner (UID match) or administrator.
 */
export async function updateEvent(id, updates, currentUser) {
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
    status: updates.status ? normalizeEventStatus(updates.status) : (existingEvent?.status || 'Active'),
    organizerUid: existingEvent?.organizerUid || currentUser?.uid || '',
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
      throw new Error(mapFirestoreError(err));
    }
  }

  return mergedEvent;
}

/**
 * Deletes an event from Firestore and local cache.
 * Restricts deletion to event owner (UID match) or administrator.
 */
export async function deleteEvent(id, currentUser) {
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
      throw new Error(mapFirestoreError(err));
    }
  }

  return true;
}

/**
 * Publishes an event (sets status to 'Active').
 */
export async function publishEvent(id, currentUser) {
  return updateEvent(id, { status: 'Active' }, currentUser);
}

/**
 * Unpublishes an event (sets status to 'Draft').
 */
export async function unpublishEvent(id, currentUser) {
  return updateEvent(id, { status: 'Draft' }, currentUser);
}

/**
 * Safe migration mechanism: transfers existing local events into Firestore without creating duplicates.
 * Preserves local events in localStorage.
 * Only runs if the current user has authorized organizer/admin privileges.
 */
export async function migrateLocalEventsToFirestore(currentUser) {
  if (!db || isMigrating) return { migrated: 0 };

  // Only authorized organizers or admins are permitted by security rules to write to Firestore
  if (!canCreateEvents(currentUser)) {
    return { migrated: 0, reason: 'Participant role cannot create events' };
  }

  const localEvents = getStoredLocalEvents();
  if (!localEvents || localEvents.length === 0) {
    return { migrated: 0 };
  }

  isMigrating = true;
  let migratedCount = 0;

  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', 'in', PUBLISHED_STATUSES)
    );
    const snapshot = await getDocs(q);
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
      if (existingIds.has(event.id) || (eventTitle && existingTitles.has(eventTitle))) {
        continue;
      }

      // Security rule requires request.resource.data.organizerUid == request.auth.uid
      const eventToUpload = {
        ...event,
        organizerUid: currentUser?.uid || '',
        organizerEmail: currentUser?.email || event.organizerEmail || '',
        status: event.status === 'Draft' ? 'Draft' : 'Active',
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

// Aliases for compatibility
export const createEventInFirestore = createEvent;
export const updateEventInFirestore = updateEvent;
export const deleteEventFromFirestore = deleteEvent;
export const fetchEventByIdFromFirestore = fetchEventById;
