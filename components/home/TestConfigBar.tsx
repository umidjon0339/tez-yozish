"use client";

// The config bar above the home-page test, laid out like the reference:
// **separate pills** with a gap between them, not one bar with dividers.
//
//   [ @ punctuation  # numbers ]  [ ⏱ time  A words  ❝ quote  🎓 subject  🔧 custom ]  [ 15 30 60 120 ]
//                                       [ english   o'zbekcha ]
//
// Every item is icon-then-text, lowercase mono, active in the ink colour and
// inactive grey. The whole thing fades out while a test is running.
//
// Two departures from the reference. Its `zen` slot is our **subject** mode,
// which fills the value pill with five school subjects and types their text
// from `data/typing-texts.json`. And the text language sits on a second,
// centred line — the reference has no such switch, and putting it in the top
// row made that row wrap unevenly.

import React, { useEffect, useRef, useState } from "react";
import { ALargeSmall, AtSign, Clock, GraduationCap, Hash, Quote, Wrench } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import {
  featuredSubjects,
  LANG_LABEL,
  QUOTE_LENGTHS,
  TEST_LANGS,
  TIME_VALUES,
  WORD_VALUES,
  type QuoteLength,
  type TestConfig,
  type TestLang,
  type TestMode,
} from "@/lib/typing/typingTest";

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const MODES: { id: TestMode; Icon: IconType }[] = [
  { id: "time", Icon: Clock },
  { id: "words", Icon: ALargeSmall },
  { id: "quote", Icon: Quote },
  { id: "curriculum", Icon: GraduationCap },
  { id: "custom", Icon: Wrench },
];

function Item({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11.5px] leading-none transition-colors ${
        active
          ? "text-neutral-950 dark:text-white"
          : "text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

/** One rounded group. The reference separates its groups by gap, not by rules. */
function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white/70 px-1.5 py-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

export function TestConfigBar({
  cfg,
  onChange,
  hidden,
}: {
  cfg: TestConfig;
  onChange: (next: TestConfig) => void;
  /** true while a test is running — the bar dims out of the way */
  hidden: boolean;
}) {
  const { locale } = useLocale();
  const T = STR.test;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cfg.custom);
  const boxRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<TestConfig>) => onChange({ ...cfg, ...patch });

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setEditing(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [editing]);

  const subjects = featuredSubjects(locale);

  /* The third pill: whatever the chosen mode needs. */
  const value = (() => {
    switch (cfg.mode) {
      case "time":
        return TIME_VALUES.map((v) => (
          <Item key={v} active={cfg.time === v} onClick={() => set({ time: v })}>
            {v}
          </Item>
        ));
      case "words":
        return WORD_VALUES.map((v) => (
          <Item key={v} active={cfg.words === v} onClick={() => set({ words: v })}>
            {v}
          </Item>
        ));
      case "quote":
        return QUOTE_LENGTHS.map((q: QuoteLength) => (
          <Item key={q} active={cfg.quote === q} onClick={() => set({ quote: q })}>
            {T[q][locale]}
          </Item>
        ));
      case "custom":
        return (
          <Item
            active
            onClick={() => {
              setDraft(cfg.custom);
              setEditing(true);
            }}
          >
            {T.edit[locale]}
          </Item>
        );
      case "curriculum":
        // Five subjects, straight away — no grade step in front of them.
        return subjects.map((s) => (
          <Item key={s.key} active={cfg.subject === s.key} onClick={() => set({ subject: s.key })}>
            {s.label}
          </Item>
        ));
      default:
        return null;
    }
  })();

  return (
    <div
      className={`relative flex justify-center transition-opacity duration-200 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex max-w-4xl flex-col items-center gap-1.5">
        <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-2">
        {/* modifiers */}
        <Pill>
          <Item active={cfg.punctuation} onClick={() => set({ punctuation: !cfg.punctuation })}>
            <AtSign className="h-3 w-3" strokeWidth={2.5} />
            {T.punctuation[locale]}
          </Item>
          <Item active={cfg.numbers} onClick={() => set({ numbers: !cfg.numbers })}>
            <Hash className="h-3 w-3" strokeWidth={2.5} />
            {T.numbers[locale]}
          </Item>
        </Pill>

        {/* mode */}
        <Pill>
          {MODES.map(({ id, Icon }) => (
            <Item key={id} active={cfg.mode === id} onClick={() => set({ mode: id })}>
              <Icon className="h-3 w-3" strokeWidth={2.5} />
              {T[id][locale]}
            </Item>
          ))}
        </Pill>

        {/* the value for whichever mode is picked */}
        {value && <Pill className="max-w-xl">{value}</Pill>}
        </div>

        {/* Second line, centred: the text language. The on-screen keyboard is
            US QWERTY, so the banks are Latin only (see lib/typing/typingTest.ts). */}
        <Pill>
          {TEST_LANGS.map((l: TestLang) => (
            <Item
              key={l}
              active={cfg.lang === l}
              onClick={() => set({ lang: l })}
              title={T.language[locale]}
            >
              {LANG_LABEL[l]}
            </Item>
          ))}
        </Pill>
      </div>

      {editing && (
        <div
          ref={boxRef}
          className="absolute top-full z-30 mt-2 w-[min(30rem,90vw)] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-white/15 dark:bg-neutral-900"
        >
          <p className="mb-2 text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
            {T.customTitle[locale]}
          </p>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={T.customPlaceholder[locale]}
            rows={4}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-[#FAFAFA] p-2 font-mono text-[13px] outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-950 dark:focus:border-white/30"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              {T.cancel[locale]}
            </button>
            <button
              type="button"
              onClick={() => {
                set({ custom: draft, mode: "custom" });
                setEditing(false);
              }}
              className="cursor-pointer rounded-md bg-neutral-950 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              {T.save[locale]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
