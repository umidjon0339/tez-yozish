"use client";

// Hand-type picker for the lesson workspace header. Thumbnails are cut from the
// real artwork (scripts/hands-previews.mjs), so the chip shows the hand you get.

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { HAND_STYLES, setHandStyle, useHandStyle, type HandStyleId } from "./handStyle";

const UI = {
  title: { en: "Hand style", uz: "Qo'l turi", ru: "Вид рук" },
} as const;

export function HandStyleSwitcher({ onSelect }: { onSelect?: () => void }) {
  const { locale } = useLocale();
  const active = useHandStyle();
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

  const select = (id: HandStyleId) => {
    setHandStyle(id);
    onSelect?.();
    setOpen(false);
  };

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
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg shadow-lg p-1.5 z-50">
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
        </div>
      )}
    </div>
  );
}
