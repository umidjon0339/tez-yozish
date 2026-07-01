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
import lessonsData from "@/data/lessons.json";
import {
  CourseNode,
  ChapterNode,
  SectionNode,
  LessonNode,
  StepNode,
} from "@/types/lesson";
import { DynamicThumbnail } from "@/components/thumbnails/DynamicThumbnail";
import { NewKeyboard } from "@/components/keyboard/new_keyboard";
import { Keyboard as HandsKeyboard } from "@/components/keyboard/hands";

const NinjaWorld = dynamic(() => import("@/app/typing-ninja/NinjaWorld"), {
  ssr: false,
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
  getDomNode: () => HTMLDivElement | null;
}

const playKeystrokeSound = () => {
  try {
    const audio = new Audio("/press_key4.mp3");
    audio.volume = 1;
    const startTimeSeconds = 0.0;
    const playDurationMs = 300;
    audio.currentTime = startTimeSeconds;
    audio.play().catch(() => {});
    if (playDurationMs > 0) {
      setTimeout(() => {
        audio.pause();
      }, playDurationMs);
    }
  } catch (e) {}
};

const playErrorSound = () => {
  try {
    const audio = new Audio("/error2.mp3");
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch (e) {}
};

const KEYBOARD_CONFIG = { scale: 0.75, offsetX: 0, offsetY: 0 };
const HANDS_CONFIG = { scale: 1.33, offsetX: 37, offsetY: 105 };

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

  return (
    <div
      className={`relative w-full max-w-4xl aspect-[683.3/254] mx-auto mt-auto ${isColorful ? "colorful-mode" : ""}`}
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
        <div className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full mix-blend-multiply dark:mix-blend-screen opacity-90 overflow-visible flex justify-center items-end">
          <HandsKeyboard
            expectedKey={expectedKey}
            className={`w-full h-full overflow-visible ${isDark ? "theme-dark" : "theme-bone"}`}
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
    const spanRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setCharState: setState,
      setIsCursor,
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
      charCls += "text-[#10c373] dark:text-[#50ce95] ";
    } else if (state === CORRECT_FIXED) {
      charCls += "text-amber-500 dark:text-amber-400 ";
    } else if (state === INCORRECT) {
      charCls += "text-red-500 dark:text-red-400 bg-red-500/10 rounded-sm ";
    }

    return (
      <span className={charCls} ref={spanRef}>
        {char === " " ? "\u00A0" : char}
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
  onComplete: () => void;
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
    const parts = text.split(/(\[\s*[A-Za-z0-9_␣]\s*\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[\s*[A-Za-z0-9_␣]\s*\]/)) {
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
    <div className="w-full flex-1 flex flex-col items-center pt-8">
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

      <div className="w-full mt-auto mb-[100px] sm:mb-[140px]">
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
  onComplete: () => void;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.length > 1 && e.key !== "Backspace") return;
      if (e.key === " ") e.preventDefault();

      const target = sequence[cursor];
      if (!target) return;

      const isMatch = e.key.toLowerCase() === target.toLowerCase();

      if (isMatch) {
        consecutiveMistakes.current = 0;
        if (isAudioEnabled) playKeystrokeSound();
        const nextCursor = cursor + 1;
        setCursor(nextCursor);
        if (phase === "INTRO") {
          setPhase("PRACTICE");
        }
        if (nextCursor >= sequence.length) {
          onComplete();
        }
      } else {
        consecutiveMistakes.current += 1;
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
    const parts = text.split(/(\[\s*[A-Za-z0-9_␣]\s*\])/g);
    return parts.map((part, i) => {
      if (part.match(/\[\s*[A-Za-z0-9_␣]\s*\]/)) {
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

      {step.instruction && step.instruction[locale] && (
        <div
          className={`font-sans text-center leading-relaxed transition-all duration-500 ease-out z-10 ${phase === "INTRO" ? "text-3xl md:text-4xl text-neutral-800 dark:text-neutral-200 mb-12 max-w-3xl" : "text-sm md:text-base text-neutral-600 dark:text-neutral-400 mb-2 max-w-2xl"}`}
        >
          {parseInstruction(step.instruction[locale], phase === "INTRO")}
        </div>
      )}

      <div
        className={`flex flex-wrap justify-center gap-3 md:gap-4 transition-all duration-500 ease-out ${phase === "INTRO" ? "opacity-0 translate-y-8 pointer-events-none absolute" : "opacity-100 translate-y-0 relative mb-2"}`}
      >
        {sequence.map((char, i) => {
          const isPast = i < cursor;
          const isCurrent = i === cursor;
          let boxCls =
            "relative flex items-center justify-center w-12 h-14 sm:w-[3.5rem] sm:h-[4.25rem] rounded-md border-2 transition-all duration-150 select-none shadow-sm ";
          let charCls =
            "font-sans text-2xl sm:text-3xl font-medium uppercase transition-colors ";

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
              <span className={charCls}>{char === " " ? "␣" : char}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full mt-auto mb-[100px] sm:mb-[140px]">
        <KeyboardWithHands
          expectedKey={sequence[cursor] ? sequence[cursor].toLowerCase() : null}
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
  onComplete: () => void;
  isDark: boolean;
  isColorful: boolean;
  isAudioEnabled: boolean;
  isHandsVisible: boolean;
  layoutConfig?: LayoutConfig;
}) {
  const activeText = useMemo(() => step.content.join(" "), [step.content]);
  const charList = useMemo(() => activeText.split(""), [activeText]);
  const total = charList.length;

  const buffer = useRef<Uint8Array>(new Uint8Array(total));
  const hasError = useRef<boolean[]>(new Array(total).fill(false));
  const cursor = useRef<number>(0);
  const done = useRef(false);
  const mistakesCount = useRef<number>(0);
  const consecutiveMistakes = useRef<number>(0);

  const [shake, setShake] = useState(false);

  const letterMap = useRef<Map<number, LetterHandle>>(new Map());
  const [activeKey, setActiveKey] = useState<string | null>(
    charList[0] || null,
  );
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);

  const smoothCursorRef = useRef<HTMLDivElement>(null);

  const updateSmoothCursor = useCallback((index: number) => {
    const node = letterMap.current.get(index)?.getDomNode();
    if (node && smoothCursorRef.current) {
      smoothCursorRef.current.style.opacity = "1";
      smoothCursorRef.current.style.left = `${node.offsetLeft}px`;
      smoothCursorRef.current.style.top = `${node.offsetTop}px`;
      smoothCursorRef.current.style.height = `${node.offsetHeight}px`;

      if (node.parentElement) {
        node.parentElement.scrollTo({
          top:
            node.offsetTop -
            node.parentElement.offsetHeight / 2 +
            node.offsetHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, []);

  const resetTracker = useCallback(() => {
    buffer.current = new Uint8Array(charList.length);
    hasError.current = new Array(charList.length).fill(false);
    cursor.current = 0;
    done.current = false;
    mistakesCount.current = 0;
    consecutiveMistakes.current = 0;
    setActiveKey(charList[0] || null);

    setTimeout(() => {
      letterMap.current.forEach((h) => {
        h.setCharState(UNTYPED);
        h.setIsCursor(false);
      });
      letterMap.current.get(0)?.setIsCursor(true);
      updateSmoothCursor(0);
    }, 10);
  }, [charList, updateSmoothCursor]);

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

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (done.current) return;
      if (e.key === " ") e.preventDefault();
      if (e.key.length > 1 && e.key !== "Backspace") return;

      const curr = cursor.current;

      if (e.key === "Backspace") {
        if (!step.rules.allowBackspace) return;
        consecutiveMistakes.current = 0;
        if (isAudioEnabled) playKeystrokeSound();
        if (curr === 0) return;
        const prev = curr - 1;
        buffer.current[prev] = UNTYPED;
        letterMap.current.get(prev)?.setCharState(UNTYPED);
        letterMap.current.get(curr)?.setIsCursor(false);
        letterMap.current.get(prev)?.setIsCursor(true);
        cursor.current = prev;
        setActiveKey(charList[prev] || null);
        updateSmoothCursor(prev);
        return;
      }

      if (curr >= total) return;

      const isMatch = e.key === charList[curr];

      if (!isMatch) {
        hasError.current[curr] = true;
        mistakesCount.current += 1;
        consecutiveMistakes.current += 1;

        if (isAudioEnabled) playErrorSound();

        if (step.rules.blockOnTypo) {
          letterMap.current.get(curr)?.setCharState(INCORRECT);
          setShake(true);
          setTimeout(() => setShake(false), 300);
          return; // Halt progress until correct key pressed
        }
      } else {
        consecutiveMistakes.current = 0;
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
        setActiveKey(charList[next] || null);
        updateSmoothCursor(next);
      } else {
        if (smoothCursorRef.current) {
          smoothCursorRef.current.style.opacity = "0";
        }
        done.current = true;
        setActiveKey(null);
        setTimeout(onComplete, 200);
      }
    },
    [
      total,
      charList,
      onComplete,
      isAudioEnabled,
      updateSmoothCursor,
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
      className={`flex-1 flex flex-col items-center justify-between gap-6 w-full max-w-4xl mx-auto select-none pt-8 transition-opacity duration-100 ${shake ? "opacity-50" : "opacity-100"}`}
    >
      <div
        className="relative w-full text-center px-4 font-mono text-3xl sm:text-5xl leading-tight sm:leading-relaxed tracking-wide select-none max-h-[140px] sm:max-h-[160px] overflow-hidden"
        style={{ wordBreak: "break-word" }}
      >
        <div
          ref={smoothCursorRef}
          className="absolute w-[3px] bg-amber-500 transition-all duration-100 ease-out rounded-full pointer-events-none z-10 animate-pulse"
          style={{ opacity: 0 }}
        />
        {charList.map((c, i) => (
          <Letter
            key={i}
            char={c}
            ref={(node) => {
              if (node) letterMap.current.set(i, node);
              else letterMap.current.delete(i);
            }}
          />
        ))}
      </div>
      <div className="w-full mt-auto mb-[100px] sm:mb-[140px]">
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

// ─── MASTER ARENA CONTROLLER ───
export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();

  const course = lessonsData as unknown as CourseNode;

  let currentLesson: LessonNode | null = null;
  let currentChapter: ChapterNode | null = null;
  let currentSection: SectionNode | null = null;

  for (const chapter of course.chapters || []) {
    for (const section of chapter.sections || []) {
      const found = section.lessons.find((l) => String(l.lessonId) === id);
      if (found) {
        currentLesson = found;
        currentChapter = chapter;
        currentSection = section;
        break;
      }
    }
    if (currentLesson) break;
  }

  let nextLesson: LessonNode | null = null;
  if (currentSection && currentLesson) {
    const idx = currentSection.lessons.findIndex(
      (l) => l.lessonId === currentLesson!.lessonId,
    );
    if (idx >= 0 && idx < currentSection.lessons.length - 1) {
      nextLesson = currentSection.lessons[idx + 1];
    }
  }

  const lesson = currentLesson;

  const [stepIdx, setStepIdx] = useState(0);
  const [locale, setLocale] = useState<"en" | "uz" | "ru">("en");
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(false);
  const [isHandsVisible, setIsHandsVisible] = useState(true);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    keyboardScale: 0.85,
    keyboardY: -25,
    handsScale: 1.53,
    handsY: 87,
  });

  const [isAutoRouting, setIsAutoRouting] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  useEffect(() => {
    const savedLeft = localStorage.getItem("isLeftSidebarOpen");
    if (savedLeft !== null) setIsLeftSidebarOpen(savedLeft === "true");

    const savedRight = localStorage.getItem("isRightSidebarOpen");
    if (savedRight !== null) setIsRightSidebarOpen(savedRight === "true");
  }, []);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isLeftSidebarOpen", String(next));
      return next;
    });
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isRightSidebarOpen", String(next));
      return next;
    });
  };

  const step = lesson?.steps[stepIdx];

  useEffect(() => {
    if (!step) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
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
  }, [step, nextLesson, course.courseId, currentSection?.sectionId, router]);

  const handleComplete = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const confirmNext = useCallback(() => {
    setIsTransitioning(false);
    setStepIdx((p) => p + 1);
  }, []);

  const next = () => {
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

  if (!lesson)
    return (
      <div className="p-8 font-mono text-xs">404 // Module not located.</div>
    );

  if (!step) {
    return (
      <div className={isDark ? "dark" : ""}>
        <div
          className={`fixed inset-0 z-50 h-dvh w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 font-sans overflow-hidden select-none transition-opacity duration-300 ${isAutoRouting ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex flex-col items-center justify-center mb-10 animate-fade-in-up">
            <div className="p-3 bg-neutral-100 dark:bg-neutral-900/50 rounded-full">
              <div className="p-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                <div className="w-28 h-28 bg-[#2ade88] rounded-full flex items-center justify-center shadow-inner">
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-in zoom-in spin-in-12 duration-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-neutral-600 dark:text-neutral-300 mb-10 tracking-widest uppercase animate-fade-in-up text-center px-4"
            style={{ animationDelay: "100ms" }}
          >
            {locale === "en"
              ? "Good Job!"
              : locale === "uz"
                ? "Barakalla!"
                : "Отличная работа!"}
          </h1>

          <div
            className="flex flex-col items-center animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 font-mono tracking-widest text-sm uppercase">
              Press Enter or Space to continue
            </p>
            {nextLesson ? (
              <button
                onClick={() => {
                  setIsAutoRouting(true);
                  router.push(`/lesson/${nextLesson?.lessonId}`);
                }}
                className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
              >
                Continue to Next Lesson ↵
              </button>
            ) : (
              <Link
                href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
                className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all"
              >
                {locale === "en"
                  ? "Return to Workspace ↵"
                  : locale === "uz"
                    ? "Ish joyiga qaytish ↵"
                    : "Вернуться в рабочую область ↵"}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = (stepIdx / lesson.steps.length) * 100;

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="fixed inset-0 z-50 arena-workspace-active h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col select-none">
        {/* ─── STARK NOTION HEADER ─── */}
        <header className="flex-shrink-0 w-full py-4 px-6 md:px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${course.courseId}?sectionId=${currentSection?.sectionId}`}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md -ml-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white leading-tight transition-colors">
                {lesson.lessonTitle[locale]}
              </h1>
              <span className="text-[10px] md:text-xs text-neutral-400 font-medium transition-colors">
                Step {step.stepNumber} of {lesson.steps.length} •{" "}
                {step.viewport.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500">
            <button
              onClick={() => setIsColorful(!isColorful)}
              className={`transition-colors ${isColorful ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title="Toggle Colorful Keyboard"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
              </svg>
            </button>
            <button
              onClick={() => setIsHandsVisible(!isHandsVisible)}
              className={`transition-colors ${isHandsVisible ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title="Toggle Hands Overlay"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            </button>
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`transition-colors ${isAudioEnabled ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title="Toggle Sound"
            >
              {isAudioEnabled ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`transition-colors ${isDark ? "text-neutral-900 dark:text-white" : "hover:text-neutral-900 dark:hover:text-white"}`}
              title="Toggle Theme"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
                <path d="m5 2 5 5" />
                <path d="M2 13h15" />
                <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
              </svg>
            </button>

            {/* Locale Switcher */}
            <div className="flex items-center space-x-1 border border-neutral-200 dark:border-neutral-800 rounded p-0.5 bg-neutral-100 dark:bg-neutral-900 font-mono text-[10px] font-bold">
              <button
                onClick={() => setLocale("en")}
                className={`px-1.5 py-0.5 rounded transition-colors ${locale === "en" ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("uz")}
                className={`px-1.5 py-0.5 rounded transition-colors ${locale === "uz" ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                UZ
              </button>
              <button
                onClick={() => setLocale("ru")}
                className={`px-1.5 py-0.5 rounded transition-colors ${locale === "ru" ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                RU
              </button>
            </div>
          </div>
        </header>

        {/* ─── WORKSPACE LAYOUT ─── */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT SIDEBAR (Chapters & Sections) - OVERLAY MODE */}
          <aside
            className={`absolute left-0 top-0 pt-10 h-full z-50 w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overflow-hidden whitespace-nowrap ${isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            
            <div className="flex flex-col p-2 gap-1 overflow-y-auto pb-8">
              {lessonsData.chapters.map((chap) => (
                <div key={chap.chapterId} className="mb-4">
                  <div className="px-3 py-1.5 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    Ch {chap.chapterNumber}: {chap.chapterTitle[locale]}
                  </div>
                  <div className="flex flex-col gap-2 mt-2 px-2">
                    {chap.sections.map((sec) => {
                      const isActiveSection =
                        sec.sectionId === currentSection?.sectionId;
                      return (
                        <Link
                          key={sec.sectionId}
                          href={`/courses/${lessonsData.courseId}?sectionId=${sec.sectionId}`}
                          className={`group block bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden transition-all duration-200 ${
                            isActiveSection
                              ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
                          }`}
                        >
                          <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
                            {sec.thumbnail?.imageSrc ? (
                              <img
                                src={sec.thumbnail.imageSrc}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              />
                            ) : sec.thumbnail?.svgId ? (
                              <DynamicThumbnail
                                svgId={sec.thumbnail.svgId}
                                params={sec.thumbnail.parameters as any}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400 group-hover:scale-105 transition-transform duration-500 ease-out">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 w-6 h-6 bg-white dark:bg-black text-neutral-900 dark:text-white flex items-center justify-center rounded text-xs font-bold shadow-sm z-10">
                              {sec.sectionNumber}
                            </div>
                          </div>
                          <div
                            className={`py-2 px-2 text-center border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${isActiveSection ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                          >
                            <span
                              className={`text-xs font-medium truncate block ${isActiveSection ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"}`}
                            >
                              {sec.sectionTitle[locale]}
                            </span>
                            {/* DISPLAY SECTION PARAMETERS */}
                            {sec.thumbnail?.parameters?.keys && (
                              <span className="text-[10px] text-neutral-900 dark:text-neutral-100 block truncate mt-0.5 font-mono font-bold">
                                Keys:{" "}
                                {sec.thumbnail.parameters.keys
                                  .map((k) => k.toUpperCase())
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CENTER ARENA */}
          <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">
            {/* FLOATING SIDEBAR TOGGLES */}
            <button
              onClick={toggleLeftSidebar}
              className={`absolute left-0 top-0 z-[60] p-2 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-r border-b border-neutral-200 dark:border-neutral-800 rounded-br-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors`}
              title="Course Outline"
            >
              {isLeftSidebarOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleRightSidebar}
              className={`absolute right-0 top-0 z-[60] p-2 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-l border-b border-neutral-200 dark:border-neutral-800 rounded-bl-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors`}
              title="Lessons List"
            >
              {isRightSidebarOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              )}
            </button>

            <main className="flex-1 overflow-y-auto w-full">
              <div className="flex flex-col min-h-full items-center justify-start pt-10 pb-0 px-6 max-w-4xl mx-auto w-full relative">
                {isTransitioning ? (
                  <div className="flex flex-col items-center justify-center flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 z-40">
                    <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
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
                ) : (
                  <>
                    {step.instruction &&
                      step.viewport !== "POSTURE_CHECK" &&
                      step.viewport !== "KEY_INTRO" &&
                      step.viewport !== "STANDARD_GYM" && (
                        <div className="font-mono text-[11px] md:text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded border border-neutral-200/60 dark:border-neutral-800/60 mb-2 md:mb-4 text-center max-w-2xl z-20">
                          {step.instruction[locale]}
                        </div>
                      )}

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
                        className="w-full flex-1 flex flex-col mt-[-2rem]"
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

                    {step.viewport === "GAME_NINJA_RUN" && (
                      <div
                        key={step.stepId}
                        className="w-full h-[60vh] mt-6 rounded-lg overflow-hidden relative shadow-2xl ring-4 ring-[#554e44] dark:ring-[#3d2a21]"
                      >
                        <NinjaWorld
                          step={step}
                          onComplete={handleComplete}
                          isEmbedded={true}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
            {/* ─── STARK NOTION FOOTER PROGRESS DECK ─── */}
            <footer className="flex-shrink-0 w-full py-4 sm:py-6 px-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 transition-colors z-20 relative flex items-center justify-between">
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                <button
                  onClick={prev}
                  disabled={stepIdx === 0}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer relative z-30"
                >
                  ← Prev
                </button>

                <div className="w-72 h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 relative z-30">
                  <div
                    className="h-full bg-neutral-950 dark:bg-white transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <button
                  onClick={next}
                  className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer relative z-30"
                >
                  Skip →
                </button>
              </div>
            </footer>
          </div>

          {/* RIGHT SIDEBAR (Lessons) - OVERLAY MODE */}
          <aside
            className={`absolute right-0 top-0 h-full z-50 w-64 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overflow-hidden whitespace-nowrap ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            
            <div className="flex flex-col p-2 pt-7 gap-4 overflow-y-auto pb-8">
              {(() => {
                const practiceLessons =
                  currentSection?.lessons.filter((l) => l.type !== "game") ||
                  [];
                const gameLessons =
                  currentSection?.lessons.filter((l) => l.type === "game") ||
                  [];

                const renderSidebarLessonCard = (l: any) => {
                  const isActive = l.lessonId === lesson.lessonId;
                  const activeIndex = currentSection!.lessons.findIndex(
                    (x) => x.lessonId === lesson.lessonId,
                  );
                  const currentIndex = currentSection!.lessons.findIndex(
                    (x) => x.lessonId === l.lessonId,
                  );
                  const isPast = currentIndex < activeIndex;

                  return (
                    <Link
                      key={l.lessonId}
                      href={`/lesson/${l.lessonId}`}
                      className={`group block bg-white dark:bg-neutral-900 border rounded-lg overflow-hidden transition-all duration-200 ${
                        isActive
                          ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                          : isPast
                            ? "border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100"
                            : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
                        <DynamicThumbnail
                          svgId={l.thumbnail?.svgId || "TWO_KEYS_FOCUS"}
                          params={l.thumbnail?.parameters as any}
                          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${isActive ? "scale-105" : "group-hover:scale-105"}`}
                        />
                        <div className="absolute top-2 left-2 z-10">
                          {isPast ? (
                            <div className="w-6 h-6 bg-emerald-500 text-white flex items-center justify-center rounded text-[10px] font-bold shadow-sm">
                              ✓
                            </div>
                          ) : isActive ? (
                            <div className="w-6 h-6 bg-white dark:bg-black text-neutral-900 dark:text-white flex items-center justify-center rounded text-xs font-bold shadow-sm">
                              {l.lessonNumber}
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center rounded text-xs font-bold">
                              {l.lessonNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className={`py-2 px-2 text-center border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${isActive ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                      >
                        <span
                          className={`text-xs font-medium truncate block ${isActive ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"}`}
                        >
                          {l.lessonTitle[locale]}
                        </span>
                       
                        
                        
                      </div>
                    </Link>
                  );
                };

                return (
                  <div className="flex flex-col gap-6">
                    {practiceLessons.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[10px] font-bold text-neutral-800 dark:text-neutral-500 uppercase tracking-widest pl-1">
                          Practice
                        </h3>
                        <div className="flex flex-col gap-2">
                          {practiceLessons.map(renderSidebarLessonCard)}
                        </div>
                      </div>
                    )}
                    {gameLessons.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
                          Games
                        </h3>
                        <div className="flex flex-col gap-2">
                          {gameLessons.map(renderSidebarLessonCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
