# App shell, pages & localization

Next.js 16 App Router, React 19, Tailwind v4. **All pages are
`"use client"`** — the UI is fully localized (en/uz/ru) and must react to
the language switch at runtime.

## 1. Layout — `app/layout.tsx`

- Fonts via `next/font/google`: `Inter` → `--font-inter`, `JetBrains_Mono`
  → `--font-jetbrains-mono`; mapped to Tailwind `--font-sans`/`--font-mono`
  in `globals.css` `@theme inline`.
- `<body>` hardcodes the design system: `bg-[#FAFAFA] text-neutral-950 …
  font-sans` (monochrome "Notion-style" neutrals).
- **Pre-paint boot script** (inline, try/catch): applies
  `localStorage["tz-fz-palette"]` as `data-fz` on `<html>` (unless
  `classic`) and `localStorage["tz-locale"]` as `documentElement.lang` —
  prevents palette/lang FOUC. If you add a new pre-paint preference, extend
  this script.
- Renders `<NavBar />` once, then `<div id="workspace-canvas">…children`.

## 2. NavBar — `components/NavBar.tsx`

Sticky, localized, auth-aware. Left: `TY` chip + `tez/yozish` wordmark
(link to `/`). Center links (all `STR.nav.*`):
`/courses/course_core_typing` (hardcoded course id), `/english`, `/courses`,
`/games`, `/pricing` — note `/english` and `/pricing` routes don't exist
yet. Right: `<LanguageSwitcher />`; then auth cluster — renders `null` until
auth is `ready` (no "Log in" flash), `<UserMenu user />` when signed in,
otherwise Log in / Sign up buttons that leave to
`edifyAuthUrl("login" | "signup")` (see auth.md).

`PaletteSwitcher` is **not** in the NavBar — it lives in the lesson
workspace header only.

## 3. Pages

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Hero with the "type `tez` to launch" easter egg: a global keydown listener advances through `IGNITION_WORD`; completing it routes to the first lesson. Live `[ t e z ]` display; CTAs to `/courses` and `/games`. |
| `/courses` | `app/courses/page.tsx` | Single course card (`course` from `@/lib/curriculum`); thumbnail = `imageSrc` `<img>` else `DynamicThumbnail`. |
| `/courses/[id]` | `app/courses/[id]/page.tsx` | **The `React.use()` example**: props type `params`/`searchParams` as Promises; it unwraps `searchParams` via `use(searchParams)` (`params` is currently unused — data comes from the curriculum singleton). Two views: chapter→section card grid (with emerald progress bars from `progress`), and per-section lesson list grouped by `LESSON_TYPE_ORDER` with unlock gating (`computeUnlocked`), star overlays, "up next" ring. Lesson thumbnail falls back to `TWO_KEYS_FOCUS`. |
| `/games` | `app/games/page.tsx` | One card linking `/typing-ninja` with the `NINJA_ARENA_COVER` thumbnail. Title "Ninja Run" is hardcoded (not localized) — known gap. |
| `/lesson/[id]` | `app/lesson/[id]/page.tsx` | The lesson runtime (own doc). Client page — uses `useParams()`, not promise props. |
| `/auth/callback` | `app/auth/callback/page.tsx` | SSO landing (see auth.md). |
| 404 | `app/not-found.tsx` | Mascot "oops" + localized links home/courses. |

Navigation into a lesson always goes through a brief `isRouting` opacity
fade before `router.push`.

## 4. Localization

- **`lib/locale.tsx`**: `Locale = "en" | "uz" | "ru"`, stored in
  `localStorage["tz-locale"]`, default `en`. Pure module-level external
  store (`useSyncExternalStore`) — no Provider. `useLocale()` returns
  `{ locale, setLocale }`; `setLocale` writes storage, sets
  `document.documentElement.lang`, and notifies all subscribers so every
  mounted component switches together. No `storage`-event listener →
  cross-tab sync is not automatic. Also exports `LOCALES`
  (`{id,label,short,flag}`; flags in `public/flags/{en,uz,ru}.svg`).
- **`lib/uiStrings.ts`**: `STR.<namespace>.<key>[locale]` — namespaces
  `nav`, `auth`, `home`, `courses`, `games`, `notFound`. Chrome/page strings
  only; lesson content is localized in `lessons.json`, and the lesson
  runtime keeps its own `UI` dict.
- **`components/LanguageSwitcher.tsx`**: hover/click dropdown with flag +
  short code; outside-pointerdown + Escape close; used in the NavBar and the
  lesson header.
- New user-facing text must ship in **all three locales**, with short simple
  words (the audience is school students).

The same `useSyncExternalStore` external-store idiom is implemented three
times — locale, palette (`PaletteSwitcher`), and auth (`lib/auth.ts`). Reuse
it for any new global client preference.

## 5. Palette switcher — `components/PaletteSwitcher.tsx`

Finger-zone palette dropdown: 4 palettes (`classic`, `classic-plus`,
`vivid`, `soft`), each 9 swatches in finger order that **must mirror** the
light-mode `--fz-*` values in `globals.css`. Source of truth at runtime is
the DOM (`documentElement.dataset.fz`); `applyPalette` writes
`localStorage["tz-fz-palette"]` and toggles `data-fz` (removed for
`classic`). Mounted in the lesson header with
`onSelect={() => setIsColorful(true)}`. Details in keyboard.md §4.

## 6. `app/globals.css` inventory

- Tailwind v4 wiring: `@import "tailwindcss"`, `tw-animate-css`,
  `@custom-variant dark (&:where(.dark, .dark *))` — dark mode is
  **class-based and page-local** (the lesson workspace toggles its own
  `.dark` wrapper; there is no global dark mode).
- Keyframes (all with reduced-motion guards): `fade-in-up`, `letter-pop`,
  `letter-shake` (typing feedback), `burst-fly` (results celebration),
  `streak-toast`.
- Finger-zone variables and key→finger assignment: see keyboard.md §4.
- Colorful-mode tint rules scoped to `.colorful-mode #keys path`.

## 7. Tooling

- `package.json` scripts: `dev`, `build`, `start`, `lint`,
  `validate:lessons`. Key deps: next 16.2.9, react 19.2.4, three +
  @react-three/fiber 9 + drei 10, firebase 12, tailwindcss 4, lucide-react,
  framer-motion, tw-animate-css.
- `tsconfig.json`: strict; `paths { "@/*": ["./*"] }` (alias to repo root);
  `resolveJsonModule` (how `lessons.json` imports).
- `next.config.ts` is empty; eslint is flat config
  (`eslint-config-next` core-web-vitals + typescript).
- Header/toolbar icons come from `lucide-react` — no hand-rolled inline
  SVGs for standard glyphs (illustrative art like Mascot/thumbnails is the
  exception).

## Invariants

- Every page stays `"use client"` and reads locale via `useLocale()`.
- New strings: add to `STR` (or the lesson `UI` dict) in all three locales.
- Pre-paint preferences go through the layout boot script.
- Next.js 16: server-style pages receive `params`/`searchParams` as
  **Promises** (unwrap with `use()`); client pages use `useParams()`. Check
  `node_modules/next/dist/docs/` before writing framework code.
