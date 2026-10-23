"use client";

// Which hand drawing the learner wants over the keyboard. Same
// useSyncExternalStore shape as lib/core/locale.tsx and PaletteSwitcher, so the
// lesson workspace and the picker in its header read one source of truth.

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tz-hand-style";

export type HandStyleId = "classic" | "female";

/** Which set of pose art a style draws with. */
export type HandArtVariant = "classic" | "female";

export interface HandStyle {
  id: HandStyleId;
  label: { en: string; uz: string; ru: string };
  /** which component renders it — see docs/keyboard.md §3b */
  variant: HandArtVariant;
  /**
   * Theme class for the hands svg. When set it replaces the usual
   * light/dark pair, because the look is defined by the theme itself.
   */
  theme?: string;
  /** thumbnail built by scripts/hands-previews.mjs */
  preview: string;
}

export const HAND_STYLES: HandStyle[] = [
  {
    id: "classic",
    label: { en: "Classic", uz: "Klassik", ru: "Классические" },
    variant: "classic",
    preview: "/hands/preview-classic.svg",
  },
  {
    // Anatomically reshaped art (handsFemale.tsx: slender tapered fingers,
    // narrower palm, slimmer wrist) under the rose skin.
    id: "female",
    label: { en: "Female", uz: "Ayol", ru: "Женские" },
    variant: "female",
    theme: "theme-rose",
    preview: "/hands/preview-female.svg",
  },
];

export function getHandStyle(id: HandStyleId): HandStyle {
  return HAND_STYLES.find((s) => s.id === id) ?? HAND_STYLES[0];
}

export const DEFAULT_HAND_STYLE: HandStyleId = "classic";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): HandStyleId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (HAND_STYLES.some((s) => s.id === v)) return v as HandStyleId;
  } catch {}
  return DEFAULT_HAND_STYLE;
}

export function setHandStyle(id: HandStyleId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
  listeners.forEach((cb) => cb());
}

export function useHandStyle(): HandStyleId {
  // The server can't know the stored choice, so it renders the default and the
  // store swaps in the real one after hydration.
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_HAND_STYLE);
}
