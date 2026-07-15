"use client";

// SVG glyphs for the /english/letters signal-code cards:
// - SignalFlag: the 26 international maritime signal flags (flaghoist),
//   drawn per the ICS blazons ("International maritime signal flags" on
//   Wikipedia) in a 96×96 box; Alfa/Bravo are swallowtailed.
// - SemaphoreFigure: a stick figure holding two hand flags. Arm angles
//   come from lib/letters.ts (`semaphore`): degrees clockwise from
//   12 o'clock, viewer's perspective (so "A" = one flag at 225°,
//   the viewer's lower left).

import React from "react";

const RED = "#e03131";
const BLUE = "#1f3a8f";
const YELLOW = "#fcc419";
const BLACK = "#212121";
const WHITE = "#ffffff";
const OUTLINE = "#d4d4d4"; // neutral-300 — keeps white flag areas visible
const INK = "#404040"; // neutral-700 — the semaphore figure

/* ── Flaghoist ─────────────────────────────────────────────────────── */

// Swallowtail outline shared by Alfa and Bravo.
const SWALLOW = "0,0 96,0 70,48 96,96 0,96";

const CHECKER = Array.from({ length: 16 }, (_, i) => {
  const r = Math.floor(i / 4);
  const c = i % 4;
  return (r + c) % 2 === 0 ? (
    <rect key={i} x={c * 24} y={r * 24} width={24} height={24} fill={BLUE} />
  ) : null;
});

// Yankee: 10 stripes running from upper fly to lower hoist ("/"), or first.
const Y_STRIPES = [1, 3, 5, 7, 9].map((i) => (
  <rect key={i} x={-40} y={-20 + i * 13.6} width={176} height={13.6} fill={RED} />
));

const FLAG_SHAPES: Record<string, React.ReactNode> = {
  a: (
    <>
      <polygon points="0,0 48,0 48,96 0,96" fill={WHITE} />
      <polygon points="48,0 96,0 70,48 96,96 48,96" fill={BLUE} />
    </>
  ),
  b: <polygon points={SWALLOW} fill={RED} />,
  c: (
    <>
      <rect width={96} height={96} fill={BLUE} />
      <rect y={19.2} width={96} height={57.6} fill={WHITE} />
      <rect y={38.4} width={96} height={19.2} fill={RED} />
    </>
  ),
  d: (
    <>
      <rect width={96} height={96} fill={YELLOW} />
      <rect y={24} width={96} height={48} fill={BLUE} />
    </>
  ),
  e: (
    <>
      <rect width={96} height={48} fill={BLUE} />
      <rect y={48} width={96} height={48} fill={RED} />
    </>
  ),
  f: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <polygon points="48,0 96,48 48,96 0,48" fill={RED} />
    </>
  ),
  g: (
    <>
      <rect width={96} height={96} fill={YELLOW} />
      <rect x={16} width={16} height={96} fill={BLUE} />
      <rect x={48} width={16} height={96} fill={BLUE} />
      <rect x={80} width={16} height={96} fill={BLUE} />
    </>
  ),
  h: (
    <>
      <rect width={48} height={96} fill={WHITE} />
      <rect x={48} width={48} height={96} fill={RED} />
    </>
  ),
  i: (
    <>
      <rect width={96} height={96} fill={YELLOW} />
      <circle cx={48} cy={48} r={19} fill={BLACK} />
    </>
  ),
  j: (
    <>
      <rect width={96} height={96} fill={BLUE} />
      <rect y={32} width={96} height={32} fill={WHITE} />
    </>
  ),
  k: (
    <>
      <rect width={48} height={96} fill={YELLOW} />
      <rect x={48} width={48} height={96} fill={BLUE} />
    </>
  ),
  l: (
    <>
      <rect width={96} height={96} fill={YELLOW} />
      <rect x={48} width={48} height={48} fill={BLACK} />
      <rect y={48} width={48} height={48} fill={BLACK} />
    </>
  ),
  m: (
    <>
      <rect width={96} height={96} fill={BLUE} />
      <path d="M0 0 96 96 M96 0 0 96" stroke={WHITE} strokeWidth={13} />
    </>
  ),
  n: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      {CHECKER}
    </>
  ),
  o: (
    <>
      <polygon points="0,0 96,0 96,96" fill={RED} />
      <polygon points="0,0 96,96 0,96" fill={YELLOW} />
    </>
  ),
  p: (
    <>
      <rect width={96} height={96} fill={BLUE} />
      <rect x={32} y={32} width={32} height={32} fill={WHITE} />
    </>
  ),
  q: <rect width={96} height={96} fill={YELLOW} />,
  r: (
    <>
      <rect width={96} height={96} fill={RED} />
      <rect x={38} width={20} height={96} fill={YELLOW} />
      <rect y={38} width={96} height={20} fill={YELLOW} />
    </>
  ),
  s: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <rect x={32} y={32} width={32} height={32} fill={BLUE} />
    </>
  ),
  t: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <rect width={32} height={96} fill={RED} />
      <rect x={64} width={32} height={96} fill={BLUE} />
    </>
  ),
  u: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <rect width={48} height={48} fill={RED} />
      <rect x={48} y={48} width={48} height={48} fill={RED} />
    </>
  ),
  v: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <path d="M0 0 96 96 M96 0 0 96" stroke={RED} strokeWidth={13} />
    </>
  ),
  w: (
    <>
      <rect width={96} height={96} fill={BLUE} />
      <rect x={16} y={16} width={64} height={64} fill={WHITE} />
      <rect x={32} y={32} width={32} height={32} fill={RED} />
    </>
  ),
  x: (
    <>
      <rect width={96} height={96} fill={WHITE} />
      <rect x={38} width={20} height={96} fill={BLUE} />
      <rect y={38} width={96} height={20} fill={BLUE} />
    </>
  ),
  y: (
    <g clipPath="url(#tz-flag-y)">
      <rect width={96} height={96} fill={YELLOW} />
      <g transform="rotate(-45 48 48)">{Y_STRIPES}</g>
    </g>
  ),
  z: (
    <>
      <polygon points="0,0 96,0 48,48" fill={YELLOW} />
      <polygon points="0,0 48,48 0,96" fill={BLACK} />
      <polygon points="96,0 96,96 48,48" fill={RED} />
      <polygon points="0,96 48,48 96,96" fill={BLUE} />
    </>
  ),
};

export function SignalFlag({
  char,
  className,
}: {
  char: string;
  className?: string;
}) {
  const shape = FLAG_SHAPES[char];
  if (!shape) return null;
  const swallow = char === "a" || char === "b";
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      {char === "y" && (
        <defs>
          <clipPath id="tz-flag-y">
            <rect width={96} height={96} />
          </clipPath>
        </defs>
      )}
      {shape}
      {swallow ? (
        <polygon
          points={SWALLOW}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={1.5}
        />
      ) : (
        <rect
          x={0.75}
          y={0.75}
          width={94.5}
          height={94.5}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

/* ── Semaphore ─────────────────────────────────────────────────────── */

// Decide which flag each shoulder holds so uncrossed letters stay
// uncrossed and same-side letters cross naturally. Returns
// [leftShoulderAngle, rightShoulderAngle] (viewer's left/right).
function byShoulder([a, b]: [number, number]): [number, number] {
  const side = (x: number) => (x % 180 === 0 ? 0 : x < 180 ? 1 : -1);
  const sa = side(a);
  const sb = side(b);
  if (sa === sb) {
    // Same side (crossed) or both vertical: outermost flag keeps its side.
    if (sa === -1) return a >= b ? [a, b] : [b, a];
    return a <= b ? [a, b] : [b, a];
  }
  if (sa === -1 || sb === 1) return [a, b];
  return [b, a];
}

function Arm({ sx, angle }: { sx: number; angle: number }) {
  const sy = 31;
  return (
    <g transform={`rotate(${angle} ${sx} ${sy})`}>
      <line
        x1={sx}
        y1={sy}
        x2={sx}
        y2={sy - 17}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* hand flag, split diagonally red / yellow like the real ones */}
      <polygon
        points={`${sx - 6},${sy - 28} ${sx + 6},${sy - 28} ${sx - 6},${sy - 17}`}
        fill={RED}
      />
      <polygon
        points={`${sx + 6},${sy - 28} ${sx + 6},${sy - 17} ${sx - 6},${sy - 17}`}
        fill={YELLOW}
      />
    </g>
  );
}

export function SemaphoreFigure({
  angles,
  className,
}: {
  angles: [number, number];
  className?: string;
}) {
  const [leftA, rightA] = byShoulder(angles);
  // Tight viewBox: arms + flags reach x 10..90, y 0..80 — no dead margin.
  return (
    <svg viewBox="8 -2 84 84" className={className} aria-hidden>
      <circle cx={50} cy={17} r={6.5} fill={INK} />
      <path
        d="M50 24 V54 M50 54 L41 76 M50 54 L59 76"
        stroke={INK}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Arm sx={44} angle={leftA} />
      <Arm sx={56} angle={rightA} />
    </svg>
  );
}
