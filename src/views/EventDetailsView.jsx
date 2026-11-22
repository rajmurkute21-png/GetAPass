import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CheckCircle, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import StickyBookingSummary from '../components/events/StickyBookingSummary';

export default function EventDetailsView({
  event,
  onBack,
  onBookNow
}) {
  const [showStickySummary, setShowStickySummary] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickySummary(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  if (!event) {
    return (
      <div className="gateapass-event-details-view" style={{ textAlign: 'left', padding: '64px 0' }}>
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
              No Event Selected
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', maxWidth: '400px', lineHeight: '22px' }}>
              Please select an event from the catalogue to view its schedule, venue details, and pass options.
            </p>
            <Button variant="primary" onClick={onBack}>
              Explore Events Catalogue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    category,
    date,
    time,
    venue,
    startingPrice,
    status = 'Active',
    bannerImage,
    description,
    highlights = [],
    schedule = [],
    faqs = []
  } = event;

  return (
    <div className="gateapass-event-details-view" style={{ textAlign: 'left', padding: '32px 0 64px' }}>
      {/* Sticky Top Booking Summary Bar */}
      <StickyBookingSummary
        event={event}
        visible={showStickySummary}
        onBook={onBookNow}
      />

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
          <span>Back to Events</span>
        </button>

        {/* Large Event Image Banner */}
        <div
          style={{
            width: '100%',
            height: '380px',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-near-black)',
            marginBottom: '32px',
            border: '1px solid var(--color-gray)'
          }}
        >
          <img
            src={bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Two-Column Grid: Left Content, Right Sticky Booking CTA */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
            gap: '40px'
          }}
        >
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-deep-violet)',
                    letterSpacing: '0.8px'
                  }}
                >
                  {category}
                </span>
                <StatusBadge status={status} />
              </div>

              <h1 className="text-h1" style={{ color: 'var(--color-dark-text)', marginBottom: '16px' }}>
                {title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px',
                  padding: '16px 20px',
                  backgroundColor: 'var(--color-off-white)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--color-deep-violet)' }} />
                  <span><strong>Date:</strong> {date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--color-deep-violet)' }} />
                  <span><strong>Time:</strong> {time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} style={{ color: 'var(--color-deep-violet)' }} />
                  <span><strong>Venue:</strong> {venue}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-h3" style={{ marginBottom: '12px' }}>
                About the Event
              </h3>
              <p style={{ fontSize: '16px', lineHeight: '26px', color: 'var(--color-dark-text)' }}>
                {description}
              </p>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <h3 className="text-h3" style={{ marginBottom: '16px' }}>
                  Event Highlights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <CheckCircle size={18} style={{ color: 'var(--color-success)', marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '15px', color: 'var(--color-dark-text)' }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {schedule.length > 0 && (
              <div>
                <h3 className="text-h3" style={{ marginBottom: '16px' }}>
                  Schedule & Itinerary
                </h3>
                <div
                  style={{
                    border: '1px solid var(--color-gray)',
                    borderRadius: 'var(--radius-card)',
                    overflow: 'hidden'
                  }}
                >
                  {schedule.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: idx < schedule.length - 1 ? '1px solid var(--color-gray)' : 'none',
                        backgroundColor: idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-off-white)'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-dark-text)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-deep-violet)' }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venue & Gate Entry */}
            <div>
              <h3 className="text-h3" style={{ marginBottom: '12px' }}>
                Venue & Access Protocol
              </h3>
              <div
                style={{
                  padding: '20px',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: 'var(--color-white)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-deep-violet)' }} />
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>Gate Validation Required</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--color-muted-text)' }}>
                  All attendees must check in using their issued GetApass QR code at Gate A entrance turnstiles. Digital passes will be scanned and matched with valid college photo identification before access is granted.
                </p>
              </div>
            </div>

            {/* FAQs */}
            {faqs.length > 0 && (
              <div>
                <h3 className="text-h3" style={{ marginBottom: '16px' }}>
                  Frequently Asked Questions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {faqs.map((faq, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '18px 20px',
                        border: '1px solid var(--color-gray)',
                        borderRadius: 'var(--radius-control)',
                        backgroundColor: 'var(--color-white)'
                      }}
                    >
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-dark-text)', marginBottom: '6px' }}>
                        {faq.q}
                      </h4>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Pass Booking Panel */}
          <div>
            <div
              className="gateapass-card"
              style={{
                position: 'sticky',
                top: '100px',
                padding: '24px',
                border: '1px solid var(--color-border-solid, #E9E5F0)',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'var(--liquid-glass-shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-deep-violet)' }}>
                  REGISTRATION OPEN
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                    ₹{startingPrice}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--color-muted-text)' }}>
                    starting price
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-gray)', paddingTop: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Event Format</span>
                  <span style={{ fontWeight: 600 }}>In-person Campus</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Access Pass</span>
                  <span style={{ fontWeight: 600 }}>Instant Digital QR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-muted-text)' }}>Verification</span>
                  <span style={{ fontWeight: 600 }}>Single Entry Scan</span>
                </div>
              </div>

              <Button
                variant="liquid-glass"
                size="large"
                fullWidth
                onClick={onBookNow}
              >
                Book Your Pass →
              </Button>

              <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', textAlign: 'center', lineHeight: '16px' }}>
                Instant confirmation · Official digital GetApass delivered directly to your account profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Liquid Glass CTA Bar */}
      <div className="liquid-glass-sticky-cta-bar">
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>
            Pass Starting At
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>
            ₹{startingPrice}
          </div>
        </div>
        <Button
          variant="liquid-glass"
          onClick={onBookNow}
          style={{ minWidth: '150px' }}
        >
          Book Now →
        </Button>
      </div>
    </div>
  );
}
