import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Plus, Minus, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatusBadge from '../components/common/StatusBadge';
import { getPassTypesByEvent } from '../data/passTypes';

export default function BookingView({
  event,
  attendee = {},
  onBack,
  onProceedToPayment
}) {
  const currentEvent = event || {};

  // Resolve available passes dynamically
  const eventPassTypes = currentEvent.id ? getPassTypesByEvent(currentEvent.id) : [];
  const passes = (currentEvent.passes && currentEvent.passes.length > 0)
    ? currentEvent.passes
    : (eventPassTypes.length > 0)
    ? eventPassTypes.map((pt) => ({
        id: pt.id,
        name: pt.name,
        price: pt.price,
        description: pt.description || ''
      }))
    : [
        {
          id: `pass-${currentEvent.id || 'standard'}`,
          name: 'Standard Admission',
          price: currentEvent.startingPrice || 0,
          description: 'Official digital entry pass with QR gate validation'
        }
      ];

  // State for quantities initialized dynamically from resolved passes
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    passes.forEach((p, idx) => {
      initial[p.id] = idx === 0 ? 1 : 0;
    });
    return initial;
  });

  // Attendee state
  const [fullName, setFullName] = useState(attendee?.displayName || attendee?.name || '');
  const [email, setEmail] = useState(attendee?.email || '');
  const [phone, setPhone] = useState(attendee?.phone || '');
  const [errors, setErrors] = useState({});

  if (!event) {
    return (
      <div className="gateapass-booking-view" style={{ textAlign: 'left', padding: '64px 0' }}>
        <div className="container-desktop" style={{ maxWidth: '600px', textAlign: 'center', margin: '0 auto' }}>
          <div
            style={{
              padding: '48px 24px',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <h2 className="text-h2" style={{ color: 'var(--color-dark-text)' }}>
              No Event Selected for Booking
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', maxWidth: '400px', lineHeight: '22px' }}>
              Please choose an event from the catalogue to select pass tiers and proceed with registration.
            </p>
            <Button variant="primary" onClick={onBack}>
              Return to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }



  const updateQuantity = (passId, delta) => {
    setQuantities((prev) => {
      const current = prev[passId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [passId]: next };
    });
  };

  const selectedPassesList = passes
    .filter((p) => (quantities[p.id] || 0) > 0)
    .map((p) => ({
      ...p,
      qty: quantities[p.id]
    }));

  const totalAmount = selectedPassesList.reduce((acc, p) => acc + p.price * p.qty, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (selectedPassesList.length === 0) newErrors.passes = 'Please select at least 1 pass';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onProceedToPayment({
      event: currentEvent,
      attendee: { name: fullName, email, phone },
      passes: selectedPassesList,
      totalAmount
    });
  };

  return (
    <div className="gateapass-booking-view" style={{ textAlign: 'left', padding: '32px 0 64px' }}>
      <div className="container-desktop">
        {/* Back Link */}
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
          <span>Back to Event</span>
        </button>

        {/* Two-Column Desktop Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 1fr)',
            gap: '48px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Event Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-deep-violet)',
                    letterSpacing: '0.8px'
                  }}
                >
                  {currentEvent.category}
                </span>
                <StatusBadge status={currentEvent.status || 'Active'} />
              </div>

              <h1 className="text-h1" style={{ color: 'var(--color-dark-text)' }}>
                {currentEvent.title}
              </h1>

              <p style={{ fontSize: '15px', color: 'var(--color-muted-text)', marginTop: '8px', lineHeight: '22px' }}>
                {currentEvent.description}
              </p>
            </div>

            {/* Event Key Meta Cards */}
            <div
              style={{
                backgroundColor: 'var(--color-off-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={20} style={{ color: 'var(--color-deep-violet)' }} />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                    Date
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    {currentEvent.date}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} style={{ color: 'var(--color-deep-violet)' }} />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                    Time
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    {currentEvent.time}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={20} style={{ color: 'var(--color-deep-violet)' }} />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                    Venue
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                    {currentEvent.venue}
                  </div>
                </div>
              </div>
            </div>

            {/* Entry protocol box */}
            <div
              style={{
                padding: '20px',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                backgroundColor: 'var(--color-white)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}
            >
              <ShieldCheck size={22} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)', marginBottom: '4px' }}>
                  Authentic GetApass Guarantee
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '18px' }}>
                  Your generated QR pass is cryptographically bound to your registered name and email. No physical paperwork needed at entry.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Panel */}
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-card)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                Select Your Passes
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                Adjust quantities for yourself or group attendees.
              </p>
            </div>

            {/* Passes with quantity controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {passes.map((p) => {
                const qty = quantities[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px',
                      border: qty > 0 ? '1.5px solid var(--color-deep-violet)' : '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: qty > 0 ? 'var(--color-off-white)' : 'var(--color-white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-deep-violet)', marginTop: '2px' }}>
                        ₹{p.price}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                          {p.description}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, -1)}
                        disabled={qty <= 0}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid var(--color-gray)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-white)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: qty <= 0 ? 'not-allowed' : 'pointer',
                          opacity: qty <= 0 ? 0.4 : 1
                        }}
                      >
                        <Minus size={14} />
                      </button>

                      <span style={{ width: '24px', textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
                        {qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid var(--color-gray)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-white)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {errors.passes && (
                <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                  {errors.passes}
                </span>
              )}
            </div>

            {/* Attendee Fields */}
            <div style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                Attendee Information
              </h4>

              <Input
                label="Full Name"
                placeholder="Matches college photo ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                helperText="Use the name on your student or government ID."
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="name@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                helperText="Your digital pass and invoice will be sent here."
                required
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                helperText="Used for gate entry verification updates."
                required
              />
            </div>

            {/* Order Summary & Total */}
            <div
              style={{
                borderTop: '1px solid var(--color-gray)',
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted-text)' }}>
                <span>Selected Passes ({selectedPassesList.reduce((a, b) => a + b.qty, 0)})</span>
                <span>₹{totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted-text)' }}>
                <span>Platform Processing Fee</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>₹0 (Waived)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--color-gray)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-dark-text)'
                }}
              >
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              variant="primary"
              size="large"
              icon={ArrowRight}
              iconPosition="right"
              fullWidth
              disabled={totalAmount <= 0}
              onClick={handleSubmit}
            >
              Continue to Payment →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
