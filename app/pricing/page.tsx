"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  Code2,
  Gamepad2,
  GraduationCap,
  Hand,
  Languages,
  Library,
  type LucideIcon,
  Sparkles,
  Trophy,
} from "lucide-react";
import { FEATURE_SCENES } from "@/components/pricing/FeatureScenes";
import { course } from "@/lib/typing/curriculum";
import { useAuth, edifyAuthUrl } from "@/lib/core/auth";
import { GAME_COUNT, gameNameLines } from "@/lib/catalog/games";
import { codingTotals } from "@/lib/catalog/coding";
import { exams } from "@/lib/catalog/exams";
import { k12Grades } from "@/lib/catalog/k12";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

/* ── The plan ────────────────────────────────────────────────────────────
   One product (Pro) sold for three periods. The discount is baked into the
   period, so the only number that ever needs editing is MONTHLY_PRICE —
   every other figure on the page is derived from it. Prices are in so'm. */

const MONTHLY_PRICE = 50_000;

type TermId = "m1" | "m6" | "m12";

const TERMS: {
  id: TermId;
  months: number;
  off: number;
  label: keyof typeof STR.pricing;
  badge?: keyof typeof STR.pricing;
}[] = [
  { id: "m1", months: 1, off: 0, label: "month1" },
  { id: "m6", months: 6, off: 0.25, label: "months6" },
  { id: "m12", months: 12, off: 0.5, label: "months12", badge: "bestValue" },
];

function priceOf(months: number, off: number) {
  return Math.round(MONTHLY_PRICE * months * (1 - off));
}

/** 300000 → "300 000" with non-breaking spaces, and identical on the server
 *  and the client (toLocaleString is not, which would break hydration). */
function fmt(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Fills {n}/{s} placeholders in a localized string. */
function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    s,
  );
}

/* ── The showcase ───────────────────────────────────────────────────────
   Seven tabs, each an animated scene plus a title and three short lines. */

type Feature = {
  id: keyof typeof FEATURE_SCENES;
  icon: LucideIcon;
  label: keyof typeof STR.pricing;
  title: keyof typeof STR.pricing;
  bullets: (keyof typeof STR.pricing)[];
};

const FEATURES: Feature[] = [
  {
    id: "course",
    icon: BookOpen,
    label: "f1Label",
    title: "f1Title",
    bullets: ["f1b1", "f1b2", "f1b3"],
  },
  {
    id: "games",
    icon: Gamepad2,
    label: "f2Label",
    title: "f2Title",
    bullets: ["f2b1", "f2b2", "f2b3"],
  },
  {
    id: "english",
    icon: Languages,
    label: "f3Label",
    title: "f3Title",
    bullets: ["f3b1", "f3b2", "f3b3"],
  },
  {
    id: "hands",
    icon: Hand,
    label: "f4Label",
    title: "f4Title",
    bullets: ["f4b1", "f4b2", "f4b3"],
  },
  {
    id: "stats",
    icon: BarChart3,
    label: "f5Label",
    title: "f5Title",
    bullets: ["f5b1", "f5b2", "f5b3"],
  },
  {
    id: "compete",
    icon: Trophy,
    label: "f6Label",
    title: "f6Title",
    bullets: ["f6b1", "f6b2", "f6b3"],
  },
  {
    id: "coding",
    icon: Code2,
    label: "f8Label",
    title: "f8Title",
    bullets: ["f8b1", "f8b2", "f8b3"],
  },
  {
    id: "books",
    icon: Library,
    label: "f9Label",
    title: "f9Title",
    bullets: ["f9b1", "f9b2", "f9b3"],
  },
  {
    id: "exams",
    icon: GraduationCap,
    label: "f10Label",
    title: "f10Title",
    bullets: ["f10b1", "f10b2", "f10b3"],
  },
  {
    id: "comfort",
    icon: Sparkles,
    label: "f7Label",
    title: "f7Title",
    bullets: ["f7b1", "f7b2", "f7b3"],
  },
];

const AUTO_MS = 8000;

export default function PricingPage() {
  const { locale } = useLocale();
  const { user, ready } = useAuth();
  const P = STR.pricing;

  /* Real course size — never a number typed by hand into marketing copy. */
  const { lessonCount, sectionCount } = useMemo(() => {
    let lessons = 0;
    let sections = 0;
    for (const chapter of course.chapters) {
      for (const section of chapter.sections) {
        sections += 1;
        lessons += section.lessons.length;
      }
    }
    return { lessonCount: lessons, sectionCount: sections };
  }, []);

  /* Same rule for everything the product gained since: read the catalogues,
     never restate their size in copy. */
  const gameLines = useMemo(() => gameNameLines(), []);
  const examCount = exams.length;
  const gradeCount = k12Grades.length;
  const subjectCount = useMemo(
    () => k12Grades.reduce((n, g) => n + g.subjects.length, 0),
    [],
  );

  const [term, setTerm] = useState<TermId>("m12");
  const [active, setActive] = useState<Feature["id"]>("course");
  const [autoPlay, setAutoPlay] = useState(true);
  const [orderOpen, setOrderOpen] = useState(false);

  const stripRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selected = TERMS.find((t) => t.id === term)!;
  const total = priceOf(selected.months, selected.off);
  const saving = MONTHLY_PRICE * selected.months - total;

  const feature = FEATURES.find((f) => f.id === active)!;
  const Scene = FEATURE_SCENES[active];

  /* Every number and name the showcase prints, in one place. Labels, titles
     and bullets all go through `fill`, so nothing about the product's size
     is ever typed into `STR.pricing` — the game count and the game names
     come from `lib/catalog/games`, the course size from `lib/typing/curriculum`. */
  const textVars: Record<string, Record<string, string | number>> = {
    f1b1: { n: lessonCount, s: sectionCount },
    f2Label: { n: GAME_COUNT },
    f2Title: { n: GAME_COUNT },
    f2b1: { names: gameLines[0] ?? "" },
    f2b2: { names: gameLines[1] ?? "" },
    f8b1: { n: codingTotals.tracks, s: codingTotals.stages },
    f8b2: { n: codingTotals.modules },
    f10b1: { n: subjectCount, s: gradeCount },
    f10b2: { n: examCount },
  };

  /* The showcase rotates on its own until the visitor takes over — then it
     stays exactly where they put it. */
  useEffect(() => {
    if (!autoPlay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((cur) => {
        const i = FEATURES.findIndex((f) => f.id === cur);
        return FEATURES[(i + 1) % FEATURES.length].id;
      });
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [autoPlay]);

  /* Keep the active tab visible without ever scrolling the page itself. */
  useEffect(() => {
    const strip = stripRef.current;
    const tab = tabRefs.current[active];
    if (!strip || !tab) return;
    strip.scrollTo({
      left: tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2,
      behavior: "smooth",
    });
  }, [active]);

  const pick = useCallback((id: Feature["id"]) => {
    setActive(id);
    setAutoPlay(false);
  }, []);

  const onTabKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = FEATURES.findIndex((f) => f.id === active);
    const next = FEATURES[(i + dir + FEATURES.length) % FEATURES.length];
    pick(next.id);
    tabRefs.current[next.id]?.focus();
  };

  /* ── Checkout seam ──────────────────────────────────────────────────
     A visitor with no account can't own a plan, so they go and make one
     first (same hand-off the navbar uses). For a signed-in student this is
     where the payment provider gets called — until then it opens the order
     summary and says so plainly. */
  const startCheckout = () => {
    if (ready && !user) {
      window.location.href = edifyAuthUrl("signup");
      return;
    }
    setOrderOpen(true);
  };

  const money = (n: number) => `${fmt(n)} ${P.soum[locale]}`;

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 min-h-screen pt-10 px-6 pb-12">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {P.title[locale]}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              fill(P.pillLessons[locale], { n: lessonCount }),
              fill(P.pillGames[locale], { n: GAME_COUNT }),
              P.pillLangs[locale],
            ].map((pill) => (
              <span
                key={pill}
                className="rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          {/* LEFT — what Pro opens */}
          <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
            <div className="relative w-full aspect-video bg-neutral-50 dark:bg-neutral-950/40">
              <Scene className="absolute inset-0 w-full h-full" />
            </div>

            {/* the tab strip under the stage */}
            <div
              ref={stripRef}
              role="tablist"
              aria-label={P.includedTitle[locale]}
              onKeyDown={onTabKey}
              className="flex overflow-x-auto border-y border-neutral-200 dark:border-neutral-800"
            >
              {FEATURES.map((f) => {
                const Icon = f.icon;
                const on = f.id === active;
                return (
                  <button
                    key={f.id}
                    ref={(el) => {
                      tabRefs.current[f.id] = el;
                    }}
                    role="tab"
                    id={`tab-${f.id}`}
                    aria-selected={on}
                    aria-controls="feature-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => pick(f.id)}
                    className={`relative shrink-0 flex flex-col items-center gap-1 min-w-22 px-3 py-2.5 transition-colors cursor-pointer ${
                      on
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                    }`}
                  >
                    <span
                      className={`absolute -top-px left-0 right-0 h-0.5 ${
                        on ? "bg-neutral-900 dark:bg-neutral-100" : ""
                      }`}
                    />
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-medium whitespace-nowrap">
                      {fill(STR.pricing[f.label][locale], textVars[f.label])}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              id="feature-panel"
              role="tabpanel"
              aria-labelledby={`tab-${active}`}
              className="p-4"
            >
              <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                {fill(STR.pricing[feature.title][locale], textVars[feature.title])}
              </h2>
              <ul className="mt-2 grid sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {fill(STR.pricing[b][locale], textVars[b])}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* RIGHT — the plan */}
          <aside className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm lg:sticky lg:top-24">
            <span className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-0.5 text-xs font-bold text-white dark:text-neutral-900">
              {P.planName[locale]}
            </span>

            <div className="mt-3 flex flex-col gap-2" role="radiogroup">
              {TERMS.map((t) => {
                const price = priceOf(t.months, t.off);
                const on = t.id === term;
                return (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setTerm(t.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                      on
                        ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 grid place-items-center ${
                            on
                              ? "border-neutral-900 dark:border-neutral-100"
                              : "border-neutral-300 dark:border-neutral-600"
                          }`}
                        >
                          {on && (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                          )}
                        </span>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {STR.pricing[t.label][locale]}
                        </span>
                        {t.off > 0 && (
                          <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            −{Math.round(t.off * 100)}%
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {money(price)}
                      </span>
                    </div>
                    <p className="mt-1 pl-5.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {fill(P.perMonth[locale], {
                        n: money(Math.round(price / t.months)),
                      })}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {P.total[locale]}
              </span>
              <span className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {money(total)}
              </span>
            </div>
            {saving > 0 && (
              <p className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {fill(P.youSave[locale], { n: money(saving) })}
              </p>
            )}

            <button
              onClick={startCheckout}
              className="mt-3 w-full rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2.5 font-bold hover:bg-neutral-700 dark:hover:bg-white transition-colors cursor-pointer"
            >
              {P.cta[locale]}
            </button>
            <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
              {selected.months > 1 ? P.oncePay[locale] : P.monthlyPay[locale]}
            </p>

            {orderOpen && (
              <div className="mt-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {P.planName[locale]} · {STR.pricing[selected.label][locale]}
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {money(total)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {P.orderSoon[locale]}
                </p>
                <button
                  onClick={() => setOrderOpen(false)}
                  className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  {P.close[locale]}
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Questions — collapsed, so they cost one line each */}
        <div className="mt-12 grid lg:grid-cols-2 gap-2 items-start">
          {(
            [
              ["q1", "a1"],
              ["q2", "a2"],
              ["q3", "a3"],
              ["q4", "a4"],
            ] as const
          ).map(([q, a]) => (
            <details
              key={q}
              className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {P[q][locale]}
                <span className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {P[a][locale]}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
