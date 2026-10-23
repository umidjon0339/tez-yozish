import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for the 2D balloon game at `/games/sky-hop`: the ninja dangling from a
 * balloon with the labelled chain climbing away over the ocean.
 * `params.keys` supplies the letters on the chain, `params.accentColor` is ignored
 * (the sky palette is fixed so the card matches the game's first stage).
 */
export const SkyHopCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const letters = (params?.keys?.length ? params.keys : ['f', 'j', 'd', 'k']).slice(0, 4);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `sh-${idPrefix}`;
  const hues = [
    { body: '#F2764F', dark: '#CF5533' },
    { body: '#F7C34A', dark: '#D69A24' },
    { body: '#7D6BE0', dark: '#5C4CBA' },
    { body: '#4FBF7A', dark: '#2F9A58' },
  ];

  const balloon = (x: number, y: number, r: number, hue: { body: string; dark: string }, label?: string, glow?: boolean) => (
    <g>
      {glow && <circle cx={x} cy={y} r={r * 1.75} fill="#FFFFFF" opacity="0.28" />}
      <path
        d={`M ${x} ${y - r} C ${x + r * 1.02} ${y - r} ${x + r * 1.06} ${y + r * 0.35} ${x + r * 0.2} ${y + r * 1.22}
            Q ${x} ${y + r * 1.38} ${x - r * 0.2} ${y + r * 1.22}
            C ${x - r * 1.06} ${y + r * 0.35} ${x - r * 1.02} ${y - r} ${x} ${y - r} Z`}
        fill={hue.body}
      />
      <path d={`M ${x} ${y - r} Q ${x - r * 0.8} ${y} ${x - r * 0.15} ${y + r * 1.22}`} stroke={hue.dark} strokeWidth="1.6" opacity="0.35" fill="none" />
      <ellipse cx={x - r * 0.34} cy={y - r * 0.4} rx={r * 0.19} ry={r * 0.3} fill="#FFFFFF" opacity="0.5" transform={`rotate(-25 ${x - r * 0.34} ${y - r * 0.4})`} />
      <path d={`M ${x - r * 0.16} ${y + r * 1.28} L ${x + r * 0.16} ${y + r * 1.28} L ${x} ${y + r * 1.5} Z`} fill={hue.dark} />
      {label && (
        <text x={x} y={y + r * 0.28} textAnchor="middle" fontSize={r * 0.95} fontWeight="900" fontFamily="monospace" style={{ fill: '#FFFFFF' }}>
          {label.toUpperCase()}
        </text>
      )}
    </g>
  );

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .sh-bob { animation: ${cls}-bob 2.8s ease-in-out infinite alternate; }
          .${cls} .sh-bob2 { animation: ${cls}-bob 2.2s ease-in-out infinite alternate; }
          .${cls} .sh-cloud { animation: ${cls}-cloud 9s linear infinite; }
          .${cls} .sh-foam { animation: ${cls}-foam 3.4s ease-in-out infinite alternate; }
          .${cls} .sh-glow { animation: ${cls}-glow 1.3s ease-in-out infinite alternate; }
          @keyframes ${cls}-bob { to { transform: translateY(-7px); } }
          @keyframes ${cls}-cloud { to { transform: translateX(-70px); } }
          @keyframes ${cls}-foam { to { transform: translateX(12px); } }
          @keyframes ${cls}-glow { to { opacity: .45; transform: scale(1.08); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5CB2EC" />
          <stop offset="0.6" stopColor="#9ED8F6" />
          <stop offset="1" stopColor="#D9F1FD" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3BA3DD" />
          <stop offset="1" stopColor="#1F7FBC" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />
        <circle cx="330" cy="40" r="40" fill="#FFF3C4" opacity="0.35" />
        <circle cx="330" cy="40" r="20" fill="#FFF6D8" />

        {/* clouds */}
        <g className="sh-cloud" fill="#FFFFFF" opacity="0.75">
          <ellipse cx="70" cy="52" rx="30" ry="14" />
          <ellipse cx="92" cy="46" rx="20" ry="12" />
          <ellipse cx="250" cy="30" rx="26" ry="12" />
          <ellipse cx="420" cy="60" rx="28" ry="13" />
        </g>

        {/* far hills + sea */}
        <path d="M0 196 Q 60 150 120 194 Q 190 148 260 194 Q 330 154 400 196 L 400 240 L 0 240 Z" fill="#8EC9E8" opacity="0.6" />
        <rect x="0" y="196" width="400" height="44" fill={`url(#${idPrefix}-sea)`} />
        <g className="sh-foam" fill="#DFF6FF" opacity="0.75">
          <rect x="20" y="206" width="52" height="4" rx="2" />
          <rect x="140" y="218" width="44" height="4" rx="2" />
          <rect x="300" y="210" width="56" height="4" rx="2" />
        </g>

        {/* the labelled chain, climbing away to the right */}
        <g className="sh-bob2">{balloon(196, 96, 25, hues[1], letters[1], true)}</g>
        <g className="sh-bob">{balloon(268, 80, 22, hues[2], letters[2])}</g>
        <g className="sh-bob2">{balloon(336, 66, 20, hues[3], letters[3])}</g>

        {/* target chevrons */}
        <g className="sh-glow" fill="#A3E635">
          <path d="M164 96 L 156 89 L 156 103 Z" />
          <path d="M228 96 L 236 89 L 236 103 Z" />
        </g>

        {/* the hero on the ridden balloon */}
        <g className="sh-bob">
          {balloon(104, 108, 28, hues[0])}
          <path d="M97 146 Q 95 158 99 168" stroke="#7A542A" strokeWidth="2" fill="none" />
          <path d="M111 146 Q 113 158 109 168" stroke="#7A542A" strokeWidth="2" fill="none" />
          {/* ninja */}
          <g>
            <path d="M100 186 q -3 8 -9 12" stroke="#26374F" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M108 186 q 3 8 9 11" stroke="#26374F" strokeWidth="6" strokeLinecap="round" fill="none" />
            <rect x="96" y="170" width="16" height="18" rx="6" fill="#26374F" />
            <rect x="96" y="180" width="16" height="4" rx="2" fill="#10B981" />
            <path d="M100 170 q -6 -8 -2 -14" stroke="#26374F" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M108 170 q 6 -8 2 -14" stroke="#26374F" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="104" cy="160" r="9" fill="#26374F" />
            <rect x="97" y="157" width="14" height="7" rx="3.4" fill="#F2C9A0" />
            <circle cx="101" cy="160.5" r="1.5" fill="#1F2937" />
            <circle cx="107" cy="160.5" r="1.5" fill="#1F2937" />
            <rect x="94.5" y="153" width="19" height="4" rx="2" fill="#10B981" />
            <path d="M95 155 Q 84 156 76 162" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* a crow, far off */}
        <g fill="#1F2733" opacity="0.55">
          <ellipse cx="46" cy="96" rx="8" ry="4" />
          <path d="M44 94 Q 46 84 56 82 Q 48 90 49 95 Z" fill="#2B3646" />
        </g>
      </g>
    </svg>
  );
};
