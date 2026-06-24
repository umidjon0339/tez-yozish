'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopBar() {
  const pathname = usePathname();

  // Flawless Decoupling: If the user is inside an active lesson, unmount the Top Bar entirely
  if (pathname?.startsWith('/lesson')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-[#FAFAFA]/80 backdrop-blur-md select-none">
      <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
        
        {/* Left: Stark Architectural Brand Mark */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <span className="font-mono text-[11px] bg-neutral-950 text-white font-bold px-1.5 py-0.5 rounded tracking-tighter group-hover:bg-neutral-700 transition-colors shadow-2xs">
            TY
          </span>
          <span className="font-semibold tracking-tight text-sm text-neutral-950">
            tez<span className="text-neutral-400 font-light">/</span>yozish
          </span>
        </Link>

        {/* Center: System Telemetry */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-500">
          <Link href="/#curriculum" className="hover:text-neutral-950 transition-colors">Modules</Link>
          <a href="#pedagogy" className="hover:text-neutral-950 transition-colors">Pedagogy</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-neutral-950 transition-colors">Architecture</a>
          <span className="text-neutral-200 font-mono">|</span>
          <div className="flex items-center gap-1.5 text-neutral-400 font-mono" title="System Latency: < 12ms">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">99.98% SLA</span>
          </div>
        </div>

        {/* Right: Quick Action / Shortcut Tag */}
        <div className="flex items-center gap-3">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200/80 font-mono text-[10px] text-neutral-500 font-medium">
            <span>⌘</span>
            <span>K</span>
          </kbd>
          
          <Link 
            href="/lesson/1"
            className="h-8 px-3.5 rounded-md bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <span>Workspace</span>
            <span className="text-neutral-400 font-mono">↵</span>
          </Link>
        </div>

      </div>
    </header>
  );
}