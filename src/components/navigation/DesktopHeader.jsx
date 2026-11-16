import React from 'react';
import { Bell } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function DesktopHeader({
  activeView,
  onNavigate,
  unreadCount = 0,
  user
}) {
  const { user: authUser, isAuthenticated, loading, openAuthModal } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'GP';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'GP';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const activeUser = authUser || user;
  const userInitials = activeUser?.avatarInitials || getInitials(activeUser?.displayName || activeUser?.name);
  const displayName = activeUser?.displayName || activeUser?.name || 'Account';
  return (
    <header
      className="gateapass-desktop-header"
      style={{
        height: 'var(--header-desktop-height)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-64)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Logo onClick={() => onNavigate('landing')} />

        {/* Attendee Navigation Links (CRITICAL RULE: NEVER show "My Passes" here) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onNavigate('events')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: activeView === 'events' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
              backgroundColor: activeView === 'events' ? 'var(--color-light-violet)' : 'transparent',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer'
            }}
          >
            Explore Events
          </button>
          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: activeView === 'how-it-works' ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
              backgroundColor: activeView === 'how-it-works' ? 'var(--color-light-violet)' : 'transparent',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer'
            }}
          >
            How It Works
          </button>
        </nav>
      </div>

      {/* Right: Notifications & Profile (Authenticated) or Sign In / Sign Up (Unauthenticated) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {loading ? (
          <div
            style={{
              width: '100px',
              height: '34px',
              backgroundColor: 'var(--color-off-white)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-gray)',
              opacity: 0.6
            }}
          />
        ) : isAuthenticated ? (
          <>
            {/* Notifications Icon with unread badge */}
            <button
              type="button"
              onClick={() => onNavigate('profile', 'notifications')}
              aria-label="Notifications"
              style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-dark-text)',
                backgroundColor: 'transparent'
              }}
            >
              <Bell size={20} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--color-violet)',
                    borderRadius: '50%'
                  }}
                />
              )}
            </button>

            {/* Profile Avatar Trigger (CRITICAL: My Passes is accessible here) */}
            <div
              onClick={() => onNavigate('profile')}
              title="Account & My Passes"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 8px 4px 4px',
                border: '1px solid var(--color-gray)',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeView === 'profile' ? 'var(--color-off-white)' : 'var(--color-white)'
              }}
            >
              {activeUser?.photoURL ? (
                <img
                  src={activeUser.photoURL}
                  alt={displayName}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover'
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--color-black)',
                    color: 'var(--color-white)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  {userInitials}
                </div>
              )}
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-dark-text)',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {displayName}
              </span>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-dark-text)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-black)',
                border: '1px solid var(--color-black)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
          </>
        )}
      </div>
    </header>
  );
}
