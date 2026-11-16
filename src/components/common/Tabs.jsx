import React from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '', style = {} }) {
  return (
    <div
      className={`gateapass-tabs ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--color-gray)',
        overflowX: 'auto',
        ...style
      }}
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'object' ? tab.id : tab;
        const label = typeof tab === 'object' ? tab.label : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-deep-violet)' : 'var(--color-dark-text)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--color-violet)' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-off-white)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {label}
            {count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'var(--color-light-violet)' : 'var(--color-off-white)',
                  color: isActive ? 'var(--color-deep-violet)' : 'var(--color-muted-text)'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
