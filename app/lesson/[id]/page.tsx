"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { course as courseData } from "@/lib/typing/curriculum";
import { SectionNode, LessonNode } from "@/types/lesson";
import { HandStyleSwitcher } from "@/components/keyboard/HandStyleSwitcher";
import type { LayoutConfig } from "@/components/keyboard/KeyboardStage";
import { Mascot } from "@/components/Mascot";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";
import { ChapterRail, LessonRail } from "@/components/lesson/Rails";
import {
  StepStats,
  LessonRunStats,
  LessonResult,
  ProgressMap,
  computeLessonResult,
  computeUnlocked,
  saveLessonResult,
  getProgress,
} from "@/lib/typing/progress";
import { isGradedType } from "@/lib/typing/lessonTypes";
import { recordAttempt } from "@/lib/typing/stats";
import { useLocale } from "@/lib/core/locale";
import { useTheme } from "@/lib/core/theme";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Home,
  ChevronLeft,
  Keyboard as KeyboardIcon,
  Hand,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { UI } from "./ui";
import { StageScaler } from "./StageScaler";
import { preloadSfx } from "./sfx";
import { PostureCheck } from "./viewports/PostureCheck";
import { KeyIntro } from "./viewports/KeyIntro";
import { PracticeTracker } from "./viewports/PracticeTracker";
import { ChatSim } from "./viewports/ChatSim";
import { ShortcutDojo } from "./viewports/ShortcutDojo";

const emptyRun = (): LessonRunStats => ({
  correct: 0,
  mistakes: 0,
  timeMs: 0,
  perKeyMistakes: {},
  skippedSteps: 0,
});

// Mini keyboard layout for the results-screen error heatmap
const HEATMAP_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// Deterministic celebration burst (no randomness → hydration-safe)
const BURST_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = i % 2 === 0 ? 115 : 82;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist * 0.75),
    delay: i * 30,
    char: i % 3 === 0 ? "★" : i % 3 === 1 ? "✦" : "●",
    color: i % 3 === 0 ? "#F59E0B" : i % 3 === 1 ? "#10B981" : "#D4D4D4",
  };
});

const NinjaWorld = dynamic(() => import("@/app/games/typing-ninja/NinjaWorld"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
      <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-200 rounded-full animate-spin" />
      <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
        Loading game…
      </p>
    </div>
  ),
});

// ─── MASTER ARENA CONTROLLER ───
export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();

  const course = courseData;

  const { lesson, currentSection, nextLesson } = useMemo(() => {
    let lesson: LessonNode | null = null;
    let currentSection: SectionNode | null = null;

    for (const chapter of course.chapters || []) {
      for (const section of chapter.sections || []) {
        const found = section.lessons.find((l) => String(l.lessonId) === id);
        if (found) {
          lesson = found;
          currentSection = section;
          break;
        }
      }
      if (lesson) break;
    }

    let nextLesson: LessonNode | null = null;
    if (currentSection && lesson) {
      const found = lesson;
      const idx = currentSection.lessons.findIndex(
        (l) => l.lessonId === found.lessonId,
      );
      if (idx >= 0 && idx < currentSection.lessons.length - 1) {
        nextLesson = currentSection.lessons[idx + 1];
      }
    }

    return { lesson, currentSection, nextLesson };
  }, [course, id]);

  const [stepIdx, setStepIdx] = useState(0);
  const { locale } = useLocale();
  const [showLayoutWarning, setShowLayoutWarning] = useState(false);
  const [isTouchOnly, setIsTouchOnly] = useState(false);

  // Touch-only devices can't do the lessons — tell the student why
  useEffect(() => {
    setIsTouchOnly(
      window.matchMedia("(pointer: coarse)").matches &&
        !window.matchMedia("(pointer: fine)").matches,
    );
  }, []);

  // Cyrillic keystrokes mean the OS keyboard layout is wrong for these lessons
  useEffect(() => {
    const detect = (e: KeyboardEvent) => {
      if (e.key.length === 1 && /[Ѐ-ӿ]/.test(e.key)) {
        setShowLayoutWarning(true);
      }
    };
    window.addEventListener("keydown", detect);
    return () => window.removeEventListener("keydown", detect);
  }, []);

  useEffect(() => {
    if (!showLayoutWarning) return;
    const t = setTimeout(() => setShowLayoutWarning(false), 8000);
    return () => clearTimeout(t);
  }, [showLayoutWarning]);
  // Theme is app-wide (lib/core/theme, same tz-prefs-v1 key) — the navbar switch and
  // this header's switch are the same setting.
  const { isDark, setDark: setIsDark } = useTheme();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(true);
  const [isHandsVisible, setIsHandsVisible] = useState(true);

  // Decode the keystroke/error samples up front so the first press is instant.
  useEffect(() => {
    preloadSfx();
  }, []);

  // Persisted workspace preferences (sound, key colors, hands overlay) — the
  // `dark` field of the same blob belongs to lib/core/theme, which reads and writes
  // it itself; this effect must never set or clobber it.
  const prefsLoaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tz-prefs-v1");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.audio === "boolean") setIsAudioEnabled(p.audio);
        if (typeof p.colorful === "boolean") setIsColorful(p.colorful);
        if (typeof p.hands === "boolean") setIsHandsVisible(p.hands);
      }
    } catch {}
    prefsLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!prefsLoaded.current) return;
    try {
      const raw = localStorage.getItem("tz-prefs-v1");
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "tz-prefs-v1",
        JSON.stringify({
          ...prev,
          audio: isAudioEnabled,
          colorful: isColorful,
          hands: isHandsVisible,
        }),
      );
    } catch {}
  }, [isAudioEnabled, isColorful, isHandsVisible]);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    keyboardScale: 0.85,
    keyboardY: -25,
    handsScale: 1.53,
    handsY: 87,
  });

  const [isAutoRouting, setIsAutoRouting] = useState(false);

  // ─── RUN STATS & PERSISTED PROGRESS ───
  const runStats = useRef<LessonRunStats>(emptyRun());
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    setProgressMap(getProgress());
    setProgressLoaded(true);
  }, []);

  // ─── SEQUENTIAL LOCKING ───
  const { isLessonLocked, prevLesson } = useMemo(() => {
    if (!progressLoaded || !currentSection || !lesson) {
      return { isLessonLocked: false, prevLesson: null as LessonNode | null };
    }
    const list = currentSection.lessons;
    const unlocked = computeUnlocked(
      list.map((l) => ({ lessonId: l.lessonId, passStars: l.passStars })),
      progressMap,
    );
    const idx = list.findIndex((l) => l.lessonId === lesson.lessonId);
    return {
      isLessonLocked: idx > 0 && !unlocked[idx],
      prevLesson: idx > 0 ? list[idx - 1] : null,
    };
  }, [progressLoaded, currentSection, lesson, progressMap]);

  // Has the CURRENT lesson been passed (best-ever stars vs its own gate)?
  // Ungraded types (lesson, practice) pass by reaching the results screen.
  const passedCurrentRun = useMemo(() => {
    if (!lesson || !isGradedType(lesson.type)) return true;
    return (progressMap[lesson.lessonId]?.stars ?? 0) >= lesson.passStars;
  }, [lesson, progressMap]);

  // Fresh run whenever the user navigates to a different lesson
  useEffect(() => {
    runStats.current = emptyRun();
    setLessonResult(null);
    setStepIdx(0);
    setIsTransitioning(false);
  }, [id]);

  const step = lesson?.steps[stepIdx];

  const targetWpm = useMemo(
    () =>
      lesson
        ? Math.max(0, ...lesson.steps.map((s) => s.rules?.minimumWPM || 0))
        : 0,
    [lesson],
  );

  const retryLesson = useCallback(() => {
    runStats.current = emptyRun();
    setLessonResult(null);
    setStepIdx(0);
  }, []);

  useEffect(() => {
    if (!step) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          retryLesson();
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          // The next lesson is still locked → Enter retries instead
          if (nextLesson && !passedCurrentRun) {
            retryLesson();
            return;
          }
          setIsAutoRouting(true);
          if (nextLesson) {
            router.push(`/lesson/${nextLesson.lessonId}`);
          } else {
            router.push(
              `/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`,
            );
          }
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [
    step,
    nextLesson,
    course.courseId,
    currentSection?.sectionId,
    router,
    retryLesson,
    passedCurrentRun,
  ]);

  const handleComplete = useCallback((stats?: StepStats) => {
    if (stats) {
      const rs = runStats.current;
      rs.correct += stats.correct;
      rs.mistakes += stats.mistakes;
      rs.timeMs += stats.timeMs;
      for (const [k, v] of Object.entries(stats.perKeyMistakes)) {
        rs.perKeyMistakes[k] = (rs.perKeyMistakes[k] || 0) + v;
      }
    }
    setIsTransitioning(true);
  }, []);

  const confirmNext = useCallback(() => {
    setIsTransitioning(false);
    setStepIdx((p) => p + 1);
  }, []);

  const next = () => {
    // Manual skip: still allowed, but the run earns no stars
    if (!isTransitioning) runStats.current.skippedSteps += 1;
    setIsTransitioning(false);
    setStepIdx((p) => p + 1);
  };

  const prev = () => {
    setIsTransitioning(false);
    setStepIdx((p) => Math.max(0, p - 1));
  };

  useEffect(() => {
    if (!isTransitioning) return;
    const t = setTimeout(() => {
      confirmNext();
    }, 800);
    return () => clearTimeout(t);
  }, [isTransitioning, confirmNext]);

  // Lesson finished: compute the result once and persist it.
  // Ungraded types (lesson, practice) — completion only, no stars, no skip penalty.
  useEffect(() => {
    if (!lesson || step || lessonResult) return;
    const result = computeLessonResult(runStats.current, targetWpm);
    if (!isGradedType(lesson.type)) {
      result.stars = 0;
      result.skipped = false;
    }
    setLessonResult(result);
    setProgressMap(saveLessonResult(lesson.lessonId, result));
    // Feed the all-time statistics store (tz-stats-v1) — top problem keys
    // of this run travel with the attempt for the weekly "worst key".
    recordAttempt({
      lessonId: lesson.lessonId,
      type: lesson.type,
      wpm: result.wpm,
      accuracy: result.accuracy,
      stars: result.stars,
      timeMs: result.timeMs,
      errors: result.mistakes,
      problemKeys: Object.fromEntries(
        Object.entries(runStats.current.perKeyMistakes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      ),
    });
  }, [lesson, step, lessonResult, targetWpm]);

  if (!lesson)
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6">
        <Mascot mood="oops" className="w-24 h-24" />
        <p className="font-mono text-6xl font-black text-neutral-200">404</p>
        <h1 className="text-xl font-bold">Lesson not found</h1>
        <p className="text-sm text-neutral-500 text-center max-w-sm">
          This lesson doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/courses"
          className="mt-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          ← Back to Courses
        </Link>
      </div>
    );

  // Direct navigation to a locked lesson → explain instead of opening it
  if (isLessonLocked && prevLesson) {
    const needText = (
      prevLesson.passStars > 0 ? UI.lockedNeedStars : UI.lockedNeedFinish
    )[locale]
      .replace("{n}", String(prevLesson.passStars))
      .replace("{title}", prevLesson.lessonTitle[locale]);
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6 text-center">
        <Mascot mood="focused" className="w-24 h-24" />
        <div className="w-10 h-10 -mt-2 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">{UI.lockedTitle[locale]}</h1>
        <p className="text-sm text-neutral-500 max-w-sm">{needText}</p>
        <Link
          href={`/lesson/${prevLesson.lessonId}`}
          className="mt-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          {UI.goToPrev[locale]} →
        </Link>
      </div>
    );
  }

  if (!step) {
    const r = lessonResult;
    const isGraded = isGradedType(lesson.type);
    const fmtTime = (ms: number) => {
      const s = Math.round(ms / 1000);
      return s >= 60
        ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
        : `${s}s`;
    };
    const RL = {
      title: r?.skipped
        ? { en: "Lesson Finished", uz: "Dars tugadi", ru: "Урок завершён" }
        : { en: "Good Job!", uz: "Barakalla!", ru: "Отличная работа!" },
      skipNote: {
        en: "You skipped some steps — complete every step to earn stars.",
        uz: "Ba'zi qadamlarni o'tkazib yubordingiz — yulduz olish uchun hammasini bajaring.",
        ru: "Вы пропустили шаги — пройдите все шаги, чтобы получить звёзды.",
      },
      practiceNote: {
        en: "Practice is judgment-free — no stars here. Earn them in the test!",
        uz: "Mashqda baho yo'q — yulduzlar testda beriladi. Xato qilishdan qo'rqmang!",
        ru: "Практика без оценок — звёзды даются за тест. Ошибаться можно!",
      },
      wpm: { en: "WPM", uz: "So'z/daq", ru: "Сл/мин" },
      accuracy: { en: "Accuracy", uz: "Aniqlik", ru: "Точность" },
      mistakes: { en: "Mistakes", uz: "Xatolar", ru: "Ошибки" },
      time: { en: "Time", uz: "Vaqt", ru: "Время" },
      problemKeys: {
        en: "Tricky keys",
        uz: "Qiyin tugmalar",
        ru: "Сложные клавиши",
      },
      retry: { en: "Practice Again", uz: "Yana mashq", ru: "Ещё раз" },
      continueNext: {
        en: "Continue to Next Lesson ↵",
        uz: "Keyingi darsga o'tish ↵",
        ru: "Следующий урок ↵",
      },
      returnWorkspace: {
        en: "Return to Workspace ↵",
        uz: "Ish joyiga qaytish ↵",
        ru: "Вернуться в рабочую область ↵",
      },
      pressHint: {
        en: "Enter — continue · R — practice again",
        uz: "Enter — davom etish · R — qayta mashq",
        ru: "Enter — продолжить · R — ещё раз",
      },
    };

    return (
      <div className={isDark ? "dark" : ""}>
        <div
          className={`fixed inset-0 z-50 h-dvh w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 font-sans overflow-hidden select-none transition-opacity duration-300 ${isAutoRouting ? "opacity-0" : "opacity-100"}`}
        >
          {/* Mascot + stars + celebration burst */}
          <div className="relative flex flex-col items-center mb-8">
            {r && (isGraded ? r.stars >= 4 : r.accuracy >= 90) && (
              <div
                className="absolute left-1/2 top-1/2 z-0 pointer-events-none"
                aria-hidden="true"
              >
                {BURST_PARTICLES.map((p, i) => (
                  <span
                    key={i}
                    className="burst-particle absolute text-lg leading-none"
                    style={
                      {
                        "--bx": `${p.x}px`,
                        "--by": `${p.y}px`,
                        color: p.color,
                        animationDelay: `${400 + p.delay}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {p.char}
                  </span>
                ))}
              </div>
            )}
            <Mascot
              mood={
                !r
                  ? "happy"
                  : !isGraded
                    ? r.accuracy >= 90
                      ? "celebrate"
                      : "happy"
                    : r.skipped
                      ? "oops"
                      : r.stars >= 4
                        ? "celebrate"
                        : "happy"
              }
              className="w-24 h-24 mb-4 animate-in zoom-in duration-500 relative z-10"
            />
            <div className={isGraded ? "flex items-center gap-2" : "hidden"}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-10 h-10 sm:w-12 sm:h-12 animate-in zoom-in duration-500 ${
                    r && i < r.stars
                      ? "text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]"
                      : "text-neutral-200 dark:text-neutral-800"
                  }`}
                  style={{
                    animationDelay: `${150 + i * 130}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <path d="M12 2l2.9 6.26 6.6.57-5 4.4 1.5 6.47L12 16.3 5.99 19.7l1.5-6.47-5-4.4 6.6-.57z" />
                </svg>
              ))}
            </div>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold text-neutral-800 dark:text-neutral-200 mb-3 tracking-widest uppercase animate-fade-in-up text-center px-4"
            style={{ animationDelay: "100ms" }}
          >
            {RL.title[locale]}
          </h1>
          {r?.skipped && (
            <p
              className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center px-6 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {RL.skipNote[locale]}
            </p>
          )}
          {lesson.type === "practice" && (
            <p
              className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center px-6 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {RL.practiceNote[locale]}
            </p>
          )}

          {/* Stats */}
          {r && (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 mt-4 animate-fade-in-up px-6"
              style={{ animationDelay: "300ms" }}
            >
              {[
                { label: RL.wpm[locale], value: String(r.wpm) },
                { label: RL.accuracy[locale], value: `${r.accuracy}%` },
                { label: RL.mistakes[locale], value: String(r.mistakes) },
                { label: RL.time[locale], value: fmtTime(r.timeMs) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-6 py-4 min-w-[110px]"
                >
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 font-semibold">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Per-key error heatmap: red = mistakes, green = clean lesson keys */}
          {r && !r.skipped && runStats.current.correct > 0 && (
            <div
              className="hidden sm:flex flex-col items-center gap-1.5 mb-6 animate-fade-in-up"
              style={{ animationDelay: "350ms" }}
              aria-hidden="true"
            >
              {HEATMAP_ROWS.map((row) => {
                const maxMiss = Math.max(
                  1,
                  ...Object.values(runStats.current.perKeyMistakes),
                );
                return (
                  <div key={row} className="flex gap-1.5">
                    {row.split("").map((k) => {
                      const miss = runStats.current.perKeyMistakes[k] || 0;
                      const used = lesson.unlockedKeys.includes(k);
                      const cls =
                        miss > 0
                          ? miss / maxMiss > 0.66
                            ? "bg-red-500 text-white"
                            : miss / maxMiss > 0.33
                              ? "bg-red-300 text-red-950 dark:bg-red-800 dark:text-red-100"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : used
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-neutral-100 text-neutral-300 dark:bg-neutral-900 dark:text-neutral-700";
                      return (
                        <span
                          key={k}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-mono font-bold uppercase ${cls}`}
                        >
                          {k}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {r &&
            !r.skipped &&
            // Top 3 problem keys of this run, ≥2 misses each (same bar as
            // progress.ts hardestKey). Reading runStats is safe here: the
            // results screen renders after the run is frozen (same pattern
            // as the heatmap above).
            // eslint-disable-next-line react-hooks/refs
            (() => {
              const problems = Object.entries(runStats.current.perKeyMistakes)
                .filter(([, n]) => n >= 2)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
              if (problems.length === 0) return null;
              return (
                <div
                  className="flex items-center gap-2.5 mb-6 text-sm text-neutral-500 dark:text-neutral-400 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  <span>{RL.problemKeys[locale]}:</span>
                  {problems.map(([k, n]) => (
                    <span key={k} className="flex items-center gap-1">
                      <kbd className="font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded shadow-sm uppercase">
                        {k === " " ? "␣" : k}
                      </kbd>
                      <span className="font-mono text-xs font-semibold text-red-500 dark:text-red-400">
                        ×{n}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })()}

          <div
            className="flex flex-col items-center animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            {/* Next lesson still locked → explain what's needed */}
            {r && nextLesson && !passedCurrentRun && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                {UI.unlockHint[locale].replace(
                  "{n}",
                  String(lesson.passStars),
                )}
              </p>
            )}
            <p className="text-neutral-400 dark:text-neutral-500 mb-5 font-mono tracking-widest text-xs uppercase">
              {nextLesson && !passedCurrentRun
                ? UI.pressHintRetry[locale]
                : RL.pressHint[locale]}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={retryLesson}
                className={
                  nextLesson && !passedCurrentRun
                    ? "bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                    : "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg transition-all"
                }
              >
                {RL.retry[locale]}
              </button>
              {nextLesson && passedCurrentRun && (
                <button
                  onClick={() => {
                    setIsAutoRouting(true);
                    router.push(`/lesson/${nextLesson?.lessonId}`);
                  }}
                  className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                >
                  {RL.continueNext[locale]}
                </button>
              )}
              {!nextLesson && (
                <Link
                  href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
                  className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                >
                  {RL.returnWorkspace[locale]}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="fixed inset-0 z-50 arena-workspace-active h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col select-none">
        {/* ─── STARK NOTION HEADER ─── */}
        <header
          className="flex-shrink-0 w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20"
        >
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title={UI.home[locale]}
              aria-label={UI.home[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md -ml-2"
            >
              <Home size={19} strokeWidth={2} />
            </Link>
            <Link
              href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
              title={UI.backToCourse[locale]}
              aria-label={UI.backToCourse[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="flex flex-col ml-2">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white leading-tight transition-colors">
                {lesson.lessonTitle[locale]}
              </h1>
              <span className="text-[10px] md:text-xs text-neutral-400 font-medium transition-colors">
                {UI.step[locale]} {step.stepNumber} / {lesson.steps.length} •{" "}
                {UI.viewportNames[step.viewport]?.[locale] ?? step.viewport}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            {/* Display settings: key colors, hands overlay, palette */}
            <button
              onClick={() => setIsColorful(!isColorful)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isColorful ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.colorfulKeys[locale]}
              aria-label={UI.colorfulKeys[locale]}
              aria-pressed={isColorful}
            >
              <KeyboardIcon size={19} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsHandsVisible(!isHandsVisible)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isHandsVisible ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.handsOverlay[locale]}
              aria-label={UI.handsOverlay[locale]}
              aria-pressed={isHandsVisible}
            >
              <Hand size={19} strokeWidth={2} />
            </button>

            {/* Hand drawing picker — choosing one always brings the hands back */}
            <HandStyleSwitcher onSelect={() => setIsHandsVisible(true)} />

            {/* Finger-zone palette picker — picking a palette always shows it */}
            <PaletteSwitcher onSelect={() => setIsColorful(true)} />

            <span className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

            {/* Sound + theme */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isAudioEnabled ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.sound[locale]}
              aria-label={UI.sound[locale]}
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
              title={UI.darkMode[locale]}
              aria-label={UI.darkMode[locale]}
              aria-pressed={isDark}
            >
              {isDark ? (
                <Sun size={19} strokeWidth={2} />
              ) : (
                <Moon size={19} strokeWidth={2} />
              )}
            </button>

            <span className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

            {/* Language */}
            <LanguageSwitcher />
          </div>
        </header>

        {/* ─── WRONG-LAYOUT WARNING (Cyrillic keystrokes detected) ─── */}
        {showLayoutWarning && (
          <div
            role="alert"
            className="flex-shrink-0 w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-6 py-2.5 flex items-center justify-center gap-3 z-20 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500 shrink-0"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 text-center">
              {UI.layoutWarning[locale]}
            </p>
            <button
              onClick={() => setShowLayoutWarning(false)}
              className="text-amber-500 hover:text-amber-700 font-bold px-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── TOUCH-ONLY DEVICE NOTICE ─── */}
        {isTouchOnly && (
          <div className="absolute inset-0 z-[70] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Mascot mood="oops" className="w-24 h-24" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {UI.mobileTitle[locale]}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              {UI.mobileBody[locale]}
            </p>
            <Link
              href="/courses"
              className="mt-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-lg"
            >
              {UI.backToCourses[locale]}
            </Link>
          </div>
        )}

        {/* ─── WORKSPACE LAYOUT ─── */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT RAIL — chapters & sections */}
          <ChapterRail
            chapters={course.chapters}
            currentSectionId={currentSection?.sectionId ?? null}
            courseId={course.courseId}
            progress={progressMap}
            locale={locale}
          />

          {/* CENTER ARENA */}
          <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">
            <main className="flex-1 min-h-0 w-full relative flex flex-col">
              {isTransitioning ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 z-40">
                  <div className="relative w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-in zoom-in spin-in-12 duration-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              ) : step.viewport === "GAME_NINJA_RUN" ? (
                /* Full-bleed game: covers header, footer and rails — the
                   student sees only the game. Back and Skip float on top. */
                <div
                  key={step.stepId}
                  className="fixed inset-0 z-50 bg-[#f4e0c5] animate-in fade-in duration-500"
                >
                  <NinjaWorld
                    step={step}
                    onComplete={handleComplete}
                    isEmbedded={true}
                  />

                  <Link
                    href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
                    title={lesson.lessonTitle[locale]}
                    className="absolute top-5 right-5 z-[10000] w-11 h-11 bg-[#fff6e6]/95 text-[#3d2a21] border-2 border-[#3d2a21] rounded-full shadow-[0_3px_0_#3d2a21] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </Link>

                  <button
                    onClick={next}
                    className="absolute bottom-5 right-5 z-[10000] bg-[#fff6e6]/95 text-[#3d2a21] border-2 border-[#3d2a21] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_3px_0_#3d2a21] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    {UI.skip[locale]}
                  </button>
                </div>
              ) : (
                <StageScaler>
                  {step.viewport === "POSTURE_CHECK" && (
                    <PostureCheck
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "KEY_INTRO" && (
                    <KeyIntro
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isAudioEnabled={isAudioEnabled}
                      isDark={isDark}
                      isColorful={isColorful}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "STANDARD_GYM" && (
                    <div
                      key={step.stepId}
                      className="w-full flex-1 min-h-0 flex flex-col animate-fade-in-up"
                    >
                      <PracticeTracker
                        step={step}
                        onComplete={handleComplete}
                        isDark={isDark}
                        isColorful={isColorful}
                        isAudioEnabled={isAudioEnabled}
                        isHandsVisible={isHandsVisible}
                        layoutConfig={layoutConfig}
                      />
                    </div>
                  )}

                  {step.viewport === "CHAT_SIM" && (
                    <ChatSim
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isAudioEnabled={isAudioEnabled}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "SHORTCUT_DOJO" && (
                    <ShortcutDojo
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isAudioEnabled={isAudioEnabled}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}
                </StageScaler>
              )}
            </main>
            {/* ─── STARK NOTION FOOTER PROGRESS DECK ─── */}
            <footer
              className="flex-shrink-0 w-full py-4 sm:py-6 px-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 relative flex items-center justify-between"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <button
                  onClick={prev}
                  disabled={stepIdx === 0}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer relative z-30"
                >
                  {UI.prev[locale]}
                </button>

                {/* Segmented step bar: one segment per step */}
                <div
                  className="flex items-center gap-1.5 w-72 relative z-30"
                  aria-label={`${UI.step[locale]} ${stepIdx + 1} / ${lesson.steps.length}`}
                >
                  {lesson.steps.map((s, i) => (
                    <div
                      key={s.stepId}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < stepIdx
                          ? "bg-emerald-500"
                          : i === stepIdx
                            ? "bg-neutral-950 dark:bg-white animate-pulse"
                            : "bg-neutral-200 dark:bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer relative z-30"
                >
                  {UI.skip[locale]}
                </button>
              </div>
            </footer>
          </div>

          {/* RIGHT RAIL — lessons of the current section */}
          <LessonRail
            lessons={currentSection?.lessons ?? []}
            currentLessonId={lesson.lessonId}
            progress={progressMap}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
