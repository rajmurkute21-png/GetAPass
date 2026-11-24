import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Calendar,
  MapPin,
  User,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCw,
  Sparkles,
  Music,
  GraduationCap,
  Cpu,
  Code,
  Trophy,
  PartyPopper,
  Mic,
  Drama,
  Layers,
  Palette,
  BookOpen,
  Crown,
  Heart,
  Users,
  Zap
} from 'lucide-react';
import { resolveTicketTheme, resolvePassTypeTheme } from '../../constants/ticketThemes';
import './Ticket3D.css';

// Centralized icon resolver helper for category badges
const CATEGORY_ICONS = {
  Music,
  PartyPopper,
  GraduationCap,
  Cpu,
  Code,
  Trophy,
  Drama,
  Sparkles,
  Mic,
  Layers,
  Palette,
  BookOpen
};

// Centralized icon resolver helper for pass tier badges
const TIER_ICONS = {
  Crown,
  Heart,
  Users,
  GraduationCap,
  Zap,
  Cpu,
  Ticket,
  Sparkles
};

export default function Ticket3D({
  pass = {},
  isInteractive = true,
  categoryOverride = null,
  onFlipToggle = null
}) {
  const [qrUrl, setQrUrl] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef(null);
  const rectRef = useRef(null);
  const rafRef = useRef(null);
  const isTouchRef = useRef(false);
  const prefersReducedMotion = useRef(false);

  // Check hardware capabilities & accessibility flags
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isTouchRef.current = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Extract dynamic data from pass / booking record with graceful fallbacks
  const {
    id = '',
    passId,
    eventTitle = 'Campus Event',
    title,
    category = 'Concert',
    passType = 'Standard Pass',
    attendeeName = 'Pass Holder',
    participantName,
    attendeeEmail = '',
    authority = 'Participant',
    date = 'Sat, 24 May 2025',
    time = '7:00 PM',
    venue = 'Main Auditorium',
    gate = 'Gate A',
    status = 'Active',
    price = 499,
    amount,
    bookingId = '',
    paymentMethod = 'UPI',
    permissions = ['General Area'],
    eventCover,
    coverImage
  } = pass || {};

  const resolvedPassId = passId || id || (pass?.id ? `GP-${String(pass.id).slice(-8)}` : '');
  const resolvedTitle = title || eventTitle || 'GetAPass Event';
  const resolvedAttendee = participantName || attendeeName || 'Pass Holder';
  const resolvedBookingId = bookingId || `BK-${String(resolvedPassId).replace(/[^0-9]/g, '').slice(-6) || '849102'}`;
  const resolvedPrice = (price !== undefined && price !== null)
    ? price
    : (unitPrice !== undefined && unitPrice !== null
        ? unitPrice
        : (amount !== undefined ? amount : 0));
  const resolvedPassType = passType || authority || 'Standard Pass';
  const resolvedDate = date || 'Date TBA';
  const resolvedTime = time || 'Time TBA';
  const resolvedVenue = venue || 'Campus Venue';

  // Resolve visual identity & category theme
  const activeCategory = categoryOverride || category || 'Concert';
  const theme = resolveTicketTheme(activeCategory, resolvedTitle);
  const CategoryIconComponent = CATEGORY_ICONS[theme.iconName] || Music;
  const activeArtwork = coverImage || eventCover || theme.artworkUrl;

  // Resolve predefined pass tier theme
  const passTierTheme = resolvePassTypeTheme(resolvedPassType);
  const TierIconComponent = TIER_ICONS[passTierTheme.iconName] || Sparkles;

  // Generate crisp, flat scannable QR Code (with unmount guard)
  useEffect(() => {
    let isMounted = true;

    const qrPayload = JSON.stringify({
      passId: resolvedPassId,
      bookingId: resolvedBookingId,
      event: resolvedTitle,
      attendee: resolvedAttendee,
      authority: authority,
      status: status
    });

    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0a0a0d',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) setQrUrl(url);
      })
      .catch((err) => {
        if (isMounted) console.warn('[GateAPass 3D Ticket] QR code generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedPassId, resolvedBookingId, resolvedTitle, resolvedAttendee, authority, status]);

  // High-performance 3D Cursor Tilt with cached bounding rect & rAF batching
  const handleMouseEnter = () => {
    if (!isInteractive || isTouchRef.current || prefersReducedMotion.current) return;
    setIsHovered(true);
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
      if (!isFlipped) {
        cardRef.current.style.setProperty('--glare-opacity', '0.18');
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isInteractive || !cardRef.current || isFlipped || isTouchRef.current || prefersReducedMotion.current) return;

    if (!rectRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = Math.max(-1, Math.min(1, (x / rect.width - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (y / rect.height - 0.5) * 2));

    // Damped, silky smooth angles (subtle & dignified, max ±4.0° pitch, ±4.8° yaw)
    const tiltX = -normY * 4.0;
    const tiltY = normX * 4.8;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!cardRef.current || isFlipped) return;
        cardRef.current.style.transition = 'transform 0.08s ease-out';
        cardRef.current.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.008, 1.008, 1.008)`;
        cardRef.current.style.setProperty('--glare-x', `${glareX.toFixed(1)}%`);
        cardRef.current.style.setProperty('--glare-y', `${glareY.toFixed(1)}%`);
        cardRef.current.style.setProperty('--glare-opacity', '0.20');
      });
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    if (!isInteractive || !cardRef.current || isTouchRef.current) return;
    setIsHovered(false);
    // Smooth natural return to neutral center (0 deg)
    cardRef.current.style.transition = 'transform 0.55s cubic-bezier(0.2, 0.8, 0.25, 1)';
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    cardRef.current.style.setProperty('--glare-opacity', '0.06');
  };

  const handleCardClick = () => {
    if (!isInteractive) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    if (onFlipToggle) onFlipToggle(nextFlipped);
    // Reset outer container perspective tilt so inner flip handles 180° rotation cleanly
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.25, 1)';
      cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  // Status mapping
  const normStatus = String(status).toLowerCase();
  const isValidStatus = normStatus === 'active' || normStatus === 'valid' || normStatus === 'confirmed';
  const isUsedStatus = normStatus === 'used' || normStatus === 'checked-in';
  const isRevokedStatus = normStatus === 'revoked' || normStatus === 'expired' || normStatus === 'cancelled';

  return (
    <div className="getapass-3d-stage">
      {/* Ambient Radial Backlight Glow */}
      <div
        className="getapass-ambient-glow"
        style={{
          '--ticket-ambient-gradient': theme.ambientGradient
        }}
      />

      {/* 3D Ticket Container */}
      <div
        ref={cardRef}
        id="getapass-printable-ticket"
        className={`getapass-3d-ticket ${!isHovered && !isFlipped ? 'is-floating' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        title="Click to flip ticket details"
        style={{
          '--ticket-accent': theme.accent,
          '--ticket-primary': theme.primary,
          '--ticket-deep': theme.deep,
          '--ticket-glow': theme.glow,
          '--ticket-border-glow': theme.borderGlow,
          '--badge-bg': theme.badgeBg,
          '--badge-border': theme.badgeBorder
        }}
      >
        <div className={`ticket-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
          {/* ============================================================== */}
          {/* FRONT FACE                                                     */}
          {/* ============================================================== */}
          <div className="ticket-face ticket-front">
            {/* Holographic Specular Glare Overlay */}
            <div className="ticket-specular-glare" />
            <div className="ticket-shimmer-sweep" />

            {/* Perforated Divider Cutouts */}
            <div className="ticket-notch-top" />
            <div className="ticket-notch-bottom" />
            <div className="ticket-perforation-line" />

            {/* Scalloped Outer Edge Notches */}
            <div className="ticket-notch-outer-left" />
            <div className="ticket-notch-outer-right" />

            {/* ------------------------------------------------------------ */}
            {/* MAIN TICKET SECTION (LEFT ~68%)                              */}
            {/* ------------------------------------------------------------ */}
            <div className="ticket-main-section">
              {/* Event Cover Artwork with Gradient Dissolve */}
              <div
                className="ticket-artwork-bg"
                style={{
                  backgroundImage: `url("${activeArtwork}")`
                }}
              />
              <div className="ticket-artwork-overlay" />

              {/* Main Content Info */}
              <div className="ticket-main-content">
                {/* Category Pill Badge */}
                <div className="ticket-category-pill">
                  <CategoryIconComponent size={14} strokeWidth={2.4} />
                  <span>{theme.label}</span>
                </div>

                {/* Event Title & Subtitle */}
                <div className="ticket-title-group">
                  <h2 className="ticket-event-title" title={resolvedTitle}>
                    {resolvedTitle}
                  </h2>
                  <p className="ticket-event-subtitle" title={theme.tagline}>
                    {theme.tagline}
                  </p>
                </div>

                {/* Details Grid: Date/Time & Venue */}
                <div className="ticket-details-grid">
                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon-wrap">
                      <Calendar size={18} strokeWidth={2} />
                    </div>
                    <div className="ticket-detail-text">
                      <span className="ticket-detail-primary">{resolvedDate}</span>
                      <span className="ticket-detail-secondary">{resolvedTime}</span>
                    </div>
                  </div>

                  <div className="ticket-details-divider" />

                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon-wrap">
                      <MapPin size={18} strokeWidth={2} />
                    </div>
                    <div className="ticket-detail-text">
                      <span
                        className="ticket-detail-primary"
                        title={resolvedVenue}
                      >
                        {resolvedVenue.includes(',') ? resolvedVenue.split(',')[0].trim() : resolvedVenue}
                      </span>
                      <span className="ticket-detail-secondary">
                        {resolvedVenue.includes(',') ? resolvedVenue.split(',').slice(1).join(',').trim() : 'Campus Venue'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Attendee & Booking Bar */}
              <div className="ticket-bottom-bar">
                <div
                  className="ticket-pass-badge"
                  style={{
                    backgroundColor: passTierTheme.badgeBg,
                    border: `1px solid ${passTierTheme.badgeBorder}`,
                    color: '#ffffff',
                    boxShadow: `0 2px 8px ${passTierTheme.glow}`
                  }}
                >
                  <TierIconComponent size={12} strokeWidth={2.4} style={{ color: passTierTheme.accent }} />
                  <span>{resolvedPassType} · ₹{resolvedPrice}</span>
                </div>

                <div className="ticket-attendee-info">
                  <User size={14} strokeWidth={2.2} />
                  <span>{resolvedAttendee}</span>
                </div>

                <span className="ticket-meta-divider">|</span>

                <div className="ticket-booking-ref">
                  <Ticket size={14} strokeWidth={2.2} />
                  <span>Booking ID: {resolvedBookingId}</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* TICKET STUB SECTION (RIGHT ~32%)                             */}
            {/* ------------------------------------------------------------ */}
            <div className="ticket-stub-section">
              {/* Brand Header */}
              <div className="ticket-stub-brand">
                <div className="ticket-brand-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <polygon points="12 2 2 22 22 22" />
                    <line x1="6" y1="15" x2="18" y2="15" />
                  </svg>
                </div>
                <span className="ticket-brand-name">GetAPass</span>
              </div>

              {/* Crisp Undistorted QR Code Container */}
              <div className="ticket-qr-container">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code for Pass ${resolvedPassId}`}
                    className="ticket-qr-image"
                  />
                ) : (
                  <div className="ticket-qr-placeholder">
                    <RotateCw size={24} className="gateapass-spin" color="#7c3aed" />
                  </div>
                )}
              </div>

              {/* Verification Status Badge */}
              {isValidStatus && (
                <div className="ticket-status-badge status-valid">
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  <span>Valid Ticket</span>
                </div>
              )}

              {isUsedStatus && (
                <div className="ticket-status-badge status-used">
                  <Clock size={14} strokeWidth={2.5} />
                  <span>Used / Checked-in</span>
                </div>
              )}

              {isRevokedStatus && (
                <div className="ticket-status-badge status-revoked">
                  <XCircle size={14} strokeWidth={2.5} />
                  <span>{status}</span>
                </div>
              )}

              {/* Unique Pass ID */}
              <span className="ticket-stub-id">{resolvedPassId}</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BACK FACE (REVEALED ON 3D FLIP)                                */}
          {/* ============================================================== */}
          <div className="ticket-face ticket-back">
            {/* Cutout Notches matching divider and edges on back face */}
            <div className="ticket-notch-top ticket-notch-back" />
            <div className="ticket-notch-bottom ticket-notch-back" />
            <div className="ticket-perforation-line ticket-perforation-back" />
            <div className="ticket-notch-outer-left" />
            <div className="ticket-notch-outer-right" />

            <div>
              {/* Top Security Ribbon */}
              <div className="ticket-hologram-strip" />

              <div className="ticket-back-header">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {resolvedTitle} — Access Clearances
                  </h3>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
                    Gate: {gate} · Admittance: {authority} · {passTierTheme.tag}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--ticket-accent, #c084fc)',
                    fontWeight: 600
                  }}
                >
                  <RotateCw size={13} />
                  <span>Click to flip front</span>
                </div>
              </div>

              {/* Backside Details Grid */}
              <div className="ticket-back-grid">
                <div className="ticket-back-field">
                  <span className="ticket-back-label">Attendee Name</span>
                  <span className="ticket-back-val">
                    {resolvedAttendee}
                    {attendeeEmail && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 400, marginLeft: '6px' }}>
                        ({attendeeEmail})
                      </span>
                    )}
                  </span>
                </div>

                <div className="ticket-back-field">
                  <span className="ticket-back-label">Pass Identifier</span>
                  <span className="ticket-back-val" style={{ color: 'var(--ticket-accent, #c084fc)' }}>
                    {resolvedPassId}
                  </span>
                </div>

                <div className="ticket-back-field">
                  <span className="ticket-back-label">Booking Reference</span>
                  <span className="ticket-back-val">{resolvedBookingId}</span>
                </div>

                <div className="ticket-back-field">
                  <span className="ticket-back-label">Ticket Price</span>
                  <span className="ticket-back-val">
                    ₹{resolvedPrice} ({paymentMethod || 'Paid'})
                  </span>
                </div>

                <div className="ticket-back-field">
                  <span className="ticket-back-label">Turnstile Check-In</span>
                  <span className="ticket-back-val">{gate} · Rapid QR</span>
                </div>

                <div className="ticket-back-field">
                  <span className="ticket-back-label">Security Signature</span>
                  <span className="ticket-back-val" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    GP-SHA256-{String(resolvedPassId).slice(-4)}
                  </span>
                </div>
              </div>

              {/* Authorized Clearance Zones */}
              <div style={{ marginTop: '8px' }}>
                <span className="ticket-back-label">Authorized Access Zones:</span>
                <div className="ticket-clearances-wrap">
                  {(permissions && permissions.length > 0 ? permissions : ['General Area', 'Auditorium Floor']).map(
                    (area, i) => (
                      <span key={i} className="ticket-clearance-pill">
                        ✓ {area}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Admission Policy Terms */}
            <div className="ticket-back-policy">
              <strong>Official Admission Terms:</strong> This pass admits one individual. Please present your digital
              QR code upon arrival at {gate}. Passes are verified cryptographically via GetAPass optical turnstiles and
              are non-transferable once checked in. Valid photo or college ID is mandatory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
