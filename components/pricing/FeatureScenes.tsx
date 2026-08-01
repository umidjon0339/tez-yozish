"use client";

import React from "react";

/* Animated art for the /pricing feature showcase.
 *
 * Same contract as components/thumbnails/SvgLibrary.tsx:
 *   - one fixed viewBox (800×450) so every scene swaps in place,
 *   - class/filter names namespaced with useId() so two scenes can't collide,
 *   - neutrals come from the --thumb-* variables (globals.css) so the art
 *     follows the theme, accents stay literal hex,
 *   - every animation is switched off under prefers-reduced-motion.
 *
 * The one exception is GamesScene: it is a *picture of a place* (space), so
 * like the game covers in SvgLibrary it keeps its painted palette in both
 * themes. See docs/thumbnails.md, "Two kinds of cover".
 */

type SceneProps = { className?: string };

const VB = "0 0 800 450";

/** A CSS-safe, per-instance prefix for class and keyframe names. */
function useNs() {
  const raw = React.useId();
  return React.useMemo(() => "pz" + raw.replace(/[^a-zA-Z0-9]/g, ""), [raw]);
}

/** Wraps the animation rules so reduced-motion users get the still frame. */
function motion(ns: string, css: string) {
  return `${css}
    @media (prefers-reduced-motion: reduce) {
      [class^="${ns}-"], [class*=" ${ns}-"] { animation: none !important; }
    }`;
}

const STAR_PATH =
  "M0,-13 L3.8,-4.2 L13,-3.9 L5.9,2.1 L8,11.3 L0,6.4 L-8,11.3 L-5.9,2.1 L-13,-3.9 L-3.8,-4.2 Z";

/* ───────────────────────── 1. Full course ───────────────────────── */

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((r) => r.split(""));
const PITCH = 60;
const KEY = 52;

export const CourseScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  const rows = KEY_ROWS.map((keys, i) => ({
    keys,
    y: 66 + i * 62,
    x0: (800 - (keys.length * PITCH - 8)) / 2,
  }));

  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-hop { animation-iteration-count: infinite; }
          .${ns}-hop0 { animation: ${ns}-h0 5.5s steps(10, jump-none) infinite; }
          .${ns}-hop1 { animation: ${ns}-h1 4.6s steps(9, jump-none) infinite; }
          .${ns}-hop2 { animation: ${ns}-h2 3.9s steps(7, jump-none) infinite; }
          @keyframes ${ns}-h0 { from { transform: translateX(0) } to { transform: translateX(${9 * PITCH}px) } }
          @keyframes ${ns}-h1 { from { transform: translateX(0) } to { transform: translateX(${8 * PITCH}px) } }
          @keyframes ${ns}-h2 { from { transform: translateX(0) } to { transform: translateX(${6 * PITCH}px) } }
          .${ns}-bar { transform-box: fill-box; transform-origin: left center; animation: ${ns}-fill 6s ease-in-out infinite; }
          @keyframes ${ns}-fill { 0% { transform: scaleX(.06) } 55%, 100% { transform: scaleX(.78) } }
          .${ns}-star { transform-box: fill-box; transform-origin: center; animation: ${ns}-pop 6s ease-out infinite; }
          @keyframes ${ns}-pop {
            0%, 8% { transform: scale(0); opacity: 0 }
            18% { transform: scale(1.25); opacity: 1 }
            26%, 100% { transform: scale(1); opacity: 1 }
          }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {rows.map((row, ri) => (
        <g key={ri}>
          {row.keys.map((k, ki) => (
            <g key={k}>
              <rect
                x={row.x0 + ki * PITCH}
                y={row.y}
                width={KEY}
                height={KEY}
                rx="12"
                fill="var(--thumb-key)"
                stroke="var(--thumb-edge)"
                strokeWidth="1.5"
              />
              <text
                x={row.x0 + ki * PITCH + KEY / 2}
                y={row.y + KEY / 2 + 7}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="21"
                fontWeight="600"
                fill="var(--thumb-ink-soft)"
              >
                {k}
              </text>
            </g>
          ))}
          {/* the lesson walking key by key across the row */}
          <g className={`${ns}-hop ${ns}-hop${ri}`}>
            <rect
              x={row.x0}
              y={row.y}
              width={KEY}
              height={KEY}
              rx="12"
              fill="#10B981"
              fillOpacity="0.16"
              stroke="#10B981"
              strokeWidth="2.5"
            />
          </g>
        </g>
      ))}

      {/* progress of the whole course */}
      <rect x="150" y="286" width="500" height="14" rx="7" fill="var(--thumb-edge)" />
      <rect
        className={`${ns}-bar`}
        x="150"
        y="286"
        width="500"
        height="14"
        rx="7"
        fill="#10B981"
      />

      {/* stars earned on the test at the end of the block.
          The placing transform lives on an OUTER <g>: a CSS `transform` on
          the same element would override the attribute and stack every star
          at the origin. Same nesting is used for the pods and the flags. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${400 + (i - 2) * 62} 372)`}>
          <path
            className={`${ns}-star`}
            style={{ animationDelay: `${0.35 * i}s` }}
            d={STAR_PATH}
            fill="#F59E0B"
          />
        </g>
      ))}
    </svg>
  );
};

/* ───────────────────────── 2. Games ───────────────────────── */

const PODS = [
  { x: 130, letter: "s", delay: 0 },
  { x: 268, letter: "k", delay: 1.1 },
  { x: 404, letter: "y", delay: 2.2 },
  { x: 542, letter: "j", delay: 0.6 },
  { x: 668, letter: "f", delay: 1.7 },
];
const SPACE_STARS = [
  [70, 60], [180, 118], [300, 44], [430, 96], [560, 58], [700, 130],
  [110, 200], [250, 250], [520, 210], [740, 240], [360, 300], [620, 320],
];

export const GamesScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${ns}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#140b33" />
          <stop offset="60%" stopColor="#241147" />
          <stop offset="100%" stopColor="#3b1a5e" />
        </linearGradient>
        <linearGradient id={`${ns}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#67E8F9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <style>
        {motion(
          ns,
          `
          .${ns}-pod { animation: ${ns}-fall 4.4s linear infinite; }
          @keyframes ${ns}-fall {
            0% { transform: translateY(-140px); opacity: 0 }
            12% { opacity: 1 }
            78% { opacity: 1 }
            88%, 100% { transform: translateY(250px); opacity: 0 }
          }
          .${ns}-twinkle { animation: ${ns}-tw 3.2s ease-in-out infinite; }
          @keyframes ${ns}-tw { 0%, 100% { opacity: .25 } 50% { opacity: .9 } }
          .${ns}-bolt { transform-origin: center bottom; animation: ${ns}-shoot 1.6s ease-out infinite; }
          @keyframes ${ns}-shoot {
            0% { transform: translateY(0) scaleY(.2); opacity: 0 }
            15% { opacity: 1 }
            70%, 100% { transform: translateY(-230px) scaleY(1); opacity: 0 }
          }
          .${ns}-ship { animation: ${ns}-bob 3s ease-in-out infinite; }
          @keyframes ${ns}-bob { 0%, 100% { transform: translateX(-14px) } 50% { transform: translateX(14px) } }
          .${ns}-jet { animation: ${ns}-jetp .5s ease-in-out infinite; }
          @keyframes ${ns}-jetp { 0%, 100% { transform: scaleY(.75) } 50% { transform: scaleY(1.2) } }
        `,
        )}
      </style>

      <rect width="800" height="450" fill={`url(#${ns}-sky)`} />
      {SPACE_STARS.map(([x, y], i) => (
        <circle
          key={i}
          className={`${ns}-twinkle`}
          style={{ animationDelay: `${(i % 5) * 0.6}s` }}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 2.6 : 1.7}
          fill="#fff"
        />
      ))}

      {/* drop-pods, each carrying the key you have to hit */}
      {PODS.map((p) => (
        <g key={p.letter} transform={`translate(${p.x} 120)`}>
          <g className={`${ns}-pod`} style={{ animationDelay: `${p.delay}s` }}>
          <ellipse cx="0" cy="4" rx="30" ry="12" fill="#F472B6" opacity="0.25" />
          <path
            d="M-26,0 A26,26 0 0 1 26,0 L22,30 A10,10 0 0 1 12,38 L-12,38 A10,10 0 0 1 -22,30 Z"
            fill="#EC4899"
          />
          <path d="M-26,0 A26,26 0 0 1 26,0 L-26,0 Z" fill="#F9A8D4" opacity="0.5" />
          <circle cx="0" cy="2" r="15" fill="#0f0524" opacity="0.55" />
          <text
            x="0"
            y="9"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="22"
            fontWeight="700"
            fill="#fff"
          >
            {p.letter}
          </text>
          </g>
        </g>
      ))}

      {/* the blaster bolt is pure theatre — the key already landed the hit */}
      <g className={`${ns}-bolt`}>
        <rect x="396" y="300" width="8" height="52" rx="4" fill="#67E8F9" />
        <rect x="398.5" y="300" width="3" height="52" rx="1.5" fill="#fff" />
      </g>

      <g className={`${ns}-ship`}>
        <g transform="translate(400 370)">
          <path d="M0,-46 C16,-26 22,-6 22,14 L-22,14 C-22,-6 -16,-26 0,-46 Z" fill="#E4E4E7" />
          <path d="M0,-46 C8,-30 12,-12 12,14 L-12,14 C-12,-12 -8,-30 0,-46 Z" fill="#fff" />
          <circle cx="0" cy="-14" r="8" fill="#38BDF8" />
          <path d="M-22,14 L-40,34 L-16,30 Z" fill="#F87171" />
          <path d="M22,14 L40,34 L16,30 Z" fill="#F87171" />
          <g className={`${ns}-jet`} style={{ transformOrigin: "0px 14px" }}>
            <path d="M-11,14 L0,54 L11,14 Z" fill={`url(#${ns}-flame)`} />
          </g>
        </g>
      </g>

      <rect y="430" width="800" height="20" fill="#0f0524" opacity="0.6" />
    </svg>
  );
};

/* ───────────────────────── 3. English lab ───────────────────────── */

const CAT = [
  { g: "c", p: "/k/", x: 200 },
  { g: "a", p: "/æ/", x: 400 },
  { g: "t", p: "/t/", x: 600 },
];

export const EnglishScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-step { animation: ${ns}-lit 5.4s ease-in-out infinite; }
          @keyframes ${ns}-lit {
            0%, 12% { opacity: 0 }
            22%, 62% { opacity: 1 }
            76%, 100% { opacity: 0 }
          }
          .${ns}-drop { animation: ${ns}-fall 5.4s ease-in-out infinite; }
          @keyframes ${ns}-fall {
            0%, 14% { transform: translateY(-10px); opacity: 0 }
            26%, 66% { transform: translateY(0); opacity: 1 }
            80%, 100% { transform: translateY(-10px); opacity: 0 }
          }
          .${ns}-word { animation: ${ns}-say 5.4s ease-in-out infinite; }
          @keyframes ${ns}-say {
            0%, 55% { opacity: 0; transform: translateY(8px) }
            68%, 92% { opacity: 1; transform: translateY(0) }
            100% { opacity: 0; transform: translateY(8px) }
          }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {CAT.map((c, i) => (
        <g key={c.g} style={{ animationDelay: `${i * 0.28}s` }} className={`${ns}-drop`}>
          {/* the letter you write */}
          <rect
            x={c.x - 46}
            y="52"
            width="92"
            height="92"
            rx="18"
            fill="var(--thumb-key)"
            stroke="var(--thumb-edge)"
            strokeWidth="2"
          />
          <text
            x={c.x}
            y="118"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="54"
            fontWeight="700"
            fill="var(--thumb-ink)"
          >
            {c.g}
          </text>
          {/* the sound it makes */}
          <path
            d={`M${c.x},158 L${c.x},198`}
            stroke="var(--thumb-dim)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="7 8"
          />
          <path
            d={`M${c.x - 9},192 L${c.x},204 L${c.x + 9},192`}
            fill="none"
            stroke="var(--thumb-dim)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className={`${ns}-step`} style={{ animationDelay: `${i * 0.28}s` }}>
            <rect x={c.x - 52} y="216" width="104" height="60" rx="30" fill="#8B5CF6" />
            <text
              x={c.x}
              y="255"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="26"
              fontWeight="700"
              fill="#fff"
            >
              {c.p}
            </text>
          </g>
        </g>
      ))}

      {/* …and the word they build together */}
      <g className={`${ns}-word`}>
        <rect
          x="290"
          y="322"
          width="220"
          height="88"
          rx="20"
          fill="var(--thumb-key)"
          stroke="#8B5CF6"
          strokeWidth="3"
        />
        <text
          x="400"
          y="382"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="48"
          fontWeight="700"
          letterSpacing="6"
          fill="var(--thumb-ink)"
        >
          cat
        </text>
      </g>
    </svg>
  );
};

/* ───────────────────────── 4. Hands guide ───────────────────────── */

/* Same finger split the real keyboard uses (globals.css .kb-stage rules). */
const FINGER_OF: Record<string, string> = {
  q: "l-pinky", a: "l-pinky", z: "l-pinky",
  w: "l-ring", s: "l-ring", x: "l-ring",
  e: "l-middle", d: "l-middle", c: "l-middle",
  r: "l-index", t: "l-index", f: "l-index", g: "l-index", v: "l-index", b: "l-index",
  y: "r-index", u: "r-index", h: "r-index", j: "r-index", n: "r-index", m: "r-index",
  i: "r-middle", k: "r-middle",
  o: "r-ring", l: "r-ring",
  p: "r-pinky",
};

/** One hand: palm, four fingers, thumb. `lit` is the finger index to ring. */
function HandShape({
  x,
  flip,
  lit,
  ns,
}: {
  x: number;
  flip: boolean;
  lit: number;
  ns: string;
}) {
  const fingers = [
    { dx: -46, h: 62, zone: flip ? "r-pinky" : "l-pinky" },
    { dx: -20, h: 82, zone: flip ? "r-ring" : "l-ring" },
    { dx: 6, h: 88, zone: flip ? "r-middle" : "l-middle" },
    { dx: 32, h: 76, zone: flip ? "r-index" : "l-index" },
  ];
  return (
    <g transform={`translate(${x} 258) ${flip ? "scale(-1 1)" : ""}`}>
      {fingers.map((f, i) => (
        <g key={i}>
          <rect
            x={f.dx - 10}
            y={92 - f.h}
            width="20"
            height={f.h}
            rx="10"
            fill="var(--thumb-key)"
            stroke="var(--thumb-edge)"
            strokeWidth="2"
          />
          {i === lit && (
            <rect
              className={`${ns}-lit`}
              x={f.dx - 10}
              y={92 - f.h}
              width="20"
              height={f.h}
              rx="10"
              fill={`var(--fz-${f.zone})`}
              fillOpacity="0.85"
            />
          )}
        </g>
      ))}
      {/* thumb */}
      <rect
        x={52}
        y={64}
        width="20"
        height="52"
        rx="10"
        transform="rotate(38 62 90)"
        fill="var(--thumb-key)"
        stroke="var(--thumb-edge)"
        strokeWidth="2"
      />
      <rect
        x="-62"
        y="82"
        width="118"
        height="66"
        rx="26"
        fill="var(--thumb-key)"
        stroke="var(--thumb-edge)"
        strokeWidth="2"
      />
    </g>
  );
}

export const HandsScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  const rows = KEY_ROWS.map((keys, i) => ({
    keys,
    y: 52 + i * 58,
    x0: (800 - (keys.length * 56 - 8)) / 2,
  }));

  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-ring { animation: ${ns}-blink 1.4s ease-in-out infinite; }
          .${ns}-lit { animation: ${ns}-blink 1.4s ease-in-out infinite; }
          @keyframes ${ns}-blink { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {rows.map((row, ri) => (
        <g key={ri}>
          {row.keys.map((k, ki) => {
            const zone = FINGER_OF[k];
            const kx = row.x0 + ki * 56;
            const isTarget = k === "j";
            return (
              <g key={k}>
                <rect
                  x={kx}
                  y={row.y}
                  width="48"
                  height="48"
                  rx="11"
                  fill="var(--thumb-key)"
                  stroke="var(--thumb-edge)"
                  strokeWidth="1.5"
                />
                {/* every key wears its finger's colour — this is the real
                    colourful mode, not a made-up palette */}
                <rect
                  x={kx}
                  y={row.y}
                  width="48"
                  height="48"
                  rx="11"
                  fill={`var(--fz-${zone})`}
                  fillOpacity="0.26"
                />
                <text
                  x={kx + 24}
                  y={row.y + 31}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize="19"
                  fontWeight="600"
                  fill="var(--thumb-ink)"
                  opacity="0.75"
                >
                  {k}
                </text>
                {isTarget && (
                  <rect
                    className={`${ns}-ring`}
                    x={kx - 3}
                    y={row.y - 3}
                    width="54"
                    height="54"
                    rx="14"
                    fill="none"
                    stroke={`var(--fz-${zone})`}
                    strokeWidth="4"
                  />
                )}
              </g>
            );
          })}
        </g>
      ))}

      {/* right index finger is the one on J */}
      <HandShape ns={ns} x={276} flip={false} lit={-1} />
      <HandShape ns={ns} x={524} flip lit={3} />
    </svg>
  );
};

/* ───────────────────────── 5. Statistics ───────────────────────── */

const BARS = [46, 70, 62, 92, 80, 110, 100, 128, 118, 150, 140, 176];
/* Kept inside 308 units wide — the panel it sits in is 312 across. */
const LINE = "M0,150 L44,124 L88,132 L132,96 L176,102 L220,66 L264,74 L308,32";

export const StatsScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${ns}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <style>
        {motion(
          ns,
          `
          .${ns}-bar { transform-box: fill-box; transform-origin: bottom; animation: ${ns}-grow 4.5s ease-in-out infinite; }
          @keyframes ${ns}-grow { 0% { transform: scaleY(.08) } 45%, 100% { transform: scaleY(1) } }
          .${ns}-line { stroke-dasharray: 400; stroke-dashoffset: 400; animation: ${ns}-draw 4.5s ease-in-out infinite; }
          @keyframes ${ns}-draw { 0% { stroke-dashoffset: 400 } 55%, 100% { stroke-dashoffset: 0 } }
          .${ns}-dot { animation: ${ns}-show 4.5s ease-in-out infinite; }
          @keyframes ${ns}-show { 0%, 45% { opacity: 0 } 60%, 100% { opacity: 1 } }
          .${ns}-heat { animation: ${ns}-heatp 4.5s ease-in-out infinite; }
          @keyframes ${ns}-heatp { 0% { opacity: .18 } 50%, 100% { opacity: 1 } }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {/* left: how much you practised */}
      <rect x="40" y="40" width="330" height="230" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
      {BARS.map((h, i) => (
        <rect
          key={i}
          className={`${ns}-bar`}
          style={{ animationDelay: `${i * 0.07}s` }}
          x={64 + i * 25}
          y={240 - h}
          width="16"
          height={h}
          rx="5"
          fill={i === BARS.length - 1 ? "#10B981" : "var(--thumb-edge)"}
        />
      ))}
      <line x1="56" y1="244" x2="354" y2="244" stroke="var(--thumb-dim)" strokeWidth="2" />

      {/* right: how fast you got */}
      <rect x="400" y="40" width="360" height="230" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
      <g transform="translate(424 74)">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" y1={i * 42} x2="312" y2={i * 42} stroke="var(--thumb-edge)" strokeWidth="1.5" strokeDasharray="4 7" />
        ))}
        <path d={`${LINE} L308,168 L0,168 Z`} fill={`url(#${ns}-area)`} />
        <path
          className={`${ns}-line`}
          d={LINE}
          fill="none"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className={`${ns}-dot`} cx="308" cy="32" r="9" fill="#10B981" stroke="var(--thumb-key)" strokeWidth="4" />
      </g>

      {/* bottom: the key-by-key heat map */}
      <rect x="40" y="300" width="720" height="110" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
      {KEY_ROWS[0].concat(KEY_ROWS[1]).map((k, i) => {
        const heat = [0.9, 0.15, 0.4, 0.7, 0.25, 0.55, 0.85, 0.3, 0.6, 0.2][i % 10];
        const col = heat > 0.66 ? "#EF4444" : heat > 0.36 ? "#F59E0B" : "#10B981";
        return (
          <g key={k + i}>
            <rect
              className={`${ns}-heat`}
              style={{ animationDelay: `${i * 0.05}s` }}
              x={68 + i * 35}
              y="330"
              width="28"
              height="50"
              rx="8"
              fill={col}
              fillOpacity={0.25 + heat * 0.6}
            />
            <text
              x={68 + i * 35 + 14}
              y="362"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="15"
              fontWeight="600"
              fill="var(--thumb-ink)"
            >
              {k}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ───────────────────────── 6. Compete ───────────────────────── */

const BOARD = [
  { rank: "1", w: 300, you: false },
  { rank: "2", w: 262, you: false },
  { rank: "3", w: 236, you: false },
  { rank: "4", w: 214, you: true },
  { rank: "5", w: 190, you: false },
];

export const CompeteScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-climb { transform-box: fill-box; transform-origin: left center; animation: ${ns}-cl 5s ease-in-out infinite; }
          @keyframes ${ns}-cl { 0%, 10% { transform: scaleX(.45) } 60%, 100% { transform: scaleX(1) } }
          .${ns}-old { animation: ${ns}-out 5s ease-in-out infinite; }
          @keyframes ${ns}-out { 0%, 32% { opacity: 1 } 46%, 100% { opacity: 0 } }
          .${ns}-new { animation: ${ns}-in 5s ease-in-out infinite; }
          @keyframes ${ns}-in { 0%, 40% { opacity: 0 } 54%, 100% { opacity: 1 } }
          .${ns}-up { animation: ${ns}-float 2.4s ease-in-out infinite; }
          @keyframes ${ns}-float { 0%, 100% { transform: translateY(3px) } 50% { transform: translateY(-5px) } }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {BOARD.map((r, i) => {
        const y = 46 + i * 76;
        return (
          <g key={i}>
            <rect
              x="80"
              y={y}
              width="640"
              height="60"
              rx="14"
              fill="var(--thumb-key)"
              stroke={r.you ? "#10B981" : "var(--thumb-edge)"}
              strokeWidth={r.you ? 3 : 1.5}
            />
            <circle cx="118" cy={y + 30} r="19" fill={r.you ? "#10B981" : "var(--thumb-edge)"} />
            {r.you ? (
              <>
                <text
                  className={`${ns}-old`}
                  x="118"
                  y={y + 37}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize="18"
                  fontWeight="700"
                  fill="#fff"
                >
                  12
                </text>
                <text
                  className={`${ns}-new`}
                  x="118"
                  y={y + 37}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize="18"
                  fontWeight="700"
                  fill="#fff"
                >
                  4
                </text>
              </>
            ) : (
              <text
                x="118"
                y={y + 37}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="18"
                fontWeight="700"
                fill="var(--thumb-ink)"
              >
                {r.rank}
              </text>
            )}
            {/* name placeholder */}
            <rect x="152" y={y + 21} width={r.you ? 96 : 118} height="18" rx="9" fill="var(--thumb-dim)" />
            {r.you && (
              <g className={`${ns}-up`}>
                <path
                  d={`M262,${y + 38} L270,${y + 22} L278,${y + 38} Z`}
                  fill="#10B981"
                />
              </g>
            )}
            {/* speed bar */}
            <rect x="300" y={y + 22} width="336" height="16" rx="8" fill="var(--thumb-edge)" />
            <rect
              className={r.you ? `${ns}-climb` : undefined}
              x="300"
              y={y + 22}
              width={r.w}
              height="16"
              rx="8"
              fill={r.you ? "#10B981" : "var(--thumb-dim)"}
            />
            <text
              x="700"
              y={y + 37}
              textAnchor="end"
              fontFamily="ui-monospace, monospace"
              fontSize="17"
              fontWeight="700"
              fill="var(--thumb-ink-soft)"
            >
              {90 - i * 7}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ───────────────────────── 7. Comfort ───────────────────────── */

const FLAGS = [
  { src: "/flags/en.svg", x: 218 },
  { src: "/flags/uz.svg", x: 358 },
  { src: "/flags/ru.svg", x: 498 },
];

export const ComfortScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${ns}-flagclip`}>
          <rect x="0" y="0" width="84" height="56" rx="10" />
        </clipPath>
        <mask id={`${ns}-moon`}>
          <rect width="800" height="450" fill="#000" />
          <circle cx="640" cy="112" r="30" fill="#fff" />
          <circle cx="626" cy="100" r="26" fill="#000" />
        </mask>
      </defs>
      <style>
        {motion(
          ns,
          `
          .${ns}-night { animation: ${ns}-swap 7s ease-in-out infinite; }
          @keyframes ${ns}-swap { 0%, 38% { opacity: 0 } 52%, 90% { opacity: 1 } 100% { opacity: 0 } }
          .${ns}-day { animation: ${ns}-swapd 7s ease-in-out infinite; }
          @keyframes ${ns}-swapd { 0%, 38% { opacity: 1 } 52%, 90% { opacity: 0 } 100% { opacity: 1 } }
          .${ns}-flag { animation: ${ns}-lift 4.2s ease-in-out infinite; }
          @keyframes ${ns}-lift { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
        `,
        )}
      </style>

      <rect width="800" height="450" fill="var(--thumb-panel)" />

      {/* the same workspace, twice: light in the day, dark at night */}
      <g>
        <rect x="140" y="44" width="520" height="236" rx="22" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" className={`${ns}-day`} />
        <rect x="140" y="44" width="520" height="236" rx="22" fill="#18181b" stroke="#3f3f46" strokeWidth="2" className={`${ns}-night`} />

        {/* text lines inside the fake workspace */}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect className={`${ns}-day`} x="182" y={104 + i * 42} width={[380, 320, 240][i]} height="18" rx="9" fill="#e4e4e7" />
            <rect className={`${ns}-night`} x="182" y={104 + i * 42} width={[380, 320, 240][i]} height="18" rx="9" fill="#3f3f46" />
          </g>
        ))}
        <rect className={`${ns}-day`} x="182" y="104" width="150" height="18" rx="9" fill="#10B981" />
        <rect className={`${ns}-night`} x="182" y="104" width="150" height="18" rx="9" fill="#10B981" />

        {/* sun ↔ moon */}
        <g className={`${ns}-day`}>
          <circle cx="600" cy="106" r="22" fill="#F59E0B" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1={600 + 32 * Math.cos((a * Math.PI) / 180)}
              y1={106 + 32 * Math.sin((a * Math.PI) / 180)}
              x2={600 + 42 * Math.cos((a * Math.PI) / 180)}
              y2={106 + 42 * Math.sin((a * Math.PI) / 180)}
              stroke="#F59E0B"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
        </g>
        <g className={`${ns}-night`}>
          <rect x="580" y="60" width="120" height="110" fill="#FCD34D" mask={`url(#${ns}-moon)`} />
        </g>
      </g>

      {/* three languages */}
      {FLAGS.map((f, i) => (
        <g key={f.src} transform={`translate(${f.x} 334)`}>
          <g className={`${ns}-flag`} style={{ animationDelay: `${i * 0.4}s` }}>
            <rect x="-6" y="-6" width="96" height="68" rx="14" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="2" />
            <g clipPath={`url(#${ns}-flagclip)`}>
              <image href={f.src} x="0" y="0" width="84" height="56" preserveAspectRatio="xMidYMid slice" />
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
};

/* ───────────────────────── 8. Coding ───────────────────────── */

/** Typed out one character at a time by a `steps()` width animation. */
const CODE_LINES: { indent: number; text: string; hue: string }[] = [
  { indent: 0, text: "def greet(name):", hue: "#8B5CF6" },
  { indent: 1, text: 'print(f"Hi, {name}!")', hue: "#10B981" },
  { indent: 0, text: "greet(\"Aziza\")", hue: "#0EA5E9" },
];

export const CodingScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  const CH = 15.5;

  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-type { animation: ${ns}-type 9s steps(30) infinite; }
          @keyframes ${ns}-type { 0%,4% { width: 0 } 22%,100% { width: var(--w) } }
          .${ns}-caret { animation: ${ns}-blink 1s steps(1) infinite; }
          @keyframes ${ns}-blink { 50% { opacity: 0 } }
          .${ns}-rung { animation: ${ns}-lift 4.5s ease-in-out infinite; transform-box: fill-box; }
          @keyframes ${ns}-lift { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
          `,
        )}
      </style>

      {/* editor window */}
      <rect x="70" y="58" width="530" height="300" rx="20" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="2.5" />
      <path d="M70 78a20 20 0 0 1 20-20h490a20 20 0 0 1 20 20v30H70z" fill="#8B5CF6" opacity="0.14" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={104 + i * 22} cy="83" r="6" fill={i === 0 ? "#8B5CF6" : "var(--thumb-dim)"} />
      ))}

      {CODE_LINES.map((l, i) => {
        const y = 150 + i * 54;
        const w = l.text.length * CH;
        return (
          <g key={i}>
            <text x="98" y={y + 5} fontSize="19" fontFamily="ui-monospace, Menlo, monospace" fill="var(--thumb-ink-soft)">
              {i + 1}
            </text>
            {/* clipped band that widens = the line being typed */}
            <clipPath id={`${ns}-c${i}`}>
              <rect
                className={`${ns}-type`}
                x={130 + l.indent * 40}
                y={y - 20}
                height="30"
                width={w}
                style={{ ["--w" as string]: `${w}px`, animationDelay: `${i * 1.1}s` }}
              />
            </clipPath>
            <text
              x={130 + l.indent * 40}
              y={y + 5}
              fontSize="21"
              fontFamily="ui-monospace, Menlo, monospace"
              fill={l.hue}
              clipPath={`url(#${ns}-c${i})`}
            >
              {l.text}
            </text>
          </g>
        );
      })}
      <rect className={`${ns}-caret`} x="130" y="238" width="12" height="26" rx="2" fill="#8B5CF6" />

      {/* the stage ladder, beginner → master */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(650 ${330 - i * 46})`}>
          <g className={`${ns}-rung`} style={{ animationDelay: `${i * 0.25}s` }}>
            <rect x="0" y="0" width={38 + i * 12} height="26" rx="8" fill="#8B5CF6" opacity={0.2 + i * 0.13} />
          </g>
        </g>
      ))}
    </svg>
  );
};

/* ───────────────────────── 9. Books ───────────────────────── */

export const BooksScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  const TONES = ["#0EA5E9", "#10B981", "#F59E0B", "#F43F5E"];

  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-book { animation: ${ns}-bob 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
          @keyframes ${ns}-bob { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-10px) rotate(-2deg) } }
          .${ns}-fill { animation: ${ns}-read 7s ease-in-out infinite; }
          @keyframes ${ns}-read { 0%,6% { width: 0 } 60%,100% { width: var(--w) } }
          .${ns}-caret { animation: ${ns}-blink 1s steps(1) infinite; }
          @keyframes ${ns}-blink { 50% { opacity: 0 } }
          `,
        )}
      </style>

      {/* shelf of books */}
      {TONES.map((hue, i) => (
        <g key={hue} transform={`translate(${72 + i * 74} ${300 - (i % 2) * 14})`}>
          <g className={`${ns}-book`} style={{ animationDelay: `${i * 0.5}s` }}>
            <rect x="0" y="0" width="56" height="86" rx="8" fill={hue} />
            <path d="M0 8a8 8 0 0 1 8-8h6v86H8a8 8 0 0 1-8-8z" fill="#000" opacity="0.2" />
            <rect x="22" y="24" width="26" height="5" rx="2.5" fill="#fff" opacity="0.9" />
            <rect x="22" y="36" width="18" height="5" rx="2.5" fill="#fff" opacity="0.6" />
          </g>
        </g>
      ))}
      <rect x="60" y="392" width="300" height="8" rx="4" fill="var(--thumb-dim)" />

      {/* the open page being typed */}
      <rect x="404" y="60" width="336" height="300" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="2.5" />
      <line x1="572" y1="72" x2="572" y2="348" stroke="var(--thumb-edge)" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const y = 104 + i * 34;
        const w = i % 3 === 2 ? 108 : 140;
        return (
          <g key={i}>
            <rect x="428" y={y} width={w} height="9" rx="4.5" fill="var(--thumb-dim)" opacity="0.55" />
            <rect x="596" y={y} width={w} height="9" rx="4.5" fill="var(--thumb-dim)" opacity="0.55" />
            {/* the left column fills in as it is typed */}
            <rect
              className={`${ns}-fill`}
              x="428"
              y={y}
              height="9"
              rx="4.5"
              width={w}
              fill="#0EA5E9"
              style={{ ["--w" as string]: `${w}px`, animationDelay: `${i * 0.35}s` }}
            />
          </g>
        );
      })}
      <rect className={`${ns}-caret`} x="428" y="308" width="10" height="24" rx="2" fill="#0EA5E9" />
    </svg>
  );
};

/* ───────────────────────── 10. Exams ───────────────────────── */

export const ExamsScene: React.FC<SceneProps> = ({ className }) => {
  const ns = useNs();
  const CARDS = [
    { hue: "#8B5CF6", x: 96, y: 150, rot: -7 },
    { hue: "#F43F5E", x: 300, y: 120, rot: 0 },
    { hue: "#6366F1", x: 504, y: 150, rot: 7 },
  ];

  return (
    <svg viewBox={VB} className={className} aria-hidden="true">
      <style>
        {motion(
          ns,
          `
          .${ns}-card { animation: ${ns}-rise 5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
          @keyframes ${ns}-rise { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
          .${ns}-tick { animation: ${ns}-pop 5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
          @keyframes ${ns}-pop { 0%,40% { transform: scale(0) } 55%,100% { transform: scale(1) } }
          `,
        )}
      </style>

      {CARDS.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot} 100 105)`}>
          <g className={`${ns}-card`} style={{ animationDelay: `${i * 0.45}s` }}>
            <rect x="0" y="0" width="200" height="210" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="2.5" />
            <path d="M0 18A18 18 0 0 1 18 0h164a18 18 0 0 1 18 18v18H0z" fill={c.hue} />
            {/* the seal */}
            <circle cx="100" cy="96" r="30" fill={c.hue} opacity="0.16" />
            <circle cx="100" cy="96" r="30" fill="none" stroke={c.hue} strokeWidth="3" />
            <path
              className={`${ns}-tick`}
              d="M86 96l10 11 19-22"
              fill="none"
              stroke={c.hue}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animationDelay: `${i * 0.45}s` }}
            />
            <rect x="52" y="150" width="96" height="9" rx="4.5" fill="var(--thumb-dim)" />
            <rect x="70" y="170" width="60" height="7" rx="3.5" fill="var(--thumb-dim)" opacity="0.6" />
          </g>
        </g>
      ))}
    </svg>
  );
};

/* Registry — the page maps its tab ids onto these. */
export const FEATURE_SCENES: Record<string, React.FC<SceneProps>> = {
  course: CourseScene,
  games: GamesScene,
  english: EnglishScene,
  hands: HandsScene,
  stats: StatsScene,
  compete: CompeteScene,
  coding: CodingScene,
  books: BooksScene,
  exams: ExamsScene,
  comfort: ComfortScene,
};
