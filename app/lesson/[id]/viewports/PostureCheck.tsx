import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardWithHands,
  type LayoutConfig,
} from "@/components/keyboard/KeyboardStage";
import type { StepNode } from "@/types/lesson";
import type { StepStats } from "@/lib/typing/progress";

export function PostureCheck({
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
