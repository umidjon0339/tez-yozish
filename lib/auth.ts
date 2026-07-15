"use client";

import { useSyncExternalStore } from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

/* Signed-in state, mirrored from the Firebase SDK into React with the same
   external-store pattern as lib/locale.tsx. `ready` is false until Firebase
   has restored (or ruled out) a saved session, so the navbar can avoid
   flashing "Log in" at a signed-in student. */

type AuthSnapshot = { user: User | null; ready: boolean };

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, ready: false };

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started) return;
  started = true;
  onAuthStateChanged(getFirebaseAuth(), (user) => {
    snapshot = { user, ready: true };
    listeners.forEach((cb) => cb());
  });
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

export function logout(): Promise<void> {
  return signOut(getFirebaseAuth());
}

/** Completes the SSO hand-off: edify-student sends the student back with a
 *  custom token; exchanging it signs them into the same account here. */
export function signInWithSsoToken(token: string): Promise<unknown> {
  return signInWithCustomToken(getFirebaseAuth(), token);
}

/** Login/signup live on the parent app (edify-student). We send the student
 *  there with ?returnTo=<our callback>, and they come back signed in. */
export function edifyAuthUrl(page: "login" | "signup"): string {
  const base = (
    process.env.NEXT_PUBLIC_EDIFY_URL ?? "http://localhost:3001"
  ).replace(/\/$/, "");
  const callback = `${window.location.origin}/auth/callback`;
  return `${base}/auth/${page}?returnTo=${encodeURIComponent(callback)}`;
}
