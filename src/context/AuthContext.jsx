import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  signupUserWithEmail,
  loginUserWithEmail,
  loginUserWithGoogle,
  logoutUser,
  sendUserPasswordReset,
  resendUserVerification,
  reloadUserState
} from '../services/authService';

export const AuthContext = createContext(null);

/**
 * Derives user initials for avatar display.
 */
function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) {
    const local = email.split('@')[0];
    return local.slice(0, 2).toUpperCase();
  }
  return 'GP';
}

/**
 * Maps raw Firebase User to clean GateApass user entity.
 * Uses Firebase UID as the primary stable identifier.
 */
function mapFirebaseUser(rawUser) {
  if (!rawUser) return null;

  const displayName = rawUser.displayName || rawUser.email?.split('@')[0] || 'GateApass User';
  const email = rawUser.email || '';
  const photoURL = rawUser.photoURL || null;
  const emailVerified = Boolean(rawUser.emailVerified);
  const uid = rawUser.uid; // Primary identity reference

  const providerData = rawUser.providerData?.[0];
  const providerId = providerData?.providerId || 'password';

  return {
    uid,
    displayName,
    name: displayName, // Backward compatibility with mockData user.name
    email,
    photoURL,
    emailVerified,
    providerId,
    avatarInitials: getInitials(displayName, email),
    college: 'Campus Participant' // Default profile field for GateApass
  };
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(auth));

  // Auth modal management
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    view: 'login', // 'login' | 'signup' | 'forgot' | 'verify'
    postLoginCallback: null
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (rawUser) => {
      setFirebaseUser(rawUser);
      setUser(mapFirebaseUser(rawUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = useCallback((view = 'login', callback = null) => {
    setAuthModal({
      isOpen: true,
      view,
      postLoginCallback: callback
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const setAuthModalView = useCallback((view) => {
    setAuthModal((prev) => ({
      ...prev,
      view
    }));
  }, []);

  const handleSignupWithEmail = useCallback(async (email, password, displayName) => {
    const result = await signupUserWithEmail(email, password, displayName);
    if (result.verificationSent) {
      setAuthModal((prev) => ({ ...prev, view: 'verify' }));
    } else {
      setAuthModal((prev) => ({ ...prev, isOpen: false }));
    }
    return result;
  }, []);

  const handleLoginWithEmail = useCallback(async (email, password) => {
    const loggedUser = await loginUserWithEmail(email, password);
    setAuthModal((prev) => {
      if (prev.postLoginCallback) {
        prev.postLoginCallback(loggedUser);
      }
      return { ...prev, isOpen: false };
    });
    return loggedUser;
  }, []);

  const handleLoginWithGoogle = useCallback(async () => {
    const loggedUser = await loginUserWithGoogle();
    setAuthModal((prev) => {
      if (prev.postLoginCallback) {
        prev.postLoginCallback(loggedUser);
      }
      return { ...prev, isOpen: false };
    });
    return loggedUser;
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const handlePasswordReset = useCallback(async (email) => {
    await sendUserPasswordReset(email);
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (firebaseUser) {
      await resendUserVerification(firebaseUser);
    }
  }, [firebaseUser]);

  const handleReloadUser = useCallback(async () => {
    if (firebaseUser) {
      const refreshed = await reloadUserState(firebaseUser);
      setFirebaseUser(refreshed);
      setUser(mapFirebaseUser(refreshed));
      return refreshed;
    }
    return null;
  }, [firebaseUser]);

  const value = useMemo(() => ({
    user,
    firebaseUser,
    loading,
    isAuthenticated: Boolean(user),
    authModal,
    openAuthModal,
    closeAuthModal,
    setAuthModalView,
    signupWithEmail: handleSignupWithEmail,
    loginWithEmail: handleLoginWithEmail,
    loginWithGoogle: handleLoginWithGoogle,
    logout: handleLogout,
    sendPasswordReset: handlePasswordReset,
    resendVerification: handleResendVerification,
    reloadUser: handleReloadUser
  }), [
    user,
    firebaseUser,
    loading,
    authModal,
    openAuthModal,
    closeAuthModal,
    setAuthModalView,
    handleSignupWithEmail,
    handleLoginWithEmail,
    handleLoginWithGoogle,
    handleLogout,
    handlePasswordReset,
    handleResendVerification,
    handleReloadUser
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
