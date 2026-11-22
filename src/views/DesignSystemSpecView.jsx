import React, { useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import StatusBadge from '../components/common/StatusBadge';
import Tabs from '../components/common/Tabs';
import Modal from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import GlassToggle from '../components/common/GlassToggle';
import LogoLoader from '../components/common/LogoLoader';
import PermissionControl from '../components/permissions/PermissionControl';
import EventCard from '../components/cards/EventCard';
import PassCard from '../components/cards/PassCard';
import PaymentCard from '../components/cards/PaymentCard';
import DigitalPass from '../components/pass/DigitalPass';
import QRScanner from '../components/scanner/QRScanner';
import { INITIAL_EVENTS, INITIAL_PASSES, INITIAL_BOOKINGS } from '../data/mockData';
import { Check, Download } from 'lucide-react';

export default function DesignSystemSpecView({ initialTab }) {
  const isTicketPath = typeof window !== 'undefined' && (
    window.location.pathname.includes('/ticket') ||
    window.location.pathname.includes('/3d-ticket') ||
    window.location.hash.includes('ticket')
  );
  const [activeTab, setActiveTab] = useState(initialTab || (isTicketPath ? '08-qr' : '01-foundations'));
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sampleAllowed, setSampleAllowed] = useState(true);
  const [glassToggleVal, setGlassToggleVal] = useState(true);

  const sections = [
    { id: '01-foundations', label: '01 Foundations' },
    { id: '02-buttons', label: '02 Buttons' },
    { id: '03-inputs', label: '03 Inputs' },
    { id: '04-cards', label: '04 Cards' },
    { id: '05-navigation', label: '05 Navigation' },
    { id: '06-states', label: '06 States & Feedback' },
    { id: '07-data', label: '07 Data & Overlays' },
    { id: '08-qr', label: '08 QR Verification' }
  ];

  return (
    <div className="gateapass-design-spec" style={{ textAlign: 'left', padding: '40px 0 80px' }}>
      <div className="container-desktop">
        {/* Editorial Top Title matching Screenshot 18 */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-violet)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                GETAPASS DESIGN SYSTEM / V1.0 / OCTOBER 2026
              </span>
              <h1 className="text-display" style={{ fontSize: '48px', lineHeight: '56px', marginTop: '8px' }}>
                The event experience, by design.
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--color-muted-text)', marginTop: '8px', maxWidth: '720px' }}>
                GetApass — booking, payments, digital passes and QR verification. A complete interface language for organisers, attendees and gate teams.
              </p>
            </div>
            <div style={{ textAlign: 'right', display: 'none' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-deep-violet)' }}>
                PRECISE. TRUSTED. EVENT-READY.
              </div>
            </div>
          </div>

          {/* Section Tabs matching Screenshot 18 */}
          <div style={{ marginTop: '32px' }}>
            <Tabs
              tabs={sections}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>

        {/* 01 FOUNDATIONS */}
        {activeTab === '01-foundations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Color Palette */}
            <div>
              <h2 className="text-h2" style={{ marginBottom: '8px' }}>Color palette</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginBottom: '24px' }}>
                Use black for primary actions. Reserve violet for selection and brand emphasis. Use Deep Violet on white for small text; do not use Primary Violet for body copy.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {[
                  { name: 'Primary Black', hex: '#000000', note: 'Action / brand', bg: '#000000', text: '#FFFFFF' },
                  { name: 'Near Black', hex: '#0A0A0D', note: 'Dark surfaces', bg: '#0A0A0D', text: '#FFFFFF' },
                  { name: 'Primary Violet', hex: '#AC58E9', note: 'Brand accent', bg: '#AC58E9', text: '#FFFFFF' },
                  { name: 'Deep Violet', hex: '#7C2CCB', note: 'Focus / links', bg: '#7C2CCB', text: '#FFFFFF' },
                  { name: 'Light Violet', hex: '#EBDDFA', note: 'Selected surfaces', bg: '#EBDDFA', text: '#0A0A0D' },
                  { name: 'White', hex: '#FFFFFF', note: 'Base surface', bg: '#FFFFFF', text: '#000000', border: true },
                  { name: 'Off White', hex: '#F7F7F7', note: 'Quiet surfaces', bg: '#F7F7F7', text: '#000000', border: true },
                  { name: 'Light Gray', hex: '#E8E8E8', note: 'Borders / dividers', bg: '#E8E8E8', text: '#000000' },
                  { name: 'Success', hex: '#168A55', note: 'Confirmed / valid', bg: '#168A55', text: '#FFFFFF' },
                  { name: 'Error', hex: '#D92D20', note: 'Failed / invalid', bg: '#D92D20', text: '#FFFFFF' },
                  { name: 'Warning', hex: '#D9822B', note: 'Pending / caution', bg: '#D9822B', text: '#FFFFFF' }
                ].map((c) => (
                  <div
                    key={c.name}
                    style={{
                      border: '1px solid var(--color-gray)',
                      borderRadius: 'var(--radius-card)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-white)'
                    }}
                  >
                    <div style={{ height: '72px', backgroundColor: c.bg, borderBottom: c.border ? '1px solid var(--color-gray)' : 'none' }} />
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                        {c.hex} · {c.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography Scale matching Screenshot 19 */}
            <div>
              <h2 className="text-h2" style={{ marginBottom: '8px' }}>Typography / Inter</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginBottom: '20px' }}>
                SIZES IN PX · LINE HEIGHT IN PX · TRACKING IN PX
              </p>

              <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                {[
                  { role: 'Display', sample: 'Every event. One pass.', spec: '64 / 72 / 700 / -2', cls: 'text-display' },
                  { role: 'H1', sample: 'Your next experience', spec: '48 / 56 / 700 / -1.5', cls: 'text-h1' },
                  { role: 'H2', sample: 'Explore campus events', spec: '36 / 44 / 600 / -1', cls: 'text-h2' },
                  { role: 'H3', sample: 'Buildathon 2026', spec: '28 / 36 / 600 / -0.5', cls: 'text-h3' },
                  { role: 'H4', sample: 'Booking summary', spec: '20 / 28 / 600 / -0.3', cls: 'text-h4' },
                  { role: 'Body', sample: 'Book your place, pay securely and receive your digital event pass.', spec: '16 / 24 / 400 / 0', cls: 'text-body' },
                  { role: 'Small', sample: 'Includes entry, workshop materials and a participation certificate.', spec: '14 / 20 / 400 / 0', cls: 'text-small' },
                  { role: 'Caption', sample: 'PASS ISSUED · 07 OCT 2026, 14:32 IST', spec: '12 / 16 / 400 / 0', cls: 'text-caption' },
                  { role: 'Button', sample: 'Confirm & pay ₹499', spec: '14 / 20 / 600 / 0', cls: 'text-button' }
                ].map((row, idx) => (
                  <div
                    key={row.role}
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      borderBottom: idx < 8 ? '1px solid var(--color-gray)' : 'none',
                      gap: '24px'
                    }}
                  >
                    <div style={{ width: '100px', fontSize: '13px', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                      {row.role}
                    </div>
                    <div className={row.cls} style={{ flex: 1, color: 'var(--color-dark-text)' }}>
                      {row.sample}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted-text)', whiteSpace: 'nowrap' }}>
                      {row.spec}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing & Geometry */}
            <div>
              <h2 className="text-h2" style={{ marginBottom: '8px' }}>Spacing & geometry</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginBottom: '20px' }}>
                4px base unit · 4px controls · 8px cards / overlays · 1px borders · 44px controls · 64px desktop page margin · no elevation by default
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '24px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px' }}>
                {[4, 8, 12, 16, 24, 32, 48, 64].map((px) => (
                  <div key={px} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: `${px}px`, backgroundColor: 'var(--color-light-violet)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{px}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 02 BUTTONS */}
        {activeTab === '02-buttons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">Buttons & actions</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                One action hierarchy, six styles. 44px height · 16px horizontal padding · 8px icon gap · 4px radius. Inter 14/20, 600.
              </p>
            </div>

            <div style={{ border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-gray)', backgroundColor: 'var(--color-white)' }}>
                    <th style={{ padding: '16px' }}>STYLE / INTENT</th>
                    <th style={{ padding: '16px' }}>DEFAULT</th>
                    <th style={{ padding: '16px' }}>DISABLED</th>
                    <th style={{ padding: '16px' }}>LOADING</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { intent: 'Primary (Commit)', variant: 'primary', icon: Check },
                    { intent: 'Secondary (Supporting)', variant: 'secondary', icon: null },
                    { intent: 'Outline (Neutral)', variant: 'outline', icon: Download },
                    { intent: 'Violet Accent (Brand)', variant: 'violet', icon: null },
                    { intent: 'Danger (Destructive)', variant: 'danger', icon: null },
                    { intent: 'Text (Low priority)', variant: 'text', icon: null }
                  ].map((btn, i) => (
                    <tr key={btn.intent} style={{ borderBottom: i < 5 ? '1px solid var(--color-gray)' : 'none' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{btn.intent}</td>
                      <td style={{ padding: '16px' }}>
                        <Button variant={btn.variant} icon={btn.icon}>View pass</Button>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Button variant={btn.variant} disabled>View pass</Button>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <Button variant={btn.variant} loading>View pass</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 03 INPUTS */}
        {activeTab === '03-inputs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">Inputs & form controls</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Persistent labels, purposeful helpers and actionable validation. Every field has a clear default, focus, error and disabled state.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Default State</h4>
                <Input label="Full name" placeholder="Aarav Shah" helperText="Use the name on your college ID." />
                <Input label="College email" placeholder="aarav@campus.edu" helperText="Your pass will be sent here." />
                <Select label="Authority role" options={['Participant', 'Volunteer', 'VIP']} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Error State</h4>
                <Input label="Full name" value="Aarav Shah" error="Matches the participant's college ID." />
                <Input label="College email" value="invalid-email" error="Please enter a valid campus email address." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Disabled State</h4>
                <Input label="Attendee name" value="Aarav Shah" disabled helperText="Locked after gate issuance." />
                <Select label="Gate authority" disabled options={['Participant']} />
              </div>
            </div>
          </div>
        )}

        {/* 04 CARDS */}
        {activeTab === '04-cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">Cards</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Composable summaries for the complete journey: discover an event, confirm payment, receive a pass and follow activity.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  EVENT / DISCOVERY CARD
                </span>
                <div style={{ marginTop: '12px' }}>
                  <EventCard event={INITIAL_EVENTS[1]} onBook={() => alert('Book action')} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  PASS / ISSUED CARD
                </span>
                <div style={{ marginTop: '12px' }}>
                  <PassCard pass={INITIAL_PASSES[0]} onViewPass={() => alert('View pass')} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  PAYMENT / CONFIRMED CARD
                </span>
                <div style={{ marginTop: '12px' }}>
                  <PaymentCard booking={INITIAL_BOOKINGS[0]} onDownloadReceipt={() => alert('Receipt')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 05 NAVIGATION */}
        {activeTab === '05-navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">Navigation architecture</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Orientation, not decoration. Desktop 80px header, Mobile 64px header, 264px persistent Admin sidebar, 4-item Mobile bottom nav.
              </p>
            </div>

            <div style={{ padding: '24px', border: '1px solid var(--color-gray)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600 }}>Architecture Rules:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '24px', color: 'var(--color-dark-text)' }}>
                <li><strong>Public Discovery:</strong> Attendees browse events without exposing dashboard or "My Passes" clutter.</li>
                <li><strong>Private Passes:</strong> "My Passes" is strictly located inside Account Profile or accessible upon checkout completion.</li>
                <li><strong>Active State:</strong> Light Violet surface (#EBDDFA) with Deep Violet text (#7C2CCB). Never rely on icon color alone.</li>
                <li><strong>Mobile Bottom Navigation:</strong> 4 destinations maximum with 44px minimum touch targets and persistent labels.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 06 STATES & FEEDBACK */}
        {activeTab === '06-states' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">States, permissions & feedback</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Status is explicit. Navigation selection, permissions and notifications use both words and visual cues—not color alone.
              </p>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <StatusBadge status="Active" />
              <StatusBadge status="Upcoming" />
              <StatusBadge status="Pending" />
              <StatusBadge status="Valid" />
              <StatusBadge status="Failed" />
              <StatusBadge status="Cancelled" />
              <StatusBadge status="Expired" />
            </div>

            {/* Permission Control */}
            <div style={{ maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Permission Control Component</h4>
              <PermissionControl
                title="Verify event passes"
                description="Scan QR codes and record attendee entry at gate turnstiles."
                allowed={sampleAllowed}
                onChange={setSampleAllowed}
              />
              <PermissionControl
                title="Audit transaction refunds"
                description="Requires administrator credentials."
                allowed={false}
                disabled={true}
              />

              {/* Smooth Glassmorphic Toggle Showcase */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Glassmorphic Smooth Toggle (Cool Blue Palette)
                    </h5>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                      Frosted glassmorphism, pure solid surfaces, and serene cool-blue lighting
                    </p>
                  </div>
                  <GlassToggle
                    checked={glassToggleVal}
                    onChange={setGlassToggleVal}
                    variant="cool-blue"
                    size="medium"
                    aria-label="Toggle serene mode"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Small:</span>
                    <GlassToggle
                      checked={glassToggleVal}
                      onChange={setGlassToggleVal}
                      variant="cool-blue"
                      size="small"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Brand Violet:</span>
                    <GlassToggle
                      checked={glassToggleVal}
                      onChange={setGlassToggleVal}
                      variant="violet-pink"
                      size="small"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Large:</span>
                    <GlassToggle
                      checked={glassToggleVal}
                      onChange={setGlassToggleVal}
                      variant="cool-blue"
                      size="large"
                    />
                  </div>
                </div>
              </div>

              {/* GetAPass Official Logo Loader Showcase */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: '#140e26',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div>
                  <h5 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    Signature Animated Official Logo Loader
                  </h5>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                    Compact, elegant 3D vertical flip, soft purple/pink glow, scale pulse, and 3-dot indicator.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    alignItems: 'center'
                  }}
                >
                  {/* Section Loader Preview */}
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>
                      Section Loader (38px)
                    </span>
                    <LogoLoader variant="section" text="Loading pass details..." />
                  </div>

                  {/* Button Loader Preview */}
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>
                      Button Loader (20px)
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <Button variant="liquid-glass" loading={true}>
                        Confirm & Pay
                      </Button>
                      <Button variant="liquid-secondary" loading={true}>
                        Processing Pass
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 07 DATA & OVERLAYS */}
        {activeTab === '07-data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">Data, pagination & overlays</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                Operational views stay readable at scale. Tables support quick inspection; overlays isolate a single decision without losing context.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="outline" onClick={() => setModalOpen(true)}>
                Open Confirm Modal Demo
              </Button>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                Open Details Drawer Demo
              </Button>
            </div>

            {/* Modal Demo */}
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Cancel this booking?"
              confirmText="Cancel Booking"
              confirmVariant="danger"
              onConfirm={() => {
                alert('Booking cancelled.');
                setModalOpen(false);
              }}
            >
              <p>Aarav Shah's pass for Buildathon 2026 will be deactivated. This action cannot be undone.</p>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-off-white)', borderRadius: '4px', marginTop: '12px' }}>
                <strong>Booking:</strong> BK-260142 &nbsp;|&nbsp; <strong>Refund:</strong> ₹499.00
              </div>
            </Modal>

            {/* Drawer Demo */}
            <Drawer
              isOpen={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              title="Booking Details"
              subtitle="BK-260142 · Active"
              footer={
                <Button variant="primary" onClick={() => setDrawerOpen(false)}>
                  Close
                </Button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input label="Attendee name" value="Aarav Shah" readOnly />
                <Input label="Event" value="Buildathon 2026" readOnly />
                <Input label="Pass tier" value="General Admission" readOnly />
              </div>
            </Drawer>
          </div>
        )}

        {/* 08 QR VERIFICATION */}
        {activeTab === '08-qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="text-h2">QR passes & verification</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                A dependable handoff from digital booking to physical entry. Digital pass is optimized for phone display with NO user photo.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center', width: '100%' }}>
              <div style={{ width: '100%', maxWidth: '820px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
                  Premium 3D Digital Event Pass
                </h4>
                <DigitalPass
                  pass={{
                    id: 'GP-TF26-9481',
                    eventTitle: 'Astral Nights',
                    title: 'Astral Nights',
                    category: 'Concert',
                    passType: 'VIP Pass',
                    attendeeName: 'Raj Murkute',
                    authority: 'VIP',
                    date: 'Sat, 24 May 2025',
                    time: '7:00 PM',
                    venue: 'Phoenix Arena, Bengaluru',
                    gate: 'Gate A',
                    status: 'Active',
                    price: 499,
                    bookingId: 'GAP12345678',
                    permissions: ['General Area', 'VIP Lounge', 'Stagefront Access']
                  }}
                  showActions={true}
                />
              </div>

              <div style={{ width: '100%', maxWidth: '440px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
                  Mobile Optical QR Scanner Tool
                </h4>
                <QRScanner onAllowEntry={(chk) => alert(`Entry permitted for ${chk.participant}`)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
