import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/* Same Firebase project as the parent app (edify-student) — one shared
   account pool. Values come from .env.local (copied from edify-student);
   deployments must define the same NEXT_PUBLIC_FIREBASE_* vars.

   Initialization is LAZY and must stay browser-only: initializing at
   module scope runs during `next build` prerendering, where missing env
   vars make the SDK throw auth/invalid-api-key and fail the whole build. */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedAuth: Auth | null = null;

/** Lazily initialized Auth — call only from browser code paths. */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}
