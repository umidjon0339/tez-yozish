"use client";

// One typing drill over a text — the TYPE (visible) and HEAR (dictation,
// hidden) lessons. Tracker bookkeeping lives in refs and letters update
// through imperative handles (lesson-runtime invariant: no re-render per
// keystroke). Records every stroke into the all-time stats layer.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createStatsSession, type StatsSession } from "@/lib/stats";
import {
  CORRECT,
  CORRECT_FIXED,
  INCORRECT,
  KeyboardWithHands,
  Letter,
  playErrSound,
  playKeySound,
  type KeyPressInfo,
  type LetterHandle,
  type StageChromeProps,
  type StageStats,
} from "@/components/english/stage-kit";

export function GymStage({
  text,
  hidden = false,
  header,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  onWordStart,
  onDone,
}: StageChromeProps & {
  text: string;
  hidden?: boolean;
  header?: React.ReactNode;
  onWordStart?: (word: string) => void;
  onDone: (stats: StageStats) => void;
}) {
  const chars = useMemo(() => text.split(""), [text]);
  const total = chars.length;

  const cursor = useRef(0);
  const hasError = useRef<boolean[]>(new Array(total).fill(false));
  const mistakes = useRef(0);
  const correct = useRef(0);
  const perKey = useRef<Record<string, number>>({});
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const session = useRef<StatsSession | null>(null);
  const handles = useRef(new Map<number, LetterHandle>());
  const progressRef = useRef<HTMLDivElement>(null);

  const [expectedKey, setExpectedKey] = useState<string | null>(chars[0]);
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);
  const pressId = useRef(0);

  // Latest-callback refs, synced in an effect (never during render).
  const onWordStartRef = useRef(onWordStart);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onWordStartRef.current = onWordStart;
    onDoneRef.current = onDone;
  });

  // Cursor onto the first char; announce the first word; flush stats on exit.
  useEffect(() => {
    handles.current.get(0)?.setIsCursor(true);
    onWordStartRef.current?.(text.split(" ")[0]);
    const s = session;
    return () => s.current?.end();
  }, [text]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || done.current) return;
      if (e.key.length !== 1) return;
      e.preventDefault();

      const i = cursor.current;
      const expected = chars[i];
      if (!expected) return;
      const isCorrect = e.key.toLowerCase() === expected;

      if (!session.current) session.current = createStatsSession();
      if (startTime.current === null) startTime.current = performance.now();
      session.current.stroke(expected, isCorrect);
      setLastPress({ key: e.key, isCorrect, id: ++pressId.current });

      const handle = handles.current.get(i);
      if (isCorrect) {
        correct.current++;
        if (isAudioEnabled) playKeySound();
        handle?.setCharState(hasError.current[i] ? CORRECT_FIXED : CORRECT);
        handle?.setIsCursor(false);
        cursor.current = i + 1;
        if (progressRef.current) {
          progressRef.current.style.width = `${((i + 1) / total) * 100}%`;
        }
        if (i + 1 >= total) {
          done.current = true;
          session.current?.end();
          session.current = null;
          const stats: StageStats = {
            correct: correct.current,
            mistakes: mistakes.current,
            timeMs: performance.now() - (startTime.current ?? 0),
            perKeyMistakes: perKey.current,
          };
          setExpectedKey(null);
          setTimeout(() => onDoneRef.current(stats), 250);
        } else {
          handles.current.get(i + 1)?.setIsCursor(true);
          setExpectedKey(chars[i + 1]);
          // A new word starts right after a space — announce it (dictation).
          if (expected === " ") {
            const rest = text.slice(i + 1);
            onWordStartRef.current?.(rest.split(" ")[0]);
          }
        }
      } else {
        mistakes.current++;
        hasError.current[i] = true;
        const k = expected.toLowerCase();
        perKey.current[k] = (perKey.current[k] ?? 0) + 1;
        if (isAudioEnabled) playErrSound();
        handle?.setCharState(INCORRECT);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chars, total, text, isAudioEnabled]);

  // Word-grouped rendering so lines wrap at word boundaries.
  const words = useMemo(() => {
    const out: { start: number; chars: string[] }[] = [];
    let start = 0;
    for (const w of text.split(" ")) {
      out.push({ start, chars: [...w, " "] });
      start += w.length + 1;
    }
    out[out.length - 1].chars.pop();
    return out;
  }, [text]);

  return (
    <>
      {header}
      <div className="relative w-full px-4">
        <div className="absolute -top-4 left-4 right-4 h-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-neutral-950 dark:bg-white rounded-full transition-[width] duration-150"
            style={{ width: "0%" }}
          />
        </div>
        <div className="w-full text-center font-mono text-3xl sm:text-4xl leading-relaxed tracking-wide select-none">
          {words.map((w) => (
            <span key={w.start} className="inline-block whitespace-pre align-top">
              {w.chars.map((c, j) => {
                const idx = w.start + j;
                return (
                  <Letter
                    key={idx}
                    char={c}
                    hidden={hidden && c !== " "}
                    ref={(h) => {
                      if (h) handles.current.set(idx, h);
                      else handles.current.delete(idx);
                    }}
                  />
                );
              })}
            </span>
          ))}
        </div>
      </div>
      <KeyboardWithHands
        expectedKey={expectedKey}
        isDark={isDark}
        isColorful={isColorful}
        lastPress={lastPress}
        isHandsVisible={isHandsVisible}
      />
    </>
  );
}
