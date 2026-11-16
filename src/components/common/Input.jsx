import React from 'react';
import { AlertCircle } from 'lucide-react';

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
  const [focused, setFocused] = React.useState(false);
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
          type={type}
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
            paddingRight: error ? '40px' : '14px',
            backgroundColor: disabled ? 'var(--color-off-white)' : 'var(--color-white)',
            border: error
              ? '1.5px solid var(--color-error)'
              : focused
              ? '1.5px solid var(--color-deep-violet)'
              : '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-control)',
            outline: 'none',
            fontSize: '14px',
            color: disabled ? 'var(--color-muted-text)' : 'var(--color-dark-text)',
            transition: 'border-color 0.15s ease'
          }}
          {...props}
        />

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
