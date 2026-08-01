"use client";

// Single-series SVG line chart, no dependencies.
// Dataviz specs: 2px round-join line, ~8% area wash, hairline solid
// gridlines, ≥8px markers with a surface ring, crosshair + tooltip on
// hover, no legend (the card title names the series).

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";

export interface LinePoint {
  label: string; // tooltip label (e.g. formatted date)
  short: string; // compact x-axis label
  value: number | null; // null = no data that day (gap)
}

const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 22;

function niceMax(v: number): number {
  if (v <= 10) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (v <= m * pow) return m * pow;
  }
  return 10 * pow;
}

export function LineChart({
  data,
  color = "var(--chart-ink)",
  height = 200,
  unit = "",
  domain,
  emptyText,
}: {
  data: LinePoint[];
  color?: string;
  height?: number;
  unit?: string;
  domain?: [number, number | "auto"];
  emptyText: string;
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

  const pts = useMemo(
    () =>
      data
        .map((d, i) => ({ ...d, i }))
        .filter((d): d is LinePoint & { i: number; value: number } => d.value !== null),
    [data],
  );

  const [yMin, yMax] = useMemo((): [number, number] => {
    if (pts.length === 0) return [0, 10];
    const values = pts.map((p) => p.value);
    const lo = domain ? domain[0] : 0;
    const hiRaw = domain && domain[1] !== "auto" ? (domain[1] as number) : null;
    const hi = hiRaw ?? niceMax(Math.max(...values) * 1.05);
    return [lo, Math.max(hi, lo + 1)];
  }, [pts, domain]);

  const innerW = Math.max(40, width - PAD_L - PAD_R);
  const innerH = height - PAD_T - PAD_B;
  const n = data.length;
  const x = useCallback(
    (i: number) => PAD_L + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    [n, innerW],
  );
  const y = useCallback(
    (v: number) => PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH,
    [innerH, yMin, yMax],
  );

  const ticks = useMemo(() => {
    const step = (yMax - yMin) / 3;
    return [0, 1, 2, 3].map((k) => Math.round(yMin + step * k));
  }, [yMin, yMax]);

  // Line + area paths over the non-null points (gaps are bridged)
  const linePath = useMemo(
    () => pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" "),
    [pts, x, y],
  );
  const areaPath = useMemo(() => {
    if (pts.length < 2) return "";
    const base = (PAD_T + innerH).toFixed(1);
    return `${linePath} L${x(pts[pts.length - 1].i).toFixed(1)},${base} L${x(pts[0].i).toFixed(1)},${base} Z`;
  }, [linePath, pts, x, innerH]);

  // X-axis: first / middle / last labels of the range
  const xLabels = useMemo(() => {
    if (n === 0) return [];
    const idxs = n <= 2 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1];
    return [...new Set(idxs)].map((i) => ({ i, text: data[i].short }));
  }, [n, data]);

  const onMove = (e: React.PointerEvent) => {
    if (pts.length === 0) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    let best = pts[0];
    let bestDist = Infinity;
    for (const p of pts) {
      const d = Math.abs(x(p.i) - px);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    setHover(best.i);
  };

  const hovered = hover !== null ? data[hover] : null;
  const showDots = pts.length <= 32;

  if (pts.length < 2) {
    return (
      <div
        ref={wrapRef}
        className="flex items-center justify-center text-sm text-neutral-400 dark:text-neutral-500"
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative select-none">
      <svg
        width={width}
        height={height}
        className="block"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* gridlines + y ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={PAD_L + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 6}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-neutral-400 font-mono"
              fontSize={10}
            >
              {t}
            </text>
          </g>
        ))}
        {/* x labels */}
        {xLabels.map((l) => (
          <text
            key={l.i}
            x={x(l.i)}
            y={height - 6}
            textAnchor={l.i === 0 ? "start" : l.i === n - 1 ? "end" : "middle"}
            className="fill-neutral-400 font-mono"
            fontSize={10}
          >
            {l.text}
          </text>
        ))}
        {/* area wash + line */}
        <path d={areaPath} fill={color} fillOpacity={0.07} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* markers (surface ring via stroke) */}
        {showDots &&
          pts.map((p) => (
            <circle
              key={p.i}
              cx={x(p.i)}
              cy={y(p.value)}
              r={3.5}
              fill={color}
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          ))}
        {/* crosshair + hovered marker */}
        {hovered && hovered.value !== null && (
          <g pointerEvents="none">
            <line
              x1={x(hover as number)}
              x2={x(hover as number)}
              y1={PAD_T}
              y2={PAD_T + innerH}
              stroke="var(--chart-muted)"
              strokeWidth={1}
            />
            <circle
              cx={x(hover as number)}
              cy={y(hovered.value)}
              r={4.5}
              fill={color}
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
      {/* tooltip */}
      {hovered && hovered.value !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 shadow-sm"
          style={{
            left: Math.min(Math.max(x(hover as number), 50), width - 50),
            top: Math.max(0, y(hovered.value) - 44),
          }}
        >
          <div className="whitespace-nowrap text-[10px] text-neutral-400 dark:text-neutral-500">
            {hovered.label}
          </div>
          <div className="whitespace-nowrap font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
            {Math.round(hovered.value)}
            {unit}
          </div>
        </div>
      )}
    </div>
  );
}
