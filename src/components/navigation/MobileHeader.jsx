import React from 'react';
import { Search, Bell } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function MobileHeader({
  onNavigate,
  onSearchClick,
  unreadCount = 0
}) {
  const { user, isAuthenticated, loading, openAuthModal } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'GP';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'GP';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className="gateapass-mobile-header"
      style={{
        height: 'var(--header-mobile-height)',
        padding: '0 var(--space-16)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <Logo size="small" onClick={() => onNavigate('landing')} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search events"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-dark-text)'
          }}
        >
          <Search size={19} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile', 'notifications')}
          aria-label="Notifications"
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-dark-text)'
          }}
        >
          <Bell size={19} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--color-violet)',
                borderRadius: '50%'
              }}
            />
          )}
        </button>

        {!loading && (
          isAuthenticated ? (
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              aria-label="Profile"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid var(--color-gray)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: 'var(--color-black)',
                    color: 'var(--color-white)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {user?.avatarInitials || getInitials(user?.displayName)}
                </div>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-black)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )
        )}
      </div>
    </div>
  );
}
