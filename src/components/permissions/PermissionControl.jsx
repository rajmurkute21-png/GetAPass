import React from 'react';
import { Shield, Lock } from 'lucide-react';

export default function PermissionControl({
  title = 'Verify event passes',
  description = 'Scan QR codes and record attendee entry.',
  allowed = true,
  disabled = false,
  onChange,
  icon: CustomIcon
}) {
  const Icon = CustomIcon || (disabled ? Lock : Shield);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray)',
        borderRadius: 'var(--radius-card)',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div
          style={{
            marginTop: '2px',
            color: 'var(--color-dark-text)'
          }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <div>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-dark-text)',
              marginBottom: '4px'
            }}
          >
            {title}
          </h4>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-muted-text)',
              lineHeight: '18px'
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-dark-text)' }}>
          {allowed ? 'Allowed' : 'Restricted'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={allowed}
          disabled={disabled}
          onClick={() => onChange && !disabled && onChange(!allowed)}
          style={{
            width: '44px',
            height: '24px',
            backgroundColor: allowed ? 'var(--color-violet)' : 'var(--color-gray)',
            borderRadius: '12px', // standard toggle pill is acceptable for toggle switches
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: 0,
            transition: 'background-color 0.2s ease'
          }}
        >
          <span
            style={{
              display: 'block',
              width: '18px',
              height: '18px',
              backgroundColor: 'var(--color-white)',
              borderRadius: '50%',
              position: 'absolute',
              top: '3px',
              left: allowed ? '23px' : '3px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          />
        </button>
      </div>
    </div>
  );
}
