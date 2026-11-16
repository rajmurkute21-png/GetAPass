/**
 * GetApass — Pass & Event Authorization Service
 *
 * Enforces role-based security boundaries for Pass Studio, Event Management,
 * and Administrative Operations.
 *
 * Security Principles:
 * - Server-enforced roles ('admin', 'organizer', 'participant').
 * - Regular participants cannot create, edit, or delete events or templates.
 * - Turnstile verifiers only hold check-in permissions.
 * - Event organizers can only manage events they own.
 * - Global administrators can manage any event or template.
 */

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
 * Checks whether an actor is authorized to create campus events.
 */
export function canCreateEvents(user) {
  if (!user) return false;
  return Boolean(user.role === 'admin' || user.role === 'organizer' || user.isAdmin || user.isOrganizer);
}

/**
 * Checks whether an actor is authorized to manage (edit/delete/publish) a specific event.
 */
export function canManageEvents(user, event = null) {
  if (!user) return false;

  // Administrators have full access
  if (user.role === 'admin' || user.isAdmin) {
    return true;
  }

  // Organizers can only manage events they own
  if (user.role === 'organizer' || user.isOrganizer) {
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
 * Checks whether an actor is authorized to perform a pass management action.
 */
export function checkPassPermission(user, permission, _context = {}) {
  if (!user) return false;

  // Administrators and Organizers hold full pass template management rights
  if (user.role === 'admin' || user.isAdmin) return true;
  if (user.role === 'organizer' || user.isOrganizer) return true;

  // Optical turnstile verifiers can change check-in authority only if explicitly assigned
  if (user.role === 'verifier' && permission === PASS_PERMISSIONS.CHANGE_PASS_AUTHORITY) {
    return true;
  }

  // Regular participants are denied
  return false;
}

export function canAccessPassStudio(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.MANAGE_PASS_TEMPLATES);
}

export function canPublishPassTemplate(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.PUBLISH_PASS_TEMPLATE);
}

/**
 * Verified role-based dashboard access guards
 */
export function canAccessAdminDashboard(user) {
  if (!user) return false;
  return Boolean(user.role === 'admin' || user.isAdmin);
}

export function canAccessOrganizerDashboard(user) {
  if (!user) return false;
  return Boolean(user.role === 'organizer' || user.role === 'admin' || user.isOrganizer || user.isAdmin);
}

export function isParticipantOnly(user) {
  if (!user) return true;
  return Boolean((user.role === 'participant' || !user.role) && !user.isAdmin && !user.isOrganizer);
}
