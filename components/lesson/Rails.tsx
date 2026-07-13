"use client";

// Edge rails for the lesson workspace:
// collapsed = a slim column of dashes showing progress (ChatGPT-style);
// CLICK the rail = a card drawer slides in (thumbnails, titles, stars).
// The drawer closes on outside click, Esc, or any typing keystroke.
// Both are overlays — the typing arena never shifts.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChapterNode, LessonNode } from "@/types/lesson";
import { computeUnlocked, ProgressMap } from "@/lib/progress";
import { DynamicThumbnail } from "@/components/thumbnails/DynamicThumbnail";
import {
  LESSON_TYPES,
  LESSON_TYPE_ORDER,
  LessonTypeIcon,
} from "@/lib/lessonTypes";

type Locale = "en" | "uz" | "ru";

const RAIL_UI = {
  lessons: { en: "Lessons", uz: "Darslar", ru: "Уроки" },
  course: { en: "Course", uz: "Kurs", ru: "Курс" },
};

function useDrawer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key.length === 1) {
        setOpen(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}

function DrawerHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        {title}
      </span>
      <button
        onClick={onClose}
        aria-label="Close"
        className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RIGHT RAIL — lessons of the current section
// ─────────────────────────────────────────────────────────────────

export function LessonRail({
  lessons,
  currentLessonId,
  progress,
  locale,
  dimmed = false,
}: {
  lessons: LessonNode[];
  currentLessonId: string;
  progress: ProgressMap;
  locale: Locale;
  dimmed?: boolean;
}) {
  const { open, setOpen, ref } = useDrawer();

  // One drawer group per lesson type, in pedagogical order
  const groups = LESSON_TYPE_ORDER.map((t) => ({
    type: t,
    cfg: LESSON_TYPES[t],
    lessons: lessons.filter((l) => l.type === t),
  })).filter((g) => g.lessons.length > 0);

  const unlockedFlags = computeUnlocked(
    lessons.map((l) => ({ lessonId: l.lessonId, passStars: l.passStars })),
    progress,
  );
  const unlockedMap: Record<string, boolean> = {};
  lessons.forEach((l, i) => {
    unlockedMap[l.lessonId] = unlockedFlags[i];
  });

  const renderCard = (l: LessonNode) => {
    const isActive = l.lessonId === currentLessonId;
    const prog = progress[l.lessonId];
    const isCompleted = !!prog?.completed;
    const locked = !unlockedMap[l.lessonId];
    const showStars =
      LESSON_TYPES[l.type].graded && isCompleted && (prog?.stars ?? 0) > 0;

    const inner = (
      <>
        <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
          {l.thumbnail?.svgId && (
            <DynamicThumbnail
              svgId={l.thumbnail.svgId}
              params={l.thumbnail.parameters}
              className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                locked
                  ? ""
                  : isActive
                    ? "scale-105"
                    : "group-hover:scale-105"
              }`}
            />
          )}

          {/* Earned stars on top of the thumbnail */}
          {showStars && !locked && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 text-sm tracking-wide leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
              <span className="text-amber-400">{"★".repeat(prog!.stars)}</span>
              <span className="text-neutral-300/90">
                {"★".repeat(5 - prog!.stars)}
              </span>
            </div>
          )}

          {locked ? (
            <div className="absolute top-1.5 right-1.5 z-10 w-6 h-6 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md ring-1 ring-black/5 dark:ring-white/10">
              <svg
                width="12"
                height="12"
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
          ) : isCompleted && !isActive ? (
            <div className="absolute bottom-1.5 right-1.5 z-10 w-7 h-7 bg-emerald-500 text-white flex items-center justify-center rounded-full shadow-md ring-2 ring-white dark:ring-neutral-900">
              <svg
                width="14"
                height="14"
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
          ) : (
            <div
              className={`absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                isActive
                  ? "bg-white dark:bg-black text-neutral-900 dark:text-white shadow-sm"
                  : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
              }`}
            >
              {l.lessonNumber}
            </div>
          )}
        </div>
        <div
          className={`py-2 px-2 text-center border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${isActive ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
        >
          <span
            className={`text-xs font-medium truncate block ${
              locked
                ? "text-neutral-300 dark:text-neutral-700"
                : isActive
                  ? "text-emerald-700 dark:text-emerald-400 font-bold"
                  : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"
            }`}
          >
            {l.lessonTitle[locale]}
          </span>
        </div>
      </>
    );

    if (locked) {
      return (
        <div
          key={l.lessonId}
          aria-disabled="true"
          className="block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden cursor-not-allowed"
        >
          {inner}
        </div>
      );
    }

    return (
      <Link
        key={l.lessonId}
        href={`/lesson/${l.lessonId}`}
        className={`group block bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden transition-all duration-200 ${
          isActive
            ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
            : isCompleted
              ? "border-neutral-200 dark:border-neutral-800 opacity-80 hover:opacity-100"
              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
        }`}
      >
        {inner}
      </Link>
    );
  };

  const renderDash = (l: LessonNode) => {
    const isCurrent = l.lessonId === currentLessonId;
    const completed = !!progress[l.lessonId]?.completed;
    const locked = !unlockedMap[l.lessonId];
    const color = locked
      ? "bg-neutral-200 dark:bg-neutral-800"
      : isCurrent
        ? "bg-neutral-900 dark:bg-white"
        : completed
          ? "bg-emerald-500"
          : "bg-neutral-300 dark:bg-neutral-700";
    const stars = progress[l.lessonId]?.stars ?? 0;
    const label = `${l.lessonTitle[locale]}${stars > 0 ? ` · ${"★".repeat(stars)}` : ""}`;
    return (
      <span
        key={l.lessonId}
        title={label}
        className="flex items-center justify-end p-[3px]"
      >
        <span
          className={`h-[3px] rounded-full ${color} ${isCurrent ? "w-7 animate-pulse" : "w-5"}`}
        />
      </span>
    );
  };

  return (
    <nav
      ref={ref}
      aria-label={RAIL_UI.lessons[locale]}
      className="absolute inset-y-0 right-0 w-0 z-40"
    >
      {/* Collapsed rail — click to open the drawer */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={RAIL_UI.lessons[locale]}
        className={`absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end gap-0.5 py-3 pl-2 pr-2.5 rounded-l-xl cursor-pointer hover:bg-neutral-100/80 dark:hover:bg-neutral-900/80 transition-all duration-500 ${dimmed && !open ? "opacity-25" : "opacity-100"}`}
      >
        {lessons.map(renderDash)}
      </button>

      {/* Card drawer */}
      <aside
        className={`absolute right-0 top-0 h-full w-64 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <DrawerHeader
          title={RAIL_UI.lessons[locale]}
          onClose={() => setOpen(false)}
        />
        <div className="flex flex-col gap-6 p-3 pt-1 overflow-y-auto pb-8">
          {groups.map(({ type, cfg, lessons: groupLessons }) => (
            <div key={type} className="flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                <LessonTypeIcon type={type} size={11} />
                {cfg.label[locale]}
              </h3>
              {groupLessons.map(renderCard)}
            </div>
          ))}
        </div>
      </aside>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
// LEFT RAIL — chapters and their sections
// ─────────────────────────────────────────────────────────────────

export function ChapterRail({
  chapters,
  currentSectionId,
  courseId,
  progress,
  locale,
  dimmed = false,
}: {
  chapters: ChapterNode[];
  currentSectionId: string | null;
  courseId: string;
  progress: ProgressMap;
  locale: Locale;
  dimmed?: boolean;
}) {
  const { open, setOpen, ref } = useDrawer();

  const sectionStats = (lessons: LessonNode[]) => {
    const total = lessons.length;
    const done = lessons.filter((l) => progress[l.lessonId]?.completed).length;
    return { total, done };
  };

  return (
    <nav
      ref={ref}
      aria-label={RAIL_UI.course[locale]}
      className="absolute inset-y-0 left-0 w-0 z-40"
    >
      {/* Collapsed rail — one dash per CHAPTER (Home Row, Top Row, …), not per
          section: 50+ section dashes filled the whole column height. Click to
          open the drawer for the section-level detail. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={RAIL_UI.course[locale]}
        className={`absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start gap-0.5 py-3 pr-2 pl-2.5 rounded-r-xl cursor-pointer hover:bg-neutral-100/80 dark:hover:bg-neutral-900/80 transition-all duration-500 ${dimmed && !open ? "opacity-25" : "opacity-100"}`}
      >
        {chapters.map((ch) => {
          const isCurrent = ch.sections.some(
            (sec) => sec.sectionId === currentSectionId,
          );
          const { total, done } = sectionStats(
            ch.sections.flatMap((sec) => sec.lessons),
          );
          const color = isCurrent
            ? "bg-neutral-900 dark:bg-white"
            : done === total && total > 0
              ? "bg-emerald-500"
              : done > 0
                ? "bg-emerald-300 dark:bg-emerald-800"
                : "bg-neutral-300 dark:bg-neutral-700";
          return (
            <span
              key={ch.chapterId}
              title={`${ch.chapterTitle[locale]} · ${done}/${total}`}
              className="flex items-center p-[3px]"
            >
              <span
                className={`h-[3px] rounded-full ${color} ${isCurrent ? "w-7 animate-pulse" : "w-5"}`}
              />
            </span>
          );
        })}
      </button>

      {/* Card drawer */}
      <aside
        className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <DrawerHeader
          title={RAIL_UI.course[locale]}
          onClose={() => setOpen(false)}
        />
        <div className="flex flex-col p-3 pt-1 gap-1 overflow-y-auto pb-8">
          {chapters.map((ch) => (
            <div key={ch.chapterId} className="mb-4">
              <div className="px-1 py-1.5 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {ch.chapterNumber} · {ch.chapterTitle[locale]}
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {ch.sections.map((sec) => {
                  const isActive = sec.sectionId === currentSectionId;
                  const { total, done } = sectionStats(sec.lessons);
                  return (
                    <Link
                      key={sec.sectionId}
                      href={`/courses/${courseId}?sectionId=${sec.sectionId}`}
                      className={`group block bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden transition-all duration-200 ${
                        isActive
                          ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
                        {sec.thumbnail?.imageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sec.thumbnail.imageSrc}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : sec.thumbnail?.svgId ? (
                          <DynamicThumbnail
                            svgId={sec.thumbnail.svgId}
                            params={sec.thumbnail.parameters}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : null}
                        <div className="absolute top-2 left-2 w-6 h-6 bg-white dark:bg-black text-neutral-900 dark:text-white flex items-center justify-center rounded text-xs font-bold shadow-sm z-10">
                          {sec.sectionNumber}
                        </div>
                      </div>
                      {total > 0 && done > 0 && (
                        <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-900">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(done / total) * 100}%` }}
                          />
                        </div>
                      )}
                      <div
                        className={`py-2 px-2 text-center border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${isActive ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                      >
                        <span
                          className={`text-xs font-medium truncate block ${isActive ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"}`}
                        >
                          {sec.sectionTitle[locale]}
                        </span>
                        <span className="font-mono text-[9px] text-neutral-400 block mt-0.5">
                          {done}/{total}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </nav>
  );
}
