"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import type { User } from "firebase/auth";
import { logout } from "@/lib/core/auth";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

/* Avatar + name dropdown for the signed-in student. Same hover-open
   behavior as LanguageSwitcher. */
export function UserMenu({ user }: { user: User }) {
  const { locale } = useLocale();
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

  const name = user.displayName || user.email || "";
  const firstName = name.split(" ")[0];
  const initial = (name[0] || "?").toUpperCase();

  const avatar = user.photoURL ? (
    <img
      src={user.photoURL}
      alt=""
      className="w-6 h-6 rounded-full object-cover"
      draggable={false}
    />
  ) : (
    <span className="w-6 h-6 rounded-full bg-neutral-950 text-white text-[11px] font-bold flex items-center justify-center dark:bg-white dark:text-neutral-950">
      {initial}
    </span>
  );

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
        aria-label={STR.nav.account[locale]}
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
      >
        {avatar}
        <span className="text-[13px] font-medium max-w-28 truncate">
          {firstName}
        </span>
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
          <div className="w-56 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg shadow-lg p-1.5">
            <div className="px-2.5 py-2">
              <p className="text-[13px] font-semibold text-neutral-950 dark:text-white truncate">
                {name}
              </p>
              {user.email && (
                <p className="text-[11px] text-neutral-400 truncate">
                  {user.email}
                </p>
              )}
            </div>
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LogOut size={14} strokeWidth={2} aria-hidden="true" />
              {STR.nav.logout[locale]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
