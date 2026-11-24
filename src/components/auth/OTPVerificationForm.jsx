import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Clock, RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Button from '../common/Button';
import Logo from '../common/Logo';
import AuthError from './AuthError';
import {
  verifyCode,
  generateVerificationCode,
  checkCodeStatus
} from '../../services/otpSecurityService';

export default function OTPVerificationForm({
  identifier,
  purpose = 'password-reset',
  title = 'Enter Verification Code',
  subtitle = 'A 6-digit security code has been generated for your account.',
  onVerified,
  onBack
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // Time-limit states
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [isExpired, setIsExpired] = useState(false);

  const inputsRef = useRef([]);
  const inactivityTimerRef = useRef(null);

  // Inactivity timeout: clear inputs after 5 minutes of inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setDigits(['', '', '', '', '', '']);
      setError('Session timed out due to inactivity. Please request a new code.');
      setIsExpired(true);
    }, 5 * 60 * 1000);
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const status = checkCodeStatus(identifier, purpose);
      setRemainingSeconds(status.remainingSeconds);
      setCooldownSeconds(status.resendCooldownRemaining);
      setIsExpired(status.isExpired);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [identifier, purpose]);

  // Handle single digit change & auto focus
  const handleDigitChange = (index, value) => {
    resetInactivityTimer();
    setError('');

    // Only allow numbers
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...digits];
    if (cleaned.length > 1) {
      // Pasted string
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(5, index + pasted.length);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto advance
    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    resetInactivityTimer();
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const fullCode = digits.join('');

    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (isExpired) {
      setError('This verification code has expired. Please click "Resend Code" to generate a new 5-minute code.');
      return;
    }

    setSubmitting(true);
    try {
      const result = verifyCode(identifier, fullCode, purpose);
      if (!result.valid) {
        setError(result.error);
        if (result.expired || result.reused) {
          setIsExpired(true);
          setDigits(['', '', '', '', '', '']);
        }
      } else {
        setSuccessMsg('Code verified successfully!');
        if (onVerified) {
          onVerified(result);
        }
      }
    } catch (err) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const result = generateVerificationCode(identifier, purpose);
      setDigits(['', '', '', '', '', '']);
      setIsExpired(false);
      setRemainingSeconds(result.expiresInSeconds);
      setCooldownSeconds(result.resendCooldownSeconds);
      setSuccessMsg(`A new 5-minute verification code has been sent. Code: ${result.code}`);
      inputsRef.current[0]?.focus();
      resetInactivityTimer();
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {/* Target Account Badge */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-off-white)',
          border: '1px solid var(--color-gray)',
          borderRadius: 'var(--radius-control)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}
      >
        <span style={{ color: 'var(--color-muted-text)' }}>Account:</span>
        <strong style={{ color: 'var(--color-dark-text)' }}>{identifier}</strong>
      </div>

      {/* Live 5-Minute Expiry Countdown Timer */}
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: isExpired ? '#FEF3F2' : remainingSeconds < 60 ? '#FFFAEB' : 'rgba(124, 58, 237, 0.06)',
          border: `1px solid ${isExpired ? '#FECDCA' : remainingSeconds < 60 ? '#FEDF89' : 'rgba(124, 58, 237, 0.18)'}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          color: isExpired ? '#B42318' : remainingSeconds < 60 ? '#B54708' : '#6D28D9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} />
          <span>{isExpired ? 'Code Expired (5-min window ended)' : 'Code Validity Window'}</span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>
          {isExpired ? '00:00' : formatTime(remainingSeconds)}
        </span>
      </div>

      <AuthError message={error} />

      {successMsg && (
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
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6-Digit PIN Inputs */}
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={submitting || isExpired}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: '46px',
                height: '52px',
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 700,
                borderRadius: '12px',
                border: isExpired
                  ? '1.5px solid #FECDCA'
                  : digit
                  ? '2px solid #7C3AED'
                  : '1.5px solid var(--color-gray)',
                backgroundColor: isExpired ? '#F9FAFB' : '#FFFFFF',
                color: 'var(--color-dark-text)',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          ))}
        </div>

        {/* Verification Action */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={submitting || isExpired || digits.join('').length !== 6}
          icon={ShieldCheck}
        >
          {submitting ? 'Verifying Code...' : 'VERIFY & CONTINUE'}
        </Button>

        {/* 60-Second Cooldown Resend & Navigation Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldownSeconds > 0}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 0',
              fontSize: '13px',
              fontWeight: 600,
              color: cooldownSeconds > 0 ? 'var(--color-muted-text)' : '#7C3AED',
              cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={resending ? 'spin' : ''} />
            {cooldownSeconds > 0
              ? `Resend code in ${cooldownSeconds}s`
              : 'Resend new 5-minute code'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
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
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
