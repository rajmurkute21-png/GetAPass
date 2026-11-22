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
          backgroundColor: 'var(--color-electric-violet, #7C3AED)',
          color: '#FFFFFF',
          border: '1px solid var(--color-electric-violet, #7C3AED)',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        };
      case 'secondary':
      case 'outline':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          color: 'var(--color-electric-violet, #7C3AED)',
          border: '1.5px solid var(--color-electric-violet, #7C3AED)',
          boxShadow: '0 2px 8px rgba(24, 21, 38, 0.04)'
        };
      case 'violet':
        return {
          backgroundColor: 'var(--color-electric-violet, #7C3AED)',
          color: '#FFFFFF',
          border: '1px solid var(--color-electric-violet, #7C3AED)',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.28)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-error, #D92D20)',
          color: '#FFFFFF',
          border: '1px solid var(--color-error, #D92D20)'
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-primary-text, #181526)',
          border: '1px solid transparent'
        };
      default:
        return {
          backgroundColor: 'var(--color-electric-violet, #7C3AED)',
          color: '#FFFFFF',
          border: '1px solid var(--color-electric-violet, #7C3AED)'
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
