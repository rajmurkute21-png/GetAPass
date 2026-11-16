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
  LogOut
} from 'lucide-react';
import Logo from '../common/Logo';

export default function AdminSidebar({
  activeTab = 'dashboard',
  onSelectTab,
  onLogout
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
        backgroundColor: 'var(--color-white)',
        borderRight: '1px solid var(--color-gray)',
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
            Zeal College Pune
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
            Organiser workspace
          </p>
        </div>
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
                borderRadius: 'var(--radius-control)',
                backgroundColor: isActive ? 'var(--color-light-violet)' : 'transparent',
                color: isActive ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease'
              }}
            >
              <IconComp size={18} strokeWidth={isActive ? 2 : 1.7} />
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
            MP
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
              Meera Patel
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted-text)' }}>
              Administrator
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
