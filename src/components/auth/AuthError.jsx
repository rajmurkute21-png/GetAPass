import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * GateApass — Authentication Error Alert Banner
 * Displays user-friendly, safe error messages without exposing internals.
 */
export default function AuthError({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        backgroundColor: '#FDF2F2',
        border: '1px solid #F8D7DA',
        borderLeft: '4px solid var(--color-error)',
        borderRadius: 'var(--radius-control)',
        color: 'var(--color-error)',
        fontSize: '13px',
        lineHeight: '18px',
        fontFamily: 'var(--font-family)',
        textAlign: 'left'
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{message}</span>
    </div>
  );
}
