import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../services/authService';
import Input from '../common/Input';
import Button from '../common/Button';
import Logo from '../common/Logo';
import AuthError from './AuthError';

export default function ForgotPasswordForm({ onBackToLogin }) {
  const { sendPasswordReset, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
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
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

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
          Enter your registered email and we&apos;ll send a password reset link.
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

      {sent ? (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--color-off-white)',
            border: '1px solid var(--color-gray)',
            borderRadius: 'var(--radius-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Reset Link Sent
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', lineHeight: '19px', margin: 0 }}>
            Password reset instructions have been sent to <strong>{email}</strong> if an account exists with that address.
          </p>
          <Button
            variant="outline"
            size="default"
            onClick={onBackToLogin}
            style={{ marginTop: '8px' }}
          >
            Back to Login
          </Button>
        </div>
      ) : (
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
          >
            {submitting ? 'Sending Link...' : 'SEND RESET LINK'}
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
      )}
    </div>
  );
}
