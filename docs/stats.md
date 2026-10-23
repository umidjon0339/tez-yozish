# Keystroke statistics — `lib/typing/stats.ts`

Client-only, aggregate-only statistics in `localStorage["tz-stats-v1"]`.
No raw keystroke log is kept — every write merges into lifetime counters,
so the store stays small (~tens of KB) forever. SSR-guarded and
try/catch-wrapped like `lib/typing/progress.ts`.

## Storage shape (compatibility contract — bump the key on change)

```ts
type StatsStore = {
  version: 1
  keys: Record<string, KeyAgg>      // normalized char/token -> lifetime agg
  days: Record<string, DayAgg>      // "YYYY-MM-DD" (local) -> day agg
  attempts: AttemptRec[]            // last 200 lesson/game runs
  records: { bestWpm, bestAccuracy, bestCombo }
}
KeyAgg  = { presses, errors, totalMs, samples }   // totalMs/samples = avg gap
DayAgg  = { ms, keys, errors, lessons, wpmSum, wpmCount, accSum, accCount, bestWpm }
AttemptRec = { lessonId, at, type, wpm, accuracy, stars, timeMs, errors,
               problemKeys }                      // top-8 missed keys of the run
```

Key normalization: single chars lowercased (`F` ≡ `f`), special keys /
chords as lowercase tokens (`"enter"`, `"ctrl+c"`). Chord tokens have no
`keyId`, so they count in totals but not on the keyboard visuals.

## Write side

- `createStatsSession()` → `{ stroke(expected, correct), end() }`. One
  session per continuous typing activity (a gym step, a chat screen, a
  game run). `stroke()` buffers in memory and measures inter-key gaps
  (credited only to correct presses, clamped to 25–2500 ms; longer pauses
  don't count as typing time). `end()` merges the buffer into
  `keys`/`days`/`records.bestCombo` in one localStorage write; safe to
  call twice; a session with zero strokes writes nothing.
- `recordAttempt({...})` — appends to `attempts` (capped 200) and updates
  the day's lesson counters + `records`.
- `resetStats()` — clears the key (the /stats footer button).

### Recording call sites

| Where | stroke() | end() |
|---|---|---|
| `PracticeTracker` (gym) | judgment in `handleKey`, key = `unitStatKey(unit)` | step completion + unmount |
| `KeyIntro` | after match decision, key = target token | unmount |
| `ChatSim` | after match decision, key = char or `"Enter"` | unmount |
| `ShortcutDojo` | chord ok / wrong attempt, key = `task.do` | unmount |
| `NinjaWorld` | 3 correct-hit branches + attributable misses (locked target only) | GAME_OVER effect, `startGame` restart, unmount |

`recordAttempt` runs in the lesson-finished effect in `LessonPage`
(alongside `saveLessonResult`) and in NinjaWorld's GAME_OVER effect for
**standalone** runs only (`lessonId: "typing-ninja"`, `type: "game"` —
embedded runs are recorded by the lesson page).

## Read side

- `useStats()` — house `useSyncExternalStore` idiom; re-renders on every
  store write. `getStats()` for imperative reads.
- Pure derivations over a snapshot: `computeKeyStats` (per-key error rate,
  avg speed as WPM, 0–100 confidence — null until 15 presses; learned at
  `CONFIDENCE_LEARNED` = 75), `computeFingerStats` / `computeRowStats` /
  `computeHandStats` (grouped via `FINGER_OF_KEY_ID` / `ROW_OF_KEY_ID`
  from `keymap.ts`), `computeDaySeries(store, n)` (continuous daily axis
  for charts), `computeStreak`, `computeTotals`, `computeWeekSummary`
  (last-7-days vs previous-7, worst key from attempt `problemKeys`).

## The /stats page

`app/stats/page.tsx` — one scrolling dashboard (navbar → Stats): week
KPI tiles → WPM/accuracy history (7/30/90-day switcher) → keyboard
heatmap with 4 metrics (errors/speed/usage/confidence) + click-to-open
key detail → finger mastery hands + row bars → GitHub-style practice
calendar → records & lifetime totals → per-chapter course rings
(`useProgress` + curriculum) → keys-learned map → reset footer.

Chart components in `components/stats/` (hand-built SVG, no chart deps):
`LineChart` (single series, crosshair + tooltip), `KeyboardHeatmap`
(sequential 4-step ramps, one hue per metric; exports `KEY_ROWS`),
`FingerMastery` (schematic hands, emerald mastery ramp, `--fz` identity
dots), `ActivityCalendar`. All page strings live in `STR.stats`
(`lib/core/uiStrings/`, en/uz/ru).

## Invariants

- `tz-stats-v1` shape is a compatibility contract — bump the key if it
  changes.
- Aggregates only: never store per-keystroke events or timestamps.
- One `end()` per session; recording must never touch React state (the
  lesson runtime's zero-latency rule).
- `FINGER_OF_KEY_ID`/`ROW_OF_KEY_ID` in `keymap.ts` mirror the `.kb-stage`
  finger-zone lists in `globals.css` — keep them in sync.
