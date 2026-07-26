"use client";

// Single-lesson workspace for the phonemes unit — mounted by
// /english/phonemes/[phoneme]/[lesson], the phoneme analogue of
// LetterLessonRunner. One URL = one lesson (found in lib/phonemeCurriculum.ts
// by id); the runner mounts the stage for the lesson's `kind`
// (components/phonemes/stages/), grades the run with the course star formula
// (computeLessonResult) and persists it under the phoneme-lesson progress
// key (tz-phonemes-v1).
//
// The workspace chrome (full-screen arena, tz-prefs-v1 toggles, StageScaler,
// focus mode) is the lesson runtime's — module-local copies, as the lesson
// engine keeps its own. Only the gym stages (TYPE/HEAR) are speed-graded;
// every choice/game stage grades accuracy-only (targetWpm 0). The NINJA
// stage mounts outside the StageScaler (WebGL canvas must not be
// scale-transformed).

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  Home,
  Keyboard as KeyboardIcon,
  Moon,
  RotateCcw,
  Star,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { PHONEMES, type PhonemeInfo } from "@/lib/phonemes";
import {
  hearWordsForPhoneme,
  typingWordsForPhoneme,
} from "@/lib/allophones";
import { speakWord } from "@/lib/phonemeAudio";
import { computeLessonResult, type LessonResult } from "@/lib/progress";
import {
  PASS_ACCURACY,
  PHONEME_TRACK,
  phonemeHubHref,
  phonemeLessonHref,
  phonemeLessonKey,
  phonemeLessonsFor,
  type PhonemeLesson,
  type PhonemeLessonKind,
} from "@/lib/phonemeCurriculum";
import { LESSON_TYPES } from "@/lib/lessonTypes";
import {
  phonemeDone,
  savePhonemeLessonResult,
  usePhonemeProgress,
  type PhonemeProgressMap,
} from "@/lib/phonemeProgress";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { loadSfx, type StageStats } from "@/components/english/stage-kit";
import { GymStage } from "@/components/english/GymStage";
import { MeetStage } from "./stages/MeetStage";
import { ShadesStage } from "./stages/ShadesStage";
import { ShadeStage } from "./stages/ShadeStage";
import { SpellStage } from "./stages/SpellStage";
import { PairsStage } from "./stages/PairsStage";
import { MasterStage } from "./stages/MasterStage";
import { RainStage } from "./stages/RainStage";
import { NinjaStage } from "./stages/NinjaStage";

const P = STR.phonemes;
const L = STR.letters;

/** Kinds where speed makes sense — everything else grades accuracy-only. */
const SPEED_GRADED: PhonemeLessonKind[] = ["TYPE", "HEAR"];

/* ── Stage scaler (copied from the lesson runtime) ───────────────────── */
const STAGE_W = 1100;
const STAGE_H = 780;

function StageScaler({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H, 1.15));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
    >
      <div
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        className="flex flex-col items-center shrink-0"
      >
        {children}
      </div>
    </div>
  );
}

/* ── Left rail: all 50 sounds, linking to their hubs ─────────────────── */
function PhonemesRail({
  current,
  dimmed,
  progress,
}: {
  current: string;
  dimmed: boolean;
  progress: PhonemeProgressMap;
}) {
  return (
    <nav
      className={`hidden sm:flex flex-col items-center gap-0.5 py-2 px-2 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden shrink-0 transition-opacity duration-500 ${dimmed ? "opacity-30" : "opacity-100"}`}
    >
      {PHONEMES.map((p) => {
        const isCur = p.slug === current;
        const done = phonemeDone(progress, p.slug);
        return (
          <Link
            key={p.slug}
            href={phonemeHubHref(p.slug)}
            title={`/${p.symbol}/`}
            className={[
              "relative min-w-8 h-7 px-1 shrink-0 rounded-md font-mono text-[11px] font-bold flex items-center justify-center whitespace-nowrap transition-colors",
              isCur
                ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-900"
                : done
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-neutral-800",
            ].join(" ")}
          >
            {p.symbol}
            {done && !isCur && (
              <span
                aria-hidden
                className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── The runner ──────────────────────────────────────────────────────── */
export function PhonemeLessonRunner({
  info,
  lesson,
}: {
  info: PhonemeInfo;
  lesson: PhonemeLesson;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const phonemeProgress = usePhonemeProgress();
  const slug = info.slug;
  const graded = LESSON_TYPES[lesson.type].graded;

  // Workspace prefs — same tz-prefs-v1 contract as the lesson runtime.
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(false);
  const [isHandsVisible, setIsHandsVisible] = useState(true);
  const prefsLoaded = useRef(false);

  // Hydration-safe localStorage load (same pattern as the lesson runtime).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem("tz-prefs-v1");
      if (rawPrefs) {
        const p = JSON.parse(rawPrefs);
        if (typeof p.dark === "boolean") setIsDark(p.dark);
        if (typeof p.audio === "boolean") setIsAudioEnabled(p.audio);
        if (typeof p.colorful === "boolean") setIsColorful(p.colorful);
        if (typeof p.hands === "boolean") setIsHandsVisible(p.hands);
      }
    } catch {}
    prefsLoaded.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!prefsLoaded.current) return;
    try {
      localStorage.setItem(
        "tz-prefs-v1",
        JSON.stringify({
          dark: isDark,
          audio: isAudioEnabled,
          colorful: isColorful,
          hands: isHandsVisible,
        }),
      );
    } catch {}
  }, [isDark, isAudioEnabled, isColorful, isHandsVisible]);

  // Focus mode — typing fades the chrome, pointer movement restores it.
  const [isFocusMode, setIsFocusMode] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsFocusMode(true);
      }
    };
    const onMove = () => setIsFocusMode(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    loadSfx("/press_key4.mp3");
    loadSfx("/error2.mp3");
  }, []);

  // ── Run engine: one stage per lesson ──
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const currentWord = useRef("");

  const progressKey = phonemeLessonKey(slug, lesson.id);
  const lessons = phonemeLessonsFor(slug);

  // Next implemented lesson in authored order; the hub when this is the last.
  const implemented = lessons.filter((l) => l.implemented);
  const myIdx = implemented.findIndex((l) => l.id === lesson.id);
  const nextLesson = myIdx >= 0 ? implemented[myIdx + 1] : undefined;
  const hubHref = phonemeHubHref(slug);
  const nextHref = nextLesson
    ? phonemeLessonHref(slug, nextLesson.id)
    : hubHref;

  const speedGraded = SPEED_GRADED.includes(lesson.kind);

  // Plain functions + latest-callback ref (the grapheme-runner idiom):
  // React Compiler rejects manual useCallback over the cached lesson list.
  const finish = (stats: StageStats | null) => {
    const targetWpm = speedGraded ? PHONEME_TRACK.targetWpm : 0;
    const res: LessonResult = stats
      ? computeLessonResult({ ...stats, skippedSteps: 0 }, targetWpm)
      : {
          stars: 0,
          wpm: 0,
          accuracy: 100,
          mistakes: 0,
          timeMs: 0,
          hardestKey: null,
          skipped: false,
        };
    savePhonemeLessonResult(progressKey, res);
    setResult(res);
  };

  const retry = () => {
    setResult(null);
    setRunId((r) => r + 1);
  };

  const goNext = () => {
    router.push(nextHref);
  };

  // The pass gate: graded lessons unlock the next one at PASS_ACCURACY.
  const passed =
    !!result && (!graded || result.accuracy >= PASS_ACCURACY);

  // Results keyboard: Enter → continue when passed, retry when not.
  const resultsKeyRef = useRef({ passed, goNext, retry });
  useEffect(() => {
    resultsKeyRef.current = { passed, goNext, retry };
  });
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      const h = resultsKeyRef.current;
      if (e.key === "Enter") {
        e.preventDefault();
        if (h.passed) h.goNext();
        else h.retry();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        h.retry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  const chromeCls = isFocusMode ? "opacity-30" : "opacity-100";
  const gymCommon = { isDark, isColorful, isAudioEnabled, isHandsVisible };
  const choiceCommon = { info, locale, isAudioEnabled, onDone: finish };

  const myLessonIdx = lessons.findIndex((l) => l.id === lesson.id);

  const stageKey = `${slug}-${lesson.id}-${runId}`;

  const renderStage = () => {
    switch (lesson.kind) {
      case "MEET":
        return (
          <MeetStage info={info} locale={locale} onDone={() => finish(null)} />
        );
      case "SHADES":
        return (
          <ShadesStage info={info} locale={locale} onDone={() => finish(null)} />
        );
      case "SHADE":
        return (
          <ShadeStage
            info={info}
            shadeIndex={lesson.shadeIndex ?? 0}
            locale={locale}
            {...gymCommon}
            onDone={finish}
          />
        );
      case "TYPE":
        return (
          <GymStage
            text={typingWordsForPhoneme(info).join(" ")}
            header={
              <div className="flex items-center gap-3 font-mono text-2xl font-bold text-neutral-400">
                /{info.symbol}/
                <button
                  type="button"
                  onClick={() => speakWord(currentWord.current)}
                  title={L.playAgain[locale]}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            }
            {...gymCommon}
            onWordStart={(w) => {
              currentWord.current = w;
            }}
            onDone={finish}
          />
        );
      case "HEAR":
        return (
          <GymStage
            text={hearWordsForPhoneme(info).join(" ")}
            hidden
            header={
              <button
                type="button"
                onClick={() => speakWord(currentWord.current)}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {L.playAgain[locale]}
              </button>
            }
            {...gymCommon}
            onWordStart={(w) => {
              currentWord.current = w;
              speakWord(w);
            }}
            onDone={finish}
          />
        );
      case "SPELL":
        return <SpellStage {...choiceCommon} />;
      case "PAIRS":
        return <PairsStage {...choiceCommon} />;
      case "MASTER":
        return <MasterStage {...choiceCommon} />;
      case "RAIN":
        return <RainStage {...choiceCommon} />;
      default:
        return null;
    }
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col select-none">
        {/* ─── header (lesson-style) ─── */}
        <header
          className={`flex-shrink-0 w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 transition-all duration-500 ${chromeCls}`}
        >
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title={STR.notFound.home[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md -ml-2"
            >
              <Home size={19} strokeWidth={2} />
            </Link>
            <Link
              href={hubHref}
              title={L.allLessons[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="flex flex-col ml-2">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white leading-tight">
                /{info.symbol}/ — {lesson.title[locale]}
              </h1>
              <span className="text-[10px] md:text-xs text-neutral-400 font-medium">
                {P.title[locale]} · {LESSON_TYPES[lesson.type].label[locale]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            <button
              onClick={() => setIsColorful(!isColorful)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isColorful ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isColorful}
            >
              <KeyboardIcon size={19} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsHandsVisible(!isHandsVisible)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isHandsVisible ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isHandsVisible}
            >
              <Hand size={19} strokeWidth={2} />
            </button>
            <PaletteSwitcher onSelect={() => setIsColorful(true)} />
            <span
              className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800"
              aria-hidden="true"
            />
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isAudioEnabled ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isAudioEnabled}
            >
              {isAudioEnabled ? (
                <Volume2 size={19} strokeWidth={2} />
              ) : (
                <VolumeX size={19} strokeWidth={2} />
              )}
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isDark ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isDark}
            >
              {isDark ? (
                <Sun size={19} strokeWidth={2} />
              ) : (
                <Moon size={19} strokeWidth={2} />
              )}
            </button>
            <span
              className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800"
              aria-hidden="true"
            />
            <LanguageSwitcher />
          </div>
        </header>

        {/* ─── workspace ─── */}
        <div className="flex flex-1 overflow-hidden relative">
          <PhonemesRail
            current={slug}
            dimmed={isFocusMode}
            progress={phonemeProgress}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <main className="flex-1 min-h-0 w-full relative flex flex-col">
              {result ? (
                /* ─── results ─── */
                <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500 px-6">
                  {graded ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-10 h-10 ${n <= result.stars ? "text-amber-400 fill-amber-400" : "text-neutral-200 dark:text-neutral-700"}`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                      <Check className="w-10 h-10 text-white" strokeWidth={3.5} />
                    </div>
                  )}
                  <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {passed ? L.greatJob[locale] : P.almostTitle[locale]}
                  </p>
                  {!passed && (
                    <p className="text-[14px] text-neutral-500 dark:text-neutral-400 -mt-2">
                      {P.needAccuracy[locale].replace(
                        "{n}",
                        String(PASS_ACCURACY),
                      )}
                    </p>
                  )}
                  {result.timeMs > 0 && (
                    <div className="flex items-center justify-center gap-10">
                      {[
                        // WPM is only meaningful for the speed-graded gym
                        // stages — accuracy + mistakes elsewhere.
                        ...(speedGraded
                          ? [
                              {
                                label: STR.stats.avgWpm[locale],
                                value: `${result.wpm}`,
                                unit: STR.stats.wpmUnit[locale],
                              },
                            ]
                          : []),
                        {
                          label: STR.compete.colAccuracy[locale],
                          value: `${result.accuracy}`,
                          unit: "%",
                        },
                        {
                          label: STR.stats.errors[locale],
                          value: String(result.mistakes),
                          unit: "",
                        },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
                            {s.value}
                            <span className="text-base text-neutral-400 ml-1">
                              {s.unit}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.hardestKey && (
                    <p className="text-[13px] text-neutral-500">
                      {STR.stats.trickyKey[locale]}:{" "}
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {result.hardestKey}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    {passed ? (
                      <>
                        <button
                          type="button"
                          onClick={retry}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-md px-3.5 py-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {STR.compete.retry[locale]}
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3.5 py-1.5 rounded-md transition-colors shadow-sm active:scale-95 cursor-pointer"
                        >
                          {nextLesson
                            ? `${L.nextLessonBtn[locale]}: ${nextLesson.title[locale]}`
                            : L.allLessons[locale]}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={hubHref}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-md px-3.5 py-1.5 transition-colors cursor-pointer"
                        >
                          {L.allLessons[locale]}
                        </Link>
                        <button
                          type="button"
                          onClick={retry}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3.5 py-1.5 rounded-md transition-colors shadow-sm active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {STR.compete.retry[locale]}
                        </button>
                      </>
                    )}
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                    {passed
                      ? `${L.pressEnterContinue[locale]} · ${L.pressRRetry[locale]}`
                      : L.pressRRetry[locale]}
                  </p>
                </div>
              ) : lesson.kind === "NINJA" ? (
                /* WebGL canvas — full-bleed, never scale-transformed */
                <NinjaStage
                  key={stageKey}
                  info={info}
                  locale={locale}
                  onDone={finish}
                />
              ) : (
                <StageScaler>
                  <div
                    key={stageKey}
                    className="relative flex-1 min-h-0 flex flex-col items-center justify-between gap-6 w-full max-w-4xl mx-auto select-none pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    {renderStage()}
                  </div>
                </StageScaler>
              )}
            </main>

            {/* ─── footer: hub link / lesson segments / next lesson ─── */}
            <footer
              className={`flex-shrink-0 w-full py-4 sm:py-5 px-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-500 z-20 flex items-center justify-between ${chromeCls}`}
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full gap-6">
                <Link
                  href={hubHref}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  ← {L.allLessons[locale]}
                </Link>
                <div
                  className="flex items-center gap-1.5 w-72 max-w-full"
                  aria-label={lesson.title[locale]}
                >
                  {lessons.map((l, i) => {
                    const passed =
                      phonemeProgress[phonemeLessonKey(slug, l.id)]?.completed;
                    return (
                      <div
                        key={l.id}
                        title={l.title[locale]}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i === myLessonIdx
                            ? result
                              ? "bg-emerald-500"
                              : "bg-neutral-950 dark:bg-white animate-pulse"
                            : passed
                              ? "bg-emerald-500"
                              : "bg-neutral-200 dark:bg-neutral-800"
                        }`}
                      />
                    );
                  })}
                </div>
                <Link
                  href={nextHref}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {nextLesson ? nextLesson.title[locale] : L.allLessons[locale]}{" "}
                  →
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
