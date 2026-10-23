# /english/phonemes — the IPA sounds unit

Every English phoneme (50 sounds, Cambridge symbol set) is a **mini-course
of writing-first lessons**: Learn → Practice → Tests → Games. Every answer
is **typed** — there are no click-to-choose activities. This doc is the map
for editing the unit; read it before touching any file listed below.

## Routes

| URL | Renders | File |
|---|---|---|
| `/english/phonemes` | overview: sound grid + IPA charts | `page.tsx` |
| `/english/phonemes/[phoneme]` | one sound's lesson hub | `[phoneme]/page.tsx` → `components/phonemes/PhonemeLessonHub.tsx` |
| `/english/phonemes/[phoneme]/[lesson]` | one lesson | `[phoneme]/[lesson]/page.tsx` → `components/phonemes/PhonemeLessonRunner.tsx` |

Deep links to locked lessons are enforced: `[lesson]/page.tsx` checks the
unlock chain after mount and shows a locked card instead of the runner.

## Architecture (who owns what)

```
data/phonemeLessons.json      the lesson TRACK template (ids, types, kinds,
                              titles ×3 locales, thumbnails)
lib/phonemes.ts               reference data: 50 PhonemeInfo (symbol, slug,
                              examples, rival, minimal pairs) + ALLOPHONES
lib/allophones.ts             the allophone teaching layer:
                              · process classification (aspirated, flap, …)
                                with localized name + hint per variant
                              · SHADE_WORDS — per-allophone typing words
                                (the pilot; drives the SHADE lessons)
                              · findSpelling / shadeTriggerIndex — word
                                highlighting for the SHADE intro
lib/graphemes.ts              GPC table; SPELLING_BY_SLUG + choiceForSpelling
                              feed the SPELL stage and MASTER spelling rounds
lib/phonemeCurriculum.ts      JSON → runtime model; phonemeLessonsFor(slug)
                              expands the "shades" slot into per-allophone
                              SHADE lessons for pilot sounds; PASS_ACCURACY
lib/phonemeProgress.ts        localStorage store "tz-phonemes-v1"; the
                              accuracy pass gate (isPhonemeLessonPassed,
                              phonemeUnlockedMap)
lib/phonemeAudio.ts           speech: local recordings first, TTS fallback
components/phonemes/
  PhonemeLessonRunner.tsx     workspace chrome + kind → stage switch +
                              gated results screen
  PhonemeLessonHub.tsx        the hub (cards, unlock chain, stars)
  PhonemeCharts.tsx           vowel/diphthong/consonant SVG charts
  stages/<Kind>Stage.tsx      one file per lesson kind (see table)
components/english/           SHARED layer with the graphemes unit:
  stage-kit.tsx               sfx, Letter, keyboard, typed-answer input
                              (useAnswerInput, AnswerLine, LetterSlots)
  GymStage.tsx                the typing drill (TYPE / HEAR)
  WordRain.tsx                the 2D falling-words game
  NinjaRun.tsx                the embedded 3D typing-ninja run
scripts/validate-phoneme-lessons.mjs   npm run validate:phonemes
```

## The lessons (one per `kind`)

| id | type | kind | Stage | What the student does |
|---|---|---|---|---|
| meet | lesson | `MEET` | MeetStage | symbol, spellings, example words, rival, shades teaser |
| shades | lesson | `SHADES` | ShadesStage | gallery of all allophones (only sounds NOT in the pilot) |
| shade-1…N | lesson | `SHADE` | ShadeStage | **one allophone**: visual intro (symbol, mouth hint, trigger-letter highlights) → type its words |
| type | practice | `TYPE` | GymStage | type all the sound's words (keyboard + hands) |
| hear | practice | `HEAR` | GymStage (hidden) | dictation — type what you hear |
| spell | practice | `SPELL` | SpellStage | hear a word, **type the missing letters** of its spelling |
| pairs | test | `PAIRS` | PairsStage | minimal pair spoken — **type the word you heard** |
| master | test | `MASTER` | MasterStage | typed exam: echo + spelling + shade dictation rounds |
| rain | game | `RAIN` | RainStage | 2D word-rain typing game (SVG + rAF) |
| ninja | game | `NINJA` | NinjaStage | embedded 3D Typing-Ninja run over the sound's words |

**SHADE coverage**: ALL 50 sounds are in `SHADE_WORDS` (lib/allophones.ts)
— every allophone of every phoneme has its own lesson (154 shade sets;
/t/ alone gets 9). Word lists are aligned by index with
`ALLOPHONES[symbol]`; the SHADES gallery kind remains only as a fallback
for future sounds without word lists. Words must be lowercase a–z and
genuinely carry the shade (vowels: the trigger letter after the spelling —
clipped before p/t/k/s…, nasalized before m/n, longer before a voiced
consonant; consonants: the defining position — aspirated word-initial,
plain after s, unreleased word-final…). Connected-speech variants (yod
coalescence "got you", cross-word dentals "at the") use short phrases —
typed fine in the gym, excluded from single-word pools.

**Long writing drills**: the shade write-phase types its word list TWICE;
`typingWordsForPhoneme` (TYPE / Word rain / Ninja) merges the sound's own
words with all its single-word shade words (up to 24);
`hearWordsForPhoneme` dictates the 8 shortest. Tests run 10 rounds
(pairs/spell) and 12 (master).

## Grading & the pass gate

- Only `TYPE`/`HEAR` are speed-graded (`targetWpm` from the JSON); every
  other stage reports accuracy-only stats (`targetWpm 0`).
- **Passing is accuracy-based, not star-based**: a graded lesson (test/
  game) unlocks the next one at `PASS_ACCURACY` (50%) best accuracy;
  ungraded lessons pass on completion. One rule everywhere:
  `isPhonemeLessonPassed` / `phonemeUnlockedMap` (lib/phonemeProgress.ts).
  Stars stay as quality feedback. `passStars` in the JSON is rejected by
  the validator.
- The runner's results screen respects the gate: below 50% the primary
  action is Retry (Enter retries) and the next lesson stays locked.

## Editing rules

- **Lesson list** lives in `data/phonemeLessons.json`. After every edit run
  `npm run validate:phonemes`. New `kind` = new entry in
  `PhonemeLessonKind` (lib/phonemeCurriculum.ts) + the validator's `KINDS`
  list + a stage component + a case in the runner's `renderStage` + a
  thumbnail motif in `PhonemeStageCover` (`components/thumbnails/
  SvgLibrary.tsx`).
- **Writing-first**: answers are produced, not selected. Typed stages use
  `useAnswerInput` + `AnswerLine`/`LetterSlots` from `stages/kit.tsx`
  (a–z appends, Backspace deletes, Enter submits; fixed-length answers
  auto-check when full).
- **Words** in `lib/phonemes.ts` / `SHADE_WORDS` must stay lowercase a–z
  only — they are typed in the gym and fed to the keyboard highlights.
- **Allophones**: add variants to `ALLOPHONES` in `lib/phonemes.ts` keyed by
  IPA symbol. `lib/allophones.ts` auto-derives the kid-friendly explanation
  from the diacritics — check `allophoneProcess()` covers the mark you used
  (unknown marks fall back to the generic "a different shade" card).
- **Strings**: every user-facing string needs `en`/`uz`/`ru`
  (`STR.phonemes` in `lib/uiStrings/phonemes.ts`), short simple words — the audience
  is school students.
- The stage components live one-per-file in `components/phonemes/stages/`;
  shared UI belongs in `stages/kit.tsx`, sounds in `lib/phonemeAudio.ts` —
  don't re-import the lesson runtime's private copies.
- The NINJA stage mounts **outside** the StageScaler (a scale-transformed
  WebGL canvas renders blurry) and relies on NinjaWorld's embedded contract
  (`docs/typing-ninja.md` §4): `step.content` words,
  `step.rules.gameSpeed`, `step.rules.maxMistakesAllowed`,
  `onComplete(stats)` once on victory.

## Audio — where the sound comes from

All playback goes through **`lib/phonemeAudio.ts`**:

1. It first tries a **recording** under `public/audio/`:
   - `public/audio/words/<word>.mp3` — one file per example word, lowercase
     (`sheep.mp3`, `ship.mp3`, …)
   - `public/audio/phonemes/<slug>.mp3` — the isolated sound per phoneme
     slug (`ee.mp3`, `sh.mp3`, … — slugs are in `lib/phonemes.ts`)
2. If the file doesn't exist (or fails), it falls back to the browser's
   **Web Speech API** (robot voice, `en-US`, works offline, zero setup).

So the unit works today with no files; dropping mp3s in upgrades every
stage with **no code changes**. Multi-word phrases ("got you") always use
TTS.

Where to get recordings (pick one):

- **Generate with a TTS API** (recommended — consistent voice for all ~450
  words): Google Cloud Text-to-Speech, Amazon Polly, Azure Speech or
  ElevenLabs. Batch-generate WAV/MP3 per word from `wordsForPhoneme()` +
  `SHADE_WORDS` lists and save as `public/audio/words/<word>.mp3`.
- **Free offline TTS**: [Piper](https://github.com/rhasspy/piper) (local,
  MIT-licensed voices) — good quality, no API key.
- **Isolated phoneme sounds**: Wikimedia Commons hosts free IPA recordings
  (search "IPA <symbol> audio", e.g. commons.wikimedia.org →
  `Near-close_near-front_unrounded_vowel.ogg`) — convert to mp3 and save as
  `public/audio/phonemes/<slug>.mp3`.
- **Per-word human recordings**: Wiktionary word pages link Commons
  pronunciation files (free licenses). Avoid scraping commercial
  dictionaries (Cambridge/Oxford audio is not redistributable).

Keep files small (mono, 48–64 kbps mp3 is plenty).

## Keystroke sounds

Separate layer: the mp3 click/error sounds (`/press_key4.mp3`,
`/error2.mp3`) play through the Web-Audio code in `stages/kit.tsx`, gated
on the workspace audio toggle — same contract as the course lesson runtime.
