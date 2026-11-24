import React, { useState } from 'react';
import { Calendar, MapPin, Check, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImgHovered, setIsImgHovered] = useState(false);

  const isSoldOut = Boolean(event.isSoldOut || (event.capacity && Number(event.totalSoldCount || 0) >= Number(event.capacity)));
  const isUnavailable = isSoldOut || ['disabled', 'removed', 'pending', 'rejected', 'cancelled'].includes(String(status).toLowerCase());

  return (
    <motion.div
      className="gateapass-card gateapass-event-card"
      whileHover={{ y: -4, boxShadow: '0 12px 28px -6px rgba(124, 58, 237, 0.12)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        position: 'relative'
      }}
    >
      {/* Event media */}
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
        onMouseEnter={() => setIsImgHovered(true)}
        onMouseLeave={() => setIsImgHovered(false)}
      >
        <img
          src={bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: isImgHovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
          }}
        />

        {/* Favorite Save Button */}
        <motion.button
          type="button"
          aria-label={isFavorite ? 'Remove from saved' : 'Save event'}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 14, 38, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isFavorite ? '#EC4899' : '#FFFFFF',
            zIndex: 2,
            transition: 'background-color 0.2s ease'
          }}
        >
          <Heart size={18} fill={isFavorite ? '#EC4899' : 'none'} strokeWidth={isFavorite ? 2.2 : 1.8} />
        </motion.button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusBadge status={status} />
            {isSoldOut && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#DC2626',
                  backgroundColor: '#FEE2E2',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.4px'
                }}
              >
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
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
              display: isExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: isExpanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </p>

          {description && description.length > 90 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0 0',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-deep-violet)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isExpanded ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>Read more <ChevronDown size={14} /></>
              )}
            </button>
          )}
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
          variant={isUnavailable ? 'secondary' : 'primary'}
          icon={isSoldOut ? null : Check}
          fullWidth
          disabled={isUnavailable}
          onClick={isUnavailable ? undefined : onBook}
        >
          {isSoldOut ? 'Sold Out' : isUnavailable ? 'Unavailable' : 'Book event'}
        </Button>
      </div>
    </motion.div>
  );
}
