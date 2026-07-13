"use client";

import React from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserMenu } from "@/components/UserMenu";
import { useAuth, edifyAuthUrl } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

/* Simple Notion-style navigation bar (localized, hence a client component). */
export function NavBar() {
  const { locale } = useLocale();
  const { user, ready } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/50 select-none">
      <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between relative">
        {/* Left: Brand */}
        <div className="flex items-center z-10">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="font-mono text-[11px] bg-neutral-950 text-white font-bold px-1.5 py-0.5 rounded tracking-tighter group-hover:bg-neutral-800 transition-colors shadow-sm">
              TY
            </span>
            <span className="font-semibold tracking-tight text-sm text-neutral-950">
              tez<span className="text-neutral-400 font-light">/</span>yozish
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 text-[15px] font-medium text-neutral-500 z-0">
          <Link href="/courses/course_core_typing" className="hover:text-neutral-950 transition-colors">
            {STR.nav.keyboard[locale]}
          </Link>
          <Link href="/english" className="hover:text-neutral-950 transition-colors">
            {STR.nav.english[locale]}
          </Link>
          <Link href="/courses" className="hover:text-neutral-950 transition-colors">
            {STR.nav.subject[locale]}
          </Link>
          <Link href="/games" className="hover:text-neutral-950 transition-colors">
            {STR.nav.games[locale]}
          </Link>
          <Link href="/compete" className="hover:text-neutral-950 transition-colors">
            {STR.nav.compete[locale]}
          </Link>
          <Link href="/stats" className="hover:text-neutral-950 transition-colors">
            {STR.nav.stats[locale]}
          </Link>
          <Link href="/pricing" className="hover:text-neutral-950 transition-colors">
            {STR.nav.pricing[locale]}
          </Link>
          
        </div>

        {/* Right: Language + Auth Actions. Auth lives on the parent app
            (edify-student) — the buttons start the SSO round-trip. */}
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          {!ready ? null : user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.location.assign(edifyAuthUrl("login"))}
                className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 px-3 py-1.5 rounded-md transition-colors hover:bg-neutral-100 cursor-pointer"
              >
                {STR.nav.login[locale]}
              </button>
              <button
                type="button"
                onClick={() => window.location.assign(edifyAuthUrl("signup"))}
                className="text-[13px] font-medium bg-neutral-950 text-white hover:bg-neutral-800 px-4 py-1.5 rounded-md transition-colors shadow-sm active:scale-95 cursor-pointer"
              >
                {STR.nav.signup[locale]}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
