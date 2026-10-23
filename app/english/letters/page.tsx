"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { LETTERS, type LetterInfo } from "@/lib/english/letters";
import {
  letterDone,
  letterStars,
  useLetterProgress,
} from "@/lib/english/letterProgress";
import { SignalFlag, SemaphoreFigure } from "@/components/LetterSignals";

const L = STR.letters;

type Filter = "all" | "vowels" | "consonants";
type Sort = "az" | "freq";

function matchesFilter(l: LetterInfo, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "vowels") return l.vowel || !!l.sometimesVowel;
  return !l.vowel; // "y" counts as a consonant
}

/* Small segmented control (filter + sort toggles). */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-0.5 shadow-sm">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={[
            "px-3 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer",
            value === o.id
              ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Letter-frequency bar chart ─────────────────────────────────────────
   Single-series SVG bars in the stats-chart idiom: thin bars with a 2px
   gap and rounded tops (flat baseline via clipPath), hairline gridlines,
   full-column hover targets with a tooltip, no legend. Clicking a bar
   opens that letter's practice page. Filtered-out letters are dimmed AND
   their labels fade — identity never rides on color alone. */
const BAR_REST = "var(--chart-muted)"; // neutral-300
const BAR_DIM = "var(--chart-empty)"; // neutral-200 (filtered out)
const BAR_HOVER = "var(--chart-muted-3)"; // neutral-500

function FrequencyChart({
  sort,
  filter,
  onPick,
  ofAllLetters,
  height = 240,
}: {
  sort: Sort;
  filter: Filter;
  onPick: (c: string) => void;
  ofAllLetters: string;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const arr = [...LETTERS];
    if (sort === "freq") arr.sort((a, b) => b.freq - a.freq);
    return arr;
  }, [sort]);

  const PAD_L = 34;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 22;
  const innerW = Math.max(120, width - PAD_L - PAD_R);
  const innerH = height - PAD_T - PAD_B;
  const band = innerW / data.length;
  const barW = Math.max(3, Math.min(26, band - 2));
  const maxFreq = Math.max(...data.map((d) => d.freq));
  const y = (f: number) => PAD_T + innerH - (f / (maxFreq * 1.08)) * innerH;
  const xMid = (i: number) => PAD_L + i * band + band / 2;

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={wrapRef} className="relative select-none">
      <svg
        width={width}
        height={height}
        className="block"
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="letter-freq-plot">
            <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} />
          </clipPath>
        </defs>
        {/* gridlines + y ticks */}
        {[4, 8, 12].map((v) =>
          v <= maxFreq ? (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={PAD_L + innerW}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 6}
                y={y(v) + 3.5}
                textAnchor="end"
                className="fill-neutral-400 font-mono"
                fontSize={10}
              >
                {v}%
              </text>
            </g>
          ) : null,
        )}
        {/* bars */}
        <g clipPath="url(#letter-freq-plot)">
          {data.map((d, i) => {
            const active = matchesFilter(d, filter);
            const fill =
              hover === i ? BAR_HOVER : active ? BAR_REST : BAR_DIM;
            return (
              <rect
                key={d.char}
                x={xMid(i) - barW / 2}
                y={y(d.freq)}
                width={barW}
                height={PAD_T + innerH - y(d.freq) + 6}
                rx={4}
                fill={fill}
              />
            );
          })}
        </g>
        {/* letter labels + full-column hit targets */}
        {data.map((d, i) => {
          const active = matchesFilter(d, filter);
          return (
            <g key={d.char}>
              <text
                x={xMid(i)}
                y={height - 7}
                textAnchor="middle"
                fontSize={11}
                className={[
                  "font-mono",
                  hover === i
                    ? "fill-neutral-950 font-bold"
                    : active
                      ? "fill-neutral-500"
                      : "fill-neutral-300",
                ].join(" ")}
              >
                {d.char}
              </text>
              <rect
                x={PAD_L + i * band}
                y={PAD_T}
                width={band}
                height={innerH + PAD_B}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setHover(i)}
                onClick={() => onPick(d.char)}
              />
            </g>
          );
        })}
      </svg>
      {/* tooltip */}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 shadow-sm"
          style={{
            left: Math.min(Math.max(xMid(hover), 60), width - 60),
            top: Math.max(0, y(hovered.freq) - 52),
          }}
        >
          <div className="whitespace-nowrap font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {hovered.char.toUpperCase()} · {hovered.freq}%
          </div>
          <div className="whitespace-nowrap text-[10px] text-neutral-400 dark:text-neutral-500">
            {ofAllLetters}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Signal-code glyphs (NATO-poster-style cards) ───────────────────
   Morse renders "." / "-" as filled pills; Braille renders the 2×3 cell
   column-first (dots 1-2-3 left, 4-5-6 right) with empty positions kept
   faintly visible so every letter's cell has the same footprint. */
function MorseCode({ code }: { code: string }) {
  return (
    <span className="flex items-center gap-1.25 h-2" aria-label={code}>
      {code.split("").map((s, i) => (
        <span
          key={i}
          className={[
            "h-2 rounded-full bg-neutral-800 dark:bg-neutral-200",
            s === "-" ? "w-5" : "w-2",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function BrailleCell({ dots, big = false }: { dots: number[]; big?: boolean }) {
  return (
    <span
      className={`grid w-fit grid-rows-3 grid-flow-col ${big ? "gap-1.5" : "gap-1"}`}
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span
          key={n}
          className={[
            big ? "w-3 h-3" : "w-2 h-2",
            "rounded-full",
            dots.includes(n) ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

/* ── ASCII mini-table — the letter as a computer sees it ─────────────
   One row per case: decimal, hex and 8-bit binary of the char code.
   DEC/HEX/BIN are notation names, identical across locales. */
function AsciiTable({ char }: { char: string }) {
  const rows = [char.toUpperCase(), char].map((c) => {
    const n = c.charCodeAt(0);
    return {
      c,
      dec: String(n),
      hex: n.toString(16).toUpperCase(),
      bin: n.toString(2).padStart(8, "0"),
    };
  });
  return (
    <div className="mt-4 font-mono text-end">
      <div className="grid grid-cols-[1.1rem_2.2rem_2.2rem_1fr] gap-x-2 text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        <span />
        <span>Dec</span>
        <span>Hex</span>
        <span>Bin</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.c}
          className="grid grid-cols-[1.1rem_2.2rem_2.2rem_1fr] gap-x-2 text-[11px] leading-5"
        >
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{r.c}</span>
          <span className="text-neutral-600 dark:text-neutral-400">{r.dec}</span>
          <span className="text-neutral-600 dark:text-neutral-400">{r.hex}</span>
          <span className="text-neutral-600 dark:text-neutral-400 tracking-tight">{r.bin}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function LettersPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const progress = useLetterProgress();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("freq");

  const doneCount = LETTERS.filter((l) => letterDone(progress, l.char)).length;
  const totalStars = LETTERS.reduce(
    (sum, l) => sum + letterStars(progress, l.char),
    0,
  );
  const nextChar = LETTERS.find((l) => !letterDone(progress, l.char))?.char;

  return (
    <div className="flex-1 bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <Link
          href="/english"
          className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          {L.backToUnits[locale]}
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {L.title[locale]}
          </h1>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: `${L.filterAll[locale]} · 26` },
              {
                id: "vowels",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full bg-red-300"
                    />
                    {L.filterVowels[locale]} · 5
                  </span>
                ),
              },
              { id: "consonants", label: `${L.filterConsonants[locale]} · 21` },
            ]}
          />
        </div>

        {/* Progress + continue */}
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-neutral-200/70 dark:bg-neutral-700/70 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
              style={{ width: `${(doneCount / LETTERS.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {doneCount} / {LETTERS.length}
          </span>
          {totalStars > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {totalStars}
            </span>
          )}
          {nextChar && (
            <Link
              href={`/english/letters/${nextChar}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-md transition-colors shadow-sm active:scale-95 whitespace-nowrap"
            >
              {doneCount > 0 ? L.continueBtn[locale] : L.startBtn[locale]}:{" "}
              {nextChar.toUpperCase()}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Letter grid — each card opens the letter's practice flow.
            Filtering never removes cards; non-matching letters stay in
            place, dimmed and slightly blurred (hover restores them). */}
        <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {LETTERS.map((l) => {
            const stars = letterStars(progress, l.char);
            const active = matchesFilter(l, filter);
            const isSometimes = filter === "vowels" && l.sometimesVowel;
            return (
              <Link
                key={l.char}
                href={`/english/letters/${l.char}`}
                className={[
                  "relative rounded-lg bg-white dark:bg-neutral-900 p-3 text-center transition-all cursor-pointer",
                  isSometimes
                    ? "border border-dashed border-neutral-300 dark:border-neutral-700"
                    : "border border-neutral-200 dark:border-neutral-800",
                  active ? "" : "opacity-35 blur-[1px] hover:opacity-100 hover:blur-none",
                  "hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-sm",
                ].join(" ")}
              >
                {l.vowel && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-300"
                  />
                )}
                <span className="block font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                  {l.char.toUpperCase()}
                  {l.char}
                </span>
                <span className="mt-2 block text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                  {l.name}
                </span>
                {/* Test + game stars, 0–10 per letter, shown as a count */}
                <span className="mt-1.5 flex items-center justify-center gap-1 h-2.5 font-mono text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                  {stars > 0 && (
                    <>
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {stars}
                    </>
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Frequency chart */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {L.chartTitle[locale]}
            </h2>
            <Segmented
              value={sort}
              onChange={setSort}
              options={[
                { id: "az", label: L.sortAz[locale] },
                { id: "freq", label: L.sortFreq[locale] },
              ]}
            />
          </div>
          <div className="mt-4">
            <FrequencyChart
              sort={sort}
              filter={filter}
              onPick={(c) => router.push(`/english/letters/${c}`)}
              ofAllLetters={L.ofAllLetters[locale]}
            />
          </div>
        </div>

        {/* Alphabet history — the poster is dark, so it sits in its own
            rounded frame inside the standard white card. */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {L.historyTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {L.historyCaption[locale]}
          </p>
          <img
            src="/images/alphabet-evolution.png"
            alt={L.historyAlt[locale]}
            width={1280}
            height={960}
            loading="lazy"
            className="mt-4 w-full h-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
          />
          <p className="mt-2 text-right text-[11px] text-neutral-400 dark:text-neutral-500">
            Matt Baker · usefulcharts.com
          </p>
        </div>

        {/* Signal codes — NATO code word, Morse and Braille per letter */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {L.signalsTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {L.signalsCaption[locale]}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LETTERS.map((l) => (
              <Link
                key={l.char}
                href={`/english/codes/${l.char}`}
                className="relative rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 transition-all cursor-pointer hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-sm"
              >
                {l.vowel && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-300"
                  />
                )}
                {/* Header row: letter + code word left, Morse top-right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                      {l.char.toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {l.nato}
                      </span>
                      <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                        ({l.say})
                      </span>
                    </span>
                  </div>
                  <span className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                    <MorseCode code={l.morse} />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {L.morseLabel[locale]}
                    </span>
                  </span>
                </div>
                {/* Bottom row: flag left, semaphore right */}
                <div className="mt-4 grid grid-cols-2 gap-x-4">
                  <span className="flex flex-col justify-end gap-1.5 items-center">
                    <SignalFlag char={l.char} className="h-10 w-10" />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {L.flagLabel[locale]}
                    </span>
                  </span>
                  <span className="flex flex-col justify-end gap-1.5 items-end">
                    <SemaphoreFigure
                      angles={l.semaphore}
                      className="h-11 w-11"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {L.semaphoreLabel[locale]}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Fingers & dots — ASL fingerspelling + Braille per letter.
            Hand SVGs are the public-domain set in public/asl/ (Wikimedia
            Commons "Sign language A…Z", via wpclipart.com). */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {L.fingersTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {L.fingersCaption[locale]}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LETTERS.map((l) => (
              <Link
                key={l.char}
                href={`/english/codes/${l.char}`}
                className="relative rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 transition-all cursor-pointer hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-sm"
              >
                {l.vowel && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-300"
                  />
                )}
                <span className="block font-mono text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                  {l.char.toUpperCase()}
                  {l.char}
                </span>
                <div className="mt-4 grid grid-cols-2 gap-x-4">
                  <span className="flex flex-col justify-end gap-1.5 items-center">
                    <BrailleCell dots={l.braille} big />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {L.brailleLabel[locale]}
                    </span>
                  </span>
                  <span className="flex flex-col justify-end gap-1.5 items-end">
                    <img
                      src={`/asl/${l.char}.svg`}
                      alt={`${L.aslLabel[locale]} — ${l.char.toUpperCase()}`}
                      loading="lazy"
                      className="h-16 w-16 object-contain"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {L.aslLabel[locale]}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Inside the computer — the ASCII codes per letter */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {L.asciiTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {L.asciiCaption[locale]}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LETTERS.map((l) => (
              <Link
                key={l.char}
                href={`/english/codes/${l.char}`}
                className="relative rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 transition-all cursor-pointer hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-sm"
              >
                {l.vowel && (
                  <span
                    aria-hidden
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-300"
                  />
                )}
                <span className="block font-mono text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                  {l.char.toUpperCase()}
                  {l.char}
                </span>
                <AsciiTable char={l.char} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
