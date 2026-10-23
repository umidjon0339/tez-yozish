# components/home/ — the home-page typing test

Read **`docs/home-test.md`** before editing. `/` is a Monkeytype-style test:
`TestConfigBar` on top, `TestWords` under it, `TestResult` when it ends, and
the shared `KeyboardWithHands` stage below — all inside one viewport.

Hard rules:
- **The input model is a copy, not a design.** Space commits a half-typed word,
  extra letters are kept, backspace only steps back into an *imperfect* word, a
  mistyped letter still shows the **target** letter in red, and the last word
  ends the test without a trailing space. Every one of those is what the
  reference does; "fixing" any of them breaks muscle memory. `docs/home-test.md`
  §2 is the list.
- **Never build the words during render.** Word/quote choice is
  `Math.random()`, so the server and client would disagree —
  `emptyModel(cfg, false)` starts empty and the mount effect fills it. Same
  reason settings come from the `testConfig.ts` store (with a
  `getServerSnapshot`) rather than `useState` + `loadConfig()` in an effect.
- **Render from the snapshot, never from the ref.** The live model is a mutable
  ref (games idiom), but `react-hooks/refs` forbids reading `ref.current`
  during render — the hook publishes a `Snapshot` into state instead. Keep
  `<Word>` memo'd so a keystroke re-renders one word.
- **Never wire `reset` to an `onClick` directly.** It takes an optional word
  list, so a click handler hands it the MouseEvent as the words and the next
  render dies on `words.map is not a function`. The hook exports `restart` and
  `repeat` as zero-argument wrappers — use those.
- **The caret and line scroll stay imperative** (a layout effect writing
  `transform`). They change on every keystroke; React state would cost a
  re-render of the whole block.
- **`TestWords` has two variants, and `window` is the home page.**
  `variant="window"` (default) is the reference's three-line viewport with the
  `translateY` block scroll — leave it alone. `variant="full"` lays the whole
  text out, puts no transform on the block and scrolls the *container*
  instead; `/books` uses it so a book page is not truncated to three lines.
  Any change here must be checked in **both** modes.
- **Do not retune the caret by eye.** `.tz-caret` and `.tz-words` must keep the
  *same* `transform 100ms linear`, and the caret must stay a child of
  `.tz-words`: that is what makes it glide evenly between letters and hold
  perfectly still through a line break (measured 0.0 px drift). An ease curve or
  a mismatched duration brings back the jump and the wobble — `docs/home-test.md`
  §8 has the frame-by-frame numbers.
- **No typed text goes in the code.** Every word, sentence and quote lives in
  `data/typing-texts.json`; `lib/typing/typingTest.ts` only looks things up. Subject
  names come from the normalized `lib/catalog/k12` model, never the raw curriculum
  JSON, and the two files join on the **k12 subject slug** — a join nothing
  type-checks and which fails *silently* into generic text. Run
  `npm run validate:texts` after touching either file.
- **The config bar is separate pills**, gap-separated, not one bar with
  dividers — that is the reference's shape. The mode pill's `subject` item is our
  replacement for the reference's `zen`: it fills the value pill with the five
  slugs in `FEATURED_SUBJECTS` and nothing else. It had a grade step in front of
  the subjects once; it was cut for costing two clicks before you could type.
  The text-language pill sits on a **second, centred line** below the rest.
- **The hero keyboard is always in `colorful-mode`** — unlike the lessons,
  where it is a toggle. The colours are the shared `--fz-*` finger-zone
  palette, so it follows the PaletteSwitcher and matches the lessons; never
  hard-code hexes here.
- **Anything added above the stage must be paid for in `STAGE_WIDTH`.** The bar
  is one line in most modes and three in `subject` mode, so `app/page.tsx`
  reserves the tall case (`27.9rem`) — and the result screen *unmounts* the bar
  rather than fading it, because 103 px of invisible bar is enough to grow a
  scrollbar. Re-measure at 1366×768 in `subject` mode, not just in `time`.
- **The wrists are meant to be cut off.** `STAGE_TAIL` deliberately reserves
  less room than the hand art needs (8 % against the 19.5 % it would take) so
  the keyboard can match a lesson's size; the hero's `overflow-hidden` makes the
  cut. `STAGE_TAIL` and the `2.21` in `STAGE_WIDTH` are one rectangle described
  twice — change one and you must recompute the other
  (`2.69 / (1 + tail × 2.69)`).
- **Text banks are Latin only.** The keyboard/hands art is US QWERTY, so a
  Cyrillic bank would highlight nothing. The *interface* stays en/uz/ru — new
  strings go in `STR.test` in all three locales.
- **The hero must fit `100dvh` minus the navbar** at 1366×768 (mind the `-1px`
  for the navbar's border). The result screen unmounts the keyboard, the scroll
  hint and the whole menu section on purpose — it is a place to read a result,
  not to navigate — so anything added to `TestResult`/`Standing` has to stay
  inside that one screen. Re-measure; do not let the page grow a scrollbar.
- **`Standing` is two columns and needs to stay two.** The podium alone makes a
  real 62 wpm look like failure next to 282; the speed histogram beside it is
  what shows the same result is ahead of most people. One `fetchSpeedHistogram`
  feeds both the curve and the place, and the chart is the shared
  `components/stats/Histogram` — do not fork it.
- **The learner's place is a rank among *tests in the public histogram*, not a
  ladder position** — even though the row now prints it as bare digits next to
  `1`/`2`/`3` (the `≈ #` prefix was cut on request). Do not carry that number
  into copy that calls it a position among people. The board it was measured
  against (`all-time · english · 60s`) survives only as a hover `title` on the
  heading. A failed fetch renders nothing: never an error or a spinner over a
  result the learner earned.
- **The rank column is left-aligned on purpose.** Right-aligning it is what left
  the hole beside `#1` that the current layout exists to close; `1` and
  `376,317` must start at the same x.
- **Speed samples are backfilled on every keystroke, not just by the clock.**
  The 100 ms interval has been measured not firing once across a ten-second
  test; when that happens the chart vanishes and consistency lies with a clean
  `100%`. Anything that changes `sampleUpTo`'s call sites must keep a path that
  does not depend on a timer.
- The test swallows `space` and `tab`, so its keydown listener is gated on the
  hero's IntersectionObserver. Any new full-page section under `/` must keep
  that gate or the page stops scrolling with the keyboard.
