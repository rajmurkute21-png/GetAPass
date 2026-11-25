import React from 'react';
import { motion } from 'framer-motion';
import { Home, Ticket, User, Calendar, QrCode } from 'lucide-react';

/**
 * GetAPass Mobile-First Floating Liquid Glass Navigation
 * Matches Design Reference: Floating glass capsule with frosted reflection,
 * active violet illumination, animated sliding indicator, and center glowing QR scan action button.
 */
export default function MobileBottomNav({
  activeTab,
  activeItem,
  onTabChange,
  onSelect
}) {
  const currentTab = activeTab || activeItem || 'landing';
  const handleSelect = onSelect || onTabChange || (() => {});

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'my-passes', label: 'My Passes', icon: Ticket },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="liquid-glass-nav-container" aria-label="Mobile Bottom Navigation">
      <div className="liquid-glass-nav-pill">
        {/* 1. Home */}
        <motion.button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'landing' ? 'is-active' : ''}`}
          onClick={() => handleSelect('landing')}
          whileTap={{ scale: 0.92 }}
          aria-label="Home"
          style={{ position: 'relative' }}
        >
          {currentTab === 'landing' && (
            <motion.div
              layoutId="activeBottomNavPill"
              style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.22)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <div className="liquid-glass-nav-icon-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <Home size={19} strokeWidth={currentTab === 'landing' ? 2.4 : 1.8} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>Home</span>
        </motion.button>

        {/* 2. My Passes */}
        <motion.button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'my-passes' ? 'is-active' : ''}`}
          onClick={() => handleSelect('my-passes')}
          whileTap={{ scale: 0.92 }}
          aria-label="My Passes"
          style={{ position: 'relative' }}
        >
          {currentTab === 'my-passes' && (
            <motion.div
              layoutId="activeBottomNavPill"
              style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.22)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <div className="liquid-glass-nav-icon-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <Ticket size={19} strokeWidth={currentTab === 'my-passes' ? 2.4 : 1.8} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>My Passes</span>
        </motion.button>

        {/* 3. Center Floating Action Button (FAB): Rapid QR Pass Scanner */}
        <motion.button
          type="button"
          className="liquid-glass-nav-fab"
          onClick={() => handleSelect('scan')}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Quick Pass Access & QR Scanner"
          title="Instant 3D Pass & QR Access"
        >
          <div className="liquid-glass-nav-fab-pulse" />
          <QrCode size={23} strokeWidth={2.4} />
        </motion.button>

        {/* 4. Events */}
        <motion.button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'events' ? 'is-active' : ''}`}
          onClick={() => handleSelect('events')}
          whileTap={{ scale: 0.92 }}
          aria-label="Events"
          style={{ position: 'relative' }}
        >
          {currentTab === 'events' && (
            <motion.div
              layoutId="activeBottomNavPill"
              style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.22)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <div className="liquid-glass-nav-icon-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <Calendar size={19} strokeWidth={currentTab === 'events' ? 2.4 : 1.8} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>Events</span>
        </motion.button>

        {/* 5. Profile */}
        <motion.button
          type="button"
          className={`liquid-glass-nav-item ${currentTab === 'profile' ? 'is-active' : ''}`}
          onClick={() => handleSelect('profile')}
          whileTap={{ scale: 0.92 }}
          aria-label="Profile"
          style={{ position: 'relative' }}
        >
          {currentTab === 'profile' && (
            <motion.div
              layoutId="activeBottomNavPill"
              style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.22)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <div className="liquid-glass-nav-icon-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <User size={19} strokeWidth={currentTab === 'profile' ? 2.4 : 1.8} />
          </div>
          <span style={{ position: 'relative', zIndex: 1 }}>Profile</span>
        </motion.button>
      </div>
    </nav>
  );
}
