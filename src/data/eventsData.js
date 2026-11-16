/**
 * GateApass — Persistent Events Data Layer
 * Provides collection-based storage for events in localStorage (key: gateapass_events)
 * with robust memory fallback. Guarantees that adding or updating an event never
 * overwrites other events in the collection.
 */

import { INITIAL_EVENTS } from './mockData.js';

export const EVENTS_STORAGE_KEY = 'gateapass_events';

const LEGACY_PREDEFINED_EVENT_IDS = [
  'techfest-2026',
  'buildathon-2026',
  'ai-conf-2026',
  'devops-workshop',
  'waves-college-fest',
  'inter-sports-league'
];

// In-memory fallback if localStorage is unavailable
let memoryEvents = null;

function getStoredEventsRaw() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy predefined mock events if present
          const cleaned = parsed.filter((e) => !LEGACY_PREDEFINED_EVENT_IDS.includes(e?.id));
          if (cleaned.length !== parsed.length) {
            saveEventsToStorage(cleaned);
          }
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.warn('[GateApass] Could not read events from localStorage:', err);
  }

  if (memoryEvents && Array.isArray(memoryEvents)) {
    return memoryEvents;
  }

  // Initial seed from INITIAL_EVENTS (empty array)
  const initialCopy = JSON.parse(JSON.stringify(INITIAL_EVENTS || []));
  saveEventsToStorage(initialCopy);
  return initialCopy;
}

function saveEventsToStorage(eventsArray) {
  if (!Array.isArray(eventsArray)) {
    console.error('[GateApass] saveEventsToStorage requires an array, received:', typeof eventsArray);
    return;
  }
  memoryEvents = eventsArray;
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
 * Get all events as a persistent collection
 */
export function getAllEvents() {
  return getStoredEventsRaw();
}

/**
 * Get single event by immutable unique ID
 */
export function getEventById(id) {
  if (!id) return null;
  const events = getAllEvents();
  return events.find((e) => e.id === id) || null;
}

/**
 * Create and persist a new event into the collection.
 * Appends or prepends to the collection without overwriting existing events.
 */
export function saveEvent(eventData) {
  if (!eventData) throw new Error('Event data is required.');

  const events = getAllEvents();
  const uniqueId = eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Ensure title / name compatibility
  const title = eventData.title || eventData.name || 'Untitled Event';

  const newEvent = {
    ...eventData,
    id: uniqueId,
    title,
    name: title,
    status: eventData.status || 'Active',
    createdAt: eventData.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // Prepend new event so it shows at the top of lists
  const updatedEvents = [newEvent, ...events.filter((e) => e.id !== uniqueId)];
  saveEventsToStorage(updatedEvents);

  return newEvent;
}

/**
 * Update an existing event by ID.
 * Strictly isolates mutations to the matching event.
 */
export function updateEvent(id, updates) {
  if (!id) throw new Error('Event ID is required for update.');

  const events = getAllEvents();
  const exists = events.some((e) => e.id === id);

  if (!exists) {
    // If not found, treat as save
    return saveEvent({ ...updates, id });
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

  saveEventsToStorage(updatedEvents);
  return updatedEvents.find((e) => e.id === id);
}

/**
 * Delete an event by ID
 */
export function deleteEvent(id) {
  if (!id) return false;
  const events = getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  saveEventsToStorage(filtered);
  return true;
}

/**
 * Reset events storage back to default initial seed
 */
export function resetEvents() {
  const initialCopy = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  saveEventsToStorage(initialCopy);
  return initialCopy;
}
