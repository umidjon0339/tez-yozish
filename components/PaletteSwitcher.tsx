"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "tz-fz-palette";

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

export function PaletteSwitcher({ onSelect }: { onSelect?: () => void }) {
  const active = useSyncExternalStore(subscribe, getSnapshot, () => "classic" as PaletteId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    setOpen(false);
  };

  const activePalette = PALETTES.find((p) => p.id === active) ?? PALETTES[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard colors"
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
            Keyboard colors
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
        </div>
      )}
    </div>
  );
}
