import React from 'react';

/**
 * GetApass Brand Logo Component
 * Supports multiple variants ('light', 'dark', 'monochrome', 'icon') and responsive sizes.
 * Matches the official GetApass identity system (tilted purple ticket badge + bold typography).
 */
export default function Logo({
  size = 'medium',
  variant = 'light',
  className = '',
  onClick,
  style = {}
}) {
  // Height determinations based on size prop
  let height = 32;
  if (typeof size === 'number') {
    height = size;
  } else if (size === 'small') {
    height = 26;
  } else if (size === 'large') {
    height = 44;
  } else if (size === 'xlarge') {
    height = 54;
  } else {
    height = 32; // default / medium
  }

  // Determine which asset to display based on variant
  let logoSrc = '/brand/logo-light.png';
  let aspectRatio = 612 / 156; // ~3.92
  let altText = 'GetApass';

  if (variant === 'dark') {
    logoSrc = '/brand/logo-dark.png';
  } else if (variant === 'icon' || variant === 'mark') {
    logoSrc = '/brand/favicon.png';
    aspectRatio = 116 / 110; // ~1.05
    altText = 'GetApass Icon';
  } else if (variant === 'monochrome') {
    logoSrc = '/brand/logo-monochrome.png';
    aspectRatio = 344 / 90; // ~3.82
    altText = 'GetApass Monochrome';
  }

  const calculatedWidth = Math.round(height * aspectRatio);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) : undefined}
      className={`getapass-logo ${className}`}
      title="GetApass"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        lineHeight: 1,
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        ...style
      }}
    >
      <img
        src={logoSrc}
        alt={altText}
        height={height}
        width={calculatedWidth}
        style={{
          height: `${height}px`,
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback if public asset is resolving differently
          if (e.target.src.indexOf('/public/') === -1 && !e.target.src.includes('brand/')) {
            e.target.src = '/brand/logo-light.png';
          }
        }}
      />
    </div>
  );
}
