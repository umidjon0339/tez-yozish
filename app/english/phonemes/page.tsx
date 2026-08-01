"use client";

// /english/phonemes — overview of the 50 English phonemes, the sounds
// analogue of /english/letters. A UK/US switch (US default) drives the whole
// page: the classified grid (single / double / triple vowels, then
// consonants), the SVG vowel chart, the consonant place × manner table and
// the minimal-pair cards. Switching never hides a sound — the other
// accent's sounds stay in place, dimmed and slightly blurred (hover
// restores them). Cards open the per-phoneme lesson hub
// (/english/phonemes/[phoneme]).

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Star, Volume2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import {
  ALLOPHONES,
  PHONEMES,
  PHONEME_BY_SLUG,
  VOICE_PAIRS,
  inAccent,
  type Accent,
  type PhonemeInfo,
} from "@/lib/phonemes";
import {
  VowelChart,
  DiphthongChart,
  ConsonantChart,
} from "@/components/phonemes/PhonemeCharts";
import {
  phonemeCompletedCount,
  phonemeDone,
  phonemeStars,
  usePhonemeProgress,
} from "@/lib/phonemeProgress";
import { phonemeLessonsFor } from "@/lib/phonemeCurriculum";

const P = STR.phonemes;
const L = STR.letters;
const E = STR.english;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* Small segmented control — same idiom as the letters overview. */
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

/* Region dot: sky = UK only, rose = US only (shared sounds get none). */
function RegionDot({ region }: { region: PhonemeInfo["region"] }) {
  if (region === "both") return null;
  return (
    <span
      aria-hidden
      className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
        region === "uk" ? "bg-sky-400" : "bg-rose-400"
      }`}
    />
  );
}

export default function PhonemesPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const progress = usePhonemeProgress();
  const [accent, setAccent] = useState<Accent>("us");
  // Each chart card carries its own UK/US switch, independent of the page one.
  const [vowelAccent, setVowelAccent] = useState<Accent>("us");
  const [dipAccent, setDipAccent] = useState<Accent>("us");
  const [consAccent, setConsAccent] = useState<Accent>("us");

  const activeCount = PHONEMES.filter((p) => inAccent(p, accent)).length;
  const groups: { label: string; items: PhonemeInfo[] }[] = [
    {
      label: P.groupMono[locale],
      items: PHONEMES.filter((p) => p.type === "vowel" && !p.diphthong),
    },
    {
      label: P.groupDi[locale],
      items: PHONEMES.filter((p) => p.diphthong && !p.triphthong),
    },
    {
      label: P.groupTri[locale],
      items: PHONEMES.filter((p) => p.triphthong),
    },
    {
      label: L.filterConsonants[locale],
      items: PHONEMES.filter((p) => p.type === "consonant"),
    },
  ];

  const doneCount = PHONEMES.filter((p) => phonemeDone(progress, p.slug)).length;
  const totalStars = PHONEMES.reduce(
    (sum, p) => sum + phonemeStars(progress, p.slug),
    0,
  );
  const nextPhoneme = PHONEMES.find((p) => !phonemeDone(progress, p.slug));

  // Minimal-pair showcase: each rival relation once (both directions dedupe).
  const pairCards = PHONEMES.filter((p) => {
    if (!p.rival) return true; // /h/ — its "rival" is silence
    const rival = PHONEME_BY_SLUG[p.rival];
    return !rival || rival.rival !== p.slug || p.slug < p.rival;
  });

  return (
    <div className="flex-1 bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-16 pb-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <Link
          href="/english"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {E.title[locale]}
        </Link>

        {/* Title + UK/US switch */}
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {P.title[locale]}{" "}
            <span className="text-neutral-300 dark:text-neutral-600 font-mono text-2xl align-middle">
              /{activeCount}/
            </span>
          </h1>
          <Segmented
            value={accent}
            onChange={setAccent}
            options={[
              { id: "us", label: P.accentUs[locale] },
              { id: "uk", label: P.accentUk[locale] },
            ]}
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 max-w-2xl">
          {P.subtitle[locale]}
        </p>

        {/* UK / US legend */}
        <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            {E.ukOnly[locale]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            {E.usOnly[locale]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
            {P.paleHint[locale]}
          </span>
        </div>

        {/* Progress + continue */}
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-neutral-200/70 dark:bg-neutral-700/70 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
              style={{ width: `${(doneCount / PHONEMES.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {doneCount} / {PHONEMES.length}
          </span>
          {totalStars > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {totalStars}
            </span>
          )}
          {nextPhoneme && (
            <Link
              href={`/english/phonemes/${nextPhoneme.slug}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-2 rounded-md transition-colors shadow-sm active:scale-95 whitespace-nowrap"
            >
              {doneCount > 0 ? L.continueBtn[locale] : L.startBtn[locale]}:{" "}
              <span className="font-mono">/{nextPhoneme.symbol}/</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Classified grid — vowels first (single / double / triple), then
            consonants. Each card opens the sound's lesson hub. */}
        {groups.map((g) => (
          <section key={g.label} className="mt-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {g.label}{" "}
              <span className="font-mono text-neutral-300 dark:text-neutral-600">
                · {g.items.filter((p) => inAccent(p, accent)).length}
              </span>
            </h2>
            <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {g.items.map((p) => {
                const allos = ALLOPHONES[p.symbol] ?? [];
                const total = phonemeLessonsFor(p.slug).filter(
                  (l) => l.implemented,
                ).length;
                const done = phonemeCompletedCount(progress, p.slug);
                return (
                  <Link
                    key={p.slug}
                    href={`/english/phonemes/${p.slug}`}
                    className={[
                      "group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-neutral-900 text-center transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800",
                      inAccent(p, accent)
                        ? ""
                        : "opacity-35 blur-[1px] hover:opacity-100 hover:blur-none",
                      "hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md",
                    ].join(" ")}
                  >
                    <RegionDot region={p.region} />
                    <div className="flex-1 px-2.5 pt-3.5 pb-3">
                      <span className="block font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-none whitespace-nowrap">
                        {p.symbol}
                      </span>
                      {/* The phoneme's real shades — its allophones as chips.
                          Hover a variant to see an example word (same data as
                          the /english IPA block's IpaTileGrid). */}
                      {allos.length > 0 ? (
                        <span className="mt-2.5 flex flex-wrap items-center justify-center gap-1">
                          {allos.map((a) => (
                            <span
                              key={a.symbol}
                              title={`${a.symbol} — ${a.word}`}
                              className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none text-neutral-600 dark:text-neutral-400 transition-colors group-hover:bg-neutral-950/5 dark:group-hover:bg-white/5"
                            >
                              {a.symbol}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="mt-2.5 block text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                          {p.examples[0].word}
                        </span>
                      )}
                    </div>
                    {/* Progress meter — completed lessons of this sound, the
                        same emerald bar as the course section cards. */}
                    <div
                      className="h-1 w-full bg-neutral-100 dark:bg-neutral-800"
                      title={`${done} / ${total}`}
                    >
                      <div
                        className="h-full bg-emerald-500 transition-[width] duration-500"
                        style={{
                          width: total ? `${(done / total) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Vowel chart — the mouth map, with its own UK/US switch */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {P.vowelChartTitle[locale]}
            </h2>
            <Segmented
              value={vowelAccent}
              onChange={setVowelAccent}
              options={[
                { id: "us", label: P.accentUs[locale] },
                { id: "uk", label: P.accentUk[locale] },
              ]}
            />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {P.vowelChartCaption[locale]}
          </p>
          <div className="mt-4">
            <VowelChart accent={vowelAccent} />
          </div>
        </div>

        {/* Double vowel chart — glide arrows, with its own UK/US switch */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {P.diphthongChartTitle[locale]}
            </h2>
            <Segmented
              value={dipAccent}
              onChange={setDipAccent}
              options={[
                { id: "us", label: P.accentUs[locale] },
                { id: "uk", label: P.accentUk[locale] },
              ]}
            />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {P.diphthongChartCaption[locale]}
          </p>
          <div className="mt-4">
            <DiphthongChart accent={dipAccent} />
          </div>
        </div>

        {/* Consonant chart — place × manner, with its own UK/US switch */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {P.consonantChartTitle[locale]}
            </h2>
            <Segmented
              value={consAccent}
              onChange={setConsAccent}
              options={[
                { id: "us", label: P.accentUs[locale] },
                { id: "uk", label: P.accentUk[locale] },
              ]}
            />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {P.consonantChartCaption[locale]}
          </p>
          <div className="mt-4">
            <ConsonantChart accent={consAccent} />
          </div>
        </div>

        {/* Voiced or voiceless — the eight consonant partner pairs */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {P.voicePairsTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {P.voicePairsCaption[locale]}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {VOICE_PAIRS.map(([a, b]) => {
              const pa = PHONEME_BY_SLUG[a];
              const pb = PHONEME_BY_SLUG[b];
              return (
                <div
                  key={a}
                  className="rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/english/phonemes/${pa.slug}`}
                      className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:underline underline-offset-4"
                    >
                      {pa.symbol}
                    </Link>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <Link
                      href={`/english/phonemes/${pb.slug}`}
                      className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:underline underline-offset-4"
                    >
                      {pb.symbol}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                    <span>{P.voiceless[locale]}</span>
                    <span className="text-neutral-300 dark:text-neutral-600">/</span>
                    <span>{P.voiced[locale]}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speak(`${pa.examples[0].word}, ${pb.examples[0].word}`)
                    }
                    className="inline-flex items-center gap-1.5 text-[12px] font-mono font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-md px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    {pa.examples[0].word} · {pb.examples[0].word}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimal pairs — hear the difference, jump into the hub */}
        <div className="mt-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {P.minimalPairsTitle[locale]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {P.minimalPairsCaption[locale]}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pairCards.map((p) => {
              const rival = p.rival ? PHONEME_BY_SLUG[p.rival] : undefined;
              const [w1, w2] = p.pairs[0];
              return (
                <Link
                  key={p.slug}
                  href={`/english/phonemes/${p.slug}`}
                  className={[
                    "relative rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 transition-all cursor-pointer",
                    inAccent(p, accent)
                      ? ""
                      : "opacity-35 blur-[1px] hover:opacity-100 hover:blur-none",
                    "hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-sm",
                  ].join(" ")}
                >
                  <RegionDot region={p.region} />
                  <div className="font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {p.symbol}
                    <span className="text-neutral-300 dark:text-neutral-600 mx-1.5">·</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {rival ? rival.symbol : "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      {w1} · {w2}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        speak(`${w1}, ${w2}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          speak(`${w1}, ${w2}`);
                        }
                      }}
                      title={P.listenLabel[locale]}
                      className="shrink-0 p-1.5 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Practice everything CTA */}
        {nextPhoneme && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => router.push(`/english/phonemes/${nextPhoneme.slug}`)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-5 py-2.5 rounded-md transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              {doneCount > 0 ? L.continueBtn[locale] : L.startBtn[locale]}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
