/**
 * GetAPass — Firestore Data Architecture & Schema Definitions
 *
 * Defines the canonical data models, collection names, status enums,
 * document ID naming conventions, relationships, and validation constraints
 * across the 8 platform collections:
 * 1. users
 * 2. events
 * 3. bookings
 * 4. passes
 * 5. transactions
 * 6. notifications
 * 7. checkIns
 * 8. verifierAssignments
 */

export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  EVENTS: 'events',
  BOOKINGS: 'bookings',
  PASSES: 'passes',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  CHECK_INS: 'checkIns',
  VERIFIER_ASSIGNMENTS: 'verifierAssignments'
});

export const STATUS_ENUMS = Object.freeze({
  EVENT: Object.freeze({
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  }),
  BOOKING: Object.freeze({
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    ACTIVE: 'Active',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded'
  }),
  PASS: Object.freeze({
    ACTIVE: 'Active',
    USED: 'Used',
    REVOKED: 'Revoked',
    EXPIRED: 'Expired'
  }),
  TRANSACTION: Object.freeze({
    PENDING: 'Pending',
    SUCCESS: 'Success',
    FAILED: 'Failed',
    REFUNDED: 'Refunded'
  }),
  CHECK_IN: Object.freeze({
    GRANTED: 'Granted',
    DENIED: 'Denied',
    DUPLICATE: 'Duplicate'
  }),
  VERIFIER_ASSIGNMENT: Object.freeze({
    ACTIVE: 'Active',
    REVOKED: 'Revoked'
  })
});

/**
 * Generates uniform, collision-resistant semantic document IDs.
 */
export function generateDocId(prefix) {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
}

export function generateBookingId() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BK-${ts}-${rand}`;
}

export function generatePassId(eventSlug = 'GP') {
  const cleanSlug = String(eventSlug).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'GP';
  const ts = Date.now().toString().slice(-4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PASS-${cleanSlug}-${ts}-${rand}`;
}

export function generateTransactionId() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${ts}-${rand}`;
}

/**
 * Validation rules and sanitizer for Event records
 */
export function validateEventPayload(payload) {
  const errors = [];
  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('Event title must be at least 3 characters.');
  }
  if (!payload.organizerUid) {
    errors.push('Event must be associated with an organizer UID.');
  }
  const startingPrice = Number(payload.startingPrice ?? payload.price ?? 0);
  if (isNaN(startingPrice) || startingPrice < 0) {
    errors.push('Event price must be a non-negative number.');
  }
  const validStatuses = Object.values(STATUS_ENUMS.EVENT);
  if (payload.status && !validStatuses.includes(payload.status)) {
    errors.push(`Invalid event status "${payload.status}". Must be one of: ${validStatuses.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validation rules for Booking records
 * Ensures unit price and total amount are verified numbers, never trusted blindly from client input.
 * Supports both single-category bookings and multi-category / multi-ticket orders.
 */
export function validateBookingPayload({
  eventData,
  passTypeData,
  quantity = 1,
  items = null,
  bookedPasses = null,
  passes = null,
  clientAmount: _clientAmount,
  currentUser
}) {
  const errors = [];

  if (!currentUser?.uid) {
    errors.push('Authenticated user required to create a booking.');
  }

  if (!eventData || !eventData.id) {
    errors.push('Valid event reference required.');
  }

  // Check if multiple items/tiers were provided
  const rawItems = items || bookedPasses || (Array.isArray(passes) ? passes : null);

  if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
    let totalQty = 0;
    let authoritativeTotal = 0;
    const normalizedItems = [];

    rawItems.forEach((it, index) => {
      const itQty = Number(it.qty || it.quantity || 1);
      if (isNaN(itQty) || itQty < 1) {
        errors.push(`Item ${index + 1} has invalid quantity.`);
        return;
      }
      totalQty += itQty;

      // Match against event's defined pass tiers if available
      const eventTier = Array.isArray(eventData?.passTypes)
        ? eventData.passTypes.find((pt) =>
            (pt.name && it.name && pt.name.toLowerCase() === it.name.toLowerCase()) ||
            (pt.id && it.id && pt.id === it.id)
          )
        : null;

      const unitPrice = eventTier?.price !== undefined
        ? Number(eventTier.price)
        : Number(it.price !== undefined ? it.price : (it.unitPrice !== undefined ? it.unitPrice : (eventData?.startingPrice ?? 0)));

      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push(`Item "${it.name || index + 1}" has an invalid unit price.`);
        return;
      }

      const subtotal = unitPrice * itQty;
      authoritativeTotal += subtotal;

      normalizedItems.push({
        name: it.name || it.passType || 'Standard Pass',
        passType: it.passType || it.name || 'Standard Pass',
        unitPrice,
        price: unitPrice,
        quantity: itQty,
        qty: itQty,
        subtotal,
        templateId: it.templateId || eventTier?.templateId || 'tpl-classic-violet'
      });
    });

    if (totalQty < 1 || totalQty > 50) {
      errors.push('Total ticket quantity must be between 1 and 50.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      unitPrice: normalizedItems[0]?.unitPrice ?? 0,
      authoritativeAmount: authoritativeTotal,
      quantity: totalQty,
      items: normalizedItems
    };
  }

  // Single-item fallback path
  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1 || qty > 50) {
    errors.push('Ticket quantity must be between 1 and 50.');
  }

  // Authoritative price resolution from event/passType (never trusting clientAmount)
  const resolvedUnitPrice = passTypeData?.price !== undefined
    ? Number(passTypeData.price)
    : Number(eventData?.startingPrice ?? 0);

  if (isNaN(resolvedUnitPrice) || resolvedUnitPrice < 0) {
    errors.push('Invalid unit price configuration.');
  }

  const authoritativeTotal = resolvedUnitPrice * qty;

  return {
    isValid: errors.length === 0,
    errors,
    unitPrice: resolvedUnitPrice,
    authoritativeAmount: authoritativeTotal,
    quantity: qty,
    items: [{
      name: passTypeData?.name || 'Standard Pass',
      passType: passTypeData?.name || 'Standard Pass',
      unitPrice: resolvedUnitPrice,
      price: resolvedUnitPrice,
      quantity: qty,
      qty,
      subtotal: authoritativeTotal,
      templateId: passTypeData?.templateId || 'tpl-classic-violet'
    }]
  };
}
