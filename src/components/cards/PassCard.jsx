import React from 'react';
import { Calendar, MapPin, Eye, Ticket, Sparkles, Trash2, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { resolveTicketTheme, resolvePassTypeTheme } from '../../constants/ticketThemes';

export default function PassCard({
  pass,
  onViewPass,
  onDeletePass
}) {
  const {
    id,
    passId,
    eventTitle,
    title,
    passType = 'Standard Pass',
    category = 'Concert',
    date,
    time,
    venue,
    price,
    unitPrice,
    amount,
    bookingId: _bookingId,
    ticketIndex,
    totalTickets,
    _authority,
    status = 'Active'
  } = pass || {};

  const resolvedId = passId || id;
  const resolvedTitle = title || eventTitle;
  const resolvedPrice = (price !== undefined && price !== null)
    ? price
    : (unitPrice !== undefined && unitPrice !== null
        ? unitPrice
        : (amount !== undefined ? amount : 0));
  const theme = resolveTicketTheme(category, resolvedTitle);
  const passTierTheme = resolvePassTypeTheme(passType);

  return (
    <div
      className="gateapass-card gateapass-pass-card"
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        position: 'relative',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Top Category Accent Line */}
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: theme.primary || '#7C3AED'
        }}
      />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: theme.badgeBg,
              color: theme.primary,
              border: `1px solid ${theme.badgeBorder}`
            }}
          >
            <Sparkles size={12} />
            <span>{theme.label}</span>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* Pass Title & Subtitle */}
        <div>
          <h3
            style={{
              fontSize: '19px',
              lineHeight: '25px',
              fontWeight: 800,
              color: 'var(--color-dark-text)',
              letterSpacing: '-0.3px',
              margin: 0
            }}
          >
            {resolvedTitle}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px', fontWeight: 500 }}>
            {passType} · ₹{resolvedPrice}{totalTickets && totalTickets > 1 ? ` · Ticket ${ticketIndex || 1} of ${totalTickets}` : ' · 1 participant'}
          </p>
        </div>

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
            <Calendar size={15} strokeWidth={2} style={{ color: theme.primary }} />
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
            <MapPin size={15} strokeWidth={2} />
            <span>{venue}</span>
          </div>
        </div>

        {/* Perforated Divider with Side Notches */}
        <div style={{ position: 'relative', margin: '4px -20px' }}>
          <div
            style={{
              position: 'absolute',
              left: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-off-white)',
              border: '1px solid var(--color-gray)'
            }}
          />
          <div
            style={{
              borderTop: '1px dashed var(--color-gray)',
              width: '100%',
              height: '1px'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-off-white)',
              border: '1px solid var(--color-gray)'
            }}
          />
        </div>

        {/* Pass Access Token Pill */}
        <div
          style={{
            backgroundColor: passTierTheme.badgeBg,
            border: `1px solid ${passTierTheme.badgeBorder}`,
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={16} color={passTierTheme.primary} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark-text)', letterSpacing: '0.5px' }}>
              {resolvedId}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-dark-text)' }}>
              ₹{resolvedPrice}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: passTierTheme.primary }}>
              {passTierTheme.tag || passType}
            </span>
          </div>
        </div>

        {/* Check-in verification notice if used */}
        {String(status).toLowerCase() === 'used' && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} color="#7C3AED" />
              <span>Checked In · Gate {pass.checkedInGate || pass.gate || 'A'}</span>
            </div>
            {pass.checkedInAt && (
              <span style={{ fontSize: '10px', opacity: 0.85 }}>
                {new Date(pass.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Concluded notice if expired */}
        {String(status).toLowerCase() === 'expired' && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              fontSize: '11px',
              fontWeight: 500,
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} color="#6B7280" />
            <span>Event has concluded</span>
          </div>
        )}

        {/* Action Button Row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <Button
            variant="outline"
            icon={Eye}
            fullWidth
            onClick={onViewPass}
            style={{
              borderColor: 'var(--color-gray)',
              fontWeight: 600
            }}
          >
            View Pass
          </Button>

          {onDeletePass && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete pass "${resolvedId}"?`)) {
                  onDeletePass(resolvedId);
                }
              }}
              title="Delete pass"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-control)',
                border: '1px solid #FECDCA',
                backgroundColor: '#FEF3F2',
                color: '#B42318',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
