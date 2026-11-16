import React from 'react';
import { Calendar, MapPin, Download, Ticket } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function PassCard({
  pass,
  onViewPass
}) {
  const {
    id,
    eventTitle,
    passType,
    date,
    time,
    venue,
    status = 'Active'
  } = pass;

  return (
    <div
      className="gateapass-card gateapass-pass-card"
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'left'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ color: 'var(--color-violet)' }}>
          <Ticket size={22} strokeWidth={2} />
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Pass Title & Subtitle */}
      <div>
        <h3
          style={{
            fontSize: '22px',
            lineHeight: '26px',
            fontWeight: 700,
            color: 'var(--color-dark-text)',
            letterSpacing: '-0.3px',
            textTransform: 'uppercase'
          }}
        >
          {eventTitle}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
          {passType} · 1 participant
        </p>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-gray)' }} />

      {/* Date & Location */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-dark-text)'
          }}
        >
          <Calendar size={16} strokeWidth={1.8} style={{ color: 'var(--color-muted-text)' }} />
          <span>{date} · {time}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--color-muted-text)'
          }}
        >
          <MapPin size={16} strokeWidth={1.8} />
          <span>{venue}</span>
        </div>
      </div>

      {/* Mini QR Box matching Screenshot 23 */}
      <div
        style={{
          backgroundColor: 'var(--color-off-white)',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        {/* Simple crisp QR graphic */}
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm8-2h3v3h-3v-3zm5 0h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3z" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            {id}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', lineHeight: '15px' }}>
            Illustrative QR only. Present your issued pass at entry.
          </span>
        </div>
      </div>

      {/* Button */}
      <Button
        variant="outline"
        icon={Download}
        fullWidth
        onClick={onViewPass}
      >
        View pass
      </Button>
    </div>
  );
}
