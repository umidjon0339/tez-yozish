"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "uz" | "ru";

const STORAGE_KEY = "tz-locale";
const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: {
  id: Locale;
  label: string;
  short: string;
  flag: string;
}[] = [
  { id: "en", label: "English", short: "EN", flag: "/flags/en.svg" },
  { id: "uz", label: "O'zbek", short: "UZ", flag: "/flags/uz.svg" },
  { id: "ru", label: "Русский", short: "RU", flag: "/flags/ru.svg" },
];

function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "uz" || v === "ru";
}

/* The chosen locale lives in localStorage (same tz-locale key the lesson
   runtime always used); this store mirrors it into React so the navbar,
   pages and lesson workspace all switch together. */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isLocale(v)) return v;
  } catch {}
  return DEFAULT_LOCALE;
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_LOCALE,
  );

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    document.documentElement.lang = l;
    listeners.forEach((cb) => cb());
  }, []);

  return { locale, setLocale };
}
