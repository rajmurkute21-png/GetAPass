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
    // 1. Locate the live ticket DOM node
    const ticketNode = document.getElementById('getapass-printable-ticket');
    if (!ticketNode) {
      window.print();
      return;
    }

    // 2. Create an isolated offscreen iframe to ensure ZERO profile/avatar bleed
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.setAttribute('title', 'GetAPass Ticket Print Target');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Collect all stylesheets from host document
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    // Clone the ticket markup without 3D tilt or hover glare
    const clonedTicket = ticketNode.cloneNode(true);
    clonedTicket.classList.remove('is-floating');
    clonedTicket.style.transform = 'none';
    clonedTicket.style.transition = 'none';
    clonedTicket.style.boxShadow = 'none';

    // Build the isolated printable HTML containing ONLY the ticket
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GetAPass Ticket - ${resolvedTitle} (${resolvedPassId})</title>
          <meta charset="utf-8" />
          ${headStyles}
          <style>
            @page {
              size: landscape;
              margin: 6mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            #getapass-printable-ticket {
              width: 760px !important;
              max-width: 760px !important;
              height: 310px !important;
              margin: 0 auto !important;
              transform: none !important;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
              page-break-inside: avoid !important;
            }
            .ticket-flip-inner {
              transform: none !important;
            }
            .ticket-face.ticket-front {
              display: flex !important;
              position: relative !important;
            }
            .ticket-face.ticket-back {
              display: none !important;
            }
            .ticket-notch-top, .ticket-notch-bottom, .ticket-perforation-line,
            .ticket-notch-outer-left, .ticket-notch-outer-right {
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
            ${clonedTicket.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow styles and QR image to initialize, then trigger print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('[GetAPass Print] Iframe print fallback:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 2000);
      }
    }, 350);
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
