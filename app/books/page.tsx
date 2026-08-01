'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useBooks, bookLeaves } from '@/lib/books';
import { BookDialog } from '@/components/books/BookDialog';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';
const CARD =
  'group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer';

export default function BooksPage() {
  const { locale } = useLocale();
  const { books } = useBooks();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-950 dark:text-white min-h-screen pt-10 px-6">
      <div className="max-w-5xl mx-auto w-full pb-32">
        {/* The action sits in the header, not as a trailing tile: adding a book
            is a page-level action, and a dashed card in the grid reads as one
            more book to open. */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-1">
              {STR.books.title[locale]}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {STR.books.desc[locale]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium bg-neutral-950 text-white px-3.5 py-2 rounded-md shadow-sm transition-colors hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.4} aria-hidden />
            {STR.books.add[locale]}
          </button>
        </div>

        <div className={GRID}>
          {books.map((book) => (
            <Link key={book.bookId} href={`/books/${book.bookId}`} className={CARD}>
              <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                <DynamicThumbnail
                  svgId="BOOK_COVER"
                  params={{ tone: book.tone }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-800 py-2.5 px-3 bg-white dark:bg-neutral-900 flex flex-col min-h-13 justify-center">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2">
                  {book.title[locale]}
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {book.chapters.length} {STR.books.chapters[locale]}
                  {bookLeaves(book).length > book.chapters.length &&
                    ` · ${bookLeaves(book).length} ${STR.books.topics[locale]}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {adding && <BookDialog onClose={() => setAdding(false)} />}
    </div>
  );
}
