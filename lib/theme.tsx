"use client";

import { useCallback, useSyncExternalStore } from "react";

/* Dark mode, app-wide.

   The theme lives in the SAME `tz-prefs-v1` blob the lesson workspace always
   used (`{ dark, audio, colorful, hands }`), so a learner who turned the lights
   off inside a lesson finds every other page dark too — one setting, one key.

   Tailwind's dark variant is class-based (`@custom-variant dark` in
   globals.css), so the store's only side effect is toggling `.dark` on
   <html>. The pre-paint script in app/layout.tsx sets that same class before
   first paint so there is never a white flash.

   Same module-level useSyncExternalStore idiom as lib/locale.tsx — no Provider. */

const STORAGE_KEY = "tz-prefs-v1";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function readPrefs(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") return p as Record<string, unknown>;
    }
  } catch {}
  return {};
}

/* Read the class rather than storage: it is what the pre-paint script already
   decided, and it keeps the snapshot cheap (called on every render). */
function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const setDark = useCallback((dark: boolean) => {
    applyTheme(dark);
    try {
      // Merge — the other three prefs belong to the lesson workspace.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...readPrefs(), dark }),
      );
    } catch {}
    listeners.forEach((cb) => cb());
  }, []);

  const toggleDark = useCallback(() => setDark(!getSnapshot()), [setDark]);

  return { isDark, setDark, toggleDark };
}
