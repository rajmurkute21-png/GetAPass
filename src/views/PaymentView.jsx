import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PaymentSummary from '../components/payment/PaymentSummary';

export default function PaymentView({
  bookingData,
  onBack,
  onPaymentSuccess
}) {
  if (!bookingData) return null;

  const { event, passes = [], attendee = {} } = bookingData;

  return (
    <div className="gateapass-payment-view" style={{ textAlign: 'left', padding: '32px 0 64px' }}>
      <div className="container-desktop" style={{ maxWidth: '640px' }}>
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-dark-text)',
            marginBottom: '24px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Pass Details</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            CHECKOUT & PAYMENT
          </span>
          <h1 className="text-h1" style={{ fontSize: '32px', lineHeight: '40px', color: 'var(--color-dark-text)', marginTop: '4px' }}>
            Complete Your Booking
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
            {event?.title} · {attendee.name} ({attendee.email})
          </p>
        </div>

        <PaymentSummary
          event={event}
          selectedPasses={passes}
          attendee={attendee}
          onSuccess={onPaymentSuccess}
          onCancel={onBack}
        />
      </div>
    </div>
  );
}
