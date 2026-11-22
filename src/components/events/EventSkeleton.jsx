import React from 'react';

/**
 * EventSkeleton Loader
 * Matches exact geometry of EventCard to prevent layout shifts during Firebase data fetches.
 */
export default function EventSkeleton({ count = 3 }) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px'
      }}
    >
      {skeletons.map((idx) => (
        <div
          key={idx}
          className="gateapass-card gateapass-skeleton-card"
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left'
          }}
          aria-hidden="true"
        >
          {/* Media placeholder with shimmer */}
          <div className="gateapass-shimmer" style={{ width: '100%', height: '210px' }} />

          {/* Content padding */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {/* Category & Status Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="gateapass-shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
              <div className="gateapass-shimmer" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
            </div>

            {/* Title & Description lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="gateapass-shimmer" style={{ width: '85%', height: '24px', borderRadius: '4px' }} />
              <div className="gateapass-shimmer" style={{ width: '100%', height: '14px', borderRadius: '4px' }} />
              <div className="gateapass-shimmer" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
            </div>

            {/* Meta rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="gateapass-shimmer" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                <div className="gateapass-shimmer" style={{ width: '140px', height: '13px', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="gateapass-shimmer" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                <div className="gateapass-shimmer" style={{ width: '100px', height: '13px', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Price & CTA placeholder */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-off-white)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="gateapass-shimmer" style={{ width: '90px', height: '22px', borderRadius: '4px' }} />
              <div className="gateapass-shimmer" style={{ width: '100%', height: '44px', borderRadius: 'var(--radius-control)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
