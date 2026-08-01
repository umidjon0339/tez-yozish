'use client';

/* The book builder — used to create a book on `/books` and to edit one on
   `/books/[id]`. Both entry points render the same dialog; the only
   difference is whether `initial` is supplied.

   Mount it conditionally (`{open && <BookDialog … />}`) rather than keeping
   it mounted and hidden: the drafts are seeded in `useState` initialisers, so
   a fresh mount is what loads the book being edited. */

import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  addBook, updateBook, checkText, checkChapters, totalWords, countTopics,
  wordCount, type Book, type BookStructure, type Chapter, type TextIssue,
} from '@/lib/books';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';
import type { Locale } from '@/lib/locale';

const FIELD =
  'w-full px-3 py-2 text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-neutral-500';

/* The dialog edits drafts, not `Chapter`s: a draft keeps BOTH its own text and
   its topics, so flipping the structure toggle never destroys what was typed
   under the other one. `toChapters` is the one place the two meet. */
type DraftTopic = { title: string; text: string };
type DraftChapter = { title: string; text: string; topics: DraftTopic[] };

const newTopic = (): DraftTopic => ({ title: '', text: '' });
const newChapter = (): DraftChapter => ({ title: '', text: '', topics: [newTopic()] });

function toChapters(drafts: DraftChapter[], structure: BookStructure): Chapter[] {
  return drafts
    .map((d, i): Chapter => {
      const base = { id: `c${i + 1}`, title: { en: d.title, uz: d.title, ru: d.title } };
      if (structure === 'topics') {
        const topics = d.topics
          .filter((t) => t.text.trim())
          .map((t, j) => ({
            id: `t${j + 1}`,
            title: { en: t.title, uz: t.title, ru: t.title },
            text: t.text,
          }));
        return { ...base, topics };
      }
      return { ...base, text: d.text };
    })
    .filter((c) => (c.topics?.length ?? 0) > 0 || !!c.text?.trim());
}

/** Stored → editable. A learner's own titles are the same string in all three
    locales (`plain()` in lib/books), so `en` is the one to edit. */
function toDrafts(chapters: Chapter[]): DraftChapter[] {
  if (!chapters.length) return [newChapter()];
  return chapters.map((c) => ({
    title: c.title.en,
    text: c.text ?? '',
    topics: c.topics?.length
      ? c.topics.map((t) => ({ title: t.title.en, text: t.text }))
      : [newTopic()],
  }));
}

export function BookDialog({
  initial,
  onClose,
  onSaved,
}: {
  /** omit to create a new book; pass a book to edit it in place */
  initial?: Book;
  onClose: () => void;
  onSaved?: (book: Book) => void;
}) {
  const { locale } = useLocale();
  const [title, setTitle] = useState(() => initial?.title.en ?? '');
  const [structure, setStructure] = useState<BookStructure>(() =>
    initial?.chapters.some((c) => c.topics?.length) ? 'topics' : 'chapters',
  );
  const [drafts, setDrafts] = useState<DraftChapter[]>(() => toDrafts(initial?.chapters ?? []));

  const chapters = useMemo(() => toChapters(drafts, structure), [drafts, structure]);
  const issue = checkChapters(chapters);
  const words = totalWords(chapters);
  const topics = countTopics(chapters);

  const save = () => {
    const saved = initial
      ? updateBook(initial.bookId, title, chapters)
      : addBook(title, chapters);
    if (!saved) return;
    onSaved?.(saved);
    onClose();
  };

  /** Immutable edit of one chapter draft. */
  const editChapter = (i: number, patch: Partial<DraftChapter>) =>
    setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const editTopic = (ci: number, ti: number, patch: Partial<DraftTopic>) =>
    setDrafts((ds) =>
      ds.map((d, j) =>
        j === ci ? { ...d, topics: d.topics.map((t, k) => (k === ti ? { ...t, ...patch } : t)) } : d,
      ),
    );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl my-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {initial ? STR.books.editBook[locale] : STR.books.add[locale]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={STR.books.cancel[locale]}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[65dvh] overflow-y-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={STR.books.bookTitle[locale]}
            className={`${FIELD} mb-3`}
          />

          {/* Not every book has topics — the learner says which kind theirs is */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {STR.books.structure[locale]}
            </span>
            {(['chapters', 'topics'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStructure(s)}
                aria-pressed={structure === s}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  structure === s
                    ? 'bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-neutral-950 dark:border-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                {s === 'chapters'
                  ? STR.books.onlyChapters[locale]
                  : STR.books.chaptersTopics[locale]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {drafts.map((d, ci) => (
              <div key={ci} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="shrink-0 w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                    {ci + 1}
                  </span>
                  <input
                    value={d.title}
                    onChange={(e) => editChapter(ci, { title: e.target.value })}
                    placeholder={STR.books.chapterName[locale]}
                    className={`${FIELD} py-1.5`}
                  />
                  {drafts.length > 1 && (
                    <RemoveBtn
                      label={STR.books.removeItem[locale]}
                      onClick={() => setDrafts((ds) => ds.filter((_, j) => j !== ci))}
                    />
                  )}
                </div>

                {structure === 'chapters' ? (
                  <TextBox
                    value={d.text}
                    onChange={(v) => editChapter(ci, { text: v })}
                    locale={locale}
                  />
                ) : (
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800">
                    {d.topics.map((t, ti) => (
                      <div key={ti} className="pl-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                            {ci + 1}.{ti + 1}
                          </span>
                          <input
                            value={t.title}
                            onChange={(e) => editTopic(ci, ti, { title: e.target.value })}
                            placeholder={STR.books.topicName[locale]}
                            className={`${FIELD} py-1.5`}
                          />
                          {d.topics.length > 1 && (
                            <RemoveBtn
                              label={STR.books.removeItem[locale]}
                              onClick={() =>
                                editChapter(ci, { topics: d.topics.filter((_, k) => k !== ti) })
                              }
                            />
                          )}
                        </div>
                        <TextBox
                          value={t.text}
                          onChange={(v) => editTopic(ci, ti, { text: v })}
                          locale={locale}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => editChapter(ci, { topics: [...d.topics, newTopic()] })}
                      className="self-start ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.2} aria-hidden />
                      {STR.books.addTopic[locale]}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDrafts((ds) => [...ds, newChapter()])}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden />
            {STR.books.addChapter[locale]}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <span
            className={`text-[11px] ${issue && words > 0 ? 'text-rose-500' : 'text-neutral-400 dark:text-neutral-500'}`}
          >
            {words === 0
              ? ''
              : issue
                ? issueText(issue, locale)
                : `${chapters.length} ${STR.books.chapters[locale]}` +
                  (topics ? ` · ${topics} ${STR.books.topics[locale]}` : '') +
                  ` · ${words} ${STR.books.words[locale]}`}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!!issue}
            className="shrink-0 text-[13px] font-medium bg-neutral-950 text-white px-4 py-1.5 rounded-md shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer"
          >
            {STR.books.save[locale]}
          </button>
        </div>
      </div>
    </div>
  );
}

/* One text area plus its own verdict, so a bad chapter is flagged where it is
   rather than only in the footer. */
function TextBox({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  locale: Locale;
}) {
  const n = wordCount(value);
  const issue = n > 0 ? checkText(value) : null;
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={STR.books.bookText[locale]}
        rows={4}
        className={`${FIELD} resize-y font-mono text-[13px] leading-relaxed`}
      />
      <div className="flex justify-end mt-1">
        <span
          className={`text-[10px] ${issue ? 'text-rose-500' : 'text-neutral-400 dark:text-neutral-500'}`}
        >
          {n === 0 ? '' : issue ? issueText(issue, locale) : `${n} ${STR.books.words[locale]}`}
        </span>
      </div>
    </div>
  );
}

function RemoveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
    >
      <Trash2 size={14} strokeWidth={2} aria-hidden />
    </button>
  );
}

function issueText(issue: TextIssue, locale: Locale): string {
  return issue === 'short' ? STR.books.tooShort[locale] : STR.books.tooRepetitive[locale];
}
