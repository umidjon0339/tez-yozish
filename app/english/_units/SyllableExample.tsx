import React from "react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { GRAPHEMES } from "@/lib/graphemes";
import {
  GroupLabel,
  SyllableSplit,
  CvPattern,
  PatternWord,
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
} from "../_components";

const E = STR.english;

// Unit 3: syllables split by letters and by sounds, plus the stress table.
export function SyllableExample() {
  const { locale } = useLocale();
  // Which way the stress table marks the stressed syllable — advances one
  // step per page load (tz-stress-style holds the last shown index).
  const stressStyle = React.useSyncExternalStore(
    noopSubscribe,
    loadStressStyle,
    serverStressStyle,
  );

  return (
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
  );
}
