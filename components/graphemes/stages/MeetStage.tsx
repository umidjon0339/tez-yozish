"use client";

// MEET — the learn stage: the element, one row per sound (graphemes) or
// per spelling (spellings), every word tappable to hear with the
// element's letters highlighted. Enter completes.

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";
import { type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { type MeetRow } from "@/lib/graphemes";
import { speakWord } from "@/lib/phonemeAudio";
import { SpelledWord } from "@/components/english/stage-kit";

const P = STR.phonemes;
const L = STR.letters;

export function MeetStage({
  head,
  typeLabel,
  region,
  label,
  rows,
  locale,
  onDone,
}: {
  head: string;
  typeLabel: string;
  region: "both" | "uk" | "us";
  label: string;
  rows: MeetRow[];
  locale: Locale;
  onDone: () => void;
}) {
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

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full flex-1">
      {/* The element */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => speakWord(rows[0]?.words[0]?.word ?? head)}
          title={P.listenLabel[locale]}
          className="min-w-28 h-28 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center font-mono text-6xl font-bold text-neutral-900 dark:text-white shadow-sm hover:border-neutral-400 transition-colors cursor-pointer"
        >
          {head}
        </button>
        <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
          <span>{typeLabel}</span>
          {region !== "both" && (
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                region === "uk"
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {region === "uk"
                ? STR.english.ukOnly[locale]
                : STR.english.usOnly[locale]}
            </span>
          )}
        </div>
      </div>

      {/* One row per sound (graphemes) / per spelling (spellings) */}
      <div className="text-center w-full">
        <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
          {label}
        </div>
        <div className="mt-3 flex flex-col items-center gap-3">
          {rows.map((row, ri) => (
            <div
              key={row.tile}
              className="flex items-center justify-center gap-2.5 flex-wrap px-4"
            >
              {row.href ? (
                <Link
                  href={row.href}
                  className="inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 font-mono text-base font-semibold text-neutral-900 dark:text-white shadow-sm hover:border-neutral-950 dark:hover:border-white transition-colors"
                >
                  {row.tile}
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 font-mono text-base font-semibold text-neutral-900 dark:text-white shadow-sm">
                  {row.tile}
                </span>
              )}
              {row.words.map((w, wi) => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => speakWord(w.word)}
                  style={{ animationDelay: `${(ri * 3 + wi) * 40}ms` }}
                  className="inline-flex items-center gap-2 text-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-lg px-3 py-1.5 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5"
                >
                  <Volume2 className="w-4 h-4 text-neutral-400" />
                  <SpelledWord word={w.word} spell={w.spell} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-[12px] uppercase tracking-widest text-neutral-400 animate-pulse">
        {L.pressEnterContinue[locale]}
      </p>
    </div>
  );
}
