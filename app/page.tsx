'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import lessonsData from '@/data/lessons.json';
import { Lesson, StageIntro } from '@/types/lesson';

const IGNITION_WORD = 'tez';

export default function HomePage() {
  const router = useRouter();
  const lessons = lessonsData as Lesson[];

  // Interactive Hero "t-e-z" secret trigger state
  const [typedIndex, setTypedIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);

  const launchLesson = useCallback((lessonId: string | number) => {
    setIsRouting(true);
    setTimeout(() => {
      router.push(`/lesson/${lessonId}`);
    }, 150);
  }, [router]);

  // Global key listener for the "t - e - z" typist launch hook
  useEffect(() => {
    if (isRouting) return;

    const handleGlobalTyping = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        launchLesson(lessons[0]?.id || 1);
        return;
      }

      const expectedChar = IGNITION_WORD[typedIndex];
      if (e.key.toLowerCase() === expectedChar) {
        const nextIdx = typedIndex + 1;
        setTypedIndex(nextIdx);
        
        if (nextIdx === IGNITION_WORD.length) {
          launchLesson(lessons[0]?.id || 1);
        }
      } else if (e.key.length === 1) {
        setTypedIndex(0); // Reset lock on typo
      }
    };

    window.addEventListener('keydown', handleGlobalTyping);
    return () => window.removeEventListener('keydown', handleGlobalTyping);
  }, [typedIndex, isRouting, lessons, launchLesson]);

  return (
    <div className={`flex-1 flex flex-col bg-[#FAFAFA] text-neutral-950 font-sans selection:bg-neutral-950 selection:text-white transition-opacity duration-200 ${isRouting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* ─── STARK ARCHITECTURAL HERO ─── */}
      <section className="pt-24 pb-20 px-6 max-w-4xl mx-auto text-center flex flex-col items-center select-none">
        
        {/* Vercel Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-neutral-200/80 text-neutral-600 text-xs font-mono mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>v2.0-tactile-engine operational</span>
        </div>

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
          Master touch typing through subconscious muscle memory. Put your mouse away, rest your index fingers on <kbd className="font-mono font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded shadow-2xs">F</kbd> and <kbd className="font-mono font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded shadow-2xs">J</kbd>, and strike.
        </p>

        <button 
          onClick={() => launchLesson(lessons[0]?.id || 1)}
          className="group inline-flex items-center gap-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-wider font-semibold px-7 py-3.5 rounded-lg shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <span>Start Module 01: Foundations</span>
          <span className="text-neutral-400 font-mono group-hover:translate-x-0.5 transition-transform">↵</span>
        </button>

      </section>

      {/* ─── NOTION BENTO-GRID CURRICULUM Index ─── */}
      <section id="curriculum" className="max-w-5xl mx-auto px-6 pb-32 w-full flex-1">
        
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-200 text-xs font-mono uppercase text-neutral-400 tracking-wider">
          <span>Curriculum Index</span>
          <span>{lessons.length} Modules Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map((lesson) => {
            const rawKeys = Array.from(
              new Set(lesson.stages.filter((s): s is StageIntro => s.type === 'intro').map(s => s.targetKey))
            );

            return (
              <div 
                key={lesson.id}
                onClick={() => launchLesson(lesson.id)}
                className="group bg-white border border-neutral-200/80 hover:border-neutral-950 rounded-xl p-6 shadow-2xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded border border-neutral-200/60">
                      {lesson.difficulty}
                    </span>
                    <span className="font-mono text-neutral-400">{lesson.estimatedMinutes}m</span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-950 group-hover:translate-x-0.5 transition-transform mb-1.5 tracking-tight">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed font-normal">
                    {lesson.subtitle}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                  
                  {/* Notion Crisp Keycaps */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {rawKeys.map((k, idx) => (
                      <kbd 
                        key={idx} 
                        className="min-w-[20px] h-5 px-1 inline-flex items-center justify-center font-mono text-[10px] font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200 border-b-2 uppercase shadow-2xs"
                      >
                        {k === ' ' ? '␣' : k}
                      </kbd>
                    ))}
                  </div>

                  <span className="text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-950 transition-colors">
                    Enter ↵
                  </span>

                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* STARK FOOTER */}
      <footer className="w-full border-t border-neutral-200 bg-white py-8 px-6 text-center text-xs font-mono text-neutral-400 mt-auto">
        tez/yozish // v2.0-tactile-engine
      </footer>

    </div>
  );
}



