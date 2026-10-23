# The coding catalogue — `/coding`

A browsable classification of everything a student could learn about
programming, ordered **beginner → master**, in the same card language as
`/courses`. There is **no lesson content yet** — this unit is the map, not
the journey. Adding lessons later must not require re-cutting the map.

| | |
|---|---|
| data | `data/coding-curriculum.json` |
| model | `lib/coding.ts` |
| page | `app/coding/page.tsx` |
| art | `CODE_TRACK_COVER` in `components/thumbnails/covers/catalog.tsx` |
| strings | `STR.coding.*` in `lib/uiStrings/coding.ts` |

## 1. Three tiers, and why

```
Stage   (6)    the rung on the ladder      Foundations → … → Mastery
 Track (35)    a field inside that stage   Python, Databases, Ethical Hacking…
  Module(188)  the chapter blocks          "Variables and types", "JOIN", …
```

Two axes had to survive in one tree: **progression** ("beginner to master")
and **breadth** ("all fields"). Stage-first gives the ladder its spine;
tracks give each rung its width. The alternative — field-first, with levels
inside each field — reads as a pile of unrelated syllabi and hides the
order, which is the thing a beginner most needs to see.

**The whole ladder is on one page.** Stages are section headings, not cards,
so all six rungs and all 35 tracks are visible by scrolling. Only a track
drills down (to its module list). Making stages clickable too would have
cost a click and hidden the ordering that the unit exists to communicate.

The six stages:

| # | Stage | Goal | Tracks |
|---|---|---|---|
| 1 | Foundations | Understand the machine, think in steps | 5 |
| 2 | First Code | Write, run and fix real programs | 5 |
| 3 | Building Things | Ship something usable | 6 |
| 4 | Engineering | Code that stays fast, correct, readable | 6 |
| 5 | Specialist Fields | Pick a field and go deep | 7 |
| 6 | Mastery | Work at the level of the machine and the team | 6 |

Stage 5 is the widest on purpose — it is the fan-out where cybersecurity,
ethical hacking, AI, data science, robotics, graphics and blockchain sit
side by side as equal choices rather than as a ranked list.

## 2. The typing half — the reason this lives here and not on a coding site

Every track carries two fields that are **never translated**, because they
are code rather than prose:

- `typingFocus` — the symbol keys that track drills, e.g. `( ) { } [ ] ; = _`
- `sample` — one real line of that field's code, e.g.
  `SELECT name FROM users WHERE age > 18;`

They are the seam to the typing engine: a future lesson generator reads
them, and today the page already shows them (keycap chips + a code block in
the track sidebar, and the sample painted into the cover art). A cover with
no code on it would sell half the promise, so `CODE_TRACK_COVER` draws an
editor window with the line inside it.

Keep both fields **one line** and ≤ ~45 characters — the cover shrinks the
monospace to fit a 300px window interior and will get illegibly small past
that.

## 3. Data contract

`data/coding-curriculum.json` is `{ stages: [...] }`. A track's modules are
three **parallel** `en`/`uz`/`ru` arrays — index `i` is the same module in
every language, the same shape `data/k-12-curriculum.json` uses. `en` is
authoritative: a short `uz`/`ru` array falls back to the English title
rather than rendering blank.

```json
{ "id": "databases-sql", "icon": "Database", "tone": "teal",
  "typingFocus": "* = ; ' ( )",
  "sample": "SELECT name FROM users WHERE age > 18;",
  "title":   { "en": "…", "uz": "…", "ru": "…" },
  "summary": { "en": "…", "uz": "…", "ru": "…" },
  "modules": { "en": ["Tables and rows", …], "uz": […], "ru": […] } }
```

- `icon` is a **lucide component name** (`"Database"`), resolved through
  `CODE_GLYPHS` in `covers/catalog.tsx`. An unknown name falls back to
  `FileCode2` — never a hole in the grid. Adding an icon means adding it to
  the lucide import **and** to `CODE_GLYPHS`.
- `tone` is one of the 12 `Tone` names in `types/thumbnail.ts`; unknown
  values fall back to slate (`toTone` in `lib/coding.ts`).
- Track `id`s must be unique across the whole file — they are the `?track=`
  deep-link key, not just a within-stage key.

`lib/coding.ts` exports `codingStages`, the flat `codingTracks`,
`codingTotals` (the 6 / 35 / 188 chips on the page are read from the data,
never typed into copy), `findTrack` and `findStage`.

## 4. Page behaviour

Two views in one route, mirroring `/courses`:

- **Ladder** — stages as headings (rung number + tone dot + goal line), each
  with a `GRID` of track cards.
- **Track** — numbered block list on the left, cover + typing panel on the
  right. Back button returns to the ladder.

`?track=databases-sql` deep-links on entry (`use(searchParams)`), local
state after. Both transitions call `window.scrollTo(0, 0)` — the ladder is
six screens tall, and without it the track view opens mid-page with its back
button under the sticky navbar. `/courses` has the same guard for the same
reason.

The `GRID` / `CARD` / `CARD_HOVER` constants are duplicated from
`app/courses/page.tsx` deliberately: three catalogues share a look, but a
shared component would have to absorb three different card bodies (stars and
locks, progress bars, block counts) to earn it.

## 5. Ethical hacking

The track is framed as **authorised testing**: its first block is "Rules,
law and permission" and its last is "Writing the report", and the sample
line targets `scanme.nmap.org` — the host nmap publishes for exactly this
purpose. Keep that framing if the track is extended; this is a school
product.

## 6. When lessons arrive

Nothing in the schema needs to change. A module grows a `lessons` array (or
a `lessonId` pointing into the existing curriculum engine), and the block
list in `TrackView` turns from `<li>` into a link — the same one-line change
the K-12 subject cards are waiting on.
