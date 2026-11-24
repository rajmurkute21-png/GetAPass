import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Logo from '../common/Logo';
import AuthError from './AuthError';

export default function VerifyEmailPrompt({ onBackToLogin, onContinue }) {
  const { user, reloadUser, resendVerification, closeAuthModal } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckVerified = async () => {
    setError('');
    setChecking(true);
    try {
      const refreshedUser = await reloadUser();
      if (refreshedUser && refreshedUser.emailVerified) {
        if (onContinue) {
          onContinue();
        } else {
          closeAuthModal();
        }
      } else {
        setError('Email not verified yet. Please click the confirmation link sent to your inbox, then click "I\'ve Verified".');
      }
    } catch {
      setError('Could not verify status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setResending(true);
    setResendStatus('');
    try {
      await resendVerification();
      setCooldown(60); // 60-second cooldown timer
      setResendStatus('Verification link resent. Please check your inbox and spam folder.');
    } catch (err) {
      setError(err?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
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
          Verify your email
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', margin: 0 }}>
          We&apos;ve sent a verification link to your email address:
        </p>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-off-white)',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-control)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Mail size={22} style={{ color: 'var(--color-deep-violet)', flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-text)' }}>
          {user?.email || 'your email'}
        </span>
      </div>

      <AuthError message={error} />

      {resendStatus && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#EDF7ED',
            border: '1px solid #C8E6C9',
            borderRadius: 'var(--radius-control)',
            fontSize: '13px',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle size={16} />
          <span>{resendStatus}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleCheckVerified}
          disabled={checking}
          icon={checking ? RefreshCw : CheckCircle}
        >
          {checking ? 'Checking Status...' : "I've Verified"}
        </Button>

        <Button
          variant="outline"
          size="default"
          fullWidth
          onClick={handleResend}
          disabled={resending || checking || cooldown > 0}
        >
          {resending
            ? 'Sending Link...'
            : cooldown > 0
            ? `Resend Link (${cooldown}s)`
            : 'Resend Verification Email'}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 0',
            fontSize: '13px',
            color: 'var(--color-muted-text)',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
