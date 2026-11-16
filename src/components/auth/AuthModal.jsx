import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import VerifyEmailPrompt from './VerifyEmailPrompt';

/**
 * GateApass — Global Authentication Modal
 * Controls seamless switching between Login, Signup, Forgot Password,
 * and Email Verification views without leaving the current page.
 */
export default function AuthModal() {
  const { authModal, closeAuthModal, setAuthModalView } = useAuth();
  const { isOpen, view } = authModal;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAuthModal}
      maxWidth="460px"
      cancelText={null}
      confirmText={null}
    >
      {view === 'login' && (
        <LoginForm
          onSwitchToSignup={() => setAuthModalView('signup')}
          onSwitchToForgot={() => setAuthModalView('forgot')}
        />
      )}

      {view === 'signup' && (
        <SignupForm
          onSwitchToLogin={() => setAuthModalView('login')}
        />
      )}

      {view === 'forgot' && (
        <ForgotPasswordForm
          onBackToLogin={() => setAuthModalView('login')}
        />
      )}

      {view === 'verify' && (
        <VerifyEmailPrompt
          onBackToLogin={() => setAuthModalView('login')}
          onContinue={closeAuthModal}
        />
      )}
    </Modal>
  );
}
