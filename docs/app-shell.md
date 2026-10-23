# App shell, pages & localization

Next.js 16 App Router, React 19, Tailwind v4. **All pages are
`"use client"`** — the UI is fully localized (en/uz/ru) and must react to
the language switch at runtime.

## 1. Layout — `app/layout.tsx`

- Fonts via `next/font/google`: `Inter` → `--font-inter`, `JetBrains_Mono`
  → `--font-jetbrains-mono`; mapped to Tailwind `--font-sans`/`--font-mono`
  in `globals.css` `@theme inline`.
- `<body>` hardcodes the design system: `bg-[#FAFAFA] dark:bg-neutral-950
  text-neutral-950 dark:text-neutral-100 … font-sans` (monochrome
  "Notion-style" neutrals).
- **Pre-paint boot script** (inline, try/catch): adds `dark` to `<html>` when
  `localStorage["tz-prefs-v1"].dark` is set, applies
  `localStorage["tz-fz-palette"]` as `data-fz` on `<html>` (unless
  `classic`) and `localStorage["tz-locale"]` as `documentElement.lang` —
  prevents theme/palette/lang FOUC. If you add a new pre-paint preference,
  extend this script.
- Renders `<NavBar />` once, then `<div id="workspace-canvas">…children`.

## 2. NavBar — `components/NavBar.tsx`

Sticky, localized, auth-aware. Left: the **`BrandMark`** keycap + the
wordmark (link to `/`).

`components/BrandMark.tsx` draws a keyboard keycap with `Y` on it, from
**one colour**: a mask paints the cap body in `currentColor`, punches the
top face back out to transparent and draws the legend in again. The face
therefore shows whatever is behind the mark, so the whole logo inverts by
setting `text-*` on the parent — where the old `TY` chip needed a
`bg-neutral-950 … dark:bg-white dark:text-neutral-950` pair. The mask id is
`useId()`-namespaced; two marks on one page would otherwise collide and one
would disappear. The front edge is deliberately thicker than the sides —
that asymmetry is what reads as a *key* rather than a rounded box.

`app/icon.svg` is the same drawing for the browser tab, and the App Router
picks it up by filename (it sits alongside the legacy `favicon.ico`; both
get a `<link>`, and SVG wins in modern browsers). It cannot use the
`currentColor` trick — a tab strip's colour is not ours to know — so it
carries its own dark plate with a painted face, and is cut to three shapes
because at 16px nothing finer survives. **Change one and change the other.** The nine links live in one `NAV_LINKS` array (all
`STR.nav.*`) that both the desktop row and the mobile sheet map over, so
they cannot drift: `/courses/course_core_typing` (hardcoded course id),
`/english`, `/coding`, `/courses`, `/books`, `/games`, `/compete`,
`/stats`, `/pricing`. The active one is marked with `aria-current="page"` and
near-black text — `/courses` matches exactly, everything else by prefix, so
"Subjects" does not light up while you are inside the "Keyboard" course.

The row is a `1fr auto 1fr` grid (brand · links · controls) and the links are
**centred in the viewport** — the row's midpoint sits on the screen's
midpoint at every width, whatever the brand and controls happen to measure.
Below the breakpoint the link cell is `display:none`, so it stops being a
grid item and the `grid-cols-[auto_1fr]` track applies instead.

**Viewport centring makes the rest of the bar a fitting problem, not a
styling one.** Both side columns are forced to the same width, so the row
stays centred only while

```
row + 2 × controls ≤ container
```

and the widest side is always the controls, never the brand. Three things
are sized to satisfy that with nine links in the longest locale:

| lever | value | why |
|---|---|---|
| brand | ~20% narrower, 98px → **77px** (`text-[10px]` chip, `text-[11px]` wordmark, `gap-1.5`) | asked for, and it buys headroom |
| `LanguageSwitcher` | **`compact`** in the navbar — flag only, no country code | worth ~30px, and the dropdown still names every language |
| link gap | **`gap-3`**, stepping to `gap-4` only from 1400px | 1330 cannot afford `gap-4`; 1400 can |

Note the controls are not one width: the auth labels are localized, so the
cluster measures 250px in en, 286px in ru and **308px in uz** — uz is the
binding case even though ru has the longest link row.

**The breakpoint (`min-[1330px]`) is a measurement — re-take it whenever a
link is added or removed.** Verified at
1330/1360/1399/1400/1512/1920/2560 in all three locales: the row centre sits
on the viewport centre to **0px** at every one (a single 1px reading at 1399
in ru is sub-pixel rounding on an odd container width). Worst clearance
between the last link and the controls is 16px (ru at exactly 1330), 34px at
1366; no horizontal overflow anywhere, and 1329 and below correctly fall to
the sheet.

There is deliberately **no `2xl:` step**. Every time the row grew, an
upsizing step at 1536 inflated it faster than the container did — the
1400px `gap-4` step is sized against the fit rule above, not by eye.

Right: `<ThemeToggle />`, `<LanguageSwitcher compact />`, then a `border-l` divider
and the auth cluster — renders `null` until auth is `ready` (no "Log in"
flash), `<UserMenu user />` when signed in, otherwise Log in / Sign up
buttons that leave to `edifyAuthUrl("login" | "signup")` (see auth.md). The
divider is what keeps the five small controls from reading as one dense
strip.

**Mobile sheet** (`#nav-sheet`, `min-[1330px]:hidden`): a hamburger toggles a panel
*under* the bar — not a full overlay, so the page stays visible and nothing
needs a scroll lock. It holds the same nine links plus, on `<sm` only, the
Log in / Sign up pair (two more buttons in the bar itself would push a
360px viewport into overflow). Closes on link click, outside pointerdown,
and Escape. There is deliberately **no `setOpen` in a `useEffect` on
`pathname`** — the React Compiler lint rule `set-state-in-effect` rejects
it, and the link `onClick` covers the same case.

`PaletteSwitcher` is **not** in the NavBar — it lives in the lesson
workspace header only.

## 2b. Theme — `lib/core/theme.tsx` + `components/ThemeToggle.tsx`

Dark mode is **app-wide and class-based**: the store's only side effect is
`documentElement.classList.toggle("dark", …)`, which drives every `dark:`
utility. It persists in the **`dark` field of the same `tz-prefs-v1` blob**
the lesson workspace uses for `audio`/`colorful`/`hands`, so the navbar
switch and the lesson header switch are one setting — both write through
`useTheme()`, and anything else touching that key must **merge**, never
overwrite. `useTheme()` returns `{ isDark, setDark, toggleDark }`; its
snapshot reads the class off `<html>` (what the pre-paint script already
decided), so there is no flash and no second source of truth.

Every page carries `dark:` variants over the neutral palette (`bg-white` →
`dark:bg-neutral-900`, `border-neutral-200` → `dark:border-neutral-800`,
`text-neutral-500` → `dark:text-neutral-400`, and inverted `bg-neutral-950
text-white` buttons → `dark:bg-white dark:text-neutral-950`). Follow that
mapping in new UI. The hand-built SVG charts can't use utilities, so they
paint with the `--chart-*` / `--ramp-*` variables in `globals.css` instead of
hex — new chart ink goes there too.

The in-canvas games (`/games/typing-ninja`, `/games/rhino-dash`, `/games/sky-hop`,
`/games/beam-break`, `/games/alien-drop`, `/games/star-type`, `/games/tug-of-typing`) keep their own
authored art and menu palettes and deliberately ignore the switch.

## 3. Pages

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | **A Monkeytype-style typing test — own doc: `docs/home-test.md`.** Above the fold: the config pill (`TestConfigBar`), the words + caret (`TestWords`), the result screen (`TestResult`), and under them the real `KeyboardWithHands` (lazy-loaded from `components/keyboard/KeyboardStage.tsx`, `isColorful={false}`, follows the theme switch via `isDark`) pointing at the next letter. The engine is `components/home/useTypingTest.ts`; settings live in `components/home/testConfig.ts` (`tz-typetest-v1`). The hero must fit `100dvh` minus the navbar — `STAGE_WIDTH` caps the keyboard by the leftover height and `STAGE_TAIL` reserves the room the wrists need below the stage, so the hands are shown whole. Below the fold (`#menu`): six menu cards (`CARDS`, lucide icons, first one accented "Start here") linking keyboard course / games / english / courses / compete / stats. The test's keydown listener is gated on an IntersectionObserver so `space`/`tab` scroll normally once the menu is in view. |
| `/courses` | `app/courses/page.tsx` | **Two catalogues, one card grid.** Group 1 "Exams" = `EXAM_COVER` cards from `@/lib/catalog/exams` (IELTS / SAT / TOEFL iBT / CEFR), each drilling into its real papers with a score panel. Group 2 "School subjects" = the K-12 ladder from `@/lib/catalog/k12` — 11 `GRADE_COVER` cards that swap the page to a `SUBJECT_COVER` grid for that grade, with a "Back to Grades" button mirroring `/courses/[id]`'s section drill-down. The page's `View` is a discriminated union (`grade` \| `exam` \| null), so both catalogues drill down through one state; deep-linkable on entry via `?grade=5` or `?exam=ielts` (`use(searchParams)`, local state after). All grids share the `GRID`/`CARD` constants at the top of the file so this page and `/courses/[id]` read as one surface. **Subject cards are display-only** — there is no subject content yet, so they carry no click handler and no hover affordance. |
| `/courses/[id]` | `app/courses/[id]/page.tsx` | **The `React.use()` example**: props type `params`/`searchParams` as Promises; it unwraps `searchParams` via `use(searchParams)` (`params` is currently unused — data comes from the curriculum singleton). Two views: chapter→section card grid (with emerald progress bars from `progress`), and per-section lesson list grouped by `LESSON_TYPE_ORDER` with unlock gating (`computeUnlocked`), star overlays, "up next" ring. Lesson thumbnail falls back to `TWO_KEYS_FOCUS`. |
| `/games` | `app/games/page.tsx` | The arcade grid. One uniform card per game, driven by the `GAMES` array in `lib/catalog/games.ts` (`slug` / `name` / `svgId` / `params`) — **card order is that array's order**, not folder or alphabetical order, so re-ordering the shelf is a one-line move. Game names stay English in every locale, like the games' own title screens. Each card footer carries a like heart and a play counter from `lib/catalog/gameStats.ts` (`tz-games-v1`): the heart is a toggle whose click must `preventDefault()` (it sits inside the card's `Link`), the eye is how many times this browser opened that game — counted by `useGameView(slug)` in each game's `page.tsx`, so direct links count too. Both counters are **local to the browser**; the labels say "you" for that reason. Every game lives in `app/games/<slug>/` and is served at `/games/<slug>`; `next.config.ts` redirects the old root URLs (`/sky-hop` → `/games/sky-hop`). |
| `/books` | `app/books/page.tsx` | **Book library — own doc: `docs/books.md`.** Grid of `BOOK_COVER` cards (shipped books from `data/books.json` + the learner's own from `tz-books-v1`), with an "Add a book" tile that opens a paste dialog showing the resulting page count live. |
| `/books/[id]` | `app/books/[id]/page.tsx` | Two views: the page list (best WPM or word count per page, delete affordance on the learner's own books) and the practice run. Practice mounts the **home page's** `useTypingTest` with `mode:"custom"` — no separate engine. Client page, so `useParams()`. |
| `/coding` | `app/coding/page.tsx` | **The coding catalogue — own doc: `docs/coding.md`.** Six stages (beginner→master) × 35 tracks × 188 module blocks from `@/lib/catalog/coding`, all rungs on one page; a track drills into its numbered block list plus the `typingFocus` keycaps and `sample` code line that tie the unit to the typing engine. Deep-links via `?track=`. Classification only — no lesson content yet. |
| `/pricing` | `app/pricing/page.tsx` | The one paid plan (Pro) sold for three periods (own doc: `docs/pricing.md`). Left = a 7-tab feature showcase driven by `components/pricing/FeatureScenes.tsx`; right = the sticky period picker and CTA. |
| `/lesson/[id]` | `app/lesson/[id]/page.tsx` | The lesson runtime (own doc). Client page — uses `useParams()`, not promise props. |
| `/auth/callback` | `app/auth/callback/page.tsx` | SSO landing (see auth.md). |
| 404 | `app/not-found.tsx` | Mascot "oops" + localized links home/courses. |

Navigation into a lesson always goes through a brief `isRouting` opacity
fade before `router.push`.

## 4. Localization

- **`lib/core/locale.tsx`**: `Locale = "en" | "uz" | "ru"`, stored in
  `localStorage["tz-locale"]`, default `en`. Pure module-level external
  store (`useSyncExternalStore`) — no Provider. `useLocale()` returns
  `{ locale, setLocale }`; `setLocale` writes storage, sets
  `document.documentElement.lang`, and notifies all subscribers so every
  mounted component switches together. No `storage`-event listener →
  cross-tab sync is not automatic. Also exports `LOCALES`
  (`{id,label,short,flag}`; flags in `public/flags/{en,uz,ru}.svg`).
- **`lib/core/uiStrings/`**: `STR.<namespace>.<key>[locale]` — one file per
  namespace (`nav.ts`, `home.ts`, `games.ts`, …), combined into `STR` by
  `index.ts`; a new namespace is a new file plus one line there. Chrome/page strings
  only; lesson content is localized in `lessons.json`, and the lesson
  runtime keeps its own `UI` dict.
- **`components/LanguageSwitcher.tsx`**: hover/click dropdown with flag +
  short code; outside-pointerdown + Escape close; used in the NavBar and the
  lesson header.
- New user-facing text must ship in **all three locales**, with short simple
  words (the audience is school students).

The same `useSyncExternalStore` external-store idiom is implemented three
times — locale, palette (`PaletteSwitcher`), and auth (`lib/core/auth.ts`). Reuse
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
  **class-based and global**: `lib/core/theme.tsx` toggles `.dark` on `<html>`
  (§2b).
- Chart ink variables (`--chart-*`, `--ramp-*`) with a `.dark` override —
  the hand-built SVG charts in `components/stats/` read these instead of
  hard-coded hex so they follow the theme.
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
- Every page ships `dark:` variants (§2b) — new UI is not done until it
  reads correctly with `.dark` on `<html>`.
- New strings: add to `STR` (or the lesson `UI` dict) in all three locales.
- Pre-paint preferences go through the layout boot script.
- Next.js 16: server-style pages receive `params`/`searchParams` as
  **Promises** (unwrap with `use()`); client pages use `useParams()`. Check
  `node_modules/next/dist/docs/` before writing framework code.
