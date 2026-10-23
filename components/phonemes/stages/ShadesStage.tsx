"use client";

// SHADES — the allophone learn stage. Every variant of the sound is a card:
// tap it to hear its example word and read what the mouth does differently
// (process name + hint from lib/english/allophones.ts). All cards must be heard
// before Enter completes the lesson — so every allophone really gets seen.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Volume2 } from "lucide-react";
import { type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { type PhonemeInfo } from "@/lib/english/phonemes";
import { ALLO_PROCESS_INFO, allophoneCards } from "@/lib/english/allophones";
import { speakPhrase, speakWord } from "@/lib/english/phonemeAudio";

const P = STR.phonemes;
const L = STR.letters;

export function ShadesStage({
  info,
  locale,
  onDone,
}: {
  info: PhonemeInfo;
  locale: Locale;
  onDone: () => void;
}) {
  const cards = useMemo(() => allophoneCards(info), [info]);
  const single = cards.length === 1;
  const [heard, setHeard] = useState<Set<number>>(() => new Set());
  const [active, setActive] = useState<number | null>(null);
  const allHeard = heard.size >= cards.length;

  const onDoneRef = useRef(onDone);
  const allHeardRef = useRef(allHeard);
  useEffect(() => {
    onDoneRef.current = onDone;
    allHeardRef.current = allHeard;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && allHeardRef.current) {
        e.preventDefault();
        onDoneRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tap = (i: number) => {
    setActive(i);
    setHeard((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
    // "stop!" / "write (US)" clean to "stop" / "write"; connected-speech
    // examples like "got you" are phrases and always go through TTS.
    const w = cards[i].cleanWord || cards[i].word;
    if (w.includes(" ")) speakPhrase(w);
    else if (w) speakWord(w);
  };

  const detail = active !== null ? cards[active] : null;
  const detailInfo = detail ? ALLO_PROCESS_INFO[detail.process] : null;

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full flex-1">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3 font-mono text-2xl font-bold text-neutral-400">
          /{info.symbol}/
        </div>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          {single
            ? P.shadesOnlyOne[locale]
            : P.shadesPrompt[locale].replace("{n}", String(cards.length))}
        </p>
      </div>

      {/* The shade cards */}
      <div className="flex flex-wrap items-stretch justify-center gap-3 max-w-3xl">
        {cards.map((c, i) => {
          const isHeard = heard.has(i);
          const isActive = active === i;
          return (
            <button
              key={`${c.symbol}-${i}`}
              type="button"
              onClick={() => tap(i)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`relative w-32 rounded-xl border-2 px-3 py-4 flex flex-col items-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 ${
                isActive
                  ? "border-sky-500 bg-sky-500/5"
                  : isHeard
                    ? "border-emerald-300 dark:border-emerald-800 bg-white dark:bg-neutral-900"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-400"
              }`}
            >
              {isHeard && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                </span>
              )}
              <span className="font-mono text-3xl font-bold text-neutral-900 dark:text-white leading-none pt-1">
                {c.symbol}
              </span>
              <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 leading-tight text-center">
                {ALLO_PROCESS_INFO[c.process].name[locale]}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[13px] text-neutral-500 dark:text-neutral-400">
                <Volume2 className="w-3 h-3 text-neutral-400" />
                {c.word}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel for the tapped card — fixed height, no layout jumps */}
      <div className="h-16 flex items-center justify-center px-6 text-center">
        {detail && detailInfo ? (
          <p
            key={active}
            className="max-w-xl text-[15px] text-neutral-600 dark:text-neutral-300 animate-in fade-in duration-300"
          >
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {detail.symbol}
            </span>
            {" — "}
            {detailInfo.hint[locale]}
          </p>
        ) : (
          <p className="text-[13px] text-neutral-400">{P.shadesTapHint[locale]}</p>
        )}
      </div>

      {/* Progress + continue */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                heard.has(i)
                  ? "bg-emerald-500"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>
        <p
          className={`font-mono text-[12px] uppercase tracking-widest text-neutral-400 transition-opacity ${
            allHeard ? "animate-pulse" : "opacity-60"
          }`}
        >
          {allHeard
            ? L.pressEnterContinue[locale]
            : P.shadesHeardOf[locale]
                .replace("{a}", String(heard.size))
                .replace("{b}", String(cards.length))}
        </p>
      </div>
    </div>
  );
}
