import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Select from '../common/Select';
import StatusBadge from '../common/StatusBadge';
import {
  PAYMENT_ISSUE_CATEGORIES,
  submitPaymentSupportTicket
} from '../../services/paymentSupportService';

export default function PaymentHelpModal({
  isOpen,
  onClose,
  bookingId = '',
  transactionId = '',
  paymentStatus = 'idle', // 'idle' | 'processing' | 'pending' | 'failed' | 'success'
  amount = null,
  eventTitle = '',
  user = null
}) {
  const [category, setCategory] = useState(
    paymentStatus === 'failed'
      ? 'payment-failed'
      : paymentStatus === 'pending'
      ? 'payment-pending'
      : 'deducted-not-confirmed'
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategoryMeta =
    PAYMENT_ISSUE_CATEGORIES.find((c) => c.id === category) || PAYMENT_ISSUE_CATEGORIES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please provide a brief description of the issue so our support team can assist you.');
      return;
    }

    setSubmitting(true);
    try {
      const ticket = submitPaymentSupportTicket({
        issueCategory: category,
        bookingId,
        transactionId,
        amount,
        eventTitle,
        description,
        user
      });
      setSubmittedTicket(ticket);
    } catch (err) {
      setError(err?.message || 'Failed to submit payment support request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      maxWidth="520px"
      cancelText={null}
      confirmText={null}
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED'
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-dark-text)' }}>
                Payment Help & Support
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', margin: '2px 0 0' }}>
                Assistance with deductions, pending transactions & failures
              </p>
            </div>
          </div>
        </div>

        {submittedTicket ? (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#EDF7ED',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-dark-text)' }}>
                Support Ticket Logged
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Your payment inquiry has been assigned to the ticketing desk.
              </p>
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--color-off-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Ticket ID:</span>
                <strong style={{ color: '#7C3AED' }}>{submittedTicket.ticketId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Issue:</span>
                <span>{submittedTicket.categoryLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Booking Ref:</span>
                <span>{submittedTicket.bookingId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted-text)' }}>Est. Resolution:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{submittedTicket.estimatedResolution}</span>
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={handleResetAndClose} style={{ marginTop: '8px' }}>
              Done
            </Button>
          </div>
        ) : (
          /* Support Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live Status & References Pill */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--color-off-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-muted-text)', fontWeight: 500 }}>Live Transaction Status:</span>
                <StatusBadge status={paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)} />
              </div>

              {bookingId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Booking ID:</span>
                  <span style={{ fontWeight: 600 }}>{bookingId}</span>
                </div>
              )}

              {transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Transaction Ref:</span>
                  <span style={{ fontWeight: 600 }}>{transactionId}</span>
                </div>
              )}

              {amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Amount:</span>
                  <span style={{ fontWeight: 700 }}>₹{amount}</span>
                </div>
              )}
            </div>

            {/* Issue Category Selection */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                What problem are you experiencing? *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: '10px',
                  padding: '0 12px',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              >
                {PAYMENT_ISSUE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Banking Guidance Notice */}
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.18)',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#5B21B6',
                lineHeight: '18px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <Clock size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#7C3AED' }} />
              <div>
                <strong>Official Banking Notice:</strong> {selectedCategoryMeta.instruction}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Problem Description *
              </label>
              <textarea
                rows={3}
                placeholder="Describe what occurred (e.g., bank debited via GPay, screen returned to event list, UPI reference number)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-gray)',
                  fontSize: '13px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#B42318', fontSize: '13px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button variant="outline" type="button" onClick={handleResetAndClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting} icon={Send}>
                {submitting ? 'Submitting Inquiry...' : 'Submit Support Request'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
