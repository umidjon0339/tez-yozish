"use client";

// Interactive reference charts for /english/phonemes: the IPA vowel
// trapezoid (SVG, with the classic colored i/u/e/o/a-base zones) and the
// consonant place × manner table. Both are built from lib/phonemes.ts and
// react to the page's UK/US accent switch — sounds of the other accent stay
// visible but dimmed (hover restores them). Every sound links into its
// lesson hub (/english/phonemes/[slug]).
// Axis / place / manner labels are chart-only vocabulary, so they live in a
// local dict here (same idiom as the lesson runtime's UI dict).

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, type Locale } from "@/lib/locale";
import { PHONEME_BY_SLUG, inAccent, type Accent } from "@/lib/phonemes";

type Str = Record<Locale, string>;

const CHART_STR: Record<string, Str> = {
  front: { en: "Front", uz: "Old", ru: "Передний" },
  central: { en: "Central", uz: "O'rta", ru: "Средний" },
  back: { en: "Back", uz: "Orqa", ru: "Задний" },
  close: { en: "Close", uz: "Yopiq", ru: "Закрытый" },
  mid: { en: "Mid", uz: "O'rta", ru: "Средний" },
  open: { en: "Open", uz: "Ochiq", ru: "Открытый" },
};

/* ── Vowel chart (SVG trapezoid) ─────────────────────────────────────── */

// fx: 0 = front of the mouth, 1 = back. fy: 0 = tongue high, 1 = low.
const VOWEL_NODES: { slug: string; fx: number; fy: number }[] = [
  { slug: "ee", fx: 0.02, fy: 0.02 },
  { slug: "ih", fx: 0.22, fy: 0.18 },
  { slug: "e", fx: 0.15, fy: 0.45 },
  { slug: "a", fx: 0.1, fy: 0.88 },
  { slug: "schwa", fx: 0.48, fy: 0.35 },
  { slug: "schwa-r", fx: 0.7, fy: 0.35 }, // US
  { slug: "er", fx: 0.5, fy: 0.62 }, // UK
  { slug: "er-us", fx: 0.5, fy: 0.62 }, // US
  { slug: "uh", fx: 0.75, fy: 0.62 },
  { slug: "ar", fx: 0.78, fy: 0.92 },
  { slug: "o", fx: 1, fy: 0.92 }, // UK
  { slug: "aw", fx: 0.96, fy: 0.55 },
  { slug: "u", fx: 0.75, fy: 0.15 },
  { slug: "oo", fx: 0.97, fy: 0.02 },
];

// The classic colored vowel families (i/u/e/o/a-base) as bands inside the
// trapezoid. Nodes pick their colors from the zone that contains them; the
// "-base" labels are IPA notation and stay untranslated.
const ZONES = [
  {
    base: "i-base",
    fx: [0, 0.54],
    fy: [0, 0.29],
    label: [0.4, 0.13],
    region: "fill-sky-300/80",
    stroke: "stroke-sky-500",
    text: "fill-sky-900",
  },
  {
    base: "u-base",
    fx: [0.57, 1],
    fy: [0, 0.29],
    label: [0.68, 0.06],
    region: "fill-violet-300/80",
    stroke: "stroke-violet-500",
    text: "fill-violet-900",
  },
  {
    base: "e-base",
    fx: [0, 0.54],
    fy: [0.32, 0.7],
    label: [0.24, 0.6],
    region: "fill-emerald-300/80",
    stroke: "stroke-emerald-600",
    text: "fill-emerald-900",
  },
  {
    base: "o-base",
    fx: [0.57, 1],
    fy: [0.32, 0.7],
    label: [0.78, 0.47],
    region: "fill-amber-300/80",
    stroke: "stroke-amber-600",
    text: "fill-amber-900",
  },
  {
    base: "a-base",
    fx: [0, 1],
    fy: [0.73, 1],
    label: [0.45, 0.87],
    region: "fill-rose-300/80",
    stroke: "stroke-rose-500",
    text: "fill-rose-900",
  },
] as const;

// Trapezoid geometry: top edge y=50 (close), bottom y=270 (open); the left
// edge slants from x=120 (front-close) to x=250 (front-open), right x=460.
const TOP = 50;
const BOTTOM = 270;
const RIGHT = 460;
const yOf = (fy: number) => TOP + fy * (BOTTOM - TOP);
const leftEdge = (fy: number) => 120 + fy * (250 - 120);
const xOf = (fx: number, fy: number) =>
  leftEdge(fy) + fx * (RIGHT - leftEdge(fy));

const zoneOf = (fx: number, fy: number) =>
  ZONES.find(
    (z) => fx >= z.fx[0] && fx <= z.fx[1] && fy >= z.fy[0] && fy <= z.fy[1],
  ) ?? ZONES[0];

const zonePoints = (z: (typeof ZONES)[number]) =>
  [
    [xOf(z.fx[0], z.fy[0]), yOf(z.fy[0])],
    [xOf(z.fx[1], z.fy[0]), yOf(z.fy[0])],
    [xOf(z.fx[1], z.fy[1]), yOf(z.fy[1])],
    [xOf(z.fx[0], z.fy[1]), yOf(z.fy[1])],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

const TOP_LABELS: { key: string; fx: number }[] = [
  { key: "front", fx: 0 },
  { key: "central", fx: 0.5 },
  { key: "back", fx: 1 },
];

const LEFT_LABELS: { key: string; fy: number }[] = [
  { key: "close", fy: 0 },
  { key: "mid", fy: 0.5 },
  { key: "open", fy: 1 },
];

export function VowelChart({ accent }: { accent: Accent }) {
  const { locale } = useLocale();
  const router = useRouter();

  return (
    <svg viewBox="0 0 530 300" className="w-full max-w-xl mx-auto" role="group">
      {/* colored base zones */}
      {ZONES.map((z) => (
        <polygon key={z.base} points={zonePoints(z)} className={z.region} />
      ))}
      {ZONES.map((z) => (
        <text
          key={z.base}
          x={xOf(z.label[0], z.label[1])}
          y={yOf(z.label[1])}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fillOpacity={0.9}
          className="fill-white font-bold select-none pointer-events-none"
        >
          {z.base}
        </text>
      ))}

      {/* frame */}
      <path
        d={`M120,${TOP} L${RIGHT},${TOP} L${RIGHT},${BOTTOM} L250,${BOTTOM} Z`}
        className="fill-none stroke-neutral-300"
      />

      {/* axis labels */}
      {TOP_LABELS.map((l) => (
        <text
          key={l.key}
          x={xOf(l.fx, 0)}
          y={32}
          textAnchor="middle"
          fontSize={11}
          className="fill-neutral-400 font-medium"
        >
          {CHART_STR[l.key][locale]}
        </text>
      ))}
      {LEFT_LABELS.map((l) => (
        <text
          key={l.key}
          x={leftEdge(l.fy) - 12}
          y={yOf(l.fy) + 4}
          textAnchor="end"
          fontSize={11}
          className="fill-neutral-400 font-medium"
        >
          {CHART_STR[l.key][locale]}
        </text>
      ))}

      {/* clickable vowels — the other accent's sounds stay, dimmed */}
      {VOWEL_NODES.map((n) => {
        const p = PHONEME_BY_SLUG[n.slug];
        const zone = zoneOf(n.fx, n.fy);
        const active = inAccent(p, accent);
        const cx = xOf(n.fx, n.fy);
        const cy = yOf(n.fy);
        const href = `/english/phonemes/${p.slug}`;
        return (
          <g
            key={p.slug}
            role="link"
            tabIndex={0}
            aria-label={`${p.symbol} — ${p.examples[0].word}`}
            onClick={() => router.push(href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }}
            className={[
              "cursor-pointer group focus:outline-none transition-all",
              active ? "" : "opacity-30 blur-[1px] hover:opacity-100 hover:blur-none",
            ].join(" ")}
          >
            <title>{`${p.symbol} — ${p.examples[0].word}`}</title>
            <circle
              cx={cx}
              cy={cy}
              r={17}
              strokeWidth={2}
              className={`fill-white transition-colors ${zone.stroke} group-hover:stroke-neutral-950 group-focus-visible:stroke-neutral-950`}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              className={`font-mono font-bold select-none ${zone.text}`}
            >
              {p.symbol}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Diphthong chart (glide arrows on the trapezoid) ─────────────────── */

// Each double vowel is an arrow from its start position to the sound it
// glides into. Colors follow the classic diagram (eɪ sea green, aɪ bright
// green, ɔɪ turquoise, aʊ brown, oʊ/əʊ yellow); the UK centering glides
// (ɪə, eə, ʊə) get their own colors. `label` is the symbol's px offset
// from the start dot.
const DIPHTHONGS: {
  slug: string;
  color: string;
  from: [number, number];
  to: [number, number];
  label: [number, number];
}[] = [
  { slug: "ay", color: "#0E9F6E", from: [0.15, 0.45], to: [0.22, 0.18], label: [-32, 0] },
  { slug: "eye", color: "#1FC819", from: [0.38, 0.95], to: [0.22, 0.18], label: [-32, 10] },
  { slug: "oy", color: "#20C4C4", from: [0.96, 0.55], to: [0.22, 0.18], label: [20, 8] },
  { slug: "ow", color: "#4B2E10", from: [0.52, 0.95], to: [0.75, 0.15], label: [18, 8] },
  { slug: "oh-us", color: "#C9B411", from: [0.95, 0.42], to: [0.75, 0.15], label: [20, 10] }, // US
  { slug: "oh-uk", color: "#C9B411", from: [0.55, 0.5], to: [0.75, 0.15], label: [0, 26] }, // UK
  { slug: "eer", color: "#E05297", from: [0.3, 0.1], to: [0.48, 0.35], label: [-6, -18] }, // UK
  { slug: "air", color: "#F97316", from: [0.08, 0.58], to: [0.48, 0.35], label: [-30, 4] }, // UK
  { slug: "oor", color: "#8B5CF6", from: [0.85, 0.05], to: [0.48, 0.35], label: [22, 0] }, // UK
];

// The small gray dots the arrows point at.
const DIP_TARGETS: { symbol: string; fx: number; fy: number }[] = [
  { symbol: "ɪ", fx: 0.22, fy: 0.18 },
  { symbol: "ʊ", fx: 0.75, fy: 0.15 },
  { symbol: "ə", fx: 0.48, fy: 0.35 },
];

export function DiphthongChart({ accent }: { accent: Accent }) {
  const router = useRouter();

  return (
    <svg viewBox="0 0 530 300" className="w-full max-w-xl mx-auto" role="group">
      <defs>
        {DIPHTHONGS.map((d) => (
          <marker
            key={d.slug}
            id={`dip-${d.slug}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4.2"
            markerHeight="4.2"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={d.color} />
          </marker>
        ))}
      </defs>

      {/* frame + faint guides */}
      <path
        d={`M120,${TOP} L${RIGHT},${TOP} L${RIGHT},${BOTTOM} L250,${BOTTOM} Z`}
        className="fill-neutral-50 stroke-neutral-200"
      />
      <line
        x1={leftEdge(0.5)}
        y1={yOf(0.5)}
        x2={RIGHT}
        y2={yOf(0.5)}
        className="stroke-neutral-200"
      />
      <line x1={290} y1={TOP} x2={355} y2={BOTTOM} className="stroke-neutral-200" />

      {/* glide arrows — one clickable group per double vowel */}
      {DIPHTHONGS.map((d) => {
        const p = PHONEME_BY_SLUG[d.slug];
        const active = inAccent(p, accent);
        const x1 = xOf(d.from[0], d.from[1]);
        const y1 = yOf(d.from[1]);
        const x2 = xOf(d.to[0], d.to[1]);
        const y2 = yOf(d.to[1]);
        // Shorten the line so the arrowhead stops before the target dot.
        const len = Math.hypot(x2 - x1, y2 - y1);
        const ux = (x2 - x1) / len;
        const uy = (y2 - y1) / len;
        const href = `/english/phonemes/${p.slug}`;
        return (
          <g
            key={p.slug}
            role="link"
            tabIndex={0}
            aria-label={`${p.symbol} — ${p.examples[0].word}`}
            onClick={() => router.push(href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }}
            className={[
              "cursor-pointer group focus:outline-none transition-all",
              active ? "" : "opacity-25 blur-[1px] hover:opacity-100 hover:blur-none",
            ].join(" ")}
          >
            <title>{`${p.symbol} — ${p.examples[0].word}`}</title>
            <line
              x1={x1 + ux * 9}
              y1={y1 + uy * 9}
              x2={x2 - ux * 16}
              y2={y2 - uy * 16}
              stroke={d.color}
              strokeWidth={3}
              strokeLinecap="round"
              markerEnd={`url(#dip-${d.slug})`}
              className="transition-all group-hover:stroke-5"
            />
            <circle cx={x1} cy={y1} r={9} fill={d.color} />
            <text
              x={x1 + d.label[0]}
              y={y1 + d.label[1]}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={16}
              fill={d.color}
              className="font-mono font-bold select-none"
            >
              {p.symbol}
            </text>
          </g>
        );
      })}

      {/* target dots on top, so converging arrowheads stay readable */}
      {DIP_TARGETS.map((t) => (
        <g key={t.symbol} className="pointer-events-none">
          <circle
            cx={xOf(t.fx, t.fy)}
            cy={yOf(t.fy)}
            r={5}
            className="fill-neutral-400"
          />
          <text
            x={xOf(t.fx, t.fy)}
            y={yOf(t.fy) - 14}
            textAnchor="middle"
            fontSize={12}
            className="fill-neutral-500 font-mono font-bold select-none"
          >
            {t.symbol}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Consonant chart (place × manner table) ──────────────────────────── */

const PLACES = [
  "lips",
  "lipTeeth",
  "teeth",
  "ridge",
  "ridgeBack",
  "palate",
  "soft",
  "throat",
] as const;
type Place = (typeof PLACES)[number];

const PLACE_STR: Record<Place, Str> = {
  lips: { en: "Lips", uz: "Lablar", ru: "Губы" },
  lipTeeth: { en: "Lip + teeth", uz: "Lab + tish", ru: "Губа + зубы" },
  teeth: { en: "Teeth", uz: "Tishlar", ru: "Зубы" },
  ridge: { en: "Behind teeth", uz: "Tish orqasi", ru: "За зубами" },
  ridgeBack: { en: "Behind ridge", uz: "Milk orqasi", ru: "За бугорком" },
  palate: { en: "Palate", uz: "Tanglay", ru: "Нёбо" },
  soft: { en: "Soft palate", uz: "Yumshoq tanglay", ru: "Мягкое нёбо" },
  throat: { en: "Throat", uz: "Bo'g'iz", ru: "Горло" },
};

// Column colors follow the classic SIL chart: bilabial green, dental blue,
// alveolar red, post-alveolar yellow, palatal peach, velar light green,
// glottal yellow (labiodental stays white there too).
const PLACE_COLORS: Record<Place, string> = {
  lips: "#C7EAC0",
  lipTeeth: "#FFFFFF",
  teeth: "#CBE6F8",
  ridge: "#F1837B",
  ridgeBack: "#F5EE9B",
  palate: "#F8D8AE",
  soft: "#D9F0C6",
  throat: "#F9F3A6",
};

// Anatomical names for the mouth picture (the table columns reuse
// PLACE_STR; these are the extra organ labels the picture needs).
const MOUTH_STR: Record<string, Str> = {
  ridge: { en: "Alveolar ridge", uz: "Milk", ru: "Альвеолы" },
  uvula: { en: "Uvula", uz: "Kichik til", ru: "Язычок" },
  pharynx: { en: "Pharynx", uz: "Halqum", ru: "Глотка" },
  glottis: { en: "Glottis", uz: "Bo'g'iz", ru: "Голосовая щель" },
};

// The side-view mouth picture above the table: a gray roof arch with each
// articulator as a colored blob (same colors as its table column) plus a
// labeled pointer line. Decorative — the table below is the interactive part.
const MOUTH_PARTS: {
  label: Str;
  color: string;
  blob: { cx: number; cy: number; rx: number; ry: number; rotate?: number };
  text: { x: number; y: number; anchor: "start" | "middle" | "end" };
  line?: [number, number, number, number];
}[] = [
  {
    label: PLACE_STR.lips,
    color: PLACE_COLORS.lips,
    blob: { cx: 148, cy: 272, rx: 24, ry: 30 },
    text: { x: 88, y: 250, anchor: "end" },
    line: [94, 253, 126, 262],
  },
  {
    label: PLACE_STR.teeth,
    color: PLACE_COLORS.teeth,
    blob: { cx: 200, cy: 200, rx: 16, ry: 22, rotate: -35 },
    text: { x: 108, y: 170, anchor: "end" },
    line: [114, 173, 184, 192],
  },
  {
    label: MOUTH_STR.ridge,
    color: PLACE_COLORS.ridge,
    blob: { cx: 268, cy: 112, rx: 20, ry: 15, rotate: -30 },
    text: { x: 196, y: 42, anchor: "middle" },
    line: [212, 52, 256, 100],
  },
  {
    label: PLACE_STR.palate,
    color: PLACE_COLORS.palate,
    blob: { cx: 430, cy: 68, rx: 30, ry: 15 },
    text: { x: 430, y: 26, anchor: "middle" },
    line: [430, 34, 430, 52],
  },
  {
    label: PLACE_STR.soft, // velum
    color: PLACE_COLORS.soft,
    blob: { cx: 596, cy: 80, rx: 28, ry: 15 },
    text: { x: 648, y: 30, anchor: "middle" },
    line: [630, 40, 606, 66],
  },
  {
    label: MOUTH_STR.uvula,
    color: "#9CC7F2",
    blob: { cx: 726, cy: 208, rx: 13, ry: 24 },
    text: { x: 812, y: 150, anchor: "middle" },
    line: [788, 158, 740, 192],
  },
  {
    label: MOUTH_STR.pharynx,
    color: "#F5A8C6",
    blob: { cx: 838, cy: 268, rx: 52, ry: 34 },
    text: { x: 838, y: 272, anchor: "middle" },
  },
  {
    label: MOUTH_STR.glottis,
    color: PLACE_COLORS.throat,
    blob: { cx: 922, cy: 128, rx: 34, ry: 30 },
    text: { x: 922, y: 62, anchor: "middle" },
    line: [922, 70, 922, 96],
  },
];

function MouthDiagram({ locale }: { locale: Locale }) {
  return (
    <svg
      viewBox="0 0 1000 330"
      className="w-full max-w-2xl mx-auto"
      aria-hidden
    >
      {/* roof of the mouth, lips (front-left) to uvula (back-right) */}
      <path
        d="M150,270 C190,130 400,55 580,72 C710,85 745,150 738,235"
        fill="none"
        stroke="#E7E7E7"
        strokeWidth={44}
        strokeLinecap="round"
      />

      {MOUTH_PARTS.map((part) => (
        <g key={part.label.en} className="pointer-events-none">
          <ellipse
            cx={part.blob.cx}
            cy={part.blob.cy}
            rx={part.blob.rx}
            ry={part.blob.ry}
            fill={part.color}
            className="stroke-neutral-300"
            transform={
              part.blob.rotate
                ? `rotate(${part.blob.rotate} ${part.blob.cx} ${part.blob.cy})`
                : undefined
            }
          />
          {part.line && (
            <line
              x1={part.line[0]}
              y1={part.line[1]}
              x2={part.line[2]}
              y2={part.line[3]}
              className="stroke-neutral-400"
            />
          )}
          <text
            x={part.text.x}
            y={part.text.y}
            textAnchor={part.text.anchor}
            fontSize={14}
            className="fill-neutral-600 font-medium select-none"
          >
            {part.label[locale]}
          </text>
        </g>
      ))}

      {/* the vocal folds inside the glottis circle */}
      <path
        d="M898,128 Q922,110 946,128 Q922,146 898,128 Z"
        fill="white"
        className="stroke-neutral-500"
      />
    </svg>
  );
}

// [voiceless slug, voiced slug] per cell — IPA convention, voiceless left.
type Cell = [string | null, string | null];

const CONSONANT_ROWS: {
  label: Str;
  region?: Accent;
  cells: Partial<Record<Place, Cell>>;
}[] = [
  {
    label: { en: "Stop", uz: "Portlovchi", ru: "Взрывной" },
    cells: { lips: ["p", "b"], ridge: ["t", "d"], soft: ["k", "g"] },
  },
  {
    label: { en: "Flap", uz: "Tez t", ru: "Быстрый t" },
    region: "us",
    cells: { ridge: [null, "tt"] },
  },
  {
    label: { en: "Nasal", uz: "Burun", ru: "Носовой" },
    cells: { lips: [null, "m"], ridge: [null, "n"], soft: [null, "ng"] },
  },
  {
    label: { en: "Fricative", uz: "Sirg'aluvchi", ru: "Щелевой" },
    cells: {
      lipTeeth: ["f", "v"],
      teeth: ["th", "dh"],
      ridge: ["s", "z"],
      ridgeBack: ["sh", "zh"],
      throat: ["h", null],
    },
  },
  {
    label: { en: "Affricate", uz: "Qorishiq", ru: "Аффриката" },
    cells: { ridgeBack: ["ch", "j"] },
  },
  {
    label: { en: "Glide", uz: "Sonor", ru: "Плавный" },
    cells: { lips: [null, "w"], ridgeBack: [null, "r"], palate: [null, "y"] },
  },
  {
    label: { en: "Lateral", uz: "Yon tovush", ru: "Боковой" },
    cells: { ridge: [null, "l"] },
  },
];

function ConsonantButton({ slug, dim }: { slug: string; dim: boolean }) {
  const p = PHONEME_BY_SLUG[slug];
  return (
    <Link
      href={`/english/phonemes/${p.slug}`}
      title={`${p.symbol} — ${p.examples[0].word}`}
      className={[
        "inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 bg-white font-mono text-sm font-bold text-neutral-900 transition-all hover:border-neutral-950 hover:ring-1 hover:ring-neutral-950 hover:shadow-sm",
        dim ? "opacity-35 blur-[1px] hover:opacity-100 hover:blur-none" : "",
      ].join(" ")}
    >
      {p.symbol}
    </Link>
  );
}

export function ConsonantChart({ accent }: { accent: Accent }) {
  const { locale } = useLocale();

  return (
    <div>
      <MouthDiagram locale={locale} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-center">
          <thead>
            <tr>
              <th />
              {PLACES.map((place) => (
                <th
                  key={place}
                  style={{ backgroundColor: PLACE_COLORS[place] }}
                  className="px-1.5 py-2 text-[11px] font-semibold text-neutral-700 border border-neutral-200"
                >
                  {PLACE_STR[place][locale]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONSONANT_ROWS.map((row) => {
              const dim = !!row.region && row.region !== accent;
              return (
                <tr key={row.label.en}>
                  <td
                    className={`pr-3 py-1.5 text-left text-[11px] font-medium whitespace-nowrap ${
                      dim ? "text-neutral-300" : "text-neutral-500"
                    }`}
                  >
                    {row.label[locale]}
                  </td>
                  {PLACES.map((place) => {
                    const cell = row.cells[place];
                    return (
                      <td
                        key={place}
                        style={{ backgroundColor: `${PLACE_COLORS[place]}99` }}
                        className="p-1 border border-neutral-200"
                      >
                        {cell && (
                          <span className="inline-flex items-center justify-center gap-1">
                            {cell[0] && <ConsonantButton slug={cell[0]} dim={dim} />}
                            {cell[1] && <ConsonantButton slug={cell[1]} dim={dim} />}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
