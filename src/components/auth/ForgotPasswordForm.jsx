import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../services/authService';
import { generateVerificationCode } from '../../services/otpSecurityService';
import Input from '../common/Input';
import Button from '../common/Button';
import Logo from '../common/Logo';
import AuthError from './AuthError';
import OTPVerificationForm from './OTPVerificationForm';

export default function ForgotPasswordForm({ onBackToLogin }) {
  const { sendPasswordReset, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'otp' | 'completed'
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Generate secure 5-minute OTP with 60s cooldown
      generateVerificationCode(email.trim(), 'password-reset');

      // 2. Send Firebase reset link if configured
      if (isFirebaseConfigured) {
        try {
          await sendPasswordReset(email.trim());
        } catch (firebaseErr) {
          console.warn('[GateApass] Firebase reset link notice:', firebaseErr);
        }
      }

      setStep('otp');
    } catch (err) {
      setError(err?.message || mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'otp') {
    return (
      <OTPVerificationForm
        identifier={email.trim()}
        purpose="password-reset"
        title="Verify Reset Code"
        subtitle="Enter the 6-digit verification code to confirm password reset."
        onVerified={() => setStep('completed')}
        onBack={() => setStep('request')}
      />
    );
  }

  if (step === 'completed') {
    return (
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <Logo size="default" />
          <h2
            className="text-h2"
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--color-dark-text)',
              marginTop: '8px'
            }}
          >
            Verification Complete
          </h2>
        </div>

        <div
          style={{
            padding: '24px 20px',
            backgroundColor: '#EDF7ED',
            border: '1px solid #C8E6C9',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Password Reset Authorized
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '20px', margin: 0 }}>
            Your 6-digit code has been securely verified. The password reset instructions for <strong>{email}</strong> are now confirmed.
          </p>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={onBackToLogin}
            style={{ marginTop: '12px' }}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
        <Logo size="default" />
        <h2
          className="text-h2"
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--color-dark-text)',
            marginTop: '8px'
          }}
        >
          Reset Password
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', margin: 0 }}>
          Enter your registered email. We will generate a time-limited 5-minute security code.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            backgroundColor: '#FEF0C7',
            border: '1px solid #FDB022',
            borderRadius: 'var(--radius-control)',
            fontSize: '13px',
            color: '#B54708',
            lineHeight: '19px'
          }}
        >
          <strong>Configuration Required:</strong> Firebase environment variables are not detected on this deployment. Please configure <code>VITE_FIREBASE_*</code> keys in Vercel Project Settings and redeploy.
        </div>
      )}

      <AuthError message={error} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={submitting}
          icon={KeyRound}
        >
          {submitting ? 'Generating Security Code...' : 'GENERATE 5-MIN RESET CODE'}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0',
            fontSize: '13px',
            color: 'var(--color-muted-text)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={14} />
          Back to Login
        </button>
      </form>
    </div>
  );
}
