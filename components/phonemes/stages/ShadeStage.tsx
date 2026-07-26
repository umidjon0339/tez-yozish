"use client";

// SHADE — one allophone as a full lesson (pilot sounds in SHADE_WORDS).
// Two phases:
//   1. intro — the variant symbol, what the mouth does (process icon,
//      name, hint) and the shade's words with the sound's spelling
//      underlined and the TRIGGER letter (the one causing the shade)
//      highlighted. Every word is tappable to hear.
//   2. write — the student types those words in the gym (keyboard +
//      hands), each word spoken as it starts.

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MoveHorizontal,
  Sparkles,
  Timer,
  Volume2,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type PhonemeInfo } from "@/lib/phonemes";
import {
  ALLO_PROCESS_INFO,
  findSpelling,
  shadeTriggerIndex,
  shadesFor,
  type AlloProcess,
} from "@/lib/allophones";
import { speakWord } from "@/lib/phonemeAudio";
import { GymStage } from "@/components/english/GymStage";
import { type StageChromeProps, type StageStats } from "@/components/english/stage-kit";

const P = STR.phonemes;

const PROCESS_ICON: Partial<Record<AlloProcess, LucideIcon>> = {
  plain: Circle,
  clipped: Timer,
  nasalized: Wind,
  longer: MoveHorizontal,
};

/** Word with the sound's spelling underlined and the trigger letter
 *  (the one that causes the shade) highlighted in sky. */
function ShadeWord({
  word,
  info,
  process,
}: {
  word: string;
  info: PhonemeInfo;
  process: AlloProcess;
}) {
  const spell = findSpelling(word, info);
  if (!spell) return <span className="font-mono">{word}</span>;
  const spellEnd = spell.start + spell.length;
  const trigger = shadeTriggerIndex(word, spellEnd, process);
  return (
    <span className="font-mono">
      {word.split("").map((ch, i) => {
        const inSpell = i >= spell.start && i < spellEnd;
        const isTrigger = i === trigger;
        return (
          <span
            key={i}
            className={
              inSpell
                ? "font-bold text-neutral-950 dark:text-white underline decoration-amber-400 decoration-2 underline-offset-4"
                : isTrigger
                  ? "font-bold text-sky-600 dark:text-sky-400"
                  : undefined
            }
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export function ShadeStage({
  info,
  shadeIndex,
  locale,
  onDone,
  ...chrome
}: StageChromeProps & {
  info: PhonemeInfo;
  shadeIndex: number;
  locale: Locale;
  onDone: (stats: StageStats) => void;
}) {
  const shade = useMemo(() => {
    const shades = shadesFor(info);
    return shades?.[shadeIndex] ?? null;
  }, [info, shadeIndex]);

  const [phase, setPhase] = useState<"intro" | "write">("intro");
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  });

  // Enter leaves the intro; the gym owns the keyboard afterwards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phaseRef.current === "intro") {
        e.preventDefault();
        setPhase("write");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!shade) return null;
  const proc = ALLO_PROCESS_INFO[shade.process];
  const Icon = PROCESS_ICON[shade.process] ?? Sparkles;
  const hasTrigger = shade.words.some((w) => {
    const s = findSpelling(w, info);
    return (
      s && shadeTriggerIndex(w, s.start + s.length, shade.process) >= 0
    );
  });

  if (phase === "write") {
    // Two passes over the shade's words — writing twice makes it stick.
    const drill = [...shade.words, ...shade.words];
    return (
      <GymStage
        text={drill.join(" ")}
        header={
          <div className="flex items-center gap-3 font-mono text-2xl font-bold text-neutral-400">
            {shade.symbol}
            <span className="font-sans text-sm font-medium text-sky-600 dark:text-sky-400">
              {proc.name[locale]}
            </span>
          </div>
        }
        {...chrome}
        onWordStart={(w) => speakWord(w)}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-7 w-full flex-1">
      {/* The variant symbol */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => speakWord(shade.words[0])}
          title={P.listenLabel[locale]}
          className="min-w-28 h-28 px-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center font-mono text-6xl font-bold text-neutral-900 dark:text-white shadow-sm hover:border-neutral-400 transition-colors cursor-pointer"
        >
          {shade.symbol}
        </button>
        <span className="font-mono text-[13px] text-neutral-400">
          /{info.symbol}/ · {shadeIndex + 1}
        </span>
      </div>

      {/* What the mouth does */}
      <div className="flex flex-col items-center gap-2 max-w-xl text-center px-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3.5 py-1.5 text-[14px] font-semibold text-sky-700 dark:text-sky-300">
          <Icon className="w-4 h-4" />
          {proc.name[locale]}
        </span>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          {proc.hint[locale]}
        </p>
      </div>

      {/* The shade in words — spelling underlined, trigger letter in sky */}
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
          {P.shadeSeeWords[locale]}
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap px-6">
          {shade.words.map((w, i) => (
            <button
              key={w}
              type="button"
              onClick={() => speakWord(w)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="inline-flex items-center gap-2 text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5"
            >
              <Volume2 className="w-4 h-4 text-neutral-400" />
              <ShadeWord word={w} info={info} process={shade.process} />
            </button>
          ))}
        </div>
        {hasTrigger && (
          <p className="mt-3 text-[13px] text-neutral-400">
            {P.shadeTriggerHint[locale]}
          </p>
        )}
      </div>

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
        {P.shadeStartHint[locale]}
      </p>
    </div>
  );
}
