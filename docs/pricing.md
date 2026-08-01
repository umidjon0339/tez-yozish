# Pricing page — `/pricing`

`app/pricing/page.tsx` + `components/pricing/FeatureScenes.tsx`.

Two columns: **left** an animated showcase of what the product contains, with
a tab strip under the stage so a visitor can walk through all of it;
**right** the plan itself, sticky, so the price never scrolls away.

**It is deliberately a one-screen page.** Same shell as the other static
pages (`pt-24 px-6`, `max-w-5xl`, `text-3xl font-extrabold` heading, plain
`rounded-lg` cards), and the whole thing — showcase, plan and the **Get Pro**
button — fits above the fold at 1366×768. Anything added here has to earn its
vertical space: an earlier draft carried a hero subtitle, a "from … / month"
chip, a stage caption, a paragraph per feature, an "Everything in Pro"
checklist and three reassurance lines under the CTA, and all of it was cut
for pushing the button off the screen. Keep new copy to titles and short
bullets.

## 1. The plan — one product, three periods

There is exactly **one** plan (Pro). The only choice is how long:

| Period | Discount | Price | Per month |
|---|---|---|---|
| 1 month | — | 50 000 | 50 000 |
| 6 months | 25% | 225 000 | 37 500 |
| 12 months | 50% | 300 000 | 25 000 |

**`MONTHLY_PRICE` at the top of the page is the only figure to edit.**
Every other number on the page is derived from it — the period prices, the
per-month lines, the discount percentages and the savings line. Changing a
discount means editing one `off` in `TERMS`.

## 1b. Nothing about the product's size is typed into copy

Every figure and every product name the page prints is **read from the app**.
This is not tidiness: `GAME_COUNT` used to be a hand-kept constant here and
it silently said `7` for as long as eight games shipped, while `f2b1`/`f2b2`
listed seven game names by hand.

| Claim | Source |
|---|---|
| lessons, sections | `@/lib/curriculum` |
| game count **and game names** | `@/lib/games` (`GAME_COUNT`, `gameNameLines()`) |
| coding stages / tracks / blocks | `@/lib/coding` (`codingTotals`) |
| exam count | `@/lib/exams` |
| grades, total subjects | `@/lib/k12` |

`lib/games.ts` exists for exactly this reason — the roster used to live
inside `app/games/page.tsx`, where the pricing page could not reach it.
`/games` and `/pricing` now render from the same array.

Labels, titles **and** bullets all pass through `fill()` against one
`textVars` map, so a string in `STR.pricing` may hold `{n}`, `{s}` or
`{names}` and never a literal. **Adding a number to the page means adding a
row to `textVars`, never typing the number into `uiStrings.ts`.** Mind that
the placeholder names are positional-by-meaning, not by order: `f10b1` reads
"grades 1-{s}, {n} in all", so `{s}` is the grade count and `{n}` the
subject total — getting them the wrong way round renders "grades 1-151,
11 in all", which type-checks perfectly.

`fmt()` groups thousands with a **non-breaking space** using a plain regex,
not `toLocaleString` — the latter is locale/ICU dependent and would produce a
different string on the server than in the browser, i.e. a hydration error.

## 2. Checkout seam

`startCheckout()` is the single place a payment provider hooks into:

- **logged out** (`ready && !user`) → hands off to `edifyAuthUrl("signup")`,
  the same parent-app hand-off the navbar uses. You cannot own a plan
  without an account.
- **logged in** → opens the order summary. Today that panel says payment
  isn't connected yet; replace that branch with the real call.

The CTA **label never depends on auth state**. `ready` flips a beat after
load, so a label bound to it visibly swaps under the visitor's cursor. The
auth-dependent line is an extra hint *below* the button, which appears rather
than replaces.

## 3. The showcase

`FEATURES` is a list of **ten** tabs; each names a scene id, a lucide icon,
and three `STR.pricing.*` keys (label / title / three bullets). Adding a
feature = one entry there + one scene in `FEATURE_SCENES` + its strings in
all three locales (+ a `textVars` row if it prints a number).

The order is the order a visitor meets the product, not the order the tabs
were written: course · games · english · hands · stats · compete · **coding ·
books · school** · comfort. That is why the string keys run `f1…f6`, then
`f8…f10`, then `f7` — `f7` is Comfort and stays last. **Do not renumber the
keys to match the order**; they are only identifiers, and a rename touches
every locale for no gain.

- The strip is a real `role="tablist"`: arrow keys move between tabs, only
  the active tab is in the tab order (`tabIndex`), and the panel is wired
  with `aria-controls`/`aria-labelledby`.
- It **auto-rotates every 8 s until the visitor touches it**, then stops for
  good (`setAutoPlay(false)` in `pick()`); it never starts under
  `prefers-reduced-motion`.
- When the active tab changes, the strip is scrolled by hand
  (`strip.scrollTo`) rather than `scrollIntoView` — the latter can scroll the
  whole page.
- `includedTitle` survives in `STR.pricing` with no visible use: it is the
  tablist's `aria-label`.

## 4. Scenes — `components/pricing/FeatureScenes.tsx`

Same contract as the thumbnail registry (`docs/thumbnails.md`): fixed
`800×450` viewBox, class and keyframe names namespaced with `useId()`,
neutrals from the `--thumb-*` variables so the art follows the theme, accents
literal hex. `motion()` wraps every rule set so reduced motion kills all of
them at once. `HandsScene` additionally paints each key with its real
`--fz-*` finger colour, so the pricing art and the actual keyboard can't
disagree.

`GamesScene` is the one **scene cover** in the file — a picture of space that
keeps its painted palette in both themes, exactly like the game covers in
`SvgLibrary.tsx`.

### The one trap

A CSS `transform` on an element **overrides that element's SVG `transform`
attribute** — it does not compose with it. Any animated element that also
needs placing must therefore be nested: an outer `<g transform="translate…">`
for position, an inner element carrying the animation class. Getting this
wrong stacks every copy at the origin (it showed up as an orange sliver in
the corner where five stars should have been). Animated elements that are
positioned by `x`/`y` attributes instead are fine, but still need
`transform-box: fill-box` for `transform-origin` to mean the element rather
than the whole viewBox.

## Invariants

- One plan, three periods. `MONTHLY_PRICE` is the source of truth for every
  price shown.
- The page stays one screen tall — the **Get Pro** button must remain above
  the fold at 1366×768, in **all three locales** (uz and ru labels are the
  longest). Measured at 581px with ten tabs.
- **No count, and no product name, is ever typed into `STR.pricing`** — see
  §1b. If a claim can go stale when a game, exam or track ships, it is a bug.
- The CTA label is auth-independent.
- New strings land in `STR.pricing` in all three locales (`docs/app-shell.md`
  §4).
- New scenes are namespaced, theme-aware and reduced-motion-safe; position
  and animation live on different elements.
