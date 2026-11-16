import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Printer, CheckCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import PassCanvas from '../studio/PassCanvas';
import { getTemplateById } from '../../data/passTemplates';

export default function DigitalPass({
  pass,
  showActions = true
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    id = 'GP-TF26-9481',
    eventTitle = 'TechFest 2026',
    passType = 'Participant Pass',
    attendeeName = 'Aarav Shah',
    authority = 'Participant',
    date = '15 October 2026',
    time = '10:00 AM – 8:00 PM',
    venue = 'Zeal College, Pune',
    gate = 'Gate A',
    status = 'Active',
    price = 199,
    paymentMethod = 'UPI',
    templateSnapshot,
    templateId
  } = pass || {};

  const templateToRender = templateSnapshot || (templateId ? getTemplateById(templateId) : null);

  const canvasData = {
    event: {
      id: pass?.eventId || 'event-id',
      name: eventTitle,
      title: eventTitle,
      date,
      time,
      venue
    },
    participant: {
      name: attendeeName,
      email: pass?.email || '',
      phone: pass?.phone || ''
    },
    pass: {
      id,
      type: passType,
      authority,
      gate,
      status,
      price,
      paymentMethod,
      accessAreas: pass?.permissions || ['General Area']
    }
  };

  useEffect(() => {
    // Generate clean functional QR code for the pass ID
    const qrPayload = JSON.stringify({
      passId: id,
      event: eventTitle,
      attendee: attendeeName,
      authority: authority,
      status: status
    });

    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [id, eventTitle, attendeeName, authority, status]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="gateapass-digital-pass-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
        maxWidth: '390px',
        margin: '0 auto'
      }}
    >
      {templateToRender ? (
        <PassCanvas
          template={templateToRender}
          data={canvasData}
          isInteractive={false}
          viewMode="desktop"
        />
      ) : (
        /* Default Classic Pass Card */
        <div
          className="gateapass-digital-pass-card"
          style={{
            width: '100%',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            textAlign: 'left'
          }}
        >
          {/* Black Top Bar with GateApass Logo */}
          <div
            style={{
              backgroundColor: 'var(--color-near-black)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  backgroundColor: 'var(--color-violet)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-white)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 5v14" />
                  <path d="M17 5v14" />
                </svg>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.3px' }}>
                GateApass
              </span>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--color-light-violet)'
              }}
            >
              Digital Pass
            </span>
          </div>

          {/* Pass Body */}
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-deep-violet)',
                  letterSpacing: '0.8px'
                }}
              >
                {passType}
              </span>
              <StatusBadge status={status} />
            </div>

            <div>
              <h2
                style={{
                  fontSize: '26px',
                  lineHeight: '32px',
                  fontWeight: 700,
                  color: 'var(--color-dark-text)',
                  letterSpacing: '-0.5px'
                }}
              >
                {eventTitle}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                {date} · {time} · {gate}
              </p>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-gray)',
                borderRadius: '4px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${id}`}
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '180px', height: '180px', backgroundColor: 'var(--color-off-white)' }} />
              )}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: 'var(--color-dark-text)',
                  textTransform: 'uppercase'
                }}
              >
                ILLUSTRATIVE · VERIFIED AT GATE
              </span>
            </div>

            {/* Attendee Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-gray)'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  Attendee
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '2px' }}>
                  {attendeeName}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  Pass ID
                </span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-deep-violet)', marginTop: '2px' }}>
                  {id}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  Authority
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)', marginTop: '2px' }}>
                  {authority}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  Venue
                </span>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-dark-text)', marginTop: '2px' }}>
                  {venue}
                </p>
              </div>
            </div>

            {/* Guidelines footer inside pass */}
            <div
              style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--color-gray)',
                fontSize: '12px',
                color: 'var(--color-muted-text)',
                lineHeight: '16px'
              }}
            >
              Bring your college ID. A pass admits one participant and may be used for entry once. Paid ₹{price} via {paymentMethod}.
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            justifyContent: 'stretch'
          }}
        >
          <Button
            variant="outline"
            icon={copied ? CheckCircle : Share2}
            onClick={handleShare}
            style={{ flex: 1 }}
          >
            {copied ? 'Pass ID Copied' : 'Share ID'}
          </Button>

          <Button
            variant="primary"
            icon={Printer}
            onClick={handlePrint}
            style={{ flex: 1 }}
          >
            Print Pass
          </Button>
        </div>
      )}
    </div>
  );
}
