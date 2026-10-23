import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for `/alien-drop`: alien drop-pods falling on the colony, each carrying
 * one letter, with the space-suit hero below aiming his blaster at the lowest
 * one. `params.keys` supplies the letters on the pods; `params.accentColor` is
 * ignored (the alien-sky palette is fixed).
 */
export const AlienDropCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const letters = (params?.keys?.length ? params.keys : ['a', 'd', 'r']).slice(0, 3);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `ad-${idPrefix}`;

  // one drop-pod: charcoal capsule, red bat wings, braking flame, lit porthole
  const pod = (cx: number, cy: number, ch: string, r: number, gold: boolean) => (
    <g transform={`translate(${cx} ${cy})`}>
      {/* braking flame */}
      <path d={`M${-r * 0.16} ${-r} Q 0 ${-r * 1.5} ${r * 0.16} ${-r}`} fill="#FF9D3C" />
      {/* wings */}
      {[-1, 1].map(d => (
        <path
          key={d}
          d={`M${d * r * 0.5} ${-r * 0.16} L${d * r * 1.32} ${-r * 0.84} L${d * r * 1} ${-r * 0.38} L${d * r * 1.24} ${-r * 0.18} L${d * r * 0.5} ${r * 0.06} Z`}
          fill={gold ? '#FFF0C0' : '#D63A3A'}
          stroke="#2B2436"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
      {/* hull */}
      <ellipse cx="0" cy="0" rx={r * 0.9} ry={r} fill={gold ? '#F2B134' : '#4A4F5C'} stroke="#2B2436" strokeWidth="2.5" />
      <ellipse cx={-r * 0.32} cy={-r * 0.4} rx={r * 0.36} ry={r * 0.26} fill={gold ? '#FFD977' : '#6D7484'} opacity="0.55" />
      <rect x={-r * 0.42} y={-r * 0.9} width={r * 0.84} height={r * 0.3} rx={r * 0.14} fill={gold ? '#C2861D' : '#2E323C'} />
      <circle cx="0" cy={-r * 0.75} r={r * 0.13} fill="#8EF06A" />
      {/* porthole with the letter */}
      <circle cx="0" cy={r * 0.2} r={r * 0.55} fill="#20232B" />
      <circle cx="0" cy={r * 0.2} r={r * 0.47} fill={gold ? '#FFF3C4' : '#FFB92E'} />
      <text x="0" y={r * 0.2} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.68} fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" style={{ fill: '#241F18' }}>
        {ch.toUpperCase()}
      </text>
    </g>
  );

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .ad-fall { animation: ${cls}-fall 3s ease-in infinite; }
          .${cls} .ad-bolt { animation: ${cls}-bolt 1.4s ease-out infinite; }
          .${cls} .ad-bob { animation: ${cls}-bob 2.6s ease-in-out infinite alternate; }
          @keyframes ${cls}-fall { from { transform: translateY(-16px); } to { transform: translateY(16px); } }
          @keyframes ${cls}-bolt { 0% { transform: translate(0,0); opacity: 0 } 15% { opacity: 1 } 70%, 100% { transform: translate(-52px,-104px); opacity: 0 } }
          @keyframes ${cls}-bob { to { transform: translateY(-4px); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2FB98A" />
          <stop offset="0.55" stopColor="#6ED37F" />
          <stop offset="1" stopColor="#B8E86A" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2622A" />
          <stop offset="1" stopColor="#96271C" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />
        {/* the big pale planet */}
        <circle cx="344" cy="72" r="58" fill="#A8DD7A" />
        <path d="M292 56 H396 M290 78 H398 M296 100 H392" stroke="#7FBE5C" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
        {/* rock spires */}
        <path d="M-10 196 L28 118 L54 150 L78 96 L104 196 Z" fill="#D4531C" />
        <path d="M118 196 L152 108 L176 146 L198 122 L226 196 Z" fill="#F3762A" />
        <path d="M240 196 L268 130 L292 160 L318 118 L346 196 Z" fill="#D4531C" />
        {/* ground */}
        <rect x="0" y="186" width="400" height="54" fill={`url(#${idPrefix}-ground)`} />
        <rect x="0" y="228" width="400" height="12" fill="#F5709B" />

        {/* falling pods */}
        <g className="ad-fall">{pod(96, 62, letters[0] ?? 'a', 22, false)}</g>
        <g className="ad-fall" style={{ animationDelay: '-1.1s' }}>{pod(214, 44, letters[1] ?? 'd', 20, true)}</g>
        <g className="ad-fall" style={{ animationDelay: '-2.2s' }}>{pod(312, 86, letters[2] ?? 'r', 19, false)}</g>

        {/* the blaster bolt on its way to the first pod */}
        <g className="ad-bolt">
          <rect x="228" y="150" width="7" height="26" rx="3.5" transform="rotate(26 231 163)" fill="#FFFFFF" />
        </g>

        {/* The hero, facing the pod he is shooting. The animated class goes on an
            OUTER wrapper with no transform attribute: a CSS `transform` keyframe
            replaces an element's `transform` attribute outright, so animating the
            same node that carries `translate(...)` would snap him to the origin. */}
        <g transform="translate(268 198) scale(0.88)"><g className="ad-bob">
          <ellipse cx="0" cy="2" rx="26" ry="6" fill="#000000" opacity="0.22" />
          <rect x="14" y="-46" width="12" height="26" rx="5" fill="#B6C6D5" stroke="#2B2436" strokeWidth="2" />
          <path d="M-5 -26 L-12 -4 M5 -26 L12 -4" stroke="#B6C6D5" strokeWidth="8" strokeLinecap="round" />
          <rect x="-19" y="-9" width="15" height="9" rx="4" fill="#FF6B4A" stroke="#2B2436" strokeWidth="2" />
          <rect x="4" y="-9" width="15" height="9" rx="4" fill="#FF6B4A" stroke="#2B2436" strokeWidth="2" />
          <rect x="-15" y="-52" width="30" height="34" rx="11" fill="#EEF4F9" stroke="#2B2436" strokeWidth="2.5" />
          <rect x="-9" y="-42" width="18" height="10" rx="4" fill="#2B3A4A" />
          <rect x="-7" y="-40" width="10" height="6" rx="3" fill="#8FF5C8" />
          <rect x="-15" y="-24" width="30" height="6" rx="3" fill="#FF6B4A" />
          <circle cx="0" cy="-68" r="17" fill="#EEF4F9" stroke="#2B2436" strokeWidth="2.5" />
          <ellipse cx="-1" cy="-67" rx="12" ry="10" fill="#2AA6E0" />
          <circle cx="-1" cy="-65" r="9" fill="#F6CBA4" />
          <circle cx="-4" cy="-68" r="1.9" fill="#2B2436" />
          <circle cx="3" cy="-68" r="1.9" fill="#2B2436" />
          <path d="M-3 -61 H3" stroke="#2B2436" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-3 -84 L3 -84 L0 -91 Z" fill="#FF6B4A" />
          {/* the blaster, aimed up-left at the falling pod */}
          <g transform="rotate(-32 -20 -46)">
            <rect x="-28" y="-62" width="16" height="24" rx="6" fill="#3D4A5C" stroke="#2B2436" strokeWidth="2" />
            <rect x="-27" y="-88" width="14" height="28" rx="5" fill="#63748C" stroke="#2B2436" strokeWidth="2" />
            <rect x="-33" y="-76" width="5" height="13" rx="2" fill="#FF6B4A" />
            <ellipse cx="-20" cy="-88" rx="8" ry="4" fill="#8FF5C8" />
          </g>
          <path d="M-9 -42 L-22 -50 M9 -42 L-16 -44" stroke="#F6CBA4" strokeWidth="6.5" strokeLinecap="round" />
        </g></g>
      </g>
    </svg>
  );
};
