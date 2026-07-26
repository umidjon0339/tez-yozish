"use client";

// MEET — the learn stage: the symbol, its spellings, its words, its rival,
// and a teaser row of the sound's shades (allophones, taught in SHADES).
// Enter completes; everything else is listen-and-look.

import React, { useEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { PHONEME_BY_SLUG, type PhonemeInfo } from "@/lib/phonemes";
import { allophoneCards } from "@/lib/allophones";
import { speakPhrase, speakWord } from "@/lib/phonemeAudio";
import { SpelledWord } from "@/components/english/stage-kit";

const P = STR.phonemes;
const L = STR.letters;

export function MeetStage({
  info,
  locale,
  onDone,
}: {
  info: PhonemeInfo;
  locale: Locale;
  onDone: () => void;
}) {
  const rival = info.rival ? PHONEME_BY_SLUG[info.rival] : undefined;
  const spellings = [...new Set(info.examples.map((e) => e.spell))];
  const shades = allophoneCards(info);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onDoneRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const typeLabel =
    info.type === "vowel"
      ? info.diphthong
        ? P.diphthong[locale]
        : L.vowel[locale]
      : `${L.consonant[locale]} · ${
          info.voiced ? P.voiced[locale] : P.voiceless[locale]
        }`;

  return (
    <div className="flex flex-col items-center justify-center gap-7 w-full flex-1">
      {/* The symbol */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => speakWord(info.examples[0].word)}
          title={P.listenLabel[locale]}
          className="min-w-28 h-28 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center font-mono text-6xl font-bold text-neutral-900 dark:text-white shadow-sm hover:border-neutral-400 transition-colors cursor-pointer"
        >
          /{info.symbol}/
        </button>
        <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
          <span>{typeLabel}</span>
          {info.region !== "both" && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                info.region === "uk"
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {info.region === "uk"
                ? STR.english.ukOnly[locale]
                : STR.english.usOnly[locale]}
            </span>
          )}
        </div>
        {info.type === "consonant" && (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            {info.voiced ? P.voicedHint[locale] : P.voicelessHint[locale]}
          </p>
        )}
      </div>

      {/* Spellings */}
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
          {P.spellingsLabel[locale]}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          {spellings.map((s) => (
            <span
              key={s}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 font-mono text-base font-semibold text-neutral-900 dark:text-white shadow-sm"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Hear it in words */}
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
          {P.examplesLabel[locale]}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 flex-wrap">
          {info.examples.map((e) => (
            <button
              key={e.word}
              type="button"
              onClick={() => speakWord(e.word)}
              className="inline-flex items-center gap-2 text-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-neutral-400" />
              <SpelledWord word={e.word} spell={e.spell} />
            </button>
          ))}
        </div>
      </div>

      {/* The rival sound + the shades teaser */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {rival && (
          <button
            type="button"
            onClick={() => speakPhrase(`${info.pairs[0][0]}, ${info.pairs[0][1]}`)}
            className="inline-flex items-center gap-3 text-[14px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-4 py-2 transition-colors cursor-pointer"
          >
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              {P.dontMixLabel[locale]}
            </span>
            <span className="font-mono font-bold">/{rival.symbol}/</span>
            <span className="font-mono">
              {info.pairs[0][0]} · {info.pairs[0][1]}
            </span>
            <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
        {shades.length > 1 && (
          <span className="inline-flex items-center gap-2 text-[14px] text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              {P.shadesTeaser[locale]}
            </span>
            <span className="font-mono font-bold">
              {shades
                .slice(0, 4)
                .map((s) => s.symbol)
                .join(" ")}
              {shades.length > 4 ? " …" : ""}
            </span>
          </span>
        )}
      </div>

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
        {L.pressEnterContinue[locale]}
      </p>
    </div>
  );
}
