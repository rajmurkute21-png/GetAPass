import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, getFirebaseConfigStatus } from '../config/firebase';
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
function mapFirebaseUser(rawUser, role = 'participant', profileData = null) {
  if (!rawUser) return null;

  const displayName = profileData?.name || profileData?.displayName || rawUser.displayName || rawUser.email?.split('@')[0] || 'GateApass User';
  const email = profileData?.email || rawUser.email || '';
  const photoURL = profileData?.photoURL || rawUser.photoURL || null;
  const uid = rawUser.uid; // Primary identity reference

  const providerData = rawUser.providerData?.[0];
  const providerId = providerData?.providerId || 'password';
  const isGoogle = Boolean(
    providerId === 'google.com' ||
    rawUser.providerData?.some((p) => p.providerId === 'google.com')
  );

  // Requirement 4: Google accounts are verified by definition; email/password accounts require explicit email verification
  const isEmailVerified = Boolean(rawUser.emailVerified || isGoogle);

  return {
    uid,
    displayName,
    name: displayName, // Backward compatibility with mockData user.name
    email,
    photoURL,
    emailVerified: isEmailVerified,
    isEmailVerified,
    isGoogle,
    providerId,
    role, // Server-enforced role ('admin' | 'organizer' | 'participant' | 'verifier')
    isAdmin: role === 'admin',
    isOrganizer: role === 'organizer' || role === 'admin',
    isVerifier: role === 'verifier' || role === 'admin',
    avatarInitials: getInitials(displayName, email),
    college: profileData?.college || 'Campus Participant',
    phone: profileData?.phone || '',
    ...(profileData || {})
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

  // Listen to Firebase auth state changes with real-time profile & role sync
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let profileUnsub = null;

    const unsubscribe = onAuthStateChanged(auth, async (rawUser) => {
      // Clean up previous profile listener on auth state transition
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (!rawUser) {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(rawUser);

      // Resolve role and create or update Firestore user profile
      try {
        let serverRole = 'participant';

        // 1. Check cryptographically signed JWT Custom Claims (Fastest & most secure)
        try {
          const tokenResult = await rawUser.getIdTokenResult();
          if (tokenResult.claims?.role) {
            serverRole = tokenResult.claims.role;
          } else if (tokenResult.claims?.admin) {
            serverRole = 'admin';
          } else if (tokenResult.claims?.organizer) {
            serverRole = 'organizer';
          }
        } catch (err) {
          console.warn('[GateApass Auth] Could not inspect ID token claims:', err);
        }

        // 2. Check trusted Firestore /users/{uid} document and sync profile fields
        // Requirement 5: Create or update Firestore user profiles with UID, name, email, photoURL, role, emailVerified, createdAt and updatedAt
        let initialProfileData = null;
        if (db) {
          try {
            const userDocRef = doc(db, 'users', rawUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            const isGoogle = Boolean(
              rawUser.providerData?.some((p) => p.providerId === 'google.com') ||
              rawUser.providerId === 'google.com'
            );
            const isVerified = Boolean(rawUser.emailVerified || isGoogle);
            const resolvedName = rawUser.displayName || rawUser.email?.split('@')[0] || 'User';

            if (userDocSnap.exists()) {
              const existingData = userDocSnap.data();
              initialProfileData = existingData;
              if (existingData?.role) {
                serverRole = existingData.role;
              }

              // Update profile without modifying role or createdAt (preserves role boundary)
              const profileUpdate = {
                uid: rawUser.uid,
                name: resolvedName,
                email: rawUser.email || existingData.email || '',
                photoURL: rawUser.photoURL || existingData.photoURL || null,
                emailVerified: isVerified,
                updatedAt: Date.now()
              };
              await setDoc(userDocRef, profileUpdate, { merge: true });
            } else {
              // First time sign-in: Initialize user document
              // Requirement 6: Public signup NEVER assigns admin, organizer or verifier roles
              const initialProfile = {
                uid: rawUser.uid,
                name: resolvedName,
                email: rawUser.email || '',
                photoURL: rawUser.photoURL || null,
                role: 'participant',
                emailVerified: isVerified,
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              await setDoc(userDocRef, initialProfile);
              initialProfileData = initialProfile;
            }

            // Real-time listener for profile & role promotions
            profileUnsub = onSnapshot(userDocRef, (snap) => {
              if (snap.exists()) {
                const liveData = snap.data();
                const activeRole = liveData.role || serverRole || 'participant';
                setUser(mapFirebaseUser(rawUser, activeRole, liveData));
              }
            }, (err) => {
              console.warn('[GateApass Auth] Real-time user profile sync notice:', err);
            });
          } catch (err) {
            console.warn('[GateApass Auth] User profile document sync notice:', err);
          }
        }

        // Set verified user state with settled role
        setUser(mapFirebaseUser(rawUser, serverRole, initialProfileData));
      } catch (err) {
        console.warn('[GateApass Auth] Background role resolution error:', err);
        setUser(mapFirebaseUser(rawUser, 'participant'));
      } finally {
        setLoading(false);
      }
    });

    return () => {
      if (profileUnsub) profileUnsub();
      unsubscribe();
    };
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
    // Requirement 4: Require verified email for email/password accounts before granting application access
    if (!loggedUser.emailVerified) {
      setAuthModal({
        isOpen: true,
        view: 'verify',
        postLoginCallback: null
      });
      return loggedUser;
    }
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
      const isGoogle = refreshed?.providerData?.some((p) => p.providerId === 'google.com') || false;
      const isVerified = Boolean(refreshed?.emailVerified || isGoogle);

      if (isVerified && db && refreshed?.uid) {
        // Sync verified state to Firestore user profile
        try {
          await setDoc(
            doc(db, 'users', refreshed.uid),
            { emailVerified: true, updatedAt: Date.now() },
            { merge: true }
          );
        } catch (err) {
          console.warn('[GateApass Auth] Could not sync emailVerified to profile:', err);
        }
      }

      const updated = mapFirebaseUser(refreshed, user?.role || 'participant');
      setUser(updated);
      return refreshed;
    }
    return null;
  }, [firebaseUser, user?.role]);

  const configStatus = useMemo(() => getFirebaseConfigStatus(), []);

  const value = useMemo(() => ({
    user,
    firebaseUser,
    loading,
    isFirebaseConfigured,
    configStatus,
    isAuthenticated: Boolean(user),
    isEmailVerified: Boolean(user?.isEmailVerified),
    needsEmailVerification: Boolean(user && !user.isEmailVerified && !user.isGoogle),
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
