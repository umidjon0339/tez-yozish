import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardWithHands,
  type LayoutConfig,
} from "@/components/keyboard/KeyboardStage";
import type { StepNode } from "@/types/lesson";
import type { StepStats } from "@/lib/typing/progress";
import { createStatsSession, type StatsSession } from "@/lib/typing/stats";
import { chordKeys, chordMatchesEvent, parseChordToken } from "@/lib/typing/keyTokens";
import {
  applyDojoAction,
  initialDojoState,
  type DojoAction,
  type DojoState,
} from "@/lib/typing/dojoSim";
import type { Locale } from "@/lib/core/locale";
import { playErrorSound, playKeystrokeSound } from "../sfx";

// ─── SHORTCUT DOJO ───
// A tiny document the shortcuts REALLY act on: task cards ask for one
// shortcut at a time and the document reacts — select, copy, cut, paste,
// undo, redo. Wrong presses shake the card and count as mistakes.
const DOJO_CAP_GLYPHS: Record<string, string> = {
  ArrowRight: "→",
  ArrowLeft: "←",
};

export function ShortcutDojo({
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
  const tasks = useMemo(() => step.dojo?.tasks ?? [], [step.dojo]);
  const [state, setState] = useState<DojoState>(() =>
    initialDojoState(step.dojo?.doc ?? ""),
  );
  const [taskIdx, setTaskIdx] = useState(0);
  const [shake, setShake] = useState(false);

  const mistakes = useRef(0);
  const perKeyMistakes = useRef<Record<string, number>>({});
  const startTime = useRef<number | null>(null);
  const finished = useRef(false);
  const statsSession = useRef<StatsSession | null>(null);

  // Flush buffered keystroke stats (tz-stats-v1) when the step unmounts
  useEffect(() => () => statsSession.current?.end(), []);

  const task = tasks[taskIdx];
  const chord = useMemo(
    () => (task ? parseChordToken(task.do) : null),
    [task],
  );

  // All tasks done → report and finish
  useEffect(() => {
    if (task || finished.current) return;
    finished.current = true;
    const t = setTimeout(
      () =>
        onComplete({
          correct: tasks.length,
          mistakes: mistakes.current,
          timeMs: startTime.current ? Date.now() - startTime.current : 0,
          perKeyMistakes: { ...perKeyMistakes.current },
        }),
      700,
    );
    return () => clearTimeout(t);
  }, [task, tasks.length, onComplete]);

  useEffect(() => {
    if (!task || !chord) return;
    const handle = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Tab" || e.key === " ") e.preventDefault();
      // A modifier alone is never input — it may be the chord's first half
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key))
        return;
      // No shortcut or arrow may reach the browser while the dojo is open
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.startsWith("Arrow"))
        e.preventDefault();
      if (startTime.current === null) startTime.current = Date.now();

      if (chordMatchesEvent(chord, e)) {
        const result = applyDojoAction(state, task.do as DojoAction);
        if (result.ok) {
          (statsSession.current ??= createStatsSession()).stroke(
            task.do,
            true,
          );
          setState(result.next);
          if (isAudioEnabled) playKeystrokeSound();
          setTaskIdx((i) => i + 1);
        }
        return;
      }
      // Stray special keys (Enter, Escape, …) stay silent; a printable key,
      // an arrow or another shortcut is a real wrong attempt.
      if (
        e.key.length > 1 &&
        !e.key.startsWith("Arrow") &&
        !(e.ctrlKey || e.altKey || e.metaKey)
      ) {
        return;
      }
      mistakes.current += 1;
      perKeyMistakes.current[task.do] =
        (perKeyMistakes.current[task.do] || 0) + 1;
      (statsSession.current ??= createStatsSession()).stroke(
        task.do,
        false,
      );
      if (isAudioEnabled) playErrorSound();
      setShake(true);
      setTimeout(() => setShake(false), 250);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [task, chord, state, isAudioEnabled]);

  const sel = state.sel;

  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-4xl pt-4 animate-fade-in-up">
      <div className="font-sans text-center text-lg md:text-xl text-neutral-700 dark:text-neutral-300 mb-4 max-w-2xl z-10">
        {step.instruction[locale]}
      </div>

      {/* Task card */}
      <div
        className={`z-10 flex items-center gap-3 px-5 py-3 mb-4 rounded-xl border-2 bg-white dark:bg-neutral-900 shadow-md transition-colors ${
          shake
            ? "border-red-400 letter-shake"
            : "border-neutral-800 dark:border-neutral-300"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          {taskIdx + 1}/{tasks.length}
        </span>
        <span className="font-sans font-semibold text-neutral-900 dark:text-white">
          {task ? task.say[locale] : "✓"}
        </span>
        {task && (
          <span className="flex items-center gap-1 ml-1">
            {task.do.split("+").map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span className="text-neutral-400 text-xs font-bold">+</span>
                )}
                <kbd className="px-2 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-[0_2px_0_rgba(0,0,0,0.08)]">
                  {DOJO_CAP_GLYPHS[part] ?? part}
                </kbd>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>

      {/* The document the shortcuts act on */}
      <div className="z-10 w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 font-mono text-[10px] text-neutral-400">
            notes.txt
          </span>
        </div>
        <div className="px-4 py-4 min-h-[72px] font-mono text-lg leading-relaxed text-neutral-800 dark:text-neutral-200">
          {state.words.length === 0 ? (
            <span className="text-neutral-300 dark:text-neutral-700 select-none">
              (empty)
            </span>
          ) : (
            state.words.map((w, i) => (
              <span
                key={`${i}-${w}`}
                className={`transition-colors duration-150 rounded-sm px-0.5 ${
                  sel && i >= sel[0] && i < sel[1]
                    ? "bg-[#0383f2]/25 dark:bg-[#0383f2]/40"
                    : ""
                }`}
              >
                {w}{" "}
              </span>
            ))
          )}
        </div>
        {/* Clipboard tray */}
        <div className="px-4 py-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-sm">
          <span aria-hidden="true">📋</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {locale === "en"
              ? "Clipboard"
              : locale === "uz"
                ? "Klipbord"
                : "Буфер"}
          </span>
          {state.clip.length > 0 ? (
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 animate-in fade-in zoom-in-95 duration-300">
              {state.clip.join(" ")}
            </span>
          ) : (
            <span className="text-neutral-300 dark:text-neutral-700">—</span>
          )}
        </div>
      </div>

      <div className="w-full mt-auto pb-[140px]">
        <KeyboardWithHands
          expectedKey={chord ? chordKeys(chord) : null}
          isDark={isDark}
          isColorful={isColorful}
          isHandsVisible={isHandsVisible}
          config={layoutConfig}
        />
      </div>
    </div>
  );
}
