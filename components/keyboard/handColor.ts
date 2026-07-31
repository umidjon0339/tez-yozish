"use client";

// Which color each hand style is painted — and how see-through the hands
// layer is. One stored choice of each per style (`classic` keeps its frosted
// glass, `female` its rose skin, until the learner picks something else),
// read through the same useSyncExternalStore idiom as handStyle.ts so the
// switcher and the lesson workspace agree.
//
// A choice is a single base hex; every derived shade the artwork needs
// (fill, outline, gradient ends, filter floods) is mixed from it in
// handTintVars() and handed to the hands svg as CSS variables. The svg's
// <style> block reads each variable with the default look as the fallback,
// so "no choice" renders exactly the original art.

import { useSyncExternalStore } from "react";
import type { HandStyleId } from "./handStyle";

const STORAGE_KEY = "tz-hand-colors-v1";

export type HandColorMap = Partial<Record<HandStyleId, string>>;

/* Swatch palettes shown in the picker. The first entry of each list is the
   style's built-in look and maps to "no stored choice" (null). */
export const HAND_COLOR_PRESETS: Record<HandStyleId, { default: string; colors: string[] }> = {
  classic: {
    default: "#ffffff",
    colors: [
      "#94a3b8", // slate
      "#0ea5e9", // sky
      "#3b82f6", // blue
      "#6366f1", // indigo
      "#8b5cf6", // violet
      "#d946ef", // fuchsia
      "#ec4899", // pink
      "#ef4444", // red
      "#f97316", // orange
      "#f59e0b", // amber
      "#84cc16", // lime
      "#22c55e", // green
      "#14b8a6", // teal
      "#06b6d4", // cyan
    ],
  },
  female: {
    default: "#e8b0a2",
    colors: [
      // skin tones, light to deep…
      "#f3cfb3",
      "#eab68f",
      "#d29b6e",
      "#b97f52",
      "#996038",
      "#7c4a2b",
      "#5f3822",
      // …and playful colors
      "#f5a3b5", // pink
      "#c084fc", // lavender
      "#93c5fd", // blue
      "#7dd3b7", // mint
      "#facc6b", // gold
      "#9aa7b8", // silver
      "#67d5d8", // aqua
    ],
  },
};

/* ── hex helpers ─────────────────────────────────────────────────────────── */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix `a` toward `b`: t=0 → a, t=1 → b. */
function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The CSS variables a chosen base color expands into. Null (no choice)
 * returns {} so the svg's fallbacks — the original look — apply.
 * Variable names match the fallback-carrying rules in hands.tsx.
 */
export function handTintVars(style: HandStyleId, hex: string | null): React.CSSProperties {
  if (!hex) return {};
  if (style === "female") {
    return {
      "--hand-skin-top": mix(hex, "#ffffff", 0.45),
      "--hand-skin-bottom": hex,
      "--hand-crease": mix(hex, "#40262e", 0.5),
      "--hand-crease-dark": mix(hex, "#ffffff", 0.35),
      "--hand-nail": mix(hex, "#ffffff", 0.3),
      "--hand-shadow": mix(hex, "#361f28", 0.55),
      "--hand-highlight": mix(hex, "#ffffff", 0.88),
      "--hand-crease-shadow": mix(hex, "#2e181f", 0.6),
      "--hand-crease-highlight": mix(hex, "#ffffff", 0.84),
    } as React.CSSProperties;
  }
  // classic: keep the frosted-glass translucency, just tint the glass
  return {
    "--hand-fill": rgba(mix(hex, "#ffffff", 0.3), 0.5),
    "--hand-fill-dark": rgba(hex, 0.22),
    "--hand-line": mix(hex, "#334155", 0.45),
    "--hand-line-dark": mix(hex, "#ffffff", 0.3),
  } as React.CSSProperties;
}

/* ── the store ───────────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
let cache: HandColorMap | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const EMPTY: HandColorMap = {};

function getSnapshot(): HandColorMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as HandColorMap) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

/** Pass null to go back to the style's built-in look. */
export function setHandColor(style: HandStyleId, hex: string | null) {
  const next = { ...getSnapshot() };
  if (hex) next[style] = hex;
  else delete next[style];
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((cb) => cb());
}

export function useHandColors(): HandColorMap {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/* ── opacity (its own key: tz-hand-colors-v1 keeps its plain hex shape) ──── */

const OPACITY_KEY = "tz-hand-opacity-v1";

/** Matches the opacity-90 the hands wrapper always had. */
export const DEFAULT_HAND_OPACITY = 0.9;
export const MIN_HAND_OPACITY = 0.2;

export type HandOpacityMap = Partial<Record<HandStyleId, number>>;

const opacityListeners = new Set<() => void>();
let opacityCache: HandOpacityMap | null = null;
const EMPTY_OPACITY: HandOpacityMap = {};

function subscribeOpacity(cb: () => void) {
  opacityListeners.add(cb);
  return () => {
    opacityListeners.delete(cb);
  };
}

function getOpacitySnapshot(): HandOpacityMap {
  if (opacityCache) return opacityCache;
  try {
    const raw = localStorage.getItem(OPACITY_KEY);
    opacityCache = raw ? (JSON.parse(raw) as HandOpacityMap) : EMPTY_OPACITY;
  } catch {
    opacityCache = EMPTY_OPACITY;
  }
  return opacityCache;
}

/** Pass null to go back to the default opacity. */
export function setHandOpacity(style: HandStyleId, value: number | null) {
  const next = { ...getOpacitySnapshot() };
  if (value !== null && value !== DEFAULT_HAND_OPACITY) {
    next[style] = Math.min(1, Math.max(MIN_HAND_OPACITY, value));
  } else {
    delete next[style];
  }
  opacityCache = next;
  try {
    localStorage.setItem(OPACITY_KEY, JSON.stringify(next));
  } catch {}
  opacityListeners.forEach((cb) => cb());
}

export function useHandOpacities(): HandOpacityMap {
  return useSyncExternalStore(subscribeOpacity, getOpacitySnapshot, () => EMPTY_OPACITY);
}

/** Back to the built-in look: clears every stored color and opacity. */
export function resetHandAppearance() {
  cache = EMPTY;
  opacityCache = EMPTY_OPACITY;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OPACITY_KEY);
  } catch {}
  listeners.forEach((cb) => cb());
  opacityListeners.forEach((cb) => cb());
}
