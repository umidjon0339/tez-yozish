import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for `/star-type`: enemy drones diving on the cyan ship over a dark
 * starfield, one word locked on (amber, remaining letters only) and the rest
 * white. `params.keys` supplies the words; `params.accentColor` is ignored
 * (the space palette is fixed).
 */
export const StarTypeCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const words = params?.keys?.length ? params.keys : ['star', 'type', 'wave'];
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `st-${idPrefix}`;

  // one drone: dark disc in a glowing amber ring with its word on a black plate
  const drone = (cx: number, cy: number, r: number, word: string, locked: number) => {
    const charW = 7.6;
    const boxW = word.length * charW + 10;
    const bx = cx - r * 0.4;
    const by = cy + r * 0.6;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="#120D0A" stroke="#FF9D2E" strokeWidth="2.2" />
        <path
          d={`M${cx - r * 0.5} ${cy - r * 0.25} A ${r * 0.5} ${r * 0.5} 0 0 1 ${cx + r * 0.35} ${cy - r * 0.35}`}
          stroke="#FFD08A" strokeWidth="1.4" fill="none"
        />
        <path d={`M${cx} ${cy + r * 0.45} L${cx - r * 0.3} ${cy - r * 0.2} L${cx + r * 0.3} ${cy - r * 0.2} Z`} fill="#FFD08A" />
        <rect x={bx} y={by} width={boxW} height="17" fill="#000000" />
        <text x={bx + 5} y={by + 12.5} fontSize="12.5" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: locked ? '#FF9D2E' : '#FFFFFF' }}>
          {locked ? word.slice(locked) : word}
        </text>
      </g>
    );
  };

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .st-dive { animation: ${cls}-dive 3.4s ease-in infinite; }
          .${cls} .st-bolt { animation: ${cls}-bolt 1.3s ease-out infinite; }
          .${cls} .st-flare { animation: ${cls}-flare .7s ease-in-out infinite alternate; }
          @keyframes ${cls}-dive { from { transform: translateY(-14px); } to { transform: translateY(14px); } }
          @keyframes ${cls}-bolt { 0% { transform: translate(0,0); opacity: 0 } 12% { opacity: 1 } 65%, 100% { transform: translate(-78px,-118px); opacity: 0 } }
          @keyframes ${cls}-flare { to { transform: scaleY(1.5); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <linearGradient id={`${idPrefix}-space`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A1A1C" />
          <stop offset="0.5" stopColor="#0D2426" />
          <stop offset="1" stopColor="#08181A" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-neb`} cx="0.28" cy="0.3" r="0.5">
          <stop offset="0" stopColor="#468C96" stopOpacity="0.22" />
          <stop offset="1" stopColor="#468C96" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        <rect width="400" height="240" fill={`url(#${idPrefix}-space)`} />
        <rect width="400" height="240" fill={`url(#${idPrefix}-neb)`} />

        {/* the drifting grid, tilted like the game's */}
        <g transform="rotate(-3.2 200 120)" opacity="0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`v${i}`} x1={-20 + i * 34} y1="-30" x2={-20 + i * 34} y2="270" stroke="#94C4C0" strokeOpacity="0.12" strokeWidth="1" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h${i}`} x1="-30" y1={-20 + i * 34} x2="430" y2={-20 + i * 34} stroke="#94C4C0" strokeOpacity="0.12" strokeWidth="1" />
          ))}
        </g>

        {/* stars */}
        {[[34, 42], [92, 24], [158, 66], [232, 30], [296, 58], [352, 38], [66, 128], [206, 118],
        [316, 142], [382, 106], [22, 190], [128, 176], [252, 196], [368, 182]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#DFF6FF" opacity={0.25 + (i % 4) * 0.15} />
        ))}

        {/* three diving drones — the middle one is locked, so its remaining
            letters are amber and the typed prefix is simply not drawn */}
        <g className="st-dive">{drone(70, 52, 11, words[0] ?? 'star', 0)}</g>
        <g className="st-dive" style={{ animationDelay: '-1.2s' }}>{drone(196, 40, 13, words[1] ?? 'type', 2)}</g>
        <g className="st-dive" style={{ animationDelay: '-2.4s' }}>{drone(312, 74, 10, words[2] ?? 'wave', 0)}</g>

        {/* a bolt on its way up to the locked drone */}
        <g className="st-bolt">
          <rect x="238" y="150" width="4" height="30" rx="2" transform="rotate(33 240 165)" fill="#FFFFFF" />
        </g>

        {/* the player ship */}
        <g transform="translate(232 196)" stroke="#3FF0D0" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M0 -24 L6.5 -7 L5.5 11 L-5.5 11 L-6.5 -7 Z" />
          <path d="M-6.5 -5 L-22 6 L-18 13 L-5.5 9" />
          <path d="M6.5 -5 L22 6 L18 13 L5.5 9" />
          <path d="M0 -16 L3.2 -5 L-3.2 -5 Z" />
          <g className="st-flare">
            <path d="M-3.6 11 L3.6 11 L0 26 Z" fill="#C8FFF4" stroke="none" />
          </g>
        </g>

        {/* the wave badge, bottom right, exactly like the game's */}
        <g transform="translate(366 206)">
          <path d="M0 -14 L12.1 -7 L12.1 7 L0 14 L-12.1 7 L-12.1 -7 Z" fill="#F5C518" />
          <text x="0" y="5" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: '#1A1400' }}>3</text>
        </g>
      </g>
    </svg>
  );
};
