# components/graphemes/ — the spelling units UI

Read **`app/english/graphemes/README.md`** before editing (architecture,
lesson table, editing rules).

Hard rules:
- WRITING-FIRST: answers are typed, never clicked. Typed stages use
  `useAnswerInput` + `AnswerLine`/`LetterSlots` from
  `components/english/stage-kit.tsx`.
- One component pair serves BOTH tracks via the `GraphemeElement` union +
  `elementView()` adapter — never fork per-track copies.
- Shared primitives (kit, GymStage, WordRain, NinjaRun) live in
  `components/english/` — extend there, don't re-copy locally.
- Passing is accuracy-based (PASS_ACCURACY 50%), never star-based — use
  `isGraphemeLessonPassed`/`graphemeUnlockedMap`.
- Every dataset word contains its grapheme's spelling (MEET highlight +
  MASTER slot contract) and is lowercase a–z.
- Word/phoneme speech only through `lib/phonemeAudio.ts`.
- Mount-time randomness (round builds, shuffles) happens in effects —
  never during render (hydration).
- Runner callbacks are PLAIN functions + latest-callback refs (React
  Compiler rejects manual useCallback over the `content` memo).
- NinjaRun mounts outside the StageScaler.
- All strings via `STR.graphemes` / shared `STR.phonemes` keys — en/uz/ru.
