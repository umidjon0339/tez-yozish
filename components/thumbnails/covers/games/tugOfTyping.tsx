import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for the top-down tug-of-war at `/games/tug-of-typing`: two pullers on a mown
 * pitch with the word tiles above. `params.keys` supplies the word on the
 * tiles; `params.accentColor` is ignored (the pitch palette is fixed).
 */
export const TugOfTypingCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const word = (params?.keys?.length ? params.keys.join('') : 'pull').toUpperCase().slice(0, 5);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `tg-${idPrefix}`;
  const tileW = 32;
  const tilesX = 200 - (word.length * (tileW + 5) - 5) / 2;

  // one puller, drawn facing left and mirrored by `dir` — same stance as the game
  // `hair` doubles as the shoe/boot tone, matching the in-game kid
  const puller = (cx: number, cy: number, dir: 1 | -1, suit: string, dark: string, band: string) => (
    <g transform={`translate(${cx} ${cy}) scale(${dir} 1)`}>
      <ellipse cx="4" cy="5" rx="30" ry="13" fill="#000000" opacity="0.18" />
      {/* legs braced toward the rope */}
      <path d="M5 8 L -8 16 L -21 15" stroke={suit} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 -8 L -8 -16 L -21 -15" stroke={suit} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="-31" y="9" width="14" height="9" rx="4" fill={band} />
      <rect x="-31" y="-18" width="14" height="9" rx="4" fill={band} />
      {/* torso */}
      <rect x="2" y="-12" width="21" height="24" rx="10" fill={suit} />
      <rect x="8" y="-12" width="6" height="24" rx="3" fill={dark} />
      {/* arms to the rope */}
      <path d="M18 8 Q 2 8 -23 3" stroke="#F2C9A0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M18 -8 Q 2 -8 -23 -3" stroke="#F2C9A0" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* head: skin with hair capping the back, face toward the rope */}
      <circle cx="31" cy="0" r="13" fill="#F2C9A0" />
      <path d="M31 -13 A 13 13 0 0 1 31 13 L 33 0 Z" fill={band} />
      <circle cx="25" cy="-4.5" r="3.4" fill="#FFFFFF" />
      <circle cx="25" cy="4.5" r="3.4" fill="#FFFFFF" />
      <circle cx="23.8" cy="-4.5" r="1.8" fill="#26313F" />
      <circle cx="23.8" cy="4.5" r="1.8" fill="#26313F" />
      <ellipse cx="19.5" cy="0" rx="2.4" ry="3" fill="#DFAE83" />
    </g>
  );

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .tg-l { animation: ${cls}-l 1.1s ease-in-out infinite alternate; }
          .${cls} .tg-r { animation: ${cls}-r 1.1s ease-in-out infinite alternate; }
          .${cls} .tg-mark { animation: ${cls}-mark 1.1s ease-in-out infinite alternate; }
          .${cls} .tg-tile { animation: ${cls}-tile 1.6s ease-in-out infinite; }
          @keyframes ${cls}-l { to { transform: translateX(-7px); } }
          @keyframes ${cls}-r { to { transform: translateX(-7px); } }
          @keyframes ${cls}-mark { to { transform: translateX(-7px); } }
          @keyframes ${cls}-tile { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        {/* mown pitch */}
        <rect width="400" height="240" fill="#3F8F38" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <rect key={i} x={i * 50} y="0" width="50" height="240" fill={i % 2 === 0 ? '#47A03D' : '#3C8734'} />
        ))}
        {/* stadium bands */}
        <rect x="0" y="0" width="400" height="52" fill="#0C300E" opacity="0.55" />
        <rect x="0" y="206" width="400" height="34" fill="#0C300E" opacity="0.55" />
        <rect x="0" y="50" width="400" height="3" fill="#F4FBF2" opacity="0.85" />
        <rect x="0" y="206" width="400" height="3" fill="#F4FBF2" opacity="0.85" />
        {/* chalk lines */}
        <rect x="110" y="52" width="7" height="154" fill="#F4FBF2" opacity="0.85" />
        <rect x="283" y="52" width="7" height="154" fill="#F4FBF2" opacity="0.85" />
        <rect x="198" y="52" width="4" height="154" fill="#F4FBF2" opacity="0.45" />

        {/* rope + marker */}
        <g className="tg-mark">
          <rect x="150" y="126" width="100" height="7" rx="3.5" fill="#8A5F2B" />
          <rect x="150" y="127" width="100" height="3" rx="1.5" fill="#D6A256" />
          <rect x="193" y="121" width="15" height="15" rx="2" transform="rotate(45 200 129)" fill="#FACC15" stroke="#A16207" strokeWidth="2" />
        </g>

        {/* the two pullers */}
        <g className="tg-l">{puller(120, 129, -1, '#E03B3B', '#B12727', '#C96A2A')}</g>
        <g className="tg-r">{puller(280, 129, 1, '#2F7FD6', '#1F5DA1', '#3B2A20')}</g>

        {/* word tiles */}
        {word.split('').map((ch, i) => (
          <g key={i} className="tg-tile" style={{ animationDelay: `${i * 120}ms` }}>
            <rect x={tilesX + i * (tileW + 5)} y="10" width={tileW} height="34" rx="7" fill={i === 0 ? '#34D399' : i === 1 ? '#FBBF24' : '#FFFFFF'} stroke="#14344F" strokeWidth="2.5" />
            <text x={tilesX + i * (tileW + 5) + tileW / 2} y="34" textAnchor="middle" fontSize="21" fontWeight="900" fontFamily="monospace" style={{ fill: '#14344F' }}>
              {ch}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
