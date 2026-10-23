import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

// ============================================================================
// RHINO DASH COVER — the /games poster for the cliff-top typing duel: two
// rhinos shoving head-to-head on a striated cliff island over the ocean,
// with the game's word tiles above. Always gently animated (push wiggle,
// drifting clouds, bobbing foam); honors prefers-reduced-motion.
// ============================================================================
const rhinoFigure = (
  x: number, y: number, s: number, facing: 1 | -1,
  colors: { body: string; fold: string; horn: string; hoof: string; eye: string },
  animClass?: string,
) => (
  <g transform={facing === 1 ? `translate(${x} ${y}) scale(${s})` : `translate(${x + 100 * s} ${y}) scale(${-s} ${s})`}>
    <g className={animClass}>
      {/* tail */}
      <path d="M 6 26 Q -6 30 -4 42" stroke={colors.fold} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="-4" cy="43" r="3.5" fill={colors.hoof} />
      {/* far legs */}
      <rect x="18" y="42" width="11" height="18" rx="5" fill={colors.fold} />
      <rect x="52" y="42" width="11" height="18" rx="5" fill={colors.fold} />
      {/* body */}
      <ellipse cx="40" cy="30" rx="36" ry="24" fill={colors.body} />
      {/* skin folds */}
      <path d="M 26 8 Q 30 20 26 40" stroke={colors.fold} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M 48 6 Q 52 20 48 42" stroke={colors.fold} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* near legs */}
      <rect x="12" y="46" width="12" height="18" rx="5" fill={colors.body} />
      <rect x="46" y="46" width="12" height="18" rx="5" fill={colors.body} />
      <rect x="11" y="58" width="14" height="7" rx="3" fill={colors.hoof} />
      <rect x="45" y="58" width="14" height="7" rx="3" fill={colors.hoof} />
      {/* head lowered into the shove */}
      <g transform="translate(66 22) rotate(12)">
        <ellipse cx="12" cy="10" rx="17" ry="13" fill={colors.body} />
        <ellipse cx="24" cy="15" rx="9" ry="7" fill={colors.body} />
        {/* horns */}
        <path d="M 28 6 L 40 -8 L 33 10 Z" fill={colors.horn} />
        <path d="M 18 -2 L 24 -12 L 26 2 Z" fill={colors.horn} />
        {/* ear */}
        <path d="M -2 -2 L 3 -12 L 8 -1 Z" fill={colors.fold} />
        {/* eye */}
        <circle cx="10" cy="4" r="3.2" fill={colors.eye} />
        <circle cx="11" cy="3" r="1" fill="#FFFFFF" />
      </g>
    </g>
  </g>
);

export const RhinoDashCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const word = (params?.keys?.length ? params.keys.join('') : 'dash').toUpperCase().slice(0, 6);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `rd-${idPrefix}`;
  const tileW = 34;
  const tilesX = 200 - (word.length * (tileW + 5) - 5) / 2;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .rd-push-l { animation: ${cls}-pushl .5s ease-in-out infinite alternate; }
          .${cls} .rd-push-r { animation: ${cls}-pushr .5s ease-in-out infinite alternate; }
          .${cls} .rd-cloud { animation: ${cls}-cloud 8s ease-in-out infinite alternate; }
          .${cls} .rd-foam { animation: ${cls}-foam 3.2s ease-in-out infinite alternate; }
          .${cls} .rd-tile { animation: ${cls}-tile 1.6s ease-in-out infinite; }
          @keyframes ${cls}-pushl { to { transform: translateX(4px); } }
          @keyframes ${cls}-pushr { to { transform: translateX(-4px); } }
          @keyframes ${cls}-cloud { to { transform: translateX(-18px); } }
          @keyframes ${cls}-foam { to { transform: translateX(10px); } }
          @keyframes ${cls}-tile { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5FB9EF" />
          <stop offset="1" stopColor="#C8EAFB" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        {/* sky, sun, clouds */}
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />
        <circle cx="338" cy="44" r="26" fill="#FFE9A8" opacity="0.5" />
        <circle cx="338" cy="44" r="16" fill="#FFF3C4" />
        <g className="rd-cloud" fill="#FFFFFF" opacity="0.85">
          <rect x="46" y="34" width="54" height="12" rx="6" />
          <rect x="60" y="25" width="30" height="12" rx="6" />
        </g>
        <g className="rd-cloud" style={{ animationDelay: '-4s' }} fill="#FFFFFF" opacity="0.65">
          <rect x="196" y="56" width="42" height="10" rx="5" />
          <rect x="296" y="72" width="48" height="10" rx="5" />
        </g>

        {/* ocean */}
        <rect x="0" y="196" width="400" height="44" fill="#2F9FE0" />
        <g className="rd-foam" fill="#BFE6FA" opacity="0.8">
          <rect x="18" y="206" width="46" height="5" rx="2.5" />
          <rect x="120" y="216" width="38" height="5" rx="2.5" />
          <rect x="330" y="208" width="44" height="5" rx="2.5" />
        </g>

        {/* cliff island */}
        <g>
          <rect x="76" y="140" width="248" height="66" fill="#D9AD76" />
          {/* striations */}
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <rect key={i} x={86 + i * 34} y="146" width={16 + (i % 3) * 5} height={50 - (i % 2) * 8} rx="5" fill={i % 2 === 0 ? '#C89759' : '#E0B884'} />
          ))}
          {/* grass top */}
          <rect x="66" y="128" width="268" height="18" rx="8" fill="#4EB84A" />
          <rect x="66" y="128" width="268" height="8" rx="4" fill="#68CF58" />
          {/* foam at base */}
          <ellipse className="rd-foam" cx="200" cy="206" rx="140" ry="7" fill="#DFF6FF" opacity="0.7" />
        </g>

        {/* the duel */}
        {rhinoFigure(64, 88, 0.62, 1, { body: '#AEB8C2', fold: '#96A1AC', horn: '#F2E8CF', hoof: '#5D6670', eye: '#1F2937' }, 'rd-push-l')}
        {rhinoFigure(216, 88, 0.62, -1, { body: '#5D646C', fold: '#4A5057', horn: '#E0D0AB', hoof: '#31363C', eye: '#DC2626' }, 'rd-push-r')}
        {/* clash puff */}
        <g fill="#FFFFFF" opacity="0.8">
          <circle cx="196" cy="132" r="6" />
          <circle cx="206" cy="126" r="4.5" />
          <circle cx="188" cy="124" r="4" />
        </g>

        {/* word tiles */}
        {word.split('').map((ch, i) => (
          <g key={i} className="rd-tile" style={{ animationDelay: `${i * 120}ms` }}>
            <rect x={tilesX + i * (tileW + 5)} y="22" width={tileW} height="40" rx="8" fill={i === 0 ? '#FCD34D' : '#FFFFFF'} stroke="#14344F" strokeWidth="2.5" />
            <text x={tilesX + i * (tileW + 5) + tileW / 2} y="50" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="monospace" style={{ fill: '#14344F' }}>
              {ch}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
