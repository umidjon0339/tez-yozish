# Curriculum / data engine

The entire course is data: `data/lessons.json`, written in the **v4 authoring
format** specified by `data/lessondoc.txt`. `lib/curriculum.ts` normalizes that
source into the runtime model at import time. Pages import `course` from
`@/lib/curriculum` — **never** the raw JSON.

Corpus as of July 2026: 1 course, 11 chapters, 51 sections, 504 lessons,
1220 steps. Lesson types: 199 practice / 152 test / 102 game / 51 lesson.
Viewports: 998 STANDARD_GYM / 107 KEY_INTRO / 102 GAME_NINJA_RUN /
9 SHORTCUT_DOJO / 4 CHAT_SIM / 0 POSTURE_CHECK (defined but not yet authored).

Always run `npm run validate:lessons` after editing `data/lessons.json`.

## 1. The v4 authoring format

Hierarchy: `Course → Chapter → Section → Lesson → Step`. Every node has
`id` (unique string, used in URLs, never shown) and `title`
(`LocalizedString`). **No `*Number` fields** — array position is the number.

Source types live in `types/lesson.ts` (`CourseSource`, `ChapterSource`,
`SectionSource`, `LessonSource`, `StepSource`).

### LocalizedString

`{ en, uz, ru }` — all three required and non-empty (validator-enforced).
Locales: English, O'zbekcha, Русский. CHAT_SIM / DOJO *typed content* stays
plain ASCII — localize the scenario in `instruction`/`say`, not in what the
student types.

### Node fields

| Node | Required | Optional |
|---|---|---|
| Course | `id`, `title`, `chapters` | `audience` (→ `targetAudience`, default `''`), `thumbnail` |
| Chapter | `id`, `title`, `sections` | `description` (falls back to `title`) |
| Section | `id`, `title`, `lessons` | `thumbnail` |
| Lesson | `id`, `title`, `steps` (non-empty) | `type` (default `practice`), `goal` (→ `pedagogicalGoal`, falls back to `title`), `keys` (else derived from step text), `passStars` (default per type), `thumbnail` |
| Step | `viewport`, `instruction` | `text` (string or token array), `chat` (CHAT_SIM only), `dojo` (SHORTCUT_DOJO only), `prefill` (STANDARD_GYM only), `mode` (default `careful`), `targetWPM` (default 0), `maxMistakes` (overrides mode preset), `gameSpeed` (GAME_NINJA_RUN only, default 1) |

`ViewportMode` (`types/lesson.ts`): `POSTURE_CHECK`, `KEY_INTRO`,
`STANDARD_GYM`, `GAME_NINJA_RUN`, `CHAT_SIM`, `SHORTCUT_DOJO`.

### `mode` presets → `StepRules`

Defined in `MODE_PRESETS` (`lib/curriculum.ts`); expanded by `buildRules`:

| mode | allowBackspace | blockOnTypo | maxMistakesAllowed | use for |
|---|---|---|---|---|
| `learn` | false | true | 2 | new keys |
| `careful` (default) | true | true | 2 | practice |
| `strict` | true | true | 1 | tests |
| `free` | **false** | false | 999 | games |

Full `StepRules` = preset + `maxMistakesAllowed = step.maxMistakes ?? preset`,
`minimumWPM = step.targetWPM ?? 0`, `gameSpeed = step.gameSpeed ?? 1`.
Note `free` disables backspace — game steps cannot correct mistakes.

`targetWPM` gates only the **top two** star tiers (5★ needs `wpm ≥ target`,
4★ needs `wpm ≥ 0.8 × target`); 3★ and below are accuracy-only. See
[progress.md](progress.md).

### Special keys & chords (v4.1) — `lib/keyTokens.ts`

A `text` token is classified in this order:
1. **Special key** — one of `SPECIAL_KEY_TOKENS`: `Enter Backspace Tab
   CapsLock Control Alt Shift` (exact `KeyboardEvent.key` names).
   Allowed: all seven in KEY_INTRO; only `Enter`/`Tab` inline in STANDARD_GYM
   (`GYM_INLINE_SPECIALS`) — Enter really breaks the line, Tab indents.
   Never in games or POSTURE_CHECK.
2. **Chord** — `parseChordToken` returns a `ChordToken { ctrl, alt, shift,
   key }` for tokens like `Ctrl+C`, `Ctrl+Shift+Z`, `Shift+ArrowRight`.
   Leading parts must be known non-duplicated modifiers (`Ctrl`/`Alt`/`Shift`);
   the base must be `[a-zA-Z0-9]` (lowercased) or a named base
   (`ArrowLeft/Right/Up/Down`, `Home`, `End`, `Delete`). `"1+1"`, `"+="`,
   `"++"` do **not** parse — they stay typed text. Allowed in KEY_INTRO and
   STANDARD_GYM, never in games. Don't author `Ctrl+W`/`Ctrl+T`/`Alt+Tab`
   (browser/OS swallows them).
3. Otherwise: plain text, typed character by character.

`chordMatchesEvent(chord, e)` is **strict**: every modifier flag must equal
the chord's flags and `metaKey` must be false — `Ctrl+C` rejects
`Ctrl+Shift+C`. `chordKeys(chord)` lists the physical keys to light on the
keyboard visualization.

### CHAT_SIM payload

`step.chat: ChatTurn[]` where `ChatTurn = { from: 'them' | 'you', text }`.
`them` bubbles appear automatically; each `you` turn is typed then sent with
Enter. ≥1 `you` turn required; `text`/`dojo` must be omitted; `you` message
text must be plain typable ASCII (validator rejects specials/chords).

### SHORTCUT_DOJO payload — `lib/dojoSim.ts`

`step.dojo = { doc: "the quick brown fox", tasks: [{ do: "Ctrl+A", say:
LocalizedString }] }`. Document model: a **list of words**; selection is a
contiguous `[start, end)` word range or null; clipboard is a word list.

Allowed `do` values (`DOJO_ACTIONS`): `Ctrl+A`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X`,
`Ctrl+Z`, `Ctrl+Y`, `Shift+ArrowRight` (grow selection one word),
`Shift+ArrowLeft` (shrink one word).

`applyDojoAction(state, action)` is a pure reducer returning
`{ ok: true, next } | { ok: false, error }`. Only `Ctrl+X` and `Ctrl+V`
mutate the document, so **only they push onto the undo stack** — a `Ctrl+Z`
after only selections/copies is an error. The validator *simulates* the whole
task script (`simulateDojo`) and rejects impossible sequences at build time.

### prefill (fix-the-typo drills)

STANDARD_GYM only. `"text": "the cat sat", "prefill": "teh"` — the step
starts with `teh` pre-typed and marked wrong; the student backspaces, retypes,
then continues. Rules: prefill tokens are a prefix of the text tokens, each
the same length as its text token, plain text only, and the mode must allow
backspace (`careful` or `strict`).

### Thumbnails in data

`"thumbnail": { "svgId": "TWO_KEYS_FOCUS", "parameters": {...} }` — `svgId`
must exist in `ThumbnailRegistry`. Raster alternative:
`{ "imageSrc": "/course-cover.svg" }`. **Caveat:** the normalizer keeps
`imageSrc` for course/section thumbnails but drops it for lessons — a lesson
thumbnail survives only if it has an `svgId` (`LessonNode.thumbnail` is typed
`{ svgId, parameters? }`). See [thumbnails.md](thumbnails.md).

## 2. Normalization — `lib/curriculum.ts`

Exports: `course: CourseNode` (the singleton, built once at import),
`MODE_PRESETS`, `deriveKeys`. Everything else is internal.

Source → runtime transforms:

- **Numbering**: `chapterNumber`/`sectionNumber`/`lessonNumber`/`stepNumber`
  = array index + 1.
- **Step ids**: `stepId = \`${lesson.id}-s${i + 1}\``.
- **Token splitting** (`splitText`): string → `split(/\s+/).filter(Boolean)`;
  array → `filter(Boolean)`.
- **Per-viewport `content`** (`stepContent`): CHAT_SIM → every `you` turn's
  tokens each followed by a literal `'Enter'` token; SHORTCUT_DOJO → the raw
  `task.do` chord strings; everything else → `splitText(step.text)`.
- **Rules**: `mode` preset expanded via `buildRules` (table above).
- **`unlockedKeys`** (`deriveKeys`, used when `lesson.keys` is omitted): walk
  every content token — special key → pushed as-is (`'Enter'`); chord → its
  active modifiers (`'Control'`/`'Alt'`/`'Shift'`) plus base key; plain token
  → each char lowercased. De-duplicated, insertion-ordered. So `unlockedKeys`
  mixes lowercase chars and named keys.
- **Fallbacks**: `type ?? 'practice'`; `passStars ??
  LESSON_TYPES[type].defaultPassStars`; `goal ?? title`;
  `description ?? title`; `audience ?? ''`.
- `chat`/`dojo`/`prefill` are passed through (prefill is tokenized).

Runtime node types (`types/lesson.ts`): `StepNode { stepId, stepNumber,
viewport, instruction, content: string[], prefill?, chat?, dojo?, rules }`,
`LessonNode { lessonId, lessonNumber, type, lessonTitle, pedagogicalGoal,
unlockedKeys, passStars, thumbnail?, steps }`, plus `SectionNode`,
`ChapterNode`, `CourseNode`. (`LessonNode.archetype` is declared but never
populated — vestigial.)

## 3. Lesson types — `lib/lessonTypes.tsx`

`LESSON_TYPES: Record<LessonType, LessonTypeConfig>` centralizes all per-type
behavior; pages never switch on the type string directly.

| type | graded | defaultPassStars | order | label (en) | badge |
|---|---|---|---|---|---|
| `lesson` | no | 0 | 0 | Learn | sky |
| `practice` | no | 0 | 1 | Practice | emerald |
| `test` | yes | 3 | 2 | Tests | amber |
| `game` | yes | 1 | 3 | Games | violet |

Also exports `LESSON_TYPE_ORDER` (grouping order on course pages and rails),
`isGradedType(type)`, and `LessonTypeIcon` (inline SVG per type).

**Adding a type** = (1) extend the `LessonType` union in `types/lesson.ts`,
(2) add one `LESSON_TYPES` entry + a `LessonTypeIcon` case, (3) add the
string to `TYPES` (and `UNGRADED_TYPES` if ungraded) in
`scripts/validate-lessons.mjs` — the validator can't import TS.

## 4. The validator — `scripts/validate-lessons.mjs`

Run via `npm run validate:lessons`. Exits 1 on any error; warnings don't fail.
It is the only automated check in the repo (no test runner).

Checks: all-three-locale completeness on every localized field; globally
unique ids; viewport/mode/type enum membership; `passStars` range 0–5 and
0/omitted on ungraded types; non-empty `steps`; `text`/`chat`/`dojo` mutual
exclusion per viewport; CHAT_SIM turn shape + ≥1 `you` turn + plain-ASCII
messages; SHORTCUT_DOJO action whitelist + **full script simulation**;
malformed-chord detection; token placement per viewport (games plain-words
only; gym bare specials limited to Enter/Tab); declared-`keys` coverage of
every token; prefill shape rules; numeric sanity (`targetWPM ≥ 0`,
`maxMistakes ≥ 0`, `gameSpeed > 0`, warn outside 0.3–3 or outside games);
thumbnail `svgId` existence (scraped from `SvgLibrary.tsx` by regex).

**Sync duplication**: the validator re-implements TS logic in plain JS —
`VIEWPORTS`, `MODES`, `TYPES`/`UNGRADED_TYPES`, `BACKSPACE_MODES`, the
special-key/chord grammar, and `simulateDojo`. If you change
`lib/keyTokens.ts`, `lib/dojoSim.ts`, `lib/lessonTypes.tsx`, or
`MODE_PRESETS`, update the validator's mirror constants in the same commit.

## Invariants

- All three locales present on every `LocalizedString` — no exceptions.
- Ids globally unique across the whole tree.
- Never hand-author `stepId`, `*Number`, or expanded rules — the normalizer
  owns them.
- Games (`GAME_NINJA_RUN`) accept plain word tokens only.
- Validator and TS sources must stay mirrored (see above).
- `npm run validate:lessons` must pass before committing data changes.
