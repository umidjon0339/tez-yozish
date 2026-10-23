"use client";

// Graphemes overview (/english/graphemes) — every English spelling in one
// classified table (vowels / consonants × 1–4 letters), each tile linking to
// its lesson hub, with per-element progress from tz-graphemes-v1. Below the
// table: the "one spelling — two sounds" reference card (the tricky
// spellings, with their sounds).

import React from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { GRAPHEMES, type GraphemeInfo } from "@/lib/english/graphemes";
import { graphemeHubHref } from "@/lib/english/graphemeCurriculum";
import {
  graphemeDone,
  graphemeStars,
  useGraphemeProgress,
} from "@/lib/english/graphemeProgress";

const G = STR.graphemes;
const E = STR.english;
const L = STR.letters;

const SIZE_LABEL = [E.monograph, E.digraph, E.trigraph, E.tetragraph];

/* Consonant blends (clusters) — NOT graphemes: each letter keeps its own
   sound, so they live here rather than in lib/english/graphemes.ts and link to no
   lesson hub. Order: l-blends · r-blends · s-blends · 3-letter. */
const BLENDS: { s: string; ipa: string }[] = [
  { s: "bl", ipa: "bl" },
  { s: "cl", ipa: "kl" },
  { s: "fl", ipa: "fl" },
  { s: "gl", ipa: "gl" },
  { s: "pl", ipa: "pl" },
  { s: "sl", ipa: "sl" },
  { s: "br", ipa: "br" },
  { s: "cr", ipa: "kr" },
  { s: "dr", ipa: "dr" },
  { s: "fr", ipa: "fr" },
  { s: "gr", ipa: "gr" },
  { s: "pr", ipa: "pr" },
  { s: "tr", ipa: "tr" },
  { s: "tw", ipa: "tw" },
  { s: "sc", ipa: "sk" },
  { s: "sk", ipa: "sk" },
  { s: "sm", ipa: "sm" },
  { s: "sn", ipa: "sn" },
  { s: "sp", ipa: "sp" },
  { s: "st", ipa: "st" },
  { s: "sw", ipa: "sw" },
  { s: "scr", ipa: "skr" },
  { s: "spl", ipa: "spl" },
  { s: "spr", ipa: "spr" },
  { s: "str", ipa: "str" },
  { s: "thr", ipa: "θr" },
  { s: "squ", ipa: "skw" },
];

export default function GraphemesPage() {
  const { locale } = useLocale();
  const progress = useGraphemeProgress();

  const doneCount = GRAPHEMES.filter((x) =>
    graphemeDone(progress, "graphemes", x.slug),
  ).length;
  const totalStars = GRAPHEMES.reduce(
    (sum, x) => sum + graphemeStars(progress, "graphemes", x.slug),
    0,
  );
  const next =
    GRAPHEMES.find((x) => !graphemeDone(progress, "graphemes", x.slug)) ??
    GRAPHEMES[0];

  const doneDot = (
    <span
      aria-hidden
      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
    />
  );

  const starBadge = (stars: number) =>
    stars > 0 && (
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
        {stars}
      </span>
    );

  /* Two-row card: the spelling on top, its sounds below. */
  const tile = (x: GraphemeInfo) => {
    const stars = graphemeStars(progress, "graphemes", x.slug);
    const done = graphemeDone(progress, "graphemes", x.slug);
    return (
      <Link
        key={x.slug}
        href={graphemeHubHref("graphemes", x.slug)}
        className={`relative flex flex-col items-center justify-center px-2 py-1.5 rounded-md border shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white ${
          x.kind === "vowel"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <span
          className={`font-mono text-base font-semibold leading-tight ${
            x.kind === "vowel" ? "text-emerald-900" : "text-neutral-900 dark:text-neutral-100"
          }`}
        >
          {x.spelling}
        </span>
        <span className="font-mono text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight whitespace-nowrap">
          {x.sounds.map((s) => `/${s.ipa}/`).join(" ")}
        </span>
        {starBadge(stars)}
        {done && doneDot}
      </Link>
    );
  };

  const soundChip = (ipa: string) => (
    <span
      key={ipa}
      className="flex-1 inline-flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 shadow-sm"
    >
      /{ipa}/
    </span>
  );

  /* Phonics mark over a v: macron = long, breve = short (CSS-drawn). */
  const vMark = (kind: "long" | "short") => (
    <span className="relative inline-block font-mono text-[14px] font-bold text-emerald-600">
      v
      {kind === "long" ? (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-[0.12em] w-[0.55em] border-t-[0.08em] border-current"
        />
      ) : (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-[0.02em] h-[0.22em] w-[0.55em] rounded-b-full border-b-[0.08em] border-current"
        />
      )}
    </span>
  );

  /* Header over the monograph-vowel lines: v̆ short · v̄ long · … · ə. */
  const lineHeader = (list: GraphemeInfo[]) => {
    const cols = Math.max(
      ...list.map((x) => x.sounds.filter((s) => s.ipa !== "ə").length),
    );
    const hasSchwa = list.some((x) => x.sounds.some((s) => s.ipa === "ə"));
    return (
      <div className="flex items-center gap-1.5" aria-hidden>
        {/* invisible letter tile + arrow keep the header aligned with rows */}
        <span className="invisible inline-flex items-center justify-center min-w-11 px-2 py-1.5 rounded-md border font-mono text-base font-semibold">
          a
        </span>
        <span className="invisible">→</span>
        {Array.from({ length: cols }, (_, i) => (
          <span key={i} className="flex-1 text-center">
            {i === 0 ? (
              vMark("short")
            ) : i === 1 ? (
              vMark("long")
            ) : (
              <span className="font-mono text-[13px] font-bold text-neutral-300 dark:text-neutral-600">
                …
              </span>
            )}
          </span>
        ))}
        {hasSchwa && (
          <span className="flex-1 text-center font-mono text-[14px] font-bold text-emerald-600">
            ə
          </span>
        )}
      </div>
    );
  };

  /* One grapheme per line, its sounds stretched beside it as chips, the
     schwa /ə/ always in the last column (the monograph-vowel cell). */
  const lineRow = (x: GraphemeInfo) => {
    const stars = graphemeStars(progress, "graphemes", x.slug);
    const done = graphemeDone(progress, "graphemes", x.slug);
    return (
      <div key={x.slug} className="flex items-center gap-1.5">
        <Link
          href={graphemeHubHref("graphemes", x.slug)}
          className="relative inline-flex items-center justify-center gap-1 min-w-11 px-2 py-1.5 rounded-md border font-mono text-base font-semibold shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white bg-emerald-500/10 text-emerald-900 border-emerald-500/30"
        >
          {x.spelling}
          {starBadge(stars)}
          {done && doneDot}
        </Link>
        <span className="text-neutral-300 dark:text-neutral-600">→</span>
        {x.sounds.filter((s) => s.ipa !== "ə").map((s) => soundChip(s.ipa))}
        {x.sounds.some((s) => s.ipa === "ə") && soundChip("ə")}
      </div>
    );
  };

  const multiSound = GRAPHEMES.filter((x) => x.sounds.length >= 2);

  return (
    <div className="flex-1 bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <Link
          href="/english"
          className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          {L.backToUnits[locale]}
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {G.title[locale]}
        </h1>
        <p className="mt-1 text-[14px] text-neutral-600 dark:text-neutral-400">
          {G.subtitle[locale]}
        </p>

        {/* Progress + continue */}
        <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-48">
            <span className="font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {doneCount} / {GRAPHEMES.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${(doneCount / GRAPHEMES.length) * 100}%`,
                }}
              />
            </div>
            {totalStars > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {totalStars}
              </span>
            )}
          </div>
          <Link
            href={graphemeHubHref("graphemes", next.slug)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
          >
            {doneCount > 0 ? L.continueBtn[locale] : L.startBtn[locale]}:{" "}
            <span className="font-mono">{next.spelling}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* The classified table: size × vowel/consonant */}
        <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 overflow-x-auto">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr>
                <th className="w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2" />
                <th className="border border-neutral-200 dark:border-neutral-800 bg-emerald-500/10 p-2 text-[11px] uppercase tracking-wider font-semibold text-emerald-900">
                  {L.filterVowels[locale]}
                </th>
                <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-[11px] uppercase tracking-wider font-semibold text-neutral-600 dark:text-neutral-400">
                  {L.filterConsonants[locale]}
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  {
                    label: SIZE_LABEL[0][locale],
                    sizes: [1],
                    lines: true,
                    cCols: "grid-cols-4",
                  },
                  {
                    label: SIZE_LABEL[1][locale],
                    sizes: [2],
                    vCols: "grid-cols-3",
                    cCols: "grid-cols-3",
                  },
                  {
                    label: `${SIZE_LABEL[2][locale]} · ${SIZE_LABEL[3][locale]}`,
                    sizes: [3, 4],
                    vCols: "grid-cols-3",
                    cCols: "grid-cols-2",
                  },
                ] as {
                  label: string;
                  sizes: number[];
                  lines?: boolean;
                  vCols?: string;
                  cCols: string;
                }[]
              ).map((row) => {
                const vowels = GRAPHEMES.filter(
                  (x) =>
                    x.kind === "vowel" && row.sizes.includes(x.size),
                );
                const consonants = GRAPHEMES.filter(
                  (x) =>
                    x.kind === "consonant" && row.sizes.includes(x.size),
                );
                return (
                  <tr key={row.label}>
                    <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-left align-top text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">
                      {row.label}
                    </th>
                    <td className="w-1/2 border border-neutral-200 dark:border-neutral-800 p-2 align-top">
                      {row.lines ? (
                        <div className="flex flex-col gap-1.5">
                          {lineHeader(vowels)}
                          {vowels.map(lineRow)}
                        </div>
                      ) : (
                        <div className={`grid ${row.vCols} gap-1.5`}>
                          {vowels.map(tile)}
                        </div>
                      )}
                    </td>
                    <td className="w-1/2 border border-neutral-200 dark:border-neutral-800 p-2 align-top">
                      <div className={`grid ${row.cCols} gap-1.5`}>
                        {consonants.map(tile)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Consonant blends — NOT graphemes: each letter keeps its own
            sound (st = /s/+/t/, unlike the digraph sh = /ʃ/), so they sit
            outside the table and carry no lesson hubs. */}
        <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {E.blends[locale]}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {E.blendsCaption[locale]}
          </p>
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-1.5">
            {BLENDS.map((b) => (
              <span
                key={b.s}
                className="flex flex-col items-center justify-center px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm"
              >
                <span className="font-mono text-base font-semibold leading-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                  {b.s}
                </span>
                <span className="font-mono text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-tight whitespace-nowrap">
                  /{b.ipa}/
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* One spelling — two sounds */}
        <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {G.multiSoundTitle[locale]}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
            {G.multiSoundCaption[locale]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {multiSound.map((x) => (
              <Link
                key={x.slug}
                href={graphemeHubHref("graphemes", x.slug)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white"
              >
                <span className="font-mono text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {x.spelling}
                </span>
                <span className="text-neutral-300 dark:text-neutral-600">→</span>
                {x.sounds.map((s) => (
                  <span
                    key={s.ipa}
                    className="font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400"
                  >
                    /{s.ipa}/
                  </span>
                ))}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
