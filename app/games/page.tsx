'use client';

import React from 'react';
import Link from 'next/link';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';

export default function GamesPage() {
  const { locale } = useLocale();
  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-screen pt-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-8">{STR.games.title[locale]}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/beam-break">
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                <DynamicThumbnail
                  svgId="BEAM_BREAK_COVER"
                  params={{ keys: ['b', 'e', 'a', 'm'], accentColor: 'emerald' }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col items-center justify-center min-h-[72px]">
                <h4 className="text-lg font-bold text-neutral-900 truncate text-center">Beam Break</h4>
              </div>
            </div>
          </Link>

          <Link href="/typing-ninja">
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                <DynamicThumbnail
                  svgId="NINJA_ARENA_COVER"
                  params={{ enemyCount: 14, accentColor: 'red' }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col items-center justify-center min-h-[72px]">
                <h4 className="text-lg font-bold text-neutral-900 truncate text-center">Ninja Run</h4>
              </div>
            </div>
          </Link>

          <Link href="/tug-of-typing">
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                <DynamicThumbnail
                  svgId="TUG_OF_TYPING_COVER"
                  params={{ keys: ['p', 'u', 'l', 'l'], accentColor: 'emerald' }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col items-center justify-center min-h-[72px]">
                <h4 className="text-lg font-bold text-neutral-900 truncate text-center">Tug of Typing</h4>
              </div>
            </div>
          </Link>

          <Link href="/sky-hop">
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                <DynamicThumbnail
                  svgId="SKY_HOP_COVER"
                  params={{ keys: ['f', 'j', 'd', 'k'], accentColor: 'blue' }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col items-center justify-center min-h-[72px]">
                <h4 className="text-lg font-bold text-neutral-900 truncate text-center">Sky Hop</h4>
              </div>
            </div>
          </Link>

          <Link href="/rhino-dash">
            <div className="group bg-white border border-neutral-200 rounded-lg shadow-sm transition-all flex flex-col overflow-hidden relative hover:border-neutral-400 hover:shadow-md cursor-pointer">
              <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
                <DynamicThumbnail
                  svgId="RHINO_DASH_COVER"
                  params={{ keys: ['d', 'a', 's', 'h'], accentColor: 'amber' }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="border-t border-neutral-100 py-3 px-4 bg-white flex flex-col items-center justify-center min-h-[72px]">
                <h4 className="text-lg font-bold text-neutral-900 truncate text-center">Rhino Dash</h4>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
