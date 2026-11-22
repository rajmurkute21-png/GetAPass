import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasRole, getUserRole, ROLE_LABELS } from '../../services/permissionService';
import Button from '../common/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * GateApass — Unified Authentication, Email Verification & Role-Based Guard (ProtectedRoute)
 *
 * Capabilities:
 * 1. Checks session loading state
 * 2. Enforces authentication (redirects or shows Sign In prompt)
 * 3. Enforces verified email status for email/password accounts
 * 4. Enforces role-based permissions (admin, organizer, verifier, participant)
 * 5. Provides customizable unauthorized / fallback views
 */
export default function ProtectedRoute({
  children,
  fallback = null,
  unauthorizedFallback = null,
  requireVerifiedEmail = true,
  allowedRoles = null,
  onNavigateHome = null
}) {
  const { isAuthenticated, user, loading, openAuthModal, setAuthModalView } = useAuth();

  // 1. Loading state
  if (loading) {
    return (
      <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-muted-text)' }}>
        <div
          style={{
            display: 'inline-block',
            width: '28px',
            height: '28px',
            border: '2px solid var(--color-violet)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ fontSize: '13px', marginTop: '12px' }}>Checking authorization session...</p>
      </div>
    );
  }

  // 2. Authentication check
  if (!isAuthenticated || !user) {
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
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-light-violet)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-deep-violet)'
          }}
        >
          <ShieldAlert size={24} />
        </div>
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

  // 3. Email verification check for email/password accounts
  if (requireVerifiedEmail && !user.isEmailVerified && !user.isGoogle) {
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
          Email Verification Required
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', lineHeight: '20px' }}>
          Your account ({user.email}) requires email verification before accessing this feature.
          Please check your inbox or click below to verify.
        </p>
        <Button
          variant="primary"
          size="large"
          onClick={() => {
            if (setAuthModalView) setAuthModalView('verify');
            if (openAuthModal) openAuthModal('verify');
          }}
        >
          Verify Email Now
        </Button>
      </div>
    );
  }

  // 4. Role authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = hasRole(user, allowedRoles);

    if (!isAuthorized) {
      if (unauthorizedFallback) return unauthorizedFallback;

      const userRole = getUserRole(user);
      const userRoleLabel = ROLE_LABELS[userRole] || userRole;
      const requiredLabels = allowedRoles.map((r) => ROLE_LABELS[r] || r).join(' or ');

      return (
        <div
          style={{
            padding: '64px 24px',
            maxWidth: '520px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE4E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D92D20'
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Access Restricted
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', lineHeight: '22px' }}>
            Your account ({user.email}) has the role of <strong>{userRoleLabel}</strong>.
            This area requires <strong>{requiredLabels}</strong> permissions.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {onNavigateHome && (
              <Button variant="secondary" icon={ArrowLeft} onClick={onNavigateHome}>
                Return to Events
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                if (window.location.hash || window.location.pathname !== '/') {
                  window.location.hash = '';
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
            >
              Explore Public Events
            </Button>
          </div>
        </div>
      );
    }
  }

  return children;
}
