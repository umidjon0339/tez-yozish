"use client";

// All-time per-key heatmap over a simplified keyboard layout.
// One sequential ramp per metric (never co-displayed — a toggle switches
// the metric), 4 steps light→dark, values also carried by tooltips and
// the key-detail panel so color is never the only channel.

import React from "react";

export type HeatmapMetric = "errors" | "speed" | "usage" | "confidence";

export interface KeyCellData {
  presses: number;
  errors: number;
  errorRate: number; // 0-1
  keyWpm: number | null;
  confidence: number | null; // 0-100
}

export interface KeyDef {
  id: string; // SVG key id from keymap.ts
  glyph: string;
  wide?: boolean;
}

// Physical layout, top row → space row (modifiers omitted — no letter data)
export const KEY_ROWS: KeyDef[][] = [
  [
    { id: "tilda", glyph: "`" },
    { id: "key-1", glyph: "1" },
    { id: "key-2", glyph: "2" },
    { id: "key-3", glyph: "3" },
    { id: "key-4", glyph: "4" },
    { id: "key-5", glyph: "5" },
    { id: "key-6", glyph: "6" },
    { id: "key-7", glyph: "7" },
    { id: "key-8", glyph: "8" },
    { id: "key-9", glyph: "9" },
    { id: "key-0", glyph: "0" },
    { id: "minus", glyph: "-" },
    { id: "equal", glyph: "=" },
  ],
  [
    { id: "q", glyph: "q" },
    { id: "w", glyph: "w" },
    { id: "e", glyph: "e" },
    { id: "r", glyph: "r" },
    { id: "t", glyph: "t" },
    { id: "y", glyph: "y" },
    { id: "u", glyph: "u" },
    { id: "i", glyph: "i" },
    { id: "o", glyph: "o" },
    { id: "p", glyph: "p" },
    { id: "open-bracket", glyph: "[" },
    { id: "close-bracket", glyph: "]" },
    { id: "backslash", glyph: "\\" },
  ],
  [
    { id: "a", glyph: "a" },
    { id: "s", glyph: "s" },
    { id: "d", glyph: "d" },
    { id: "f", glyph: "f" },
    { id: "g", glyph: "g" },
    { id: "h", glyph: "h" },
    { id: "j", glyph: "j" },
    { id: "k", glyph: "k" },
    { id: "l", glyph: "l" },
    { id: "semicolon", glyph: ";" },
    { id: "quote", glyph: "'" },
  ],
  [
    { id: "z", glyph: "z" },
    { id: "x", glyph: "x" },
    { id: "c", glyph: "c" },
    { id: "v", glyph: "v" },
    { id: "b", glyph: "b" },
    { id: "n", glyph: "n" },
    { id: "m", glyph: "m" },
    { id: "comma", glyph: "," },
    { id: "dot", glyph: "." },
    { id: "slash", glyph: "/" },
  ],
  [{ id: "space", glyph: "␣", wide: true }],
];

const ROW_INDENT = [0, 14, 22, 34, 120];

// Sequential 4-step ramps (light → dark), one hue per metric
const RAMPS: Record<HeatmapMetric, string[]> = {
  errors: ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c"],
  speed: ["#e0f2fe", "#7dd3fc", "#0ea5e9", "#0369a1"],
  usage: ["#e5e5e5", "#a3a3a3", "#525252", "#171717"],
  confidence: ["#d1fae5", "#6ee7b7", "#10b981", "#047857"],
};

// Bucket a key into a ramp step; null = no colored step (empty/clean state)
function bucket(
  metric: HeatmapMetric,
  cell: KeyCellData | undefined,
  maxPresses: number,
): number | null {
  if (!cell || cell.presses + cell.errors === 0) return null;
  switch (metric) {
    case "errors": {
      const r = cell.errorRate;
      if (r <= 0) return null; // clean key — styled separately
      return r >= 0.15 ? 3 : r >= 0.08 ? 2 : r >= 0.04 ? 1 : 0;
    }
    case "speed": {
      const w = cell.keyWpm;
      if (w === null) return null;
      return w >= 40 ? 3 : w >= 30 ? 2 : w >= 20 ? 1 : 0;
    }
    case "usage": {
      const f = maxPresses > 0 ? cell.presses / maxPresses : 0;
      if (cell.presses === 0) return null;
      return f >= 0.6 ? 3 : f >= 0.3 ? 2 : f >= 0.1 ? 1 : 0;
    }
    case "confidence": {
      const c = cell.confidence;
      if (c === null) return null; // not enough presses yet
      return c >= 75 ? 3 : c >= 60 ? 2 : c >= 40 ? 1 : 0;
    }
  }
}

export function KeyboardHeatmap({
  data,
  metric,
  selected,
  onSelect,
  tooltip,
  lowLabel,
  highLabel,
}: {
  data: Map<string, KeyCellData>;
  metric: HeatmapMetric;
  selected: string | null;
  onSelect: (keyId: string | null) => void;
  tooltip: (glyph: string, cell: KeyCellData | undefined) => string;
  lowLabel: string;
  highLabel: string;
}) {
  const ramp = RAMPS[metric];
  const maxPresses = Math.max(1, ...[...data.values()].map((c) => c.presses));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-1.5 overflow-x-auto max-w-full py-1">
        {KEY_ROWS.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-1.5"
            style={{ marginLeft: ROW_INDENT[ri] }}
          >
            {row.map((k) => {
              const cell = data.get(k.id);
              const step = bucket(metric, cell, maxPresses);
              const hasData = !!cell && cell.presses + cell.errors > 0;
              const isSelected = selected === k.id;

              let style: React.CSSProperties = {};
              let cls =
                "bg-neutral-100 text-neutral-300 border border-transparent";
              if (step !== null) {
                style = { background: ramp[step] };
                cls =
                  step >= 2
                    ? "text-white border border-transparent"
                    : "text-neutral-800 border border-transparent";
              } else if (hasData) {
                // has data but no colored step (e.g. zero errors → clean)
                cls =
                  metric === "errors"
                    ? "bg-white text-emerald-600 border border-neutral-200"
                    : "bg-white text-neutral-400 border border-neutral-200";
              }

              return (
                <button
                  key={k.id}
                  type="button"
                  title={tooltip(k.glyph, cell)}
                  onClick={() => onSelect(isSelected ? null : k.id)}
                  className={`${k.wide ? "w-56" : "w-8 sm:w-9"} h-8 sm:h-9 shrink-0 rounded-md font-mono text-[11px] font-bold uppercase flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${cls} ${
                    isSelected
                      ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white"
                      : ""
                  }`}
                  style={style}
                >
                  {k.glyph}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ramp legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
        <span>{lowLabel}</span>
        {ramp.map((c) => (
          <span key={c} className="w-4 h-2.5 rounded-sm" style={{ background: c }} />
        ))}
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
