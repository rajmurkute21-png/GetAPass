import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Mail, Phone, Building2, Ticket } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

/**
 * AttendeeDetailsForm (Booking Step 2)
 * Collects attendee registration details with real-time validation and
 * a preserved pass breakdown summary.
 */
export default function AttendeeDetailsForm({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  institution,
  setInstitution,
  errors = {},
  selectedPassesList = [],
  totalAmount = 0,
  onBack,
  onContinue
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Attendee Credentials
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          Your digital pass will be issued to these verified contact credentials.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Left: Input Form */}
        <div
          style={{
            padding: '24px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Input
            label="Full Name"
            icon={User}
            placeholder="e.g. Aarav Shah"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="e.g. aarav@campus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            helperText="Official digital pass and QR code will be delivered here."
            required
          />

          <Input
            label="Mobile Phone"
            type="tel"
            icon={Phone}
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            helperText="Used for gate entry identification and check-in SMS updates."
            required
          />

          <Input
            label="Institution / College (Optional)"
            icon={Building2}
            placeholder="e.g. Zeal College of Engineering, Pune"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        {/* Right: Booking Summary Breakdown Card */}
        <div
          style={{
            padding: '24px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: 'fit-content'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={18} style={{ color: '#7C3AED' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Order Breakdown
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedPassesList.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#334155',
                  paddingBottom: '8px',
                  borderBottom: '1px dashed #CBD5E1'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>
                    {p.qty} × ₹{p.price}
                  </span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{p.qty * p.price}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
            <span>Platform Fee</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>₹0 (Waived)</span>
          </div>

          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #CBD5E1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline'
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Total</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>₹{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginTop: '8px'
        }}
      >
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={onBack}
        >
          Back to Tickets
        </Button>

        <Button
          variant="liquid-glass"
          size="large"
          icon={ArrowRight}
          iconPosition="right"
          onClick={onContinue}
        >
          Continue to Payment
        </Button>
      </div>
    </motion.div>
  );
}
