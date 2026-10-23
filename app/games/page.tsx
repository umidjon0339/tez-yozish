'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Heart } from 'lucide-react';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/core/locale';
import { STR } from '@/lib/core/uiStrings';
import { formatCount, useGameCounters } from '@/lib/catalog/gameStats';
import { GAMES } from '@/lib/catalog/games';

export default function GamesPage() {
  const { locale } = useLocale();
  const { views, liked, toggleLike } = useGameCounters();

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-10 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-8">{STR.games.title[locale]}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-16">
          {GAMES.map((g) => {
            const isLiked = !!liked[g.slug];
            return (
              <Link key={g.slug} href={`/${g.slug}`}>
                <div className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer">
                  <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                    <DynamicThumbnail
                      svgId={g.svgId}
                      params={g.params}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 py-3 px-4 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 min-h-[72px]">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">{g.name}</h4>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* the heart lives inside the card link, so it has to
                          stop the click from navigating to the game */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleLike(g.slug);
                        }}
                        aria-pressed={isLiked}
                        aria-label={STR.games.like[locale]}
                        title={STR.games.like[locale]}
                        className={`flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1.5 text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                          isLiked
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70'
                            : 'text-neutral-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Heart
                          size={15}
                          strokeWidth={2.4}
                          className={`transition-transform ${isLiked ? 'fill-current scale-110' : ''}`}
                        />
                        {formatCount(isLiked ? 1 : 0)}
                      </button>

                      <span
                        title={STR.games.plays[locale]}
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold tabular-nums text-neutral-400 dark:text-neutral-500"
                      >
                        <Eye size={15} strokeWidth={2.4} />
                        {formatCount(views[g.slug] ?? 0)}
                        <span className="sr-only">{STR.games.plays[locale]}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
