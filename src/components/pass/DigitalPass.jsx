import React, { useState } from 'react';
import {
  Share2,
  Printer,
  CheckCircle,
  RotateCw,
  Info
} from 'lucide-react';
import Button from '../common/Button';
import Ticket3D from './Ticket3D';

class TicketErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GetAPass 3D Pass] Render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '32px 24px',
            textAlign: 'center',
            backgroundColor: '#0c0a17',
            borderRadius: '20px',
            color: '#ffffff',
            maxWidth: '600px',
            margin: '0 auto',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#c084fc' }}>
            Unable to render 3D ticket
          </h4>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            Pass credentials are secure. Please try reopening the pass or contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DigitalPass({
  pass,
  showActions = true,
  _onClose = null
}) {
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    id = 'GP-TF26-9481',
    passId,
    eventTitle = 'Campus Event',
    title,
    attendeeName = 'Pass Holder',
    participantName,
    date = 'Sat, 24 May 2025',
    time = '7:00 PM',
    venue = 'Main Auditorium'
  } = pass || {};

  const resolvedPassId = passId || id;
  const resolvedTitle = title || eventTitle;
  const resolvedAttendee = participantName || attendeeName;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const textToCopy = `GetAPass Digital Ticket\nEvent: ${resolvedTitle}\nPass ID: ${resolvedPassId}\nAttendee: ${resolvedAttendee}\nDate: ${date} at ${time}\nVenue: ${venue}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="gateapass-digital-pass-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto'
      }}
    >
      {/* ============================================================== */}
      {/* UNIVERSAL 3D DIGITAL EVENT TICKET STAGE                         */}
      {/* ============================================================== */}
      <div className="getapass-studio-stage">
        {/* Stage Top Brand & Tagline Header */}
        <div className="getapass-stage-header">
          <div className="getapass-stage-brand">
            <div className="getapass-stage-brand-mark">
              <svg viewBox="0 0 36 36" width="30" height="30" fill="none">
                <path d="M18 3L4 32H13L18 20L23 32H32L18 3Z" fill="url(#stageLogoGrad)" />
                <path d="M14.5 24H21.5L18 16L14.5 24Z" fill="#FAF5FF" opacity="0.9" />
                <defs>
                  <linearGradient id="stageLogoGrad" x1="4" y1="3" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8E2CFC" />
                    <stop offset="1" stopColor="#C026D3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="getapass-stage-brand-name">GetAPass</span>
          </div>

          <div className="getapass-stage-tagline-wrap">
            <div className="getapass-stage-tagline-line" />
            <span className="getapass-stage-tagline">Discover • Book • Experience</span>
          </div>
        </div>

        {/* 3D Interactive Ticket wrapped in Error Boundary */}
        <TicketErrorBoundary>
          <Ticket3D
            pass={pass}
            isInteractive={true}
            onFlipToggle={(flipped) => setIsFlipped(flipped)}
          />
        </TicketErrorBoundary>

        {/* Interactive Hint */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#6d5d85',
            marginTop: '8px'
          }}
        >
          <Info size={14} style={{ color: '#8E2CFC' }} />
          <span>Hover or move cursor to tilt 3D ticket · Click ticket to flip for entry clearances</span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '680px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            paddingTop: '4px'
          }}
        >
          <Button
            variant="outline"
            icon={RotateCw}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ minWidth: '150px' }}
          >
            {isFlipped ? 'Show Front' : 'Flip Details'}
          </Button>

          <Button
            variant="outline"
            icon={copied ? CheckCircle : Share2}
            onClick={handleShare}
            style={{ minWidth: '150px' }}
          >
            {copied ? 'Details Copied!' : 'Share Pass ID'}
          </Button>

          <Button
            variant="primary"
            icon={Printer}
            onClick={handlePrint}
            style={{
              minWidth: '160px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            Print / Save PDF
          </Button>
        </div>
      )}
    </div>
  );
}
