import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for `/games/word-forge`: the forge corridor seen from above — molten seams
 * down both lane walls, scrap-bots marching at the turret, and the two columns
 * of typed panels that are the actual game. `params.keys` supplies the panel
 * words (first two land in the perk column, the rest in the weapon column);
 * `params.accentColor` is ignored — the forge palette is fixed.
 */
export const WordForgeCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const words = params?.keys?.length ? params.keys : ['SHARP', 'BLAST', 'SNIPER', 'PISTOL'];
  const perks = words.slice(0, 2);
  const weapons = words.slice(2).length ? words.slice(2) : ['SNIPER', 'PISTOL'];
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `wf-${idPrefix}`;

  // one panel plate: word on the left, level number on the right, level pips
  const panel = (
    x: number, y: number, w: number, word: string, level: number,
    weapon: boolean, lit: boolean,
  ) => (
    /* the two columns are mapped, so each plate carries its own key —
       x/y are unique per plate */
    <g key={`${weapon ? 'w' : 'p'}${x}-${y}`}>
      <rect x={x + 2} y={y + 3} width={w} height="26" rx="4" fill="#000000" opacity="0.45" />
      <rect x={x} y={y} width={w} height="26" rx="4" fill={`url(#${idPrefix}-${weapon ? 'weap' : 'perk'})`} />
      {lit && <rect x={x} y={y} width={w * 0.55} height="26" rx="4" fill={weapon ? '#FFB03A' : '#B98CFF'} opacity="0.45" />}
      <rect x={x + 0.8} y={y + 0.8} width={w - 1.6} height="24.4" rx="4" fill="none" stroke={lit ? '#FFFFFF' : weapon ? '#FFB03A' : '#B98CFF'} strokeOpacity={lit ? 1 : 0.45} strokeWidth={lit ? 2 : 1.2} />
      <text x={x + 8} y={y + 16.5} fontSize="12" fontWeight="800" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: lit ? '#FFFFFF' : weapon ? '#FFE4BD' : '#E6DCFF' }}>
        {word}
      </text>
      <text x={x + w - 7} y={y + 16.5} textAnchor="end" fontSize="11" fontWeight="800" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: '#FFFFFF' }} opacity="0.6">
        {level}
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i} x={x + 8 + i * ((w - 30) / 5)} y={y + 20} width={(w - 30) / 5 - 2} height="2.4"
          fill={i < level ? (weapon ? '#FFB03A' : '#B98CFF') : '#000000'} opacity={i < level ? 1 : 0.4}
        />
      ))}
    </g>
  );

  // one scrap-bot, top-down: red body with a warm visor facing the gate
  const bot = (x: number, y: number, r: number) => (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="1.5" cy="2.5" rx={r * 1.02} ry={r * 0.8} fill="#000000" opacity="0.35" />
      <rect x={-r * 0.8} y={-r * 0.72} width={r * 1.6} height={r * 1.44} rx={r * 0.3} fill="#E0503C" stroke="#7D2D24" strokeWidth="2" />
      <rect x={-r * 0.46} y={r * 0.14} width={r * 0.92} height={r * 0.3} rx={r * 0.14} fill="#FFCA6A" />
    </g>
  );

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .wf-march { animation: ${cls}-march 3.6s linear infinite; }
          .${cls} .wf-shot { animation: ${cls}-shot 1s ease-out infinite; }
          .${cls} .wf-fire { animation: ${cls}-fire .55s ease-in-out infinite alternate; }
          .${cls} .wf-seam { animation: ${cls}-seam 2.4s linear infinite; }
          @keyframes ${cls}-march { from { transform: translateY(-22px); } to { transform: translateY(22px); } }
          @keyframes ${cls}-shot { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 70%, 100% { transform: translateY(-118px); opacity: 0 } }
          @keyframes ${cls}-fire { from { transform: scale(.86); opacity: .75 } to { transform: scale(1.14); opacity: 1 } }
          @keyframes ${cls}-seam { from { transform: translateY(0) } to { transform: translateY(28px) } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <clipPath id={`${idPrefix}-lane`}>
          <rect x="146" y="0" width="108" height="212" />
        </clipPath>
        <linearGradient id={`${idPrefix}-lane-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#191411" />
          <stop offset="1" stopColor="#2F2823" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-perk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B4A86" />
          <stop offset="1" stopColor="#3A3050" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-weap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6B5236" />
          <stop offset="1" stopColor="#3F3123" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-pit`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF3C4" />
          <stop offset="0.45" stopColor="#FF7A20" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FF5A18" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        <rect width="400" height="240" fill="#100D0B" />
        <rect x="146" y="0" width="108" height="212" fill={`url(#${idPrefix}-lane-g)`} />

        {/* molten seams down both lane walls — the light source */}
        {[146, 254].map((x) => (
          <g key={x}>
            <rect x={x - 26} y="0" width="52" height="212" fill="#FF7828" opacity="0.14" />
            <g clipPath={`url(#${idPrefix}-frame)`}>
              <g className="wf-seam">
                {Array.from({ length: 9 }).map((_, i) => (
                  <rect key={i} x={x - 4} y={-28 + i * 28} width="8" height="18" rx="3" fill="#FFB450" opacity={0.5 + (i % 3) * 0.2} />
                ))}
              </g>
            </g>
            <rect x={x - 4} y="0" width="8" height="212" fill="#FF5A18" opacity="0.35" />
          </g>
        ))}

        {/* plate seams across the lane */}
        {[38, 92, 146].map((y) => (
          <line key={y} x1="146" y1={y} x2="254" y2={y} stroke="#000000" strokeOpacity="0.4" strokeWidth="1.6" />
        ))}

        {/* the marching bots */}
        <g clipPath={`url(#${idPrefix}-lane)`}>
          <g className="wf-march">
            {bot(172, 34, 13)}
            {bot(226, 20, 11)}
            {bot(198, 74, 15)}
            {bot(166, 108, 11)}
            {bot(232, 118, 13)}
          </g>
          <g className="wf-shot">
            <rect x="198" y="120" width="4" height="26" rx="2" fill="#FFFFFF" />
          </g>
        </g>

        {/* the gate wall + turret */}
        <rect x="0" y="212" width="400" height="28" fill="#2C241E" />
        <rect x="0" y="212" width="400" height="2" fill="#FFD6AA" opacity="0.18" />
        <g className="wf-fire" style={{ transformOrigin: '200px 214px' }}>
          <circle cx="200" cy="214" r="30" fill={`url(#${idPrefix}-pit)`} />
        </g>
        <g transform="translate(200 212)">
          <rect x="-4" y="-34" width="8" height="34" rx="3" fill="#E2E6EC" />
          <rect x="-6" y="-34" width="12" height="5" fill="#3D424B" />
          <circle cx="0" cy="0" r="14" fill="#6F7681" stroke="#2C3038" strokeWidth="2" />
          <circle cx="0" cy="0" r="7" fill="#C9CCD4" />
        </g>

        {/* the two typed columns — the actual game */}
        {perks.map((w, i) => panel(10, 150 - i * 32, 126, w, 3 - i, false, i === 0))}
        {weapons.map((w, i) => panel(264, 150 - i * 32, 126, w, 2 + i, true, false))}

        {/* the buffer plate */}
        <g>
          <rect x="140" y="216" width="120" height="20" rx="5" fill="#080605" opacity="0.9" />
          <rect x="140.8" y="216.8" width="118.4" height="18.4" rx="5" fill="none" stroke="#FFB03A" strokeOpacity="0.6" strokeWidth="1.5" />
          <text x="150" y="230.5" fontSize="13" fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: '#FFFFFF' }}>
            {(perks[0] ?? 'SHARP').slice(0, 2)}
            <tspan style={{ fill: '#FFFFFF' }} opacity="0.28">{(perks[0] ?? 'SHARP').slice(2)}</tspan>
          </text>
        </g>
      </g>
    </svg>
  );
};
