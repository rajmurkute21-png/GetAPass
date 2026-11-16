import React from 'react';
import { ArrowRight, Calendar, CreditCard, Ticket, QrCode, Plus, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';
import EventCard from '../components/cards/EventCard';
import { CATEGORIES } from '../data/mockData';

export default function LandingView({
  events = [],
  onExploreEvents,
  onHowItWorks,
  onSelectCategory,
  onBookEvent,
  onViewEventDetails,
  onCreateEvent
}) {
  return (
    <div className="gateapass-landing-page" style={{ textAlign: 'left' }}>
      {/* Editorial Top Ribbon matching Screenshot 18 */}
      <section
        style={{
          backgroundColor: 'var(--color-near-black)',
          color: 'var(--color-white)',
          padding: '64px 0 56px',
          borderBottom: '1px solid #222'
        }}
      >
        <div className="container-desktop">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '960px'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: 'var(--color-violet)',
                textTransform: 'uppercase'
              }}
            >
              PRECISE. TRUSTED. EVENT-READY.
            </div>

            <h1
              className="text-display"
              style={{
                color: 'var(--color-white)',
                lineHeight: '1.1',
                textTransform: 'uppercase'
              }}
            >
              YOUR EVENTS.<br />
              ONE DIGITAL<br />
              ACCESS PLATFORM.
            </h1>

            <p
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                color: '#AAA',
                maxWidth: '680px'
              }}
            >
              GetApass provides rapid collegiate booking, verified payments, real-time digital passes, and instant gate QR validation. A complete interface language for organisers, attendees, and entry teams.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '12px' }}>
              <Button
                variant="violet"
                size="large"
                icon={ArrowRight}
                iconPosition="right"
                onClick={onExploreEvents}
              >
                Explore Events
              </Button>

              <Button
                variant="outline"
                size="large"
                onClick={onHowItWorks}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-white)',
                  borderColor: '#444'
                }}
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Built Exclusively For Ribbon matching Screenshot 18 */}
      <section
        style={{
          backgroundColor: 'var(--color-off-white)',
          borderBottom: '1px solid var(--color-gray)',
          padding: '16px 0'
        }}
      >
        <div className="container-desktop">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              fontSize: '13px'
            }}
          >
            <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-dark-text)', letterSpacing: '0.5px' }}>
              BUILT EXCLUSIVELY FOR
            </span>
            <span style={{ color: 'var(--color-gray)' }}>|</span>
            <div style={{ display: 'flex', gap: '20px', color: 'var(--color-muted-text)' }}>
              {CATEGORIES.map((cat, idx) => (
                <span key={cat}>
                  {cat} {idx < CATEGORIES.length - 1 && '·'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Event Categories Quick Grid */}
      <section style={{ padding: '64px 0 40px' }}>
        <div className="container-desktop">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DISCOVERY
              </span>
              <h2 className="text-h2" style={{ color: 'var(--color-dark-text)', marginTop: '4px' }}>
                Browse by Category
              </h2>
            </div>
            <button
              type="button"
              onClick={onExploreEvents}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-deep-violet)',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View all <span>→</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-gray)',
                  borderRadius: 'var(--radius-control)',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-dark-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-violet)';
                  e.currentTarget.style.backgroundColor = 'var(--color-off-white)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-gray)';
                  e.currentTarget.style.backgroundColor = 'var(--color-white)';
                }}
              >
                <span>{cat}</span>
                <span style={{ color: 'var(--color-muted-text)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Grid */}
      <section style={{ padding: '32px 0 64px' }}>
        <div className="container-desktop">
          <div style={{ marginBottom: '28px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-deep-violet)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              CAMPUS HIGHLIGHTS
            </span>
            <h2 className="text-h2" style={{ color: 'var(--color-dark-text)', marginTop: '4px' }}>
              Upcoming Featured Events
            </h2>
          </div>

          {events.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                maxWidth: '680px',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-light-violet)',
                  color: 'var(--color-deep-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={26} />
              </div>

              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                  No campus events listed yet
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '6px', maxWidth: '480px', lineHeight: '22px' }}>
                  Be the first organizer to publish a hackathon, conference, workshop, or campus festival with digital pass generation and turnstile gate validation.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                {onCreateEvent && (
                  <Button variant="violet" icon={Plus} onClick={onCreateEvent}>
                    List Your Event
                  </Button>
                )}
                <Button variant="outline" onClick={onExploreEvents}>
                  View Catalogue
                </Button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '24px'
              }}
            >
              {events.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onBook={() => onBookEvent(event)}
                  onViewDetails={() => onViewEventDetails(event)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* "One Coherent Event Journey" Section matching Screenshot 29 */}
      <section
        id="how-it-works-section"
        style={{
          backgroundColor: 'var(--color-near-black)',
          color: 'var(--color-white)',
          padding: '64px 0 72px'
        }}
      >
        <div className="container-desktop">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '48px',
              borderBottom: '1px solid #222',
              paddingBottom: '20px'
            }}
          >
            <div>
              <h2 className="text-h2" style={{ color: 'var(--color-white)' }}>
                One coherent event journey.
              </h2>
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-violet)',
                letterSpacing: '1px'
              }}
            >
              BOOK → PAY → GENERATE → VERIFY
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px'
            }}
          >
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-violet)' }}>
                <Calendar size={24} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                01 / Book
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '22px', color: '#888' }}>
                Choose an event and confirm attendee details.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-violet)' }}>
                <CreditCard size={24} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                02 / Pay
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '22px', color: '#888' }}>
                Confirm payment before issuing an event pass.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-violet)' }}>
                <Ticket size={24} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                03 / Generate
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '22px', color: '#888' }}>
                Deliver a unique digital pass to the attendee.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-violet)' }}>
                <QrCode size={24} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                04 / Verify
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '22px', color: '#888' }}>
                Validate at the gate and record a single entry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
