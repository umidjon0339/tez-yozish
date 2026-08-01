"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { useAuth, edifyAuthUrl } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

/* One source of truth for the link row, so the desktop bar and the mobile
   sheet can never drift apart. */
const NAV_LINKS = [
  { href: "/courses/course_core_typing", key: "keyboard" },
  { href: "/english", key: "english" },
  { href: "/coding", key: "coding" },
  { href: "/courses", key: "subject" },
  { href: "/books", key: "books" },
  { href: "/games", key: "games" },
  { href: "/compete", key: "compete" },
  { href: "/stats", key: "stats" },
  { href: "/pricing", key: "pricing" },
] as const;

/* Simple Notion-style navigation bar (localized, hence a client component).

   The link row is centred **in the viewport** — `1fr auto 1fr`, so the row's
   midpoint sits on the screen's midpoint at every width, whatever the brand
   and the controls happen to measure.

   That is what makes the rest of the bar a fitting problem rather than a
   styling one. Both side columns are forced to the same width, so the row
   only stays centred while

       row + 2 × controls  ≤  container

   and the widest side is the controls, never the brand. Three things were
   sized to satisfy it with nine links in the longest locale: the brand is
   ~20% narrower than it was (98px → 77px), the navbar's `LanguageSwitcher`
   is `compact` (flag only, no country code — worth ~30px), and the gap is
   `gap-3`, stepping to `gap-4` only from 1400px where the budget allows it.

   Re-measure when a link is added or removed; `docs/app-shell.md` §2 keeps
   the numbers. */
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
      {/* Below xl the link row is `display:none`, so it is not a grid item and
          the two-column track applies; at xl it reappears as the middle one. */}
      {/* max-w-352 (88rem), not 6xl: at 1366 the Russian labels leave only
          8px between the last link and the controls inside a 72rem box. */}
      <div className="max-w-352 mx-auto h-14 px-4 sm:px-6 grid grid-cols-[auto_1fr] min-[1330px]:grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: Brand */}
        <div className="flex items-center">
          {/* ~20% narrower than it was (98px → 78px). Under the `auto 1fr auto`
              track below, brand width comes straight off the middle track, so
              every pixel saved here is a pixel the link row gets. */}
          <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
            {/* One colour, inverted by the theme — the mark masks its own
                face out, so it needs no `bg-*`/`dark:bg-*` pair. */}
            <BrandMark className="w-[18px] h-[18px] shrink-0 text-neutral-950 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
            <span className="font-semibold tracking-tight text-[11px] text-neutral-950 dark:text-white">
              TezYoz
            </span>
          </Link>
        </div>

        {/* Center: navigation links */}
        <nav className="hidden min-[1330px]:flex items-center justify-center gap-3 min-[1400px]:gap-4 text-[14px] font-medium whitespace-nowrap">
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`transition-colors ${
                isActive(href)
                  ? "text-neutral-950 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              }`}
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
            className="min-[1330px]:hidden p-1.5 ml-0.5 rounded-md text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
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
          className="min-[1330px]:hidden border-t border-neutral-200/60 dark:border-white/10 max-h-[calc(100dvh-3.5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <nav className="max-w-352 mx-auto px-4 sm:px-6 py-2 flex flex-col">
            {NAV_LINKS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`py-2.5 px-2 -mx-2 rounded-md text-[15px] font-medium transition-colors ${
                  isActive(href)
                    ? "text-neutral-950 bg-neutral-100 dark:text-white dark:bg-white/10"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
                }`}
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
