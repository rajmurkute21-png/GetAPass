/**
 * GetApass — Pass Types & Event Pass Tier Configurations
 * Connects events to multiple pass types, access permissions, default authorities,
 * and specific pass templates with version tracking.
 */

const PASS_TYPES_STORAGE_KEY = 'gateapass_event_pass_types_v1';

/**
 * Initial Event Pass Types mapped to system templates
 */
export const INITIAL_EVENT_PASS_TYPES = [];

const memoryPassTypesStore = {};

function getStoredPassTypes() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(PASS_TYPES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If stored contains legacy predefined events, filter them out
          const cleaned = parsed.filter(
            (pt) => pt.eventId !== 'techfest-2026' && pt.eventId !== 'buildathon-2026'
          );
          if (cleaned.length !== parsed.length) {
            setStoredPassTypes(cleaned);
          }
          return cleaned;
        }
      }
    } else if (memoryPassTypesStore[PASS_TYPES_STORAGE_KEY]) {
      return JSON.parse(memoryPassTypesStore[PASS_TYPES_STORAGE_KEY]);
    }
  } catch {
    // fallback
  }
  return null;
}

function setStoredPassTypes(data) {
  const json = JSON.stringify(data);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PASS_TYPES_STORAGE_KEY, json);
    } else {
      memoryPassTypesStore[PASS_TYPES_STORAGE_KEY] = json;
    }
  } catch {
    // ignore
  }
}

/**
 * Retrieve all pass types across events
 */
export function getAllPassTypes() {
  const stored = getStoredPassTypes();
  return stored || INITIAL_EVENT_PASS_TYPES;
}

/**
 * Get pass types belonging to a specific event
 */
export function getPassTypesByEvent(eventId) {
  const all = getAllPassTypes();
  return all.filter((pt) => pt.eventId === eventId);
}

/**
 * Get single pass type by ID
 */
export function getPassTypeById(passTypeId) {
  const all = getAllPassTypes();
  return all.find((pt) => pt.id === passTypeId) || null;
}

/**
 * Save / Create / Update a pass type
 */
export function savePassType(passType) {
  if (!passType || !passType.name || !passType.eventId) {
    throw new Error('Pass type requires a valid name and event ID.');
  }

  const all = getAllPassTypes();
  let updated;

  if (passType.id && all.some((pt) => pt.id === passType.id)) {
    updated = all.map((pt) => (pt.id === passType.id ? { ...pt, ...passType, updatedAt: Date.now() } : pt));
  } else {
    const newPt = {
      ...passType,
      id: passType.id || `pt-${Date.now()}`,
      soldCount: passType.soldCount || 0,
      status: passType.status || 'Active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    updated = [newPt, ...all];
  }

  setStoredPassTypes(updated);
  return passType;
}

/**
 * Delete a pass type
 */
export function deletePassType(passTypeId) {
  const all = getAllPassTypes();
  const filtered = all.filter((pt) => pt.id !== passTypeId);
  setStoredPassTypes(filtered);
  return true;
}

/**
 * Assign a template to a pass type
 */
export function assignTemplateToPassType(passTypeId, templateId, templateVersion = 1) {
  const all = getAllPassTypes();
  const updated = all.map((pt) => {
    if (pt.id === passTypeId) {
      return {
        ...pt,
        templateId,
        templateVersion,
        updatedAt: Date.now()
      };
    }
    return pt;
  });
  setStoredPassTypes(updated);
  return true;
}
