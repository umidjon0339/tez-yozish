"use client";

// Single-series SVG histogram over fixed-width buckets, no dependencies.
// Dataviz specs, same idiom as LineChart: thin bars with a 2px surface
// gap and 4px rounded data-ends (baseline kept flat via clipPath),
// hairline gridlines, per-bar hover tooltip, no legend (single series —
// the card title names it). The mass below the optional marker is a
// darker step of the same neutral ramp: lightness-only emphasis, so it
// survives every CVD type and print.

import React, { useEffect, useMemo, useRef, useState } from "react";

export interface HistBucket {
  lo: number; // bucket start (inclusive); width = bucketSize
  count: number;
}

const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 26; // room for the marker pill
const PAD_B = 22;

const BAR_REST = "var(--chart-muted)"; // neutral-300
const BAR_BELOW = "var(--chart-muted-2)"; // neutral-400 — mass slower than the marker
const BAR_HOVER = "var(--chart-muted-3)"; // neutral-500
const INK = "var(--chart-ink)";

export function Histogram({
  buckets,
  bucketSize,
  markerValue,
  markerLabel,
  countWord,
  unit,
  height = 190,
}: {
  buckets: HistBucket[];
  bucketSize: number;
  markerValue?: number | null;
  markerLabel: string;
  countWord: string; // tooltip noun, e.g. "tests"
  unit: string; // x-axis unit, e.g. "WPM"
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const sorted = useMemo(
    () => [...buckets].sort((a, b) => a.lo - b.lo),
    [buckets],
  );
  const total = useMemo(
    () => sorted.reduce((a, b) => a + b.count, 0),
    [sorted],
  );
  const domainMax = sorted.length
    ? sorted[sorted.length - 1].lo + bucketSize
    : bucketSize;
  const maxShare = useMemo(
    () =>
      total > 0 ? Math.max(...sorted.map((b) => b.count / total), 0.01) : 0.01,
    [sorted, total],
  );

  const innerW = Math.max(40, width - PAD_L - PAD_R);
  const innerH = height - PAD_T - PAD_B;
  const x = (v: number) => PAD_L + (v / domainMax) * innerW;
  const y = (share: number) => PAD_T + innerH - (share / (maxShare * 1.08)) * innerH;
  const barW = Math.max(2, (bucketSize / domainMax) * innerW - 2);

  const yTicks = useMemo(() => {
    const top = maxShare;
    return [top / 2, top].map((s) => ({
      share: s,
      label: `${Math.round(s * 100)}%`,
    }));
  }, [maxShare]);

  const xTicks = useMemo(() => {
    const step = domainMax > 300 ? 100 : 50;
    const out: number[] = [];
    for (let v = 0; v <= domainMax; v += step) out.push(v);
    return out;
  }, [domainMax]);

  const marker =
    markerValue != null && markerValue > 0
      ? Math.min(markerValue, domainMax)
      : null;

  const onMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || sorted.length === 0) return;
    const v = ((e.clientX - rect.left - PAD_L) / innerW) * domainMax;
    const idx = sorted.findIndex((b) => v >= b.lo && v < b.lo + bucketSize);
    setHover(idx >= 0 ? idx : null);
  };

  const hovered = hover !== null ? sorted[hover] : null;

  if (sorted.length === 0 || total === 0) return null;

  return (
    <div ref={wrapRef} className="relative select-none">
      <svg
        width={width}
        height={height}
        className="block"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          {/* keeps the rounded bar tops while the baseline stays flat */}
          <clipPath id="hist-plot">
            <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} />
          </clipPath>
        </defs>
        {/* gridlines + y ticks (share of tests) */}
        {yTicks.map((t) => (
          <g key={t.label}>
            <line
              x1={PAD_L}
              x2={PAD_L + innerW}
              y1={y(t.share)}
              y2={y(t.share)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(t.share) + 3.5}
              textAnchor="end"
              className="fill-neutral-400 font-mono"
              fontSize={10}
            >
              {t.label}
            </text>
          </g>
        ))}
        {/* x ticks */}
        {xTicks.map((v) => (
          <text
            key={v}
            x={x(v)}
            y={height - 6}
            textAnchor={v === 0 ? "start" : "middle"}
            className="fill-neutral-400 font-mono"
            fontSize={10}
          >
            {v}
          </text>
        ))}
        {/* bars */}
        <g clipPath="url(#hist-plot)">
          {sorted.map((b, i) => {
            const share = b.count / total;
            const top = y(share);
            const isBelow = marker !== null && b.lo + bucketSize <= marker;
            const fill =
              hover === i ? BAR_HOVER : isBelow ? BAR_BELOW : BAR_REST;
            return (
              <rect
                key={b.lo}
                x={x(b.lo) + 1}
                y={top}
                width={barW}
                height={PAD_T + innerH - top + 6}
                rx={4}
                fill={fill}
              />
            );
          })}
        </g>
        {/* "you" marker */}
        {marker !== null && (
          <line
            x1={x(marker)}
            x2={x(marker)}
            y1={PAD_T - 4}
            y2={PAD_T + innerH}
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
            pointerEvents="none"
          />
        )}
      </svg>
      {/* marker pill (HTML for crisp text) */}
      {marker !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-full bg-neutral-950 dark:bg-white px-2 py-0.5 text-[10px] font-semibold text-white dark:text-neutral-950 whitespace-nowrap"
          style={{
            left: Math.min(Math.max(x(marker), 30), width - 30),
            top: 2,
          }}
        >
          {markerLabel} · {Math.round(markerValue as number)}
        </div>
      )}
      {/* tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 shadow-sm"
          style={{
            left: Math.min(
              Math.max(x(hovered.lo + bucketSize / 2), 60),
              width - 60,
            ),
            top: Math.max(0, y(hovered.count / total) - 46),
          }}
        >
          <div className="whitespace-nowrap text-[10px] text-neutral-400 dark:text-neutral-500">
            {hovered.lo}–{hovered.lo + bucketSize - 1} {unit}
          </div>
          <div className="whitespace-nowrap font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {((hovered.count / total) * 100).toFixed(1)}%{" "}
            <span className="font-sans font-normal text-neutral-400 dark:text-neutral-500">
              · {hovered.count.toLocaleString()} {countWord}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
