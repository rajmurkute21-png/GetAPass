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
  maxWidth = '520px',
  padding = '24px 28px'
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
        backgroundColor: 'rgba(15, 10, 30, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="gateapass-modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: maxWidth ? (maxWidth.includes('px') ? `min(${maxWidth}, calc(100vw - 32px))` : maxWidth) : '520px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: padding,
          boxShadow: '0 28px 70px -12px rgba(124, 58, 237, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          maxHeight: '94vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="gateapass-modal-header no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            width: '100%'
          }}
        >
          {title ? (
            <h3
              style={{
                fontSize: '20px',
                lineHeight: '26px',
                fontWeight: 700,
                color: 'var(--color-dark-text)',
                letterSpacing: '-0.3px',
                margin: 0
              }}
            >
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-dark-text)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="gateapass-modal-body"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'visible'
          }}
        >
          {children}
        </div>

        {(confirmText || cancelText) && (
          <div
            className="gateapass-modal-footer no-print"
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
