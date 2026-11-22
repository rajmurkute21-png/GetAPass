import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, Check } from 'lucide-react';

/**
 * AnimatedPaymentButton
 * Premium animated CTA for payment execution with state transitions:
 * idle -> processing -> animated checkmark -> complete.
 */
export default function AnimatedPaymentButton({
  amount = 0,
  isProcessing = false,
  isSuccess = false,
  disabled = false,
  onClick
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled || isProcessing || isSuccess}
      onClick={onClick}
      whileHover={!disabled && !isProcessing && !isSuccess ? { scale: 1.01, y: -1.5 } : {}}
      whileTap={!disabled && !isProcessing && !isSuccess ? { scale: 0.98 } : {}}
      className="gateapass-btn-liquid-glass"
      style={{
        width: '100%',
        height: '52px',
        fontSize: '16px',
        fontWeight: 700,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: disabled || isProcessing || isSuccess ? 'not-allowed' : 'pointer',
        background: isSuccess
          ? 'linear-gradient(135deg, #059669 0%, #10B981 100%) !important'
          : 'linear-gradient(135deg, #9333EA 0%, #7C3AED 52%, #EC4899 100%) !important',
        boxShadow: isSuccess
          ? '0 8px 24px -4px rgba(16, 185, 129, 0.45) !important'
          : 'var(--liquid-glass-shadow-btn), var(--liquid-glass-specular) !important',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {/* Animated SVG Checkmark */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M4 12l5 5L20 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </svg>
            <span>Payment Confirmed</span>
          </motion.div>
        ) : isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Loader2 size={20} className="gateapass-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processing Secured Payment...</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShieldCheck size={20} strokeWidth={2.2} />
            <span>Confirm & Pay ₹{amount}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
