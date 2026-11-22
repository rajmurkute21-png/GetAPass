import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * GetAPass Official Logo Loader
 *
 * A compact, elegant loading animation using the exact official GetAPass logo.
 * Features:
 * - 3D vertical axis flip with perspective effect
 * - Smooth scale pulse during the flip cycle (1.2s)
 * - Soft Electric Violet and Pink radial ambient backlight glow
 * - Tiny elegant 3-dot sequenced pulse indicator below
 * - Accessible: respects prefers-reduced-motion
 * - Variants: 'full-page' (48px), 'section' (38px), 'button' (20px)
 */
export default function LogoLoader({
  variant = 'section', // 'full-page' | 'section' | 'button' | 'compact'
  size = null,          // optional custom height override in px
  theme = 'auto',       // 'auto' | 'dark' | 'light'
  text = null,          // optional caption message below
  showIndicator = true, // tiny 3-dot indicator below logo
  className = '',
  style = {}
}) {
  const shouldReduceMotion = useReducedMotion();

  // 1. Resolve exact logo height based on variant guidelines
  let resolvedHeight = 38;
  if (typeof size === 'number' && size > 0) {
    resolvedHeight = size;
  } else if (variant === 'full-page') {
    resolvedHeight = 48; // 40-56px range
  } else if (variant === 'section') {
    resolvedHeight = 38; // 36-44px range
  } else if (variant === 'button' || variant === 'compact') {
    resolvedHeight = 20; // 18-22px range
  }

  // 2. Select authentic brand logo asset
  // For button / compact variant: use the official square ticket badge mark (/brand/favicon.png)
  // For full-page / section: use the official main logo (/brand/logo-dark.png or /brand/logo-light.png)
  const isButtonVariant = variant === 'button' || variant === 'compact';
  let logoSrc = '/brand/logo-light.png';
  let aspectRatio = 612 / 156; // ~3.92

  if (isButtonVariant) {
    logoSrc = '/brand/favicon.png';
    aspectRatio = 116 / 110; // ~1.05
  } else if (theme === 'dark') {
    logoSrc = '/brand/logo-dark.png';
  } else if (theme === 'light') {
    logoSrc = '/brand/logo-light.png';
  } else {
    // 'auto': use logo-dark if inside dark/liquid-glass surfaces, otherwise logo-light
    logoSrc = '/brand/logo-dark.png';
  }

  const calculatedWidth = Math.round(resolvedHeight * aspectRatio);

  // 3. Animation cycle configuration (~1.2 seconds)
  const flipTransition = shouldReduceMotion
    ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
    : {
        duration: 1.25,
        repeat: Infinity,
        ease: [0.4, 0.0, 0.2, 1]
      };

  const glowTransition = {
    duration: 1.25,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  // 4. Render compact button variant
  if (isButtonVariant) {
    return (
      <div
        className={`getapass-logo-loader getapass-logo-loader-button ${className}`}
        role="status"
        aria-label="Loading..."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          verticalAlign: 'middle',
          lineHeight: 1,
          ...style
        }}
      >
        <div
          style={{
            position: 'relative',
            perspective: '600px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Subtle button backlighting glow */}
          <motion.div
            animate={
              shouldReduceMotion
                ? { opacity: 0.6 }
                : {
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.9, 1.15, 0.9]
                  }
            }
            transition={glowTransition}
            style={{
              position: 'absolute',
              width: `${resolvedHeight * 1.3}px`,
              height: `${resolvedHeight * 1.3}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(142, 44, 252, 0.5) 0%, rgba(236, 72, 153, 0.3) 50%, transparent 75%)',
              filter: 'blur(6px)',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          {/* Logo 3D Flip */}
          <motion.img
            src={logoSrc}
            alt="Loading..."
            height={resolvedHeight}
            width={calculatedWidth}
            animate={
              shouldReduceMotion
                ? { opacity: [0.75, 1, 0.75] }
                : {
                    rotateY: [0, 180, 360],
                    scale: [1, 1.08, 1]
                  }
            }
            transition={flipTransition}
            style={{
              height: `${resolvedHeight}px`,
              width: `${calculatedWidth}px`,
              display: 'block',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
              transformStyle: 'preserve-3d',
              userSelect: 'none'
            }}
            onError={(e) => {
              if (!e.target.src.includes('brand/')) {
                e.target.src = '/brand/favicon.png';
              }
            }}
          />
        </div>

        {text && (
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'inherit' }}>
            {text}
          </span>
        )}
      </div>
    );
  }

  // 5. Render full-page and section variants
  const isFullPage = variant === 'full-page';

  return (
    <div
      className={`getapass-logo-loader getapass-logo-loader-${variant} ${className}`}
      role="status"
      aria-label={text || 'Loading content...'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: isFullPage ? '65vh' : 'auto',
        padding: isFullPage ? '48px 24px' : '36px 16px',
        textAlign: 'center',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Centered 3D Perspective Stage for Logo */}
      <div
        style={{
          position: 'relative',
          perspective: '800px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px'
        }}
      >
        {/* Soft Electric Violet & Pink Radial Ambient Backlight Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? { opacity: 0.6 }
              : {
                  opacity: [0.45, 0.85, 0.45],
                  scale: [0.94, 1.08, 0.94]
                }
          }
          transition={glowTransition}
          style={{
            position: 'absolute',
            width: `${Math.max(calculatedWidth + 32, 120)}px`,
            height: `${resolvedHeight + 36}px`,
            borderRadius: '9999px',
            background:
              'radial-gradient(ellipse at center, rgba(142, 44, 252, 0.38) 0%, rgba(236, 72, 153, 0.22) 50%, transparent 72%)',
            filter: 'blur(16px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Official GetAPass Logo with 3D Flip & Scale Pulse */}
        <motion.div
          animate={
            shouldReduceMotion
              ? { opacity: [0.8, 1, 0.8] }
              : {
                  rotateY: [0, 180, 360],
                  scale: [1, 1.05, 1]
                }
          }
          transition={flipTransition}
          style={{
            position: 'relative',
            zIndex: 1,
            transformStyle: 'preserve-3d',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          <img
            src={logoSrc}
            alt="GetAPass"
            height={resolvedHeight}
            width={calculatedWidth}
            style={{
              height: `${resolvedHeight}px`,
              width: `${calculatedWidth}px`,
              display: 'block',
              objectFit: 'contain',
              maxWidth: '100%',
              filter: 'drop-shadow(0 4px 14px rgba(124, 58, 237, 0.28))'
            }}
            onError={(e) => {
              if (!e.target.src.includes('brand/')) {
                e.target.src = '/brand/logo-dark.png';
              }
            }}
          />
        </motion.div>
      </div>

      {/* Tiny Elegant Loading Indicator (Sequenced 3-Dot Pulse) */}
      {showIndicator && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            marginTop: '12px'
          }}
          aria-hidden="true"
        >
          {[
            { color: '#8E2CFC', delay: 0 },
            { color: '#9333EA', delay: 0.16 },
            { color: '#EC4899', delay: 0.32 }
          ].map((dot, i) => (
            <motion.span
              key={i}
              animate={
                shouldReduceMotion
                  ? { opacity: [0.4, 0.9, 0.4] }
                  : {
                      scale: [0.75, 1.25, 0.75],
                      opacity: [0.35, 1, 0.35]
                    }
              }
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot.delay,
                ease: 'easeInOut'
              }}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: dot.color,
                boxShadow: `0 0 6px ${dot.color}`,
                display: 'inline-block'
              }}
            />
          ))}
        </div>
      )}

      {/* Optional Minimal Status Text */}
      {text && (
        <p
          style={{
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--color-muted-text, #94A3B8)',
            marginTop: '10px',
            letterSpacing: '0.2px',
            margin: '10px 0 0',
            lineHeight: '18px'
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
