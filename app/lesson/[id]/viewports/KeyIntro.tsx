import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardWithHands,
  type LayoutConfig,
} from "@/components/keyboard/KeyboardStage";
import type { StepNode } from "@/types/lesson";
import type { StepStats } from "@/lib/progress";
import { createStatsSession, type StatsSession } from "@/lib/stats";
import { chordKeys, chordMatchesEvent, parseChordToken } from "@/lib/keyTokens";
import { playErrorSound, playKeystrokeSound } from "../sfx";
import { KEY_TOKEN_GLYPHS } from "../gymUnits";

export function KeyIntro({
  step,
  onComplete,
  isAudioEnabled,
  isDark,
  isColorful,
  isHandsVisible,
  locale,
  layoutConfig,
}: {
  step: StepNode;
  onComplete: (stats?: StepStats) => void;
  isAudioEnabled: boolean;
  isDark: boolean;
  isColorful: boolean;
  isHandsVisible: boolean;
  locale: "en" | "uz" | "ru";
  layoutConfig?: LayoutConfig;
}) {
  const sequence = useMemo(() => step.content, [step.content]);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<"INTRO" | "PRACTICE">("INTRO");
  const [shake, setShake] = useState(false);
  const consecutiveMistakes = useRef(0);
  const mistakes = useRef(0);
  const perKeyMistakes = useRef<Record<string, number>>({});
  const startTime = useRef<number | null>(null);
  const statsSession = useRef<StatsSession | null>(null);

  // Flush buffered keystroke stats (tz-stats-v1) when the step unmounts
  useEffect(() => () => statsSession.current?.end(), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = sequence[cursor];
      if (!target) return;
      // Never let Tab move focus or Space scroll mid-lesson
      if (e.key === "Tab" || e.key === " ") e.preventDefault();

      const chord = parseChordToken(target);
      let isMatch: boolean;
      if (chord) {
        // A modifier alone is never input — it may be the chord's first half
        if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) {
          return;
        }
        if (chordMatchesEvent(chord, e)) {
          isMatch = true;
          e.preventDefault(); // never trigger the real browser shortcut
        } else if (e.ctrlKey || e.altKey || e.metaKey) {
          e.preventDefault(); // a WRONG shortcut — block it, count the miss
          isMatch = false;
        } else if (e.key.length > 1) {
          return; // stray special keys are ignored silently
        } else {
          isMatch = false; // a plain character instead of the chord
        }
      } else {
        // Ignore browser combos (Ctrl/Alt/Meta + letter) for plain targets
        if ((e.ctrlKey || e.altKey || e.metaKey) && e.key.length === 1) return;
        // Special keys (Enter, CapsLock, Control, …) only count when the
        // step explicitly asks for them as a token.
        if (e.key.length > 1 && e.key !== "Backspace" && e.key !== target)
          return;
        if (e.key === target && target.length > 1) e.preventDefault();
        isMatch = e.key === target;
      }
      if (startTime.current === null) startTime.current = Date.now();
      (statsSession.current ??= createStatsSession()).stroke(
        target,
        isMatch,
      );

      if (isMatch) {
        consecutiveMistakes.current = 0;
        if (isAudioEnabled) playKeystrokeSound();
        const nextCursor = cursor + 1;
        setCursor(nextCursor);
        if (phase === "INTRO") {
          setPhase("PRACTICE");
        }
        if (nextCursor >= sequence.length) {
          onComplete({
            correct: sequence.length,
            mistakes: mistakes.current,
            timeMs: startTime.current ? Date.now() - startTime.current : 0,
            perKeyMistakes: { ...perKeyMistakes.current },
          });
        }
      } else {
        consecutiveMistakes.current += 1;
        mistakes.current += 1;
        const expected = target.toLowerCase();
        perKeyMistakes.current[expected] =
          (perKeyMistakes.current[expected] || 0) + 1;
        if (isAudioEnabled) playErrorSound();
        if (step.rules.blockOnTypo) {
          setShake(true);
          setTimeout(() => setShake(false), 200);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cursor,
    sequence,
    isAudioEnabled,
    onComplete,
    step.rules.blockOnTypo,
    phase,
  ]);

  const parseInstruction = (text: string, isIntro: boolean) => {
    if (!text) return null;
    const parts = text.split(/(\[\s*[^\s[\]]\s*\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[\s*[^\s[\]]\s*\]/)) {
        return (
          <strong
            key={i}
            className={`font-bold px-2.5 py-1 mx-1.5 rounded-lg shadow-sm inline-flex items-center justify-center min-w-[36px] border transition-all duration-500 ${isIntro ? "bg-[#0383f2] text-white border-[#026bce] transform scale-110 shadow-md" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"}`}
          >
            {part.replace(/[\[\]]/g, "").trim()}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center max-w-4xl w-full pt-4 animate-fade-in-up">
      {phase === "INTRO" && (
        <div className="font-mono text-xs md:text-sm uppercase tracking-widest text-neutral-400 mb-6 font-bold animate-fade-in-up">
          {locale === "en"
            ? "New Key Introduction"
            : locale === "uz"
              ? "Yangi tugma bilan tanishuv"
              : "Знакомство с новой клавишей"}
        </div>
      )}

      {/* Instruction is intro-only: after the first keypress the practice
          view stays clean — just the key sequence and the keyboard. */}
      {phase === "INTRO" && step.instruction && step.instruction[locale] && (
        <div className="font-sans text-center leading-relaxed z-10 text-3xl md:text-4xl text-neutral-800 dark:text-neutral-200 mb-12 max-w-3xl">
          {parseInstruction(step.instruction[locale], true)}
        </div>
      )}

      <div
        className={`flex flex-wrap justify-center gap-3 md:gap-4 transition-all duration-500 ease-out ${phase === "INTRO" ? "opacity-0 translate-y-8 pointer-events-none absolute" : "opacity-100 translate-y-0 relative mt-[8vh] mb-2"}`}
      >
        {sequence.map((char, i) => {
          const isPast = i < cursor;
          const isCurrent = i === cursor;
          // Special-key tokens render as icons or short labels on a wide keycap
          const label = KEY_TOKEN_GLYPHS[char] ?? char;
          let boxCls =
            `relative flex items-center justify-center h-14 sm:h-[4.25rem] rounded-md border-2 transition-all duration-150 select-none shadow-sm ${label.length > 1 ? "px-3 min-w-[4.5rem] " : "w-12 sm:w-[3.5rem] "}`;
          let charCls = `font-sans ${label.length > 1 ? "text-sm sm:text-base" : "text-2xl sm:text-3xl"} font-medium transition-colors `;

          if (isPast) {
            boxCls +=
              "border-[#50ce95] bg-[#e2f7e2] dark:border-[#50ce95]/50 dark:bg-[#e2f7e2]/10";
            charCls += "text-[#10c373] dark:text-[#50ce95]";
          } else if (isCurrent) {
            if (shake) {
              boxCls +=
                "border-red-400 bg-red-100 dark:border-red-500/50 dark:bg-red-950/40 transform scale-110 shadow-md ring-2 ring-red-200 dark:ring-red-900";
              charCls += "text-red-600 dark:text-red-400 font-semibold";
            } else {
              boxCls +=
                "border-neutral-800 bg-white dark:border-neutral-300 dark:bg-neutral-900 transform scale-110 shadow-md ring-2 ring-neutral-200 dark:ring-neutral-800 ring-offset-2 dark:ring-offset-neutral-950";
              charCls += "text-neutral-900 dark:text-white font-semibold";
            }
          } else {
            boxCls +=
              "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50";
            charCls += "text-neutral-400 dark:text-neutral-600";
          }

          return (
            <div key={i} className={boxCls}>
              {isPast && (
                <svg
                  viewBox="0 0 24 24"
                  className="absolute top-1 left-1 w-3 h-3 sm:w-4 sm:h-4 text-[#10c373] dark:text-[#50ce95]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              <span className={charCls}>{label === " " ? "␣" : label}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full mt-auto pb-[140px]">
        <KeyboardWithHands
          expectedKey={(() => {
            const target = sequence[cursor];
            if (!target) return null;
            const chord = parseChordToken(target);
            return chord ? chordKeys(chord) : target;
          })()}
          isDark={isDark}
          isColorful={isColorful}
          isHandsVisible={isHandsVisible}
          config={layoutConfig}
        />
      </div>
    </div>
  );
}
