import React from 'react';
import Link from 'next/link';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';

export default function GamesPage() {
  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-screen pt-24 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">Training Arenas</h1>
        <p className="text-base text-neutral-500 mb-12">Put your muscle memory to the test in pressure environments.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/typing-ninja" className="group bg-white border border-neutral-200 hover:border-neutral-400 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden">
            <div className="w-full aspect-[16/9] bg-neutral-950 relative overflow-hidden flex items-center justify-center">
              <DynamicThumbnail svgId="NINJA_ARENA_COVER" params={{ enemyCount: 14, accentColor: 'red' }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:translate-x-1 transition-transform">Typing Ninja: Survival</h2>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Defend yourself against an endless wave of ninja attackers. Type the words floating above their heads to strike them down.
              </p>
              <div className="font-mono text-xs font-bold text-neutral-950 uppercase tracking-widest">
                Play Game →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
