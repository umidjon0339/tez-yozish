"use client";

// Lesson hub for one letter — mounted by /english/letters/[letter] and
// /english/codes/[letter]. The letters analogue of the course section view
// (app/courses/[id]): lessons grouped by type in the pedagogical arc
// Learn → Practice → Tests → Games (LESSON_TYPE_ORDER), sequential
// unlocking via computeUnlocked, "next up" ring, star overlays, padlocks.
// Unimplemented lessons (kind "SOON") always render locked with a
// "coming soon" chip and never gate the chain.

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import type { LetterInfo } from "@/lib/letters";
import {
  LETTER_TRACKS,
  letterLessonKey,
  letterUnlockRefs,
  lessonHref,
  trackHref,
  type LetterLesson,
  type LetterTrackId,
} from "@/lib/letterCurriculum";
import { LESSON_TYPES, LESSON_TYPE_ORDER } from "@/lib/lessonTypes";
import { useLetterProgress } from "@/lib/letterProgress";
import { computeUnlocked, isLessonPassed } from "@/lib/progress";
import { DynamicThumbnail } from "@/components/thumbnails/DynamicThumbnail";

const L = STR.letters;

export function LetterLessonHub({
  track,
  info,
}: {
  track: LetterTrackId;
  info: LetterInfo;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const progress = useLetterProgress();
  const char = info.char;
  const trackData = LETTER_TRACKS[track];

  const prevCh =
    char === "a" ? "z" : String.fromCharCode(char.charCodeAt(0) - 1);
  const nextCh =
    char === "z" ? "a" : String.fromCharCode(char.charCodeAt(0) + 1);

  // Sequential unlocking over the implemented lessons, authored order.
  const refs = letterUnlockRefs(track, char);
  const unlockedFlags = computeUnlocked(refs, progress);
  const unlockedMap: Record<string, boolean> = {};
  refs.forEach((r, i) => {
    unlockedMap[r.lessonId] = unlockedFlags[i];
  });

  const nextUpKey = refs.find(
    (r, i) => unlockedFlags[i] && !isLessonPassed(r, progress),
  )?.lessonId;

  // Star tally — graded lessons only, like the course section header.
  const gradedLessons = trackData.lessons.filter(
    (l) => l.implemented && LESSON_TYPES[l.type].graded,
  );
  const earnedStars = gradedLessons.reduce(
    (sum, l) =>
      sum + (progress[letterLessonKey(track, char, l.id)]?.stars ?? 0),
    0,
  );
  const totalStars = gradedLessons.length * 5;

  const groups = LESSON_TYPE_ORDER.map((t) => ({
    type: t,
    cfg: LESSON_TYPES[t],
    lessons: trackData.lessons.filter((l) => l.type === t),
  })).filter((g) => g.lessons.length > 0);

  const renderCard = (lesson: LetterLesson) => {
    const key = letterLessonKey(track, char, lesson.id);
    const cfg = LESSON_TYPES[lesson.type];
    const prog = progress[key];
    const completed = !!prog?.completed;
    const soon = !lesson.implemented;
    const locked = soon || !unlockedMap[key];
    const isNextUp = key === nextUpKey;
    const showStars = cfg.graded && completed && (prog?.stars ?? 0) > 0;

    return (
      <div
        key={lesson.id}
        onClick={
          locked ? undefined : () => router.push(lessonHref(track, char, lesson.id))
        }
        aria-disabled={locked}
        className={`group bg-white border rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden relative ${
          locked
            ? "border-neutral-200 cursor-not-allowed"
            : isNextUp
              ? "border-emerald-500 ring-2 ring-emerald-500 hover:shadow-md cursor-pointer"
              : "border-neutral-200 hover:border-neutral-400 hover:shadow-md cursor-pointer"
        }`}
      >
        <div className="w-full aspect-[16/10] bg-neutral-50 relative overflow-hidden">
          <DynamicThumbnail
            svgId={lesson.thumbnail.svgId}
            params={{ ...lesson.thumbnail.parameters, letter: char }}
            className={`w-full h-full object-cover transition-all duration-500 ease-out ${
              locked ? (soon ? "opacity-60" : "") : "group-hover:scale-105"
            }`}
          />

          {/* Earned stars — big, on top of the thumbnail */}
          {showStars && !locked && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 text-base sm:text-lg tracking-wide leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
              <span className="text-amber-400">{"★".repeat(prog.stars)}</span>
              <span className="text-neutral-300/90">
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
            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-sm shadow-md ring-1 ring-black/5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              {L.comingSoon[locale]}
            </div>
          ) : (
            locked && (
              <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md ring-1 ring-black/5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-500"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            )
          )}
        </div>

        <div className="border-t border-neutral-100 py-2 sm:py-3 px-2 text-center bg-white flex flex-col items-center justify-center min-h-[44px] gap-0.5">
          <span
            className={`text-[10px] sm:text-xs font-medium truncate transition-colors ${
              locked
                ? "text-neutral-300"
                : "text-neutral-500 group-hover:text-neutral-800"
            }`}
          >
            {lesson.title[locale]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-5xl mx-auto w-full">
        <Link
          href="/english/letters"
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-neutral-600 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-900 hover:shadow active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          {L.backToLetters[locale]}
        </Link>

        {/* Letter header */}
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center justify-center font-mono text-3xl font-bold text-neutral-900">
              {char.toUpperCase()}
              {char}
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {track === "letters" ? L.title[locale] : L.codesTitle[locale]} —{" "}
                {char.toUpperCase()}
              </h1>
              <p className="text-[13px] text-neutral-400 font-medium">
                {info.name} · {track === "letters" ? info.word : info.nato}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalStars > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {earnedStars} / {totalStars}
              </span>
            )}
            <span className="inline-flex items-center rounded-lg border border-neutral-200 bg-white shadow-sm">
              <Link
                href={trackHref(track, prevCh)}
                title={L.prevLetter[locale]}
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <span className="w-px h-5 bg-neutral-200" aria-hidden />
              <Link
                href={trackHref(track, nextCh)}
                title={L.nextLetter[locale]}
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
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
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 pl-1">
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
