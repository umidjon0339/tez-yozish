# components/phonemes/ — the sounds unit UI

Read **`app/english/phonemes/README.md`** before editing (architecture,
lesson table, audio setup, editing rules).

Hard rules:
- WRITING-FIRST: answers are typed, never clicked from options. Typed
  stages use `useAnswerInput` + `AnswerLine`/`LetterSlots` from
  `components/english/stage-kit.tsx`.
- One stage component per lesson `kind` in `stages/`; primitives shared
  with the graphemes unit live in `components/english/` (stage-kit,
  GymStage, WordRain, NinjaRun) — extend there, don't re-copy. New kind =
  JSON entry + curriculum union + validator `KINDS` + stage file + runner
  case + thumbnail motif.
- The lesson list is PER-PHONEME (`phonemeLessonsFor`, not
  PHONEME_TRACK.lessons): SHADE_WORDS pilot sounds get one SHADE lesson
  per allophone. Passing is accuracy-based (PASS_ACCURACY 50%), never
  star-based — use `isPhonemeLessonPassed`/`phonemeUnlockedMap`.
- Word/phoneme speech only through `lib/english/phonemeAudio.ts` (recordings
  first, TTS fallback) — never call `speechSynthesis` directly here.
- Typing stages keep tracker bookkeeping in refs with imperative
  `LetterHandle`s (lesson-runtime invariant); game sims live in a mutable
  ref driven by one rAF loop (the ninja idiom).
- Mount-time randomness (deck shuffles, round builds) happens in effects /
  after first client render — never during render (hydration).
- Non-gym stages grade accuracy-only; only TYPE/HEAR use targetWpm.
- Runner callbacks are PLAIN functions + latest-callback refs — React
  Compiler rejects manual useCallback over the cached lesson list.
- NinjaStage mounts outside the StageScaler (WebGL canvas must not be
  scale-transformed).
- All strings via `STR.phonemes` — en/uz/ru, short simple words.
