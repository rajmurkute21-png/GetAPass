import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Wallet, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import AnimatedPaymentButton from '../booking/AnimatedPaymentButton';
import Button from '../common/Button';
import Input from '../common/Input';
import PaymentHelpModal from './PaymentHelpModal';
import { acquirePaymentLock, releasePaymentLock } from '../../services/paymentSupportService';

export default function PaymentSummary({
  event,
  selectedPasses = [],
  attendee = {},
  onSuccess
}) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'success' | 'failed'
  const [txnId, setTxnId] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const subtotal = selectedPasses.reduce((acc, p) => acc + p.price * p.qty, 0);
  const platformFee = subtotal > 0 ? 0 : 0; // Flat pricing as per reference
  const total = subtotal + platformFee;

  const handlePay = () => {
    const lockKey = `summary_pay_${event?.id || 'event'}_${total}`;
    if (!acquirePaymentLock(lockKey)) {
      alert('A transaction is already being processed. Please wait.');
      return;
    }

    setIsProcessing(true);
    // Simulate real gateway response
    setTimeout(() => {
      setIsProcessing(false);
      releasePaymentLock(lockKey);

      // Let's succeed unless user entered "fail"
      if (upiId.toLowerCase().includes('fail')) {
        setPaymentStatus('failed');
      } else {
        const generatedId = `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        setTxnId(generatedId);
        setPaymentStatus('success');
        if (onSuccess) {
          onSuccess({
            amount: total,
            method: method.toUpperCase(),
            eventTitle: event?.title || 'Campus Event',
            attendeeName: attendee?.name || 'Attendee',
            passType: selectedPasses[0]?.name || 'Participant Pass',
            passes: selectedPasses
          });
        }
      }
    }, 1200);
  };

  if (paymentStatus === 'success') {
    return (
      <div
        className="gateapass-card"
        style={{
          padding: '32px 24px',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--color-white)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-off-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-success)'
          }}
        >
          <CheckCircle2 size={36} strokeWidth={2.2} />
        </div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Payment Successful
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
            Your GateApass has been generated and sent to {attendee?.email || 'your registered email'}.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--color-off-white)',
            borderRadius: '4px',
            padding: '16px',
            textAlign: 'left',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted-text)' }}>Transaction ID</span>
            <span style={{ fontWeight: 600 }}>{txnId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted-text)' }}>Amount Paid</span>
            <span style={{ fontWeight: 700 }}>₹{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted-text)' }}>Event</span>
            <span style={{ fontWeight: 600 }}>{event?.title || 'Campus Event'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div
        className="gateapass-card"
        style={{
          padding: '32px 24px',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--color-white)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-off-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-error)'
          }}
        >
          <XCircle size={36} strokeWidth={2.2} />
        </div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Payment Failed
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
            The banking gateway declined the request. No funds were debited.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' }}>
          <Button variant="outline" fullWidth onClick={() => setPaymentStatus('idle')}>
            Try Again
          </Button>
          <Button
            variant="ghost"
            icon={HelpCircle}
            fullWidth
            onClick={() => setIsHelpOpen(true)}
            style={{ color: '#7C3AED', fontSize: '13px' }}
          >
            Need Help with this Payment?
          </Button>
        </div>
        <PaymentHelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          bookingId={txnId}
          transactionId={txnId}
          amount={total}
          eventTitle={event?.title}
          paymentStatus="failed"
          user={{ displayName: attendee.name, email: attendee.email }}
        />
      </div>
    );
  }

  return (
    <div
      className="gateapass-card gateapass-payment-summary"
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'left'
      }}
    >
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
          Select Payment Method
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
          Encrypted and processed instantly.
        </p>
      </div>

      {/* Payment Method Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { id: 'upi', label: 'UPI / QR', icon: Smartphone },
          { id: 'card', label: 'Card', icon: CreditCard },
          { id: 'netbanking', label: 'Net Banking', icon: Building },
          { id: 'wallet', label: 'Wallet', icon: Wallet }
        ].map((m) => {
          const isSel = method === m.id;
          const IconComp = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              style={{
                height: '44px',
                border: isSel ? '1.5px solid #7C3AED' : '1px solid #E9E5F0',
                backgroundColor: isSel ? 'rgba(124, 58, 237, 0.08)' : '#FFFFFF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                fontWeight: isSel ? 600 : 500,
                color: isSel ? '#7C3AED' : '#181526',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComp size={16} color={isSel ? '#7C3AED' : '#777487'} />
              <span style={{ fontSize: '13px' }}>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Method Inputs */}
      {method === 'upi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Input
            label="UPI ID / VPA"
            placeholder="e.g. username@okhdfcbank"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            helperText="Enter UPI address or scan from any UPI app"
          />
        </div>
      )}

      {method === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Card Number"
            placeholder="4242 •••• •••• 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input
              label="Expiry"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
            />
            <Input
              label="CVV"
              placeholder="123"
              type="password"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Order Summary Breakdown */}
      <div
        style={{
          borderTop: '1px solid var(--color-gray)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px'
        }}
      >
        {selectedPasses.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted-text)' }}>
              {p.name} × {p.qty}
            </span>
            <span style={{ fontWeight: 600 }}>₹{p.price * p.qty}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted-text)' }}>Platform fee</span>
          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Free</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid var(--color-gray)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-dark-text)'
          }}
        >
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Primary Pay Action (Animated Liquid Glass) */}
      <AnimatedPaymentButton
        amount={total}
        isProcessing={isProcessing}
        isSuccess={paymentStatus === 'success'}
        onClick={handlePay}
      />

      {/* Payment Help Action */}
      <div style={{ textAlign: 'center', marginTop: '-6px' }}>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#7C3AED',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <HelpCircle size={15} />
          Need Help with Payment?
        </button>
      </div>

      {/* Secondary Demo Error trigger for full testing */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setPaymentStatus('failed')}
          style={{ fontSize: '11px', color: 'var(--color-muted-text)', textDecoration: 'underline' }}
        >
          (Simulate Payment Gateway Failure)
        </button>
      </div>

      <PaymentHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        bookingId={txnId}
        transactionId={txnId}
        amount={total}
        eventTitle={event?.title}
        paymentStatus={paymentStatus}
        user={{ displayName: attendee.name, email: attendee.email }}
      />
    </div>
  );
}
