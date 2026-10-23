"use client";

// The screen the reference shows when a test ends: the two headline numbers on
// the left, a speed-over-time chart on the right, and a row of secondary
// figures under both. The chart is hand-built SVG, like every other chart in
// this app (see components/stats/) — no charting dependency.

import React from "react";
import { RotateCcw, Repeat } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { Standing } from "@/components/home/Standing";
import type { TestResult as Result } from "@/lib/typing/typingTest";

/* A wide, short viewBox: the chart fills the row beside the headline numbers,
   and the result screen has more width than height to spare. Keep the ratio
   flat — the svg scales to its container, so a taller box here costs vertical
   room the one-screen budget does not have (docs/home-test.md §6). */
const W = 760;
const H = 130;
const PAD = { l: 26, r: 8, t: 10, b: 18 };

function Chart({ result }: { result: Result }) {
  const pts = result.samples;
  if (pts.length < 2) return null;

  const maxY = Math.max(10, ...pts.map((p) => Math.max(p.wpm, p.raw))) * 1.1;
  const maxX = pts[pts.length - 1].t;
  const x = (t: number) => PAD.l + ((W - PAD.l - PAD.r) * t) / Math.max(1, maxX);
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / maxY);
  const line = (key: "wpm" | "raw") =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");

  const ticks = [0, Math.round(maxY / 2), Math.round(maxY)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-hidden>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(t)}
            y2={y(t)}
            className="stroke-neutral-200 dark:stroke-white/10"
            strokeWidth={1}
          />
          <text
            x={PAD.l - 6}
            y={y(t) + 3}
            textAnchor="end"
            className="fill-neutral-400 text-[9px] font-mono"
          >
            {t}
          </text>
        </g>
      ))}
      {/* raw first, so the corrected line reads on top of it */}
      <path
        d={line("raw")}
        fill="none"
        className="stroke-neutral-300 dark:stroke-white/25"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d={line("wpm")}
        fill="none"
        className="stroke-neutral-900 dark:stroke-white"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* a mark wherever a wrong letter was standing at that second */}
      {pts.map((p, i) =>
        i > 0 && p.errors > pts[i - 1].errors ? (
          <circle key={i} cx={x(p.t)} cy={y(p.wpm)} r={2.6} className="fill-rose-500" />
        ) : null,
      )}
    </svg>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div title={hint}>
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div className="font-mono text-[15px] text-neutral-800 dark:text-neutral-200">{value}</div>
    </div>
  );
}

export function TestResult({
  result,
  onNext,
  onRepeat,
}: {
  result: Result;
  onNext: () => void;
  onRepeat: () => void;
}) {
  const { locale } = useLocale();
  const T = STR.test;
  const c = result.chars;

  return (
    <div className="w-full animate-[fade-in-up_220ms_ease-out]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-40 shrink-0">
          <div className="font-mono text-[11px] uppercase tracking-wide text-neutral-400">
            {T.wpm[locale]}
          </div>
          <div className="font-mono text-5xl font-semibold leading-none sm:text-6xl">
            {result.wpm}
          </div>
          <div className="mt-2.5 font-mono text-[11px] uppercase tracking-wide text-neutral-400">
            {T.accuracy[locale]}
          </div>
          <div className="font-mono text-3xl font-semibold leading-none sm:text-4xl">
            {Math.round(result.accuracy)}%
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Chart result={result} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-neutral-200 pt-2.5 sm:grid-cols-5 dark:border-white/10">
        <Stat label={T.testType[locale]} value={`${T[result.mode][locale]} ${result.modeValue}`} />
        <Stat label={T.raw[locale]} value={String(result.raw)} />
        <Stat
          label={T.characters[locale]}
          value={`${c.correct}/${c.incorrect}/${c.extra}/${c.missed}`}
          hint={T.charsHint[locale]}
        />
        <Stat label={T.consistency[locale]} value={`${Math.round(result.consistency)}%`} />
        <Stat label={T.duration[locale]} value={`${(result.timeMs / 1000).toFixed(1)}s`} />
      </div>

      {result.source && (
        <p className="mt-2 font-mono text-[11px] text-neutral-400">— {result.source}</p>
      )}

      {/* `modeValue` is the seconds for a time test and something non-numeric
          otherwise — `boardFor` only reads it in the time case. */}
      <Standing
        wpm={result.wpm}
        accuracy={result.accuracy}
        mode={result.mode}
        time={Number(result.modeValue) || 0}
      />

      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2} />
          {T.nextTest[locale]}
        </button>
        <button
          type="button"
          onClick={onRepeat}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-white/15 dark:text-neutral-400 dark:hover:border-white/30 dark:hover:text-white cursor-pointer"
        >
          <Repeat className="w-4 h-4" strokeWidth={2} />
          {T.repeat[locale]}
        </button>
      </div>
    </div>
  );
}
