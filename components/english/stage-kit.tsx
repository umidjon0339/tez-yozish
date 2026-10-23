"use client";

// Shared primitives for the phoneme lesson stages (components/phonemes/
// stages/*). Everything here is a module-local copy of the lesson runtime's
// chrome — the course engine keeps its own (see PhonemeLessonRunner header).
//
// Word/phoneme playback goes through lib/english/phonemeAudio.ts (recordings first,
// TTS fallback); keystroke clicks stay on the mp3 Web-Audio layer below.

import React, {
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { NewKeyboard } from "@/components/keyboard/new_keyboard";
import { Keyboard as HandsKeyboard } from "@/components/keyboard/hands";

/* ── Keystroke sounds — same mp3s and Web-Audio idiom as the lesson
   runtime. */
let sfxCtx: AudioContext | null = null;
const sfxBuffers = new Map<string, AudioBuffer>();

function getSfxCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sfxCtx) {
    try {
      sfxCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return sfxCtx;
}

export function loadSfx(url: string) {
  const ctx = getSfxCtx();
  if (!ctx || sfxBuffers.has(url)) return;
  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      sfxBuffers.set(url, buffer);
    })
    .catch(() => {});
}

function playSfx(url: string, volume: number, maxSeconds?: number) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const buffer = sfxBuffers.get(url);
  if (!buffer) {
    loadSfx(url);
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(volume, t0);
  const dur = Math.min(maxSeconds ?? buffer.duration, buffer.duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t0, 0, dur + 0.01);
}

export const playKeySound = () => playSfx("/press_key4.mp3", 1, 0.3);
export const playErrSound = () => playSfx("/error2.mp3", 0.8);

/* ── Character-state model (mirrors the lesson runtime) ─────────────── */
export const UNTYPED = 0;
export const CORRECT = 1;
export const INCORRECT = 2;
export const CORRECT_FIXED = 3;
export type CharState =
  | typeof UNTYPED
  | typeof CORRECT
  | typeof INCORRECT
  | typeof CORRECT_FIXED;

export interface LetterHandle {
  setCharState: (s: CharState) => void;
  setIsCursor: (active: boolean) => void;
}

export const Letter = memo(
  React.forwardRef<LetterHandle, { char: string; hidden?: boolean }>(
    function Letter({ char, hidden }, ref) {
      const [state, setState] = useState<CharState>(UNTYPED);
      const [isCursor, setIsCursor] = useState(false);

      useImperativeHandle(ref, () => ({
        setCharState: setState,
        setIsCursor,
      }));

      let cls = "transition-colors duration-150 inline-block relative ";
      if (state === UNTYPED) {
        if (isCursor) {
          cls +=
            "text-neutral-900 dark:text-white font-bold border-b-[3px] border-amber-500 ";
        } else {
          cls += "text-neutral-400 dark:text-neutral-600 ";
        }
      } else if (state === CORRECT) {
        cls += "text-[#10c373] dark:text-[#50ce95] letter-pop ";
      } else if (state === CORRECT_FIXED) {
        cls += "text-amber-500 dark:text-amber-400 letter-pop ";
      } else {
        cls +=
          "text-red-500 dark:text-red-400 bg-red-500/10 rounded-sm letter-shake ";
      }

      const revealed = state === CORRECT || state === CORRECT_FIXED;
      const shown = hidden && !revealed ? "•" : char === " " ? " " : char;
      return <span className={cls}>{shown}</span>;
    },
  ),
);
Letter.displayName = "Letter";

/* ── Shared stage stats contract (subset of the lesson's StepStats) ──── */
export interface StageStats {
  correct: number;
  mistakes: number;
  timeMs: number;
  perKeyMistakes: Record<string, number>;
}

/* ── Keyboard + hands composite — the lesson page's layout values ─────── */
const KB_SCALE = 0.85;
const KB_Y = -25;
const HANDS_SCALE = 1.53;
const HANDS_X = 37;
const HANDS_Y = 87;

export interface KeyPressInfo {
  key: string;
  isCorrect: boolean;
  id: number;
}

export interface StageChromeProps {
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
}

export function KeyboardWithHands({
  expectedKey,
  isDark,
  isColorful,
  lastPress,
  isHandsVisible,
}: {
  expectedKey: string | null;
  isDark: boolean;
  isColorful: boolean;
  lastPress: KeyPressInfo | null;
  isHandsVisible: boolean;
}) {
  return (
    <div
      className={`kb-stage relative w-full max-w-4xl aspect-[683.3/254] mx-auto mt-auto ${isColorful ? "colorful-mode" : ""}`}
    >
      <div className="absolute top-0 left-0 z-0 w-full h-full flex justify-center items-end">
        <NewKeyboard
          expectedKey={expectedKey}
          scale={KB_SCALE}
          offsetX={0}
          offsetY={KB_Y}
          lastPress={lastPress}
        />
      </div>
      {isHandsVisible && (
        <div className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full opacity-90 overflow-visible flex justify-center items-end">
          <HandsKeyboard
            expectedKey={expectedKey}
            className={`w-full h-full overflow-visible ${isDark ? "theme-dark" : "theme-bone"}`}
            scale={HANDS_SCALE}
            offsetX={HANDS_X}
            offsetY={HANDS_Y}
          />
        </div>
      )}
    </div>
  );
}

/* ── Word with the sound's spelling highlighted ("sh" in "ship") ─────── */
export function SpelledWord({ word, spell }: { word: string; spell: string }) {
  const idx = word.indexOf(spell);
  if (idx < 0) return <span className="font-mono">{word}</span>;
  return (
    <span className="font-mono">
      {word.slice(0, idx)}
      <span className="text-neutral-950 dark:text-white font-bold underline decoration-amber-400 decoration-2 underline-offset-4">
        {spell}
      </span>
      {word.slice(idx + spell.length)}
    </span>
  );
}

/* ── Choice-stage helpers (PAIRS / SPELL / MASTER / ODD share these) ──── */

/** Round counter + optional context row, the header of every choice stage. */
export function RoundHeader({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-mono text-[12px] uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Answer-card class builder shared by the choice stages. `state` is null
 *  while unanswered; after answering, cards show correct / picked-wrong /
 *  dimmed. */
export function choiceCardCls(
  state: null | "correct" | "wrong" | "dim",
  extra = "",
): string {
  const base = `rounded-xl border-2 text-center font-mono font-bold shadow-sm transition-all select-none ${extra} `;
  if (state === null) {
    return (
      base +
      "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:border-neutral-950 dark:hover:border-white cursor-pointer"
    );
  }
  if (state === "correct") {
    return base + "border-emerald-500 bg-emerald-500/10 text-emerald-600";
  }
  if (state === "wrong") {
    return base + "border-red-500 bg-red-500/10 text-red-500 letter-shake";
  }
  return (
    base +
    "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-300 dark:text-neutral-600"
  );
}

/** Shuffle a copy (mount-time randomness only — never during render of
 *  server components; stages call this inside effects or initializers). */
export function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Keep the latest callback in a ref (stage idiom for onDone). */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = React.useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/* ── Typed-answer input (the writing-first stages) ──────────────────────
   One window keydown listener per stage: a–z appends, Backspace deletes,
   Enter submits the non-empty buffer. The stage owns correctness. */

export function useAnswerInput({
  active,
  maxLen,
  isAudioEnabled,
  onSubmit,
}: {
  /** Keystrokes are ignored while false (feedback pause, stage done). */
  active: boolean;
  maxLen?: number;
  isAudioEnabled: boolean;
  /** Called with the buffer on Enter (or when maxLen is reached). */
  onSubmit: (typed: string) => void;
}): { typed: string; reset: () => void } {
  const [typed, setTyped] = useState("");
  const stateRef = useRef({ active, maxLen, isAudioEnabled, onSubmit, typed });
  useEffect(() => {
    stateRef.current = { active, maxLen, isAudioEnabled, onSubmit, typed };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.active) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (s.typed.length > 0) s.onSubmit(s.typed);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setTyped((t) => t.slice(0, -1));
        return;
      }
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        e.preventDefault();
        const next = (s.typed + e.key.toLowerCase()).slice(
          0,
          s.maxLen ?? 40,
        );
        if (next !== s.typed && s.isAudioEnabled) playKeySound();
        setTyped(next);
        // Fixed-length answers submit themselves when full.
        if (s.maxLen !== undefined && next.length === s.maxLen) {
          setTimeout(() => stateRef.current.onSubmit(next), 120);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reset = React.useCallback(() => setTyped(""), []);
  return { typed, reset };
}

export type AnswerState = null | "correct" | "wrong";

/** Free-length answer line with a blinking caret. */
export function AnswerLine({
  typed,
  state,
}: {
  typed: string;
  state: AnswerState;
}) {
  const color =
    state === "correct"
      ? "text-emerald-500"
      : state === "wrong"
        ? "text-red-500 letter-shake"
        : "text-neutral-900 dark:text-white";
  return (
    <div
      className={`min-h-14 min-w-56 px-6 rounded-xl border-2 flex items-center justify-center font-mono text-3xl font-bold tracking-wide transition-colors ${
        state === "correct"
          ? "border-emerald-500 bg-emerald-500/10"
          : state === "wrong"
            ? "border-red-500 bg-red-500/10"
            : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
      } ${color}`}
    >
      {typed}
      {state === null && (
        <span className="inline-block w-0.5 h-8 ml-0.5 bg-amber-500 animate-pulse" />
      )}
    </div>
  );
}

/** Fixed-length letter slots ("_ _" boxes) for spelling answers. */
export function LetterSlots({
  length,
  typed,
  state,
  reveal,
}: {
  length: number;
  typed: string;
  state: AnswerState;
  /** Shown in the slots after a wrong answer (the correct letters). */
  reveal?: string;
}) {
  // After a wrong answer the slots reveal the CORRECT letters — shown in
  // emerald over the red border, so they read as "the fix", not the error.
  const slotCls = (filled: boolean) =>
    `inline-flex items-center justify-center w-[1.1em] h-[1.35em] mx-0.5 rounded-md border-b-4 font-mono font-bold transition-colors ${
      state === "correct"
        ? "border-emerald-500 text-emerald-500"
        : state === "wrong"
          ? reveal
            ? "border-red-500 text-emerald-500"
            : "border-red-500 text-red-500"
          : filled
            ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
            : "border-amber-500 text-transparent"
    }`;
  return (
    <span className={state === "wrong" ? "letter-shake inline-block" : "inline-block"}>
      {Array.from({ length }, (_, i) => (
        <span key={i} className={slotCls(i < typed.length)}>
          {state === "wrong" && reveal ? reveal[i] : (typed[i] ?? "·")}
        </span>
      ))}
    </span>
  );
}
