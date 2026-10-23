"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CodeXml,
  GraduationCap,
  Keyboard,
  Languages,
  Menu,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { useAuth, edifyAuthUrl } from "@/lib/core/auth";
import { useLocale, type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

/* The five learning areas live under one "Learn" menu; the rest sit in the
   bar. Both lists feed the desktop bar and the mobile sheet, so the two can
   never drift apart. */
const LEARN_LINKS = [
  { href: "/courses/course_core_typing", key: "keyboard", desc: "keyboardDesc", icon: Keyboard },
  { href: "/english", key: "english", desc: "englishDesc", icon: Languages },
  { href: "/coding", key: "coding", desc: "codingDesc", icon: CodeXml },
  { href: "/courses", key: "subject", desc: "subjectDesc", icon: GraduationCap },
  { href: "/books", key: "books", desc: "booksDesc", icon: BookOpen },
] as const;

const NAV_LINKS = [
  { href: "/games", key: "games" },
  { href: "/compete", key: "compete" },
  { href: "/stats", key: "stats" },
  { href: "/pricing", key: "pricing" },
] as const;

const pillCls = (active: boolean) =>
  `px-3 py-1.5 rounded-md transition-colors ${
    active
      ? "text-neutral-950 bg-neutral-200/60 dark:text-white dark:bg-white/10"
      : "text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
  }`;

/* Notion-style navigation bar (localized, hence a client component).

   The link row is centred **in the viewport** — `1fr auto 1fr`, so its
   midpoint sits on the screen's midpoint whatever the brand and controls
   measure. That only holds while `row + 2 × controls ≤ container`, so the
   breakpoint below is a measurement: re-take it when a link is added or
   removed (`docs/app-shell.md` §2 keeps the numbers). */
export function NavBar() {
  const { locale } = useLocale();
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
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

  /* `/courses` must not light up while you are inside
     `/courses/course_core_typing` — that link is "Keyboard". */
  const isActive = (href: string) =>
    href === "/courses" ? pathname === "/courses" : pathname.startsWith(href);

  const loginBtn = (extra = "") => (
    <button
      type="button"
      onClick={() => window.location.assign(edifyAuthUrl("login"))}
      className={`text-[13px] font-medium whitespace-nowrap text-neutral-600 hover:text-neutral-950 px-2.5 py-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 cursor-pointer ${extra}`}
    >
      {STR.nav.login[locale]}
    </button>
  );

  const signupBtn = (extra = "") => (
    <button
      type="button"
      onClick={() => window.location.assign(edifyAuthUrl("signup"))}
      className={`text-[13px] font-medium whitespace-nowrap bg-neutral-950 text-white hover:bg-neutral-800 px-3.5 py-1.5 rounded-md transition-colors shadow-sm active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer ${extra}`}
    >
      {STR.nav.signup[locale]}
    </button>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b select-none bg-[#FAFAFA]/90 border-neutral-200/50 dark:bg-neutral-950/90 dark:border-white/10"
    >
      {/* Below the breakpoint the link row is `display:none`, so it is not a
          grid item and the two-column track applies. */}
      <div className="max-w-352 mx-auto h-14 px-4 sm:px-6 grid grid-cols-[auto_1fr] min-[1150px]:grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
            {/* One colour, inverted by the theme — the mark masks its own
                face out, so it needs no `bg-*`/`dark:bg-*` pair. */}
            <BrandMark className="w-[18px] h-[18px] shrink-0 text-neutral-950 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
            <span className="font-semibold tracking-tight text-[11px] text-neutral-950 dark:text-white">
              TezYoz
            </span>
          </Link>
        </div>

        <nav className="hidden min-[1150px]:flex items-center justify-center gap-1 text-[14px] font-medium whitespace-nowrap">
          <LearnMenu locale={locale} isActive={isActive} />
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={pillCls(isActive(href))}
            >
              {STR.nav[key][locale]}
            </Link>
          ))}
        </nav>

        {/* Right: display controls, then account actions. The divider is what
            stops the five small controls reading as one dense strip. */}
        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <LanguageSwitcher compact />

          {!ready ? null : user ? (
            <div className="flex items-center pl-1.5 ml-0.5 border-l border-neutral-200 dark:border-white/10">
              <UserMenu user={user} />
            </div>
          ) : (
            /* Phones show the auth pair inside the sheet instead — two more
               buttons here would push the bar past a 360px viewport. */
            <div className="hidden sm:flex items-center gap-1.5 pl-2 ml-1 border-l border-neutral-200 dark:border-white/10">
              {loginBtn()}
              {signupBtn()}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? STR.nav.closeMenu[locale] : STR.nav.menu[locale]}
            aria-expanded={open}
            aria-controls="nav-sheet"
            className="min-[1150px]:hidden p-1.5 ml-0.5 rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {open ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet sheet — a panel under the bar rather than a full
          overlay, so the page behind stays visible and nothing needs a
          scroll lock. */}
      {open && (
        <div
          id="nav-sheet"
          className="min-[1150px]:hidden border-t border-neutral-200/60 dark:border-white/10 max-h-[calc(100dvh-3.5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <nav className="max-w-352 mx-auto px-4 sm:px-6 py-2 flex flex-col">
            <p className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {STR.nav.learn[locale]}
            </p>
            {LEARN_LINKS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md text-[15px] font-medium transition-colors ${sheetRowCls(isActive(href))}`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden className="shrink-0 text-neutral-400 dark:text-neutral-500" />
                {STR.nav[key][locale]}
              </Link>
            ))}

            <div className="my-2 border-t border-neutral-200 dark:border-white/10" />
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`py-2.5 px-2 -mx-2 rounded-md text-[15px] font-medium transition-colors ${sheetRowCls(isActive(href))}`}
              >
                {STR.nav[key][locale]}
              </Link>
            ))}

            {ready && !user && (
              <div className="sm:hidden flex items-center gap-2 mt-2 pt-3 pb-1 border-t border-neutral-200 dark:border-white/10">
                {loginBtn("flex-1 text-center")}
                {signupBtn("flex-1 text-center")}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

const isMouseClick = (e: React.MouseEvent) =>
  (e.nativeEvent as PointerEvent).pointerType === "mouse";

const sheetRowCls = (active: boolean) =>
  active
    ? "text-neutral-950 bg-neutral-100 dark:text-white dark:bg-white/10"
    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5";

/* "Learn ▾": opens on hover (click toggles it, for touch screens) and lists
   the learning areas with an icon and a one-line description. */
function LearnMenu({
  locale,
  isActive,
}: {
  locale: Locale;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anyActive = LEARN_LINKS.some(({ href }) => isActive(href));

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

  return (
    <div
      ref={rootRef}
      className="relative"
      // Hover is mouse-only: a tap also fires enter, which would fight its click.
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        // A mouse already opened it on hover, so its click must not close it.
        onClick={(e) => setOpen((v) => (isMouseClick(e) ? true : !v))}
        aria-expanded={open}
        aria-controls="learn-menu"
        className={`flex items-center gap-1 cursor-pointer ${pillCls(anyActive)}`}
      >
        {STR.nav.learn[locale]}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* pt-2 bridges the hover gap between the button and the panel */}
      {open && (
        <div id="learn-menu" className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
          <div className="w-80 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl shadow-lg p-1.5 whitespace-normal">
            {LEARN_LINKS.map(({ href, key, desc, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${
                    active
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 group-hover:text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:group-hover:text-white transition-colors">
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-neutral-950 dark:text-white">
                      {STR.nav[key][locale]}
                    </span>
                    <span className="block text-[12.5px] font-normal text-neutral-500 dark:text-neutral-400">
                      {STR.nav[desc][locale]}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
