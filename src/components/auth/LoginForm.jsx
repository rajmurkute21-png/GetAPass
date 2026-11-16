import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../services/authService';
import Input from '../common/Input';
import Button from '../common/Button';
import Logo from '../common/Logo';
import GoogleButton from './GoogleButton';
import AuthError from './AuthError';

export default function LoginForm({ onSwitchToSignup, onSwitchToForgot }) {
  const { loginWithEmail, loginWithGoogle, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleSubmitting(false);
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
          Welcome Back
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', margin: 0 }}>
          Access your events, passes and account.
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

      {/* Google Login Trigger */}
      <GoogleButton
        onClick={handleGoogleLogin}
        loading={googleSubmitting}
        disabled={submitting || googleSubmitting}
        text="Continue with Google"
      />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray)' }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          OR
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-gray)' }} />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || googleSubmitting}
          autoComplete="email"
          required
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-dark-text)' }}>
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgot}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12px',
                color: 'var(--color-deep-violet)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Forgot password?
            </button>
          </div>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || googleSubmitting}
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={submitting || googleSubmitting}
        >
          {submitting ? 'Signing In...' : 'LOGIN'}
        </Button>
      </form>

      {/* Switch to Signup */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: 'var(--color-deep-violet)',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
