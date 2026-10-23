# /english/graphemes + /english/spellings — the spelling units

Two tracks over ONE dataset: **graphemes** (reading — one spelling → the
sounds it makes) and **spellings** (writing — one sound → the spellings
that write it). Every element is a mini-course of **writing-first**
lessons: every answer is typed, no click-to-choose. This doc is the map
for editing the units.

## Routes

| URL | Renders |
|---|---|
| `/english/graphemes` · `/english/spellings` | overviews (classified tables) |
| `/english/graphemes/[grapheme]` · `/english/spellings/[phoneme]` | lesson hub → `components/graphemes/GraphemeLessonHub.tsx` |
| `…/[lesson]` | one lesson → `components/graphemes/GraphemeLessonRunner.tsx` |

Deep links to locked lessons are enforced in both `[lesson]/page.tsx`
routes (locked card after mount).

## Architecture (who owns what)

```
lib/english/graphemes.ts              THE dataset: 67 GraphemeInfo (spelling, kind,
                              size, sounds[{ipa, phoneme?, words×6}]) +
                              SPELLINGS inversion + stage builders
                              (meetRows / words / dictation / choiceFor* /
                              slotRoundsFor* / typeDrillWords)
data/graphemeLessons.json     the lesson TEMPLATE per track (7 lessons)
lib/english/graphemeCurriculum.ts     JSON → runtime model; PASS_ACCURACY (50)
lib/english/graphemeProgress.ts       localStorage "tz-graphemes-v1"; accuracy
                              pass gate (isGraphemeLessonPassed,
                              graphemeUnlockedMap)
components/graphemes/
  GraphemeLessonRunner.tsx    chrome + kind → stage switch + gated results
  GraphemeLessonHub.tsx       the hub (+ elementView adapter, both tracks)
  stages/MeetStage.tsx        element intro (rows of highlighted words)
  stages/EchoStage.tsx        typed WHICH (hear → type; context tiles)
  stages/MasterStage.tsx      typed exam (echo + missing-letters slots)
components/english/           SHARED layer with the phonemes unit:
  stage-kit.tsx               sfx, Letter, keyboard, typed-answer input
  GymStage.tsx                the typing drill (TYPE / HEAR)
  WordRain.tsx                the 2D falling-words game
  NinjaRun.tsx                the embedded 3D typing-ninja run
scripts/validate-grapheme-lessons.mjs   npm run validate:graphemes
```

## The lessons (both tracks, one per `kind`)

| id | type | kind | What the student does |
|---|---|---|---|
| meet | lesson | `MEET` | the element + ~6 example words PER sound/spelling, tap to hear, letters highlighted |
| type | practice | `TYPE` | type the words (short pools are typed TWICE — `typeDrillWords`) |
| hear | practice | `HEAR` | dictation over the 8 shortest words |
| which | test | `WHICH` | a word is spoken — **type the word you heard**; the sound/spelling tiles light up after the answer |
| master | test | `MASTER` | 12 typed rounds: pure dictation + type-the-missing-letters slots |
| rain | game | `RAIN` | Word Rain (20 chips over the element's words) |
| ninja | game | `NINJA` | Typing-Ninja run (14 words) |

Grading: only TYPE/HEAR are speed-graded; everything else accuracy-only.
**Passing is accuracy-based**: a test/game unlocks the next lesson at
`PASS_ACCURACY` (50%) best accuracy; below it the results screen makes
Retry the primary action. Stars stay quality feedback; `passStars` in the
JSON is rejected by the validator.

## Editing rules

- **More examples**: extend the `words` arrays in `lib/english/graphemes.ts` —
  every word must be lowercase a–z and CONTAIN its grapheme's spelling
  (MEET highlights it; MASTER masks it). The SPELLINGS inversion, both
  tracks, every stage and both games pick new words up automatically.
- **Lesson list** lives in `data/graphemeLessons.json` (identical shape for
  both tracks). Run `npm run validate:graphemes` after edits. New `kind` =
  curriculum union + validator `KINDS` + stage component + runner case +
  `GRAPHEME_STAGE` motif (`components/thumbnails/covers/english.tsx`).
- Speech only through `lib/english/phonemeAudio.ts` (recordings first, TTS
  fallback — see `app/english/phonemes/README.md` "Audio" for the mp3
  folder layout); typed answers through the shared kit's `useAnswerInput`
  / `AnswerLine` / `LetterSlots`.
- Strings live in `STR.graphemes` + reused `STR.phonemes` typed-stage keys
  (`echoPrompt`, `spellTypedPrompt`, `typeEnterHint`, `needAccuracy`,
  `lockedLesson`) — en/uz/ru, short simple words.
- NINJA mounts outside the StageScaler (WebGL canvas must not be
  scale-transformed).
