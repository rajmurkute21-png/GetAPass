import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '480px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="gateapass-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 13, 0.45)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 1000
      }}
    >
      <div
        className="gateapass-drawer"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          backgroundColor: 'var(--color-white)',
          borderLeft: '1px solid var(--color-gray)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--color-gray)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '22px',
                lineHeight: '28px',
                fontWeight: 600,
                color: 'var(--color-dark-text)',
                letterSpacing: '-0.3px'
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted-text)',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px'
          }}
        >
          {children}
        </div>

        {/* Drawer Sticky Footer */}
        {footer && (
          <div
            style={{
              padding: '20px 28px',
              borderTop: '1px solid var(--color-gray)',
              backgroundColor: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
