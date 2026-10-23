"use client";

// Lesson hub for one phoneme — mounted by /english/phonemes/[phoneme].
// The phonemes analogue of LetterLessonHub (and of the course section view):
// lessons grouped by type in the pedagogical arc Learn → Practice → Tests →
// Games (LESSON_TYPE_ORDER), sequential unlocking via phonemeUnlockedMap
// (graded lessons pass at PASS_ACCURACY — accuracy, not stars), "next up"
// ring, star overlays, padlocks. The lesson list is per-phoneme
// (phonemeLessonsFor): pilot sounds carry one SHADE lesson per allophone.
// Unimplemented lessons (kind "SOON") render locked and never gate.

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { phonemeAt, type PhonemeInfo } from "@/lib/english/phonemes";
import {
  phonemeHubHref,
  phonemeLessonHref,
  phonemeLessonKey,
  phonemeLessonsFor,
  type PhonemeLesson,
} from "@/lib/english/phonemeCurriculum";
import { LESSON_TYPES, LESSON_TYPE_ORDER } from "@/lib/typing/lessonTypes";
import {
  isPhonemeLessonPassed,
  phonemeUnlockedMap,
  usePhonemeProgress,
} from "@/lib/english/phonemeProgress";
import { DynamicThumbnail } from "@/components/thumbnails/DynamicThumbnail";

const P = STR.phonemes;
const L = STR.letters;

export function PhonemeLessonHub({ info }: { info: PhonemeInfo }) {
  const { locale } = useLocale();
  const router = useRouter();
  const progress = usePhonemeProgress();
  const slug = info.slug;

  const prev = phonemeAt(-1, info);
  const next = phonemeAt(1, info);

  const lessons = phonemeLessonsFor(slug);

  // Sequential unlocking over the implemented lessons, authored order —
  // a graded lesson passes at PASS_ACCURACY (accuracy, not stars).
  const unlockedMap = phonemeUnlockedMap(slug, progress);

  const nextUpId = lessons.find(
    (l) =>
      l.implemented &&
      unlockedMap[l.id] &&
      !isPhonemeLessonPassed(progress, slug, l),
  )?.id;

  // Star tally — graded lessons only, like the course section header.
  const gradedLessons = lessons.filter(
    (l) => l.implemented && LESSON_TYPES[l.type].graded,
  );
  const earnedStars = gradedLessons.reduce(
    (sum, l) => sum + (progress[phonemeLessonKey(slug, l.id)]?.stars ?? 0),
    0,
  );
  const totalStars = gradedLessons.length * 5;

  const groups = LESSON_TYPE_ORDER.map((t) => ({
    type: t,
    cfg: LESSON_TYPES[t],
    lessons: lessons.filter((l) => l.type === t),
  })).filter((g) => g.lessons.length > 0);

  const typeLabel =
    info.type === "vowel"
      ? info.diphthong
        ? P.diphthong[locale]
        : L.vowel[locale]
      : L.consonant[locale];

  const renderCard = (lesson: PhonemeLesson) => {
    const key = phonemeLessonKey(slug, lesson.id);
    const cfg = LESSON_TYPES[lesson.type];
    const prog = progress[key];
    const completed = !!prog?.completed;
    const soon = !lesson.implemented;
    const locked = soon || !unlockedMap[lesson.id];
    const isNextUp = lesson.id === nextUpId;
    const showStars = cfg.graded && completed && (prog?.stars ?? 0) > 0;

    return (
      <div
        key={lesson.id}
        onClick={
          locked
            ? undefined
            : () => router.push(phonemeLessonHref(slug, lesson.id))
        }
        aria-disabled={locked}
        className={`group bg-white dark:bg-neutral-900 border rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden relative ${
          locked
            ? "border-neutral-200 dark:border-neutral-800 cursor-not-allowed"
            : isNextUp
              ? "border-emerald-500 ring-2 ring-emerald-500 hover:shadow-md cursor-pointer"
              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer"
        }`}
      >
        <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
          <DynamicThumbnail
            svgId={lesson.thumbnail.svgId}
            params={{ ...lesson.thumbnail.parameters, symbol: info.symbol }}
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${
              locked ? (soon ? "opacity-60" : "") : "group-hover:scale-105"
            }`}
          />

          {/* Earned stars — big, on top of the thumbnail */}
          {showStars && !locked && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 text-base sm:text-lg tracking-wide leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
              <span className="text-amber-400">{"★".repeat(prog.stars)}</span>
              <span className="text-neutral-300/90 dark:text-neutral-600/90">
                {"★".repeat(5 - prog.stars)}
              </span>
            </div>
          )}

          {/* Completed badge */}
          {completed && !locked && (
            <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-emerald-500 text-white flex items-center justify-center rounded-full shadow-md ring-2 ring-white">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}

          {/* Coming-soon chip or padlock — top-right */}
          {soon ? (
            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm shadow-md ring-1 ring-black/5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {L.comingSoon[locale]}
            </div>
          ) : (
            locked && (
              <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md ring-1 ring-black/5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-500 dark:text-neutral-400"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            )
          )}
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 sm:py-3 px-2 text-center bg-white dark:bg-neutral-900 flex flex-col items-center justify-center min-h-[44px] gap-0.5">
          <span
            className={`text-[10px] sm:text-xs font-medium truncate transition-colors ${
              locked
                ? "text-neutral-300 dark:text-neutral-600"
                : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
            }`}
          >
            {lesson.title[locale]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <Link
          href="/english/phonemes"
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-[13px] font-semibold text-neutral-600 dark:text-neutral-400 shadow-sm transition-all hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 hover:shadow active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          {P.backToPhonemes[locale]}
        </Link>

        {/* Sound header */}
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="min-w-16 h-16 px-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              /{info.symbol}/
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {P.title[locale]} —{" "}
                <span className="font-mono">/{info.symbol}/</span>
              </h1>
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500 font-medium">
                {typeLabel} · {L.soundAsIn[locale]} {info.examples[0].word}
                {info.region !== "both" && (
                  <>
                    {" "}
                    ·{" "}
                    <span
                      className={
                        info.region === "uk" ? "text-sky-500" : "text-rose-500"
                      }
                    >
                      {info.region === "uk"
                        ? STR.english.ukOnly[locale]
                        : STR.english.usOnly[locale]}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalStars > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {earnedStars} / {totalStars}
              </span>
            )}
            <span className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
              <Link
                href={phonemeHubHref(prev.slug)}
                title={P.prevSound[locale]}
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <span className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" aria-hidden />
              <Link
                href={phonemeHubHref(next.slug)}
                title={P.nextSound[locale]}
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </span>
          </div>
        </div>

        {/* Lesson groups — Learn → Practice → Tests → Games */}
        <div className="mt-8 flex flex-col gap-8">
          {groups.map(({ type, cfg, lessons }) => (
            <div key={type}>
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 pl-1">
                {cfg.label[locale]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                {lessons.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
