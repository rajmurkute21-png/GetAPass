import React from 'react';
import LogoLoader from './LogoLoader';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'violet' | 'danger' | 'text' | 'liquid-glass' | 'liquid-secondary'
  liquidGlass = false, // selective Liquid Glass visual styling
  size = 'medium',    // 'medium' (44px) | 'compact' (36px) | 'large' (48px)
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const isActionDisabled = disabled || loading;
  const isLiquidGlass = liquidGlass || variant === 'liquid-glass';
  const isLiquidSecondary = variant === 'liquid-secondary';

  const getVariantStyles = () => {
    if (isLiquidGlass) {
      return {
        // base styles handled by .gateapass-btn-liquid-glass
      };
    }
    if (isLiquidSecondary) {
      return {
        // base styles handled by .gateapass-btn-liquid-secondary
      };
    }
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-black)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-light-violet)',
          color: 'var(--color-near-black)',
          border: '1px solid var(--color-light-violet)'
        };
      case 'outline':
        return {
          backgroundColor: 'var(--color-white)',
          color: 'var(--color-black)',
          border: '1px solid var(--color-black)'
        };
      case 'violet':
        return {
          backgroundColor: 'var(--color-violet)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-violet)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-error)'
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-black)',
          border: '1px solid transparent'
        };
      default:
        return {
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)',
          border: '1px solid var(--color-black)'
        };
    }
  };

  const getHeight = () => {
    if (size === 'compact') return '36px';
    if (size === 'large') return '48px';
    return '44px'; // 44px default per spec
  };

  const getPadding = () => {
    if (size === 'compact') return '0 12px';
    if (size === 'large') return '0 20px';
    return '0 16px'; // 16px horizontal padding per spec
  };

  return (
    <button
      type={type}
      disabled={isActionDisabled}
      onClick={onClick}
      className={`gateapass-btn gateapass-btn-${variant} ${isLiquidGlass ? 'gateapass-btn-liquid-glass' : ''} ${isLiquidSecondary ? 'gateapass-btn-liquid-secondary' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px', // 8px icon gap
        height: getHeight(),
        padding: getPadding(),
        borderRadius: 'var(--radius-control)', // 4px radius strictly rectangular, no pill
        fontFamily: 'var(--font-family)',
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        cursor: isActionDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        ...getVariantStyles(),
        ...style
      }}
      {...props}
    >
      {loading ? (
        <>
          <LogoLoader variant="button" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={16} strokeWidth={1.8} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={16} strokeWidth={1.8} />}
        </>
      )}
    </button>
  );
}
