"use client";

// Single-lesson workspace for the letter units — mounted by
// /english/letters/[letter]/[lesson] and /english/codes/[letter]/[lesson].
// One URL = one lesson (found in lib/english/letterCurriculum.ts by track + id);
// the runner mounts the stage for the lesson's `kind`, grades the run with
// the course star formula (computeLessonResult) and persists it under the
// letter-lesson progress key (tz-letters-v2).
//
// The workspace chrome (full-screen arena, tz-prefs-v1 toggles, StageScaler,
// keyboard + hands composite, imperative Letter handles, focus mode) is the
// lesson runtime's — module-local copies, as the lesson engine keeps its own.

import React, {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  Home,
  Keyboard as KeyboardIcon,
  Moon,
  RotateCcw,
  Star,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLocale, type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { LETTERS, type LetterInfo } from "@/lib/english/letters";
import { wordsForLetter, wordsForPair } from "@/lib/english/letterWords";
import {
  LETTER_SOUNDS,
  capsWords,
  dictationWords,
  positionWords,
  rivalsFor,
} from "@/lib/english/letterLearn";
import {
  computeLessonResult,
  type LessonResult,
} from "@/lib/typing/progress";
import {
  LETTER_TRACKS,
  letterLessonKey,
  lessonHref,
  trackHref,
  type LetterLesson,
  type LetterTrackId,
} from "@/lib/english/letterCurriculum";
import { LESSON_TYPES } from "@/lib/typing/lessonTypes";
import {
  letterDone,
  saveLetterLessonResult,
  useLetterProgress,
  type LetterProgressMap,
} from "@/lib/english/letterProgress";
import { createStatsSession, type StatsSession } from "@/lib/typing/stats";
import { NewKeyboard } from "@/components/keyboard/NewKeyboard";
import { Keyboard as HandsKeyboard } from "@/components/keyboard/hands";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignalFlag, SemaphoreFigure } from "@/components/LetterSignals";
import { LetterRain } from "@/components/letters/LetterRain";

const L = STR.letters;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ── Keystroke sounds — same mp3s and Web-Audio idiom as the lesson
   runtime (its sfx layer is file-local, so a minimal copy lives here). */
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

function loadSfx(url: string) {
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

const playKeySound = () => playSfx("/sounds/press_key4.mp3", 1, 0.3);
const playErrSound = () => playSfx("/sounds/error2.mp3", 0.8);

// Morse beeps: 640 Hz sine, dot = 1 unit, dash = 3, 1 unit between symbols.
function playMorse(code: string) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const unit = 0.09;
  let t = ctx.currentTime + 0.05;
  for (const sym of code) {
    const dur = sym === "-" ? unit * 3 : unit;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 640;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.setValueAtTime(0.35, t + Math.max(0.02, dur - 0.015));
    gain.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur + unit;
  }
}

/* ── Character-state model (mirrors the lesson runtime) ─────────────── */
const UNTYPED = 0;
const CORRECT = 1;
const INCORRECT = 2;
const CORRECT_FIXED = 3;
type CharState =
  | typeof UNTYPED
  | typeof CORRECT
  | typeof INCORRECT
  | typeof CORRECT_FIXED;

interface LetterHandle {
  setCharState: (s: CharState) => void;
  setIsCursor: (active: boolean) => void;
}

const Letter = memo(
  React.forwardRef<
    LetterHandle,
    { char: string; emphasis?: boolean; hidden?: boolean }
  >(function Letter({ char, emphasis, hidden }, ref) {
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
      } else if (emphasis && !hidden) {
        cls +=
          "text-neutral-500 dark:text-neutral-400 underline decoration-2 underline-offset-4 decoration-neutral-300 dark:decoration-neutral-600 ";
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
  }),
);
Letter.displayName = "Letter";

/* ── Stage scaler (copied from the lesson runtime) ───────────────────── */
const STAGE_W = 1100;
const STAGE_H = 780;

function StageScaler({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H, 1.15));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
    >
      <div
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        className="flex flex-col items-center shrink-0"
      >
        {children}
      </div>
    </div>
  );
}

/* ── Keyboard + hands composite — the lesson page's layout values ─────── */
const KB_SCALE = 0.85;
const KB_Y = -25;
const HANDS_SCALE = 1.53;
const HANDS_X = 37;
const HANDS_Y = 87;

interface KeyPressInfo {
  key: string;
  isCorrect: boolean;
  id: number;
}

function KeyboardWithHands({
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

/* ── Left rail: all 26 letters, linking to this track's hubs ─────────── */
function LettersRail({
  track,
  current,
  dimmed,
  progress,
}: {
  track: LetterTrackId;
  current: string;
  dimmed: boolean;
  progress: LetterProgressMap;
}) {
  return (
    <nav
      className={`hidden sm:flex flex-col items-center gap-0.5 py-2 px-2 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden shrink-0 transition-opacity duration-500 ${dimmed ? "opacity-30" : "opacity-100"}`}
    >
      {LETTERS.map((l) => {
        const isCur = l.char === current;
        const done = letterDone(progress, l.char, track);
        return (
          <Link
            key={l.char}
            href={trackHref(track, l.char)}
            title={l.char.toUpperCase()}
            className={[
              "relative w-7 h-7 shrink-0 rounded-md font-mono text-[12px] font-bold flex items-center justify-center transition-colors",
              isCur
                ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-900"
                : done
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-neutral-800",
            ].join(" ")}
          >
            {l.char}
            {done && !isCur && (
              <span
                aria-hidden
                className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Shared stage stats contract (subset of the lesson's StepStats) ──── */
interface StageStats {
  correct: number;
  mistakes: number;
  timeMs: number;
  perKeyMistakes: Record<string, number>;
}

/* ── GymStage — one typing drill over a text (TYPE/CAPS/HEAR/MIX) ────── */
function GymStage({
  text,
  emphasisChars = [],
  hidden = false,
  header,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  onWordStart,
  onDone,
}: {
  text: string;
  emphasisChars?: string[];
  hidden?: boolean;
  header?: React.ReactNode;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  onWordStart?: (word: string) => void;
  onDone: (stats: StageStats) => void;
}) {
  const chars = useMemo(() => text.split(""), [text]);
  const total = chars.length;

  // Tracker bookkeeping lives in refs (lesson-runtime invariant).
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
      // Lowercase targets are forgiving; capitals demand real Shift usage.
      const isCorrect =
        expected === expected.toLowerCase()
          ? e.key.toLowerCase() === expected
          : e.key === expected;

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
            <span
              key={w.start}
              className="inline-block whitespace-pre align-top"
            >
              {w.chars.map((c, j) => {
                const idx = w.start + j;
                return (
                  <Letter
                    key={idx}
                    char={c}
                    emphasis={emphasisChars.includes(c)}
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

/* ── MEET stage — shapes, name vs sound, the letter inside words ─────── */
function MeetStage({
  char,
  locale,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  onDone,
}: {
  char: string;
  locale: Locale;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  onDone: () => void;
}) {
  const info = LETTERS.find((l) => l.char === char)!;
  const sound = LETTER_SOUNDS[char];
  const positions = positionWords(char);
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);
  const pressId = useRef(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      const isCorrect = e.key.toLowerCase() === char;
      setLastPress({ key: e.key, isCorrect, id: ++pressId.current });
      if (isCorrect) {
        if (isAudioEnabled) playKeySound();
        onDoneRef.current();
      } else {
        if (isAudioEnabled) playErrSound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [char, isAudioEnabled]);

  const posLabel = { start: L.posStart, middle: L.posMiddle, end: L.posEnd };

  return (
    <>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Shapes: print + handwritten-ish (serif italic) */}
        <div className="flex items-end gap-3">
          {[
            { t: char.toUpperCase(), cls: "font-mono" },
            { t: char, cls: "font-mono" },
            { t: char.toUpperCase(), cls: "font-serif italic" },
            { t: char, cls: "font-serif italic" },
          ].map((s, i) => (
            <span
              key={i}
              className={`w-20 h-24 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center text-6xl text-neutral-900 dark:text-white shadow-sm ${s.cls}`}
            >
              {s.t}
            </span>
          ))}
        </div>

        {/* Name vs sound */}
        <div className="flex items-center gap-8 flex-wrap justify-center text-[15px]">
          <button
            type="button"
            onClick={() => speak(char)}
            className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              {L.nameLabel[locale]}
            </span>
            <span className="font-mono font-bold">{info.name}</span>
          </button>
          {sound && (
            <button
              type="button"
              onClick={() => speak(sound.word)}
              className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                {L.soundLabel[locale]}
              </span>
              <span className="font-mono font-bold">{sound.ipa}</span>
              <span className="text-neutral-500">
                {L.soundAsIn[locale]} {sound.word}
              </span>
            </button>
          )}
        </div>

        {/* The letter inside words: start / middle / end */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {positions.map((p) => {
            const idx =
              p.pos === "end" ? p.word.lastIndexOf(char) : p.word.indexOf(char);
            return (
              <div key={p.pos} className="text-center">
                <div className="font-mono text-2xl text-neutral-500 dark:text-neutral-400">
                  {p.word.slice(0, idx)}
                  <span className="text-neutral-950 dark:text-white font-bold underline decoration-amber-400 decoration-2 underline-offset-4">
                    {p.word[idx]}
                  </span>
                  {p.word.slice(idx + 1)}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                  {posLabel[p.pos][locale]}
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
          {L.pressToStart[locale].replace("{k}", char.toUpperCase())}
        </p>
      </div>
      <KeyboardWithHands
        expectedKey={char}
        isDark={isDark}
        isColorful={isColorful}
        lastPress={lastPress}
        isHandsVisible={isHandsVisible}
      />
    </>
  );
}

/* ── CODES_LEARN stage — the letter's five codes, with sound ─────────── */
function CodesLearnStage({
  char,
  locale,
  isDark,
  isColorful,
  isAudioEnabled,
  isHandsVisible,
  onDone,
}: {
  char: string;
  locale: Locale;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  onDone: () => void;
}) {
  const info = LETTERS.find((l) => l.char === char)!;
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);
  const pressId = useRef(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      const isCorrect = e.key.toLowerCase() === char;
      setLastPress({ key: e.key, isCorrect, id: ++pressId.current });
      if (isCorrect) {
        if (isAudioEnabled) playKeySound();
        onDoneRef.current();
      } else {
        if (isAudioEnabled) playErrSound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [char, isAudioEnabled]);

  const glyphLabel =
    "text-[10px] font-medium uppercase tracking-wide text-neutral-400";

  return (
    <>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Letter + NATO code word (speakable) */}
        <div className="flex items-center gap-5">
          <span className="w-20 h-24 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center font-mono text-6xl text-neutral-900 dark:text-white shadow-sm">
            {char.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => speak(info.nato)}
            className="inline-flex flex-col items-start gap-0.5 text-left border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-2xl font-extrabold text-neutral-900 dark:text-white">
              <Volume2 className="w-5 h-5 text-neutral-400" />
              {info.nato}
            </span>
            <span className="text-[13px] text-neutral-400">({info.say})</span>
          </button>
        </div>

        {/* The four visual codes */}
        <div className="flex items-end justify-center gap-10 flex-wrap">
          <span className="flex flex-col items-center gap-2">
            <SignalFlag char={char} className="h-16 w-16" />
            <span className={glyphLabel}>{L.flagLabel[locale]}</span>
          </span>
          <span className="flex flex-col items-center gap-2">
            <SemaphoreFigure angles={info.semaphore} className="h-[72px] w-[72px]" />
            <span className={glyphLabel}>{L.semaphoreLabel[locale]}</span>
          </span>
          <span className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => playMorse(info.morse)}
              title={L.playMorse[locale]}
              className="flex items-center gap-2 h-16 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 transition-colors cursor-pointer"
            >
              {info.morse.split("").map((s, i) => (
                <span
                  key={i}
                  className={`h-3 rounded-full bg-neutral-800 dark:bg-neutral-200 ${s === "-" ? "w-8" : "w-3"}`}
                />
              ))}
              <Volume2 className="w-4 h-4 text-neutral-400 ml-1" />
            </button>
            <span className={glyphLabel}>{L.morseLabel[locale]}</span>
          </span>
          <span className="flex flex-col items-center gap-2">
            <span className="grid w-fit grid-rows-3 grid-flow-col gap-1.5 h-16 content-center">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span
                  key={n}
                  className={`w-3.5 h-3.5 rounded-full ${
                    info.braille.includes(n)
                      ? "bg-neutral-900 dark:bg-white"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                />
              ))}
            </span>
            <span className={glyphLabel}>{L.brailleLabel[locale]}</span>
          </span>
        </div>

        <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
          {L.codesLearnHint[locale].replace("{k}", char.toUpperCase())}
        </p>
      </div>
      <KeyboardWithHands
        expectedKey={char}
        isDark={isDark}
        isColorful={isColorful}
        lastPress={lastPress}
        isHandsVisible={isHandsVisible}
      />
    </>
  );
}

/* ── The runner ──────────────────────────────────────────────────────── */
export function LetterLessonRunner({
  track,
  info,
  lesson,
}: {
  track: LetterTrackId;
  info: LetterInfo;
  lesson: LetterLesson;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const letterProgress = useLetterProgress();
  const char = info.char;
  const trackData = LETTER_TRACKS[track];
  const graded = LESSON_TYPES[lesson.type].graded;

  // Workspace prefs — same tz-prefs-v1 contract as the lesson runtime.
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(false);
  const [isHandsVisible, setIsHandsVisible] = useState(true);
  const prefsLoaded = useRef(false);

  // Hydration-safe localStorage load (same pattern as the lesson runtime).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem("tz-prefs-v1");
      if (rawPrefs) {
        const p = JSON.parse(rawPrefs);
        if (typeof p.dark === "boolean") setIsDark(p.dark);
        if (typeof p.audio === "boolean") setIsAudioEnabled(p.audio);
        if (typeof p.colorful === "boolean") setIsColorful(p.colorful);
        if (typeof p.hands === "boolean") setIsHandsVisible(p.hands);
      }
    } catch {}
    prefsLoaded.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!prefsLoaded.current) return;
    try {
      localStorage.setItem(
        "tz-prefs-v1",
        JSON.stringify({
          dark: isDark,
          audio: isAudioEnabled,
          colorful: isColorful,
          hands: isHandsVisible,
        }),
      );
    } catch {}
  }, [isDark, isAudioEnabled, isColorful, isHandsVisible]);

  // Focus mode — typing fades the chrome, pointer movement restores it.
  const [isFocusMode, setIsFocusMode] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsFocusMode(true);
      }
    };
    const onMove = () => setIsFocusMode(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    loadSfx("/sounds/press_key4.mp3");
    loadSfx("/sounds/error2.mp3");
  }, []);

  // ── Run engine: one stage per lesson ──
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const currentWord = useRef("");
  const gameSession = useRef<StatsSession | null>(null);

  const rivals = useMemo(() => rivalsFor(char), [char]);
  const progressKey = letterLessonKey(track, char, lesson.id);

  // Next implemented lesson in authored order; the hub when this is the last.
  const implemented = trackData.lessons.filter((l) => l.implemented);
  const myIdx = implemented.findIndex((l) => l.id === lesson.id);
  const nextLesson = myIdx >= 0 ? implemented[myIdx + 1] : undefined;
  const hubHref = trackHref(track, char);
  const nextHref = nextLesson
    ? lessonHref(track, char, nextLesson.id)
    : hubHref;

  const finish = useCallback(
    (stats: StageStats | null) => {
      gameSession.current?.end();
      gameSession.current = null;
      const targetWpm = lesson.kind === "RAIN" ? 0 : trackData.targetWpm;
      const res: LessonResult = stats
        ? computeLessonResult({ ...stats, skippedSteps: 0 }, targetWpm)
        : {
            stars: 0,
            wpm: 0,
            accuracy: 100,
            mistakes: 0,
            timeMs: 0,
            hardestKey: null,
            skipped: false,
          };
      saveLetterLessonResult(progressKey, res);
      setResult(res);
    },
    [lesson.kind, progressKey, trackData.targetWpm],
  );

  const retry = useCallback(() => {
    setResult(null);
    setRunId((r) => r + 1);
  }, []);

  const goNext = useCallback(() => {
    router.push(nextHref);
  }, [router, nextHref]);

  // Results keyboard: Enter → continue, R → retry.
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        retry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, goNext, retry]);

  const chromeCls = isFocusMode ? "opacity-30" : "opacity-100";
  const gymCommon = { isDark, isColorful, isAudioEnabled, isHandsVisible };
  const trackTitle = track === "letters" ? L.title : L.codesTitle;

  const myLessonIdx = trackData.lessons.findIndex((l) => l.id === lesson.id);

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col select-none">
        {/* ─── header (lesson-style) ─── */}
        <header
          className={`flex-shrink-0 w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 transition-all duration-500 ${chromeCls}`}
        >
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title={STR.notFound.home[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md -ml-2"
            >
              <Home size={19} strokeWidth={2} />
            </Link>
            <Link
              href={hubHref}
              title={L.allLessons[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="flex flex-col ml-2">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white leading-tight">
                {char.toUpperCase()}
                {char} — {lesson.title[locale]}
              </h1>
              <span className="text-[10px] md:text-xs text-neutral-400 font-medium">
                {trackTitle[locale]} ·{" "}
                {LESSON_TYPES[lesson.type].label[locale]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            <button
              onClick={() => setIsColorful(!isColorful)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isColorful ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isColorful}
            >
              <KeyboardIcon size={19} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsHandsVisible(!isHandsVisible)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isHandsVisible ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              aria-pressed={isHandsVisible}
            >
              <Hand size={19} strokeWidth={2} />
            </button>
            <PaletteSwitcher onSelect={() => setIsColorful(true)} />
            <span
              className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800"
              aria-hidden="true"
            />
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isAudioEnabled ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
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
              aria-pressed={isDark}
            >
              {isDark ? (
                <Sun size={19} strokeWidth={2} />
              ) : (
                <Moon size={19} strokeWidth={2} />
              )}
            </button>
            <span
              className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800"
              aria-hidden="true"
            />
            <LanguageSwitcher />
          </div>
        </header>

        {/* ─── workspace ─── */}
        <div className="flex flex-1 overflow-hidden relative">
          <LettersRail
            track={track}
            current={char}
            dimmed={isFocusMode}
            progress={letterProgress}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <main className="flex-1 min-h-0 w-full relative flex flex-col">
              {result ? (
                /* ─── results ─── */
                <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-500 px-6">
                  {graded ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-10 h-10 ${n <= result.stars ? "text-amber-400 fill-amber-400" : "text-neutral-200 dark:text-neutral-700"}`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                      <Check className="w-10 h-10 text-white" strokeWidth={3.5} />
                    </div>
                  )}
                  <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {L.greatJob[locale]}
                  </p>
                  {result.timeMs > 0 && (
                    <div className="flex items-center justify-center gap-10">
                      {[
                        {
                          label: STR.stats.avgWpm[locale],
                          value: `${result.wpm}`,
                          unit: STR.stats.wpmUnit[locale],
                        },
                        {
                          label: STR.compete.colAccuracy[locale],
                          value: `${result.accuracy}`,
                          unit: "%",
                        },
                        {
                          label: STR.stats.errors[locale],
                          value: String(result.mistakes),
                          unit: "",
                        },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
                            {s.value}
                            <span className="text-base text-neutral-400 ml-1">
                              {s.unit}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.hardestKey && (
                    <p className="text-[13px] text-neutral-500">
                      {STR.stats.trickyKey[locale]}:{" "}
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {result.hardestKey}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={retry}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-md px-3.5 py-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {STR.compete.retry[locale]}
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3.5 py-1.5 rounded-md transition-colors shadow-sm active:scale-95 cursor-pointer"
                    >
                      {nextLesson
                        ? `${L.nextLessonBtn[locale]}: ${nextLesson.title[locale]}`
                        : L.allLessons[locale]}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                    {L.pressEnterContinue[locale]} · {L.pressRRetry[locale]}
                  </p>
                </div>
              ) : (
                <StageScaler>
                  <div
                    key={`${char}-${lesson.id}-${runId}`}
                    className="relative flex-1 min-h-0 flex flex-col items-center justify-between gap-6 w-full max-w-4xl mx-auto select-none pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    {lesson.kind === "MEET" && (
                      <MeetStage
                        char={char}
                        locale={locale}
                        {...gymCommon}
                        onDone={() => finish(null)}
                      />
                    )}
                    {lesson.kind === "TYPE" && (
                      <GymStage
                        text={wordsForLetter(char).join(" ")}
                        emphasisChars={[char]}
                        {...gymCommon}
                        onDone={finish}
                      />
                    )}
                    {lesson.kind === "CAPS" && (
                      <GymStage
                        text={capsWords(char).join(" ")}
                        emphasisChars={[char, char.toUpperCase()]}
                        {...gymCommon}
                        onDone={finish}
                      />
                    )}
                    {lesson.kind === "HEAR" && (
                      <GymStage
                        text={dictationWords(char).join(" ")}
                        hidden
                        header={
                          <button
                            type="button"
                            onClick={() => speak(currentWord.current)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            {L.playAgain[locale]}
                          </button>
                        }
                        {...gymCommon}
                        onWordStart={(w) => {
                          currentWord.current = w;
                          speak(w);
                        }}
                        onDone={finish}
                      />
                    )}
                    {lesson.kind === "MIX" && (
                      <GymStage
                        text={wordsForPair(char, rivals).join(" ")}
                        emphasisChars={[char, ...rivals]}
                        header={
                          <div className="flex items-center gap-5">
                            {[char, ...rivals].map((c, i) => (
                              <span
                                key={c}
                                className="flex items-baseline gap-1.5"
                              >
                                <span
                                  className={`font-mono text-3xl font-bold ${i === 0 ? "text-neutral-950 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}
                                >
                                  {c}
                                </span>
                                {LETTER_SOUNDS[c] && (
                                  <span className="text-[11px] text-neutral-400 font-mono">
                                    {LETTER_SOUNDS[c].word}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        }
                        {...gymCommon}
                        onDone={finish}
                      />
                    )}
                    {lesson.kind === "RAIN" && (
                      <LetterRain
                        char={char}
                        rivals={rivals}
                        helpText={L.rainHelp[locale]}
                        startText={L.rainStart[locale]}
                        scoreText={L.scoreLabel[locale]}
                        onKeySound={isAudioEnabled ? playKeySound : () => {}}
                        onErrSound={isAudioEnabled ? playErrSound : () => {}}
                        onStroke={(c, ok) => {
                          if (!gameSession.current) {
                            gameSession.current = createStatsSession();
                          }
                          gameSession.current.stroke(c, ok);
                        }}
                        onDone={finish}
                      />
                    )}
                    {lesson.kind === "CODES_LEARN" && (
                      <CodesLearnStage
                        char={char}
                        locale={locale}
                        {...gymCommon}
                        onDone={() => finish(null)}
                      />
                    )}
                  </div>
                </StageScaler>
              )}
            </main>

            {/* ─── footer: hub link / lesson segments / next lesson ─── */}
            <footer
              className={`flex-shrink-0 w-full py-4 sm:py-5 px-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-500 z-20 flex items-center justify-between ${chromeCls}`}
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full gap-6">
                <Link
                  href={hubHref}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  ← {L.allLessons[locale]}
                </Link>
                <div
                  className="flex items-center gap-1.5 w-72 max-w-full"
                  aria-label={lesson.title[locale]}
                >
                  {trackData.lessons.map((l, i) => {
                    const passed =
                      letterProgress[letterLessonKey(track, char, l.id)]
                        ?.completed;
                    return (
                      <div
                        key={l.id}
                        title={l.title[locale]}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i === myLessonIdx
                            ? result
                              ? "bg-emerald-500"
                              : "bg-neutral-950 dark:bg-white animate-pulse"
                            : passed
                              ? "bg-emerald-500"
                              : "bg-neutral-200 dark:bg-neutral-800"
                        }`}
                      />
                    );
                  })}
                </div>
                <Link
                  href={nextHref}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {nextLesson ? nextLesson.title[locale] : L.allLessons[locale]}{" "}
                  →
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
