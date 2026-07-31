"use client";

// Hand-type picker for the lesson workspace header. Thumbnails are cut from the
// real artwork (scripts/hands-previews.mjs), so the chip shows the hand you get.
// Below the styles sits a color section (handColor.ts): preset swatches plus a
// free color input, stored per style, painting the hands via --hand-* CSS vars.

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { DEFAULT_HAND_STYLE, HAND_STYLES, setHandStyle, useHandStyle, type HandStyleId } from "./handStyle";
import {
  DEFAULT_HAND_OPACITY,
  HAND_COLOR_PRESETS,
  MIN_HAND_OPACITY,
  resetHandAppearance,
  setHandColor,
  setHandOpacity,
  useHandColors,
  useHandOpacities,
} from "./handColor";

const UI = {
  title: { en: "Hand style", uz: "Qo'l turi", ru: "Вид рук" },
  color: { en: "Hand color", uz: "Qo'l rangi", ru: "Цвет рук" },
  defaultColor: { en: "Default", uz: "Odatiy", ru: "Обычный" },
  anyColor: { en: "Pick any color", uz: "Istalgan rang", ru: "Любой цвет" },
  opacity: { en: "Opacity", uz: "Shaffoflik", ru: "Непрозрачность" },
  reset: { en: "Reset to default", uz: "Asliga qaytarish", ru: "Сбросить настройки" },
} as const;

export function HandStyleSwitcher({ onSelect }: { onSelect?: () => void }) {
  const { locale } = useLocale();
  const active = useHandStyle();
  const colors = useHandColors();
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

  const activeStyle = HAND_STYLES.find((s) => s.id === active) ?? HAND_STYLES[0];
  const preset = HAND_COLOR_PRESETS[activeStyle.id];
  const activeColor = colors[activeStyle.id] ?? null;
  const opacities = useHandOpacities();
  const activeOpacity = opacities[activeStyle.id] ?? DEFAULT_HAND_OPACITY;

  const select = (id: HandStyleId) => {
    setHandStyle(id);
    onSelect?.();
    // stays open so the color swatches for the new style are right there
  };

  const pick = (hex: string | null) => {
    setHandColor(activeStyle.id, hex);
    onSelect?.();
  };

  const swatchRing = (isActive: boolean) =>
    `w-[22px] h-[22px] rounded-full cursor-pointer transition-transform hover:scale-110 border border-black/10 dark:border-white/15 ${
      isActive ? "ring-2 ring-offset-1 ring-neutral-900 dark:ring-white dark:ring-offset-neutral-900" : ""
    }`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={UI.title[locale]}
        aria-label={UI.title[locale]}
        aria-expanded={open}
        className="flex items-center gap-1 px-1.5 py-1.5 rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeStyle.preview}
          alt=""
          aria-hidden="true"
          className="w-[18px] h-[18px] object-contain"
        />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg shadow-lg p-1.5 z-50">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {UI.title[locale]}
          </p>
          {HAND_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => select(s.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                s.id === active
                  ? "bg-neutral-100 dark:bg-neutral-800"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              }`}
            >
              <span className="w-8 h-9 shrink-0 flex items-center justify-center rounded bg-neutral-50 dark:bg-neutral-950/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.preview}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain"
                />
              </span>
              <span className="flex-1 flex items-center gap-1.5 text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                {s.label[locale]}
                {s.id === active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          ))}

          <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {UI.color[locale]}
            </p>
            <div className="px-2.5 pb-2 grid grid-cols-5 gap-1.5 justify-items-center">
              {/* first swatch = the style's built-in look (clears the choice) */}
              <button
                type="button"
                onClick={() => pick(null)}
                title={UI.defaultColor[locale]}
                aria-label={UI.defaultColor[locale]}
                className={swatchRing(activeColor === null)}
                style={{ background: preset.default }}
              />
              {preset.colors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => pick(hex)}
                  title={hex}
                  aria-label={hex}
                  className={swatchRing(activeColor === hex)}
                  style={{ background: hex }}
                />
              ))}
              {/* free choice: native color input dressed as a rainbow swatch */}
              <label
                title={UI.anyColor[locale]}
                className={`relative overflow-hidden ${swatchRing(
                  activeColor !== null && !preset.colors.includes(activeColor),
                )}`}
                style={{
                  background:
                    "conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)",
                }}
              >
                <input
                  type="color"
                  aria-label={UI.anyColor[locale]}
                  value={activeColor ?? preset.default}
                  onChange={(e) => pick(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="px-2.5 pb-2.5">
              <div className="flex items-center justify-between pt-1 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {UI.opacity[locale]}
                </span>
                <span className="text-[11px] font-medium tabular-nums text-neutral-600 dark:text-neutral-300">
                  {Math.round(activeOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={MIN_HAND_OPACITY * 100}
                max={100}
                step={5}
                value={Math.round(activeOpacity * 100)}
                aria-label={UI.opacity[locale]}
                onChange={(e) => {
                  setHandOpacity(activeStyle.id, Number(e.target.value) / 100);
                  onSelect?.();
                }}
                className="w-full h-1.5 cursor-pointer accent-neutral-900 dark:accent-white"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                resetHandAppearance();
                setHandStyle(DEFAULT_HAND_STYLE);
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
        </div>
      )}
    </div>
  );
}
