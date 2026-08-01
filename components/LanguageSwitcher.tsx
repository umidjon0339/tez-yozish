"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOCALES, useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

/* Flag + code button that opens a flag/native-name dropdown on hover
   (click also toggles it, for touch screens). Used in the global navbar
   and the lesson workspace header (hence the dark: variants). */
export function LanguageSwitcher({ compact = false }: { compact?: boolean } = {}) {
  const { locale, setLocale } = useLocale();
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

  const active = LOCALES.find((l) => l.id === locale) ?? LOCALES[0];

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={STR.nav.language[locale]}
        aria-expanded={open}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        <img
          src={active.flag}
          alt=""
          className="w-5 h-3.5 rounded-[3px] object-cover shadow-sm"
          draggable={false}
        />
        {/* The navbar drops the code: with nine links the right cluster has to
            stay narrow enough that the centred row still clears it. The flag
            plus the dropdown's native names carry the meaning, and the button
            keeps its aria-label either way. */}
        {!compact && (
          <span className="font-mono text-[11px] font-bold tracking-wide">
            {active.short}
          </span>
        )}
        <ChevronDown
          size={12}
          strokeWidth={2}
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* pt-2 bridges the hover gap between the button and the panel */}
      {open && (
        <div className="absolute right-0 top-full pt-2 z-50">
          <div className="w-44 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg shadow-lg p-1.5">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setLocale(l.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                  l.id === locale
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                }`}
              >
                <img
                  src={l.flag}
                  alt=""
                  className="w-6 h-4 rounded-[3px] object-cover shadow-sm"
                  draggable={false}
                />
                <span
                  className={`text-[13px] font-medium ${
                    l.id === locale
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {l.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
