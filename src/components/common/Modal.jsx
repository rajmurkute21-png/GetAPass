import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText,
  cancelText = 'Dismiss',
  onConfirm,
  confirmVariant = 'primary',
  confirmLoading = false,
  maxWidth = '480px'
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
      className="gateapass-modal-overlay"
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        className="gateapass-modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: maxWidth,
          backgroundColor: 'var(--color-white)',
          border: 'var(--border-default)',
          borderRadius: 'var(--radius-modal)',
          padding: '28px',
          boxShadow: 'none', // Flat per design geometry spec
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {title && (
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
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
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

        <div style={{ fontSize: '15px', lineHeight: '22px', color: 'var(--color-muted-text)' }}>
          {children}
        </div>

        {(confirmText || cancelText) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px'
            }}
          >
            {cancelText && (
              <Button variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
            )}
            {confirmText && (
              <Button
                variant={confirmVariant}
                loading={confirmLoading}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
