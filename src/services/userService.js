/**
 * GetApass — Secure User & Role Management Service
 *
 * Implements role assignment and user profile management strictly governed by
 * server authorization principles:
 * - Only Global Administrators can list all users and change user roles.
 * - Non-admin users can update their profile information, but can NEVER modify their own role.
 * - All role modifications are validated against the 4 immutable platform roles.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES, ALL_ROLES } from '../constants/roles';
import { canAssignRoles, canManagePlatform } from './permissionService';

const USERS_COLLECTION = 'users';

/**
 * Fetches all registered users from Firestore.
 * RESTRICTED: Global Administrator only.
 */
export async function fetchAllUsers(currentUser) {
  if (!canAssignRoles(currentUser)) {
    throw new Error('Unauthorized: Only platform administrators can view all registered users.');
  }

  if (!db) {
    console.warn('[GateApass Users] Firestore not initialized, returning empty list.');
    return [];
  }

  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
        email: data.email || '',
        photoURL: data.photoURL || null,
        role: ALL_ROLES.includes(data.role) ? data.role : ROLES.PARTICIPANT,
        emailVerified: Boolean(data.emailVerified),
        college: data.college || '',
        phone: data.phone || '',
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0
      });
    });

    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return users;
  } catch (err) {
    console.error('[GateApass Users] Failed to fetch users:', err);
    throw err;
  }
}

/**
 * Assigns a new role to a user.
 * RESTRICTED: Global Administrator only.
 * Validates role against the 4 valid roles: admin, organizer, verifier, participant.
 */
export async function assignUserRole(targetUid, newRole, currentUser) {
  if (!targetUid) {
    throw new Error('Target user UID is required to assign a role.');
  }

  if (!canAssignRoles(currentUser)) {
    throw new Error('Unauthorized: Only platform administrators can assign user roles.');
  }

  const normalizedRole = String(newRole).toLowerCase().trim();
  if (!ALL_ROLES.includes(normalizedRole)) {
    throw new Error(
      `Invalid role "${newRole}". Allowed roles are: ${ALL_ROLES.join(', ')}.`
    );
  }

  if (!db) {
    throw new Error('Firestore database is not connected.');
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, targetUid);
    const userSnap = await getDoc(userRef);

    const updatePayload = {
      role: normalizedRole,
      updatedAt: Date.now(),
      updatedBy: currentUser.uid
    };

    if (userSnap.exists()) {
      await updateDoc(userRef, updatePayload);
    } else {
      // If user document does not exist yet, initialize it
      await setDoc(userRef, {
        uid: targetUid,
        role: normalizedRole,
        createdAt: Date.now(),
        ...updatePayload
      });
    }

    console.log(
      `[GateApass Users] Administrator ${currentUser.email || currentUser.uid} successfully updated user ${targetUid} role to "${normalizedRole}".`
    );

    return {
      success: true,
      uid: targetUid,
      role: normalizedRole,
      updatedAt: updatePayload.updatedAt
    };
  } catch (err) {
    console.error(`[GateApass Users] Failed to assign role to user ${targetUid}:`, err);
    throw err;
  }
}

/**
 * Sanitizes editable profile input to prevent unauthorized field mutation.
 * STRICT SECURITY: Whitelists only safe fields (name, college, phone, photoURL)
 * and strips 'role', 'uid', 'createdAt' to prevent client privilege elevation.
 */
export function sanitizeUserProfile(profileData) {
  const safeProfile = {
    updatedAt: Date.now()
  };

  if (profileData.name !== undefined) safeProfile.name = String(profileData.name).trim();
  if (profileData.college !== undefined) safeProfile.college = String(profileData.college).trim();
  if (profileData.phone !== undefined) safeProfile.phone = String(profileData.phone).trim();
  if (profileData.photoURL !== undefined) safeProfile.photoURL = profileData.photoURL;

  return safeProfile;
}

/**
 * Updates a user's editable profile information.
 * STRICT SECURITY: Automatically strips out 'role', 'uid', and 'createdAt'
 * to prevent unauthorized client-side role elevation.
 */
export async function updateUserProfile(targetUid, profileData, currentUser) {
  if (!targetUid) {
    throw new Error('Target UID is required.');
  }

  const isSelf = currentUser?.uid === targetUid;
  const isAdmin = canManagePlatform(currentUser);

  if (!isSelf && !isAdmin) {
    throw new Error('Unauthorized: You can only update your own profile.');
  }

  const safeProfile = sanitizeUserProfile(profileData);

  if (!db) {
    return safeProfile;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, targetUid);
    await setDoc(userRef, safeProfile, { merge: true });
    return safeProfile;
  } catch (err) {
    console.error(`[GateApass Users] Failed to update profile for ${targetUid}:`, err);
    throw err;
  }
}

/**
 * Real-time subscription to the users roster for Admin Dashboard.
 * RESTRICTED: Global Administrator only.
 */
export function subscribeToUsers(currentUser, onUpdate, onError) {
  if (!canAssignRoles(currentUser)) {
    if (onError) {
      onError(new Error('Unauthorized: Administrator role required to subscribe to users.'));
    }
    return () => {};
  }

  if (!db) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    const q = collection(db, USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          users.push({
            uid: docSnap.id,
            name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            photoURL: data.photoURL || null,
            role: ALL_ROLES.includes(data.role) ? data.role : ROLES.PARTICIPANT,
            emailVerified: Boolean(data.emailVerified),
            college: data.college || '',
            phone: data.phone || '',
            createdAt: data.createdAt || 0,
            updatedAt: data.updatedAt || 0
          });
        });
        users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (onUpdate) onUpdate(users);
      },
      (error) => {
        console.error('[GateApass Users] Roster listener error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[GateApass Users] Could not establish user subscription:', err);
    if (onError) onError(err);
    return () => {};
  }
}
