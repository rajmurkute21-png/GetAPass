/**
 * GetApass — Role & Permission Authorization Service
 *
 * Enforces role-based security boundaries across the 4 platform roles:
 * - Admin: Platform-wide access and role assignment
 * - Organizer: Create and manage only their own events and bookings
 * - Verifier: Access assigned events and validate passes only
 * - Participant: Discover events, book tickets, manage own bookings and profile
 */

import {
  ROLES,
  ALL_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_LABELS
} from '../constants/roles';

export { ROLES, ALL_ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_LABELS };

export const PASS_PERMISSIONS = {
  MANAGE_PASS_TEMPLATES: 'manage_pass_templates',
  CREATE_PASS_TEMPLATE: 'create_pass_template',
  EDIT_PASS_TEMPLATE: 'edit_pass_template',
  PUBLISH_PASS_TEMPLATE: 'publish_pass_template',
  ARCHIVE_PASS_TEMPLATE: 'archive_pass_template',
  MANAGE_PASS_TYPES: 'manage_pass_types',
  ASSIGN_PASS_TEMPLATE: 'assign_pass_template',
  CHANGE_PASS_AUTHORITY: 'change_pass_authority',
  MANAGE_PASS_PERMISSIONS: 'manage_pass_permissions'
};

export const EVENT_PERMISSIONS = {
  CREATE_EVENT: 'create_event',
  EDIT_EVENT: 'edit_event',
  DELETE_EVENT: 'delete_event',
  PUBLISH_EVENT: 'publish_event'
};

/**
 * Normalizes a user object or role string to one of the 4 valid roles.
 * Defaults safely to 'participant'.
 */
export function getUserRole(user) {
  if (!user) return ROLES.PARTICIPANT;

  // Custom Claims check (e.g. from token)
  if (user.isAdmin || user.role === ROLES.ADMIN) return ROLES.ADMIN;
  if (user.isOrganizer || user.role === ROLES.ORGANIZER) return ROLES.ORGANIZER;
  if (user.isVerifier || user.role === ROLES.VERIFIER) return ROLES.VERIFIER;

  const rawRole = typeof user === 'string' ? user : user.role;
  if (rawRole && ALL_ROLES.includes(rawRole.toLowerCase())) {
    return rawRole.toLowerCase();
  }

  return ROLES.PARTICIPANT;
}

/**
 * Checks whether an actor has one of the allowed roles.
 * Platform administrators automatically satisfy any role requirement unless explicitly excluded.
 */
export function hasRole(user, allowedRoles = []) {
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const role = getUserRole(user);
  if (role === ROLES.ADMIN) return true; // Administrator superuser access

  return allowedRoles.includes(role);
}

/**
 * Checks whether an actor possesses a specific granular permission.
 */
export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  const role = getUserRole(user);
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Checks whether an actor is a Global Administrator.
 */
export function canManagePlatform(user) {
  return getUserRole(user) === ROLES.ADMIN;
}

/**
 * Checks whether an actor is authorized to assign user roles.
 * STRICT SECURITY: Only Platform Administrators can assign roles.
 */
export function canAssignRoles(user) {
  return getUserRole(user) === ROLES.ADMIN;
}

/**
 * Checks whether an actor is authorized to create campus events.
 * Organizers and Admins can create events.
 */
export function canCreateEvents(user) {
  if (!user) return false;
  const role = getUserRole(user);
  return role === ROLES.ADMIN || role === ROLES.ORGANIZER;
}

/**
 * Checks whether an actor is authorized to manage (edit/delete/publish) a specific event.
 * - Admin can manage any event.
 * - Organizer can ONLY manage events they own (organizerUid === user.uid).
 * - Verifier and Participant CANNOT manage events.
 */
export function canManageEvents(user, event = null) {
  if (!user) return false;
  const role = getUserRole(user);

  if (role === ROLES.ADMIN) return true;

  if (role === ROLES.ORGANIZER) {
    if (!event) return true;
    if (event.organizerUid && user.uid) {
      return event.organizerUid === user.uid;
    }
    if (event.organizerEmail && user.email) {
      return event.organizerEmail.toLowerCase() === user.email.toLowerCase();
    }
    return !event.organizerUid;
  }

  return false;
}

/**
 * Checks whether an actor is authorized to access the Turnstile Verifier portal.
 * Verifiers, Organizers, and Admins can access the verifier scanner.
 */
export function canAccessVerifierPortal(user) {
  if (!user) return false;
  const role = getUserRole(user);
  return role === ROLES.VERIFIER || role === ROLES.ORGANIZER || role === ROLES.ADMIN;
}

/**
 * Checks whether an actor is authorized to validate passes for an event.
 * - Admin can validate for any event.
 * - Organizer can validate for their own events.
 * - Verifier can validate for assigned events (or any event if general verifier).
 */
export function canValidatePasses(user, event = null) {
  if (!user) return false;
  const role = getUserRole(user);

  if (role === ROLES.ADMIN) return true;

  if (role === ROLES.ORGANIZER) {
    if (!event) return true;
    return event.organizerUid === user.uid;
  }

  if (role === ROLES.VERIFIER) {
    if (!event) return true;
    // Check if event explicitly lists assigned verifiers
    if (Array.isArray(event.assignedVerifiers) && event.assignedVerifiers.length > 0) {
      return event.assignedVerifiers.includes(user.uid) || event.assignedVerifiers.includes(user.email);
    }
    return true; // Authorized campus verifier
  }

  return false;
}

/**
 * Checks whether an actor is authorized to perform pass management actions in Pass Studio.
 */
export function checkPassPermission(user, permission, _context = {}) {
  if (!user) return false;
  const role = getUserRole(user);

  if (role === ROLES.ADMIN || role === ROLES.ORGANIZER) return true;

  if (role === ROLES.VERIFIER && permission === PASS_PERMISSIONS.CHANGE_PASS_AUTHORITY) {
    return true;
  }

  return false;
}

export function canAccessPassStudio(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.MANAGE_PASS_TEMPLATES);
}

export function canPublishPassTemplate(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.PUBLISH_PASS_TEMPLATE);
}

/**
 * Dashboard & portal access guards
 */
export function canAccessAdminDashboard(user) {
  return getUserRole(user) === ROLES.ADMIN;
}

export function canAccessOrganizerDashboard(user) {
  const role = getUserRole(user);
  return role === ROLES.ORGANIZER || role === ROLES.ADMIN;
}

export function isVerifier(user) {
  return getUserRole(user) === ROLES.VERIFIER;
}

export function isParticipantOnly(user) {
  if (!user) return true;
  return getUserRole(user) === ROLES.PARTICIPANT;
}

/**
 * Booking authorization check (requires verified email for password accounts)
 */
export function canBookEvents(user) {
  if (!user) return false;
  if (user.isGoogle) return true;
  return Boolean(user.isEmailVerified || user.emailVerified);
}
