"use client";

// GitHub-style practice calendar: one square per day, columns are weeks
// (Mon→Sun), single emerald ramp by practice time. Exact values ride the
// tooltip; a less→more legend anchors the ramp.

import React, { useMemo } from "react";
import type { DayPoint } from "@/lib/stats";

const RAMP = ["var(--ramp-good-1)", "var(--ramp-good-2)", "var(--ramp-good-3)", "var(--ramp-good-4)"];
const EMPTY = "var(--chart-empty)";

function stepFor(d: DayPoint): number | null {
  if (d.keys <= 0 && d.ms <= 0) return null;
  const min = d.ms / 60000;
  return min >= 30 ? 3 : min >= 15 ? 2 : min >= 5 ? 1 : 0;
}

export function ActivityCalendar({
  days,
  localeTag,
  tooltip,
  lessLabel,
  moreLabel,
}: {
  days: DayPoint[]; // oldest → newest (computeDaySeries output)
  localeTag: string;
  tooltip: (d: DayPoint) => string;
  lessLabel: string;
  moreLabel: string;
}) {
  const { weeks, monthLabels, weekdayLabels } = useMemo(() => {
    // pad the front so the first column starts on Monday
    const first = days[0]?.date ?? new Date();
    const lead = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
    const padded: (DayPoint | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...days,
    ];
    const weeks: (DayPoint | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }

    const monthFmt = new Intl.DateTimeFormat(localeTag, { month: "short" });
    const monthLabels: (string | null)[] = weeks.map((week, wi) => {
      const firstDay = week.find((d) => d !== null);
      if (!firstDay) return null;
      if (wi === 0) return monthFmt.format(firstDay.date);
      const prevWeek = weeks[wi - 1];
      const prevDay = [...prevWeek].reverse().find((d) => d !== null);
      if (!prevDay) return null;
      return firstDay.date.getMonth() !== prevDay.date.getMonth()
        ? monthFmt.format(firstDay.date)
        : null;
    });

    // Mon / Wed / Fri row labels
    const wdFmt = new Intl.DateTimeFormat(localeTag, { weekday: "short" });
    const monday = new Date(2026, 0, 5); // a known Monday
    const weekdayLabels = [0, 2, 4].map((offset) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + offset);
      return wdFmt.format(d);
    });

    return { weeks, monthLabels, weekdayLabels };
  }, [days, localeTag]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* month labels */}
          <div className="flex gap-[3px] ml-8 h-4">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="w-3 shrink-0 text-[9px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap overflow-visible"
              >
                {m ?? ""}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {/* weekday labels */}
            <div className="flex flex-col justify-between py-px w-6 text-right">
              {weekdayLabels.map((w) => (
                <span key={w} className="text-[9px] leading-3 text-neutral-400 dark:text-neutral-500">
                  {w}
                </span>
              ))}
            </div>
            {/* grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, di) => {
                    const d = week[di] ?? null;
                    if (!d) {
                      return <span key={di} className="w-3 h-3 rounded-[3px]" />;
                    }
                    const step = stepFor(d);
                    return (
                      <span
                        key={di}
                        title={tooltip(d)}
                        className="w-3 h-3 rounded-[3px] cursor-default"
                        style={{
                          background: step === null ? EMPTY : RAMP[step],
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>{lessLabel}</span>
        <span className="w-3 h-3 rounded-[3px]" style={{ background: EMPTY }} />
        {RAMP.map((c) => (
          <span key={c} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>{moreLabel}</span>
      </div>
    </div>
  );
}
