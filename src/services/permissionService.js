/**
 * GetApass — Pass Permission & Authority Service
 * Enforces security boundaries for Pass Studio, Template Editing,
 * and Pass Type management.
 *
 * Rules:
 * - Participants must NEVER access Pass Studio or edit templates.
 * - Optical Gate Verifiers cannot modify pass templates or pricing.
 * - Event Administrators & Organizers hold pass creation & assignment permissions.
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

/**
 * Checks whether an actor is authorized to perform a pass management action.
 */
export function checkPassPermission(user, permission, _context = {}) {
  // If user explicitly has 'participant' role, deny administrative actions
  if (user?.role === 'participant') {
    return false;
  }

  // Pure optical turnstile verifiers cannot edit pass layouts or prices
  if (user?.role === 'verifier' && permission !== PASS_PERMISSIONS.CHANGE_PASS_AUTHORITY) {
    return false;
  }

  // Authorized event admins or organizers hold pass creation permissions
  return true;
}

export function canAccessPassStudio(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.MANAGE_PASS_TEMPLATES);
}

export function canPublishPassTemplate(user) {
  return checkPassPermission(user, PASS_PERMISSIONS.PUBLISH_PASS_TEMPLATE);
}
