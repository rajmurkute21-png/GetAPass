import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Button from '../common/Button';

/**
 * StickyBookingSummary
 * Smooth compact frosted glass summary bar that slides in during scrolling.
 */
export default function StickyBookingSummary({
  event,
  visible = true,
  onBook
}) {
  if (!event) return null;

  const { title, category, date, venue, startingPrice } = event;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            zIndex: 75,
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 0 16px rgba(124, 58, 237, 0.06)'
          }}
        >
          <div
            className="container-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            {/* Event Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#9333EA',
                  background: 'rgba(147, 51, 234, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.4px',
                  flexShrink: 0
                }}
              >
                {category}
              </span>
              <div style={{ minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  <span>{date}</span>
                  <span>·</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{venue}</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Starting at</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>₹{startingPrice}</div>
              </div>

              {onBook && (
                <Button
                  variant="liquid-glass"
                  size="compact"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={onBook}
                >
                  Book Pass
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
