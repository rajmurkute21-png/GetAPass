import React from 'react';
import { Calendar, MapPin, Check } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function EventCard({
  event,
  onBook,
  onViewDetails
}) {
  const {
    title,
    category,
    date,
    time,
    venue,
    startingPrice,
    status = 'Active',
    bannerImage,
    description
  } = event;

  return (
    <div
      className="gateapass-card gateapass-event-card"
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        transition: 'border-color 0.15s ease'
      }}
    >
      {/* Event media clipped to top 8px card */}
      <div
        style={{
          width: '100%',
          height: '210px',
          backgroundColor: 'var(--color-near-black)',
          position: 'relative',
          overflow: 'hidden',
          cursor: onViewDetails ? 'pointer' : 'default'
        }}
        onClick={onViewDetails}
      >
        <img
          src={bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Internal Content (20px internal padding per spec) */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1
        }}
      >
        {/* Category & Status Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-deep-violet)',
              letterSpacing: '0.5px'
            }}
          >
            {category}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Title & Tagline */}
        <div>
          <h3
            style={{
              fontSize: '22px',
              lineHeight: '28px',
              fontWeight: 700,
              color: 'var(--color-dark-text)',
              letterSpacing: '-0.4px',
              cursor: onViewDetails ? 'pointer' : 'default'
            }}
            onClick={onViewDetails}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              color: 'var(--color-muted-text)',
              marginTop: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </p>
        </div>

        {/* Date & Venue Metas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-dark-text)'
            }}
          >
            <Calendar size={16} strokeWidth={1.8} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
            <span>{date} · {time}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-dark-text)'
            }}
          >
            <MapPin size={16} strokeWidth={1.8} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
            <span>{venue}</span>
          </div>
        </div>

        {/* Pricing Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--color-off-white)'
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-dark-text)',
              letterSpacing: '-0.3px'
            }}
          >
            ₹{startingPrice}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-muted-text)' }}>
            per participant
          </span>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          icon={Check}
          fullWidth
          onClick={onBook}
        >
          Book event
        </Button>
      </div>
    </div>
  );
}
