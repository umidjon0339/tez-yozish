"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/core/locale";

const STORAGE_KEY = "tz-fz-palette";
const CUSTOM_KEY = "tz-fz-custom-v1";

const UI = {
  title: { en: "Keyboard colors", uz: "Klaviatura ranglari", ru: "Цвета клавиатуры" },
  custom: { en: "My colors", uz: "O'z ranglarim", ru: "Свои цвета" },
  reset: { en: "Reset to default", uz: "Asliga qaytarish", ru: "Сбросить настройки" },
} as const;

/* Light-mode swatches per theme, in finger order l-pinky → r-pinky.
   Must mirror the --fz-* definitions in globals.css. */
const PALETTES = [
  {
    id: "classic",
    label: "Classic",
    colors: ["#ea580c", "#9333ea", "#dc2626", "#16a34a", "#2563eb", "#db2777", "#0d9488", "#4f46e5", "#d8964b"],
  },
  {
    id: "classic-plus",
    label: "Classic+",
    colors: ["#ea580c", "#9333ea", "#dc2626", "#16a34a", "#2563eb", "#db2777", "#0d9488", "#4f46e5", "#d97706"],
  },
  {
    id: "vivid",
    label: "Vivid",
    colors: ["#0d9488", "#d97706", "#4f46e5", "#16a34a", "#0284c7", "#ea580c", "#9333ea", "#e11d48", "#c026d3"],
  },
  {
    id: "soft",
    label: "Soft",
    colors: ["#b0485c", "#9c7a22", "#4f74c9", "#2e8b57", "#1f7fa3", "#6f7f30", "#7761c9", "#b95f3d", "#9c5a9e"],
  },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

/* One entry per finger zone, in the same order as the palette swatch rows.
   `id` is the suffix of the --fz-* variable in globals.css. */
const FINGER_ZONES = [
  { id: "l-pinky", label: { en: "Left pinky", uz: "Chap jimjiloq", ru: "Левый мизинец" } },
  { id: "l-ring", label: { en: "Left ring", uz: "Chap nomsiz barmoq", ru: "Левый безымянный" } },
  { id: "l-middle", label: { en: "Left middle", uz: "Chap o'rta barmoq", ru: "Левый средний" } },
  { id: "l-index", label: { en: "Left index", uz: "Chap ko'rsatkich", ru: "Левый указательный" } },
  { id: "thumb", label: { en: "Thumb", uz: "Bosh barmoq", ru: "Большой палец" } },
  { id: "r-index", label: { en: "Right index", uz: "O'ng ko'rsatkich", ru: "Правый указательный" } },
  { id: "r-middle", label: { en: "Right middle", uz: "O'ng o'rta barmoq", ru: "Правый средний" } },
  { id: "r-ring", label: { en: "Right ring", uz: "O'ng nomsiz barmoq", ru: "Правый безымянный" } },
  { id: "r-pinky", label: { en: "Right pinky", uz: "O'ng jimjiloq", ru: "Правый мизинец" } },
] as const;

type FingerZoneId = (typeof FINGER_ZONES)[number]["id"];
type CustomFzMap = Partial<Record<FingerZoneId, string>>;

/* The active palette lives on <html data-fz> (set before paint by the boot script
   in layout.tsx); this store just mirrors it into React. */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): PaletteId {
  const v = document.documentElement.dataset.fz;
  return PALETTES.some((p) => p.id === v) ? (v as PaletteId) : "classic";
}

function applyPalette(id: PaletteId) {
  if (id === "classic") {
    delete document.documentElement.dataset.fz;
  } else {
    document.documentElement.dataset.fz = id;
  }
  localStorage.setItem(STORAGE_KEY, id);
  listeners.forEach((cb) => cb());
}

/* Per-finger custom colors: stored as {zone: hex} and applied as inline
   --fz-<zone> variables on <html>, so they override whatever palette (and
   dark-mode variant) is active. The boot script in layout.tsx re-applies them
   before first paint. */
const customListeners = new Set<() => void>();
let customCache: CustomFzMap | null = null;
const EMPTY_CUSTOM: CustomFzMap = {};

function subscribeCustom(cb: () => void) {
  customListeners.add(cb);
  return () => {
    customListeners.delete(cb);
  };
}

function getCustomSnapshot(): CustomFzMap {
  if (customCache) return customCache;
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    customCache = raw ? (JSON.parse(raw) as CustomFzMap) : EMPTY_CUSTOM;
  } catch {
    customCache = EMPTY_CUSTOM;
  }
  return customCache;
}

function setCustomFz(zone: FingerZoneId, hex: string) {
  const next = { ...getCustomSnapshot(), [zone]: hex };
  customCache = next;
  document.documentElement.style.setProperty(`--fz-${zone}`, hex);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  } catch {}
  customListeners.forEach((cb) => cb());
}

/** Default palette, no per-finger overrides. */
function resetKeyboardColors() {
  customCache = EMPTY_CUSTOM;
  for (const z of FINGER_ZONES) document.documentElement.style.removeProperty(`--fz-${z.id}`);
  try {
    localStorage.removeItem(CUSTOM_KEY);
  } catch {}
  customListeners.forEach((cb) => cb());
  applyPalette("classic");
}

/** The color each finger currently renders with (custom > palette > default). */
function readLiveColors(): Record<FingerZoneId, string> {
  const cs = getComputedStyle(document.documentElement);
  const out = {} as Record<FingerZoneId, string>;
  for (const z of FINGER_ZONES) {
    out[z.id] = cs.getPropertyValue(`--fz-${z.id}`).trim() || "#888888";
  }
  return out;
}

export function PaletteSwitcher({ onSelect }: { onSelect?: () => void }) {
  const { locale } = useLocale();
  const active = useSyncExternalStore(subscribe, getSnapshot, () => "classic" as PaletteId);
  const custom = useSyncExternalStore(subscribeCustom, getCustomSnapshot, () => EMPTY_CUSTOM);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // What each finger actually renders with right now (custom > palette >
  // default). A plain computed-style read, done only while the menu is open;
  // `active`/`custom` are store-backed, so any change re-renders and re-reads.
  const live = open ? readLiveColors() : null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (id: PaletteId) => {
    applyPalette(id);
    onSelect?.();
  };

  const activePalette = PALETTES.find((p) => p.id === active) ?? PALETTES[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={UI.title[locale]}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        <span className="flex -space-x-1">
          {[3, 4, 5].map((i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full ring-2 ring-[#FAFAFA] dark:ring-neutral-950"
              style={{ backgroundColor: activePalette.colors[i] }}
            />
          ))}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg shadow-lg p-1.5 z-50">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {UI.title[locale]}
          </p>
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                p.id === active
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              }`}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                {p.label}
                {p.id === active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="flex gap-0.75">
                {p.colors.map((c, i) => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
            </button>
          ))}

          <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {UI.custom[locale]}
            </p>
            {/* one picker per finger, ordered like the palette swatch rows */}
            <div className="px-2.5 pb-2 flex justify-between">
              {FINGER_ZONES.map((z) => (
                <label
                  key={z.id}
                  title={z.label[locale]}
                  className={`relative w-[19px] h-[19px] rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-110 border border-black/10 dark:border-white/15 ${
                    custom[z.id] ? "ring-2 ring-offset-1 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900" : ""
                  }`}
                  style={{ background: live?.[z.id] ?? "#888888" }}
                >
                  <input
                    type="color"
                    aria-label={z.label[locale]}
                    value={custom[z.id] ?? live?.[z.id] ?? "#888888"}
                    onChange={(e) => {
                      setCustomFz(z.id, e.target.value);
                      onSelect?.();
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetKeyboardColors();
              onSelect?.();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60 transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800 rounded-t-none"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6a4 4 0 1 1 1.2 2.85M2 6V3.5M2 6h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {UI.reset[locale]}
          </button>
        </div>
      )}
    </div>
  );
}
