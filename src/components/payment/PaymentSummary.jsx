import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

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
  const [txnId, setTxnId] = useState('TXN-2026-881920');

  const subtotal = selectedPasses.reduce((acc, p) => acc + p.price * p.qty, 0);
  const platformFee = subtotal > 0 ? 0 : 0; // Flat pricing as per reference
  const total = subtotal + platformFee;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate real gateway response
    setTimeout(() => {
      setIsProcessing(false);
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
            eventTitle: event?.title || 'TechFest 2026',
            attendeeName: attendee.name || 'Aarav Shah',
            passType: selectedPasses[0]?.name || 'Participant Pass'
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
            Your GateApass has been generated and sent to {attendee.email || 'aarav@campus.edu'}.
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
            <span style={{ fontWeight: 600 }}>{event?.title || 'TechFest 2026'}</span>
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

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
          <Button variant="outline" fullWidth onClick={() => setPaymentStatus('idle')}>
            Try Again
          </Button>
        </div>
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
                border: isSel ? '1.5px solid var(--color-black)' : '1px solid var(--color-gray)',
                backgroundColor: isSel ? 'var(--color-off-white)' : 'var(--color-white)',
                borderRadius: 'var(--radius-control)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                fontWeight: isSel ? 600 : 500,
                color: 'var(--color-dark-text)',
                cursor: 'pointer'
              }}
            >
              <IconComp size={16} color={isSel ? 'var(--color-deep-violet)' : 'var(--color-muted-text)'} />
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

      {/* Primary Pay Action (Liquid Glass) */}
      <Button
        variant="liquid-glass"
        size="large"
        fullWidth
        loading={isProcessing}
        onClick={handlePay}
      >
        Pay ₹{total}
      </Button>

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
    </div>
  );
}
