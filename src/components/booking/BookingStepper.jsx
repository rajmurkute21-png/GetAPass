import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * BookingStepper
 * Modern animated multi-step booking progress indicator.
 * Steps: 1: Select Tickets -> 2: Attendee Details -> 3: Payment
 */
export default function BookingStepper({
  currentStep = 1,
  steps = [
    { number: 1, title: 'Select Tickets', subtitle: 'Choose passes & tier' },
    { number: 2, title: 'Attendee Details', subtitle: 'Participant info' },
    { number: 3, title: 'Payment', subtitle: 'Review & confirm' }
  ],
  onStepClick
}) {
  return (
    <div style={{ width: '100%', marginBottom: '32px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          maxWidth: '680px',
          margin: '0 auto'
        }}
      >
        {/* Background Connecting Line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '32px',
            right: '32px',
            height: '3px',
            backgroundColor: '#E2E8F0',
            zIndex: 0
          }}
        />

        {/* Animated Active Progress Line */}
        <motion.div
          style={{
            position: 'absolute',
            top: '20px',
            left: '32px',
            height: '3px',
            background: '#7C3AED',
            boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)',
            zIndex: 1,
            transformOrigin: 'left'
          }}
          initial={{ width: '0%' }}
          animate={{
            width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Step Nodes */}
        {steps.map((s) => {
          const isCompleted = currentStep > s.number;
          const isActive = currentStep === s.number;
          const isClickable = onStepClick && isCompleted;

          return (
            <div
              key={s.number}
              onClick={() => isClickable && onStepClick(s.number)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 2,
                cursor: isClickable ? 'pointer' : 'default',
                minWidth: '90px'
              }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : 1,
                  backgroundColor: isCompleted
                    ? '#7C3AED'
                    : isActive
                    ? '#9333EA'
                    : '#FFFFFF',
                  borderColor: isCompleted || isActive ? '#7C3AED' : '#CBD5E1',
                  color: isCompleted || isActive ? '#FFFFFF' : '#64748B'
                }}
                transition={{ duration: 0.25 }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 700,
                  boxShadow: isActive
                    ? '0 0 16px rgba(147, 51, 234, 0.4), 0 4px 10px rgba(0, 0, 0, 0.1)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)'
                }}
              >
                {isCompleted ? <Check size={18} strokeWidth={2.6} /> : s.number}
              </motion.div>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0F172A' : '#64748B',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s.title}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#94A3B8',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
