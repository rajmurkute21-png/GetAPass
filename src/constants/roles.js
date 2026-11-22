/**
 * GetApass — Centralized Role & Permission Constants
 *
 * Defines the 4 immutable platform roles and their granular capabilities:
 * 1. 'admin'        - Platform-wide administration and role management
 * 2. 'organizer'    - Creation and management of own events and bookings
 * 3. 'verifier'     - Turnstile pass validation and check-in for assigned events
 * 4. 'participant'  - Event discovery, pass booking, and personal management
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  VERIFIER: 'verifier',
  PARTICIPANT: 'participant'
});

export const ALL_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.ORGANIZER,
  ROLES.VERIFIER,
  ROLES.PARTICIPANT
]);

export const PERMISSIONS = Object.freeze({
  // Platform & Role Management (Admin only)
  MANAGE_PLATFORM: 'manage_platform',
  ASSIGN_ROLES: 'assign_roles',
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_ALL_EVENTS: 'view_all_events',
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',

  // Event & Pass Management (Organizer & Admin)
  CREATE_EVENT: 'create_event',
  MANAGE_OWN_EVENTS: 'manage_own_events',
  VIEW_EVENT_ATTENDEES: 'view_event_attendees',
  ASSIGN_EVENT_VERIFIER: 'assign_event_verifier',
  MANAGE_PASS_TEMPLATES: 'manage_pass_templates',

  // Pass Verification (Verifier, Organizer & Admin)
  ACCESS_ASSIGNED_EVENTS: 'access_assigned_events',
  VALIDATE_PASSES: 'validate_passes',
  CHECKIN_ATTENDEE: 'checkin_attendee',

  // Participant Capabilities (All Authenticated Users)
  DISCOVER_EVENTS: 'discover_events',
  BOOK_TICKETS: 'book_tickets',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  MANAGE_OWN_PROFILE: 'manage_own_profile'
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_PLATFORM,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.VIEW_ALL_EVENTS,
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.VIEW_PLATFORM_ANALYTICS,
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.MANAGE_OWN_EVENTS,
    PERMISSIONS.VIEW_EVENT_ATTENDEES,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.ASSIGN_EVENT_VERIFIER,
    PERMISSIONS.MANAGE_PASS_TEMPLATES,
    PERMISSIONS.ACCESS_ASSIGNED_EVENTS,
    PERMISSIONS.VALIDATE_PASSES,
    PERMISSIONS.CHECKIN_ATTENDEE,
    PERMISSIONS.DISCOVER_EVENTS,
    PERMISSIONS.BOOK_TICKETS,
    PERMISSIONS.MANAGE_OWN_PROFILE
  ],
  [ROLES.ORGANIZER]: [
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.MANAGE_OWN_EVENTS,
    PERMISSIONS.VIEW_EVENT_ATTENDEES,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.ASSIGN_EVENT_VERIFIER,
    PERMISSIONS.MANAGE_PASS_TEMPLATES,
    PERMISSIONS.ACCESS_ASSIGNED_EVENTS,
    PERMISSIONS.VALIDATE_PASSES,
    PERMISSIONS.CHECKIN_ATTENDEE,
    PERMISSIONS.DISCOVER_EVENTS,
    PERMISSIONS.BOOK_TICKETS,
    PERMISSIONS.MANAGE_OWN_PROFILE
  ],
  [ROLES.VERIFIER]: [
    PERMISSIONS.ACCESS_ASSIGNED_EVENTS,
    PERMISSIONS.VALIDATE_PASSES,
    PERMISSIONS.CHECKIN_ATTENDEE,
    PERMISSIONS.DISCOVER_EVENTS,
    PERMISSIONS.BOOK_TICKETS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_PROFILE
  ],
  [ROLES.PARTICIPANT]: [
    PERMISSIONS.DISCOVER_EVENTS,
    PERMISSIONS.BOOK_TICKETS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_PROFILE
  ]
});

/**
 * Human-readable role labels and badges
 */
export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Platform Administrator',
  [ROLES.ORGANIZER]: 'Event Organizer',
  [ROLES.VERIFIER]: 'Gate Verifier',
  [ROLES.PARTICIPANT]: 'Participant'
});
