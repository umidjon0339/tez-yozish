"use client";

// Presentational helpers for the /english units page, split out of page.tsx.
// Each takes its data via props (locale is a `keyof L3`). No page state here.
import React from "react";
import { ArrowRight } from "lucide-react";
import { ALLOPHONES } from "@/lib/phonemes";
import {
  Tint,
  Tile,
  GraphemeTile,
  Mapping,
  L3,
  PosNode,
} from "./_data";

export function PosTree({
  nodes,
  locale,
}: {
  nodes: PosNode[];
  locale: keyof L3;
}) {
  return (
    <div className="flex flex-col gap-1">
      {nodes.map((n) => (
        <div key={n.t.en}>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
              {n.t[locale]}
            </span>
            {n.leaves?.map((l) => (
              <span
                key={l.en}
                className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
              >
                {l[locale]}
              </span>
            ))}
          </div>
          {n.kids && (
            <div className="mt-1 ml-1 border-l border-neutral-200 dark:border-neutral-800 pl-2">
              <PosTree nodes={n.kids} locale={locale} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function GroupLabel({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        "text-[11px] uppercase tracking-wider font-medium",
        strong ? "text-neutral-600 dark:text-neutral-400 font-semibold" : "text-neutral-400 dark:text-neutral-500",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function TileGrid({ symbols }: { symbols: (string | Tile)[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {symbols.map((item) => {
        const s = typeof item === "string" ? item : item.s;
        const r = typeof item === "string" ? "plain" : item.r;
        return (
          <Piece key={s} tint={r}>
            {s}
          </Piece>
        );
      })}
    </div>
  );
}

/* Like TileGrid, but for IPA phonemes: each tile stacks the phoneme symbol
   over its allophones in [ ] (data in lib/phonemes.ts). Hovering an
   allophone shows an example word carrying that variant. */
export function IpaTileGrid({ symbols }: { symbols: Tile[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {symbols.map(({ s, r }) => {
        const allos = ALLOPHONES[s] ?? [];
        return (
          <span
            key={s}
            className={[
              "flex min-w-11 flex-col items-center gap-1.5 rounded-md border px-2 py-1.5 font-mono font-semibold",
              TINT_TILE[r],
            ].join(" ")}
          >
            <span className="text-base leading-none">{s}</span>
            {allos.length > 0 && (
              <span className="flex items-baseline gap-1 text-[10px] font-medium leading-none opacity-60">
                <span aria-hidden>[</span>
                {allos.map((a) => (
                  <span
                    key={a.symbol}
                    title={`${a.symbol} — ${a.word}`}
                    className="cursor-help"
                  >
                    {a.symbol}
                  </span>
                ))}
                <span aria-hidden>]</span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export const TINT_TILE: Record<Tint, string> = {
  plain: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 shadow-sm",
  uk: "bg-sky-500/10 text-sky-900 border-sky-500/30",
  us: "bg-rose-500/10 text-rose-900 border-rose-500/30",
  vowel: "bg-emerald-500/10 text-emerald-900 border-emerald-500/30",
  free: "bg-emerald-500/10 text-emerald-900 border-emerald-500/30",
  bound: "bg-violet-500/10 text-violet-900 border-violet-500/30",
};

/* A small mono "tile" for a piece of language (letter, syllable, word…). */
export function Piece({
  children,
  accent = false,
  tint = "plain",
  size = "md",
}: {
  children: React.ReactNode;
  accent?: boolean;
  tint?: Tint;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-md border font-mono font-semibold",
        size === "lg" ? "px-3 py-1.5 text-lg" : "px-2.5 py-1 text-base",
        accent
          ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white"
          : TINT_TILE[tint],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/* Header row of a sub-card: bold title + small direction hint (+ stats). */
export function SubHeader({
  title,
  hint,
  stats,
}: {
  title: string;
  hint: string;
  stats?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{title}</span>
      <span className="flex items-center gap-2.5">
        <span className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
        {stats}
      </span>
    </div>
  );
}

/* Table cells for the two grapheme tables. */
export function HeadCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-neutral-200 dark:border-neutral-800 p-2 text-[11px] uppercase tracking-wider font-semibold bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
      {children}
    </th>
  );
}

export function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-left align-top text-[11px] uppercase tracking-wider font-medium text-neutral-400 dark:text-neutral-500">
      {children}
    </th>
  );
}

export function BodyCell({
  children,
  rowSpan,
  w = "w-1/2",
}: {
  children: React.ReactNode;
  rowSpan?: number;
  /** Column width class — shifts the vowel/consonant divider. */
  w?: string;
}) {
  return (
    <td
      rowSpan={rowSpan}
      className={`${w} border border-neutral-200 dark:border-neutral-800 p-2 align-top`}
    >
      {children}
    </td>
  );
}

/* Two-row card: big centered head on top, small muted mapping below.
   Stretches to share its line with its row neighbours. */
export function TwoRowCell({
  head,
  sub,
  tint,
}: {
  head: string;
  sub: string;
  tint: Tint;
}) {
  return (
    <span
      className={[
        "flex-1 inline-flex flex-col items-center justify-center rounded-md border px-2.5 py-1 font-mono",
        TINT_TILE[tint],
      ].join(" ")}
    >
      <span className="text-base font-semibold leading-tight whitespace-nowrap">
        {head}
      </span>
      <span className="text-[10px] font-medium opacity-60 leading-tight whitespace-nowrap">
        {sub}
      </span>
    </span>
  );
}

/* One spelling with its sounds: [a / /æ/ /eɪ/ /ə/]. */
export function GraphemeCell({ s, sounds, tint }: GraphemeTile & { tint: Tint }) {
  return (
    <TwoRowCell
      head={s}
      sub={sounds.map((x) => `/${x}/`).join(" ")}
      tint={tint}
    />
  );
}

/* A sound as a small bordered card: [/æ/]. Stretches to share the line. */
export function SoundChip({ ipa }: { ipa: string }) {
  return (
    <span className="flex-1 inline-flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 shadow-sm">
      /{ipa}/
    </span>
  );
}

/* One grapheme per line, its sounds beside it as small bordered cards
   (the monograph-vowel cell). The chips stretch to fill the line as equal
   columns, with the schwa /ə/ always in the last column. A header row
   classifies the columns with phonics marks: v̆ short, v̄ long, … other, ə. */
export function GraphemeLines({ tiles, tint }: { tiles: GraphemeTile[]; tint: Tint }) {
  const soundCols = Math.max(
    ...tiles.map((t) => t.sounds.filter((x) => x !== "ə").length),
  );
  const hasSchwa = tiles.some((t) => t.sounds.includes("ə"));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5" aria-hidden>
        {/* invisible letter tile + arrow keep the header aligned with rows */}
        <span className="invisible">
          <Piece tint={tint}>a</Piece>
        </span>
        <span className="invisible text-neutral-300 dark:text-neutral-600">→</span>
        {Array.from({ length: soundCols }, (_, i) => (
          <span key={i} className="flex-1 text-center">
            {i === 0 ? (
              <ReadMark tokens={[{ t: "v", v: true, mark: "short" }]} />
            ) : i === 1 ? (
              <ReadMark tokens={[{ t: "v", v: true, mark: "long" }]} />
            ) : (
              <span className="font-mono text-[13px] font-bold text-neutral-300 dark:text-neutral-600">
                …
              </span>
            )}
          </span>
        ))}
        {hasSchwa && (
          <span className="flex-1 text-center font-mono text-[14px] font-bold text-neutral-800 dark:text-neutral-200">
            ə
          </span>
        )}
      </div>
      {tiles.map((t) => (
        <div key={t.s} className="flex items-center gap-1.5">
          <Piece tint={tint}>{t.s}</Piece>
          <span className="text-neutral-300 dark:text-neutral-600">→</span>
          {t.sounds
            .filter((x) => x !== "ə")
            .map((x) => (
              <SoundChip key={x} ipa={x} />
            ))}
          {t.sounds.includes("ə") && <SoundChip ipa="ə" />}
        </div>
      ))}
    </div>
  );
}

export const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/* A grid cell of grapheme cards: `grid` is [columns, lines]. Tiles stretch
   into equal columns and every visible row is completely filled — leftover
   graphemes are hidden behind a tiny "+N" badge floating on the cell's
   corner (lines = 0 means show everything). */
export function CellTiles({
  tiles,
  tint,
  grid: [cols, lines],
}: {
  tiles: GraphemeTile[];
  tint: Tint;
  grid: [number, number];
}) {
  const shown =
    lines > 0
      ? tiles.slice(
          0,
          Math.max(
            cols,
            Math.floor(Math.min(tiles.length, cols * lines) / cols) * cols,
          ),
        )
      : tiles;
  const extra = tiles.length - shown.length;
  return (
    <div className="relative">
      <div className={`grid ${GRID_COLS[cols] ?? "grid-cols-4"} gap-1.5`}>
        {shown.map((t) => (
          <GraphemeCell key={t.s} {...t} tint={tint} />
        ))}
      </div>
      {extra > 0 && (
        <span className="absolute -bottom-2 -right-2 rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-px font-mono text-[9px] font-semibold shadow-sm ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  );
}

/* One sound with its most common spellings: [/ʃ/ / sh · ti]. */
export function MapCell({ s, r, g }: Mapping) {
  return <TwoRowCell head={`/${s}/`} sub={g.join(" · ")} tint={r} />;
}

/* A word broken into syllable chips: word → [syl]·[syl]·[syl]. */
export function SyllableSplit({
  word,
  parts,
  sep,
}: {
  word: string;
  parts: string[];
  sep: string;
}) {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="font-mono text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
        {word}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
      <span className="inline-flex items-center gap-1">
        {parts.map((p, i) => (
          <React.Fragment key={p + i}>
            {i > 0 && (
              <span className="self-center font-mono text-base font-bold leading-none text-neutral-400 dark:text-neutral-500">
                {sep}
              </span>
            )}
            <span className="inline-flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 font-mono text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 shadow-sm">
              {p}
            </span>
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

/* A C/V sound shape in plain mono. `hl` marks the characters that belong
   to a highlighted grapheme (matching PatternWord's emerald). */
export function CvPattern({ pat, hl }: { pat: string; hl?: number[] }) {
  return (
    <span className="font-mono text-sm font-bold tracking-widest text-neutral-800 dark:text-neutral-200">
      {hl
        ? pat
            .split("")
            .map((ch, i) => (
              <span
                key={i}
                className={hl.includes(i) ? "text-emerald-600" : undefined}
              >
                {ch}
              </span>
            ))
        : pat}
    </span>
  );
}

/* A word rendered in segments: a grapheme segment is emerald, a silent
   letter is grayed — so "ship" shows sh as one unit, "make" shows a mute e. */
export function PatternWord({
  segs,
}: {
  segs: { t: string; g?: boolean; silent?: boolean }[];
}) {
  return (
    <span className="font-mono text-[13px] font-semibold">
      {segs.map((s, i) => (
        <span
          key={i}
          className={
            s.g
              ? "text-emerald-600"
              : s.silent
                ? "text-neutral-300 dark:text-neutral-600"
                : "text-neutral-800 dark:text-neutral-200"
          }
        >
          {s.t}
        </span>
      ))}
    </span>
  );
}

/* A node tag of the morpheme tree: bold name + tiny hint below.
   Root = accent black, free branch = emerald, bound branch = violet. */
export function TreeTag({
  title,
  hint,
  tint = "plain",
  accent = false,
  cls,
}: {
  title: string;
  hint?: string;
  tint?: Tint;
  accent?: boolean;
  /** Custom tile classes (border + bg) — overrides `tint`. */
  cls?: string;
}) {
  return (
    <span
      className={[
        "inline-flex flex-col items-center justify-center text-center rounded-md border px-2.5 py-1.5 w-32",
        accent
          ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950"
          : (cls ?? TINT_TILE[tint]),
      ].join(" ")}
    >
      <span className="text-[12px] font-bold leading-tight">{title}</span>
      {hint && (
        <span
          className={[
            "mt-0.5 text-[10px] font-medium leading-tight",
            accent ? "text-neutral-400 dark:text-neutral-500" : "opacity-60",
          ].join(" ")}
        >
          {hint}
        </span>
      )}
    </span>
  );
}

/* One level of a left→right tree: the node, then its children stacked in
   a column to the right, joined by an elbow of thin lines (the vertical
   rail only spans from the first child's center to the last child's).
   Children can themselves be TreeBranches — that's how depth happens. */
export function TreeBranch({
  node,
  children,
}: {
  node: React.ReactNode;
  children: React.ReactNode;
}) {
  const kids = React.Children.toArray(children);
  return (
    <div className="flex items-center">
      <div className="shrink-0">{node}</div>
      <span aria-hidden className="h-px w-4 shrink-0 bg-neutral-300 dark:bg-neutral-600" />
      <div className="flex flex-col">
        {kids.map((child, i) => (
          <div key={i} className="relative py-1 pl-4">
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-px w-4 bg-neutral-300 dark:bg-neutral-600"
            />
            {kids.length > 1 && i > 0 && (
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-1/2 w-px bg-neutral-300 dark:bg-neutral-600"
              />
            )}
            {kids.length > 1 && i < kids.length - 1 && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 bottom-0 w-px bg-neutral-300 dark:bg-neutral-600"
              />
            )}
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Color identity of each bound-morpheme kind: leaf = its card tint,
   fill = its solid shape in the position diagram, sq = a bordered box
   variant (bound bases), txt = its letters inside the example word.
   Roots stay emerald (= free) everywhere. */
export const MORPH_TYPE = {
  prefix: {
    leaf: "border-sky-500/30 bg-sky-500/10",
    fill: "bg-sky-500/50",
    sq: "border-sky-500/40 bg-sky-500/30",
    txt: "text-sky-600",
  },
  suffix: {
    leaf: "border-indigo-500/30 bg-indigo-500/10",
    fill: "bg-indigo-500/50",
    sq: "border-indigo-500/40 bg-indigo-500/30",
    txt: "text-indigo-600",
  },
  inflect: {
    leaf: "border-lime-500/30 bg-lime-500/10",
    fill: "bg-lime-500/50",
    sq: "border-lime-500/40 bg-lime-500/30",
    txt: "text-lime-600",
  },
  interfix: {
    leaf: "border-cyan-500/30 bg-cyan-500/10",
    fill: "bg-cyan-500/50",
    sq: "border-cyan-500/40 bg-cyan-500/30",
    txt: "text-cyan-600",
  },
  base: {
    leaf: "border-emerald-500/20 bg-emerald-500/5",
    fill: "bg-emerald-500/50",
    sq: "border-emerald-500/60 bg-emerald-500/20",
    txt: "text-emerald-700",
  },
  contracted: {
    leaf: "border-fuchsia-500/30 bg-fuchsia-500/10",
    fill: "bg-fuchsia-500/50",
    sq: "border-fuchsia-500/40 bg-fuchsia-500/30",
    txt: "text-fuchsia-600",
  },
} as const;
export type MorphKind = keyof typeof MORPH_TYPE;

export type MorphPart =
  | "root"
  | "prefix"
  | "suffix"
  | "interfix"
  | "base"
  | "contr"
  | "apos";

/* One bit of a position diagram. Every kind has its own geometry:
   root = emerald bar, prefix = arrow pointing right (into the root),
   suffix = arrow pointing left, interfix = circle, base = dashed bar
   (a root that can't stand alone), contr = pill, apos = the apostrophe
   of a contracted form. Shapes stretch to the width of the word part
   written under them. */
export function ShapeBit({ p, c }: { p: MorphPart; c: MorphKind }) {
  const t = MORPH_TYPE[c];
  switch (p) {
    case "apos":
      return (
        <span
          className={`font-mono text-[12px] font-bold leading-none ${t.txt}`}
        >
          ’
        </span>
      );
    case "prefix":
      return (
        <span
          className={`h-3.5 flex-1 min-w-5 ${t.fill} [clip-path:polygon(0_0,72%_0,100%_50%,72%_100%,0_100%)]`}
        />
      );
    case "suffix":
      return (
        <span
          className={`h-3.5 flex-1 min-w-5 ${t.fill} [clip-path:polygon(28%_0,100%_0,100%_100%,28%_100%,0_50%)]`}
        />
      );
    case "interfix":
      return (
        <span className={`h-3.5 flex-1 min-w-3.5 rounded-full ${t.fill}`} />
      );
    case "base":
      return (
        <span
          className={`h-3.5 flex-1 min-w-6 rounded-sm border border-dashed ${t.sq}`}
        />
      );
    case "contr":
      return (
        <span className={`h-3.5 flex-1 min-w-4 rounded-full ${t.fill}`} />
      );
    default:
      return (
        <span className="h-3.5 flex-1 min-w-6 rounded-sm border border-emerald-500/40 bg-emerald-500/10" />
      );
  }
}

/* A leaf (or inner node) of the bound branch: the name line on top, and
   below it the diagram with the matching word part written under each
   bar — so every shape bit points at its piece of the example word. */
export function MorphLeaf({
  name,
  c,
  cols,
  from,
  rare,
  count,
}: {
  name: string;
  c: MorphKind;
  /** Diagram columns: shape bit(s) on top, word part below. `b` marks
      the bound piece — it gets the kind's color, roots stay dark. */
  cols?: { p: MorphPart | MorphPart[]; t?: string; b?: boolean }[];
  from?: string;
  rare?: string;
  /** How many of these English has — shown top-right ("8", "2k"…). */
  count?: string;
}) {
  const t = MORPH_TYPE[c];
  return (
    <div className={`relative w-32 rounded-md border px-2 py-1.5 ${t.leaf}`}>
      {count && <CountBadge n={count} />}
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
          {name}
        </span>
        {rare && (
          <span className="rounded-full bg-white/70 dark:bg-neutral-900/70 px-1.5 py-px text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {rare}
          </span>
        )}
      </div>
      {cols && (
        <div className="mt-1 flex items-end justify-center gap-1">
          {from && (
            <span className="inline-flex items-center gap-1 pr-0.5 pb-px">
              <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                {from}
              </span>
              <ArrowRight className="w-3 h-3 text-neutral-400 dark:text-neutral-500 shrink-0" />
            </span>
          )}
          {cols.map((col, i) => (
            <span key={i} className="flex flex-col items-stretch gap-0.5">
              <span className="flex w-full items-center gap-0.5">
                {(Array.isArray(col.p) ? col.p : [col.p]).map((p, j) => (
                  <ShapeBit key={j} p={p} c={c} />
                ))}
              </span>
              {col.t && (
                <span
                  className={`text-center font-mono text-[12px] font-semibold leading-tight ${
                    col.b ? t.txt : "text-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  {col.t}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* Count pill floating on a card's top-right corner: how many of these
   English has ("8", "2k", "400–500"). */
export function CountBadge({ n }: { n: string }) {
  return (
    <span className="absolute -top-2 -right-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-1.5 py-px font-mono text-[9px] font-bold text-neutral-600 dark:text-neutral-400 whitespace-nowrap shadow-sm">
      {n}
    </span>
  );
}

/* A leaf of the free branch: the class name with its total count pinned
   to the top-right corner, then one emerald chip per word kind, each
   carrying its own count (verb 11,529 · noun 117,798 · …). */
export function PosLeaf({
  label,
  items,
  count,
}: {
  label: string;
  items: { t: string; n: string }[];
  count?: string;
}) {
  return (
    <div className="relative w-fit max-w-72 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5">
      {count && <CountBadge n={count} />}
      <span className="block text-center text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
        {label}
      </span>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        {items.map((p) => (
          <span
            key={p.t}
            className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-white/70 dark:bg-neutral-900/70 px-1 py-px text-[10px] font-medium text-emerald-900"
          >
            {p.t}
            <span className="font-mono text-[9px] font-bold text-emerald-700">
              {p.n}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* Phonics reading marks: mark "long"/"short" draws a macron/breve centered
   above the letter (CSS-positioned — combining Unicode marks don't sit over
   the glyph in this font); struck-out gray = silent letter; sup renders a
   small raised schwa. */
export function ReadMark({
  tokens,
}: {
  tokens: {
    t: string;
    v?: boolean;
    silent?: boolean;
    sup?: boolean;
    mark?: "long" | "short";
  }[];
}) {
  return (
    <span className="font-mono text-[14px] font-bold whitespace-nowrap">
      {tokens.map((s, i) => {
        if (s.sup) {
          return (
            <sup key={i} className="text-neutral-800 dark:text-neutral-200">
              {s.t}
            </sup>
          );
        }
        const color = s.silent
          ? "text-neutral-300 dark:text-neutral-600 line-through"
          : "text-neutral-800 dark:text-neutral-200";
        if (s.mark) {
          return (
            <span key={i} className={`relative inline-block ${color}`}>
              {s.t}
              {s.mark === "long" ? (
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 top-[0.12em] w-[0.55em] border-t-[0.08em] border-current"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2 top-[0.02em] h-[0.22em] w-[0.55em] rounded-b-full border-b-[0.08em] border-current"
                />
              )}
            </span>
          );
        }
        return (
          <span key={i} className={color}>
            {s.t}
          </span>
        );
      })}
    </span>
  );
}

/* The ways a stressed syllable can be made visible (à la "making word
   stress visible"). Each page load shows the next one — see EnglishPage. */
export const STRESS_STYLES = [
  "caps",
  "bold",
  "underline",
  "box",
  "color",
  "dots",
] as const;
export type StressStyle = (typeof STRESS_STYLES)[number];

/* Picked once per page load: advance the stored index and remember the
   result, so every reload shows the next style (useSyncExternalStore
   snapshot — the module-level idiom from lib/locale.tsx). */
let pickedStressStyle: StressStyle | null = null;
export function loadStressStyle(): StressStyle {
  if (pickedStressStyle === null) {
    let idx = 0;
    try {
      idx =
        (Number(localStorage.getItem("tz-stress-style") ?? -1) + 1) %
        STRESS_STYLES.length;
      if (!Number.isFinite(idx) || idx < 0) idx = 0;
      localStorage.setItem("tz-stress-style", String(idx));
    } catch {
      /* private mode etc. — keep the default */
    }
    pickedStressStyle = STRESS_STYLES[idx];
  }
  return pickedStressStyle;
}
export const serverStressStyle = (): StressStyle => "caps";
export const noopSubscribe = () => () => {};

/* One segment of a word, marked (or not) as stressed in the given style.
   Primary keeps the garnet color, secondary blue, rest small muted. */
export function StressSeg({
  t,
  k,
  variant,
}: {
  t: string;
  k?: "primary" | "secondary";
  variant: StressStyle;
}) {
  if (!k) {
    return <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{t}</span>;
  }
  const color = k === "primary" ? "text-red-800" : "text-blue-600";
  const weight = k === "primary" ? "font-extrabold" : "font-bold";
  switch (variant) {
    case "caps":
      return (
        <span
          className={`${color} ${weight} ${
            k === "primary" ? "text-[15px]" : "text-[13px]"
          }`}
        >
          {t.toUpperCase()}
        </span>
      );
    case "bold":
      return <span className={`text-[12px] ${color} ${weight}`}>{t}</span>;
    case "underline":
      return (
        <span
          className={`text-[12px] font-semibold ${color} underline decoration-2 underline-offset-2`}
        >
          {t}
        </span>
      );
    case "box":
      return (
        <span
          className={`text-[12px] font-semibold ${color} rounded border border-current px-0.5 mx-px`}
        >
          {t}
        </span>
      );
    case "color":
      return <span className={`text-[12px] font-semibold ${color}`}>{t}</span>;
    case "dots":
      return (
        <span
          className={`relative inline-block text-[12px] font-semibold ${color}`}
        >
          {t}
          <span
            aria-hidden
            className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-current ${
              k === "primary"
                ? "-bottom-1.25 h-1.25 w-1.25"
                : "-bottom-1 h-0.75 w-0.75"
            }`}
          />
        </span>
      );
  }
}

/* A word with its stressed parts marked in one of the STRESS_STYLES:
   comPUter, com**pu**ter, com̲pu̲ter, com[pu]ter… (segs carry lowercase text). */
export function StressWord({
  segs,
  variant = "caps",
}: {
  segs: { t: string; k?: "primary" | "secondary" }[];
  variant?: StressStyle;
}) {
  return (
    <span
      className={`font-mono whitespace-nowrap ${
        variant === "dots" ? "inline-block pb-1" : ""
      }`}
    >
      {segs.map((s, i) => (
        <StressSeg key={i} t={s.t} k={s.k} variant={variant} />
      ))}
    </span>
  );
}

/* An IPA transcription with colored stress: the ˈ/ˌ mark and the syllable
   it stresses (up to the next dot, mark or slash) — primary = garnet,
   secondary = blue. Dots and unstressed syllables stay muted mono. */
export function StressIpa({ ipa }: { ipa: string }) {
  let mode: "primary" | "secondary" | null = null;
  return (
    <span className="font-mono text-[12px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
      {Array.from(ipa).map((ch, i) => {
        if (ch === "ˈ") mode = "primary";
        else if (ch === "ˌ") mode = "secondary";
        else if (ch === "." || ch === "/") mode = null;
        const isMark = ch === "ˈ" || ch === "ˌ";
        return (
          <span
            key={i}
            className={
              mode === "primary"
                ? `text-red-800 ${isMark ? "font-extrabold" : "font-semibold"}`
                : mode === "secondary"
                  ? `text-blue-600 ${isMark ? "font-extrabold" : "font-semibold"}`
                  : undefined
            }
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/* A dictionary-style example: word on top, then uk /…/ and us /…/ lines. */
export function StressIpaExample({
  word,
  uk,
  us,
}: {
  word: string;
  uk: string;
  us: string;
}) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">{word}</span>
      {[
        { label: "us", ipa: us },
        { label: "uk", ipa: uk },
      ].map((v) => (
        <span
          key={v.label}
          className="inline-flex items-baseline gap-1 whitespace-nowrap"
        >
          <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {v.label}
          </span>
          <StressIpa ipa={v.ipa} />
        </span>
      ))}
    </span>
  );
}

/* A C/V pattern with a split mark: V C | C V. The "|" is rose. */
export function SplitPattern({ tokens }: { tokens: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[12px] font-bold">
      {tokens.map((t, i) =>
        t === "|" ? (
          <span key={i} className="text-rose-400 px-px">
            |
          </span>
        ) : (
          <span key={i} className="text-neutral-800 dark:text-neutral-200">
            {t}
          </span>
        ),
      )}
    </span>
  );
}

/* One form of a syllable part — "C̩" gets its syllabic stroke drawn under
   the C (CSS, since combining marks don't sit over glyphs in this font). */
export function PartPattern({ pat }: { pat: string }) {
  if (pat === "C̩") {
    return (
      <span className="relative inline-block font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
        C
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 bottom-[-0.12em] h-[0.25em] w-[0.09em] bg-current"
        />
      </span>
    );
  }
  return (
    <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
      {pat}
    </span>
  );
}

/* One part of a syllable (onset / nucleus / coda): the label on top, then
   every form it can take as its own centered row — "–" means the part can
   be empty. */
export function SyllablePartCard({
  label,
  forms,
}: {
  label: string;
  forms: string[];
}) {
  return (
    <div className="w-full flex-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1.5 flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 font-semibold">
        {label}
      </span>
      <div className="w-full flex flex-col gap-1">
        {forms.map((pat) => (
          <div
            key={pat}
            className="flex items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5"
          >
            <PartPattern pat={pat} />
          </div>
        ))}
      </div>
    </div>
  );
}

