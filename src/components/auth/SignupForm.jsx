import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../services/authService';
import Input from '../common/Input';
import Button from '../common/Button';
import Logo from '../common/Logo';
import GoogleButton from './GoogleButton';
import AuthError from './AuthError';

export default function SignupForm({ onSwitchToLogin }) {
  const { signupWithEmail, loginWithGoogle, isFirebaseConfigured, configStatus } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signupWithEmail(email.trim(), password, fullName.trim());
      // Clear password from local component state
      setPassword('');
      setConfirmPassword('');
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
          Create your GateApass account
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', margin: 0 }}>
          Access verified campus event passes, tickets, and organiser tools.
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
          <strong>Configuration Required:</strong> Firebase Authentication is not initialized on this deployment.
          {configStatus?.missing?.length > 0 && (
            <div style={{ marginTop: '6px', fontSize: '12px' }}>
              Missing environment variables: <code>{configStatus.missing.join(', ')}</code>
            </div>
          )}
          <div style={{ marginTop: '6px', fontSize: '12px' }}>
            To fix: Add these keys in <strong>Vercel Dashboard &gt; Project Settings &gt; Environment Variables</strong>, then trigger a redeploy.
          </div>
        </div>
      )}

      <AuthError message={error} />

      {/* Google Quick Signup */}
      <GoogleButton
        onClick={handleGoogleLogin}
        loading={googleSubmitting}
        disabled={submitting || googleSubmitting || !isFirebaseConfigured}
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

      {/* Signup Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Full Name"
          placeholder="e.g. Raj Murkute"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={submitting || googleSubmitting}
          autoComplete="name"
          helperText="Used on your official digital passes and identity tickets."
          required
        />

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

        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting || googleSubmitting}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={submitting || googleSubmitting}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={submitting || googleSubmitting || !isFirebaseConfigured}
          style={{ marginTop: '6px' }}
        >
          {submitting ? 'Creating Account...' : !isFirebaseConfigured ? 'Configuration Required' : 'CREATE ACCOUNT'}
        </Button>
      </form>

      {/* Switch to Login */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '4px' }}>
        Existing account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
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
          Login
        </button>
      </div>
    </div>
  );
}
