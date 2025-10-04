'use client';
import type { User } from 'firebase/auth';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Creates or updates a user's profile in Firestore.
 * This function is designed to be called after a user signs in or signs up.
 * It uses setDoc with { merge: true } to avoid overwriting existing data
 * if the user profile already exists.
 *
 * @param firestore - The Firestore instance.
 * @param user - The Firebase Auth User object.
 */
export function updateUserProfile(firestore: Firestore, user: User) {
  const userRef = doc(firestore, 'users', user.uid);
  const userData = {
    id: user.uid,
    email: user.email,
    name: user.displayName || user.email, // Fallback to email if displayName is not set
  };

  // Use non-blocking setDoc with merge option
  setDoc(userRef, userData, { merge: true }).catch(error => {
    // Construct a contextual error and emit it globally
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'write', // Using 'write' as it can be a create or update
      requestResourceData: userData,
    });

    errorEmitter.emit('permission-error', permissionError);

    // Optionally, you can still log the original server error for debugging
    console.error('Original error during updateUserProfile:', error);
  });
}
