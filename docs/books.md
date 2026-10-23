# Books — typing practice over long-form text

Type a whole book, one page at a time. Two sources of book: a small shipped
set, and anything the learner pastes in.

| | |
|---|---|
| shipped data | `data/books.json` |
| model + store | `lib/books.ts` (`tz-books-v1`) |
| library | `app/books/page.tsx` |
| one book | `app/books/[id]/page.tsx` |
| art | `BOOK_COVER` in `components/thumbnails/covers/catalog.tsx` |
| strings | `STR.books.*` |

## 1. There is no book typing engine

A page is handed to the **home page's** test engine as a custom test:

```ts
const cfg = useMemo(
  () => ({ ...DEFAULT_CONFIG, mode: 'custom', custom: pageText,
           punctuation: false, numbers: false }),
  [pageText],
);
const test = useTypingTest(cfg, true);
```

`mode: "custom"` already existed for the home page's paste-your-own-text
option (`buildTest` in `lib/typingTest.ts`), so books reuse the caret,
the per-letter colouring, the scoring, the `lib/stats.ts` recording and the
`TestResult` screen for free. **Do not add a fourth typing implementation
here** — the repo already has the lesson runtime, the games and this one.

The `cfg` object **must** be memoized on the page text. `useTypingTest`'s
reset effect depends on `cfg` identity; a fresh object each render would
restart the test on every keystroke.

The words are rendered with `<TestWords variant="full">`, not the home
page's default three-line window: a leaf is the whole unit of work, so the
full text is laid out and the box scrolls (`maxHeight:
calc(100dvh - 16rem)`) with the caret kept one line clear of either edge. A
130-word leaf fits without scrolling at 1280×900. Its scrollbar is hidden
(`.tz-noscrollbar`) because it is the only scroller that moves while you
type. See `docs/home-test.md` § "TestWords has two variants" — `window` mode
is the home page and must not be disturbed by changes made for books.

## 2. book → chapter → (topic) → text

Real books split two ways, so the model serves both from one shape:

```
chapters only     Chapter 1 → text
chapters + topics Chapter 1 → Topic 1 → text
```

**A chapter has `text` OR `topics`, never both.** That single rule is what
keeps the UI simple: there is exactly one kind of leaf, and no node is ever
both a folder and a page. `chapterLeaves()` / `bookLeaves()` return the
typable units; `hasTopics()` decides whether opening a chapter shows a topic
list or goes straight to typing. A chapters-only book therefore **skips the
middle level entirely** rather than showing a one-item list.

Keep a leaf around 110–140 words — long enough to be a real run, short
enough that a mistake near the end does not cost five minutes.

### One dialog, two entry points

`components/books/BookDialog.tsx` is shared: `/books` renders it with no
`initial` to create a book, `/books/[id]` renders it with `initial={book}` to
edit one. **Mount it conditionally** (`{open && <BookDialog … />}`) — the
drafts are seeded in `useState` initialisers, so a fresh mount is what loads
the book being edited. Keeping it mounted and hidden would show stale drafts
the second time it opens.

The "Add a book" action lives in the page header, top-right, not as a
trailing dashed tile in the grid: adding is a page-level action, and a card
in the grid reads as one more book to open.

Edit and delete sit together on `/books/[id]`, and **only for
`custom: true` books** — the shipped ones are rebuilt from the JSON on every
load, so there is nothing to edit or delete.

`updateBook()` keeps the book's `bookId` and `tone` (the cover must not
change colour, and open links must still resolve) and drops the scores of
leaves that no longer exist — editing can rename, reorder or delete
chapters, which would otherwise orphan score keys nothing can reach. Scores
for surviving leaves are kept: renaming a chapter should not erase the run
you did on it. Like `addBook()`, it re-runs `checkChapters()` and refuses,
so the quality gate cannot be bypassed by editing a book after saving it.

### The dialog is a builder, not a paste box

The learner picks the structure, then builds the book: **+ Add chapter**,
and inside each chapter (in `topics` mode) **+ Add topic**. Each node has a
name field and its own text area with its own live word count and verdict,
so a bad chapter is flagged where it is rather than only in the footer.

The dialog edits **drafts**, not `Chapter`s:

```ts
type DraftChapter = { title: string; text: string; topics: DraftTopic[] }
```

A draft keeps *both* its own text and its topics, so flipping the structure
toggle never destroys what was typed under the other one. `toChapters()` is
the single place drafts become the stored shape, and it drops empty nodes.

An earlier version parsed `#`/`##` markers out of one big textarea. It is
gone: the builder makes the structure explicit and needs no syntax to teach.

Untitled chapters/topics are stored with an empty title and rendered as
"Chapter N" / "Topic N" **in the reader's language** (`nameOf()` in the
page) — do not bake an English fallback into the data. Whitespace is
collapsed on the way in, because the engine splits on spaces and a stray tab
would become an untypeable "word".

## 2b. The quality gate — `checkText()`

WPM is characters ÷ 5 ÷ minutes, so `a a a a a…` is a free record: one key
and a space, no reaches, no rhythm. Anyone could paste it, run it, and
poison their own `/stats` records. `checkText()` rejects text that is not
really text, using five signals — the reasoning for each threshold is in the
function's doc comment, and **that comment is the spec**:

| # | signal | catches |
|---|---|---|
| 1 | distinct words ≥ `√words × 2.5` | `a a a a a`, tiny vocabularies |
| 2 | no word > 25% of the text | `the the the the` |
| 3 | no word 5× in a row | literal key-mashing |
| 4 | average word length ≥ 2.2 | walls of 1–2 letter tokens |
| 5 | distinct 5-word windows ≥ 60% | **one paragraph pasted N times** |

Signal 5 exists because signals 1–4 all *passed* a paragraph repeated five
times when this was first measured — vocabulary stays rich, no word
dominates, nothing repeats adjacently. Windows see it (0.20 against a real
text's ~1.0). Do not remove it without re-running that case.

Two thresholds are deliberately **not** raised: average word length stays at
2.2 because "I am not sure if he can do it at all" averages 2.2 and simple
sentences are what this audience writes; and the windows floor stays at 0.6
so a book with a repeated refrain (~0.84) still passes. A false rejection
costs a learner their book; a false pass costs one inflated number.

`checkChapters()` applies it to **every leaf separately**, so one good
chapter cannot carry a junk one. `MIN_WORDS = 20` is checked as
`> MIN_WORDS` per leaf — 20 words rejected, 21 accepted.

Enforced in two places on purpose: the dialog disables Save and says which
problem it is, and **`addBook()` re-checks and refuses regardless**, so no
other caller can put a padded book in the store.

## 3. Storage

`tz-books-v1` holds `{ books, scores }` behind the same
`useSyncExternalStore` idiom as `lib/locale.tsx` and
`components/home/testConfig.ts`, so the server render is a stable empty
store instead of a hydration mismatch.

- Only `custom: true` books are stored and only they can be deleted;
  shipped books come from the JSON on every load.
- `scores` is keyed `bookId/leafId` (`c2` or `c1-t3`) and keeps the
  **better** run, so a leaf you already aced never goes backwards. Lists
  print best WPM where a run exists and the word count where it does not; a
  chapter with topics prints `done/total` instead.
- Books saved before chapters existed had `pages: string[]`. `migrate()` in
  `read()` turns each page into a chapter on load — keep it, or those books
  vanish from the shelf.
- Because the store hydrates on the client, `/books/[id]` briefly cannot
  find a learner's own book on first paint. That renders a quiet "back to
  books" link — it is a loading state, not a 404, so do not turn it into an
  error page.

## 4. Content rules for `data/books.json`

Everything shipped here must be **original text written for this app or
genuinely public domain**. The starter book (`lighthouse`) is original prose
written for the app; its `author` is `tez/yozish` for that reason. Never
paste in text from a published book — learners can add whatever they like to
their own store, but the repo ships nothing it does not own.

## 5. `/courses` no longer links the typing course

The "Typing course" card was replaced by the Books card. The course itself
is unchanged and still reachable from the navbar's **Keyboard** link
(`/courses/course_core_typing`) — `/courses` simply stopped being a second
door to it. `STR.courses.typingGroup` and `STR.courses.coreDesc` were
deleted with the card.
