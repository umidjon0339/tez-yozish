/**
 * Books — typing practice over long-form text.
 *
 * Shape: **book → chapter → (topic) → text**. A chapter either holds `text`
 * of its own or a list of `topics`, never both, so there is exactly one kind
 * of leaf and the UI never has to render a node that is both a folder and a
 * page. That is what lets one model serve the two ways real books are split:
 *
 *   chapters only    Chapter 1 → text
 *   chapters+topics  Chapter 1 → Topic 1 → text
 *
 * The runtime is NOT a new engine: a leaf's text is handed to the home
 * test's `useTypingTest` as `{ mode: "custom", custom: text }`.
 *
 * Two sources, one shape: shipped books come from `data/books.json`, the
 * learner's own live in localStorage under `tz-books-v1`.
 */

import { useSyncExternalStore } from 'react';
import raw from '@/data/books.json';
import { LocalizedString } from '@/types/lesson';
import type { Tone } from '@/types/thumbnail';

export interface Topic {
  id: string;
  title: LocalizedString;
  text: string;
}

export interface Chapter {
  id: string;
  title: LocalizedString;
  /** set when the chapter IS the typing unit (no topics under it) */
  text?: string;
  /** set when the chapter is a folder of topics */
  topics?: Topic[];
}

export interface Book {
  bookId: string;
  title: LocalizedString;
  author: string;
  tone: Tone;
  chapters: Chapter[];
  /** true for a book the learner pasted in — only those can be deleted */
  custom: boolean;
}

/** A thing you can actually type: a topic, or a chapter with no topics. */
export interface Leaf {
  /** `c1` or `c1-t2` — stable, and the scores key */
  leafId: string;
  title: LocalizedString;
  text: string;
}

export interface PageScore {
  wpm: number;
  accuracy: number;
}

const STORAGE_KEY = 'tz-books-v1';

/** Below this a "book" is a scrap of text, not something worth structuring. */
export const MIN_WORDS = 20;

const TONES: Tone[] = [
  'sky', 'emerald', 'amber', 'violet', 'rose', 'indigo',
  'teal', 'orange', 'lime', 'cyan', 'fuchsia', 'slate',
];

export function toneFor(id: string): Tone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

const plain = (s: string): LocalizedString => ({ en: s, uz: s, ru: s });

/** The engine splits on spaces, so a stray tab would become an untypeable word. */
const tidy = (s: string): string => s.replace(/\s+/g, ' ').trim();

export const wordCount = (s: string): number => (tidy(s) ? tidy(s).split(' ').length : 0);

// ─── SHIPPED BOOKS ───

type RawBook = {
  id: string;
  tone: string;
  author: string;
  title: LocalizedString;
  chapters: Chapter[];
};

export const builtInBooks: Book[] = (raw as unknown as { books: RawBook[] }).books.map((b) => ({
  bookId: b.id,
  title: b.title,
  author: b.author,
  tone: (TONES as string[]).includes(b.tone) ? (b.tone as Tone) : 'slate',
  chapters: b.chapters,
  custom: false,
}));

// ─── LEAVES ───

export function chapterLeaves(chapter: Chapter): Leaf[] {
  if (chapter.topics?.length) {
    return chapter.topics.map((t) => ({ leafId: `${chapter.id}-${t.id}`, title: t.title, text: t.text }));
  }
  return chapter.text ? [{ leafId: chapter.id, title: chapter.title, text: chapter.text }] : [];
}

export function bookLeaves(book: Book): Leaf[] {
  return book.chapters.flatMap(chapterLeaves);
}

export const hasTopics = (c: Chapter): boolean => !!c.topics?.length;

/** Which shape the learner said their book has, chosen in the add dialog. */
export type BookStructure = 'chapters' | 'topics';

// ─── TEXT QUALITY ───

export type TextIssue = 'short' | 'repetitive';

/**
 * Reject text that is not really text.
 *
 * WPM is characters ÷ 5 ÷ minutes, so `a a a a a…` is a free record: one key
 * and a space, endlessly, with no reaches and no rhythm. Anyone can paste
 * that, run it, and poison their own stats and every record on `/stats`.
 * These four signals catch the shapes that buys, without touching real prose:
 *
 *  1. **Vocabulary floor**, scaled as `√words × 2.5`. Strict on short texts
 *     (21 words must bring 12 different ones) and lenient on long ones (a
 *     1000-word chapter needs only 79), because real writing's type-token
 *     ratio *falls* as it gets longer.
 *  2. **No word may be over a quarter of the text.** English's commonest
 *     word, "the", runs about 7%.
 *  3. **No word five times in a row**, which is the literal `a a a a a`.
 *  4. **Average word length ≥ 2.2 characters** — real prose sits near 4.5,
 *     and a wall of one- and two-letter tokens is padding whatever it says.
 *     Not higher: "I am not sure if he can do it at all" averages 2.2, and
 *     simple sentences are exactly what this audience writes.
 *  5. **Distinct 5-word windows ≥ 60%.** Rules 1–4 all miss one paragraph
 *     pasted five times — the vocabulary stays rich, no word dominates, and
 *     nothing repeats *adjacently*. Comparing windows instead of words sees
 *     it (that case scores 0.20); genuine prose scores near 1.0, and a book
 *     with a repeated refrain still clears 0.8.
 *
 * Deliberately lenient: a false rejection costs a learner their book, a
 * false pass costs one inflated number. Tune upward only with real examples.
 */
export function checkText(text: string): TextIssue | null {
  const words = tidy(text).toLowerCase().split(' ').filter(Boolean);
  if (words.length <= MIN_WORDS) return 'short';

  const counts = new Map<string, number>();
  let maxRun = 1;
  let run = 1;
  let letters = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    counts.set(w, (counts.get(w) ?? 0) + 1);
    letters += w.length;
    if (i > 0 && w === words[i - 1]) {
      run += 1;
      if (run > maxRun) maxRun = run;
    } else {
      run = 1;
    }
  }

  if (counts.size < Math.max(10, Math.ceil(Math.sqrt(words.length) * 2.5))) return 'repetitive';

  let top = 0;
  counts.forEach((n) => {
    if (n > top) top = n;
  });
  if (top / words.length > 0.25) return 'repetitive';
  if (maxRun >= 5) return 'repetitive';
  if (letters / words.length < 2.2) return 'repetitive';

  // Block padding — the same passage over and over keeps every word-level
  // signal healthy, so compare 5-word windows instead of single words.
  if (words.length >= 40) {
    const windows = new Set<string>();
    const total = words.length - 4;
    for (let i = 0; i < total; i++) windows.add(words.slice(i, i + 5).join(' '));
    if (windows.size / total < 0.6) return 'repetitive';
  }

  return null;
}

/** Every typable leaf must pass on its own — one good chapter cannot carry a junk one. */
export function checkChapters(chapters: Chapter[]): TextIssue | null {
  const leaves = chapters.flatMap(chapterLeaves);
  if (!leaves.length) return 'short';
  for (const leaf of leaves) {
    const issue = checkText(leaf.text);
    if (issue) return issue;
  }
  return null;
}

/** Total typable words — what the ≥20 rule is checked against. */
export function totalWords(chapters: Chapter[]): number {
  return chapters.reduce(
    (n, c) => n + (c.text ? wordCount(c.text) : 0) + (c.topics?.reduce((m, t) => m + wordCount(t.text), 0) ?? 0),
    0,
  );
}

export function countTopics(chapters: Chapter[]): number {
  return chapters.reduce((n, c) => n + (c.topics?.length ?? 0), 0);
}

// ─── STORE ───

interface Stored {
  books: Book[];
  /** `bookId/leafId` → best run */
  scores: Record<string, PageScore>;
}

const EMPTY: Stored = { books: [], scores: {} };

let cache: Stored | null = null;
const listeners = new Set<() => void>();

/** A book saved before chapters existed had `pages: string[]`. */
type LegacyBook = Book & { pages?: string[] };

function migrate(b: LegacyBook): Book | null {
  if (Array.isArray(b.chapters) && b.chapters.length) return b;
  if (!Array.isArray(b.pages) || !b.pages.length) return null;
  return {
    ...b,
    chapters: b.pages.map((text, i) => ({
      id: `c${i + 1}`,
      title: plain(`${i + 1}`),
      text: tidy(text),
    })),
  };
}

function read(): Stored {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const rawStr = window.localStorage.getItem(STORAGE_KEY);
    if (!rawStr) return EMPTY;
    const parsed = JSON.parse(rawStr) as Partial<Stored>;
    const books = Array.isArray(parsed.books)
      ? parsed.books.map((b) => migrate(b as LegacyBook)).filter((b): b is Book => !!b)
      : [];
    return {
      books,
      scores: parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {},
    };
  } catch {
    return EMPTY;
  }
}

function write(next: Stored) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode or quota — the session still works, it just forgets */
  }
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): Stored {
  cache ??= read();
  return cache;
}

const getServerSnapshot = (): Stored => EMPTY;

export function useBooks(): { books: Book[]; scores: Record<string, PageScore> } {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { books: [...builtInBooks, ...store.books], scores: store.scores };
}

export function addBook(title: string, chapters: Chapter[]): Book | null {
  // Re-checked here, not only in the dialog, so no other caller can slip a
  // padded "book" past the quality gate and inflate the stats with it.
  if (checkChapters(chapters)) return null;

  const name = title.trim() || 'Untitled';
  const bookId = `own-${Date.now().toString(36)}`;
  const book: Book = {
    bookId,
    title: plain(name),
    author: '',
    tone: toneFor(bookId),
    chapters,
    custom: true,
  };
  const s = getSnapshot();
  write({ ...s, books: [...s.books, book] });
  return book;
}

/**
 * Rewrite a learner's own book in place. Keeps its `bookId` and `tone`, so
 * the cover does not change colour and any open link still resolves.
 *
 * Editing can rename, reorder or delete chapters, which silently orphans the
 * scores of leaves that no longer exist — those are dropped here rather than
 * left to accumulate against ids nothing can reach. Scores for surviving
 * leaves are kept: renaming a chapter should not erase the run you did on it.
 */
export function updateBook(bookId: string, title: string, chapters: Chapter[]): Book | null {
  if (checkChapters(chapters)) return null;

  const s = getSnapshot();
  const i = s.books.findIndex((b) => b.bookId === bookId);
  if (i < 0) return null;

  const prev = s.books[i];
  const name = title.trim() || prev.title.en;
  const next: Book = { ...prev, title: plain(name), chapters };

  const alive = new Set(chapters.flatMap(chapterLeaves).map((l) => `${bookId}/${l.leafId}`));
  const scores = { ...s.scores };
  Object.keys(scores).forEach((k) => {
    if (k.startsWith(`${bookId}/`) && !alive.has(k)) delete scores[k];
  });

  const books = [...s.books];
  books[i] = next;
  write({ books, scores });
  return next;
}

export function removeBook(bookId: string) {
  const s = getSnapshot();
  const scores = { ...s.scores };
  Object.keys(scores).forEach((k) => {
    if (k.startsWith(`${bookId}/`)) delete scores[k];
  });
  write({ books: s.books.filter((b) => b.bookId !== bookId), scores });
}

/** Keeps the better run — a leaf you already aced should not go backwards. */
export function recordLeaf(bookId: string, leafId: string, score: PageScore) {
  const s = getSnapshot();
  const key = `${bookId}/${leafId}`;
  const prev = s.scores[key];
  if (prev && prev.wpm >= score.wpm) return;
  write({ ...s, scores: { ...s.scores, [key]: score } });
}

export const scoreKey = (bookId: string, leafId: string) => `${bookId}/${leafId}`;

export function findBook(books: Book[], bookId: string | undefined): Book | null {
  return books.find((b) => b.bookId === bookId) ?? null;
}
