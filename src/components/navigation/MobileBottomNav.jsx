import React from 'react';
import { Home, Ticket, User, Calendar } from 'lucide-react';

/**
 * GateApass Mobile Bottom Navigation
 * Matches Screenshot 24: Home, Events, My Passes, Profile
 */
export default function MobileBottomNav({
  activeTab,
  activeItem,
  onTabChange,
  onSelect
}) {
  const currentTab = activeTab || activeItem || 'events';
  const handleSelect = onSelect || onTabChange || (() => {});
  const tabs = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'my-passes', label: 'My Passes', icon: Ticket },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="gap-bottom-nav" aria-label="Mobile navigation">
      <div className="gap-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`gap-bottom-item ${isActive ? 'is-active' : ''}`}
              onClick={() => handleSelect(tab.id)}
            >
              <div
                style={{
                  padding: '3px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--light-violet)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? 'var(--deep-violet)' : 'currentColor'} />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
