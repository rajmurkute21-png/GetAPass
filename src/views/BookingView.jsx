import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Building, Wallet, Calendar, Clock, MapPin, ShieldCheck, Ticket, HelpCircle, AlertCircle } from 'lucide-react';
import BookingStepper from '../components/booking/BookingStepper';
import TicketCategorySelector from '../components/booking/TicketCategorySelector';
import AttendeeDetailsForm from '../components/booking/AttendeeDetailsForm';
import AnimatedPaymentButton from '../components/booking/AnimatedPaymentButton';
import BookingSuccessPanel from '../components/booking/BookingSuccessPanel';
import PaymentHelpModal from '../components/payment/PaymentHelpModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatusBadge from '../components/common/StatusBadge';
import { getPassTypesByEvent } from '../data/passTypes';
import { acquirePaymentLock, releasePaymentLock } from '../services/paymentSupportService';

/**
 * BookingView
 * Premium 3-Step Animated Booking Funnel:
 * STEP 1 (Select Tickets) -> STEP 2 (Attendee Details) -> STEP 3 (Payment & Confirmation)
 */
export default function BookingView({
  event,
  attendee = {},
  onBack,
  onProceedToPayment,
  onPaymentSuccess,
  onViewMyPasses,
  onExploreMore
}) {
  const currentEvent = event || {};

  // Step state: 1: Select, 2: Details, 3: Payment, 4: Confirmed Success
  const [currentStep, setCurrentStep] = useState(1);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Resolve available passes dynamically with real-time inventory calculation
  const eventPassTypes = currentEvent.id ? getPassTypesByEvent(currentEvent.id) : [];
  const rawPasses = (currentEvent.passTypes && currentEvent.passTypes.length > 0)
    ? currentEvent.passTypes
    : (currentEvent.passes && currentEvent.passes.length > 0)
    ? currentEvent.passes
    : (eventPassTypes.length > 0)
    ? eventPassTypes
    : [
        {
          id: `pass-${currentEvent.id || 'standard'}`,
          name: 'Standard Admission',
          price: currentEvent.startingPrice || 0,
          description: 'Official digital entry pass with QR gate validation',
          capacity: currentEvent.capacity || 100,
          soldCount: currentEvent.totalSoldCount || 0
        }
      ];

  const passes = rawPasses.map((p) => {
    const capacity = Number(p.capacity !== undefined ? p.capacity : 100);
    const sold = Number(p.soldCount || 0);
    const remaining = capacity > 0 ? Math.max(0, capacity - sold) : (p.remaining !== undefined ? p.remaining : undefined);
    const isSoldOut = Boolean(p.isSoldOut || (capacity > 0 && remaining === 0));
    return {
      ...p,
      price: Number(p.price || 0),
      remaining,
      capacity,
      soldCount: sold,
      isSoldOut
    };
  });

  const isAllTiersSoldOut = passes.length > 0 && passes.every((p) => p.isSoldOut);
  const isEventSoldOut = Boolean(currentEvent.isSoldOut || isAllTiersSoldOut);

  // Quantities per pass tier - default 1 to first available tier if not sold out
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    let firstAvailableFound = false;
    passes.forEach((p) => {
      if (!firstAvailableFound && !p.isSoldOut) {
        initial[p.id] = 1;
        firstAvailableFound = true;
      } else {
        initial[p.id] = 0;
      }
    });
    return initial;
  });

  // Attendee state
  const [fullName, setFullName] = useState(attendee?.displayName || attendee?.name || '');
  const [email, setEmail] = useState(attendee?.email || '');
  const [phone, setPhone] = useState(attendee?.phone || '');
  const [institution, setInstitution] = useState(attendee?.institution || 'Campus Participant');
  const [errors, setErrors] = useState({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

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

  // Early check for Sold Out event
  if (isEventSoldOut) {
    return (
      <div className="gateapass-booking-view" style={{ textAlign: 'left', padding: '48px 0 64px' }}>
        <div className="container-desktop" style={{ maxWidth: '640px', margin: '0 auto' }}>
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
            <span>Back to Discovery</span>
          </button>

          <div
            style={{
              padding: '40px 32px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
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
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Event Sold Out
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '440px', lineHeight: '22px', margin: 0 }}>
              All tickets for <strong>{currentEvent.title}</strong> have been fully booked. Stay tuned for additional pass releases or check out other upcoming campus events.
            </p>
            <Button variant="primary" onClick={onBack} style={{ marginTop: '8px' }}>
              Explore Other Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const updateQuantity = (passId, delta) => {
    const targetPass = passes.find((p) => p.id === passId);
    if (!targetPass) return;

    setQuantities((prev) => {
      const current = prev[passId] || 0;
      const next = Math.max(0, current + delta);
      // Enforce inventory ceiling if remaining is defined
      if (delta > 0 && targetPass.remaining !== undefined && next > targetPass.remaining) {
        return prev;
      }
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

  // Step 1 -> Step 2 validation
  const handleProceedToDetails = () => {
    if (selectedPassesList.length === 0) {
      alert('Please select at least 1 ticket to proceed.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 validation
  const handleProceedToPaymentStep = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!email.trim()) newErrors.email = 'Valid Email is required';
    if (!phone.trim()) newErrors.phone = 'Mobile Phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // If external onProceedToPayment is specifically preferred without internal payment
    if (onProceedToPayment && !onPaymentSuccess) {
      onProceedToPayment({
        event: currentEvent,
        attendee: { name: fullName, email, phone, institution },
        passes: selectedPassesList,
        totalAmount
      });
      return;
    }

    setCurrentStep(3);
  };

  // Step 3: Confirm & Pay execution with atomic overselling protection
  const handleExecutePayment = async () => {
    const orderLockKey = `order_${currentEvent.id || 'event'}_${fullName || 'attendee'}_${totalAmount}`;
    if (!acquirePaymentLock(orderLockKey)) {
      alert('Payment processing is already underway. Please wait a moment.');
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      const generatedRef = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

      if (onPaymentSuccess) {
        try {
          const result = await onPaymentSuccess({
            amount: totalAmount,
            method: paymentMethod.toUpperCase(),
            eventTitle: currentEvent.title,
            attendeeName: fullName,
            passType: selectedPassesList[0]?.name || 'General Admission',
            passes: selectedPassesList,
            autoNavigate: false // keep user inside the success confirmation view
          });

          setIsProcessing(false);
          releasePaymentLock(orderLockKey);
          setIsSuccess(true);

          setBookingConfirmation({
            bookingReference: result?.bookingId || generatedRef,
            issuedPasses: result?.passes || selectedPassesList.map((p, idx) => ({
              id: `GP-2026-${idx + 1}`,
              passId: `GP-2026-${idx + 1}`,
              title: currentEvent.title,
              attendeeName: fullName,
              passType: p.name,
              date: currentEvent.date,
              time: currentEvent.time,
              venue: currentEvent.venue,
              category: currentEvent.category
            }))
          });

          // Smoothly advance to Confirmation screen after SVG checkmark plays
          setTimeout(() => {
            setCurrentStep(4);
          }, 700);
        } catch (bookingErr) {
          setIsProcessing(false);
          setIsSuccess(false);
          releasePaymentLock(orderLockKey);
          alert(bookingErr?.message || 'Booking failed. Tickets may no longer be available.');
          return;
        }
      } else {
        setIsProcessing(false);
        releasePaymentLock(orderLockKey);
        setIsSuccess(true);

        setBookingConfirmation({
          bookingReference: generatedRef,
          issuedPasses: selectedPassesList.map((p, idx) => ({
            id: `GP-2026-${idx + 1}`,
            passId: `GP-2026-${idx + 1}`,
            title: currentEvent.title,
            attendeeName: fullName,
            passType: p.name,
            date: currentEvent.date,
            time: currentEvent.time,
            venue: currentEvent.venue,
            category: currentEvent.category
          }))
        });

        setTimeout(() => {
          setCurrentStep(4);
        }, 700);
      }
    }, 1200);
  };

  const normalizedStatus = String(currentEvent.status || 'Active').trim().toLowerCase();
  const isBookingBlocked = ['disabled', 'removed', 'cancelled', 'rejected', 'pending'].includes(normalizedStatus);

  if (isBookingBlocked) {
    return (
      <div className="gateapass-booking-view" style={{ textAlign: 'left', padding: '48px 0 64px' }}>
        <div className="container-desktop" style={{ maxWidth: '640px', margin: '0 auto' }}>
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
            <span>Back to Discovery</span>
          </button>

          <div
            style={{
              padding: '36px 24px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '16px',
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
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#991B1B', margin: 0 }}>
                Event Unavailable for Booking
              </h2>
              <p style={{ fontSize: '14px', color: '#7F1D1D', marginTop: '8px', maxWidth: '440px' }}>
                {normalizedStatus === 'removed'
                  ? 'This event was removed or terminated by administrators and cannot accept new bookings.'
                  : normalizedStatus === 'disabled'
                  ? 'Bookings for this event are currently disabled by management.'
                  : normalizedStatus === 'pending'
                  ? 'This event is currently pending administrative review and authorization.'
                  : 'This event is not available for bookings.'}
              </p>
            </div>

            <Button variant="outline" onClick={onBack} style={{ marginTop: '8px' }}>
              Explore Other Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gateapass-booking-view" style={{ textAlign: 'left', padding: '32px 0 64px' }}>
      <div className="container-desktop" style={{ maxWidth: currentStep === 4 ? '880px' : '960px', margin: '0 auto' }}>
        {/* Top Back Navigation */}
        {currentStep < 4 && (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 1) onBack();
              else setCurrentStep(currentStep - 1);
            }}
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
            <span>{currentStep === 1 ? 'Back to Event' : 'Previous Step'}</span>
          </button>
        )}

        {/* Multi-Step Booking Progress Stepper */}
        {currentStep <= 3 && (
          <BookingStepper
            currentStep={currentStep}
            onStepClick={(stepNum) => setCurrentStep(stepNum)}
          />
        )}

        {/* STEP 1: Select Tickets */}
        {currentStep === 1 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
              gap: '36px',
              alignItems: 'start'
            }}
          >
            {/* Left: Interactive Category Selector */}
            <TicketCategorySelector
              passes={passes}
              quantities={quantities}
              onUpdateQuantity={updateQuantity}
              onContinue={handleProceedToDetails}
            />

            {/* Right: Sticky Event Context Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                position: 'sticky',
                top: '90px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#9333EA',
                    letterSpacing: '0.6px'
                  }}
                >
                  {currentEvent.category}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                  {currentEvent.title}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: '#7C3AED' }} />
                  <span>{currentEvent.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: '#7C3AED' }} />
                  <span>{currentEvent.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: '#7C3AED' }} />
                  <span>{currentEvent.venue}</span>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(147, 51, 234, 0.06)',
                  border: '1px solid rgba(147, 51, 234, 0.15)',
                  fontSize: '12px',
                  color: '#6B21A8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={16} />
                <span>Verified campus event with official QR turnstile validation.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Attendee Details */}
        {currentStep === 2 && (
          <AttendeeDetailsForm
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            institution={institution}
            setInstitution={setInstitution}
            errors={errors}
            selectedPassesList={selectedPassesList}
            totalAmount={totalAmount}
            onBack={() => setCurrentStep(1)}
            onContinue={handleProceedToPaymentStep}
          />
        )}

        {/* STEP 3: Payment Breakdown & Confirm */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#9333EA', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                FINAL CHECKOUT
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                Review & Confirm Booking
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                Select your payment method and execute secure turnstile pass issuance.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
                gap: '32px',
                alignItems: 'start'
              }}
            >
              {/* Payment Methods Selection */}
              <div
                style={{
                  padding: '24px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Select Payment Method
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm, BHIM' },
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
                    { id: 'netbanking', label: 'Net Banking', icon: Building, desc: 'All Indian major banks supported' },
                    { id: 'wallet', label: 'Campus Wallet', icon: Wallet, desc: 'Student pass balance' }
                  ].map((m) => {
                    const MIcon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSel ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                          background: isSel ? 'rgba(245, 243, 255, 0.7)' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <MIcon size={20} style={{ color: isSel ? '#7C3AED' : '#64748B' }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block' }}>
                            {m.label}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>
                            {m.desc}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSel ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                            backgroundColor: '#FFFFFF'
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Simulated gateway input fields */}
                {paymentMethod === 'upi' && (
                  <Input
                    label="UPI ID"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    helperText="Instant virtual payment address verification."
                  />
                )}

                {paymentMethod === 'card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Input
                      label="Card Number"
                      placeholder="4532 •••• •••• 8829"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Input
                        label="Expiry (MM/YY)"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                      <Input
                        label="CVV"
                        placeholder="•••"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Final Breakdown Card with Animated CTA */}
              <div
                style={{
                  padding: '24px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Order Summary
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedPassesList.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#334155' }}>
                      <span>{p.qty}× {p.name}</span>
                      <span style={{ fontWeight: 600 }}>₹{p.qty * p.price}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                    <span>Platform Gate Fee</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>₹0 (Waived)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                    <span>Issued Attendee</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName}</span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid #CBD5E1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Total Payable</span>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A' }}>₹{totalAmount}</span>
                </div>

                {/* Animated Confirm & Pay CTA */}
                <AnimatedPaymentButton
                  amount={totalAmount}
                  isProcessing={isProcessing}
                  isSuccess={isSuccess}
                  onClick={handleExecutePayment}
                />

                <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', margin: 0 }}>
                  Encrypted 256-bit payment · Instant unique QR pass delivery to your account.
                </p>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
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
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Digital Booking Confirmation Screen */}
        {currentStep === 4 && bookingConfirmation && (
          <div>
            <BookingSuccessPanel
              bookingReference={bookingConfirmation.bookingReference}
              event={currentEvent}
              attendee={{ name: fullName, email, phone }}
              issuedPasses={bookingConfirmation.issuedPasses}
              totalAmount={totalAmount}
              paymentMethod={paymentMethod.toUpperCase()}
              onViewMyPasses={onViewMyPasses || (() => setCurrentStep(1))}
              onExploreMore={onExploreMore || onBack}
            />

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
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
                Payment Help & Support Inquiry
              </button>
            </div>
          </div>
        )}

        {/* Global Payment Help Modal */}
        <PaymentHelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          bookingId={bookingConfirmation?.bookingReference || ''}
          transactionId={bookingConfirmation?.bookingReference || ''}
          amount={totalAmount}
          eventTitle={currentEvent.title}
          paymentStatus={isProcessing ? 'processing' : isSuccess ? 'success' : 'idle'}
          user={{ displayName: fullName, email, phone }}
        />
      </div>
    </div>
  );
}
