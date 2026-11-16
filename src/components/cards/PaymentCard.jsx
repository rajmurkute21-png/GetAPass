import React from 'react';
import { CreditCard, Download } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function PaymentCard({
  booking,
  onDownloadReceipt
}) {
  const {
    bookingId,
    eventTitle,
    passType,
    amount,
    status = 'Active',
    date,
    paymentMethod,
    passId
  } = booking;

  return (
    <div
      className="gateapass-card gateapass-payment-card"
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'left'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CreditCard size={22} strokeWidth={2} style={{ color: 'var(--color-dark-text)' }} />
        <StatusBadge status={status} />
      </div>

      <div>
        <h3
          style={{
            fontSize: '22px',
            lineHeight: '26px',
            fontWeight: 700,
            color: 'var(--color-dark-text)',
            letterSpacing: '-0.3px',
            textTransform: 'uppercase'
          }}
        >
          {eventTitle}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
          {passType} · 1 participant
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted-text)' }}>Amount paid</span>
          <span style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>₹{amount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted-text)' }}>Transaction</span>
          <span style={{ fontWeight: 600, color: 'var(--color-dark-text)' }}>{bookingId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted-text)' }}>Payment method</span>
          <span style={{ color: 'var(--color-dark-text)' }}>{paymentMethod} ({date})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted-text)' }}>Pass ID</span>
          <span style={{ fontWeight: 600, color: 'var(--color-deep-violet)' }}>{passId}</span>
        </div>
      </div>

      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-success)',
          fontWeight: 500,
          marginTop: 'auto'
        }}
      >
        Your pass has been generated and emailed.
      </p>

      <Button
        variant="outline"
        icon={Download}
        fullWidth
        onClick={onDownloadReceipt}
      >
        Download receipt
      </Button>
    </div>
  );
}
