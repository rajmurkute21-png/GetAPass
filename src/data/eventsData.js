/**
 * GateApass — Persistent Events Data Layer (Firestore + Local Cache Synchronized)
 *
 * Provides real-time synchronization with Firebase Firestore as the persistent shared database
 * for cross-device visibility, with resilient local storage caching for immediate renders.
 */

import {
  EVENTS_STORAGE_KEY,
  getStoredLocalEvents,
  saveStoredLocalEvents,
  subscribeToEvents,
  fetchPublishedEvents,
  fetchEventById,
  createEvent,
  updateEvent as updateEventService,
  deleteEvent as deleteEventService,
  publishEvent,
  unpublishEvent,
  migrateLocalEventsToFirestore,
  canManageEvent,
  canCreateEvents,
  PUBLISHED_STATUSES,
  normalizeEventStatus,
  subscribeToOrganizerEvents,
  subscribeToAllEventsAdmin
} from '../services/eventService';
import { INITIAL_EVENTS } from './mockData';

export {
  EVENTS_STORAGE_KEY,
  subscribeToEvents,
  subscribeToOrganizerEvents,
  subscribeToAllEventsAdmin,
  fetchPublishedEvents,
  fetchEventById,
  createEvent,
  publishEvent,
  unpublishEvent,
  migrateLocalEventsToFirestore,
  canManageEvent,
  canCreateEvents,
  PUBLISHED_STATUSES,
  normalizeEventStatus
};

/**
 * Get all events as a persistent collection from local cache.
 * Provides instant, zero-delay synchronous access for views while Firestore syncs in the background.
 */
export function getAllEvents() {
  return getStoredLocalEvents();
}

/**
 * Get single event by immutable unique ID.
 */
export function getEventById(id) {
  if (!id) return null;
  const events = getAllEvents();
  return events.find((e) => e.id === id) || null;
}

/**
 * Create and persist a new event into both Firestore and local cache.
 * Returns the created event immediately while dispatching Firestore creation.
 */
export function saveEvent(eventData, currentUser = null) {
  if (!eventData) throw new Error('Event data is required.');

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
    createdAt: eventData.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // 1. Immediately update local cache for snappy UI
  const events = getAllEvents();
  const updatedEvents = [newEvent, ...events.filter((e) => e.id !== uniqueId)];
  saveStoredLocalEvents(updatedEvents);

  // 2. Persist to Firestore in the background
  createEvent(newEvent, currentUser).catch((err) => {
    console.error('[GateApass] Background Firestore sync failed for saveEvent:', err);
  });

  return newEvent;
}

/**
 * Update an existing event by ID in both local cache and Firestore.
 */
export function updateEvent(id, updates, currentUser = null) {
  if (!id) throw new Error('Event ID is required for update.');

  const events = getAllEvents();
  const exists = events.some((e) => e.id === id);

  if (!exists) {
    return saveEvent({ ...updates, id }, currentUser);
  }

  const updatedEvents = events.map((ev) => {
    if (ev.id === id) {
      const merged = { ...ev, ...updates, id, updatedAt: Date.now() };
      if (updates.name && !updates.title) merged.title = updates.name;
      if (updates.title && !updates.name) merged.name = updates.title;
      return merged;
    }
    return ev;
  });

  saveStoredLocalEvents(updatedEvents);

  // Background Firestore update
  updateEventService(id, updates, currentUser).catch((err) => {
    console.error('[GateApass] Background Firestore update failed for updateEvent:', err);
  });

  return updatedEvents.find((e) => e.id === id);
}

/**
 * Delete an event by ID from local cache and Firestore.
 */
export function deleteEvent(id, currentUser = null) {
  if (!id) return false;
  const events = getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  saveStoredLocalEvents(filtered);

  // Background Firestore deletion
  deleteEventService(id, currentUser).catch((err) => {
    console.error('[GateApass] Background Firestore delete failed for deleteEvent:', err);
  });

  return true;
}

/**
 * Reset events storage back to default initial seed.
 */
export function resetEvents() {
  const initialCopy = JSON.parse(JSON.stringify(INITIAL_EVENTS || []));
  saveStoredLocalEvents(initialCopy);
  return initialCopy;
}
