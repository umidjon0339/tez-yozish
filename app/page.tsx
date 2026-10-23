'use client';

// The home page is a typing test, built to the Monkeytype layout: a config bar
// on top, the words under it, and — the one thing the reference does not have —
// our real keycap + hands art underneath, pointing at the next letter.
//
// Everything above the fold has to fit one screen at 1366×768, so the keyboard
// stage is sized from the viewport height (see STAGE_WIDTH) instead of a fixed
// max-width. The menu cards live below the fold and are reached by scrolling.
// See docs/home-test.md.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BarChart3, Gamepad2, Keyboard, Languages, Library, RotateCcw, Trophy } from 'lucide-react';
import { useLocale } from '@/lib/core/locale';
import { useTheme } from '@/lib/core/theme';
import { STR } from '@/lib/core/uiStrings';
import { setTestConfig, useTestConfig } from '@/components/home/testConfig';
import { useTypingTest } from '@/components/home/useTypingTest';
import { TestConfigBar } from '@/components/home/TestConfigBar';
import { TestWords } from '@/components/home/TestWords';
import { TestResult } from '@/components/home/TestResult';

/* The hero stage is the real lesson keyboard + hands art (~0.5 MB of path
   data), so it loads as its own chunk after paint instead of weighing down the
   landing page. */
const KeyboardWithHands = dynamic(
  () => import('@/components/keyboard/KeyboardStage').then((m) => m.KeyboardWithHands),
  {
    ssr: false,
    loading: () => <div className="w-full aspect-[683.3/254] rounded-2xl bg-neutral-950/[0.03] dark:bg-white/[0.02]" />,
  },
);

/* Same keycap size as a lesson: the lesson stage runs 728px wide at 1366x768
   and this one is capped at 736, and both draw the keyboard at ~81% of the
   stage width (0.75 of 970 there, 0.85 of 866 here — different anchors, same
   result). Retuned together with the two constants below. */
const HERO_LAYOUT = { keyboardScale: 0.85, keyboardY: -25, handsScale: 1.53, handsY: 87 };

/* The hands are drawn whole, wrists and all, so the art runs 52% of the stage's
   height *past* the bottom of its box (measured). Reserving all of that is what
   used to hold the keyboard down to 605px — two thirds of a lesson's. So the
   tail now reserves only ~40% of the overhang and the rest is **clipped by the
   hero's `overflow-hidden`**, which is exactly what a lesson page does at its
   footer. The cut lands in the wrists; fingers, knuckles and most of the palm
   stay. Percentage padding resolves against the *width*, so this scales with
   the stage on its own. */
const STAGE_TAIL = '8%'; // 0.215 stage-heights of the 0.52 the art needs

/* On a short window the stage's *width* is capped by the height left over, so
   nothing needs a media query. Two numbers, and they are a pair:
   - `27.9rem` (446px) is everything that is not the stage wrapper at 1366x768:
     the navbar, the page padding, the config bar **at its tallest** (three
     lines in `subject` mode — reserve the common one-line case and picking a
     subject pushes the hands off the screen), the counter, three lines of test
     text and the restart row.
   - `2.21` is the stage's 2.69:1 aspect over the 1.215 stage-heights it now
     occupies with the shortened tail. Change `STAGE_TAIL` and this must change
     with it: 2.69 / (1 + tail x 2.69). */
const STAGE_WIDTH = 'min(100%, 46rem, calc((100dvh - 27.9rem) * 2.21))';

const CARDS = [
  { href: '/courses/course_core_typing', Icon: Keyboard, title: STR.nav.keyboard, sub: STR.home.cardKeyboard, primary: true },
  { href: '/games', Icon: Gamepad2, title: STR.nav.games, sub: STR.home.cardGames, primary: false },
  { href: '/english', Icon: Languages, title: STR.nav.english, sub: STR.home.cardEnglish, primary: false },
  { href: '/courses', Icon: Library, title: STR.nav.subject, sub: STR.home.cardSubjects, primary: false },
  { href: '/compete', Icon: Trophy, title: STR.nav.compete, sub: STR.home.cardCompete, primary: false },
  { href: '/stats', Icon: BarChart3, title: STR.nav.stats, sub: STR.home.cardStats, primary: false },
];

export default function HomePage() {
  const { locale } = useLocale();
  // The hero is one big keyboard stage, so it follows the navbar's theme switch
  // — including the keycap/hands art, which takes the theme as a prop.
  const { isDark } = useTheme();

  const cfg = useTestConfig();

  // The test swallows space and tab, so it only listens while it is actually on
  // screen — once you scroll down to the menu, the page scrolls normally again.
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.intersectionRatio > 0.45),
      { threshold: [0, 0.45, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const test = useTypingTest(cfg, heroVisible);
  const running = test.status === 'running';
  const done = test.status === 'done';

  // The pressing hand needs a stable object or the memo'd art re-renders on
  // every keystroke; only the key itself ever changes here.
  const [lastPress, setLastPress] = useState<{ key: string; isCorrect: boolean; id: number } | null>(null);
  const pressId = useRef(0);
  useEffect(() => {
    if (!heroVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      pressId.current += 1;
      setLastPress({ key: e.key, isCorrect: e.key === test.expectedKey, id: pressId.current });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [test.expectedKey, heroVisible]);

  return (
    <div className="relative flex flex-col bg-[#FAFAFA] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      {/* Stage lighting: a cool wash behind the keyboard and a warm horizon
          glow under it, so the hands read against the backdrop. */}
      {/* `inset-0`, not a fixed height: a `h-screen` wash starts below the
          navbar and so runs 56px past the bottom of the page, which is enough
          to give the result screen a scrollbar it should not have. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-500/8 blur-[120px] dark:bg-indigo-500/14" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[130px] dark:bg-fuchsia-600/22" />
      </div>

      {/* ── above the fold: the test ──
          `overflow-hidden` matters: the hands art deliberately runs past the
          bottom of its stage, and without the clip the wrists would paint over
          the menu section below. */}
      <section
        ref={heroRef}
        /* 3.5rem is the navbar, the 1px is its bottom border — without it the
           result screen sits 1px past the viewport and grows a scrollbar. */
        className="relative flex min-h-[calc(100dvh-3.5rem-1px)] flex-col items-center overflow-hidden px-4 pb-3 pt-4"
      >
        {/* Unmounted on the result screen, not just faded: in `subject` mode
            the bar is three lines tall, and an invisible 103px of it above the
            result is enough to push the page past one screen. */}
        {!done && <TestConfigBar cfg={cfg} onChange={setTestConfig} hidden={running} />}

        {done && test.result ? (
          /* The result stands alone. No keyboard, no scroll hint, no menu —
             nothing to read except the numbers you just earned. */
          /* Wider than the test itself: the result is two columns of its own
             (podium next to the speed map) and they need the room. */
          <div className="flex w-full max-w-5xl flex-1 flex-col justify-center py-4">
            <TestResult result={test.result} onNext={test.restart} onRepeat={test.repeat} />
          </div>
        ) : (
          <>
            <div className="mt-6 flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
              {/* the live counter: seconds left, or words done */}
              <div className="mb-1 w-full font-mono text-2xl leading-none text-neutral-500 dark:text-neutral-400">
                {test.progressLabel}
              </div>
              <TestWords
                words={test.words}
                typed={test.typed}
                input={test.input}
                wordIdx={test.wordIdx}
              />
              <div className="mt-4 flex h-8 items-center gap-3">
                <button
                  type="button"
                  onClick={test.restart}
                  title={STR.test.hintRestart[locale]}
                  aria-label={STR.test.hintRestart[locale]}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-950/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="font-mono text-[11px] text-neutral-400">
                  {running ? STR.test.hintRestart[locale] : STR.test.hintStart[locale]}
                </span>
              </div>
            </div>

            {/* Real keycap + hands layers from the lesson runtime, pointing at
                the next letter of the test. The inner padding is the room the
                wrists need below the stage — see STAGE_TAIL. */}
            <div className="mt-2 w-full" style={{ width: STAGE_WIDTH }}>
              <div style={{ paddingBottom: STAGE_TAIL }}>
                <KeyboardWithHands
                  expectedKey={test.expectedKey}
                  isDark={isDark}
                  /* Always on here. The lessons make this a toggle because a
                     learner drilling one row wants the rest of the board quiet;
                     the hero has no such job — the tinted keycaps are what show
                     a first-time visitor that fingers own zones. Colours are the
                     app's own finger-zone palette (`--fz-*`, app/globals.css),
                     so the keyboard matches the lessons and follows the
                     PaletteSwitcher's theme. */
                  isColorful
                  lastPress={lastPress}
                  config={HERO_LAYOUT}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── below the fold: everything else in the app. Hidden on the result
          screen, which is meant to be the only thing on the page. ── */}
      {!done && (
      <section id="menu" className="relative w-full border-t border-neutral-200/70 bg-white/40 px-4 py-12 dark:border-white/10 dark:bg-white/[0.02]">
        <h2 className="mb-6 text-center text-lg font-semibold tracking-tight">
          {STR.home.menuTitle[locale]}
        </h2>
        <nav className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
          {CARDS.map(({ href, Icon, title, sub, primary }) => (
            <Link
              key={href}
              href={href}
              className={`group relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-3.5 backdrop-blur-sm transition-all active:scale-[0.98] ${
                primary
                  ? 'border-pink-400/60 bg-pink-500/[0.07] hover:border-pink-400 hover:bg-pink-500/[0.13] dark:border-pink-400/50 dark:bg-pink-500/[0.09] dark:hover:border-pink-300 dark:hover:bg-pink-500/[0.16]'
                  : 'border-neutral-200 bg-white/70 hover:border-neutral-400 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25 dark:hover:bg-white/[0.07]'
              }`}
            >
              {primary && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {STR.home.startHere[locale]}
                </span>
              )}
              <Icon
                className={`mb-0.5 h-6 w-6 transition-colors ${
                  primary
                    ? 'text-pink-500 group-hover:text-pink-600 dark:text-pink-300 dark:group-hover:text-pink-200'
                    : 'text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                }`}
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="text-center text-[13px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
                {title[locale]}
              </span>
              <span className="text-center text-[10.5px] leading-tight text-neutral-500">
                {sub[locale]}
              </span>
            </Link>
          ))}
        </nav>
      </section>
      )}
    </div>
  );
}
