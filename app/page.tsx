'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BarChart3, Gamepad2, Keyboard, Languages, Library, Trophy } from 'lucide-react';
import { course } from '@/lib/curriculum';
import { useLocale } from '@/lib/locale';
import { STR } from '@/lib/uiStrings';

/* The hero stage is the real lesson keyboard + hands art (~0.5 MB of path
   data), so it loads as its own chunk after paint instead of weighing down the
   landing page. */
const KeyboardWithHands = dynamic(
  () => import('@/components/keyboard/KeyboardStage').then((m) => m.KeyboardWithHands),
  {
    ssr: false,
    loading: () => <div className="w-full max-w-4xl aspect-[683.3/254] mx-auto rounded-2xl bg-white/[0.02]" />,
  },
);

/* Same layout numbers the lesson runtime starts with, so the hero shows the
   exact stage a learner gets. */
const HERO_LAYOUT = { keyboardScale: 0.85, keyboardY: -25, handsScale: 1.53, handsY: 87 };

/* Home-row drill in the hero: typing it through opens the first lesson. */
const HERO_KEYS = ['f', 'j', 'd', 'k', 's', 'l'] as const;

const CARDS = [
  { href: '/courses/course_core_typing', Icon: Keyboard, title: STR.nav.keyboard, sub: STR.home.cardKeyboard, primary: true },
  { href: '/games', Icon: Gamepad2, title: STR.nav.games, sub: STR.home.cardGames, primary: false },
  { href: '/english', Icon: Languages, title: STR.nav.english, sub: STR.home.cardEnglish, primary: false },
  { href: '/courses', Icon: Library, title: STR.nav.subject, sub: STR.home.cardSubjects, primary: false },
  { href: '/compete', Icon: Trophy, title: STR.nav.compete, sub: STR.home.cardCompete, primary: false },
  { href: '/stats', Icon: BarChart3, title: STR.nav.stats, sub: STR.home.cardStats, primary: false },
];

/* The curriculum is a build-time singleton, so the drill's target lesson is
   known at module scope. */
const FIRST_LESSON_ID =
  course.chapters?.[0]?.sections?.[0]?.lessons?.[0]?.lessonId ?? 'less_01_02';

export default function HomePage() {
  const { locale } = useLocale();
  const router = useRouter();
  // Hero drill state: how far through HERO_KEYS the visitor has typed, plus the
  // last keypress handed to the keyboard for its press/error flash.
  const [typedIndex, setTypedIndex] = useState(0);
  const [lastPress, setLastPress] = useState<{ key: string; isCorrect: boolean; id: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const pressId = useRef(0);

  const launchLesson = useCallback(() => {
    setIsRouting(true);
    router.push(`/lesson/${FIRST_LESSON_ID}`);
  }, [router]);

  const done = typedIndex >= HERO_KEYS.length;
  const expectedKey = done ? null : HERO_KEYS[typedIndex];

  // Typing the drill on the real keyboard drives the hands and, at the end,
  // opens the first lesson — the page teaches its own gesture.
  useEffect(() => {
    if (isRouting || done) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
      if (e.key.length !== 1) return;
      const key = e.key.toLowerCase();
      pressId.current += 1;

      if (key === HERO_KEYS[typedIndex]) {
        setLastPress({ key, isCorrect: true, id: pressId.current });
        const nextIdx = typedIndex + 1;
        setTypedIndex(nextIdx);
        if (nextIdx === HERO_KEYS.length) {
          launchLesson();
        }
      } else {
        setLastPress({ key, isCorrect: false, id: pressId.current });
        setTypedIndex(0); // one typo and the drill starts over
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [typedIndex, isRouting, done, launchLesson]);

  const isWrong = lastPress?.isCorrect === false;

  return (
    <div
      className={`dark relative flex-1 flex flex-col overflow-hidden bg-neutral-950 text-white select-none transition-opacity duration-200 ${
        isRouting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Stage lighting: a cool wash behind the keyboard and a warm horizon
          glow under it, so the hands read against the dark. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[560px] rounded-full bg-indigo-500/14 blur-[120px]" />
        <div className="absolute bottom-[-220px] left-1/2 -translate-x-1/2 w-[1100px] h-[520px] rounded-full bg-fuchsia-600/22 blur-[130px]" />
        <div className="absolute bottom-[-260px] left-[12%] w-[520px] h-[420px] rounded-full bg-teal-500/14 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-transparent to-neutral-950/80" />
      </div>

      <section className="relative flex-1 flex flex-col items-center justify-center w-full px-4 pt-4">
        <h1 className="text-center text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
          {STR.home.titleLine1[locale]}{' '}
          <span className="font-light text-neutral-500">{STR.home.titleLine2[locale]}</span>
        </h1>

        {/* The drill: keycaps left to type, in the same order as the keyboard
            below highlights them. */}
        <div
          key={isWrong ? lastPress?.id : 'steady'}
          className={`flex items-center justify-center gap-2 sm:gap-3 mt-6 ${isWrong ? 'letter-shake' : ''}`}
        >
          {HERO_KEYS.map((k, i) => {
            const isTyped = i < typedIndex;
            const isTarget = i === typedIndex;
            return (
              <span
                key={i}
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg border flex items-center justify-center font-mono text-lg sm:text-2xl font-semibold transition-all duration-150 ${
                  isTyped
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                    : isTarget
                      ? 'bg-white border-white text-neutral-950 scale-105 shadow-[0_0_0_5px_rgba(255,255,255,0.10)]'
                      : 'bg-white/70 border-white/40 text-neutral-800'
                }`}
              >
                {k}
              </span>
            );
          })}
        </div>

        <p className="mt-4 text-[12px] sm:text-[13px] text-neutral-500 text-center">
          {done ? STR.home.typeDone[locale] : STR.home.typeHint[locale]}
        </p>

        {/* Real keycap + hands layers from the lesson runtime. Colorful mode
            stays off so only the next key lights up — the guide finger keeps its
            zone color either way (--fz is set per pose id). */}
        <div className="w-full mt-3">
          <KeyboardWithHands
            expectedKey={expectedKey}
            isDark
            isColorful={false}
            lastPress={lastPress}
            config={HERO_LAYOUT}
            className="max-w-4xl"
          />
        </div>
      </section>

      {/* The wrists run off the bottom of the stage — dissolve them into the
          dark instead of letting them collide with the cards. Sits above the
          hands layer (z-10), below the cards (z-20). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-44 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-transparent"
      />

      {/* Menu cards */}
      <nav className="relative z-20 w-full max-w-5xl mx-auto px-4 pb-8 pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {CARDS.map(({ href, Icon, title, sub, primary }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3.5 backdrop-blur-sm transition-all active:scale-[0.98] cursor-pointer ${
              primary
                ? 'border-pink-400/50 bg-pink-500/[0.09] hover:border-pink-300 hover:bg-pink-500/[0.16]'
                : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]'
            }`}
          >
            {primary && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                {STR.home.startHere[locale]}
              </span>
            )}
            <Icon
              className={`w-6 h-6 mb-0.5 transition-colors ${
                primary ? 'text-pink-300 group-hover:text-pink-200' : 'text-neutral-400 group-hover:text-white'
              }`}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="text-[13px] font-semibold text-neutral-100 text-center leading-tight">
              {title[locale]}
            </span>
            <span className="text-[10.5px] text-neutral-500 text-center leading-tight">
              {sub[locale]}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
