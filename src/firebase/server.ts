import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// This is a server-only file.

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let app;
    try {
      // Attempt to initialize via GOOGLE_APPLICATION_CREDENTIALS
      app = initializeApp();
    } catch (e) {
      // This is expected to fail when running locally.
      // Fallback to client config for local development.
      // This is not secure for production and should only be used for local dev.
      if (process.env.NODE_ENV !== "production") {
          console.warn('Automatic server initialization failed. Falling back to client firebase config object for local development. DO NOT DEPLOY THIS TO PRODUCTION.');
          app = initializeApp(firebaseConfig)
      } else {
          throw e; // Re-throw in production
      }
    }
    return getSdks(app);
  }
  return getSdks(getApp());
}

export function getSdks(app: any) {
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
