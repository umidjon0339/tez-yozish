"use client";

// The bottom half of the result screen, in two columns: the **world record**
// podium on the left and the **world speed map** on the right.
//
// The two answer different questions on purpose. The podium is the ceiling —
// Monkeytype's three fastest humans, with the learner's own row underneath,
// styled so the two can never be read as one list. The histogram is the crowd:
// where this result sits among everybody's. A number like "62 wpm" means
// nothing without both, and the podium alone is discouraging without the curve
// that shows 62 is ahead of most people.
//
// The heading says *world record* rather than anything about standing or
// ranking, so nobody reads the podium as a local scoreboard of this app's users.
//
// It reuses the read-only Monkeytype client /compete is built on
// (lib/monkeytype.ts): the all-time leaderboard for the podium, and the public
// speed histogram for both the curve and the learner's estimated place — one
// fetch feeding both, since they are the same data read two ways.
// See docs/home-test.md §7.

import React, { useEffect, useMemo, useState } from "react";
import { Crown, Medal } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { Histogram, type HistBucket } from "@/components/stats/Histogram";
import {
  discordAvatarUrl,
  fetchLeaderboard,
  fetchSpeedHistogram,
  rankForWpm,
  type MtDuration,
  type MtEntry,
} from "@/lib/monkeytype";
import type { TestMode } from "@/lib/typingTest";

/** 15 s tests get the 15 s board; everything else is measured against 60 s. */
export function boardFor(mode: TestMode, time: number): MtDuration {
  return mode === "time" && time <= 15 ? "15" : "60";
}

/* Gold, silver, bronze — the same podium tinting /compete uses. */
const MEDAL = [
  "text-amber-400",
  "text-neutral-400 dark:text-neutral-300",
  "text-amber-700 dark:text-amber-600",
];

function Face({ entry }: { entry: MtEntry }) {
  const [broken, setBroken] = useState(false);
  const url = broken ? null : discordAvatarUrl(entry);
  if (!url) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        {entry.name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onError={() => setBroken(true)}
      className="h-7 w-7 shrink-0 rounded-full object-cover"
    />
  );
}

/** Both columns wear the same header: one label, nothing else. */
function Head({ title, hint }: { title: string; hint?: string }) {
  return (
    <h2
      title={hint}
      className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-400"
    >
      {title}
    </h2>
  );
}

/**
 * One line of the podium. The learner's row is the same shape, inverted.
 *
 * The rank leads the row and is **left-aligned**: `1` and `439,947` start at
 * the same x, so the column reads as a list even though the widths differ by
 * six digits. (Right-aligning it, as a numeric column normally wants, is what
 * left the hole to the left of `#1` that this layout exists to close.)
 * `PLACE_W` fits seven digits with separators — the histogram Monkeytype
 * publishes samples a few hundred thousand tests.
 */
const PLACE_W = "w-16";

function Row({
  place,
  icon,
  face,
  name,
  wpm,
  acc,
  mine,
}: {
  place: string;
  icon?: React.ReactNode;
  face?: React.ReactNode;
  name: string;
  wpm: number;
  acc: number;
  mine?: boolean;
}) {
  const dim = mine ? "text-white/70 dark:text-neutral-950/60" : "text-neutral-400";
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${
        mine
          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
          : "text-neutral-700 dark:text-neutral-300"
      }`}
    >
      <span
        className={`${PLACE_W} shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums ${dim}`}
      >
        {place}
      </span>
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      {face}
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{name}</span>
      <span className="w-10 shrink-0 text-right font-mono text-[15px] font-semibold tabular-nums">
        {Math.round(wpm)}
      </span>
      <span className={`w-9 shrink-0 text-right font-mono text-[11px] ${dim}`}>
        {acc.toFixed(0)}%
      </span>
    </div>
  );
}

export function Standing({
  wpm,
  accuracy,
  mode,
  time,
}: {
  wpm: number;
  accuracy: number;
  mode: TestMode;
  time: number;
}) {
  const { locale } = useLocale();
  const T = STR.test;
  const duration = boardFor(mode, time);
  const [top, setTop] = useState<MtEntry[] | null>(null);
  const [hist, setHist] = useState<Record<string, number> | null>(null);

  // Both calls are cached in sessionStorage by the client, so back-to-back
  // tests do not hit the API again. A failure hides only the part that failed.
  useEffect(() => {
    let alive = true;
    fetchLeaderboard("alltime", duration, 0)
      .then((page) => alive && setTop(page.entries.slice(0, 3)))
      .catch(() => {});
    fetchSpeedHistogram(duration)
      .then((h) => alive && setHist(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [duration]);

  // The place and the curve are the same histogram read two ways.
  const place = useMemo(() => (hist ? rankForWpm(hist, wpm) : null), [hist, wpm]);
  const buckets: HistBucket[] = useMemo(
    () => (hist ? Object.entries(hist).map(([lo, count]) => ({ lo: Number(lo), count })) : []),
    [hist],
  );

  if (!top?.length) return null;

  const num = new Intl.NumberFormat(locale === "en" ? "en-US" : locale);
  // Bare digits, by request — no `≈`, no `#`. It is still an *estimated* rank
  // among sampled tests rather than a ladder position, so the heading's hover
  // hint is now the only place that caveat survives (docs/home-test.md §7).
  const myPlace = place ? num.format(place.faster) : "—";

  return (
    <section className="mt-8 grid w-full gap-x-8 gap-y-6 md:grid-cols-2">
      {/* ── left: the ceiling ── */}
      <div>
        {/* Which board this is stays available on hover rather than as a line
            of small print: the screen is for reading a result, not a caption. */}
        <Head
          title={T.worldRecord[locale]}
          hint={`${T.boardAllTime[locale]} · english · ${duration}s`}
        />

        <div className="rounded-xl border border-neutral-200 p-1.5 dark:border-white/10">
          {top.map((e, i) => (
            <Row
              key={e.rank}
              place={String(e.rank)}
              icon={
                i === 0 ? (
                  <Crown className={`h-4 w-4 ${MEDAL[0]}`} strokeWidth={2.2} />
                ) : (
                  <Medal className={`h-4 w-4 ${MEDAL[i]}`} strokeWidth={2.2} />
                )
              }
              face={<Face entry={e} />}
              name={e.name}
              wpm={e.wpm}
              acc={e.acc}
            />
          ))}

          {/* the gap between the champions and everyone else */}
          <div className="py-0.5 text-center font-mono text-[13px] leading-none text-neutral-300 dark:text-neutral-700">
            ⋯
          </div>

          <Row
            place={myPlace}
            face={
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold dark:bg-neutral-950/10">
                {T.youLabel[locale].charAt(0).toUpperCase()}
              </span>
            }
            name={T.youLabel[locale]}
            wpm={wpm}
            acc={accuracy}
            mine
          />
        </div>
      </div>

      {/* ── right: the crowd. Same header shape and the same 191px card body,
             so the two columns line up top and bottom without being told to. ── */}
      {buckets.length > 0 && (
        <div>
          <Head title={STR.compete.histTitle[locale]} hint={STR.compete.histDesc[locale]} />
          <div className="rounded-xl border border-neutral-200 px-2 pb-1 dark:border-white/10">
            <Histogram
              buckets={buckets}
              bucketSize={10}
              markerValue={wpm > 0 ? wpm : null}
              markerLabel={T.youLabel[locale]}
              countWord={STR.compete.histTests[locale]}
              unit={STR.stats.wpmUnit[locale]}
              height={182}
            />
          </div>
        </div>
      )}
    </section>
  );
}
