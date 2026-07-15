"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Plus, Equal, Star } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { LETTERS } from "@/lib/letters";
import { useLetterProgress } from "@/lib/letterProgress";

const E = STR.english;

/* A small mono "tile" for a piece of language (letter, syllable, word…). */
function Piece({
  children,
  accent = false,
  size = "md",
}: {
  children: React.ReactNode;
  accent?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-md border font-mono font-semibold",
        size === "lg" ? "px-3 py-1.5 text-lg" : "px-2.5 py-1 text-base",
        accent
          ? "bg-neutral-950 text-white border-neutral-950"
          : "bg-white text-neutral-900 border-neutral-300 shadow-sm",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function PlusSign() {
  return <Plus className="w-4 h-4 text-neutral-400 shrink-0" />;
}

function EqualSign() {
  return <Equal className="w-4 h-4 text-neutral-400 shrink-0" />;
}

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

  /* The six levels, smallest → biggest. Each renders its own example. */
  const units: {
    name: string;
    desc: string;
    example: React.ReactNode;
    href?: string;
  }[] = [
    {
      name: E.letter[locale],
      desc: E.letterDesc[locale],
      href: "/english/letters",
      example: (
        <div className="flex items-center gap-2 flex-wrap">
          <Piece>c</Piece>
          <Piece>a</Piece>
          <Piece>t</Piece>
        </div>
      ),
    },
    {
      name: E.grapheme[locale],
      desc: E.graphemeDesc[locale],
      example: (
        <div className="flex items-center gap-2 flex-wrap">
          <Piece accent>sh</Piece>
          <Piece>i</Piece>
          <Piece>p</Piece>
          <EqualSign />
          <Piece size="lg">ship</Piece>
        </div>
      ),
    },
    {
      name: E.syllable[locale],
      desc: E.syllableDesc[locale],
      example: (
        <div className="flex items-center gap-2 flex-wrap">
          <Piece accent>ta</Piece>
          <PlusSign />
          <Piece accent>ble</Piece>
          <EqualSign />
          <Piece size="lg">table</Piece>
        </div>
      ),
    },
    {
      name: E.morpheme[locale],
      desc: E.morphemeDesc[locale],
      example: (
        <div className="flex items-center gap-2 flex-wrap">
          <Piece accent>un</Piece>
          <PlusSign />
          <Piece accent>friend</Piece>
          <PlusSign />
          <Piece accent>ly</Piece>
          <EqualSign />
          <Piece size="lg">unfriendly</Piece>
        </div>
      ),
    },
    {
      name: E.word[locale],
      desc: E.wordDesc[locale],
      example: (
        <div className="flex items-center gap-2 flex-wrap">
          <Piece size="lg">cat</Piece>
          <Piece size="lg">ship</Piece>
          <Piece size="lg">table</Piece>
          <Piece size="lg">unfriendly</Piece>
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
                name: E.phrase[locale],
                desc: E.phraseDesc[locale],
                text: "the red ball",
              },
              {
                name: E.clause[locale],
                desc: E.clauseDesc[locale],
                text: "the dog runs",
              },
              {
                name: E.sentence[locale],
                desc: E.sentenceDesc[locale],
                text: "The dog runs, and the cat sleeps.",
              },
            ] as const
          ).map((sub) => (
            <div
              key={sub.name}
              className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-bold text-neutral-900">
                  {sub.name}
                </span>
                <span className="text-[13px] text-neutral-500">{sub.desc}</span>
              </div>
              <p className="font-mono text-lg font-semibold text-neutral-900">
                “{sub.text}”
              </p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const chain = [
    E.letter[locale],
    E.grapheme[locale],
    E.syllable[locale],
    E.morpheme[locale],
    E.word[locale],
    E.phrase[locale],
    E.clause[locale],
    E.sentence[locale],
  ];

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-screen pt-16 pb-24 px-6">
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          {E.title[locale]}
        </h1>

        {/* Overview chain: smallest → biggest */}
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center flex-wrap gap-y-2">
            {chain.map((name, i) => (
              <React.Fragment key={name}>
                {i > 0 && (
                  <ArrowRight className="w-3.5 h-3.5 mx-1.5 text-neutral-300 shrink-0" />
                )}
                <span className="font-mono text-[13px] font-medium text-neutral-700 bg-neutral-100 rounded px-1.5 py-0.5">
                  {name.toLowerCase()}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            <span>{E.smallest[locale]}</span>
            <span>{E.biggest[locale]}</span>
          </div>
        </div>

        {/* The ladder of units */}
        <ol className="mt-10 relative">
          {/* vertical rail connecting the numbers */}
          <div
            aria-hidden
            className="absolute left-3.75 top-4 bottom-4 w-px bg-neutral-200"
          />
          {units.map((unit, i) => {
            const card = (
              <div
                className={[
                  "bg-white border border-neutral-200 rounded-lg shadow-sm p-5 transition-all",
                  unit.href
                    ? "hover:border-neutral-950 hover:ring-1 hover:ring-neutral-950 hover:shadow-md cursor-pointer"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-neutral-900">
                    {unit.name}
                  </h2>
                  {unit.href && (
                    <span className="flex items-center gap-2.5">
                      {lettersDone > 0 && (
                        <>
                          <span className="font-mono text-[12px] font-semibold text-neutral-500">
                            {lettersDone} / {LETTERS.length}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {letterStars}
                          </span>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[14px] text-neutral-600 leading-relaxed">
                  {unit.desc}
                </p>
                <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-100 p-4">
                  {unit.example}
                </div>
              </div>
            );
            return (
              <li key={unit.name} className="relative pl-12 pb-10 last:pb-0">
                <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-neutral-950 text-white font-mono text-sm font-bold flex items-center justify-center shadow-sm">
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
