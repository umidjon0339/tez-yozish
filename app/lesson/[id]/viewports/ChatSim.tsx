import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardWithHands,
  type LayoutConfig,
} from "@/components/keyboard/KeyboardStage";
import type { StepNode } from "@/types/lesson";
import type { StepStats } from "@/lib/typing/progress";
import { createStatsSession, type StatsSession } from "@/lib/typing/stats";
import type { Locale } from "@/lib/core/locale";
import { playErrorSound, playKeystrokeSound } from "../sfx";
import {
  CORRECT,
  CORRECT_FIXED,
  INCORRECT,
  UNTYPED,
  type CharState,
} from "../typingCells";

// ─── CHAT SIMULATOR ───
// A tiny messenger: "them" bubbles arrive by themselves, "you" turns are
// typed live inside a composing bubble and sent with Enter — the key's real
// job. Modes and stats work exactly like the gym.
export function ChatSim({
  step,
  onComplete,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  locale,
  layoutConfig,
}: {
  step: StepNode;
  onComplete: (stats?: StepStats) => void;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  locale: Locale;
  layoutConfig?: LayoutConfig;
}) {
  const turns = useMemo(() => step.chat ?? [], [step.chat]);

  const [done, setDone] = useState(0); // turns already on screen (sent/received)
  const [cursor, setCursor] = useState(0); // slot inside the composing turn
  const [charStates, setCharStates] = useState<CharState[]>([]);

  const mistakes = useRef(0);
  const correct = useRef(0);
  const perKeyMistakes = useRef<Record<string, number>>({});
  const startTime = useRef<number | null>(null);
  const hadError = useRef<boolean[]>([]);
  const finished = useRef(false);
  const statsSession = useRef<StatsSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Flush buffered keystroke stats (tz-stats-v1) when the step unmounts
  useEffect(() => () => statsSession.current?.end(), []);

  const current = turns[done];
  const composing = current && current.from === "you" ? current.text : null;
  // Slots of the composing turn: its characters + the Enter that sends it
  const slotCount = composing ? composing.length + 1 : 0;

  // Fresh slate for every new composing turn
  useEffect(() => {
    setCursor(0);
    setCharStates(composing ? new Array(composing.length + 1).fill(UNTYPED) : []);
    hadError.current = composing
      ? new Array(composing.length + 1).fill(false)
      : [];
  }, [done, composing]);

  // "them" bubbles arrive by themselves; after the last turn, finish
  useEffect(() => {
    if (finished.current) return;
    if (!current) {
      finished.current = true;
      const t = setTimeout(
        () =>
          onComplete({
            correct: correct.current,
            mistakes: mistakes.current,
            timeMs: startTime.current ? Date.now() - startTime.current : 0,
            perKeyMistakes: { ...perKeyMistakes.current },
          }),
        600,
      );
      return () => clearTimeout(t);
    }
    if (current.from === "them") {
      const t = setTimeout(() => setDone((d) => d + 1), 700);
      return () => clearTimeout(t);
    }
  }, [current, done, onComplete]);

  // Keep the newest bubble in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [done, cursor]);

  const expectedKey: string | null = composing
    ? cursor < composing.length
      ? composing[cursor]
      : "Enter"
    : null;

  useEffect(() => {
    if (!composing || finished.current) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Tab") e.preventDefault();
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key))
        return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === "Backspace") {
        if (!step.rules.allowBackspace || cursor === 0) return;
        if (isAudioEnabled) playKeystrokeSound();
        setCharStates((s) => {
          const n = [...s];
          n[cursor - 1] = UNTYPED;
          return n;
        });
        setCursor(cursor - 1);
        return;
      }

      const target = cursor < composing.length ? composing[cursor] : "Enter";
      if (e.key.length > 1 && e.key !== target) return;
      if (target === "Enter") e.preventDefault();
      if (startTime.current === null) startTime.current = Date.now();

      const isMatch = e.key === target;
      (statsSession.current ??= createStatsSession()).stroke(
        target,
        isMatch,
      );
      if (!isMatch) {
        mistakes.current += 1;
        hadError.current[cursor] = true;
        perKeyMistakes.current[target] =
          (perKeyMistakes.current[target] || 0) + 1;
        if (isAudioEnabled) playErrorSound();
        if (step.rules.blockOnTypo) {
          setCharStates((s) => {
            const n = [...s];
            n[cursor] = INCORRECT;
            return n;
          });
          return;
        }
      } else {
        correct.current += 1;
        if (isAudioEnabled) playKeystrokeSound();
      }

      const newState = isMatch
        ? hadError.current[cursor]
          ? CORRECT_FIXED
          : CORRECT
        : INCORRECT;
      setCharStates((s) => {
        const n = [...s];
        n[cursor] = newState;
        return n;
      });

      const next = cursor + 1;
      if (next >= slotCount) {
        setDone((d) => d + 1); // message sent — bubble solidifies
      } else {
        setCursor(next);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [composing, cursor, slotCount, step.rules, isAudioEnabled]);

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-4xl pt-4 animate-fade-in-up">
      <div className="font-sans text-center text-lg md:text-xl text-neutral-700 dark:text-neutral-300 mb-4 max-w-2xl z-10">
        {step.instruction[locale]}
      </div>

      {/* Messenger card */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg overflow-hidden z-10">
        <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-sm">
            🙂
          </div>
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Chat
          </span>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div
          ref={scrollRef}
          className="h-[250px] overflow-y-auto px-3 py-3 flex flex-col gap-2 [scrollbar-width:thin]"
        >
          {turns.slice(0, done).map((t, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                t.from === "you"
                  ? "self-end bg-[#0383f2] text-white rounded-br-sm"
                  : "self-start bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-sm"
              }`}
            >
              {t.text}
            </div>
          ))}

          {/* Composing bubble — typed live, sent with Enter */}
          {composing && (
            <div className="self-end max-w-[85%] px-3 py-1.5 rounded-2xl rounded-br-sm border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-sm whitespace-nowrap overflow-x-auto">
              {composing.split("").map((ch, i) => {
                const st = charStates[i] ?? UNTYPED;
                let cls = "transition-colors duration-100 ";
                if (st === CORRECT) cls += "text-[#10c373] ";
                else if (st === CORRECT_FIXED) cls += "text-amber-500 ";
                else if (st === INCORRECT)
                  cls += "text-red-500 bg-red-500/10 rounded-sm ";
                else if (i === cursor)
                  cls +=
                    "text-neutral-900 dark:text-white font-bold border-b-2 border-amber-500 ";
                else cls += "text-neutral-300 dark:text-neutral-600 ";
                return (
                  <span key={i} className={cls}>
                    {ch === " " ? " " : ch}
                  </span>
                );
              })}
              <span
                className={`inline-flex items-center justify-center ml-1.5 px-1.5 rounded border text-[11px] align-middle ${
                  charStates[composing.length] === INCORRECT
                    ? "border-red-400 text-red-500 bg-red-500/10"
                    : cursor >= composing.length
                      ? "border-neutral-800 text-neutral-900 dark:border-neutral-200 dark:text-white font-bold"
                      : "border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600"
                }`}
              >
                ↵
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-auto pb-[140px]">
        <KeyboardWithHands
          expectedKey={expectedKey}
          isDark={isDark}
          isColorful={isColorful}
          isHandsVisible={isHandsVisible}
          config={layoutConfig}
        />
      </div>
    </div>
  );
}
