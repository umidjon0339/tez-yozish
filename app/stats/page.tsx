"use client";

// /stats — the personal statistics dashboard. One scrolling page:
// week summary → history charts → keyboard heatmap (+ key detail) →
// finger mastery & rows → practice calendar → records & totals →
// course progress → keys-learned map. All data from tz-stats-v1
// (lib/stats.ts) and tz-progress-v1 (lib/progress.ts).

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Timer,
  Trophy,
  TrendingUp,
  RotateCcw,
  Star,
  BookOpen,
} from "lucide-react";
import { course } from "@/lib/curriculum";
import { isGradedType } from "@/lib/lessonTypes";
import { useProgress, isLessonPassed } from "@/lib/progress";
import {
  useStats,
  computeKeyStats,
  computeFingerStats,
  computeRowStats,
  computeDaySeries,
  computeStreak,
  computeTotals,
  computeWeekSummary,
  resetStats,
  CONFIDENCE_LEARNED,
} from "@/lib/stats";
import {
  FINGER_OF_KEY_ID,
  keyIdForChar,
  type Finger,
  type KeyRow,
} from "@/components/keyboard/keymap";
import { LineChart, type LinePoint } from "@/components/stats/LineChart";
import {
  KeyboardHeatmap,
  KEY_ROWS,
  type HeatmapMetric,
  type KeyCellData,
} from "@/components/stats/KeyboardHeatmap";
import { FingerMastery } from "@/components/stats/FingerMastery";
import { ActivityCalendar } from "@/components/stats/ActivityCalendar";
import { Mascot } from "@/components/Mascot";
import { useLocale, type Locale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";

const S = STR.stats;
const LOCALE_TAG: Record<Locale, string> = { en: "en", uz: "uz", ru: "ru" };

// ─── small helpers ───

function fmtDuration(ms: number, locale: Locale): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return `<1 ${S.minutesShort[locale]}`;
  if (totalMin < 60) return `${totalMin} ${S.minutesShort[locale]}`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h} ${S.hoursShort[locale]} ${m} ${S.minutesShort[locale]}`;
}

function glyphFor(keyId: string): string {
  for (const row of KEY_ROWS) {
    const k = row.find((k) => k.id === keyId);
    if (k) return k.glyph;
  }
  return keyId;
}

function displayKey(key: string): string {
  return key === " " ? "␣" : key;
}

// ─── tiny local UI pieces ───

function Card({
  title,
  desc,
  right,
  children,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
        {icon}
        {label}
      </span>
      <span className="font-mono text-2xl sm:text-[28px] font-bold text-neutral-900 leading-tight">
        {value}
      </span>
      {sub && <span className="text-[11px] text-neutral-400">{sub}</span>}
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-neutral-100 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            o.value === value
              ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── the page ───

export default function StatsPage() {
  const { locale } = useLocale();
  const tag = LOCALE_TAG[locale];
  const store = useStats();

  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [metric, setMetric] = useState<HeatmapMetric>("errors");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const progress = useProgress();

  const nf = useMemo(() => new Intl.NumberFormat(tag), [tag]);

  // derived stats
  const keyStats = useMemo(() => computeKeyStats(store), [store]);
  const fingerStats = useMemo(() => computeFingerStats(keyStats), [keyStats]);
  const rowStats = useMemo(() => computeRowStats(keyStats), [keyStats]);
  const totals = useMemo(() => computeTotals(store), [store]);
  const streak = useMemo(() => computeStreak(store), [store]);
  const week = useMemo(() => computeWeekSummary(store), [store]);
  const series = useMemo(() => computeDaySeries(store, range), [store, range]);
  const calendarDays = useMemo(() => computeDaySeries(store, 182), [store]);

  // per-physical-key merge ("1" and "!" share key-1)
  const keyDataById = useMemo(() => {
    const m = new Map<string, KeyCellData & { msWeight: number; confWeight: number }>();
    for (const s of keyStats) {
      if (!s.keyId) continue;
      const c = m.get(s.keyId) ?? {
        presses: 0,
        errors: 0,
        errorRate: 0,
        keyWpm: null,
        confidence: null,
        msWeight: 0,
        confWeight: 0,
      };
      c.presses += s.presses;
      c.errors += s.errors;
      if (s.keyWpm !== null && s.presses > 0) {
        c.keyWpm =
          ((c.keyWpm ?? 0) * c.msWeight + s.keyWpm * s.presses) /
          (c.msWeight + s.presses);
        c.msWeight += s.presses;
      }
      if (s.confidence !== null && s.presses > 0) {
        c.confidence =
          ((c.confidence ?? 0) * c.confWeight + s.confidence * s.presses) /
          (c.confWeight + s.presses);
        c.confWeight += s.presses;
      }
      m.set(s.keyId, c);
    }
    for (const c of m.values()) {
      const total = c.presses + c.errors;
      c.errorRate = total > 0 ? c.errors / total : 0;
    }
    return m as Map<string, KeyCellData>;
  }, [keyStats]);

  // chart data
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }),
    [tag],
  );
  const wpmData: LinePoint[] = useMemo(
    () =>
      series.map((p) => ({
        label: dateFmt.format(p.date),
        short: dateFmt.format(p.date),
        value: p.avgWpm,
      })),
    [series, dateFmt],
  );
  const accData: LinePoint[] = useMemo(
    () =>
      series.map((p) => ({
        label: dateFmt.format(p.date),
        short: dateFmt.format(p.date),
        value: p.avgAcc,
      })),
    [series, dateFmt],
  );
  const accMin = useMemo(() => {
    const vals = accData.filter((d) => d.value !== null).map((d) => d.value as number);
    if (vals.length === 0) return 0;
    return Math.max(0, Math.floor((Math.min(...vals) - 10) / 10) * 10);
  }, [accData]);

  // localized names
  const fingerNames: Record<Finger, string> = useMemo(
    () => ({
      "l-pinky": S.fingerLPinky[locale],
      "l-ring": S.fingerLRing[locale],
      "l-middle": S.fingerLMiddle[locale],
      "l-index": S.fingerLIndex[locale],
      thumb: S.fingerThumb[locale],
      "r-index": S.fingerRIndex[locale],
      "r-middle": S.fingerRMiddle[locale],
      "r-ring": S.fingerRRing[locale],
      "r-pinky": S.fingerRPinky[locale],
    }),
    [locale],
  );
  const rowNames: Record<KeyRow, string> = useMemo(
    () => ({
      home: S.rowHome[locale],
      top: S.rowTop[locale],
      bottom: S.rowBottom[locale],
      number: S.rowNumber[locale],
    }),
    [locale],
  );

  // course progress per chapter
  const chapterProgress = useMemo(
    () =>
      course.chapters.map((ch) => {
        const lessons = ch.sections.flatMap((s) => s.lessons);
        const passed = lessons.filter((l) =>
          isLessonPassed({ lessonId: l.lessonId, passStars: l.passStars }, progress),
        ).length;
        const graded = lessons.filter((l) => isGradedType(l.type));
        const stars = graded.reduce(
          (a, l) => a + (progress[l.lessonId]?.stars ?? 0),
          0,
        );
        return {
          id: ch.chapterId,
          title: ch.chapterTitle[locale],
          total: lessons.length,
          passed,
          stars,
          maxStars: graded.length * 5,
        };
      }),
    [progress, locale],
  );

  // keys-learned map: unlocked = keys of passed lessons
  const unlockedKeyIds = useMemo(() => {
    const set = new Set<string>();
    for (const ch of course.chapters)
      for (const sec of ch.sections)
        for (const l of sec.lessons) {
          if (!isLessonPassed({ lessonId: l.lessonId, passStars: l.passStars }, progress))
            continue;
          for (const k of l.unlockedKeys) {
            const id = keyIdForChar(k);
            if (id) set.add(id);
          }
        }
    return set;
  }, [progress]);

  const hasData = totals.keys > 0;
  const selectedCell = selectedKey ? keyDataById.get(selectedKey) : undefined;

  const keyTooltip = (glyph: string, cell: KeyCellData | undefined) => {
    if (!cell || cell.presses + cell.errors === 0)
      return `${glyph.toUpperCase()} — ${S.noKeyData[locale]}`;
    const parts = [
      `${S.presses[locale]}: ${nf.format(cell.presses)}`,
      `${S.errors[locale]}: ${nf.format(cell.errors)} (${Math.round(cell.errorRate * 100)}%)`,
    ];
    if (cell.keyWpm !== null)
      parts.push(`${S.metricSpeed[locale]}: ${Math.round(cell.keyWpm)} ${S.wpmUnit[locale]}`);
    if (cell.confidence !== null)
      parts.push(`${S.metricConfidence[locale]}: ${Math.round(cell.confidence)}/100`);
    return `${glyph.toUpperCase()} — ${parts.join(" · ")}`;
  };

  const calFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "numeric" }),
    [tag],
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          {S.title[locale]}
        </h1>
        <p className="text-sm text-neutral-400 mt-1">{S.subtitle[locale]}</p>
      </header>

      {!hasData ? (
        <div className="bg-white border border-neutral-200 rounded-2xl px-6 py-16 flex flex-col items-center gap-4 text-center">
          <Mascot mood="happy" className="w-24 h-24" />
          <h2 className="text-lg font-bold text-neutral-900">{S.emptyTitle[locale]}</h2>
          <p className="text-sm text-neutral-500 max-w-sm">{S.emptyBody[locale]}</p>
          <Link
            href="/courses/course_core_typing"
            className="mt-2 text-[13px] font-medium bg-neutral-950 text-white hover:bg-neutral-800 px-5 py-2 rounded-md transition-colors shadow-sm"
          >
            {S.emptyCta[locale]}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── this week ── */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-2">
              {S.thisWeek[locale]}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                icon={<Timer size={12} />}
                label={S.practiceTime[locale]}
                value={fmtDuration(week.ms, locale)}
              />
              <StatTile
                icon={<BookOpen size={12} />}
                label={S.lessonsDone[locale]}
                value={String(week.lessons)}
              />
              <StatTile
                icon={<TrendingUp size={12} />}
                label={S.avgWpm[locale]}
                value={week.avgWpm !== null ? String(Math.round(week.avgWpm)) : "—"}
                sub={
                  week.wpmDelta !== null ? (
                    <span
                      className={
                        week.wpmDelta >= 0 ? "text-emerald-600" : "text-red-500"
                      }
                    >
                      {week.wpmDelta >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(Math.round(week.wpmDelta))} {S.wpmUnit[locale]}
                    </span>
                  ) : (
                    S.wpmUnit[locale]
                  )
                }
              />
              <StatTile
                icon={<Flame size={12} />}
                label={S.streak[locale]}
                value={String(streak.current)}
                sub={`${S.longestStreak[locale]}: ${streak.longest}`}
              />
            </div>
          </div>

          {/* ── history charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title={S.wpmHistory[locale]}
              right={
                <Segmented
                  options={[
                    { value: 7 as const, label: S.days7[locale] },
                    { value: 30 as const, label: S.days30[locale] },
                    { value: 90 as const, label: S.days90[locale] },
                  ]}
                  value={range}
                  onChange={setRange}
                />
              }
            >
              <LineChart
                data={wpmData}
                color="#171717"
                unit={` ${S.wpmUnit[locale]}`}
                emptyText={S.noChartData[locale]}
              />
            </Card>
            <Card title={S.accHistory[locale]}>
              <LineChart
                data={accData}
                color="#171717"
                unit="%"
                domain={[accMin, 100]}
                emptyText={S.noChartData[locale]}
              />
            </Card>
          </div>

          {/* ── keyboard heatmap ── */}
          <Card
            title={S.keyboardTitle[locale]}
            desc={S.keyboardDesc[locale]}
            right={
              <div className="flex items-center gap-3 flex-wrap">
                {week.worstKey && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                    {S.trickyKey[locale]}:
                    <kbd className="font-mono font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded uppercase text-[11px]">
                      {displayKey(week.worstKey)}
                    </kbd>
                  </span>
                )}
                <Segmented
                  options={[
                    { value: "errors" as const, label: S.metricErrors[locale] },
                    { value: "speed" as const, label: S.metricSpeed[locale] },
                    { value: "usage" as const, label: S.metricUsage[locale] },
                    {
                      value: "confidence" as const,
                      label: S.metricConfidence[locale],
                    },
                  ]}
                  value={metric}
                  onChange={setMetric}
                />
              </div>
            }
          >
            <KeyboardHeatmap
              data={keyDataById}
              metric={metric}
              selected={selectedKey}
              onSelect={setSelectedKey}
              tooltip={keyTooltip}
              lowLabel={S.legendLow[locale]}
              highLabel={S.legendHigh[locale]}
            />

            {/* key detail panel (#23) */}
            {selectedKey && (
              <div className="mt-5 border-t border-neutral-100 pt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                <span className="w-12 h-12 rounded-xl bg-neutral-950 text-white font-mono text-xl font-bold uppercase flex items-center justify-center">
                  {glyphFor(selectedKey)}
                </span>
                {!selectedCell || selectedCell.presses + selectedCell.errors === 0 ? (
                  <span className="text-sm text-neutral-400">
                    {S.noKeyData[locale]}
                  </span>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                        {S.presses[locale]}
                      </span>
                      <span className="font-mono text-lg font-bold text-neutral-900">
                        {nf.format(selectedCell.presses)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                        {S.errorRate[locale]}
                      </span>
                      <span className="font-mono text-lg font-bold text-neutral-900">
                        {Math.round(selectedCell.errorRate * 100)}%
                        <span className="text-xs text-neutral-400 font-normal">
                          {" "}
                          ({nf.format(selectedCell.errors)})
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                        {S.metricSpeed[locale]}
                      </span>
                      <span className="font-mono text-lg font-bold text-neutral-900">
                        {selectedCell.keyWpm !== null
                          ? `${Math.round(selectedCell.keyWpm)} ${S.wpmUnit[locale]}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                        {S.metricConfidence[locale]}
                      </span>
                      {selectedCell.confidence !== null ? (
                        <span className="flex items-center gap-2">
                          <span className="w-24 h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                            <span
                              className="block h-full rounded-full bg-emerald-500"
                              style={{ width: `${selectedCell.confidence}%` }}
                            />
                          </span>
                          <span className="font-mono text-xs font-bold text-neutral-900">
                            {Math.round(selectedCell.confidence)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {S.stillLearning[locale]}
                        </span>
                      )}
                    </div>
                    {FINGER_OF_KEY_ID[selectedKey] && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                          {S.finger[locale]}
                        </span>
                        <span className="text-sm font-medium text-neutral-700">
                          {fingerNames[FINGER_OF_KEY_ID[selectedKey]]}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>

          {/* ── fingers & rows ── */}
          <Card title={S.fingersTitle[locale]} desc={S.fingersDesc[locale]}>
            <FingerMastery
              stats={fingerStats}
              names={fingerNames}
              fmtValue={(s) =>
                !s || s.total === 0
                  ? "—"
                  : `${s.accuracy}%${
                      s.avgMs !== null
                        ? ` · ${Math.round(12000 / s.avgMs / 5)} ${S.wpmUnit[locale]}`
                        : ""
                    }`
              }
            />
            <div className="mt-7 border-t border-neutral-100 pt-5">
              <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-3">
                {S.rowsTitle[locale]}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {(["home", "top", "bottom", "number"] as KeyRow[]).map((row) => {
                  const s = rowStats[row];
                  const acc = s && s.total > 0 ? s.accuracy : null;
                  return (
                    <div key={row} className="flex items-center gap-2.5">
                      <span className="w-28 shrink-0 text-xs text-neutral-500">
                        {rowNames[row]}
                      </span>
                      <span className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-neutral-800"
                          style={{ width: `${acc ?? 0}%` }}
                        />
                      </span>
                      <span className="w-24 shrink-0 text-right font-mono text-[11px] text-neutral-500">
                        {acc !== null ? `${acc}% · ${nf.format(s.total)}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ── practice calendar ── */}
          <Card title={S.activityTitle[locale]} desc={S.activityDesc[locale]}>
            <ActivityCalendar
              days={calendarDays}
              localeTag={tag}
              tooltip={(d) =>
                `${calFmt.format(d.date)} — ${Math.round(d.ms / 60000)} ${S.minutesShort[locale]} · ${d.lessons} ${S.lessonsWord[locale]}`
              }
              lessLabel={S.legendLow[locale]}
              moreLabel={S.legendHigh[locale]}
            />
          </Card>

          {/* ── records & totals ── */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-2">
              {S.recordsTitle[locale]}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                icon={<Trophy size={12} />}
                label={S.bestWpm[locale]}
                value={store.records.bestWpm > 0 ? String(store.records.bestWpm) : "—"}
                sub={S.wpmUnit[locale]}
              />
              <StatTile
                icon={<Star size={12} />}
                label={S.bestAcc[locale]}
                value={
                  store.records.bestAccuracy > 0
                    ? `${store.records.bestAccuracy}%`
                    : "—"
                }
              />
              <StatTile
                icon={<Flame size={12} />}
                label={S.bestCombo[locale]}
                value={
                  store.records.bestCombo > 0
                    ? nf.format(store.records.bestCombo)
                    : "—"
                }
              />
              <StatTile
                icon={<Flame size={12} />}
                label={S.longestStreak[locale]}
                value={String(streak.longest)}
                sub={S.daysShort[locale]}
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mb-2">
              {S.totalsTitle[locale]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatTile label={S.totalTime[locale]} value={fmtDuration(totals.ms, locale)} />
              <StatTile label={S.totalKeys[locale]} value={nf.format(totals.keys)} />
              <StatTile label={S.totalWords[locale]} value={nf.format(totals.words)} />
              <StatTile label={S.totalLessons[locale]} value={nf.format(totals.lessons)} />
              <StatTile label={S.activeDays[locale]} value={nf.format(totals.activeDays)} />
            </div>
          </div>

          {/* ── course progress ── */}
          <Card title={S.courseTitle[locale]}>
            <div className="flex flex-wrap gap-8">
              {chapterProgress.map((ch) => {
                const pct = ch.total > 0 ? ch.passed / ch.total : 0;
                const C = 2 * Math.PI * 26;
                return (
                  <div key={ch.id} className="flex flex-col items-center gap-2 w-32">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r="26"
                        fill="none"
                        stroke="#f0f0ef"
                        strokeWidth="7"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r="26"
                        fill="none"
                        stroke="#171717"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${pct * C} ${C}`}
                        transform="rotate(-90 36 36)"
                      />
                      <text
                        x="36"
                        y="40"
                        textAnchor="middle"
                        className="fill-neutral-900 font-mono font-bold"
                        fontSize="14"
                      >
                        {Math.round(pct * 100)}%
                      </text>
                    </svg>
                    <span className="text-xs font-medium text-neutral-700 text-center leading-tight">
                      {ch.title}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {ch.passed}/{ch.total} · {ch.stars}/{ch.maxStars} ★
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── keys learned map ── */}
          <Card title={S.keysLearnedTitle[locale]}>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col gap-1.5 overflow-x-auto max-w-full py-1">
                {KEY_ROWS.map((row, ri) => (
                  <div
                    key={ri}
                    className="flex gap-1.5"
                    style={{ marginLeft: [0, 14, 22, 34, 120][ri] }}
                  >
                    {row.map((k) => {
                      const cell = keyDataById.get(k.id);
                      const hasKeyData = !!cell && cell.presses + cell.errors > 0;
                      const learned =
                        !!cell &&
                        cell.confidence !== null &&
                        cell.confidence >= CONFIDENCE_LEARNED;
                      const unlocked = unlockedKeyIds.has(k.id);
                      const cls = learned
                        ? "bg-emerald-500 text-white"
                        : hasKeyData
                          ? "bg-amber-200 text-amber-950"
                          : unlocked
                            ? "bg-white border border-neutral-200 text-neutral-500"
                            : "bg-neutral-100 text-neutral-300";
                      const label = learned
                        ? S.legendLearned[locale]
                        : hasKeyData
                          ? S.legendLearning[locale]
                          : unlocked
                            ? S.legendUnlocked[locale]
                            : S.legendLocked[locale];
                      return (
                        <span
                          key={k.id}
                          title={`${k.glyph.toUpperCase()} — ${label}`}
                          className={`${k.wide ? "w-56" : "w-8 sm:w-9"} h-8 sm:h-9 shrink-0 rounded-md font-mono text-[11px] font-bold uppercase flex items-center justify-center ${cls}`}
                        >
                          {k.glyph}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-neutral-500 flex-wrap justify-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  {S.legendLearned[locale]}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-200" />
                  {S.legendLearning[locale]}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-white border border-neutral-200" />
                  {S.legendUnlocked[locale]}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-neutral-100" />
                  {S.legendLocked[locale]}
                </span>
              </div>
            </div>
          </Card>

          {/* ── footer ── */}
          <div className="flex items-center justify-between pt-2 pb-6 text-xs text-neutral-400">
            <span>{S.storedLocally[locale]}</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(S.resetConfirm[locale])) resetStats();
              }}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              {S.resetBtn[locale]}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
