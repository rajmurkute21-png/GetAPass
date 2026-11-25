import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  CreditCard,
  QrCode,
  ShieldAlert,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import Logo from '../common/Logo';

export default function AdminSidebar({
  activeTab = 'dashboard',
  onSelectTab,
  onLogout,
  onBackToPortal,
  currentUser = null
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'passes', label: 'Pass Builder', icon: Ticket },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'verification', label: 'Verification', icon: QrCode },
    { id: 'authorities', label: 'Authorities', icon: ShieldAlert },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className="gateapass-admin-sidebar"
      style={{
        width: 'var(--sidebar-admin-width)',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid #E9E5F0',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        textAlign: 'left'
      }}
    >
      {/* Workspace Header matching Screenshot 24 */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--color-gray)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <Logo size="small" />
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            GetAPass Platform
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
            Platform Administration
          </p>
        </div>

        {onBackToPortal && (
          <button
            type="button"
            onClick={onBackToPortal}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-deep-violet)',
              backgroundColor: 'var(--color-light-violet)',
              border: '1px solid rgba(172, 88, 233, 0.3)',
              borderRadius: 'var(--radius-control)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Exit to Public Portal</span>
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComp = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '12px',
                backgroundColor: isActive ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                color: isActive ? '#7C3AED' : '#181526',
                border: isActive ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={18} strokeWidth={isActive ? 2.2 : 1.7} style={{ color: isActive ? '#7C3AED' : '#777487' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer matching Screenshot 24 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-gray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {currentUser?.avatarInitials || (currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'AD')}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.displayName || currentUser?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
              Verified Admin
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            style={{
              padding: '6px',
              color: 'var(--color-muted-text)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
