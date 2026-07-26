"use client";

// Sound-spellings overview (/english/spellings) — every phoneme with the
// ways to write it, grouped Single / Double / Triple vowels + Consonants,
// each pill linking to its lesson hub, with per-element progress from
// tz-graphemes-v1. The UK/US switch dims (never hides) the other accent.
// Below the groups: the "one sound — many spellings" reference card.

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { inAccent, type Accent } from "@/lib/phonemes";
import { SPELLINGS, type SpellingInfo } from "@/lib/graphemes";
import { graphemeHubHref } from "@/lib/graphemeCurriculum";
import {
  graphemeDone,
  graphemeStars,
  useGraphemeProgress,
} from "@/lib/graphemeProgress";

const G = STR.graphemes;
const E = STR.english;
const L = STR.letters;
const P = STR.phonemes;

export default function SpellingsPage() {
  const { locale } = useLocale();
  const progress = useGraphemeProgress();
  const [accent, setAccent] = useState<Accent>("us");

  const doneCount = SPELLINGS.filter((s) =>
    graphemeDone(progress, "spellings", s.phoneme.slug),
  ).length;
  const totalStars = SPELLINGS.reduce(
    (sum, s) => sum + graphemeStars(progress, "spellings", s.phoneme.slug),
    0,
  );
  const next =
    SPELLINGS.find(
      (s) => !graphemeDone(progress, "spellings", s.phoneme.slug),
    ) ?? SPELLINGS[0];

  const groups: { label: string; items: SpellingInfo[] }[] = [
    {
      label: P.groupMono[locale],
      items: SPELLINGS.filter(
        (s) => s.phoneme.type === "vowel" && !s.phoneme.diphthong,
      ),
    },
    {
      label: P.groupDi[locale],
      items: SPELLINGS.filter(
        (s) =>
          s.phoneme.type === "vowel" &&
          s.phoneme.diphthong &&
          !s.phoneme.triphthong,
      ),
    },
    {
      label: P.groupTri[locale],
      items: SPELLINGS.filter((s) => s.phoneme.triphthong),
    },
    {
      label: L.filterConsonants[locale],
      items: SPELLINGS.filter((s) => s.phoneme.type === "consonant"),
    },
  ];

  const pill = (s: SpellingInfo) => {
    const slug = s.phoneme.slug;
    const stars = graphemeStars(progress, "spellings", slug);
    const done = graphemeDone(progress, "spellings", slug);
    const dim = !inAccent(s.phoneme, accent);
    return (
      <Link
        key={slug}
        href={graphemeHubHref("spellings", slug)}
        className={[
          "relative inline-flex flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 shadow-sm transition-all hover:border-neutral-950 hover:ring-1 hover:ring-neutral-950",
          s.phoneme.region === "uk"
            ? "bg-sky-500/10 border-sky-500/30"
            : s.phoneme.region === "us"
              ? "bg-rose-500/10 border-rose-500/30"
              : "bg-white border-neutral-300",
          dim ? "opacity-35 blur-[1px] hover:opacity-100 hover:blur-none" : "",
        ].join(" ")}
      >
        <span className="font-mono text-lg font-bold text-neutral-900 leading-tight">
          /{s.phoneme.symbol}/
        </span>
        <span className="font-mono text-[11px] font-medium text-neutral-500 leading-tight text-center">
          {s.spellings.map((e) => e.grapheme.spelling).join(" · ")}
        </span>
        {stars > 0 && (
          <span className="inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold text-neutral-500">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            {stars}
          </span>
        )}
        {done && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        )}
      </Link>
    );
  };

  const manySpell = [...SPELLINGS]
    .filter((s) => s.spellings.length >= 3)
    .sort((a, b) => b.spellings.length - a.spellings.length);

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-12 pb-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <Link
          href="/english"
          className="text-[13px] font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          {L.backToUnits[locale]}
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              {G.soundSpellings[locale]}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-600">
              {G.spellingsSubtitle[locale]}
            </p>
          </div>
          {/* US / UK switch — dims, never hides */}
          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm">
            {(["us", "uk"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAccent(a)}
                aria-pressed={accent === a}
                className={`px-3 py-1 rounded-md text-[13px] font-semibold transition-colors ${
                  accent === a
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {a === "us" ? P.accentUs[locale] : P.accentUk[locale]}
              </button>
            ))}
          </div>
        </div>

        {/* Progress + continue */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-48">
            <span className="font-mono text-[13px] font-semibold text-neutral-500 whitespace-nowrap">
              {doneCount} / {SPELLINGS.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${(doneCount / SPELLINGS.length) * 100}%`,
                }}
              />
            </div>
            {totalStars > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 whitespace-nowrap">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {totalStars}
              </span>
            )}
          </div>
          <Link
            href={graphemeHubHref("spellings", next.phoneme.slug)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 text-white hover:bg-neutral-800 px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
          >
            {doneCount > 0 ? L.continueBtn[locale] : L.startBtn[locale]}:{" "}
            <span className="font-mono">/{next.phoneme.symbol}/</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* The sounds, classified */}
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 pl-1">
                {group.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map(pill)}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-neutral-300 bg-white" />
            UK + US
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-sky-500/30 bg-sky-500/10" />
            {E.ukOnly[locale]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-rose-500/30 bg-rose-500/10" />
            {E.usOnly[locale]}
          </span>
          <span>{P.paleHint[locale]}</span>
        </div>

        {/* One sound — many spellings */}
        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold text-neutral-900">
            {G.manySpellTitle[locale]}
          </h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            {G.manySpellCaption[locale]}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {manySpell.map((s) => (
              <Link
                key={s.phoneme.slug}
                href={graphemeHubHref("spellings", s.phoneme.slug)}
                className="flex items-center gap-3 flex-wrap rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-neutral-950 hover:ring-1 hover:ring-neutral-950"
              >
                <span className="min-w-14 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 font-mono text-base font-bold text-neutral-900">
                  /{s.phoneme.symbol}/
                </span>
                <span className="text-neutral-300">→</span>
                {s.spellings.map((e) => (
                  <span
                    key={e.grapheme.slug}
                    className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[13px] font-semibold text-neutral-700"
                  >
                    {e.grapheme.spelling}
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
