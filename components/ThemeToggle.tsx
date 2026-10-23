"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/core/theme";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

/* Navbar light/dark switch. The state itself lives in lib/core/theme (one
   `tz-prefs-v1` key shared with the lesson workspace toggle), so flipping it
   here also flips it inside a lesson and the other way round. */
export function ThemeToggle() {
  const { isDark, toggleDark } = useTheme();
  const { locale } = useLocale();
  const label = isDark ? STR.nav.lightMode[locale] : STR.nav.darkMode[locale];

  return (
    <button
      type="button"
      onClick={toggleDark}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2} aria-hidden />
      ) : (
        <Moon size={18} strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
