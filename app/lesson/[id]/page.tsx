"use client";

import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { course as courseData } from "@/lib/curriculum";
import { SectionNode, LessonNode, StepNode } from "@/types/lesson";
import { NewKeyboard } from "@/components/keyboard/new_keyboard";
import { Keyboard as HandsKeyboard } from "@/components/keyboard/hands";
import { HandStyleSwitcher } from "@/components/keyboard/HandStyleSwitcher";
import { getHandStyle, useHandStyle, type HandArtVariant } from "@/components/keyboard/handStyle";
import { Mascot } from "@/components/Mascot";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";
import { ChapterRail, LessonRail } from "@/components/lesson/Rails";
import {
  StepStats,
  LessonRunStats,
  LessonResult,
  ProgressMap,
  computeLessonResult,
  computeUnlocked,
  saveLessonResult,
  getProgress,
} from "@/lib/progress";
import { isGradedType } from "@/lib/lessonTypes";
import {
  createStatsSession,
  recordAttempt,
  type StatsSession,
} from "@/lib/stats";
import {
  isSpecialToken,
  parseChordToken,
  chordMatchesEvent,
  chordKeys,
  type ChordToken,
} from "@/lib/keyTokens";
import {
  initialDojoState,
  applyDojoAction,
  type DojoAction,
  type DojoState,
} from "@/lib/dojoSim";
import { useLocale, type Locale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Home,
  ChevronLeft,
  Keyboard as KeyboardIcon,
  Hand,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";

const emptyRun = (): LessonRunStats => ({
  correct: 0,
  mistakes: 0,
  timeMs: 0,
  perKeyMistakes: {},
  skippedSteps: 0,
});

// Small chrome strings (lesson data itself is localized in lessons.json)
const UI = {
  step: { en: "Step", uz: "Qadam", ru: "Шаг" },
  home: { en: "Home", uz: "Bosh sahifa", ru: "Главная" },
  backToCourse: { en: "Back to course", uz: "Kursga qaytish", ru: "Назад к курсу" },
  colorfulKeys: { en: "Key colors", uz: "Tugma ranglari", ru: "Цвета клавиш" },
  handsOverlay: { en: "Show hands", uz: "Qo'llarni ko'rsatish", ru: "Показать руки" },
  sound: { en: "Sound", uz: "Ovoz", ru: "Звук" },
  darkMode: { en: "Dark mode", uz: "Tungi rejim", ru: "Тёмная тема" },
  viewportNames: {
    POSTURE_CHECK: { en: "Posture", uz: "Holat", ru: "Поза" },
    KEY_INTRO: { en: "New Key", uz: "Yangi tugma", ru: "Новая клавиша" },
    STANDARD_GYM: { en: "Practice", uz: "Mashq", ru: "Практика" },
    GAME_NINJA_RUN: { en: "Game", uz: "O'yin", ru: "Игра" },
    CHAT_SIM: { en: "Chat", uz: "Chat", ru: "Чат" },
    SHORTCUT_DOJO: { en: "Shortcuts", uz: "Tez tugmalar", ru: "Комбинации" },
  } as Record<string, Record<Locale, string>>,
  chapterShort: { en: "Ch", uz: "Bob", ru: "Гл." },
  keysLabel: { en: "Keys", uz: "Tugmalar", ru: "Клавиши" },
  practiceHeading: { en: "Practice", uz: "Mashqlar", ru: "Практика" },
  gamesHeading: { en: "Games", uz: "O'yinlar", ru: "Игры" },
  prev: { en: "← Prev", uz: "← Orqaga", ru: "← Назад" },
  skip: { en: "Skip →", uz: "O'tkazish →", ru: "Пропустить →" },
  layoutWarning: {
    en: "Your keyboard is typing Cyrillic letters — switch it to the English (Latin) layout to practice.",
    uz: "Klaviaturangiz kirill harflarini yozmoqda — mashq qilish uchun ingliz (lotin) alifbosiga o'tkazing.",
    ru: "Ваша клавиатура печатает кириллицу — переключите раскладку на английскую (латиницу).",
  },
  mobileTitle: {
    en: "A real keyboard is needed",
    uz: "Haqiqiy klaviatura kerak",
    ru: "Нужна настоящая клавиатура",
  },
  mobileBody: {
    en: "This trainer teaches ten-finger typing, so it needs a computer with a physical keyboard. Open this page on a computer!",
    uz: "Bu trenajyor o'n barmoqda yozishni o'rgatadi, shuning uchun unga klaviaturali kompyuter kerak. Bu sahifani kompyuterda oching!",
    ru: "Этот тренажёр учит десятипальцевой печати, поэтому нужен компьютер с клавиатурой. Откройте эту страницу на компьютере!",
  },
  backToCourses: {
    en: "← Back to Courses",
    uz: "← Kurslarga qaytish",
    ru: "← К курсам",
  },
  lockedTitle: {
    en: "This lesson is locked",
    uz: "Bu dars hali yopiq",
    ru: "Этот урок пока закрыт",
  },
  lockedNeedStars: {
    en: 'Earn {n}★ in "{title}" to unlock it',
    uz: '"{title}" darsida {n}★ oling — shunda bu dars ochiladi',
    ru: 'Наберите {n}★ в уроке «{title}», чтобы открыть его',
  },
  lockedNeedFinish: {
    en: 'Finish "{title}" first',
    uz: 'Avval "{title}" darsini tugating',
    ru: 'Сначала завершите урок «{title}»',
  },
  goToPrev: {
    en: "Go to lesson",
    uz: "Darsga o'tish",
    ru: "Перейти к уроку",
  },
  unlockHint: {
    en: "Earn {n}★ to unlock the next lesson",
    uz: "Keyingi darsni ochish uchun {n}★ oling",
    ru: "Наберите {n}★, чтобы открыть следующий урок",
  },
  pressHintRetry: {
    en: "Enter — practice again",
    uz: "Enter — qayta mashq",
    ru: "Enter — ещё раз",
  },
};

// ─── GAME-STAGE SCALER ───
// The arena renders at a fixed design size and scales to fit the available
// space, like a game canvas. Zooming the browser can never cause scrolling.
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

// Mini keyboard layout for the results-screen error heatmap
const HEATMAP_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// Deterministic celebration burst (no randomness → hydration-safe)
const BURST_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = i % 2 === 0 ? 115 : 82;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist * 0.75),
    delay: i * 30,
    char: i % 3 === 0 ? "★" : i % 3 === 1 ? "✦" : "●",
    color: i % 3 === 0 ? "#F59E0B" : i % 3 === 1 ? "#10B981" : "#D4D4D4",
  };
});

const NinjaWorld = dynamic(() => import("@/app/typing-ninja/NinjaWorld"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
      <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-200 rounded-full animate-spin" />
      <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
        Loading game…
      </p>
    </div>
  ),
});

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
  /** Fix-the-typo drills: display this (wrong) character instead of the
   *  target until it is erased. Only Letter implements it. */
  setOverrideChar?: (c: string | null) => void;
  getDomNode: () => HTMLDivElement | null;
}

// ─── Low-latency SFX (Web Audio) ───
// `new Audio(url)` per keystroke rebuilt the element + decoded the mp3 every
// press (20-200ms of jitter), and pause() after 300ms cut the sample with a
// pop. Instead: decode each mp3 ONCE into an AudioBuffer, then every press
// just triggers a BufferSource — ~1ms latency, overlaps freely, and the
// keystroke cutoff is a 40ms fade instead of a hard stop.
let sfxCtx: AudioContext | null = null;
const sfxBuffers = new Map<string, AudioBuffer>();
const sfxPending = new Map<string, Promise<void>>();

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
  if (!ctx || sfxBuffers.has(url) || sfxPending.has(url)) return;
  const pending = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      sfxBuffers.set(url, buffer);
    })
    .catch(() => {
      sfxPending.delete(url); // allow a retry on the next play attempt
    });
  sfxPending.set(url, pending);
}

// Warm the cache on mount so even the very first keystroke is instant.
function preloadSfx() {
  loadSfx("/press_key4.mp3");
  loadSfx("/error2.mp3");
}

function playSfx(url: string, volume: number, maxSeconds?: number) {
  const ctx = getSfxCtx();
  if (!ctx) return;
  // The context starts suspended until a user gesture; keydown counts as one.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const buffer = sfxBuffers.get(url);
  if (!buffer) {
    loadSfx(url); // still decoding — skip this press rather than lag behind it
    return;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(volume, t0);
  const dur = Math.min(maxSeconds ?? buffer.duration, buffer.duration);
  if (dur < buffer.duration) {
    gain.gain.setValueAtTime(volume, t0 + Math.max(0, dur - 0.04));
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
  }
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t0, 0, dur + 0.01);
}

const playKeystrokeSound = () => playSfx("/press_key4.mp3", 1, 0.3);
const playErrorSound = () => playSfx("/error2.mp3", 0.8);

const KEYBOARD_CONFIG = { scale: 0.75, offsetX: 0, offsetY: 0 };
const HANDS_CONFIG = { scale: 1.33, offsetX: 37, offsetY: 105 };

/* Each reshaped hand is another full copy of the pose sheet (~470 KB of path
   data), so they load as their own chunks only once someone picks them. All of
   them share the classic art's props, viewBox and pose ids, so HANDS_CONFIG
   covers every variant. */
type HandsProps = {
  expectedKey: string | string[] | null;
  className?: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

const HANDS_BY_VARIANT: Record<HandArtVariant, React.ComponentType<HandsProps>> = {
  classic: HandsKeyboard,
  slim: dynamic(() => import("@/components/keyboard/handsSlim").then((m) => m.SlimKeyboard), {
    ssr: false,
  }),
  female: dynamic(() => import("@/components/keyboard/handsFemale").then((m) => m.FemaleKeyboard), {
    ssr: false,
  }),
};

export interface LayoutConfig {
  keyboardScale: number;
  keyboardY: number;
  handsScale: number;
  handsY: number;
}

export interface KeyPressInfo {
  key: string;
  isCorrect: boolean;
  id: number;
}

function KeyboardWithHands({
  expectedKey,
  activeKeys,
  isDark,
  isColorful,
  lastPress,
  isHandsVisible = true,
  config,
}: {
  expectedKey: string | string[] | null;
  activeKeys?: string[];
  isDark: boolean;
  isColorful: boolean;
  lastPress?: KeyPressInfo | null;
  isHandsVisible?: boolean;
  config?: LayoutConfig;
}) {
  const kbScale = config?.keyboardScale ?? KEYBOARD_CONFIG.scale;
  const kbY = config?.keyboardY ?? KEYBOARD_CONFIG.offsetY;
  const hnScale = config?.handsScale ?? HANDS_CONFIG.scale;
  const hnY = config?.handsY ?? HANDS_CONFIG.offsetY;

  const handStyle = getHandStyle(useHandStyle());
  const Hands = HANDS_BY_VARIANT[handStyle.variant];
  // A style with its own theme (the flesh look) defines light and dark itself,
  // so it keeps `theme-dark` only as a modifier rather than being replaced by it.
  const handsTheme = handStyle.theme
    ? `${handStyle.theme}${isDark ? " theme-dark" : ""}`
    : isDark
      ? "theme-dark"
      : "theme-bone";

  return (
    <div
      className={`kb-stage relative w-full max-w-4xl aspect-[683.3/254] mx-auto mt-auto ${isColorful ? "colorful-mode" : ""}`}
    >
      <div className="absolute top-0 left-0 z-0 w-full h-full flex justify-center items-end">
        <NewKeyboard
          expectedKey={expectedKey}
          activeKeys={activeKeys}
          scale={kbScale}
          offsetX={KEYBOARD_CONFIG.offsetX}
          offsetY={kbY}
          lastPress={lastPress}
        />
      </div>
      {isHandsVisible && (
        <div className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full opacity-90 overflow-visible flex justify-center items-end">
          <Hands
            expectedKey={expectedKey}
            className={`w-full h-full overflow-visible ${handsTheme}`}
            scale={hnScale}
            offsetX={HANDS_CONFIG.offsetX}
            offsetY={hnY}
          />
        </div>
      )}
    </div>
  );
}

const Letter = memo(
  React.forwardRef<LetterHandle, { char: string }>(function Letter(
    { char },
    ref,
  ) {
    const [state, setState] = useState<CharState>(UNTYPED);
    const [isCursor, setIsCursor] = useState(false);
    const [overrideChar, setOverrideChar] = useState<string | null>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setCharState: setState,
      setIsCursor,
      setOverrideChar,
      getDomNode: () => spanRef.current as unknown as HTMLDivElement,
    }));

    let charCls = "transition-colors duration-150 inline-block relative ";

    if (state === UNTYPED) {
      if (isCursor) {
        charCls += "text-neutral-900 dark:text-white font-bold drop-shadow-sm ";
      } else {
        charCls += "text-neutral-400 dark:text-neutral-600 ";
      }
    } else if (state === CORRECT) {
      charCls += "text-[#10c373] dark:text-[#50ce95] letter-pop ";
    } else if (state === CORRECT_FIXED) {
      charCls += "text-amber-500 dark:text-amber-400 letter-pop ";
    } else if (state === INCORRECT) {
      charCls +=
        "text-red-500 dark:text-red-400 bg-red-500/10 rounded-sm letter-shake ";
    }

    const shown = overrideChar ?? char;
    return (
      <span className={charCls} ref={spanRef}>
        {shown === " " ? "\u00A0" : shown}
        {state === CORRECT_FIXED && (
          <svg
            viewBox="0 0 24 24"
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </span>
    );
  }),
);
Letter.displayName = "Letter";

// ─── GYM TYPING UNITS ───
// STANDARD_GYM text is a sequence of units: plain characters (the space
// between two word tokens is typed), inline special keys (Enter really
// breaks the line, Tab indents it) and shortcut chords ("Ctrl+C"). No
// space is typed next to a key/chord unit — only between two plain words.
type GymUnit =
  | { kind: "char"; char: string }
  | { kind: "key"; key: string; label: string }
  | { kind: "chord"; chord: ChordToken; label: string };

function buildGymUnits(tokens: string[]): GymUnit[] {
  const units: GymUnit[] = [];
  let prevPlain = false;
  for (const token of tokens) {
    if (isSpecialToken(token)) {
      units.push({
        kind: "key",
        key: token,
        label: KEY_TOKEN_GLYPHS[token] ?? token,
      });
      prevPlain = false;
      continue;
    }
    const chord = parseChordToken(token);
    if (chord) {
      units.push({ kind: "chord", chord, label: token });
      prevPlain = false;
      continue;
    }
    if (prevPlain) units.push({ kind: "char", char: " " });
    for (const ch of token) units.push({ kind: "char", char: ch });
    prevPlain = true;
  }
  return units;
}

// What the on-screen keyboard should light up for a unit (chords light
// every key of the combo at once).
function unitExpectedKeys(unit: GymUnit): string | string[] {
  if (unit.kind === "char") return unit.char;
  if (unit.kind === "key") return unit.key;
  return chordKeys(unit.chord);
}

// The label a unit's mistakes are counted under ("e", "Enter", "Ctrl+C")
function unitStatKey(unit: GymUnit): string {
  return unit.kind === "char"
    ? unit.char
    : unit.kind === "key"
      ? unit.key
      : unit.label;
}

// Inline keycap for key/chord units inside gym text — same imperative
// handle contract as Letter so the tracker drives both identically.
const KeyCapUnit = memo(
  React.forwardRef<LetterHandle, { label: string }>(function KeyCapUnit(
    { label },
    ref,
  ) {
    const [state, setState] = useState<CharState>(UNTYPED);
    const [isCursor, setIsCursor] = useState(false);
    const capRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setCharState: setState,
      setIsCursor,
      getDomNode: () => capRef.current as unknown as HTMLDivElement,
    }));

    let cls =
      "inline-flex items-center justify-center align-baseline mx-[0.3em] px-[0.3em] rounded-md border-2 font-sans font-semibold text-[0.5em] leading-none h-[1.4em] min-w-[1.7em] -translate-y-[0.12em] transition-colors duration-150 ";
    if (state === UNTYPED) {
      cls += isCursor
        ? "border-neutral-800 text-neutral-900 bg-white shadow-sm dark:border-neutral-300 dark:text-white dark:bg-neutral-900 "
        : "border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600 ";
    } else if (state === CORRECT) {
      cls +=
        "border-[#50ce95] text-[#10c373] bg-[#e2f7e2] dark:bg-[#e2f7e2]/10 dark:text-[#50ce95] letter-pop ";
    } else if (state === CORRECT_FIXED) {
      cls +=
        "border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 letter-pop ";
    } else {
      cls += "border-red-400 text-red-500 bg-red-500/10 letter-shake ";
    }

    return (
      <span ref={capRef} className={cls}>
        {label}
      </span>
    );
  }),
);
KeyCapUnit.displayName = "KeyCapUnit";

// --- NEW VIEWPORT COMPONENTS ---

function PostureCheck({
  step,
  onComplete,
  isDark,
  isColorful,
  isHandsVisible,
  locale,
  layoutConfig,
}: {
  step: StepNode;
  onComplete: (stats?: StepStats) => void;
  isDark: boolean;
  isColorful: boolean;
  isHandsVisible: boolean;
  locale: "en" | "uz" | "ru";
  layoutConfig?: LayoutConfig;
}) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [holdProgress, setHoldProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startHoldTimeRef = useRef<number | null>(null);

  const requiredKeys = useMemo(
    () => step.content.map((k) => k.toLowerCase()),
    [step.content],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const allPressed = requiredKeys.every((k) => activeKeys.has(k));

    if (allPressed) {
      onComplete();
    }
  }, [activeKeys, requiredKeys, onComplete]);

  const parseInstruction = (text: string) => {
    const parts = text.split(/(\[\s*[^\s[\]]\s*\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[\s*[^\s[\]]\s*\]/)) {
        return (
          <kbd
            key={i}
            className="mx-1 px-2.5 py-1 bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-[0_3px_0_rgba(0,0,0,0.1)] dark:shadow-[0_3px_0_rgba(0,0,0,0.5)] text-neutral-900 dark:text-white font-black font-mono text-base md:text-lg inline-flex items-center justify-center transform -translate-y-0.5"
          >
            {part.replace(/[\[\]]/g, "").trim()}
          </kbd>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const isFullyPressed = requiredKeys.every((k) => activeKeys.has(k));
  const isPartiallyPressed = activeKeys.size > 0 && !isFullyPressed;

  return (
    <div className="w-full flex-1 flex flex-col items-center pt-8 animate-fade-in-up">
      {/* Elegant Instruction Card */}
      <div
        className={`relative px-8 py-6 rounded-2xl bg-white dark:bg-neutral-900 shadow-lg border transition-all duration-300 ease-out transform overflow-hidden z-20 max-w-2xl
        ${
          isFullyPressed
            ? "border-emerald-400 dark:border-emerald-500 scale-[1.02] shadow-emerald-500/20"
            : isPartiallyPressed
              ? "border-amber-400 dark:border-amber-500 scale-100 shadow-amber-500/10"
              : "border-neutral-200 dark:border-neutral-800 scale-100 shadow-neutral-900/5"
        }
      `}
      >
        <div className="font-sans text-lg md:text-xl font-medium text-neutral-800 dark:text-neutral-200 text-center leading-relaxed">
          {parseInstruction(step.instruction[locale])}
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div
        className={`mt-6 font-mono text-sm tracking-widest uppercase transition-colors duration-300 z-20
        ${
          isFullyPressed
            ? "text-emerald-500 font-bold drop-shadow-sm"
            : isPartiallyPressed
              ? "text-amber-500 font-bold animate-pulse"
              : "text-neutral-400 font-medium animate-pulse"
        }
      `}
      >
        {isFullyPressed
          ? "Holding steady..."
          : isPartiallyPressed
            ? "Press all required keys..."
            : "Awaiting finger placement..."}
      </div>

      <div className="w-full mt-auto pb-[140px]">
        <KeyboardWithHands
          expectedKey={step.content}
          activeKeys={Array.from(activeKeys)}
          isDark={isDark}
          isColorful={isColorful}
          isHandsVisible={isHandsVisible}
          config={layoutConfig}
        />
      </div>
    </div>
  );
}

// Special-key tokens render as icons or short labels on their keycap.
const KEY_TOKEN_GLYPHS: Record<string, string> = {
  Enter: "↵",
  Backspace: "⌫",
  Tab: "⇥",
  CapsLock: "caps",
  Control: "ctrl",
  Alt: "alt",
  Shift: "⇧",
};

function KeyIntro({
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

// ─── BOMB-PROOF PRACTICE TRACKER ───
function PracticeTracker({
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

// ─── CHAT SIMULATOR ───
// A tiny messenger: "them" bubbles arrive by themselves, "you" turns are
// typed live inside a composing bubble and sent with Enter — the key's real
// job. Modes and stats work exactly like the gym.
function ChatSim({
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

// ─── SHORTCUT DOJO ───
// A tiny document the shortcuts REALLY act on: task cards ask for one
// shortcut at a time and the document reacts — select, copy, cut, paste,
// undo, redo. Wrong presses shake the card and count as mistakes.
const DOJO_CAP_GLYPHS: Record<string, string> = {
  ArrowRight: "→",
  ArrowLeft: "←",
};

function ShortcutDojo({
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

// ─── MASTER ARENA CONTROLLER ───
export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();

  const course = courseData;

  const { lesson, currentSection, nextLesson } = useMemo(() => {
    let lesson: LessonNode | null = null;
    let currentSection: SectionNode | null = null;

    for (const chapter of course.chapters || []) {
      for (const section of chapter.sections || []) {
        const found = section.lessons.find((l) => String(l.lessonId) === id);
        if (found) {
          lesson = found;
          currentSection = section;
          break;
        }
      }
      if (lesson) break;
    }

    let nextLesson: LessonNode | null = null;
    if (currentSection && lesson) {
      const found = lesson;
      const idx = currentSection.lessons.findIndex(
        (l) => l.lessonId === found.lessonId,
      );
      if (idx >= 0 && idx < currentSection.lessons.length - 1) {
        nextLesson = currentSection.lessons[idx + 1];
      }
    }

    return { lesson, currentSection, nextLesson };
  }, [course, id]);

  const [stepIdx, setStepIdx] = useState(0);
  const { locale } = useLocale();
  const [showLayoutWarning, setShowLayoutWarning] = useState(false);
  const [isTouchOnly, setIsTouchOnly] = useState(false);

  // Touch-only devices can't do the lessons — tell the student why
  useEffect(() => {
    setIsTouchOnly(
      window.matchMedia("(pointer: coarse)").matches &&
        !window.matchMedia("(pointer: fine)").matches,
    );
  }, []);

  // Cyrillic keystrokes mean the OS keyboard layout is wrong for these lessons
  useEffect(() => {
    const detect = (e: KeyboardEvent) => {
      if (e.key.length === 1 && /[Ѐ-ӿ]/.test(e.key)) {
        setShowLayoutWarning(true);
      }
    };
    window.addEventListener("keydown", detect);
    return () => window.removeEventListener("keydown", detect);
  }, []);

  useEffect(() => {
    if (!showLayoutWarning) return;
    const t = setTimeout(() => setShowLayoutWarning(false), 8000);
    return () => clearTimeout(t);
  }, [showLayoutWarning]);
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(true);
  const [isHandsVisible, setIsHandsVisible] = useState(true);

  // Decode the keystroke/error samples up front so the first press is instant.
  useEffect(() => {
    preloadSfx();
  }, []);

  // Persisted workspace preferences (theme, sound, key colors, hands overlay).
  // Loaded once on mount; saved on every change after that.
  const prefsLoaded = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tz-prefs-v1");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.dark === "boolean") setIsDark(p.dark);
        if (typeof p.audio === "boolean") setIsAudioEnabled(p.audio);
        if (typeof p.colorful === "boolean") setIsColorful(p.colorful);
        if (typeof p.hands === "boolean") setIsHandsVisible(p.hands);
      }
    } catch {}
    prefsLoaded.current = true;
  }, []);

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

  const [isTransitioning, setIsTransitioning] = useState(false);

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    keyboardScale: 0.85,
    keyboardY: -25,
    handsScale: 1.53,
    handsY: 87,
  });

  const [isAutoRouting, setIsAutoRouting] = useState(false);

  // Focus mode: chrome (header/footer/rails) fades while typing, returns on mouse move
  const [isFocusMode, setIsFocusMode] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === "Backspace") setIsFocusMode(true);
    };
    const onMove = () => setIsFocusMode(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // ─── RUN STATS & PERSISTED PROGRESS ───
  const runStats = useRef<LessonRunStats>(emptyRun());
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    setProgressMap(getProgress());
    setProgressLoaded(true);
  }, []);

  // ─── SEQUENTIAL LOCKING ───
  const { isLessonLocked, prevLesson } = useMemo(() => {
    if (!progressLoaded || !currentSection || !lesson) {
      return { isLessonLocked: false, prevLesson: null as LessonNode | null };
    }
    const list = currentSection.lessons;
    const unlocked = computeUnlocked(
      list.map((l) => ({ lessonId: l.lessonId, passStars: l.passStars })),
      progressMap,
    );
    const idx = list.findIndex((l) => l.lessonId === lesson.lessonId);
    return {
      isLessonLocked: idx > 0 && !unlocked[idx],
      prevLesson: idx > 0 ? list[idx - 1] : null,
    };
  }, [progressLoaded, currentSection, lesson, progressMap]);

  // Has the CURRENT lesson been passed (best-ever stars vs its own gate)?
  // Ungraded types (lesson, practice) pass by reaching the results screen.
  const passedCurrentRun = useMemo(() => {
    if (!lesson || !isGradedType(lesson.type)) return true;
    return (progressMap[lesson.lessonId]?.stars ?? 0) >= lesson.passStars;
  }, [lesson, progressMap]);

  // Fresh run whenever the user navigates to a different lesson
  useEffect(() => {
    runStats.current = emptyRun();
    setLessonResult(null);
    setStepIdx(0);
    setIsTransitioning(false);
  }, [id]);

  const step = lesson?.steps[stepIdx];

  const targetWpm = useMemo(
    () =>
      lesson
        ? Math.max(0, ...lesson.steps.map((s) => s.rules?.minimumWPM || 0))
        : 0,
    [lesson],
  );

  const retryLesson = useCallback(() => {
    runStats.current = emptyRun();
    setLessonResult(null);
    setStepIdx(0);
  }, []);


  useEffect(() => {
    if (!step) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          retryLesson();
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          // The next lesson is still locked → Enter retries instead
          if (nextLesson && !passedCurrentRun) {
            retryLesson();
            return;
          }
          setIsAutoRouting(true);
          if (nextLesson) {
            router.push(`/lesson/${nextLesson.lessonId}`);
          } else {
            router.push(
              `/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`,
            );
          }
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [
    step,
    nextLesson,
    course.courseId,
    currentSection?.sectionId,
    router,
    retryLesson,
    passedCurrentRun,
  ]);

  const handleComplete = useCallback((stats?: StepStats) => {
    if (stats) {
      const rs = runStats.current;
      rs.correct += stats.correct;
      rs.mistakes += stats.mistakes;
      rs.timeMs += stats.timeMs;
      for (const [k, v] of Object.entries(stats.perKeyMistakes)) {
        rs.perKeyMistakes[k] = (rs.perKeyMistakes[k] || 0) + v;
      }
    }
    setIsTransitioning(true);
  }, []);

  const confirmNext = useCallback(() => {
    setIsTransitioning(false);
    setStepIdx((p) => p + 1);
  }, []);

  const next = () => {
    // Manual skip: still allowed, but the run earns no stars
    if (!isTransitioning) runStats.current.skippedSteps += 1;
    setIsTransitioning(false);
    setStepIdx((p) => p + 1);
  };

  const prev = () => {
    setIsTransitioning(false);
    setStepIdx((p) => Math.max(0, p - 1));
  };

  useEffect(() => {
    if (!isTransitioning) return;
    const t = setTimeout(() => {
      confirmNext();
    }, 800);
    return () => clearTimeout(t);
  }, [isTransitioning, confirmNext]);

  // Lesson finished: compute the result once and persist it.
  // Ungraded types (lesson, practice) — completion only, no stars, no skip penalty.
  useEffect(() => {
    if (!lesson || step || lessonResult) return;
    const result = computeLessonResult(runStats.current, targetWpm);
    if (!isGradedType(lesson.type)) {
      result.stars = 0;
      result.skipped = false;
    }
    setLessonResult(result);
    setProgressMap(saveLessonResult(lesson.lessonId, result));
    // Feed the all-time statistics store (tz-stats-v1) — top problem keys
    // of this run travel with the attempt for the weekly "worst key".
    recordAttempt({
      lessonId: lesson.lessonId,
      type: lesson.type,
      wpm: result.wpm,
      accuracy: result.accuracy,
      stars: result.stars,
      timeMs: result.timeMs,
      errors: result.mistakes,
      problemKeys: Object.fromEntries(
        Object.entries(runStats.current.perKeyMistakes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      ),
    });
  }, [lesson, step, lessonResult, targetWpm]);

  if (!lesson)
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6">
        <Mascot mood="oops" className="w-24 h-24" />
        <p className="font-mono text-6xl font-black text-neutral-200">404</p>
        <h1 className="text-xl font-bold">Lesson not found</h1>
        <p className="text-sm text-neutral-500 text-center max-w-sm">
          This lesson doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/courses"
          className="mt-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          ← Back to Courses
        </Link>
      </div>
    );

  // Direct navigation to a locked lesson → explain instead of opening it
  if (isLessonLocked && prevLesson) {
    const needText = (
      prevLesson.passStars > 0 ? UI.lockedNeedStars : UI.lockedNeedFinish
    )[locale]
      .replace("{n}", String(prevLesson.passStars))
      .replace("{title}", prevLesson.lessonTitle[locale]);
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] text-neutral-900 px-6 text-center">
        <Mascot mood="focused" className="w-24 h-24" />
        <div className="w-10 h-10 -mt-2 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">{UI.lockedTitle[locale]}</h1>
        <p className="text-sm text-neutral-500 max-w-sm">{needText}</p>
        <Link
          href={`/lesson/${prevLesson.lessonId}`}
          className="mt-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          {UI.goToPrev[locale]} →
        </Link>
      </div>
    );
  }

  if (!step) {
    const r = lessonResult;
    const isGraded = isGradedType(lesson.type);
    const fmtTime = (ms: number) => {
      const s = Math.round(ms / 1000);
      return s >= 60
        ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
        : `${s}s`;
    };
    const RL = {
      title: r?.skipped
        ? { en: "Lesson Finished", uz: "Dars tugadi", ru: "Урок завершён" }
        : { en: "Good Job!", uz: "Barakalla!", ru: "Отличная работа!" },
      skipNote: {
        en: "You skipped some steps — complete every step to earn stars.",
        uz: "Ba'zi qadamlarni o'tkazib yubordingiz — yulduz olish uchun hammasini bajaring.",
        ru: "Вы пропустили шаги — пройдите все шаги, чтобы получить звёзды.",
      },
      practiceNote: {
        en: "Practice is judgment-free — no stars here. Earn them in the test!",
        uz: "Mashqda baho yo'q — yulduzlar testda beriladi. Xato qilishdan qo'rqmang!",
        ru: "Практика без оценок — звёзды даются за тест. Ошибаться можно!",
      },
      wpm: { en: "WPM", uz: "So'z/daq", ru: "Сл/мин" },
      accuracy: { en: "Accuracy", uz: "Aniqlik", ru: "Точность" },
      mistakes: { en: "Mistakes", uz: "Xatolar", ru: "Ошибки" },
      time: { en: "Time", uz: "Vaqt", ru: "Время" },
      problemKeys: {
        en: "Tricky keys",
        uz: "Qiyin tugmalar",
        ru: "Сложные клавиши",
      },
      retry: { en: "Practice Again", uz: "Yana mashq", ru: "Ещё раз" },
      continueNext: {
        en: "Continue to Next Lesson ↵",
        uz: "Keyingi darsga o'tish ↵",
        ru: "Следующий урок ↵",
      },
      returnWorkspace: {
        en: "Return to Workspace ↵",
        uz: "Ish joyiga qaytish ↵",
        ru: "Вернуться в рабочую область ↵",
      },
      pressHint: {
        en: "Enter — continue · R — practice again",
        uz: "Enter — davom etish · R — qayta mashq",
        ru: "Enter — продолжить · R — ещё раз",
      },
    };

    return (
      <div className={isDark ? "dark" : ""}>
        <div
          className={`fixed inset-0 z-50 h-dvh w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 font-sans overflow-hidden select-none transition-opacity duration-300 ${isAutoRouting ? "opacity-0" : "opacity-100"}`}
        >
          {/* Mascot + stars + celebration burst */}
          <div className="relative flex flex-col items-center mb-8">
            {r && (isGraded ? r.stars >= 4 : r.accuracy >= 90) && (
              <div
                className="absolute left-1/2 top-1/2 z-0 pointer-events-none"
                aria-hidden="true"
              >
                {BURST_PARTICLES.map((p, i) => (
                  <span
                    key={i}
                    className="burst-particle absolute text-lg leading-none"
                    style={
                      {
                        "--bx": `${p.x}px`,
                        "--by": `${p.y}px`,
                        color: p.color,
                        animationDelay: `${400 + p.delay}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {p.char}
                  </span>
                ))}
              </div>
            )}
            <Mascot
              mood={
                !r
                  ? "happy"
                  : !isGraded
                    ? r.accuracy >= 90
                      ? "celebrate"
                      : "happy"
                    : r.skipped
                      ? "oops"
                      : r.stars >= 4
                        ? "celebrate"
                        : "happy"
              }
              className="w-24 h-24 mb-4 animate-in zoom-in duration-500 relative z-10"
            />
            <div className={isGraded ? "flex items-center gap-2" : "hidden"}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-10 h-10 sm:w-12 sm:h-12 animate-in zoom-in duration-500 ${
                    r && i < r.stars
                      ? "text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]"
                      : "text-neutral-200 dark:text-neutral-800"
                  }`}
                  style={{
                    animationDelay: `${150 + i * 130}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <path d="M12 2l2.9 6.26 6.6.57-5 4.4 1.5 6.47L12 16.3 5.99 19.7l1.5-6.47-5-4.4 6.6-.57z" />
                </svg>
              ))}
            </div>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold text-neutral-800 dark:text-neutral-200 mb-3 tracking-widest uppercase animate-fade-in-up text-center px-4"
            style={{ animationDelay: "100ms" }}
          >
            {RL.title[locale]}
          </h1>
          {r?.skipped && (
            <p
              className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center px-6 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {RL.skipNote[locale]}
            </p>
          )}
          {lesson.type === "practice" && (
            <p
              className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center px-6 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              {RL.practiceNote[locale]}
            </p>
          )}

          {/* Stats */}
          {r && (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 mt-4 animate-fade-in-up px-6"
              style={{ animationDelay: "300ms" }}
            >
              {[
                { label: RL.wpm[locale], value: String(r.wpm) },
                { label: RL.accuracy[locale], value: `${r.accuracy}%` },
                { label: RL.mistakes[locale], value: String(r.mistakes) },
                { label: RL.time[locale], value: fmtTime(r.timeMs) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-6 py-4 min-w-[110px]"
                >
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                    {s.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1 font-semibold">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Per-key error heatmap: red = mistakes, green = clean lesson keys */}
          {r && !r.skipped && runStats.current.correct > 0 && (
            <div
              className="hidden sm:flex flex-col items-center gap-1.5 mb-6 animate-fade-in-up"
              style={{ animationDelay: "350ms" }}
              aria-hidden="true"
            >
              {HEATMAP_ROWS.map((row) => {
                const maxMiss = Math.max(
                  1,
                  ...Object.values(runStats.current.perKeyMistakes),
                );
                return (
                  <div key={row} className="flex gap-1.5">
                    {row.split("").map((k) => {
                      const miss = runStats.current.perKeyMistakes[k] || 0;
                      const used = lesson.unlockedKeys.includes(k);
                      const cls =
                        miss > 0
                          ? miss / maxMiss > 0.66
                            ? "bg-red-500 text-white"
                            : miss / maxMiss > 0.33
                              ? "bg-red-300 text-red-950 dark:bg-red-800 dark:text-red-100"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : used
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-neutral-100 text-neutral-300 dark:bg-neutral-900 dark:text-neutral-700";
                      return (
                        <span
                          key={k}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-mono font-bold uppercase ${cls}`}
                        >
                          {k}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {r &&
            !r.skipped &&
            // Top 3 problem keys of this run, ≥2 misses each (same bar as
            // progress.ts hardestKey). Reading runStats is safe here: the
            // results screen renders after the run is frozen (same pattern
            // as the heatmap above).
            // eslint-disable-next-line react-hooks/refs
            (() => {
              const problems = Object.entries(runStats.current.perKeyMistakes)
                .filter(([, n]) => n >= 2)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
              if (problems.length === 0) return null;
              return (
                <div
                  className="flex items-center gap-2.5 mb-6 text-sm text-neutral-500 dark:text-neutral-400 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  <span>{RL.problemKeys[locale]}:</span>
                  {problems.map(([k, n]) => (
                    <span key={k} className="flex items-center gap-1">
                      <kbd className="font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded shadow-sm uppercase">
                        {k === " " ? "␣" : k}
                      </kbd>
                      <span className="font-mono text-xs font-semibold text-red-500 dark:text-red-400">
                        ×{n}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })()}

          <div
            className="flex flex-col items-center animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            {/* Next lesson still locked → explain what's needed */}
            {r && nextLesson && !passedCurrentRun && (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                {UI.unlockHint[locale].replace(
                  "{n}",
                  String(lesson.passStars),
                )}
              </p>
            )}
            <p className="text-neutral-400 dark:text-neutral-500 mb-5 font-mono tracking-widest text-xs uppercase">
              {nextLesson && !passedCurrentRun
                ? UI.pressHintRetry[locale]
                : RL.pressHint[locale]}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={retryLesson}
                className={
                  nextLesson && !passedCurrentRun
                    ? "bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                    : "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg transition-all"
                }
              >
                {RL.retry[locale]}
              </button>
              {nextLesson && passedCurrentRun && (
                <button
                  onClick={() => {
                    setIsAutoRouting(true);
                    router.push(`/lesson/${nextLesson?.lessonId}`);
                  }}
                  className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                >
                  {RL.continueNext[locale]}
                </button>
              )}
              {!nextLesson && (
                <Link
                  href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
                  className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
                >
                  {RL.returnWorkspace[locale]}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="fixed inset-0 z-50 arena-workspace-active h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col select-none">
        {/* ─── STARK NOTION HEADER ─── */}
        <header
          className={`flex-shrink-0 w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 transition-all duration-500 ${isFocusMode ? "opacity-30" : "opacity-100"}`}
        >
          <div className="flex items-center gap-1">
            <Link
              href="/"
              title={UI.home[locale]}
              aria-label={UI.home[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md -ml-2"
            >
              <Home size={19} strokeWidth={2} />
            </Link>
            <Link
              href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
              title={UI.backToCourse[locale]}
              aria-label={UI.backToCourse[locale]}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Link>
            <div className="flex flex-col ml-2">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white leading-tight transition-colors">
                {lesson.lessonTitle[locale]}
              </h1>
              <span className="text-[10px] md:text-xs text-neutral-400 font-medium transition-colors">
                {UI.step[locale]} {step.stepNumber} / {lesson.steps.length} •{" "}
                {UI.viewportNames[step.viewport]?.[locale] ?? step.viewport}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            {/* Display settings: key colors, hands overlay, palette */}
            <button
              onClick={() => setIsColorful(!isColorful)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isColorful ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.colorfulKeys[locale]}
              aria-label={UI.colorfulKeys[locale]}
              aria-pressed={isColorful}
            >
              <KeyboardIcon size={19} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsHandsVisible(!isHandsVisible)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isHandsVisible ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.handsOverlay[locale]}
              aria-label={UI.handsOverlay[locale]}
              aria-pressed={isHandsVisible}
            >
              <Hand size={19} strokeWidth={2} />
            </button>

            {/* Hand drawing picker — choosing one always brings the hands back */}
            <HandStyleSwitcher onSelect={() => setIsHandsVisible(true)} />

            {/* Finger-zone palette picker — picking a palette always shows it */}
            <PaletteSwitcher onSelect={() => setIsColorful(true)} />

            <span className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

            {/* Sound + theme */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-1.5 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isAudioEnabled ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title={UI.sound[locale]}
              aria-label={UI.sound[locale]}
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
              title={UI.darkMode[locale]}
              aria-label={UI.darkMode[locale]}
              aria-pressed={isDark}
            >
              {isDark ? (
                <Sun size={19} strokeWidth={2} />
              ) : (
                <Moon size={19} strokeWidth={2} />
              )}
            </button>

            <span className="w-px h-5 mx-1 bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

            {/* Language */}
            <LanguageSwitcher />
          </div>
        </header>

        {/* ─── WRONG-LAYOUT WARNING (Cyrillic keystrokes detected) ─── */}
        {showLayoutWarning && (
          <div
            role="alert"
            className="flex-shrink-0 w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-6 py-2.5 flex items-center justify-center gap-3 z-20 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500 shrink-0"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 text-center">
              {UI.layoutWarning[locale]}
            </p>
            <button
              onClick={() => setShowLayoutWarning(false)}
              className="text-amber-500 hover:text-amber-700 font-bold px-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── TOUCH-ONLY DEVICE NOTICE ─── */}
        {isTouchOnly && (
          <div className="absolute inset-0 z-[70] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Mascot mood="oops" className="w-24 h-24" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {UI.mobileTitle[locale]}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              {UI.mobileBody[locale]}
            </p>
            <Link
              href="/courses"
              className="mt-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-lg"
            >
              {UI.backToCourses[locale]}
            </Link>
          </div>
        )}

        {/* ─── WORKSPACE LAYOUT ─── */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT RAIL — chapters & sections */}
          <ChapterRail
            chapters={course.chapters}
            currentSectionId={currentSection?.sectionId ?? null}
            courseId={course.courseId}
            progress={progressMap}
            locale={locale}
            dimmed={isFocusMode}
          />

          {/* CENTER ARENA */}
          <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">
            <main className="flex-1 min-h-0 w-full relative flex flex-col">
              {isTransitioning ? (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 z-40">
                  <div className="relative w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-in zoom-in spin-in-12 duration-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              ) : step.viewport === "GAME_NINJA_RUN" ? (
                /* Full-bleed game: covers header, footer and rails — the
                   student sees only the game. Back and Skip float on top. */
                <div
                  key={step.stepId}
                  className="fixed inset-0 z-50 bg-[#f4e0c5] animate-in fade-in duration-500"
                >
                  <NinjaWorld
                    step={step}
                    onComplete={handleComplete}
                    isEmbedded={true}
                  />

                  <Link
                    href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
                    title={lesson.lessonTitle[locale]}
                    className="absolute top-5 right-5 z-[10000] w-11 h-11 bg-[#fff6e6]/95 text-[#3d2a21] border-2 border-[#3d2a21] rounded-full shadow-[0_3px_0_#3d2a21] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </Link>

                  <button
                    onClick={next}
                    className="absolute bottom-5 right-5 z-[10000] bg-[#fff6e6]/95 text-[#3d2a21] border-2 border-[#3d2a21] px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_3px_0_#3d2a21] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    {UI.skip[locale]}
                  </button>
                </div>
              ) : (
                <StageScaler>
                  {step.viewport === "POSTURE_CHECK" && (
                    <PostureCheck
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "KEY_INTRO" && (
                    <KeyIntro
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isAudioEnabled={isAudioEnabled}
                      isDark={isDark}
                      isColorful={isColorful}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "STANDARD_GYM" && (
                    <div
                      key={step.stepId}
                      className="w-full flex-1 min-h-0 flex flex-col animate-fade-in-up"
                    >
                      <PracticeTracker
                        step={step}
                        onComplete={handleComplete}
                        isDark={isDark}
                        isColorful={isColorful}
                        isAudioEnabled={isAudioEnabled}
                        isHandsVisible={isHandsVisible}
                        layoutConfig={layoutConfig}
                      />
                    </div>
                  )}

                  {step.viewport === "CHAT_SIM" && (
                    <ChatSim
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isAudioEnabled={isAudioEnabled}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}

                  {step.viewport === "SHORTCUT_DOJO" && (
                    <ShortcutDojo
                      key={step.stepId}
                      step={step}
                      onComplete={handleComplete}
                      isDark={isDark}
                      isColorful={isColorful}
                      isAudioEnabled={isAudioEnabled}
                      isHandsVisible={isHandsVisible}
                      locale={locale}
                      layoutConfig={layoutConfig}
                    />
                  )}
                </StageScaler>
              )}
            </main>
            {/* ─── STARK NOTION FOOTER PROGRESS DECK ─── */}
            <footer
              className={`flex-shrink-0 w-full py-4 sm:py-6 px-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-all duration-500 z-20 relative flex items-center justify-between ${isFocusMode ? "opacity-30" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <button
                  onClick={prev}
                  disabled={stepIdx === 0}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer relative z-30"
                >
                  {UI.prev[locale]}
                </button>

                {/* Segmented step bar: one segment per step */}
                <div
                  className="flex items-center gap-1.5 w-72 relative z-30"
                  aria-label={`${UI.step[locale]} ${stepIdx + 1} / ${lesson.steps.length}`}
                >
                  {lesson.steps.map((s, i) => (
                    <div
                      key={s.stepId}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < stepIdx
                          ? "bg-emerald-500"
                          : i === stepIdx
                            ? "bg-neutral-950 dark:bg-white animate-pulse"
                            : "bg-neutral-200 dark:bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer relative z-30"
                >
                  {UI.skip[locale]}
                </button>
              </div>
            </footer>
          </div>

          {/* RIGHT RAIL — lessons of the current section */}
          <LessonRail
            lessons={currentSection?.lessons ?? []}
            currentLessonId={lesson.lessonId}
            progress={progressMap}
            locale={locale}
            dimmed={isFocusMode}
          />
        </div>
      </div>
    </div>
  );
}
