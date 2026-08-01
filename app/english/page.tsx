"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { LETTERS } from "@/lib/letters";
import { useLetterProgress } from "@/lib/letterProgress";
import { PHONEMES } from "@/lib/phonemes";
import {
  phonemeDone,
  phonemeStars,
  usePhonemeProgress,
} from "@/lib/phonemeProgress";
import { GRAPHEMES, SPELLINGS } from "@/lib/graphemes";
import {
  graphemeDone,
  graphemeStars,
  useGraphemeProgress,
} from "@/lib/graphemeProgress";
import {
  ALPHABET,
  IPA_VOWELS,
  IPA_CONSONANTS,
  UK_SOUNDS,
  US_SOUNDS,
  GRAPHEME_SIZES,
  GraphemeTile,
  VOWEL_GRAPHEMES,
  CONSONANT_GRAPHEMES,
  SPELL_MONO,
  SPELL_DI,
  SPELL_TRI,
  SPELL_CONS,
  L3,
  POS_G,
  PHRASE_TABLE,
  CLAUSE_ANATOMY,
  CLAUSE_TABLE,
  SENT_STRUCT,
  SENT_TYPES,
  SENT_EL,
  SENT_PATTERNS,
  SP_CARDS,
  POS_TABLE,
} from "./_data";
import {
  PosTree,
  GroupLabel,
  TileGrid,
  IpaTileGrid,
  SubHeader,
  HeadCell,
  RowLabel,
  BodyCell,
  GraphemeLines,
  CellTiles,
  MapCell,
  SyllableSplit,
  CvPattern,
  PatternWord,
  TreeTag,
  TreeBranch,
  MorphLeaf,
  PosLeaf,
  ReadMark,
  loadStressStyle,
  serverStressStyle,
  noopSubscribe,
  StressSeg,
  StressWord,
  StressIpa,
  StressIpaExample,
  SplitPattern,
  SyllablePartCard,
} from "./_components";

const E = STR.english;

export default function EnglishPage() {
  const { locale } = useLocale();
  // Which way the stress table marks the stressed syllable — advances one
  // step per page load (tz-stress-style holds the last shown index).
  const stressStyle = React.useSyncExternalStore(
    noopSubscribe,
    loadStressStyle,
    serverStressStyle,
  );
  const letterProgress = useLetterProgress();
  const lettersDone = LETTERS.filter(
    (l) => letterProgress[l.char]?.completed,
  ).length;
  const letterStars = LETTERS.reduce(
    (sum, l) => sum + (letterProgress[l.char]?.stars ?? 0),
    0,
  );
  const soundProgress = usePhonemeProgress();
  const soundsDone = PHONEMES.filter((p) =>
    phonemeDone(soundProgress, p.slug),
  ).length;
  const soundStars = PHONEMES.reduce(
    (sum, p) => sum + phonemeStars(soundProgress, p.slug),
    0,
  );
  const graphemeProgress = useGraphemeProgress();
  const graphemesDone = GRAPHEMES.filter((x) =>
    graphemeDone(graphemeProgress, "graphemes", x.slug),
  ).length;
  const graphemesStars = GRAPHEMES.reduce(
    (sum, x) => sum + graphemeStars(graphemeProgress, "graphemes", x.slug),
    0,
  );
  const spellingsDone = SPELLINGS.filter((s) =>
    graphemeDone(graphemeProgress, "spellings", s.phoneme.slug),
  ).length;
  const spellingsStars = SPELLINGS.reduce(
    (sum, s) =>
      sum + graphemeStars(graphemeProgress, "spellings", s.phoneme.slug),
    0,
  );

  /* Counts + stars + chevron for the two grapheme sub-card headers. */
  const subStats = (done: number, total: number, stars: number) => (
    <>
      {done > 0 && (
        <>
          <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            {done} / {total}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {stars}
          </span>
        </>
      )}
      <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
    </>
  );

  /* The six levels, smallest → biggest. Each renders its own example.
     `plain` drops the gray example box so the content sits directly on
     the unit card (used when the example is already a full-width table). */
  const units: {
    name: string;
    desc?: string;
    example: React.ReactNode;
    href?: string;
    plain?: boolean;
  }[] = [
    {
      name: E.alphabetUnit[locale],
      desc: E.alphabetUnitDesc[locale],
      example: (
        <div className="flex flex-col gap-4">
          {/* English Latin alphabet → /english/letters */}
          <Link
            href="/english/letters"
            className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {E.alphabet[locale]}
              </span>
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {E.countLetters[locale].replace(
                    "{n}",
                    String(ALPHABET.length),
                  )}
                </span>
                {lettersDone > 0 && (
                  <>
                    <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {lettersDone} / {LETTERS.length}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {letterStars}
                    </span>
                  </>
                )}
                <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-4">
              <TileGrid symbols={ALPHABET} />
              {/* vowel / consonant legend */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-emerald-500/30 bg-emerald-500/10" />
                  {STR.letters.filterVowels[locale]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
                  {STR.letters.filterConsonants[locale]}
                </span>
              </div>
            </div>
          </Link>

          {/* International Phonetic Alphabet → /english/phonemes */}
          <Link
            href="/english/phonemes"
            className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {E.ipa[locale]}
              </span>
              <span className="flex items-center gap-2.5">
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-900">
                  UK{" "}
                  {E.countSounds[locale].replace("{n}", String(UK_SOUNDS))}
                </span>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-900">
                  US{" "}
                  {E.countSounds[locale].replace("{n}", String(US_SOUNDS))}
                </span>
                {soundsDone > 0 && (
                  <>
                    <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {soundsDone} / {PHONEMES.length}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {soundStars}
                    </span>
                  </>
                )}
                <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-neutral-400 dark:text-neutral-500">
              {E.soundLessons[locale]}
            </p>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <GroupLabel>{STR.letters.filterVowels[locale]}</GroupLabel>
                <IpaTileGrid symbols={IPA_VOWELS} />
              </div>
              <div>
                <GroupLabel>{STR.letters.filterConsonants[locale]}</GroupLabel>
                <IpaTileGrid symbols={IPA_CONSONANTS} />
              </div>
              {/* UK / US legend */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
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
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                    [tʰ ʔ]
                  </span>
                  {E.allophones[locale]}
                </span>
              </div>
            </div>
          </Link>
        </div>
      ),
    },
    {
      name: E.grapheme[locale],
      desc: E.graphemeDesc[locale],
      example: (
        <div className="flex flex-col gap-4">
          {/* 1) Grapheme → phoneme: the spellings, size × vowel/consonant */}
          <Link
            href="/english/graphemes"
            className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
          >
            <SubHeader
              title={E.graphemeToPhoneme[locale]}
              hint={E.readingHint[locale]}
              stats={subStats(graphemesDone, GRAPHEMES.length, graphemesStars)}
            />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-120 border-collapse">
                <thead>
                  <tr>
                    <th className="w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2" />
                    <HeadCell>{STR.letters.filterVowels[locale]}</HeadCell>
                    <HeadCell>{STR.letters.filterConsonants[locale]}</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      {
                        label: GRAPHEME_SIZES[0][locale],
                        v: VOWEL_GRAPHEMES[0],
                        c: CONSONANT_GRAPHEMES[0],
                        lines: true,
                        cGrid: [4, 5],
                      },
                      {
                        label: GRAPHEME_SIZES[1][locale],
                        v: VOWEL_GRAPHEMES[1],
                        c: CONSONANT_GRAPHEMES[1],
                        vGrid: [3, 4],
                        cGrid: [2, 4],
                      },
                      {
                        label: `${GRAPHEME_SIZES[2][locale]} · ${GRAPHEME_SIZES[3][locale]}`,
                        v: [...VOWEL_GRAPHEMES[2], ...VOWEL_GRAPHEMES[3]],
                        c: [
                          ...CONSONANT_GRAPHEMES[2],
                          ...CONSONANT_GRAPHEMES[3],
                        ],
                        vGrid: [3, 3],
                        cGrid: [2, 0],
                      },
                    ] as {
                      label: string;
                      v?: GraphemeTile[];
                      c?: GraphemeTile[];
                      lines?: boolean;
                      vGrid?: [number, number];
                      cGrid?: [number, number];
                    }[]
                  ).map((row) => (
                    <tr key={row.label}>
                      <RowLabel>{row.label}</RowLabel>
                      <BodyCell>
                        {!row.v || row.v.length === 0 ? (
                          <span className="text-neutral-300 dark:text-neutral-600">—</span>
                        ) : row.lines || !row.vGrid ? (
                          <GraphemeLines tiles={row.v} tint="plain" />
                        ) : (
                          <CellTiles
                            tiles={row.v}
                            tint="plain"
                            grid={row.vGrid}
                          />
                        )}
                      </BodyCell>
                      <BodyCell>
                        <CellTiles
                          tiles={row.c ?? []}
                          tint="plain"
                          grid={row.cGrid ?? [4, 0]}
                        />
                      </BodyCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Link>

          {/* 2) Phoneme → grapheme: each sound with its common spellings */}
          <Link
            href="/english/spellings"
            className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
          >
            <SubHeader
              title={E.phonemeToGrapheme[locale]}
              hint={E.spellingHint[locale]}
              stats={subStats(spellingsDone, SPELLINGS.length, spellingsStars)}
            />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-120 border-collapse">
                <thead>
                  <tr>
                    <th className="w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2" />
                    <HeadCell>{STR.letters.filterVowels[locale]}</HeadCell>
                    <HeadCell>{STR.letters.filterConsonants[locale]}</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: STR.phonemes.groupMono, items: SPELL_MONO },
                      { label: STR.phonemes.groupDi, items: SPELL_DI },
                      { label: STR.phonemes.groupTri, items: SPELL_TRI },
                    ] as const
                  ).map((group, i) => (
                    <tr key={group.label.en}>
                      <RowLabel>{group.label[locale]}</RowLabel>
                      <BodyCell w="w-2/3">
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((m) => (
                            <MapCell key={m.s} {...m} />
                          ))}
                        </div>
                      </BodyCell>
                      {i === 0 && (
                        <BodyCell rowSpan={3} w="w-1/3">
                          <div className="flex flex-wrap gap-1.5">
                            {SPELL_CONS.map((m) => (
                              <MapCell key={m.s} {...m} />
                            ))}
                          </div>
                        </BodyCell>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* UK / US legend */}
            <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
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
            </div>
          </Link>
        </div>
      ),
    },
    {
      name: E.syllable[locale],
      desc: E.syllableDesc[locale],
      example: (
        <div className="flex flex-col gap-4">
          {/* 1) By letters — orthographic */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {E.syllByLetters[locale]}
              </span>
              <SyllableSplit
                word="computer"
                parts={["com", "put", "er"]}
                sep="-"
              />
            </div>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              {E.syllByLettersDesc[locale]}
            </p>

            {/* Two ways to read a pattern: letters vs graphemes */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.twoWaysTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.cvLegend[locale]}
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* letter-based — every letter counts, so patterns never end */}
                <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        {E.letterBased[locale]}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {E.tagSimple[locale]}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 px-2 h-5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <span className="text-[13px] leading-none">∞</span>
                      {E.infinitePatterns[locale]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 min-h-4 text-neutral-400 dark:text-neutral-500">
                    {E.letterBasedHint[locale]}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {(
                      [
                        {
                          segs: [{ t: "sh", g: true }, { t: "ip" }],
                          pat: "CCVC",
                          hl: [0, 1],
                        },
                        {
                          segs: [{ t: "r" }, { t: "ai", g: true }, { t: "n" }],
                          pat: "CVVC",
                          hl: [1, 2],
                        },
                        {
                          segs: [
                            { t: "c" },
                            { t: "a", g: true },
                            { t: "k" },
                            { t: "e", g: true },
                          ],
                          pat: "CVCV",
                          hl: [1, 3],
                        },
                      ] as {
                        segs: { t: string; g?: boolean; silent?: boolean }[];
                        pat: string;
                        hl: number[];
                      }[]
                    ).map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 justify-between h-6"
                      >
                        <PatternWord segs={r.segs} />
                        <CvPattern pat={r.pat} hl={r.hl} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* grapheme-based — a fixed set of graphemes keeps patterns short */}
                <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        {E.graphemeBased[locale]}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {E.tagPhonics[locale]}
                      </span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 px-2 h-5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {E.countGraphemes[locale].replace(
                        "{n}",
                        String(GRAPHEMES.length),
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 min-h-4 text-neutral-400 dark:text-neutral-500">
                    {E.graphemeBasedHint[locale]}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {(
                      [
                        {
                          segs: [{ t: "sh", g: true }, { t: "ip" }],
                          pat: "CVC",
                          hl: [0],
                        },
                        {
                          segs: [{ t: "r" }, { t: "ai", g: true }, { t: "n" }],
                          pat: "CVC",
                          hl: [1],
                        },
                        {
                          segs: [
                            { t: "c" },
                            { t: "a", g: true },
                            { t: "k" },
                            { t: "e", g: true },
                          ],
                          pat: "CVCe",
                          hl: [1, 3],
                        },
                      ] as {
                        segs: { t: string; g?: boolean; silent?: boolean }[];
                        pat: string;
                        hl: number[];
                      }[]
                    ).map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 justify-between h-6"
                      >
                        <CvPattern pat={r.pat} hl={r.hl} />
                        <PatternWord segs={r.segs} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Syllable division rules — 3 of the 15, badge shows the total */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <GroupLabel strong>{E.syllDivTitle[locale]}</GroupLabel>
                <span className="rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {E.countRules[locale].replace("{n}", "15")}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.syllDivCaption[locale]}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="py-1.5 pr-2">{E.colPattern[locale]}</th>
                      <th className="py-1.5 px-2">
                        {E.colPatternSplit[locale]}
                      </th>
                      <th className="py-1.5 pl-2">{E.example[locale]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        {
                          pat: "VCCV",
                          split: ["V", "C", "|", "C", "V"],
                          ex: "nap-kin",
                        },
                        {
                          pat: "VCV",
                          split: ["V", "|", "C", "V"],
                          ex: "ti-ger",
                        },
                        { pat: "VV", split: ["V", "|", "V"], ex: "li-on" },
                      ] as {
                        pat: string;
                        split: string[];
                        ex: string;
                      }[]
                    ).map((r) => (
                      <tr
                        key={r.ex}
                        className="border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <td className="py-1.5 pr-2">
                          <CvPattern pat={r.pat} />
                        </td>
                        <td className="py-1.5 px-2">
                          <SplitPattern tokens={r.split} />
                        </td>
                        <td className="py-1.5 pl-2 font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {r.ex}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: 7 syllable types, grouped by category */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllTypesTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.syllTypesCaption[locale]}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colCategory[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colSyllType[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colPattern[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colReading[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        {
                          cat: E.catLetterEnding[locale],
                          rows: [
                            {
                              name: E.typeClosed[locale],
                              read: [
                                { t: "v", v: true, mark: "short" },
                                { t: "c" },
                              ],
                              pats: ["VC", "CVC", "CCVC"],
                              ex: "cat, rab-bit",
                            },
                            {
                              name: E.typeOpen[locale],
                              read: [{ t: "v", v: true, mark: "long" }],
                              pats: ["V", "CV", "CCV"],
                              ex: "go, ba-by",
                            },
                          ],
                        },
                        {
                          cat: E.catGraphemePattern[locale],
                          rows: [
                            {
                              name: E.typeSilentE[locale],
                              read: [
                                { t: "v", v: true, mark: "long" },
                                { t: "c" },
                                { t: "e", silent: true },
                              ],
                              pats: ["VCe", "CVCe"],
                              ex: "make, home",
                            },
                            {
                              name: E.typeVowelTeam[locale],
                              read: [
                                { t: "v", v: true, mark: "long" },
                                { t: "v", silent: true },
                              ],
                              pats: ["VV", "CVV", "CVVC"],
                              ex: "rain, boat",
                            },
                            {
                              name: E.typeRControlled[locale],
                              read: [{ t: "v", v: true }, { t: "r" }],
                              pats: ["Vr", "CVr", "CVrC"],
                              ex: "car, bird",
                            },
                            {
                              name: E.typeConsonantLe[locale],
                              read: [{ t: "ə", sup: true }, { t: "cle" }],
                              pats: ["Cle", "CCle", "VCle"],
                              ex: "ta-ble, lit-tle",
                            },
                          ],
                        },
                        {
                          cat: E.catStableEnding[locale],
                          rows: [
                            {
                              name: E.typeStableFinal[locale],
                              read: [],
                              pats: ["-tion", "-sion", "-ture", "-sure"],
                              ex: "na-tion, pic-ture",
                            },
                          ],
                        },
                      ] as {
                        cat: string;
                        rows: {
                          name: string;
                          read: {
                            t: string;
                            v?: boolean;
                            silent?: boolean;
                            sup?: boolean;
                            mark?: "long" | "short";
                          }[];
                          pats: string[];
                          ex: string;
                        }[];
                      }[]
                    ).flatMap((g) =>
                      g.rows.map((t, i) => (
                        <tr key={t.name}>
                          {i === 0 && (
                            <td
                              rowSpan={g.rows.length}
                              className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 align-middle text-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400"
                            >
                              {g.cat.split(" ").map((w) => (
                                <span key={w} className="block">
                                  {w}
                                </span>
                              ))}
                            </td>
                          )}
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {t.name}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                            <span className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                              {t.pats.map((p) => (
                                <CvPattern key={p} pat={p} />
                              ))}
                            </span>
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                            {t.read.length > 0 ? (
                              <ReadMark tokens={t.read} />
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-600">—</span>
                            )}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                            {t.ex}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* stress in letters: capitals + size mark the stressed parts */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllStressTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.stressCapsCaption[locale]}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colStressType[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colSymbol[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colWhere[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.primaryStress[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="font-mono">
                          <StressSeg t="abc" k="primary" variant={stressStyle} />
                        </span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWherePrimary[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressWord
                          variant={stressStyle}
                          segs={[
                            { t: "com" },
                            { t: "pu", k: "primary" },
                            { t: "ter" },
                          ]}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.secondaryStress[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="font-mono">
                          <StressSeg
                            t="abc"
                            k="secondary"
                            variant={stressStyle}
                          />
                        </span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWhereSecondary[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressWord
                          variant={stressStyle}
                          segs={[
                            { t: "or", k: "secondary" },
                            { t: "gani" },
                            { t: "za", k: "primary" },
                            { t: "tion" },
                          ]}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.unstressedName[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="font-mono text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
                          abc
                        </span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWhereUnstressed[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressWord
                          variant={stressStyle}
                          segs={[{ t: "a" }, { t: "bout", k: "primary" }]}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2) By sounds — phonological */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {E.syllBySounds[locale]}
              </span>
              <SyllableSplit
                word="computer"
                parts={["/kəm/", "/ˈpjuː/", "/tɚ/"]}
                sep="·"
              />
            </div>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
              {E.syllBySoundsDesc[locale]}
            </p>

            {/* syllable patterns — two mirrored cards, like the
                orthographic "Two ways to read a pattern" pair */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllShapesTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.cvLegend[locale]}
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* simple — no consonant cluster */}
                <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      {E.syllSimpleTitle[locale]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 px-2 h-5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {E.countPatterns[locale].replace("{n}", "4")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 min-h-4 text-neutral-400 dark:text-neutral-500">
                    {E.syllSimpleHint[locale]}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {[
                      { ipa: "ə", pat: "V" },
                      { ipa: "miː", pat: "CV" },
                      { ipa: "kæt", pat: "CVC" },
                    ].map((r) => (
                      <div
                        key={r.pat}
                        className="flex items-center gap-1.5 justify-between h-6"
                      >
                        <span className="font-mono text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                          /{r.ipa}/
                        </span>
                        <CvPattern pat={r.pat} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* with clusters — mirrored: pattern first */}
                <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      {E.syllClusterTitle[locale]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 px-2 h-5 font-mono text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {E.countPatterns[locale].replace("{n}", "16")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 min-h-4 text-neutral-400 dark:text-neutral-500">
                    {E.syllClusterHint[locale]}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {[
                      { pat: "CCVC", ipa: "stɒp" },
                      { pat: "CVCC", ipa: "mɪlk" },
                      { pat: "CCVCC", ipa: "stæmp" },
                    ].map((r) => (
                      <div
                        key={r.pat}
                        className="flex items-center gap-1.5 justify-between h-6"
                      >
                        <CvPattern pat={r.pat} />
                        <span className="font-mono text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                          /{r.ipa}/
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* inside a syllable: onset + rhyme (nucleus + coda) */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllStructTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.syllStructCaption[locale]}
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-center">
                  <span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 font-semibold">
                    {E.syllable[locale]}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                  {/* onset group — unlabeled wrapper mirrors the Rhyme box
                      so the three white cards sit on one line */}
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-2 flex flex-col items-center gap-1">
                    <span
                      aria-hidden
                      className="invisible text-[10px] uppercase tracking-wide font-semibold"
                    >
                      {E.rhyme[locale]}
                    </span>
                    <SyllablePartCard
                      label={E.onset[locale]}
                      forms={["–", "C", "CC", "CCC"]}
                    />
                  </div>
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-2 flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 font-semibold">
                      {E.rhyme[locale]}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 w-full flex-1">
                      <SyllablePartCard
                        label={E.nucleus[locale]}
                        forms={["V", "VV", "VVV", "C̩"]}
                      />
                      <SyllablePartCard
                        label={E.coda[locale]}
                        forms={["–", "C", "CC", "CCC", "CCCC"]}
                      />
                    </div>
                  </div>
                </div>

                {/* the same tree read for one word: /kæt/ → /k/ + /æt/ */}
                <div className="mt-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-center">
                  <span className="font-mono text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                    /kæt/
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-1.5">
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-2 flex flex-col items-center gap-1">
                    <span
                      aria-hidden
                      className="invisible font-mono text-[10px] font-semibold"
                    >
                      /æt/
                    </span>
                    <div className="w-full flex-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 flex items-center justify-center">
                      <span className="font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                        /k/
                      </span>
                    </div>
                  </div>
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-2 flex flex-col items-center gap-1">
                    <span className="font-mono text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                      /æt/
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 w-full flex-1">
                      <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 flex items-center justify-center">
                        <span className="font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                          /æ/
                        </span>
                      </div>
                      <div className="rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1 flex items-center justify-center">
                        <span className="font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                          /t/
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* open / closed — how the syllable ends (its coda) */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.colSyllType[locale]}</GroupLabel>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colSyllType[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colDescription[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colPattern[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: E.typeOpen[locale],
                        desc: E.syllOpenRow[locale],
                        coda: E.syllOpenCoda[locale],
                        pats: ["V", "CV", "CCV", "CCCV"],
                        ex: "/miː/",
                      },
                      {
                        name: E.typeClosed[locale],
                        desc: E.syllClosedRow[locale],
                        coda: E.syllClosedCoda[locale],
                        pats: [
                          "VC",
                          "VCC",
                          "VCCC",
                          "CVC",
                          "CVCC",
                          "CVCCC",
                          "CCVC",
                          "CCVCC",
                          "CCCVCC",
                          "CCCVCCC",
                        ],
                        ex: "/kæt/",
                      },
                    ].map((r) => (
                      <tr key={r.ex}>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {r.name}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                          {r.desc}
                          <span className="block font-semibold text-neutral-900 dark:text-neutral-100">
                            {r.coda}
                          </span>
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                          <span className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                            {r.pats.map((p) => (
                              <CvPattern key={p} pat={p} />
                            ))}
                          </span>
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {r.ex}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* stress in sounds: the IPA marks ˈ (primary) and ˌ (secondary) */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllStressTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.stressMarksCaption[locale]}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colStressType[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colSymbol[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colWhere[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.primaryStress[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="font-mono text-lg font-extrabold text-red-800">
                          ˈ
                        </span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWherePrimary[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressIpaExample
                          word="computer"
                          uk="/kəmˈpjuː.tər/"
                          us="/kəmˈpjuː.t̬ɚ/"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.secondaryStress[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="font-mono text-lg font-extrabold text-blue-600">
                          ˌ
                        </span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWhereSecondary[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressIpaExample
                          word="organization"
                          uk="/ˌɔː.ɡən.aɪˈzeɪ.ʃən/"
                          us="/ˌɔːr.ɡən.əˈzeɪ.ʃən/"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                        {E.unstressedName[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <span className="text-neutral-300 dark:text-neutral-600">—</span>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[12px] text-neutral-600 dark:text-neutral-400">
                        {E.stressWhereUnstressed[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                        <StressIpaExample
                          word="about"
                          uk="/əˈbaʊt/"
                          us="/əˈbaʊt/"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* how long words get: word counts per syllable count (Wiktionary) */}
            <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
              <GroupLabel strong>{E.syllCountTitle[locale]}</GroupLabel>
              <p className="mt-0.5 text-[12px] text-neutral-400 dark:text-neutral-500">
                {E.syllCountCaption[locale]}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colNSyll[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.colWordCount[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { n: 1, count: 12036, word: "cat", ipa: "/kæt/" },
                        { n: 2, count: 37847, word: "happy", ipa: "/ˈhæp.i/" },
                        {
                          n: 3,
                          count: 28216,
                          word: "computer",
                          ipa: "/kəmˈpjuː.tər/",
                        },
                      ] as const
                    ).map((r) => (
                      <tr key={r.n}>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                          {r.n}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {r.count.toLocaleString(locale)}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center">
                          <span className="flex flex-col items-center">
                            <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">
                              {r.word}
                            </span>
                            <StressIpa ipa={r.ipa} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {E.syllCountOthers[locale]}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(
                  [
                    [4, 15438],
                    [5, 5761],
                    [6, 2293],
                    [7, 548],
                    [8, 154],
                    [9, 60],
                    [10, 28],
                    [11, 28],
                    [12, 20],
                    [13, 8],
                    [14, 3],
                    [15, 10],
                    [16, 1],
                    [17, 1],
                    [19, 1],
                    [26, 1],
                    [32, 1],
                    [33, 1],
                  ] as const
                ).map(([n, count]) => (
                  <span
                    key={n}
                    className="inline-flex items-baseline gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 whitespace-nowrap"
                  >
                    <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                      {n}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      — {count.toLocaleString(locale)}{" "}
                      {E.syllCountBadgeWords[locale]}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: E.morpheme[locale],
      desc: E.morphemeDesc[locale],
      example: (
        /* The classification tree, drawn left → right: morphemes → free /
           bound → their kinds. One shape + one example per leaf, one color
           per kind — compact enough to read in a single look. */
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 overflow-x-auto">
          <TreeBranch node={<TreeTag title={E.morpheme[locale]} accent />}>
            {/* ROOTS: the meaning part — free (words) or bound (bases) */}
            <TreeBranch
              node={
                <TreeTag
                  title={E.rootsTitle[locale]}
                  hint={E.rootsHint[locale]}
                  tint="free"
                />
              }
            >
              <TreeBranch
                node={
                  <TreeTag
                    title={E.freeRootsTitle[locale]}
                    hint={E.freeHint[locale]}
                    tint="free"
                  />
                }
              >
                <PosLeaf
                  label={E.openClass[locale]}
                  count="69k"
                  items={[
                    { t: E.posNoun[locale], n: "40k" },
                    { t: E.posAdjective[locale], n: "15k" },
                    { t: E.posVerb[locale], n: "12k" },
                    { t: E.posAdverb[locale], n: "2k" },
                  ]}
                />
                <PosLeaf
                  label={E.closedClass[locale]}
                  count="400–500"
                  items={[
                    { t: E.posPreposition[locale], n: "~150" },
                    { t: E.posPronoun[locale], n: "~100" },
                    { t: E.posQuantifier[locale], n: "~100" },
                    { t: E.posConjunction[locale], n: "~50" },
                    { t: E.posAuxiliary[locale], n: "~25" },
                    { t: E.posArticle[locale], n: "3" },
                  ]}
                />
              </TreeBranch>
              <TreeBranch
                node={
                  <TreeTag
                    title={E.boundRootsTitle[locale]}
                    hint={E.boundHint[locale]}
                    cls="border-emerald-500/20 bg-emerald-500/5"
                  />
                }
              >
                <MorphLeaf
                  name={E.boundBasesTitle[locale]}
                  count="120"
                  c="base"
                  cols={[
                    { p: "base", t: "cran-", b: true },
                    { p: "root", t: "berry" },
                  ]}
                />
              </TreeBranch>
            </TreeBranch>
            {/* AFFIXES: derivational / inflectional, by position inside */}
            <TreeBranch
              node={
                <TreeTag
                  title={E.affixesTitle[locale]}
                  hint={E.affixesHint[locale]}
                  tint="bound"
                />
              }
            >
              <TreeBranch
                node={
                  <TreeTag
                    title={E.derivationalName[locale]}
                    hint={E.derivationalShort[locale]}
                  />
                }
              >
                <MorphLeaf
                  name={E.prefixName[locale]}
                  count="2k"
                  c="prefix"
                  cols={[
                    { p: "prefix", t: "un-", b: true },
                    { p: "root", t: "kind" },
                  ]}
                />
                <MorphLeaf
                  name={E.suffixName[locale]}
                  count="1k"
                  c="suffix"
                  cols={[
                    { p: "root", t: "kind" },
                    { p: "suffix", t: "-ness", b: true },
                  ]}
                />
              </TreeBranch>
              <TreeBranch
                node={
                  <TreeTag
                    title={E.inflectionalName[locale]}
                    hint={E.inflectionalShort[locale]}
                  />
                }
              >
                <MorphLeaf
                  name={E.suffixName[locale]}
                  count="8"
                  c="inflect"
                  cols={[
                    { p: "root", t: "cat" },
                    { p: "suffix", t: "-s", b: true },
                  ]}
                />
              </TreeBranch>
              {/* Extension line = one tag level (w-32 tag + w-4 stub +
                  pl-4), so Interfix starts on the Prefix/Suffix column. */}
              <div className="flex items-center">
                <span aria-hidden className="h-px w-40 shrink-0 bg-neutral-300 dark:bg-neutral-600" />
                <MorphLeaf
                  name={E.interfixName[locale]}
                  rare={E.tagRare[locale]}
                  count="3"
                  c="interfix"
                  cols={[
                    { p: "root", t: "speed" },
                    { p: "interfix", t: "-o-", b: true },
                    { p: "root", t: "meter" },
                  ]}
                />
              </div>
            </TreeBranch>
            {/* Contracted forms: bound pieces that are neither root nor
                affix. Extension line = two tag levels (2 × (w-32 tag +
                w-4 stub + pl-4)), so the card starts on the leaf column
                shared by Prefix / Suffix / Interfix. */}
            <div className="flex items-center">
              <span aria-hidden className="h-px w-80 shrink-0 bg-neutral-300 dark:bg-neutral-600" />
              <MorphLeaf
                name={E.contractedTitle[locale]}
                count="7"
                c="contracted"
                cols={[
                  { p: "root", t: "I" },
                  { p: ["apos", "contr"], t: "'ll", b: true },
                ]}
              />
            </div>
          </TreeBranch>
        </div>
      ),
    },
    {
      name: E.wordUnit[locale],
      plain: true,
      example: (
        /* The 10 parts of speech — every word fits one of these */
        <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                    <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      #
                    </th>
                    <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {E.posColName[locale]}
                    </th>
                    <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {E.posColDef[locale]}
                    </th>
                    <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {E.posColClass[locale]}
                    </th>
                    <th className="w-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {E.example[locale]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {POS_TABLE.map((r, i) => (
                    <tr key={r.name.en}>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                        {i + 1}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                        <span className="block text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                          {r.name.en}
                        </span>
                        {locale !== "en" && (
                          <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                            {r.name[locale]}
                          </span>
                        )}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                        {r.def[locale]}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                        <div className="flex flex-col gap-1">
                          {r.groups.map((g) => (
                            <div
                              key={g.label.en}
                              className={
                                g.tree || g.matrix
                                  ? "flex items-start gap-1"
                                  : "flex flex-wrap items-center gap-1"
                              }
                            >
                              <span className="w-20 shrink-0 text-[9px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                                {g.label[locale]}
                              </span>
                              {g.matrix ? (
                                <table className="w-full table-fixed border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="w-14 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5 text-center font-mono text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                                        12
                                      </th>
                                      {g.matrix.cols.map((c) => (
                                        <th
                                          key={c.en}
                                          className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-0.5 py-0.5 text-center text-[8px] uppercase font-semibold leading-tight text-neutral-400 dark:text-neutral-500"
                                        >
                                          {c[locale]}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {g.matrix.rows.map((row) => (
                                      <tr key={row.t.en}>
                                        <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5 text-left text-[9px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                                          {row.t[locale]}
                                        </th>
                                        {row.cells.map((c, ci) => (
                                          <td
                                            key={ci}
                                            className="border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center font-mono text-[10px] font-medium leading-tight text-neutral-700 dark:text-neutral-300"
                                          >
                                            {c}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : g.tree ? (
                                <PosTree nodes={g.tree} locale={locale} />
                              ) : (
                                g.subs?.map((s) => (
                                  <span
                                    key={s.en}
                                    className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                                  >
                                    {s[locale]}
                                  </span>
                                ))
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">
                        {r.ex.map((w) => (
                          <span key={w} className="block whitespace-nowrap">
                            {w}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      ),
    },
    {
      name: E.syntax[locale],
      desc: E.syntaxDesc[locale],
      example: (
        <div className="flex flex-col gap-3">
          {(
            [
              {
                name: {
                  en: "Subject & Predicate",
                  uz: "Ega va kesim",
                  ru: "Подлежащее и сказуемое",
                }[locale],
                desc: {
                  en: "Every sentence splits into two parts.",
                  uz: "Har bir gap ikki qismga bo'linadi.",
                  ru: "Каждое предложение делится на две части.",
                }[locale],
                sp: true,
              },
              {
                name: E.phrase[locale],
                desc: E.phraseDesc[locale],
                table: PHRASE_TABLE,
              },
              {
                name: E.clause[locale],
                ctable: CLAUSE_TABLE,
              },
              {
                name: E.sentence[locale],
                desc: E.sentenceDesc[locale],
                sent: true,
              },
            ] as {
              name: string;
              desc?: string;
              sp?: boolean;
              sent?: boolean;
              table?: typeof PHRASE_TABLE;
              ctable?: typeof CLAUSE_TABLE;
            }[]
          ).map((sub) => (
            <div
              key={sub.name}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {sub.name}
                </span>
                {sub.desc && (
                  <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                    {sub.desc}
                  </span>
                )}
              </div>
              {sub.table && (
                <div className="mt-1.5 overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                        <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          #
                        </th>
                        <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {E.phrase[locale]}
                        </th>
                        <th className="w-1/2 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Structure",
                              uz: "Tuzilishi",
                              ru: "Структура",
                            }[locale]
                          }
                        </th>
                        <th className="w-40 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {POS_G.func[locale]}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.table.map((r, i) => (
                        <tr key={r.name.en}>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                            {i + 1}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                            <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                              {r.name.en}
                            </span>
                            {locale !== "en" && (
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                {r.name[locale]}
                              </span>
                            )}
                            {r.sub && (
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                {r.sub}
                              </span>
                            )}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-1.5 align-middle">
                            <table className="w-full table-fixed border-collapse">
                              <thead>
                                <tr>
                                  {r.struct.map((s) => (
                                    <th
                                      key={s.t.en}
                                      className={[
                                        "border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center text-[9px] font-semibold leading-tight",
                                        s.req
                                          ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                                          : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500",
                                      ].join(" ")}
                                    >
                                      {s.t[locale]}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  {r.struct.map((s) => (
                                    <td
                                      key={s.t.en}
                                      className={[
                                        "border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center font-mono text-[10px] font-medium leading-tight",
                                        s.ex
                                          ? "text-neutral-700 dark:text-neutral-300"
                                          : "text-neutral-300 dark:text-neutral-600",
                                      ].join(" ")}
                                    >
                                      {s.ex ?? "—"}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {r.func.map((f) => (
                                <span
                                  key={f.en}
                                  className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
                                >
                                  {f[locale]}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* obligatory / optional legend for the structure cells */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
                      {
                        {
                          en: "obligatory element",
                          uz: "majburiy bo'lak",
                          ru: "обязательный элемент",
                        }[locale]
                      }
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900" />
                      {
                        {
                          en: "optional element",
                          uz: "ixtiyoriy bo'lak",
                          ru: "необязательный элемент",
                        }[locale]
                      }
                    </span>
                  </div>
                </div>
              )}
              {sub.ctable && (
                <div className="mt-1.5 flex flex-col gap-3">
                  {/* anatomy strip: every clause = Subject + Predicate */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {
                        {
                          en: "Every clause =",
                          uz: "Har bir klauza =",
                          ru: "Каждая клауза =",
                        }[locale]
                      }
                    </span>
                    <table className="border-collapse">
                      <tbody>
                        <tr>
                          {CLAUSE_ANATOMY.map((s) => (
                            <th
                              key={s.en}
                              className="border border-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 text-center text-[9px] font-semibold leading-tight text-neutral-800 dark:text-neutral-200"
                            >
                              {s[locale]}
                            </th>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-120 border-collapse text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                          <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            #
                          </th>
                          <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {E.clause[locale]}
                          </th>
                          <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {E.posColDef[locale]}
                          </th>
                          <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {POS_G.begins[locale]}
                          </th>
                          <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {POS_G.func[locale]}
                          </th>
                          <th className="w-40 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {E.example[locale]}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.ctable.map((r, i, rows) => (
                          <React.Fragment key={r.name.en}>
                            {(i === 0 || !!rows[i - 1].dep !== !!r.dep) && (
                              /* divider row: independent rows above,
                                 dependent rows below */
                              <tr>
                                <td
                                  colSpan={6}
                                  className="border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-2 py-1"
                                >
                                  <span className="flex items-center text-[9px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    {r.dep
                                      ? {
                                          en: "Dependent — needs a main clause",
                                          uz: "Tobe — bosh klauzaga muhtoj",
                                          ru: "Зависимая — нужна главная клауза",
                                        }[locale]
                                      : {
                                          en: "Independent — can stand alone",
                                          uz: "Mustaqil — alohida tura oladi",
                                          ru: "Независимая — может стоять отдельно",
                                        }[locale]}
                                  </span>
                                </td>
                              </tr>
                            )}
                            <tr>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                              {/* numbering restarts inside each group */}
                              {rows
                                .slice(0, i + 1)
                                .filter((x) => !!x.dep === !!r.dep).length}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                              <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                                {r.name.en}
                              </span>
                              {locale !== "en" && (
                                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                  {r.name[locale]}
                                </span>
                              )}
                              {r.sub && (
                                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                  {r.sub}
                                </span>
                              )}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                              {r.def[locale]}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                              {r.begins ? (
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {r.begins.map((s) => (
                                    <span
                                      key={s.en}
                                      className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                                    >
                                      {s[locale]}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="block text-center text-[11px] text-neutral-300 dark:text-neutral-600">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {r.func.map((s) => (
                                  <span
                                    key={s.en}
                                    className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                                  >
                                    {s[locale]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                              <span className="text-neutral-400 dark:text-neutral-500">
                                {r.ex[0]}
                              </span>
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                                {r.ex[1]}
                              </span>
                              <span className="text-neutral-400 dark:text-neutral-500">
                                {r.ex[2]}
                              </span>
                            </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {sub.sp && (
                <div className="mt-1.5 flex flex-col gap-3">
                  {/* patterns card: one sentence split into its two halves,
                      the predicate opened up into its parts, and the
                      pattern formulas those parts combine into */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                        {
                          {
                            en: "Patterns",
                            uz: "Qoliplar",
                            ru: "Модели",
                          }[locale]
                        }
                      </span>
                      <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        {
                          {
                            en: "How the parts line up in a sentence.",
                            uz: "Bo'laklar gapda qanday tiziladi.",
                            ru: "Как части выстраиваются в предложении.",
                          }[locale]
                        }
                      </span>
                    </div>
                    {/* one table: the Subject/Predicate split on top,
                        each pattern's example spread under the parts */}
                    <div className="mt-1 overflow-x-auto">
                      <table className="w-full min-w-120 border-collapse text-left">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                            <th
                              rowSpan={2}
                              className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center align-middle"
                            >
                              #
                            </th>
                            <th
                              rowSpan={2}
                              className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center align-middle"
                            >
                              {
                                {
                                  en: "Formula",
                                  uz: "Formula",
                                  ru: "Формула",
                                }[locale]
                              }
                            </th>
                            <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {SP_CARDS[0].title[locale]}
                            </th>
                            <th
                              colSpan={4}
                              className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center"
                            >
                              {SP_CARDS[1].title[locale]}
                            </th>
                          </tr>
                          <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                            <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-1.5" />
                            {[SENT_EL.v, SENT_EL.o, SENT_EL.c, SENT_EL.a].map(
                              (t) => (
                                <th
                                  key={t.en}
                                  className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-1.5 text-center"
                                >
                                  {t[locale]}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {SENT_PATTERNS.map((r, i) => {
                            const pick = (
                              f: (t: string) => boolean,
                            ): string | null => {
                              const xs = r.cols
                                .filter((c) => f(c.t.en.toLowerCase()))
                                .map((c) => c.ex);
                              return xs.length ? xs.join(" · ") : null;
                            };
                            const cells = [
                              pick((t) => t === "subject"),
                              pick((t) => t === "verb"),
                              pick(
                                (t) =>
                                  t.includes("object") &&
                                  !t.includes("complement"),
                              ),
                              pick((t) => t.includes("complement")),
                              pick((t) => t === "adverbial"),
                            ];
                            return (
                              <tr key={r.code}>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                                  {i + 1}
                                </td>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                  {r.code}
                                </td>
                                {cells.map((x, j) => (
                                  <td
                                    key={j}
                                    className={[
                                      "border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[11px] leading-tight",
                                      x
                                        ? "font-medium text-neutral-700 dark:text-neutral-300"
                                        : "text-neutral-300 dark:text-neutral-600",
                                    ].join(" ")}
                                  >
                                    {x ?? "—"}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                      {(
                        [
                          ["S", SENT_EL.s],
                          ["V", SENT_EL.v],
                          ["O", SENT_EL.o],
                          ["C", SENT_EL.c],
                          ["A", SENT_EL.a],
                        ] as [string, L3][]
                      ).map(([l, t]) => (
                        <span key={l}>
                          <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                            {l}
                          </span>{" "}
                          = {t[locale]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {SP_CARDS.map((c) => (
                    <div
                      key={c.title.en}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                          {c.title[locale]}
                        </span>
                        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                          {c.desc[locale]}
                        </span>
                      </div>
                      <div className="mt-1 overflow-x-auto">
                        <table className="w-full min-w-120 border-collapse text-left">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                              <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                                #
                              </th>
                              <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                                {POS_G.types[locale]}
                              </th>
                              <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                                {E.posColDef[locale]}
                              </th>
                              <th className="w-56 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                                {E.example[locale]}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.kinds.map((k, i) => (
                              <tr key={k.name.en}>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                                  {i + 1}
                                </td>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                                  <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                                    {k.name.en}
                                  </span>
                                  {locale !== "en" && (
                                    <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                      {k.name[locale]}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                                  {k.def[locale]}
                                </td>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                                  <span className="text-neutral-400 dark:text-neutral-500">
                                    {k.ex[0]}
                                  </span>
                                  <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                                    {k.ex[1]}
                                  </span>
                                  <span className="text-neutral-400 dark:text-neutral-500">
                                    {k.ex[2]}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {c.forms && (
                        <div className="mt-2 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                            {
                              {
                                en: "What can be a subject",
                                uz: "Ega nima bo'la oladi",
                                ru: "Чем может быть подлежащее",
                              }[locale]
                            }
                          </span>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-120 border-collapse text-left">
                              <tbody>
                                {c.forms.map((f) => (
                                  <tr key={f.t.en}>
                                    <td className="w-36 border border-neutral-200 dark:border-neutral-800 p-1.5 text-center align-middle text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                                      {f.t[locale]}
                                    </td>
                                    <td className="border border-neutral-200 dark:border-neutral-800 p-1.5 align-middle text-center font-mono text-[11px] leading-snug">
                                      <span className="text-neutral-400 dark:text-neutral-500">
                                        {f.ex[0]}
                                      </span>
                                      <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                                        {f.ex[1]}
                                      </span>
                                      <span className="text-neutral-400 dark:text-neutral-500">
                                        {f.ex[2]}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {sub.sent && (
                <div className="mt-1.5 flex flex-col gap-3">
                  {/* 1 — Structure: how clauses combine */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                        {
                          {
                            en: "Structure",
                            uz: "Tuzilishi",
                            ru: "Структура",
                          }[locale]
                        }
                      </span>
                      <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        {
                          {
                            en: "How many clauses and how they join.",
                            uz: "Nechta klauza va ular qanday birikadi.",
                            ru: "Сколько клауз и как они соединяются.",
                          }[locale]
                        }
                      </span>
                    </div>
                    <div className="mt-1 overflow-x-auto">
                      <table className="w-full min-w-120 border-collapse text-left">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                            <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              #
                            </th>
                            <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {
                                {
                                  en: "Structure",
                                  uz: "Tuzilishi",
                                  ru: "Структура",
                                }[locale]
                              }
                            </th>
                            <th className="w-24 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {
                                {
                                  en: "Main clause",
                                  uz: "Bosh klauza",
                                  ru: "Главная клауза",
                                }[locale]
                              }
                            </th>
                            <th className="w-24 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {
                                {
                                  en: "Dependent clause",
                                  uz: "Tobe klauza",
                                  ru: "Зависимая клауза",
                                }[locale]
                              }
                            </th>
                            <th className="w-56 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {E.example[locale]}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {SENT_STRUCT.map((r, i) => (
                            <tr key={r.name.en}>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                                {i + 1}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                                <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                                  {r.name.en}
                                </span>
                                {locale !== "en" && (
                                  <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                    {r.name[locale]}
                                  </span>
                                )}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                                {r.m}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                                {r.d ?? (
                                  <span className="font-sans text-[11px] font-normal text-neutral-300 dark:text-neutral-600">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                                {r.ex.map((s, j) => (
                                  <span
                                    key={j}
                                    className={
                                      s.k === "m"
                                        ? "font-bold text-neutral-900 dark:text-neutral-100"
                                        : s.k === "d"
                                          ? "text-neutral-700 dark:text-neutral-300 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2"
                                          : "text-neutral-400 dark:text-neutral-500"
                                    }
                                  >
                                    {s.t}
                                  </span>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* 2 — Types: what the sentence does */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                        {POS_G.types[locale]}
                      </span>
                      <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        {
                          {
                            en: "What the sentence does.",
                            uz: "Gap nima qiladi.",
                            ru: "Что делает предложение.",
                          }[locale]
                        }
                      </span>
                    </div>
                    <div className="mt-1 overflow-x-auto">
                      <table className="w-full min-w-120 border-collapse text-left">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                            <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              #
                            </th>
                            <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {POS_G.types[locale]}
                            </th>
                            <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {
                                {
                                  en: "Purpose",
                                  uz: "Maqsadi",
                                  ru: "Цель",
                                }[locale]
                              }
                            </th>
                            <th className="w-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {
                                {
                                  en: "Ends with",
                                  uz: "Tugashi",
                                  ru: "Знак в конце",
                                }[locale]
                              }
                            </th>
                            <th className="w-44 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                              {E.example[locale]}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {SENT_TYPES.map((r, i) => (
                            <tr key={r.name.en}>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                                {i + 1}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                                <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                                  {r.name.en}
                                </span>
                                {locale !== "en" && (
                                  <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                    {r.name[locale]}
                                  </span>
                                )}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                                {r.def[locale]}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[15px] font-bold text-neutral-800 dark:text-neutral-200">
                                {r.mark}
                              </td>
                              <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                                {r.ex}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  /* Each unit with the linguistics branch that studies it. Units sharing a
     branch (phrase / clause / sentence → syntax) share a label color, so the
     grouping is visible at a glance. */
  const chain: { name: string; branch: string; color: string }[] = [
    {
      name: E.letter[locale],
      branch: E.branchOrthography[locale],
      color: "text-sky-600",
    },
    {
      name: E.grapheme[locale],
      branch: E.branchGraphemics[locale],
      color: "text-teal-600",
    },
    {
      name: E.syllable[locale],
      branch: E.branchPhonology[locale],
      color: "text-emerald-600",
    },
    {
      name: E.morpheme[locale],
      branch: E.branchMorphology[locale],
      color: "text-violet-600",
    },
    {
      name: E.word[locale],
      branch: E.branchLexicology[locale],
      color: "text-amber-600",
    },
    {
      name: E.phrase[locale],
      branch: E.branchSyntax[locale],
      color: "text-rose-600",
    },
    {
      name: E.clause[locale],
      branch: E.branchSyntax[locale],
      color: "text-rose-600",
    },
    {
      name: E.sentence[locale],
      branch: E.branchSyntax[locale],
      color: "text-rose-600",
    },
  ];

  return (
    <div className="flex-1 bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-16 pb-24 px-6">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {E.title[locale]}
        </h1>

        {/* Overview chain: smallest → biggest */}
        <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-start flex-wrap gap-y-3">
            {chain.map(({ name, branch, color }, i) => (
              <React.Fragment key={name}>
                {i > 0 && (
                  <ArrowRight className="w-3.5 h-3.5 mx-1.5 mt-1 text-neutral-300 dark:text-neutral-600 shrink-0" />
                )}
                <span className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[13px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5">
                    {name.toLowerCase()}
                  </span>
                  <span
                    className={`text-[10px] font-medium lowercase leading-none ${color}`}
                  >
                    {branch}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">
            <span>{E.smallest[locale]}</span>
            <span>{E.biggest[locale]}</span>
          </div>
        </div>

        {/* The ladder of units */}
        <ol className="mt-10 relative">
          {/* vertical rail connecting the numbers */}
          <div
            aria-hidden
            className="absolute left-3.75 top-4 bottom-4 w-px bg-neutral-200 dark:bg-neutral-700"
          />
          {units.map((unit, i) => {
            const card = (
              <div
                className={[
                  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm p-5 transition-all",
                  unit.href
                    ? "hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md cursor-pointer"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {unit.name}
                  </h2>
                  {unit.href && (
                    <span className="flex items-center gap-2.5">
                      {lettersDone > 0 && (
                        <>
                          <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                            {lettersDone} / {LETTERS.length}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {letterStars}
                          </span>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    </span>
                  )}
                </div>
                {unit.desc && (
                  <p className="mt-1 text-[14px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {unit.desc}
                  </p>
                )}
                {unit.plain ? (
                  <div className="mt-4">{unit.example}</div>
                ) : (
                  <div className="mt-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-4">
                    {unit.example}
                  </div>
                )}
              </div>
            );
            return (
              <li
                key={unit.name}
                className="relative pl-12 pb-10 last:pb-0"
                // Skip layout/paint for units that aren't near the viewport yet
                // (these reference tables are huge). The browser renders each
                // as you scroll to it; `auto` remembers real heights so the
                // scrollbar doesn't jump. First unit is on-screen so it paints
                // immediately. Pure paint win — nothing is removed from the page.
                style={{
                  contentVisibility: i === 0 ? undefined : "auto",
                  containIntrinsicSize: i === 0 ? undefined : "auto 700px",
                }}
              >
                <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-mono text-sm font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
                {unit.href ? <Link href={unit.href}>{card}</Link> : card}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

