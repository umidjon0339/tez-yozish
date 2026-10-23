import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardWithHands,
  type LayoutConfig,
  type KeyPressInfo,
} from "@/components/keyboard/KeyboardStage";
import type { StepNode } from "@/types/lesson";
import type { StepStats } from "@/lib/typing/progress";
import { createStatsSession, type StatsSession } from "@/lib/typing/stats";
import { chordMatchesEvent } from "@/lib/typing/keyTokens";
import { playErrorSound, playKeystrokeSound } from "../sfx";
import {
  CORRECT,
  CORRECT_FIXED,
  INCORRECT,
  KeyCapUnit,
  Letter,
  UNTYPED,
  type LetterHandle,
} from "../typingCells";
import {
  buildGymUnits,
  unitExpectedKeys,
  unitStatKey,
  type GymUnit,
} from "../gymUnits";

// ─── BOMB-PROOF PRACTICE TRACKER ───
export function PracticeTracker({
  step,
  onComplete,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  layoutConfig,
}: {
  step: StepNode;
  onComplete: (stats?: StepStats) => void;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  layoutConfig?: LayoutConfig;
}) {
  const units = useMemo(() => buildGymUnits(step.content), [step.content]);
  const total = units.length;
  // Any Enter unit turns the text into a real left-aligned document block
  const isMultiline = useMemo(
    () => units.some((u) => u.kind === "key" && u.key === "Enter"),
    [units],
  );

  const buffer = useRef<Uint8Array>(new Uint8Array(total));
  const hasError = useRef<boolean[]>(new Array(total).fill(false));
  const cursor = useRef<number>(0);
  const done = useRef(false);
  const mistakesCount = useRef<number>(0);
  const consecutiveMistakes = useRef<number>(0);
  const correctCount = useRef<number>(0);
  const perKeyMistakes = useRef<Record<string, number>>({});
  const startTime = useRef<number | null>(null);
  const statsSession = useRef<StatsSession | null>(null);
  const streak = useRef<number>(0);
  const streakWrapRef = useRef<HTMLDivElement>(null);
  const streakNumRef = useRef<HTMLSpanElement>(null);
  const toastRef = useRef<HTMLSpanElement>(null);

  const letterMap = useRef<Map<number, LetterHandle>>(new Map());
  const [activeKey, setActiveKey] = useState<string | string[] | null>(
    units[0] ? unitExpectedKeys(units[0]) : null,
  );
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);
  // Fix-the-typo drills: indices of prefilled WRONG letters still on screen.
  // While any remain, the only accepted key is Backspace.
  const prefillWrong = useRef<Set<number>>(new Set());

  const smoothCursorRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  // Letters are nested inside per-word spans, so offsets resolve against the
  // positioned scroll box rather than the letter's immediate parent.
  const updateSmoothCursor = useCallback((index: number) => {
    const node = letterMap.current.get(index)?.getDomNode();
    const box = scrollBoxRef.current;
    if (node && box && smoothCursorRef.current) {
      smoothCursorRef.current.style.opacity = "1";
      smoothCursorRef.current.style.left = `${node.offsetLeft}px`;
      smoothCursorRef.current.style.top = `${node.offsetTop}px`;
      smoothCursorRef.current.style.height = `${node.offsetHeight}px`;

      box.scrollTo({
        top: node.offsetTop - box.offsetHeight / 2 + node.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  }, []);

  // Group units by word so a line never wraps in the middle of one, and
  // split into document lines after every Enter unit.
  const lines = useMemo(() => {
    const isWordChar = (u: GymUnit | undefined) =>
      !!u && u.kind === "char" && u.char !== " ";
    const result: { start: number; units: GymUnit[] }[][] = [[]];
    let i = 0;
    while (i < units.length) {
      const u = units[i];
      if (isWordChar(u)) {
        const start = i;
        const word: GymUnit[] = [];
        while (isWordChar(units[i])) {
          word.push(units[i]);
          i += 1;
        }
        result[result.length - 1].push({ start, units: word });
      } else {
        result[result.length - 1].push({ start: i, units: [u] });
        i += 1;
        if (u.kind === "key" && u.key === "Enter") result.push([]);
      }
    }
    // Text ending on Enter leaves an empty trailing line — drop it
    if (result.length > 1 && result[result.length - 1].length === 0) {
      result.pop();
    }
    return result;
  }, [units]);

  // Streak display updates imperatively (same zero-re-render pattern as Letter)
  const updateStreakDisplay = useCallback(() => {
    const wrap = streakWrapRef.current;
    const num = streakNumRef.current;
    if (!wrap || !num) return;
    const s = streak.current;
    num.textContent = String(s);
    wrap.style.opacity = s >= 5 ? "1" : "0";

    // Milestone toast at 10 / 25 / 50 / 100 in a row
    if (s === 10 || s === 25 || s === 50 || s === 100) {
      const t = toastRef.current;
      if (t) {
        t.textContent = `🔥 ${s}!`;
        t.classList.remove("streak-toast-show");
        void t.offsetWidth; // restart the animation
        t.classList.add("streak-toast-show");
      }
    }
  }, []);

  const resetTracker = useCallback(() => {
    buffer.current = new Uint8Array(units.length);
    hasError.current = new Array(units.length).fill(false);
    cursor.current = 0;
    done.current = false;
    mistakesCount.current = 0;
    consecutiveMistakes.current = 0;
    correctCount.current = 0;
    perKeyMistakes.current = {};
    startTime.current = null;
    streak.current = 0;
    prefillWrong.current = new Set();
    updateStreakDisplay();

    setTimeout(() => {
      letterMap.current.forEach((h) => {
        h.setCharState(UNTYPED);
        h.setIsCursor(false);
        h.setOverrideChar?.(null);
      });

      // Fix-the-typo: lay the prefilled (partly wrong) text onto the units.
      // The validator guarantees prefill aligns unit-for-unit with the text.
      const preUnits = step.prefill ? buildGymUnits(step.prefill) : [];
      let start = 0;
      if (preUnits.length > 0 && preUnits.length <= units.length) {
        for (let i = 0; i < preUnits.length; i++) {
          const pu = preUnits[i];
          const tu = units[i];
          const ok =
            pu.kind === "char" && tu.kind === "char" && pu.char === tu.char;
          buffer.current[i] = ok ? CORRECT : INCORRECT;
          if (!ok) {
            hasError.current[i] = true;
            prefillWrong.current.add(i);
            if (pu.kind === "char") {
              letterMap.current.get(i)?.setOverrideChar?.(pu.char);
            }
          }
          letterMap.current.get(i)?.setCharState(ok ? CORRECT : INCORRECT);
        }
        start = preUnits.length;
        cursor.current = start;
      }

      letterMap.current.get(start)?.setIsCursor(true);
      updateSmoothCursor(start);
      setActiveKey(
        prefillWrong.current.size > 0
          ? "Backspace"
          : units[start]
            ? unitExpectedKeys(units[start])
            : null,
      );
    }, 10);
  }, [units, step.prefill, updateSmoothCursor, updateStreakDisplay]);

  useEffect(() => {
    resetTracker();
  }, [resetTracker]);

  useEffect(() => {
    const handleResize = () => {
      if (!done.current) updateSmoothCursor(cursor.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateSmoothCursor]);

  // Flush buffered keystroke stats (tz-stats-v1) when the step unmounts
  useEffect(() => () => statsSession.current?.end(), []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (done.current) return;
      // Space must never scroll, Tab must never move focus mid-step
      if (e.key === " " || e.key === "Tab") e.preventDefault();

      const curr = cursor.current;

      if (e.key === "Backspace") {
        if (!step.rules.allowBackspace) return;
        consecutiveMistakes.current = 0;
        if (isAudioEnabled) playKeystrokeSound();
        if (curr === 0) return;
        const prev = curr - 1;
        // Erasing a prefilled wrong letter clears its typo from the screen
        if (prefillWrong.current.has(prev)) {
          prefillWrong.current.delete(prev);
          letterMap.current.get(prev)?.setOverrideChar?.(null);
        }
        buffer.current[prev] = UNTYPED;
        letterMap.current.get(prev)?.setCharState(UNTYPED);
        letterMap.current.get(curr)?.setIsCursor(false);
        letterMap.current.get(prev)?.setIsCursor(true);
        cursor.current = prev;
        setActiveKey(
          prefillWrong.current.size > 0
            ? "Backspace"
            : units[prev]
              ? unitExpectedKeys(units[prev])
              : null,
        );
        updateSmoothCursor(prev);
        return;
      }

      // Fix-the-typo: while wrong prefilled letters remain, Backspace is the
      // only way forward — typing just beeps (the keyboard shows Backspace).
      if (prefillWrong.current.size > 0) {
        if (e.key.length > 1) return; // modifiers & special keys stay silent
        if (isAudioEnabled) playErrorSound();
        return;
      }

      if (curr >= total) return;
      const unit = units[curr];

      // A modifier on its own is never input — it may be the start of a chord
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) {
        return;
      }

      let isMatch = false;
      if (unit.kind === "chord") {
        if (chordMatchesEvent(unit.chord, e)) {
          isMatch = true;
          e.preventDefault(); // never trigger the real browser shortcut
        } else if (e.ctrlKey || e.altKey || e.metaKey) {
          e.preventDefault(); // a WRONG shortcut — block it, count the miss
        } else if (e.key.length > 1) {
          return; // stray special key — ignored, same as KEY_INTRO
        }
        // plain character instead of the chord → counts as a mistake
      } else if (e.ctrlKey || e.altKey || e.metaKey) {
        // Browser/system combos never count while plain input is expected
        return;
      } else if (unit.kind === "key") {
        if (e.key === unit.key) {
          isMatch = true;
          e.preventDefault();
        } else if (e.key.length > 1) {
          return; // other special keys are ignored silently
        }
        // a printed character instead of Enter/Tab → mistake
      } else {
        if (e.key.length > 1) return;
        isMatch = e.key === unit.char;
      }

      if (startTime.current === null) startTime.current = Date.now();
      (statsSession.current ??= createStatsSession()).stroke(
        unitStatKey(unit),
        isMatch,
      );

      if (!isMatch) {
        hasError.current[curr] = true;
        mistakesCount.current += 1;
        consecutiveMistakes.current += 1;
        const statKey = unitStatKey(unit);
        perKeyMistakes.current[statKey] =
          (perKeyMistakes.current[statKey] || 0) + 1;
        streak.current = 0;
        updateStreakDisplay();

        if (isAudioEnabled) playErrorSound();

        if (step.rules.blockOnTypo) {
          letterMap.current.get(curr)?.setCharState(INCORRECT);
          return; // Halt progress until correct key pressed
        }
      } else {
        consecutiveMistakes.current = 0;
        correctCount.current += 1;
        streak.current += 1;
        updateStreakDisplay();
        if (isAudioEnabled) playKeystrokeSound();
      }

      const newState = isMatch
        ? hasError.current[curr]
          ? CORRECT_FIXED
          : CORRECT
        : INCORRECT;

      setLastPress({ key: e.key, isCorrect: isMatch, id: Date.now() });

      buffer.current[curr] = newState;
      letterMap.current.get(curr)?.setCharState(newState);
      letterMap.current.get(curr)?.setIsCursor(false);

      const next = curr + 1;
      cursor.current = next;

      if (next < total) {
        letterMap.current.get(next)?.setIsCursor(true);
        setActiveKey(unitExpectedKeys(units[next]));
        updateSmoothCursor(next);
      } else {
        if (smoothCursorRef.current) {
          smoothCursorRef.current.style.opacity = "0";
        }
        done.current = true;
        setActiveKey(null);
        statsSession.current?.end();
        const stats: StepStats = {
          correct: correctCount.current,
          mistakes: mistakesCount.current,
          timeMs: startTime.current ? Date.now() - startTime.current : 0,
          perKeyMistakes: { ...perKeyMistakes.current },
        };
        setTimeout(() => onComplete(stats), 200);
      }
    },
    [
      total,
      units,
      onComplete,
      isAudioEnabled,
      updateSmoothCursor,
      updateStreakDisplay,
      step,
      resetTracker,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div
      className="relative flex-1 flex flex-col items-center justify-between gap-6 w-full max-w-4xl mx-auto select-none pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Live streak counter — visible from 5 correct keys in a row */}
      <div
        ref={streakWrapRef}
        aria-hidden="true"
        className="absolute top-1 right-4 z-20 flex items-center gap-1 font-mono text-sm font-bold text-amber-500 opacity-0 transition-opacity duration-300 pointer-events-none"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <span ref={streakNumRef}>0</span>
      </div>
      {/* Streak milestone toast (🔥 10! / 25! / 50!) */}
      <span
        ref={toastRef}
        aria-hidden="true"
        className="streak-toast absolute top-8 right-4 z-20 font-mono text-sm font-bold text-amber-500 pointer-events-none select-none"
      />
      <div
        ref={scrollBoxRef}
        className={`relative w-full text-center px-4 font-mono leading-tight sm:leading-relaxed tracking-wide select-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          total > 90
            ? "text-xl sm:text-3xl max-h-[150px] sm:max-h-[190px]"
            : total > 48
              ? "text-2xl sm:text-4xl max-h-[146px] sm:max-h-[180px]"
              : "text-3xl sm:text-5xl max-h-[140px] sm:max-h-[160px]"
        }`}
        style={{ overflowWrap: "break-word" }}
      >
        <div
          ref={smoothCursorRef}
          className="absolute w-[3px] bg-amber-500 transition-[left,top,height,opacity] duration-150 ease-[cubic-bezier(0.3,1.4,0.4,1)] rounded-full pointer-events-none z-10 animate-pulse"
          style={{ opacity: 0 }}
        />
        <div className={isMultiline ? "inline-block text-left" : undefined}>
          {lines.map((line, li) => (
            <div key={li}>
              {line.map((group) => {
                const first = group.units[0];
                // Key / chord units render as an inline keycap
                if (first.kind !== "char") {
                  return (
                    <KeyCapUnit
                      key={group.start}
                      label={first.label}
                      ref={(node) => {
                        if (node) letterMap.current.set(group.start, node);
                        else letterMap.current.delete(group.start);
                      }}
                    />
                  );
                }
                const letters = group.units.map((u, k) => {
                  const i = group.start + k;
                  return (
                    <Letter
                      key={i}
                      char={u.kind === "char" ? u.char : ""}
                      ref={(node) => {
                        if (node) letterMap.current.set(i, node);
                        else letterMap.current.delete(i);
                      }}
                    />
                  );
                });
                if (first.char === " ") return letters;
                return (
                  <span
                    key={group.start}
                    className="inline-block whitespace-nowrap align-top"
                  >
                    {letters}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full mt-auto pb-[140px]">
        <KeyboardWithHands
          expectedKey={activeKey}
          isDark={isDark}
          isColorful={isColorful}
          lastPress={lastPress}
          isHandsVisible={isHandsVisible}
          config={layoutConfig}
        />
      </div>
    </div>
  );
}
