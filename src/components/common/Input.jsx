import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helperText,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  name,
  id,
  className = '',
  style = {},
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isPasswordType = type === 'password';
  const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  const paddingRight = error ? (isPasswordType ? '68px' : '40px') : (isPasswordType ? '40px' : '14px');

  return (
    <div
      className={`gateapass-form-control ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        textAlign: 'left',
        ...style
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 500,
            color: 'var(--color-dark-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--color-muted-text)'
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: 'var(--height-control)',
            paddingLeft: Icon ? '40px' : '14px',
            paddingRight,
            backgroundColor: disabled ? 'var(--color-off-white)' : 'var(--color-white)',
            border: error
              ? '1.5px solid var(--color-error)'
              : focused
              ? '1.5px solid var(--color-electric-violet, #7C3AED)'
              : '1px solid var(--color-border-solid, #E9E5F0)',
            borderRadius: 'var(--radius-control)',
            outline: 'none',
            fontSize: '14px',
            color: disabled ? 'var(--color-muted-text)' : 'var(--color-dark-text)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: focused ? '0 0 0 3px rgba(124, 58, 237, 0.12)' : 'none'
          }}
          {...props}
        />

        {isPasswordType && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: error ? '36px' : '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#777487',
              padding: '4px'
            }}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--color-error)'
            }}
          >
            <AlertCircle size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      {(error || helperText) && (
        <span
          style={{
            fontSize: '12px',
            lineHeight: '16px',
            color: error ? 'var(--color-error)' : 'var(--color-muted-text)'
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
