import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

/**
 * TicketCategorySelector (Booking Step 1)
 * Interactive animated pass selection with multi-tier support, dynamic pricing,
 * and quantity controls.
 */
export default function TicketCategorySelector({
  passes = [],
  quantities = {},
  onUpdateQuantity,
  onContinue
}) {
  const totalCount = Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0);
  const totalAmount = passes.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Select Ticket Category & Quantity
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          Choose single or multiple pass tiers for you and your group.
        </p>
      </div>

      {/* Ticket Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {passes.map((pass) => {
          const qty = quantities[pass.id] || 0;
          const isSelected = qty > 0;

          return (
            <motion.div
              key={pass.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: isSelected
                  ? '2px solid #7C3AED'
                  : '1px solid rgba(226, 232, 240, 0.95)',
                backgroundColor: isSelected ? 'rgba(245, 243, 255, 0.65)' : '#FFFFFF',
                boxShadow: isSelected
                  ? '0 8px 24px -4px rgba(124, 58, 237, 0.15)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                transition: 'border-color 0.2s ease, background-color 0.2s ease'
              }}
            >
              {/* Pass Tier Details */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: isSelected ? '#7C3AED' : '#64748B',
                      background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      letterSpacing: '0.4px'
                    }}
                  >
                    Official Pass
                  </span>
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Instant Access
                  </span>
                </div>

                <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '4px 0' }}>
                  {pass.name}
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '18px' }}>
                  {pass.description || 'Full access to event venue, exhibits, and entry turnstiles.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                    ₹{pass.price}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ pass</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#F8FAFC',
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onUpdateQuantity(pass.id, -1)}
                  disabled={qty === 0}
                  aria-label={`Decrease ${pass.name} quantity`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: qty === 0 ? '#CBD5E1' : '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: qty === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Minus size={15} />
                </motion.button>

                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    minWidth: '24px',
                    textAlign: 'center',
                    color: '#0F172A'
                  }}
                >
                  {qty}
                </span>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onUpdateQuantity(pass.id, 1)}
                  aria-label={`Increase ${pass.name} quantity`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <Plus size={15} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Dynamic Total & Advance */}
      <div
        style={{
          marginTop: '8px',
          padding: '18px 20px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Selection ({totalCount} {totalCount === 1 ? 'ticket' : 'tickets'})
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
            ₹{totalAmount}
          </div>
        </div>

        <Button
          variant="liquid-glass"
          size="large"
          icon={ArrowRight}
          iconPosition="right"
          disabled={totalCount === 0}
          onClick={onContinue}
          style={{ minWidth: '180px' }}
        >
          Continue to Details
        </Button>
      </div>
    </div>
  );
}
