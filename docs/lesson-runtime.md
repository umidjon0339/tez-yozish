# Lesson runtime — `app/lesson/[id]/`

The whole typing engine. `page.tsx` (`"use client"`, default export
`LessonPage`) resolves the lesson by `lessonId` (via `useParams()`) from the
normalized `course` and renders per-step by branching on `step.viewport`.
Each viewport is its own file; the pieces they share are small modules next
to the page.

## 1. File map

| File | Symbols | Role |
|---|---|---|
| `page.tsx` | `LessonPage`, `emptyRun()`, `HEATMAP_ROWS`, `BURST_PARTICLES`, `NinjaWorld` | routing, prefs, locking, viewport dispatch, results screen; `NinjaWorld` is a `next/dynamic` import with `ssr: false` |
| `ui.ts` | `UI` | chrome i18n dict (en/uz/ru) for all lesson chrome strings |
| `StageScaler.tsx` | `StageScaler` | fits the 1100×780 stage into the viewport via CSS `transform: scale()` (ResizeObserver); wraps every non-game viewport |
| `sfx.ts` | `preloadSfx`, `playKeystrokeSound`, `playErrorSound` | Web-Audio mp3 playback (see §6) |
| `typingCells.tsx` | `UNTYPED/CORRECT/INCORRECT/CORRECT_FIXED`, `CharState`, `LetterHandle`, `Letter`, `KeyCapUnit` | character-state model (0/1/2/3) and the imperative per-character / per-keycap cells |
| `gymUnits.ts` | `GymUnit`, `buildGymUnits`, `unitExpectedKeys`, `unitStatKey`, `KEY_TOKEN_GLYPHS` | gym token model (see §3) |
| `viewports/PostureCheck.tsx`, `KeyIntro.tsx`, `PracticeTracker.tsx`, `ChatSim.tsx`, `ShortcutDojo.tsx` | one component each | one per viewport |

The keyboard composite `KeyboardWithHands` comes from
`components/keyboard/KeyboardStage.tsx` (see keyboard.md).

The sidebar rails (`ChapterRail`, `LessonRail`) live in
`components/lesson/Rails.tsx` (see §8).

## 2. Character-state model (zero-latency updates)

Per-keystroke feedback never re-renders the tracker. Each character is a
`Letter` (memo + forwardRef) exposing a `LetterHandle` via
`useImperativeHandle`: `setCharState`, `setIsCursor`, `setOverrideChar`
(Letter only), `getDomNode`. The parent keeps a
`Map<index, LetterHandle>` and calls the handle setters directly — only the
touched `Letter` re-renders. All tracker bookkeeping (buffer, cursor,
mistakes, timing) lives in **refs**, not state.

States: `UNTYPED=0`, `CORRECT=1` (green + `letter-pop`), `INCORRECT=2`
(red + `letter-shake`), `CORRECT_FIXED=3` (amber + check icon — a char that
was wrong, backspaced, and retyped correctly). `KeyCapUnit` is the same
contract rendered as an inline keycap (for key/chord units).

## 3. GymUnit model — `buildGymUnits`

```ts
type GymUnit =
  | { kind: "char";  char: string }
  | { kind: "key";   key: string; label: string }    // Enter, Tab, ...
  | { kind: "chord"; chord: ChordToken; label: string } // Ctrl+C, ...
```

Built from the step's `content` tokens: special tokens → `key` units (glyph
labels: `Enter→↵ Backspace→⌫ Tab→⇥ …`); chord tokens → `chord` units; plain
tokens → one `char` unit per character, **with a typed space inserted only
between two adjacent plain tokens** (never next to a key/chord unit).

Multiline: any `key` Enter unit makes the gym multiline; lines group into
words (no mid-word wrap) and break after every Enter unit. Chords are matched
with `chordMatchesEvent` (strict modifier equality, see curriculum.md) and
the browser default is suppressed on match.

## 4. Keystroke flow

Each viewport attaches its **own `window` keydown listener** in a `useEffect`
(removed on cleanup). There is no hidden input — raw `KeyboardEvent`s only,
so IME composition is unsupported (assumed physical Latin keyboard). Space
and Tab are always `preventDefault`'d; Ctrl/Alt/Meta combos and Arrows are
suppressed in chord-aware handlers so real browser shortcuts never fire.

`PracticeTracker` (STANDARD_GYM), condensed:

1. Backspace: only if `rules.allowBackspace`; steps cursor back, restores
   prefill override chars, sets previous unit `UNTYPED`.
2. Fix-the-typo lock: while any prefilled-wrong char remains, only Backspace
   is accepted (everything else plays the error sound).
3. Match per unit kind: chord → `chordMatchesEvent`; key → `e.key ===
   unit.key`; char → `e.key === unit.char` (browser combos never count).
4. `startTime` is set on the **first accepted keystroke** — WPM excludes
   idle time before typing starts.
5. Incorrect: bump mistake counters (`perKeyMistakes[statKey]`), reset
   streak, error sound; if `rules.blockOnTypo` the cursor **does not
   advance** until the right key.
6. Correct: `CORRECT`, or `CORRECT_FIXED` if that index had previously
   errored.
7. Step end (cursor past last unit): build `StepStats { correct, mistakes,
   timeMs, perKeyMistakes }`, call `onComplete(stats)` after 200 ms.

Streak counter/toasts update imperatively via refs (visible ≥5, milestones
at 10/25/50/100). The amber caret is positioned and smooth-scrolled by
`updateSmoothCursor`.

Other viewports:
- **KeyIntro** — types the `content` sequence as keycaps; INTRO→PRACTICE
  phase flips on first correct key; chord-aware; reports full `StepStats`.
- **ChatSim** — `step.chat` turns; each `you` turn types its text + a final
  Enter slot; `them` turns auto-appear after 700 ms; reports `StepStats`.
- **ShortcutDojo** — `step.dojo.tasks`; each task waits for one chord and
  applies `applyDojoAction` to a live `DojoState`; ignores `e.repeat`;
  reports `StepStats` keyed by the chord string.
- **PostureCheck** — waits until all `content` keys are held simultaneously
  (keydown+keyup set); calls `onComplete()` **with no stats**.

## 5. Viewport dispatch & GAME_NINJA_RUN

Dispatch happens in `LessonPage`'s main return, keyed by `step.stepId` (each
step remounts its viewport, so only the active listener is live).

- `GAME_NINJA_RUN` is special-cased **outside** `StageScaler`: a
  `fixed inset-0 z-50` full-bleed overlay mounting
  `<NinjaWorld step={step} onComplete={handleComplete} isEmbedded />`, plus a
  floating close link and Skip button.
  **Known limitation:** NinjaWorld's `onComplete` passes **no `StepStats`**
  — the game contributes nothing to `runStats`, so a lesson consisting only
  of ninja steps reaches the results screen with empty stats. Grading comes
  from the other steps in the lesson.
- All other viewports render inside `StageScaler` and mount
  `KeyboardWithHands` at the bottom, with `expectedKey` derived from the
  current target unit.
- A green-check transition overlay shows between steps (800 ms), then
  `stepIdx` advances.

## 6. Sound

Low-latency Web-Audio layer with module-level singletons (`sfxCtx`,
`sfxBuffers`, `sfxPending` — survive remounts): `preloadSfx()` warms
`/press_key4.mp3` and `/error2.mp3` (the only two mp3s used; the other mp3s
in `public/` are unused). `playSfx` resumes a suspended context (keydown is
the user gesture), plays a buffer source with gain, and fades out 40 ms
before an early cut. Every call site is guarded by the `isAudioEnabled`
pref. This layer is **separate** from the ninja game's oscillator-based
`SoundSynthesizer`.

## 7. Progression, results, persistence

- `handleComplete(stats?)` accumulates into `runStats` ref (sums + merged
  `perKeyMistakes`) and starts the transition; Skip (`next()`) increments
  `skippedSteps` (forces 0★ on graded lessons); `prev()` steps back.
- When steps run out: `computeLessonResult(runStats, targetWpm)` where
  `targetWpm` = max `minimumWPM` across steps. Ungraded types force
  `stars = 0, skipped = false`. Result saved once via
  `saveLessonResult(lessonId, result)` (best-ever merge — see progress.md).
- Results screen: star row (graded only), mascot mood, stat tiles, per-key
  mistake heatmap over three keyboard rows (green = keys in
  `lesson.unlockedKeys`), trickiest key, CTAs. Keyboard nav: `r` retries;
  Enter/Space continues to the next lesson only if the current run passed,
  otherwise retries.
- `passedCurrentRun`: ungraded → always true; graded → stored best
  `stars >= lesson.passStars`.

## 8. Sidebar rails — `components/lesson/Rails.tsx`

Overlay drawers that never shift the typing arena. Collapsed state is a slim
dash column; clicking opens a card drawer; the drawer closes on Escape,
Backspace, any single-char keystroke, or outside pointerdown (`useDrawer`).

- `ChapterRail` (left): one dash **per chapter** (per-section was too many);
  drawer lists chapters → section cards linking to
  `/courses/{courseId}?sectionId=…` with done/total bars.
- `LessonRail` (right): one dash per lesson (current = pulsing black,
  completed = emerald, locked = neutral); drawer groups lessons by type in
  `LESSON_TYPE_ORDER`; locked lessons render as non-links
  (`computeUnlocked`).

Both are pure overlays fed by props (`progress`, `locale`) — no own storage.

## 9. Prefs, locale, guards

- `tz-prefs-v1` (localStorage): `{ dark, audio, colorful, hands }` workspace
  toggles; loaded once (guarded by a `prefsLoaded` ref), saved on change.
- Locale via `useLocale()` (`tz-locale`); the lesson chrome uses the local
  `UI` dict, not `lib/uiStrings.ts`.
- **No focus mode.** The header, footer and rails keep full opacity while
  typing — deliberately removed; don't reintroduce dimming/blurring of the
  chrome on keystroke.
- Cyrillic layout detection (`/[Ѐ-ӿ]/` on `e.key`) shows a warning toast;
  touch-only devices (`pointer: coarse` without `fine`) get a full-screen
  "need a real keyboard" notice.
- Locked lessons render an explanation screen instead of the workspace.

## Invariants

- Keystroke feedback goes through `LetterHandle`s and refs — never convert
  tracker bookkeeping to React state (it would re-render the whole text on
  every key).
- Each viewport owns exactly one `window` keydown listener, mounted via the
  `key={step.stepId}` remount; always clean up in the effect return.
- `StepStats` shape is the contract with `lib/progress.ts` — every graded
  viewport must report `{ correct, mistakes, timeMs, perKeyMistakes }`.
- Space/Tab must stay `preventDefault`'d in every typing viewport; chord
  handlers must keep suppressing real browser shortcuts.
- Sounds: only via the shared SFX layer, gated on `isAudioEnabled`.
- New chrome strings go into the `UI` dict in all three locales.
