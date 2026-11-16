import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  helperText,
  error,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  style = {},
  ...props
}) {
  const [focused, setFocused] = React.useState(false);
  const selectId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
          htmlFor={selectId}
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
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: 'var(--height-control)',
            paddingLeft: '14px',
            paddingRight: '36px',
            backgroundColor: disabled ? 'var(--color-off-white)' : 'var(--color-white)',
            border: error
              ? '1.5px solid var(--color-error)'
              : focused
              ? '1.5px solid var(--color-deep-violet)'
              : '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-control)',
            outline: 'none',
            fontSize: '14px',
            color: value ? 'var(--color-dark-text)' : 'var(--color-muted-text)',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s ease'
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const isObj = typeof opt === 'object';
            const val = isObj ? opt.value : opt;
            const text = isObj ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>

        <div
          style={{
            position: 'absolute',
            right: '12px',
            pointerEvents: 'none',
            color: error ? 'var(--color-error)' : 'var(--color-muted-text)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {error ? <AlertCircle size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={1.8} />}
        </div>
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
