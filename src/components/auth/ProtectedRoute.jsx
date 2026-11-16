import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

/**
 * GateApass — Authentication Guard (ProtectedRoute)
 * Checks ONLY whether the user is authenticated.
 * Does NOT evaluate roles or permissions in this phase.
 */
export default function ProtectedRoute({ children, fallback = null }) {
  const { isAuthenticated, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--color-violet)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '13px', marginTop: '12px' }}>Checking authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return fallback;

    return (
      <div
        style={{
          padding: '64px 24px',
          maxWidth: '480px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
          Sign In Required
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
          Please sign in to your GateApass account to access this page.
        </p>
        <Button variant="primary" size="large" onClick={() => openAuthModal('login')}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return children;
}
