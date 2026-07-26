# components/english/ — shared stage layer

Primitives shared by the phonemes AND graphemes/spellings lesson runners
(`components/phonemes/`, `components/graphemes/`):

- `stage-kit.tsx` — keystroke sfx (mp3 Web-Audio), imperative `Letter` +
  char states, `KeyboardWithHands`, `SpelledWord`, choice-card styling,
  `shuffled`, and the typed-answer input (`useAnswerInput`, `AnswerLine`,
  `LetterSlots`).
- `GymStage.tsx` — the typing drill (visible TYPE / hidden HEAR
  dictation), records into the all-time stats layer.
- `WordRain.tsx` — the 2D falling-words game (SVG + one rAF loop, sim in
  a mutable ref).
- `NinjaRun.tsx` — the embedded 3D typing-ninja run (NinjaWorld contract,
  mount OUTSIDE any StageScaler).

Hard rules:
- Keep these unit-agnostic: content comes in via props (words, labels,
  localized strings) — no phoneme/grapheme imports here.
- A change here affects EVERY English unit — verify at least one phoneme
  and one grapheme lesson after editing.
- Speech goes through `lib/phonemeAudio.ts` at the call sites, not here
  (WordRain/GymStage take callbacks/props instead).
