# The home-page typing test

`/` is a typing test built to the **Monkeytype** layout, with our keycap +
hands art underneath it. This doc is the contract for everything under
`components/home/` and `lib/typing/typingTest.ts`.

Files:

| File | Role |
|---|---|
| `data/typing-texts.json` | **every word, sentence and quote the test can produce** (§9) |
| `scripts/validate-typing-texts.mjs` | `npm run validate:texts` — guards the join with the curriculum (§9) |
| `lib/typing/typingTest.ts` | pure model: modes, text lookup, generation, scoring. No React, no text. |
| `components/home/testConfig.ts` | the settings store (`tz-typetest-v1`), `useSyncExternalStore` idiom |
| `components/home/useTypingTest.ts` | the engine — the input model and the clock |
| `components/home/TestConfigBar.tsx` | the config pill above the words |
| `components/home/TestWords.tsx` | the words, the caret, the three-line scroll |
| `components/home/TestResult.tsx` | the result screen + speed chart |
| `components/home/Standing.tsx` | the podium + the learner's place on it (§7) |
| `app/page.tsx` | the page: hero above the fold, menu cards below it |

---

## 1. What was copied, and what was not

Copied 1:1 from the reference, because these are the things people already
have in their fingers and any deviation reads as a bug:

- the **config bar shape**: **separate pills** with a gap between them —
  `[@ punctuation  # numbers]` `[⏱ time  A words  ❝ quote  🎓 subject  🔧 custom]`
  `[the value for that mode]` — every item icon-then-text, lowercase mono,
  active bright and inactive grey, and the whole bar **fading out while a test
  runs**. They are pills separated by space, not one bar with dividers; that is
  what the reference does and it is easy to get wrong;
- the **input model** (§2);
- **three lines** of text with the active line scrolled to the middle, a
  blinking caret that goes solid while you type, the counter (seconds left, or
  `12/25`) above the text on the left;
- `tab` restarts, `enter` on the result screen starts the next test;
- the **result screen**: two headline numbers on the left, wpm/raw over time on
  the right, secondary figures in a row underneath.

Deliberately different:

- **A text-language chip instead of a language menu**, and it sits on a
  **second line of its own, centred** under the other pills. The banks are Latin
  only (`english`, `o'zbekcha`) because the on-screen keyboard and hands are a
  US QWERTY layout — a Cyrillic bank would light up nothing. The *interface* is
  still en/uz/ru like the rest of the app; only the typed text is limited.
  This is why the ru locale still sees English words by default.
- **The keyboard and hands.** The reference has no keyboard; the whole point of
  this app is that it does. It shows the next letter and its finger, on the
  same stage the lessons use — with **colorful mode always on**, so every
  keycap carries its finger-zone colour (`--fz-*`, `app/globals.css`). In the
  lessons that is a toggle, because someone drilling one row wants the rest of
  the board quiet. The hero has the opposite job: the tints are how a visitor
  who has never touch-typed learns that fingers own zones.
- **`zen` is replaced by school subjects.** That slot in the mode pill is
  `subject`: pressing it fills the value pill with **five subjects and nothing
  else** (`FEATURED_SUBJECTS` in `lib/typing/typingTest.ts` — edit that list to change
  them), whose text comes from `data/typing-texts.json` (§9). It had a grade
  step in front of the subjects at first; it was cut because two clicks before
  you can type a word is two clicks too many on a page whose job is to start a
  test. That is also why there is no grade in `TestConfig` any more, and why
  band variants are **pooled** rather than filtered (§9). Zen itself is not
  implemented at all — there is no free-typing mode.
- **No account, no leaderboard, no command line (`esc`).** Results go into
  `lib/typing/stats.ts` (§5) instead.
- **Nothing below the fold in the reference.** Here the six menu cards live in
  a second section — see §6, and note the keydown gate it implies.

---

## 2. The input model — the part to not "improve"

`useTypingTest.ts`. Every rule here exists because the reference does it and
muscle memory expects it:

- **Space always commits.** Half a word typed? The rest counts as `missed` and
  you move on. Typing is never blocked, ever. A leading space (empty word) is
  ignored instead.
- **Extra letters are kept**, not dropped, up to `target.length + 12`. They
  render in a dim red past the end of the word and count as `extra`.
- **Backspace at the start of a word steps back** into the previous word — but
  only if that word is not already perfect. `ctrl`/`alt`+backspace clears the
  whole current word.
- **A mistyped letter still shows the target letter**, coloured red. The text
  stays readable; the reference does the same. Do not switch it to showing what
  was actually typed.
- **The last word ends the test the moment it is correct** — no trailing space.
- Modifier combos other than the backspace ones are left to the browser.
- Keys are ignored while focus is in an `input`/`textarea`/contenteditable, so
  the custom-text box can be typed into.

Zen is the one mode with no target text: what you type *becomes* the text
(`words[wordIdx] = input` on every keystroke), so the generic renderer paints
it all as correct and `enter` finishes the run.

## 3. Architecture: one ref, one snapshot

The live model is a single mutable `Model` in a ref — same idiom as the canvas
games — so the keydown handler never reads a stale closure. Rendering does
**not** read that ref: after each keystroke the hook publishes a `Snapshot`
into `useState`. Two reasons:

1. `react-hooks/refs` (on in this repo's eslint config) rejects reading
   `ref.current` during render. `components/keyboard` and the canvas games all
   pass that rule; new code must too.
2. `<Word>` is `memo`'d, so a keystroke re-renders exactly one word.

The caret and the line scroll are written straight onto the DOM in a layout
effect in `TestWords.tsx` — measuring the active letter's `offsetLeft` and the
active word's `offsetTop`. Keep them out of React state: they change on every
keystroke.

### `TestWords` has two variants

`variant="window"` (the default, and **the home page**) is the reference's
three-line viewport: the block carries the `translateY` and slides under a
still caret. Nothing about it may change.

`variant="full"` lays the whole text out and scrolls the **container**
(`scrollTop`) instead, keeping one line of air above and below the caret and
only moving when the caret would leave the box — so reading ahead or
scrolling back is not fought. The block itself carries no transform in this
mode. `/books` uses it, because three lines of a 130-word book page reads as
truncated text. The caret maths is shared: both modes position it from the
same measured `offsetLeft`/`offsetTop`.

Its **scrollbar is hidden** — `.tz-noscrollbar` in `globals.css`
(`scrollbar-width: none` + a zero-width `::-webkit-scrollbar`). This is the
only scroller in the app that moves *while you type*, and a bar twitching
beside the words every time the caret pulls the box down is motion in the
corner of the eye at exactly the wrong moment. Wheel, trackpad, keys and the
caret-follow all still work, and the hidden bar takes **0px** of gutter, so
the text does not reflow when a page becomes long enough to scroll.

Two things are generated with `Math.random()` — the words and the quote — so
**neither can be built during render**: the server and the client would
disagree. `emptyModel(cfg, false)` deliberately returns a test with *no* words,
and the mount effect fills it in. Same reason `testConfig.ts` is a store with a
`getServerSnapshot` rather than a `useState` + `useEffect(loadConfig)`.

## 4. Scoring

- `wpm` = correct characters ÷ 5 ÷ minutes. A word typed perfectly also scores
  its trailing space, which is what makes the figure match other typing sites.
- `raw` = every character typed, correct or not, same formula.
- `accuracy` = correct keypresses ÷ all keypresses, counted **live** (not
  recomputed from the text) so a fixed mistake still costs you.
- `consistency` = 100 × (1 − coefficient of variation of the per-second raw
  speed). The per-second samples are also the result chart's data.
- **The samples are filled in by `sampleUpTo`, called from the clock _and_ from
  every keystroke.** The clock alone is not trustworthy: the 100 ms interval was
  measured going a full ten-second test without firing once, and when that
  happens the chart silently disappears and consistency reports a fake 100 %.
  Backfilling on each keystroke ties the series to the typing itself. `finish()`
  also closes the series on the true end time, so a short test still has a
  chart.
- `chars` is the four-way split shown as `correct/incorrect/extra/missed`.

## 5. Stats

The test feeds the all-time dashboard like every other activity:
`createStatsSession()` records one stroke per keystroke with the *expected*
character, and `recordAttempt()` files the finished run under the lesson id
**`home_test`** with `type: "test"` and `stars: 0`. That id is not in the
curriculum on purpose — nothing resolves attempts back to lessons.

## 6. Fitting one screen

The hero is `min-h-[calc(100dvh-3.5rem-1px)]` (viewport minus the navbar and its
border) and must stay inside it at 1366×768. Two constants in `app/page.tsx` do
the work:

```
STAGE_TAIL  = 8%
STAGE_WIDTH = min(100%, 46rem, calc((100dvh - 27.9rem) * 2.21))
```

**The hands are drawn whole**, wrists included, and the art runs **52% of the
stage's height past the bottom of its box** (measured: 124 px below a 238 px
stage). `STAGE_TAIL` is padding on a wrapper around the stage that reserves room
for it, as a *percentage of the stage width* so it scales with the stage.

It reserves **less than the art needs, on purpose.** Reserving all 52 % (a
`19.5%` tail) held the keyboard to 605 px wide at 1366×768 — two thirds of a
lesson's 728 px — to protect wrists nobody looks at. The tail is now 8 %, and
the rest of the overhang is **clipped by the hero's `overflow-hidden`**, which
is exactly what a lesson page does at its footer. The cut lands in the wrists;
fingers, knuckles and most of the palm survive. At 1366×768 the stage is now
711 px wide and its keycaps span 577 px against a lesson's 592 — the same
keyboard, give or take 2 %.

`STAGE_WIDTH` caps the keyboard's *width* by the height left over, so a short
window shrinks the keyboard rather than pushing content off-screen. The `2.21`
is `2.69 / 1.215`: the stage's aspect ratio over the 1.215 stage-heights it
occupies with the shortened tail. **Change `STAGE_TAIL` and you must change this
too** — they describe the same rectangle, and the identity is
`2.69 / (1 + tail × 2.69)`.

The `27.9rem` (446 px) is everything on the screen that is *not* the stage
wrapper: navbar, page padding, the config bar, the counter, three lines of test
text and the restart row. It is measured **at its tallest**, not as it usually
looks: the config bar is one line of pills in most modes but three in `subject`
mode (modifiers+modes, the five subjects, then the language line), 37 px more.
Reserve the common case instead and picking a subject pushes the hands off a
768 px screen. New content above the fold means raising this number.

Verified at 1280×620, 1024×700, 1366×768 and 1920×1080: the hero fills its
screen exactly at each, and the stage shrinks with the window rather than
overflowing it.

The hero's `overflow-hidden` is now **load-bearing, not a guard**: it is what
performs the wrist cut described above. `.kb-stage` is `position: relative` with
no z-index, so its `z-10` hands layer lives in the root stacking context and
would otherwise paint straight over the menu section below. Remove that clip and
you get hands lying across the menu cards, not taller hands.

Because the test swallows `space` and `tab`, the keydown listener is gated on
an `IntersectionObserver`: once the hero is less than 45 % visible the page
scrolls normally again. Anything else that adds a full-page section under `/`
has to keep that gate.

**The result screen is the whole page.** When the test ends, the keyboard stage,
the config bar and the entire menu section are unmounted: nothing is left but
the numbers. The config bar is *unmounted*, not merely faded — in `subject` mode
that is 103 px of invisible bar above the result, which is enough on its own to
grow the scrollbar this section exists to prevent. That is deliberate — it is a place to read a result, not a place to
navigate — and it is also what buys the podium its room. It must fit `100dvh`
exactly, hence the `-1px` in the hero's `min-h` (the navbar's bottom border);
without it the page grows a scrollbar with nothing to scroll to.

## 7. The podium and the speed map

`Standing.tsx` closes the result screen with **two columns**: the podium on the
left, the world speed histogram on the right, sharing one header shape and one
card height so they line up top and bottom without being told to.

They are there together because either one alone misleads. The **podium** is the
ceiling — Monkeytype's three fastest humans, crown/silver/bronze and avatars,
then a `⋯`, then the learner's own row inverted to solid black-on-white so the
two can never be read as one list. Next to 282 wpm, a real 62 wpm looks like
failure. The **speed map** is the crowd: the same result sitting to the right of
most of the distribution. Keep both, or the screen only tells half the truth.

Both come from the **same read-only Monkeytype client `/compete` is built on**
(`lib/catalog/monkeytype.ts` — no API key, CORS-open, cached in sessionStorage):
`fetchLeaderboard` for the podium, and **one** `fetchSpeedHistogram` feeding
both the curve and `rankForWpm`. The chart itself is the shared
`components/stats/Histogram` — the same component `/compete` draws, not a copy.

**The learner's place is an estimate, and nothing on screen says so any more.**
`rankForWpm` counts how many tests in Monkeytype's public speed histogram were
faster than this result, so `376,317` means "about that many sampled *tests*
beat it" — not "you are 376,317th on a ladder". It carried a `≈ #` prefix for
exactly that reason; the prefix was cut on request, and the row now prints bare
digits beside `1`, `2`, `3`, which invites the ladder reading. Know that before
reusing the number anywhere else — `rankForWpm`'s own doc comment is the
authority on what it means.

A second caveat has nowhere left to print itself: **that leaderboard only exists
for time-mode English tests at 15 s and 60 s.** A 10-word Uzbek run has no board
of its own, so `boardFor()` picks 15 s for short time tests and 60 s for
everything else. The board used to be printed beside the heading
(`all-time · english · 60s`) and the percentile under the table; both were cut
as clutter, and the board now lives in the heading's `title` — hover, not read.
That hint is where these facts went; it is the last one standing.

**Both columns carry exactly one line of type: their heading.** The result
screen is for reading a number, not captions.

A failed fetch renders nothing — this whole section is a bonus, never a blocker,
so it must never show an error or a spinner in place of the result the learner
earned. The two columns fail independently: no leaderboard hides everything, no
histogram hides only the right column.

The result screen widens to `max-w-5xl` to hold the two columns, and the speed
chart above them widens with it (a `760 × 130` viewBox — deliberately flat,
since the svg scales to its container and a taller box would spend vertical room
§6 has already accounted for).

**The rank column is left-aligned, and that is the whole trick.** A row is
`rank · medal · avatar · name · … · score · accuracy`, and the rank cell is
`w-16` holding anything from `1` to `376,317`. Right-aligning it — what a
numeric column normally wants — is what put a finger-wide hole to the left of
`#1` on all three podium rows. Left-aligned, `1` and `376,317` start at the same
x, the medals and names stay locked in place, and the column reads as a list.
The width fits seven digits with separators; Monkeytype's public histogram
samples a few hundred thousand tests.

## 8. The caret

The caret is the one piece of this page that was tuned against a frame-by-frame
capture of the reference, because "smooth" is not a thing you can eyeball from a
still. Three rules, all of them measurable:

**Linear, 100 ms.** The first build used `transition-transform duration-75
ease-out`, and sampling the computed transform frame by frame gave
`0 → 11.1 → 13.1 → 13.9 → 14`: 79 % of the gap crossed in a single frame. That
reads as a jump, no matter what the number says. `100ms linear` gives
`0 → 2.3 → 4.7 → 7 → 9.3 → 11.7 → 14` — six even frames, which is what the
reference does. Ease curves are wrong here on purpose: a caret that accelerates
looks like it is being dragged.

**The caret is a child of the scrolling block, and shares its transition.**
`.tz-caret` and `.tz-words` carry the *same* `transform 100ms linear`. At a line
break the caret's own transform goes +1 line while the block scrolls −1 line;
with identical durations the two cancel exactly and the caret holds still while
the text slides under it. Measured drift during a line break: **0.0 px across 26
frames**. If the caret is moved out of the block, or the two durations drift
apart, a vertical wobble appears at every line break — that is the bug this
arrangement exists to prevent.

**Blinking is a resting state.** `.tz-caret-idle` is stripped on every keystroke
and re-added 700 ms after the last one, and the keyframes are a smooth
`ease-in-out` fade rather than a hard `steps(1)` toggle. The earlier version
restarted the animation with a forced reflow (`void caret.offsetWidth`) on every
keystroke — a synchronous layout per letter, for a worse-looking blink.

## 9. Where the text comes from

**`data/typing-texts.json` is the only place any typed text lives.** Nothing is
hardcoded in `lib/typing/typingTest.ts` and nothing is generated — the file is meant to
be edited by hand, so it is formatted for that (word banks wrapped, one sentence
per line) and opens with a `_readme` explaining itself.

It holds four things: the general `words` banks, the `quotes`, the grade `bands`,
and `subjects` for the curriculum mode.

**The subject join is the fragile part.** Curriculum entries are keyed by the
subject **slug from `lib/catalog/k12.ts`** — the English name lowercased and hyphenated,
the same key its `SUBJECT_ART` table uses, so a subject is named once for the
whole app. `lib/typing/typingTest.ts` reads subject names through the normalized
`k12Grades` model and *never* through the raw `data/k-12-curriculum.json`, the
same rule that applies to `course` and `lessons.json`.

Nothing in the type system enforces that join, and getting it wrong fails
**silently**: an unmatched subject falls back to the generic word bank, so the
test still works and just serves the wrong content. That has already happened
once — renaming "Foreign Language" to "English Language" in the curriculum
orphaned its text in all eleven grades. Hence:

```
npm run validate:texts    # run after touching either file
```

It checks that every subject the curriculum teaches has an entry, that every
grade lands in exactly one band, that both languages are present, and that no
"word" contains a space (a space is always a word boundary in the engine — that
check caught two bad Uzbek entries the first time it ran).

Each language block holds `words` and `sentences`; the test prefers a sentence
and falls back to a word drill over the subject's vocabulary.

A subject key may carry a **band suffix** — `mathematics@primary` next to
`mathematics` — so a subject taught from grade 1 to grade 11 can hand a
seven-year-old "Two plus three is equal to five." and a sixteen-year-old "Ten
percent of two hundred is twenty." The banded entry used to *win*, chosen by the
grade in the config. There is no grade picker any more (§1), so `subjectTexts`
**pools every band of a subject** instead. Keeping the split rather than
flattening the file is deliberate: it is exactly what a grade picker would need
if one comes back — from `/courses`, say — and pooling means none of those
sentences sit unread in the meantime.

**The bar only offers five of these subjects** (`FEATURED_SUBJECTS`); the other
twenty-nine entries are written, validated and currently unreachable from `/`.
That is on purpose — the file stays a complete curriculum, and widening the bar
is a one-line edit. Do not "tidy" the unused entries away.
