# Progress & stars — `lib/typing/progress.ts`

Client-only persistence of lesson results in
`localStorage["tz-progress-v1"]`. All reads/writes are SSR-guarded and
try/catch-wrapped.

## Storage shape

```ts
type ProgressMap = Record<lessonId, StoredLessonProgress>
type StoredLessonProgress = {
  completed: boolean
  stars: number        // best ever
  bestWpm: number
  bestAccuracy: number
  lastPlayedAt: string // ISO
}
```

## API

- `getProgress(): ProgressMap` — parsed map or `{}`.
- `useProgress(): ProgressMap` — reactive read (house
  `useSyncExternalStore` idiom); re-renders when `saveLessonResult`
  writes. Used by `/stats`.
- `getLessonProgress(lessonId)` — entry or null.
- `saveLessonResult(lessonId, result)` — merges keeping the **max** of
  previous vs new `stars`/`bestWpm`/`bestAccuracy`, sets `completed: true`,
  stamps `lastPlayedAt`; returns the updated map. A bad run never lowers a
  stored best.
- `isLessonPassed(ref, progress)` — `completed && stars >= ref.passStars`
  (`UnlockRef = { lessonId, passStars }`).
- `computeUnlocked(lessons, progress)` — sequential gate: lesson 0 always
  unlocked; lesson *i* unlocked iff **all** prior lessons pass.
- `computeLessonResult(stats, targetWpm)` — see below.

## Stats types (contract with the lesson runtime)

```ts
type StepStats     = { correct, mistakes, timeMs, perKeyMistakes }
type LessonRunStats = StepStats & { skippedSteps }
type LessonResult  = { stars: 0..5, wpm, accuracy, mistakes, timeMs,
                       hardestKey: string | null, skipped }
```

## Formulas (`computeLessonResult`)

- **Accuracy** = `round(correct / (correct + mistakes) * 100)`; 100 when no
  keys were typed.
- **WPM** = `round(correct / 5 / minutes)` — standard 5 chars per word; only
  correct keystrokes count; the clock starts at the first accepted
  keystroke (runtime behavior).
- **hardestKey** = key with the most `perKeyMistakes`, needs ≥2 mistakes to
  qualify, else null.

## Star ladder

Accuracy drives the tier; speed (`targetWpm` = max step `minimumWPM`) gates
only the top two. `targetWpm === 0` makes the speed condition vacuous.

| Stars | Condition |
|---|---|
| 0★ | any step was skipped |
| 5★ | accuracy ≥ 97 **and** wpm ≥ targetWpm |
| 4★ | accuracy ≥ 93 **and** wpm ≥ 0.8 × targetWpm |
| 3★ | accuracy ≥ 85 |
| 2★ | accuracy ≥ 75 |
| 1★ | otherwise (completed) |

Ungraded lesson types (`lesson`, `practice`) bypass this: the runtime forces
`stars = 0, skipped = false` and completion alone passes them
(`lib/typing/lessonTypes.tsx` decides gradedness).

## Consumers

- `app/lesson/[id]/page.tsx` — computes and saves results, checks
  `passedCurrentRun`.
- `app/courses/[id]/page.tsx` and `components/lesson/Rails.tsx` — unlock
  gating (`computeUnlocked`, `isLessonPassed`), stars display, section
  progress bars.

## Invariants

- The storage key `tz-progress-v1` and shape are a compatibility contract —
  bump the key if the shape changes; never silently mutate it.
- `saveLessonResult` must remain best-ever-merge (max), one call per lesson
  completion.
- Star thresholds are documented in `data/lessondoc.txt` — keep spec, code,
  and this doc in sync when tuning them.
