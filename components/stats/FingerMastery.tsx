"use client";

// Finger mastery: two schematic hand SVGs (fingers tinted by accuracy,
// single emerald ramp light→dark) + a per-finger bar list. Identity dots
// use the app's --fz finger-zone palette; exact numbers ride the bars and
// tooltips so color never stands alone.

import React from "react";
import { FINGER_ORDER, type Finger } from "@/components/keyboard/keymap";
import type { GroupStat } from "@/lib/stats";

const MASTERY_RAMP = ["#d1fae5", "#6ee7b7", "#10b981", "#047857"];
const NO_DATA = "#e5e5e5";

function masteryColor(stat: GroupStat | undefined): string {
  if (!stat || stat.total === 0) return NO_DATA;
  const acc = stat.accuracy;
  return acc >= 96
    ? MASTERY_RAMP[3]
    : acc >= 90
      ? MASTERY_RAMP[2]
      : acc >= 80
        ? MASTERY_RAMP[1]
        : MASTERY_RAMP[0];
}

const FZ_VAR: Record<Finger, string> = {
  "l-pinky": "var(--fz-l-pinky)",
  "l-ring": "var(--fz-l-ring)",
  "l-middle": "var(--fz-l-middle)",
  "l-index": "var(--fz-l-index)",
  thumb: "var(--fz-thumb)",
  "r-index": "var(--fz-r-index)",
  "r-middle": "var(--fz-r-middle)",
  "r-ring": "var(--fz-r-ring)",
  "r-pinky": "var(--fz-r-pinky)",
};

// finger x/width/height inside a 120×118 hand viewBox (left hand order:
// pinky → index; the right hand mirrors via scale(-1,1))
const FINGER_GEOM = [
  { x: 4, w: 20, h: 40 }, // pinky
  { x: 28, w: 21, h: 56 }, // ring
  { x: 53, w: 21, h: 62 }, // middle
  { x: 78, w: 21, h: 52 }, // index
];

function Hand({
  side,
  colors,
  titles,
}: {
  side: "left" | "right";
  colors: string[]; // [pinky, ring, middle, index, thumb]
  titles: string[]; // same order
}) {
  return (
    <svg viewBox="0 0 132 118" className="w-32 sm:w-36">
      <g transform={side === "right" ? "scale(-1,1) translate(-132,0)" : undefined}>
        {FINGER_GEOM.map((f, i) => (
          <g key={i}>
            <rect
              x={f.x}
              y={66 - f.h}
              width={f.w}
              height={f.h + 14}
              rx={f.w / 2}
              fill={colors[i]}
            >
              <title>{titles[i]}</title>
            </rect>
          </g>
        ))}
        {/* palm */}
        <rect x={4} y={64} width={95} height={50} rx={18} fill="#f0f0ef" />
        {/* thumb */}
        <g transform="rotate(-32 106 84)">
          <rect x={97} y={62} width={19} height={46} rx={9.5} fill={colors[4]}>
            <title>{titles[4]}</title>
          </rect>
        </g>
      </g>
    </svg>
  );
}

export function FingerMastery({
  stats,
  names,
  fmtValue,
}: {
  stats: Partial<Record<Finger, GroupStat>>;
  names: Record<Finger, string>;
  /** e.g. "98% · 24 WPM" — the bar row's value text */
  fmtValue: (stat: GroupStat | undefined) => string;
}) {
  const title = (f: Finger) => `${names[f]} — ${fmtValue(stats[f])}`;

  const leftColors = (["l-pinky", "l-ring", "l-middle", "l-index", "thumb"] as Finger[]).map(
    (f) => masteryColor(stats[f]),
  );
  const rightColors = (["r-pinky", "r-ring", "r-middle", "r-index", "thumb"] as Finger[]).map(
    (f) => masteryColor(stats[f]),
  );
  const leftTitles = (["l-pinky", "l-ring", "l-middle", "l-index", "thumb"] as Finger[]).map(title);
  const rightTitles = (["r-pinky", "r-ring", "r-middle", "r-index", "thumb"] as Finger[]).map(title);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* hands */}
      <div className="flex items-end gap-3 shrink-0">
        <Hand side="left" colors={leftColors} titles={leftTitles} />
        <Hand side="right" colors={rightColors} titles={rightTitles} />
      </div>

      {/* per-finger bars */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
        {FINGER_ORDER.map((f) => {
          const s = stats[f];
          const acc = s && s.total > 0 ? s.accuracy : null;
          return (
            <div key={f} className="flex items-center gap-2.5" title={title(f)}>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: FZ_VAR[f] }}
              />
              <span className="w-28 shrink-0 text-xs text-neutral-500 truncate">
                {names[f]}
              </span>
              <span className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${acc ?? 0}%`,
                    background: masteryColor(s),
                  }}
                />
              </span>
              <span className="w-28 shrink-0 text-right font-mono text-[11px] text-neutral-500">
                {fmtValue(s)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
