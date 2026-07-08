'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { course } from '@/lib/curriculum';

const IGNITION_WORD = 'tez';

export default function HomePage() {
  const router = useRouter();
  const lessons = course.chapters?.flatMap(c => c.sections || []).flatMap(s => s.lessons || []) || [];

  // Interactive Hero "t-e-z" secret trigger state
  const [typedIndex, setTypedIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);

  const launchLesson = useCallback((lessonId: string | number) => {
    setIsRouting(true);
    router.push(`/lesson/${lessonId}`);
  }, [router]);

  // Global key listener for the "t - e - z" typist launch hook
  useEffect(() => {
    if (isRouting) return;

    const handleGlobalTyping = (e: KeyboardEvent) => {
      const expectedChar = IGNITION_WORD[typedIndex];
      if (e.key.toLowerCase() === expectedChar) {
        const nextIdx = typedIndex + 1;
        setTypedIndex(nextIdx);
        
        if (nextIdx === IGNITION_WORD.length) {
          launchLesson(lessons[0]?.lessonId || "less_01_02");
        }
      } else if (e.key.length === 1) {
        setTypedIndex(0); // Reset lock on typo
      }
    };

    window.addEventListener('keydown', handleGlobalTyping);
    return () => window.removeEventListener('keydown', handleGlobalTyping);
  }, [typedIndex, isRouting, lessons, launchLesson]);

  return (
    <div className={`flex-1 flex flex-col bg-[#FAFAFA] text-neutral-950 font-sans selection:bg-neutral-950 selection:text-white transition-opacity duration-200 ${isRouting ? 'opacity-0' : 'opacity-100'} h-full justify-center`}>
      
      {/* ─── STARK ARCHITECTURAL HERO ─── */}
      <section className="px-6 max-w-4xl mx-auto text-center flex flex-col items-center justify-center select-none w-full flex-1">
        
        {/* The Live "t e z" visual acquisition target */}
        <div className="flex items-center justify-center gap-2 font-mono text-6xl sm:text-8xl font-light tracking-widest text-neutral-300 mb-6">
          <span>[</span>
          {IGNITION_WORD.split('').map((char, i) => {
            const isTyped = i < typedIndex;
            const isTarget = i === typedIndex;
            return (
              <span 
                key={i} 
                className={`transition-all duration-100 ${
                  isTyped ? 'text-neutral-950 font-bold scale-110' : 
                  isTarget ? 'text-neutral-900 underline decoration-2 underline-offset-8 animate-pulse' : 'text-neutral-300'
                }`}
              >
                {char}
              </span>
            );
          })}
          <span>]</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-neutral-950 leading-[1.08] mb-6">
          Type with your reflexes.<br />
          <span className="font-light text-neutral-400">Execute with your mind.</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-500 max-w-lg mb-10 leading-relaxed font-normal">
          Master touch typing through subconscious muscle memory. Put your mouse away, rest your index fingers on <kbd className="font-mono font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded shadow-sm">F</kbd> and <kbd className="font-mono font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded shadow-sm">J</kbd>, and strike.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Link 
            href="/courses"
            className="group inline-flex items-center gap-3 bg-neutral-950 hover:bg-neutral-800 text-white text-[13px] font-medium px-8 py-3.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
          >
            <span>Explore Courses</span>
            <span className="text-neutral-400 font-mono group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link 
            href="/games"
            className="group inline-flex items-center gap-3 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-950 text-[13px] font-medium px-8 py-3.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
          >
            <span>Play Games</span>
            <span className="text-neutral-400 font-mono group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

      </section>

    </div>
  );
}
