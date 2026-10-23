"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { LETTERS } from "@/lib/english/letters";
import { useLetterProgress } from "@/lib/english/letterProgress";
import { AlphabetExample } from "./_units/AlphabetExample";
import { GraphemeExample } from "./_units/GraphemeExample";
import { SyllableExample } from "./_units/SyllableExample";
import { MorphemeExample } from "./_units/MorphemeExample";
import { WordExample } from "./_units/WordExample";
import { SyntaxExample } from "./_units/SyntaxExample";

const E = STR.english;

export default function EnglishPage() {
  const { locale } = useLocale();
  const letterProgress = useLetterProgress();
  const lettersDone = LETTERS.filter(
    (l) => letterProgress[l.char]?.completed,
  ).length;
  const letterStars = LETTERS.reduce(
    (sum, l) => sum + (letterProgress[l.char]?.stars ?? 0),
    0,
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
      example: <AlphabetExample />,
    },
    {
      name: E.grapheme[locale],
      desc: E.graphemeDesc[locale],
      example: <GraphemeExample />,
    },
    {
      name: E.syllable[locale],
      desc: E.syllableDesc[locale],
      example: <SyllableExample />,
    },
    {
      name: E.morpheme[locale],
      desc: E.morphemeDesc[locale],
      example: <MorphemeExample />,
    },
    {
      name: E.wordUnit[locale],
      plain: true,
      example: <WordExample />,
    },
    {
      name: E.syntax[locale],
      desc: E.syntaxDesc[locale],
      example: <SyntaxExample />,
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

