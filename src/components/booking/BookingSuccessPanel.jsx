import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Ticket, ArrowRight } from 'lucide-react';
import Ticket3D from '../pass/Ticket3D';
import Button from '../common/Button';

/**
 * BookingSuccessPanel
 * Premium digital booking confirmation panel rendered after payment verification.
 * Renders booking metadata and each issued individual 3D pass separately with its
 * own unique passId and QR identifier.
 */
export default function BookingSuccessPanel({
  bookingReference = 'BK-881920',
  event,
  attendee,
  issuedPasses = [],
  totalAmount = 0,
  paymentMethod = 'UPI',
  onViewMyPasses,
  onExploreMore
}) {
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);

  const activePass = issuedPasses[selectedPassIndex] || issuedPasses[0] || {
    id: 'GP-CONF-2026',
    passId: 'GP-CONF-2026',
    title: event?.title || 'Event Pass',
    attendeeName: attendee?.name || 'Attendee',
    date: event?.date || 'Upcoming',
    time: event?.time || '09:00 AM',
    venue: event?.venue || 'Campus Auditorium',
    category: event?.category || 'Concert',
    passType: 'General Admission'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        maxWidth: '840px',
        margin: '0 auto',
        textAlign: 'left'
      }}
    >
      {/* Success Hero Header */}
      <div
        style={{
          padding: '32px 24px',
          backgroundColor: 'rgba(124, 58, 237, 0.06)',
          borderRadius: '24px',
          border: '1px solid rgba(124, 58, 237, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
          }}
        >
          <CheckCircle2 size={36} strokeWidth={2.4} />
        </motion.div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#7C3AED',
            letterSpacing: '1px'
          }}
        >
          BOOKING CONFIRMED
        </span>

        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          You're Going to {event?.title || 'the Event'}!
        </h2>

        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '480px', margin: 0, lineHeight: '22px' }}>
          Your transaction was verified. {issuedPasses.length} official digital {issuedPasses.length === 1 ? 'pass has' : 'passes have'} been issued with unique turnstile QR credentials.
        </p>

        {/* Booking Reference Pill */}
        <div
          style={{
            marginTop: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ color: '#94A3B8' }}>Booking Ref:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7C3AED' }}>{bookingReference}</span>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          padding: '20px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          fontSize: '13px'
        }}
      >
        <div>
          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Event Date & Time</span>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{event?.date || 'Upcoming'} · {event?.time || 'TBD'}</span>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Venue Location</span>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{event?.venue || 'Campus Venue'}</span>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Attendee Name</span>
          <span style={{ fontWeight: 700, color: '#0F172A' }}>{attendee?.name || 'Attendee'}</span>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Total Amount Paid</span>
          <span style={{ fontWeight: 800, color: '#059669', fontSize: '15px' }}>₹{totalAmount} ({paymentMethod})</span>
        </div>
      </div>

      {/* Individual Issued 3D Passes Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket size={20} style={{ color: '#7C3AED' }} />
              Issued Digital {issuedPasses.length === 1 ? 'Pass' : `Passes (${issuedPasses.length})`}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
              Each pass carries an individual gate identifier and tamper-resistant QR code.
            </p>
          </div>

          {/* Pass Selector Tabs for Multi-Ticket Purchases */}
          {issuedPasses.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {issuedPasses.map((pass, idx) => (
                <button
                  key={pass.id || idx}
                  type="button"
                  onClick={() => setSelectedPassIndex(idx)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: selectedPassIndex === idx ? 700 : 500,
                    border: selectedPassIndex === idx ? '1px solid #7C3AED' : '1px solid #CBD5E1',
                    backgroundColor: selectedPassIndex === idx ? '#7C3AED' : '#FFFFFF',
                    color: selectedPassIndex === idx ? '#FFFFFF' : '#334155',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Ticket #{idx + 1} ({pass.passType || 'Pass'})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Render Single Active 3D Ticket with Universal Ticket Architecture */}
        <div
          style={{
            padding: '24px 12px',
            backgroundColor: '#0c0a17',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 16px 40px -10px rgba(12, 10, 23, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            overflow: 'visible'
          }}
        >
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', justifyContent: 'center' }}>
            <Ticket3D pass={activePass} />
          </div>

          <div style={{ marginTop: '14px', fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
            Unique Pass ID: <span style={{ color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 700 }}>{activePass.passId || activePass.id}</span>
            {issuedPasses.length > 1 && ` · Pass ${selectedPassIndex + 1} of ${issuedPasses.length}`}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          paddingTop: '12px'
        }}
      >
        <Button
          variant="outline"
          onClick={onExploreMore}
        >
          Explore More Events
        </Button>

        <Button
          variant="liquid-glass"
          size="large"
          icon={ArrowRight}
          iconPosition="right"
          onClick={onViewMyPasses}
        >
          View in My Passes
        </Button>
      </div>
    </motion.div>
  );
}
