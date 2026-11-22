import React from 'react';

/**
 * GetAPass Glassmorphism Smooth Toggle Switch
 * Visual Aesthetic: Frosted glassmorphism with soft gradients, subtle ambient lighting,
 * and cool blue palette with light and dark tranquil contrasts.
 */
export default function GlassToggle({
  checked = false,
  onChange,
  disabled = false,
  size = 'medium', // 'small' | 'medium' | 'large'
  variant = 'cool-blue', // 'cool-blue' (serene ice & deep blue) | 'violet-pink' (brand)
  label,
  id,
  className = '',
  style = {}
}) {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (onChange) onChange(!checked);
    }
  };

  return (
    <div
      className={`liquid-glass-toggle-container ${disabled ? 'is-disabled' : ''} ${className}`}
      style={style}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label || 'Toggle switch'}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`liquid-glass-toggle-track size-${size} variant-${variant} ${checked ? 'is-checked' : ''}`}
      >
        <span className="liquid-glass-toggle-ambient" />
        <span className="liquid-glass-toggle-thumb">
          <span className="liquid-glass-toggle-specular" />
        </span>
      </button>
      {label && (
        <span className="liquid-glass-toggle-label" onClick={handleClick}>
          {label}
        </span>
      )}
    </div>
  );
}
