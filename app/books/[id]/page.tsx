'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { BookDialog } from '@/components/books/BookDialog';
import {
  useBooks, findBook, removeBook, recordLeaf, scoreKey, wordCount,
  chapterLeaves, bookLeaves, hasTopics, type Book, type Chapter, type Leaf, type PageScore,
} from '@/lib/catalog/books';
import type { LocalizedString } from '@/types/lesson';
import { useTypingTest } from '@/components/home/useTypingTest';
import { TestWords } from '@/components/home/TestWords';
import { TestResult } from '@/components/home/TestResult';
import { DEFAULT_CONFIG } from '@/lib/typing/typingTest';
import { useLocale } from '@/lib/core/locale';
import { STR } from '@/lib/core/uiStrings';

type Scores = Record<string, PageScore>;

export default function BookPage() {
  const params = useParams<{ id: string }>();
  const { locale } = useLocale();
  const { books, scores } = useBooks();

  /** null = chapter list · {c} = that chapter · {c,leaf} = typing */
  const [sel, setSel] = useState<{ c: number; leaf: Leaf | null } | null>(null);
  const [editing, setEditing] = useState(false);

  const book = findBook(books, params?.id);

  // The store hydrates on the client, so a learner's own book is briefly
  // absent on first paint — that is a loading state, not a 404.
  if (!book) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] dark:bg-neutral-950 min-h-[calc(100dvh-3.5rem)]">
        <Link href="/books" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          {STR.books.backToBooks[locale]}
        </Link>
      </div>
    );
  }

  /* A chapter with no topics IS the typing unit, so opening it skips the
     middle level entirely — that is what makes one model serve both kinds
     of book without the UI branching anywhere else. */
  const openChapter = (i: number) => {
    const leaves = chapterLeaves(book.chapters[i]);
    setSel({ c: i, leaf: hasTopics(book.chapters[i]) ? null : (leaves[0] ?? null) });
  };

  const chapter = sel ? book.chapters[sel.c] : null;

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-950 dark:text-white min-h-screen pt-10 px-6">
      <div className="max-w-4xl mx-auto w-full pb-24">
        {!sel || !chapter ? (
          <ChapterList
            book={book}
            scores={scores}
            onOpen={openChapter}
            onEdit={() => setEditing(true)}
          />
        ) : sel.leaf ? (
          <Practice
            book={book}
            chapter={chapter}
            leaf={sel.leaf}
            onBack={() =>
              hasTopics(chapter) ? setSel({ c: sel.c, leaf: null }) : setSel(null)
            }
            onNext={() => {
              const all = bookLeaves(book);
              const i = all.findIndex((l) => l.leafId === sel.leaf!.leafId);
              const next = all[i + 1];
              if (!next) return setSel(null);
              const ci = book.chapters.findIndex((c) =>
                chapterLeaves(c).some((l) => l.leafId === next.leafId),
              );
              setSel({ c: ci, leaf: next });
            }}
          />
        ) : (
          <TopicList
            book={book}
            chapter={chapter}
            scores={scores}
            onBack={() => setSel(null)}
            onOpen={(leaf) => setSel({ c: sel.c, leaf })}
          />
        )}
      </div>

      {/* Mounted only while open, so the dialog seeds its drafts from the
          book as it is right now — see BookDialog. */}
      {editing && <BookDialog initial={book} onClose={() => setEditing(false)} />}
    </div>
  );
}

/* ── Level 1: chapters ─────────────────────────────────────────────────── */

function ChapterList({
  book,
  scores,
  onOpen,
  onEdit,
}: {
  book: Book;
  scores: Scores;
  onOpen: (i: number) => void;
  onEdit: () => void;
}) {
  const { locale } = useLocale();
  const leaves = bookLeaves(book);
  const withTopics = leaves.length > book.chapters.length;

  return (
    <div className="animate-in fade-in duration-300">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        {STR.books.backToBooks[locale]}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {book.title[locale]}
          </h1>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            {book.author || STR.books.yourBook[locale]} · {book.chapters.length}{' '}
            {STR.books.chapters[locale]}
            {withTopics && ` · ${leaves.length} ${STR.books.topics[locale]}`}
          </p>
        </div>
        {/* Only a learner's own book can be edited or deleted — the shipped
            ones are read-only and come from the JSON on every load. */}
        {book.custom && (
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={STR.books.editBook[locale]}
              title={STR.books.editBook[locale]}
              className="p-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Pencil size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => removeBook(book.bookId)}
              aria-label={STR.books.remove[locale]}
              title={STR.books.remove[locale]}
              className="p-2 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {book.chapters.map((c, i) => {
          const own = chapterLeaves(c);
          const done = own.filter((l) => scores[scoreKey(book.bookId, l.leafId)]).length;
          return (
            <Row
              key={c.id}
              index={i + 1}
              title={nameOf(c.title, i + 1, 'chapter', locale)}
              meta={
                hasTopics(c)
                  ? `${own.length} ${STR.books.topics[locale]}${done ? ` · ${done}/${own.length}` : ''}`
                  : bestOrWords(scores[scoreKey(book.bookId, c.id)], c.text ?? '', locale)
              }
              onClick={() => onOpen(i)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Level 2: topics inside one chapter ────────────────────────────────── */

function TopicList({
  book,
  chapter,
  scores,
  onBack,
  onOpen,
}: {
  book: Book;
  chapter: Chapter;
  scores: Scores;
  onBack: () => void;
  onOpen: (leaf: Leaf) => void;
}) {
  const { locale } = useLocale();

  return (
    <div className="animate-in fade-in duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        {STR.books.backToChapters[locale]}
      </button>

      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-1">
        {nameOf(chapter.title, book.chapters.indexOf(chapter) + 1, 'chapter', locale)}
      </h1>
      <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8">
        {chapter.topics?.length} {STR.books.topics[locale]}
      </p>

      <div className="flex flex-col gap-2">
        {chapterLeaves(chapter).map((leaf, i) => (
          <Row
            key={leaf.leafId}
            index={i + 1}
            title={nameOf(leaf.title, i + 1, 'topic', locale)}
            meta={bestOrWords(scores[scoreKey(book.bookId, leaf.leafId)], leaf.text, locale)}
            onClick={() => onOpen(leaf)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Level 3: the text, typed ──────────────────────────────────────────── */

function Practice({
  book,
  chapter,
  leaf,
  onBack,
  onNext,
}: {
  book: Book;
  chapter: Chapter;
  leaf: Leaf;
  onBack: () => void;
  onNext: () => void;
}) {
  const { locale } = useLocale();

  /* A fresh object every render would re-key the engine's reset effect on
     every keystroke — memoize on the leaf text. */
  const cfg = useMemo(
    () => ({ ...DEFAULT_CONFIG, mode: 'custom' as const, custom: leaf.text, punctuation: false, numbers: false }),
    [leaf.text],
  );
  const test = useTypingTest(cfg, true);
  const done = test.status === 'done';

  // Bank the run once, when the result first appears.
  const bankedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!test.result || bankedFor.current === leaf.leafId) return;
    bankedFor.current = leaf.leafId;
    recordLeaf(book.bookId, leaf.leafId, {
      wpm: test.result.wpm,
      accuracy: Math.round(test.result.accuracy),
    });
  }, [test.result, book.bookId, leaf.leafId]);

  useEffect(() => {
    bankedFor.current = null;
  }, [leaf.leafId]);

  const ci = book.chapters.indexOf(chapter);
  const chapterName = nameOf(chapter.title, ci + 1, 'chapter', locale);
  const crumb = hasTopics(chapter)
    ? `${chapterName} · ${nameOf(
        leaf.title,
        chapterLeaves(chapter).findIndex((l) => l.leafId === leaf.leafId) + 1,
        'topic',
        locale,
      )}`
    : chapterName;

  return (
    <div className="animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        {hasTopics(chapter) ? STR.books.backToTopics[locale] : STR.books.backToChapters[locale]}
      </button>

      {done && test.result ? (
        <TestResult result={test.result} onNext={onNext} onRepeat={test.repeat} />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest truncate">
              {crumb}
            </span>
            <span className="font-mono text-xl text-neutral-500 dark:text-neutral-400 leading-none shrink-0">
              {test.progressLabel}
            </span>
          </div>

          {/* The leaf is the whole unit of work, so it is laid out in full and
              the box scrolls — three lines would read as truncated. */}
          <TestWords
            words={test.words}
            typed={test.typed}
            input={test.input}
            wordIdx={test.wordIdx}
            variant="full"
            maxHeight="calc(100dvh - 16rem)"
          />

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={test.restart}
              title={STR.test.hintRestart[locale]}
              aria-label={STR.test.hintRestart[locale]}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-950/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Shared row ────────────────────────────────────────────────────────── */

function Row({
  index,
  title,
  meta,
  onClick,
}: {
  index: number;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 text-left bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow transition-all cursor-pointer"
    >
      <span className="shrink-0 w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
        {index}
      </span>
      <span className="flex-1 min-w-0 text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
        {title}
      </span>
      <span className="shrink-0 text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
        {meta}
      </span>
      <ChevronRight
        size={15}
        strokeWidth={2}
        aria-hidden
        className="shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors"
      />
    </button>
  );
}

function bestOrWords(best: PageScore | undefined, text: string, locale: 'en' | 'uz' | 'ru'): string {
  return best ? `${best.wpm} wpm` : `${wordCount(text)} ${STR.books.words[locale]}`;
}

/** A plain paste has no `#` headings, so its chapter/topic titles are empty. */
function nameOf(
  title: LocalizedString,
  index: number,
  kind: 'chapter' | 'topic',
  locale: 'en' | 'uz' | 'ru',
): string {
  return title[locale]?.trim() || `${STR.books[kind][locale]} ${index}`;
}
