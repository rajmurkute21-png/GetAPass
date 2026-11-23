import React from 'react';

export default function StatusBadge({
  status = 'Active',
  className = '',
  style = {}
}) {
  const normalized = status.toLowerCase();

  let dotColor = 'var(--color-success)';
  let textColor = 'var(--color-success)';
  let borderColor = 'var(--color-gray)';
  let bgColor = 'var(--color-white)';

  if (normalized === 'active' || normalized === 'confirmed' || normalized === 'valid') {
    dotColor = 'var(--color-success)';
    textColor = 'var(--color-success)';
  } else if (normalized === 'upcoming' || normalized === 'in progress' || normalized === 'ready') {
    dotColor = 'var(--color-violet)';
    textColor = 'var(--color-deep-violet)';
  } else if (normalized === 'pending' || normalized === 'caution' || normalized === 'warning') {
    dotColor = 'var(--color-warning)';
    textColor = 'var(--color-warning)';
  } else if (normalized === 'failed' || normalized === 'invalid' || normalized === 'cancelled' || normalized === 'suspended') {
    dotColor = 'var(--color-error)';
    textColor = 'var(--color-error)';
  } else if (normalized === 'used' || normalized === 'redeemed' || normalized === 'checked-in') {
    dotColor = '#7C3AED';
    textColor = '#6D28D9';
    bgColor = 'rgba(124, 58, 237, 0.08)';
    borderColor = 'rgba(124, 58, 237, 0.25)';
  } else if (normalized === 'expired' || normalized === 'inactive' || normalized === 'refunded') {
    dotColor = 'var(--color-light-muted)';
    textColor = 'var(--color-muted-text)';
  }

  return (
    <span
      className={`gateapass-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-badge)',
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: 500,
        color: textColor,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: dotColor,
          borderRadius: '1px', // subtle square indicator as in Figma
          display: 'inline-block'
        }}
      />
      {status}
    </span>
  );
}
