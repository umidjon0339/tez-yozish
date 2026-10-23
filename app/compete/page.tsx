"use client";

// /compete — global typing leaderboards, live from the public
// Monkeytype API (lib/catalog/monkeytype.ts). Three boards — today / all-time
// (speed, 15s or 60s) and this-week (XP, rewards practice volume) —
// plus a "you" card placing the student's local best (tz-stats-v1) on
// the world speed histogram, the histogram itself as a chart, today's
// qualification bar, and site-wide pulse totals.

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Crown, Medal, Trophy } from "lucide-react";
import {
  MT_PAGE_SIZE,
  discordAvatarUrl,
  fetchLeaderboard,
  fetchSpeedHistogram,
  fetchTypingStats,
  fetchXpLeaderboard,
  percentileForWpm,
  type MtDuration,
  type MtEntry,
  type MtLeaderboardPage,
  type MtTypingStats,
  type MtXpPage,
} from "@/lib/catalog/monkeytype";
import { Histogram, type HistBucket } from "@/components/stats/Histogram";
import { useStats } from "@/lib/typing/stats";
import { useLocale, type Locale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";

const C = STR.compete;
const LOCALE_TAG: Record<Locale, string> = { en: "en", uz: "uz", ru: "ru" };

type Board = "daily" | "alltime" | "xp";
const SECONDS_PER_YEAR = 31_557_600;

function tpl(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function fmtWhen(timestamp: number, locale: Locale): string {
  const d = new Date(timestamp);
  const now = new Date();
  const tag = LOCALE_TAG[locale];
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function fmtHoursMin(seconds: number, locale: Locale): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} ${STR.stats.minutesShort[locale]}`;
  return `${h} ${STR.stats.hoursShort[locale]} ${m} ${STR.stats.minutesShort[locale]}`;
}

// ─── small pieces ───

function Avatar({ entry, size = "w-7 h-7" }: { entry: MtEntry; size?: string }) {
  const [broken, setBroken] = useState(false);
  const url = discordAvatarUrl(entry);
  if (!url || broken) {
    return (
      <div
        className={`${size} rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0`}
      >
        {entry.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onError={() => setBroken(true)}
      className={`${size} rounded-full border border-neutral-200 dark:border-neutral-800 shrink-0 object-cover`}
    />
  );
}

function LetterAvatar({ name, size = "w-7 h-7" }: { name: string; size?: string }) {
  return (
    <div
      className={`${size} rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors cursor-pointer ${
            value === o.id
              ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const MEDAL_TINT = ["text-amber-500", "text-neutral-400 dark:text-neutral-500", "text-amber-700"];

function Podium({ entries, locale }: { entries: MtEntry[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {entries.map((e, i) => (
        <div
          key={e.rank}
          className={`bg-white dark:bg-neutral-900 border rounded-2xl px-5 py-4 flex items-center gap-3 ${
            i === 0 ? "border-amber-200" : "border-neutral-200 dark:border-neutral-800"
          }`}
        >
          {i === 0 ? (
            <Crown className={`w-5 h-5 shrink-0 ${MEDAL_TINT[i]}`} />
          ) : (
            <Medal className={`w-5 h-5 shrink-0 ${MEDAL_TINT[i]}`} />
          )}
          <Avatar entry={e} size="w-9 h-9" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {e.name}
            </div>
            <div className="text-xs text-neutral-400 dark:text-neutral-500">
              <span className="font-mono font-semibold text-neutral-950 dark:text-white text-sm">
                {Math.round(e.wpm)}
              </span>{" "}
              {STR.stats.wpmUnit[locale]} · {e.acc.toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function YouCard({
  locale,
  bestWpm,
  percentile,
}: {
  locale: Locale;
  bestWpm: number;
  percentile: number | null;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-semibold">
            {C.yourBest[locale]}
          </div>
          {bestWpm > 0 ? (
            <div className="text-sm text-neutral-900 dark:text-neutral-100">
              <span className="font-mono font-bold text-lg">
                {Math.round(bestWpm)}
              </span>{" "}
              {STR.stats.wpmUnit[locale]}
            </div>
          ) : (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{C.noPersonal[locale]}</div>
          )}
        </div>
      </div>
      {bestWpm > 0 && percentile !== null && (
        <div className="flex-1 min-w-50">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
            {tpl(C.fasterThan[locale], { p: percentile })}
          </div>
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-950 dark:bg-white transition-all duration-700"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── page ───

export default function CompetePage() {
  const { locale } = useLocale();
  const stats = useStats();
  const bestWpm = stats.records.bestWpm;

  const [board, setBoard] = useState<Board>("daily");
  const [duration, setDuration] = useState<MtDuration>("60");
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  // The last settled request. Loading/error are derived by comparing its
  // query key to the current one, so the effect never sets state
  // synchronously and stale data stays visible (dimmed) while switching.
  const [result, setResult] = useState<{
    query: string;
    speed: MtLeaderboardPage | null;
    xp: MtXpPage | null;
  } | null>(null);
  const [hist, setHist] = useState<Record<string, number> | null>(null);
  const [pulse, setPulse] = useState<MtTypingStats | null>(null);

  const query = `${board}:${duration}:${page}:${reloadKey}`;

  useEffect(() => {
    let stale = false;
    if (board === "xp") {
      fetchXpLeaderboard(page)
        .then((res) => {
          if (!stale) setResult({ query, speed: null, xp: res });
        })
        .catch(() => {
          if (!stale) setResult({ query, speed: null, xp: null });
        });
    } else {
      fetchLeaderboard(board, duration, page)
        .then((res) => {
          if (!stale) setResult({ query, speed: res, xp: null });
        })
        .catch(() => {
          if (!stale) setResult({ query, speed: null, xp: null });
        });
    }
    return () => {
      stale = true;
    };
  }, [board, duration, page, query]);

  useEffect(() => {
    let stale = false;
    fetchSpeedHistogram(duration)
      .then((h) => {
        if (!stale) setHist(h);
      })
      .catch(() => {
        if (!stale) setHist(null);
      });
    return () => {
      stale = true;
    };
  }, [duration]);

  useEffect(() => {
    let stale = false;
    fetchTypingStats()
      .then((s) => {
        if (!stale) setPulse(s);
      })
      .catch(() => {
        // pulse strip is decorative — just omit it
      });
    return () => {
      stale = true;
    };
  }, []);

  const switchBoard = (b: Board) => {
    setBoard(b);
    setPage(0);
  };
  const switchDuration = (d: MtDuration) => {
    setDuration(d);
    setPage(0);
  };

  const loading = result?.query !== query;
  const speed = result?.speed ?? null;
  const xp = result?.xp ?? null;
  const hasData = speed !== null || xp !== null;
  const error = !loading && result !== null && !hasData;

  const count = board === "xp" ? xp?.count : speed?.count;
  const totalPages =
    count !== undefined ? Math.max(1, Math.ceil(count / MT_PAGE_SIZE)) : 1;
  const podium =
    board !== "xp" && page === 0 ? (speed?.entries.slice(0, 3) ?? []) : [];
  const speedRows =
    board !== "xp"
      ? page === 0
        ? (speed?.entries.slice(3) ?? [])
        : (speed?.entries ?? [])
      : [];
  const numFmt = new Intl.NumberFormat(LOCALE_TAG[locale]);

  const percentile =
    hist && bestWpm > 0 ? percentileForWpm(hist, bestWpm) : null;
  const histBuckets: HistBucket[] = hist
    ? Object.entries(hist).map(([lo, cnt]) => ({ lo: Number(lo), count: cnt }))
    : [];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
          {C.title[locale]}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{C.subtitle[locale]}</p>
      </div>

      <div className="mb-4">
        <YouCard locale={locale} bestWpm={bestWpm} percentile={percentile} />
      </div>

      {/* Board + duration switches */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <SegmentedControl
          value={board}
          onChange={switchBoard}
          options={[
            { id: "daily", label: C.tabDaily[locale] },
            { id: "alltime", label: C.tabAllTime[locale] },
            { id: "xp", label: STR.stats.thisWeek[locale] },
          ]}
        />
        <div className="flex items-center gap-3">
          {count !== undefined && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {numFmt.format(count)} {C.players[locale]}
              {board === "daily" && speed?.minWpm ? (
                <> · {tpl(C.entryBar[locale], { n: Math.round(speed.minWpm) })}</>
              ) : null}
            </span>
          )}
          {board !== "xp" && (
            <SegmentedControl
              value={duration}
              onChange={switchDuration}
              options={[
                { id: "15", label: "15s" },
                { id: "60", label: "60s" },
              ]}
            />
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-10 text-center">
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            {C.errorTitle[locale]}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">{C.errorBody[locale]}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-[13px] font-medium bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            {C.retry[locale]}
          </button>
        </div>
      )}

      {/* First-load skeleton */}
      {!error && !hasData && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-11 bg-neutral-200/60 dark:bg-neutral-700/60 rounded-xl" />
          ))}
        </div>
      )}

      {!error && hasData && (
        <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
          {podium.length > 0 && (
            <div className="mb-4">
              <Podium entries={podium} locale={locale} />
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
                  <th className="text-right font-semibold py-2.5 pl-5 pr-3 w-14">#</th>
                  <th className="text-left font-semibold py-2.5 px-3">
                    {C.colPlayer[locale]}
                  </th>
                  {board === "xp" ? (
                    <>
                      <th className="text-right font-semibold py-2.5 px-3">
                        {C.colXp[locale]}
                      </th>
                      <th className="text-right font-semibold py-2.5 px-3">
                        {STR.stats.practiceTime[locale]}
                      </th>
                      <th className="text-right font-semibold py-2.5 pl-3 pr-5 hidden sm:table-cell">
                        {C.colLastActive[locale]}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="text-right font-semibold py-2.5 px-3">
                        {C.colSpeed[locale]}
                      </th>
                      <th className="text-right font-semibold py-2.5 px-3">
                        {C.colAccuracy[locale]}
                      </th>
                      <th className="text-right font-semibold py-2.5 pl-3 pr-5 hidden sm:table-cell">
                        {C.colWhen[locale]}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {board === "xp"
                  ? xp?.entries.map((e) => (
                      <tr
                        key={`${e.rank}-${e.name}`}
                        className="border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <td className="py-2 pl-5 pr-3 text-right font-mono text-neutral-400 dark:text-neutral-500">
                          {e.rank}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LetterAvatar name={e.name} />
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {e.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-neutral-950 dark:text-white">
                          {numFmt.format(e.totalXp)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-500 dark:text-neutral-400">
                          {fmtHoursMin(e.timeTypedSeconds, locale)}
                        </td>
                        <td className="py-2 pl-3 pr-5 text-right text-xs text-neutral-400 dark:text-neutral-500 hidden sm:table-cell">
                          {fmtWhen(e.lastActivityTimestamp, locale)}
                        </td>
                      </tr>
                    ))
                  : speedRows.map((e) => (
                      <tr
                        key={`${e.rank}-${e.name}`}
                        className="border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <td className="py-2 pl-5 pr-3 text-right font-mono text-neutral-400 dark:text-neutral-500">
                          {e.rank}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar entry={e} />
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {e.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-neutral-950 dark:text-white">
                          {Math.round(e.wpm)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-500 dark:text-neutral-400">
                          {e.acc.toFixed(1)}%
                        </td>
                        <td className="py-2 pl-3 pr-5 text-right text-xs text-neutral-400 dark:text-neutral-500 hidden sm:table-cell">
                          {fmtWhen(e.timestamp, locale)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {tpl(C.pageOf[locale], { a: page + 1, b: numFmt.format(totalPages) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={C.prevPage[locale]}
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={C.nextPage[locale]}
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* World speed distribution */}
      {histBuckets.length > 0 && (
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 mt-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {C.histTitle[locale]}
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{C.histDesc[locale]}</p>
          </div>
          <Histogram
            buckets={histBuckets}
            bucketSize={10}
            markerValue={bestWpm > 0 ? bestWpm : null}
            markerLabel={C.youLabel[locale]}
            countWord={C.histTests[locale]}
            unit={STR.stats.wpmUnit[locale]}
          />
        </section>
      )}

      {/* Site-wide pulse */}
      {pulse && (
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 mt-8 text-xs text-neutral-400 dark:text-neutral-500">
          <span>
            <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              {numFmt.format(pulse.testsCompleted)}
            </span>{" "}
            {C.pulseTests[locale]}
          </span>
          <span>
            <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              {numFmt.format(Math.round(pulse.timeTyping / SECONDS_PER_YEAR))}
            </span>{" "}
            {C.pulseYears[locale]}
          </span>
        </div>
      )}

      <p className="text-center text-[11px] text-neutral-300 dark:text-neutral-600 mt-6">
        <a
          href="https://monkeytype.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
        >
          {C.liveFrom[locale]}
        </a>
      </p>
    </main>
  );
}
