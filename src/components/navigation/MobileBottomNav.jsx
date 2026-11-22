import React from 'react';
import { Home, Ticket, User, Calendar, QrCode } from 'lucide-react';

/**
 * GetAPass Mobile-First Floating Liquid Glass Navigation
 * Matches Design Reference: Floating glass capsule with frosted reflection,
 * active violet illumination, and center glowing QR scan action button.
 */
export default function MobileBottomNav({
  activeTab,
  activeItem,
  onTabChange,
  onSelect
}) {
  const currentTab = activeTab || activeItem || 'landing';
  const handleSelect = onSelect || onTabChange || (() => {});

  return (
    <nav className="liquid-glass-nav-container" aria-label="Mobile Bottom Navigation">
      <div className="liquid-glass-nav-pill">
        {/* 1. Home */}
        <button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'landing' ? 'is-active' : ''}`}
          onClick={() => handleSelect('landing')}
          aria-label="Home"
        >
          <div className="liquid-glass-nav-icon-wrap">
            <Home size={19} strokeWidth={currentTab === 'landing' ? 2.4 : 1.8} />
          </div>
          <span>Home</span>
        </button>

        {/* 2. My Passes */}
        <button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'my-passes' ? 'is-active' : ''}`}
          onClick={() => handleSelect('my-passes')}
          aria-label="My Passes"
        >
          <div className="liquid-glass-nav-icon-wrap">
            <Ticket size={19} strokeWidth={currentTab === 'my-passes' ? 2.4 : 1.8} />
          </div>
          <span>My Passes</span>
        </button>

        {/* 3. Center Floating Action Button (FAB): Rapid QR Pass Scanner */}
        <button
          type="button"
          className="liquid-glass-nav-fab"
          onClick={() => handleSelect('scan')}
          aria-label="Quick Pass Access & QR Scanner"
          title="Instant 3D Pass & QR Access"
        >
          <div className="liquid-glass-nav-fab-pulse" />
          <QrCode size={23} strokeWidth={2.4} />
        </button>

        {/* 4. Events */}
        <button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'events' ? 'is-active' : ''}`}
          onClick={() => handleSelect('events')}
          aria-label="Events"
        >
          <div className="liquid-glass-nav-icon-wrap">
            <Calendar size={19} strokeWidth={currentTab === 'events' ? 2.4 : 1.8} />
          </div>
          <span>Events</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'profile' ? 'is-active' : ''}`}
          onClick={() => handleSelect('profile')}
          aria-label="Profile"
        >
          <div className="liquid-glass-nav-icon-wrap">
            <User size={19} strokeWidth={currentTab === 'profile' ? 2.4 : 1.8} />
          </div>
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
}
