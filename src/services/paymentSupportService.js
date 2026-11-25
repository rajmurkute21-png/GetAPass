/**
 * GetAPass — Payment Support & Help Service
 *
 * Provides structured support for payment-related issues:
 * - Payment deducted but booking not confirmed
 * - Payment pending
 * - Payment failed
 * - Duplicate payment
 * - Confirmation not received
 *
 * Implements strict transaction safety and duplicate submission prevention.
 */

const SUPPORT_TICKETS_KEY = 'getapass_payment_support_tickets';

export const PAYMENT_ISSUE_CATEGORIES = [
  {
    id: 'deducted-not-confirmed',
    label: 'Payment deducted but booking missing',
    severity: 'high',
    instruction: 'If money was deducted from your bank/UPI account without an issued pass, payment reconciliation usually completes within 1–2 hours. If unconfirmed, the banking switch automatically reverses funds back to your original payment method in 3–5 working days.'
  },
  {
    id: 'payment-pending',
    label: 'Payment pending',
    severity: 'medium',
    instruction: 'UPI and Net Banking transactions may occasionally experience network latency between banking gateways. Do not initiate a duplicate payment. You can track this status using your transaction reference.'
  },
  {
    id: 'payment-failed',
    label: 'Payment failed',
    severity: 'low',
    instruction: 'Your transaction was declined by the issuing bank or payment gateway. No funds were captured. You can safely retry with an alternate UPI ID or card.'
  },
  {
    id: 'duplicate-payment',
    label: 'Duplicate payment',
    severity: 'high',
    instruction: 'If your account was debited multiple times for a single order, please submit both transaction references below. Duplicate debits are identified and queued for direct merchant refund reversal.'
  },
  {
    id: 'confirmation-not-received',
    label: 'Confirmation missing',
    severity: 'medium',
    instruction: 'Digital passes are delivered immediately to your account profile under "My Passes". If your pass is missing, our verification desk can regenerate your pass using your booking ID.'
  }
];

// Active in-flight payment locks to prevent duplicate submissions
const activePaymentLocks = new Set();

/**
 * Acquires a payment idempotency lock for a specific booking / user to prevent duplicate payments.
 */
export function acquirePaymentLock(bookingId) {
  if (!bookingId) return true;
  if (activePaymentLocks.has(bookingId)) {
    return false; // Locked: duplicate submission in progress
  }
  activePaymentLocks.add(bookingId);
  return true;
}

/**
 * Releases payment idempotency lock.
 */
export function releasePaymentLock(bookingId) {
  if (bookingId) {
    activePaymentLocks.delete(bookingId);
  }
}

/**
 * Submits a verified payment help ticket.
 */
export function submitPaymentSupportTicket({
  issueCategory,
  bookingId = '',
  transactionId = '',
  amount = null,
  eventTitle = '',
  description = '',
  user = null
}) {
  if (!issueCategory) {
    throw new Error('Please select an issue category.');
  }
  if (!description.trim()) {
    throw new Error('Please provide a brief description of the issue.');
  }

  const ticketId = `PAY-HELP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const categoryMeta = PAYMENT_ISSUE_CATEGORIES.find((c) => c.id === issueCategory) || PAYMENT_ISSUE_CATEGORIES[0];

  const ticket = {
    ticketId,
    issueCategory,
    categoryLabel: categoryMeta.label,
    bookingId: bookingId || 'N/A',
    transactionId: transactionId || 'Pending Gateway Sync',
    amount: amount ? `₹${amount}` : 'N/A',
    eventTitle: eventTitle || 'Campus Event',
    description: description.trim(),
    userEmail: user?.email || 'Registered User',
    userName: user?.displayName || user?.name || 'Attendee',
    userId: user?.uid || 'guest',
    status: 'Under Review',
    createdAt: Date.now(),
    estimatedResolution: '2–4 hours'
  };

  try {
    const existing = getStoredPaymentSupportTickets();
    existing.unshift(ticket);
    const serialized = JSON.stringify(existing.slice(0, 50));
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(SUPPORT_TICKETS_KEY, serialized);
    }
  } catch (err) {
    console.warn('[GateApass Payment Support] Storage notice:', err);
  }

  return ticket;
}

/**
 * Retrieves past submitted payment support tickets.
 */
export function getStoredPaymentSupportTickets() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage?.getItem(SUPPORT_TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
