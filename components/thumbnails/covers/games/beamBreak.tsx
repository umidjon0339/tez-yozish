import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

/**
 * Cover for `/beam-break`: the UFO holding a cute animal in its tractor beam
 * over the dune desert, with the keycap tile row the game is played on.
 */
export const BeamBreakCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const letters = (params?.keys?.length ? params.keys : ['b', 'e', 'a', 'm']).slice(0, 4);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `bb-${idPrefix}`;

  // tile row, top right — same three states the game paints: typed / current / pending
  const TILE = 34;
  const GAP = 7;
  const rowW = letters.length * TILE + (letters.length - 1) * GAP;
  const rowX = 296 - rowW / 2;
  const rowY = 26;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .bb-bob { animation: ${cls}-bob 3.2s ease-in-out infinite alternate; }
          .${cls} .bb-lift { animation: ${cls}-lift 3.2s ease-in-out infinite alternate; }
          .${cls} .bb-beam { animation: ${cls}-beam 2.4s ease-in-out infinite alternate; }
          .${cls} .bb-scan { animation: ${cls}-scan 2.2s linear infinite; }
          .${cls} .bb-lamp { animation: ${cls}-lamp 1.6s ease-in-out infinite alternate; }
          @keyframes ${cls}-bob { to { transform: translateY(-6px); } }
          @keyframes ${cls}-lift { to { transform: translateY(-9px); } }
          @keyframes ${cls}-beam { to { opacity: .95; } }
          @keyframes ${cls}-scan { from { transform: translateY(0); opacity: .85 } to { transform: translateY(96px); opacity: 0 } }
          @keyframes ${cls}-lamp { to { opacity: .35; } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <clipPath id={`${idPrefix}-cone`}>
          <path d="M86 96 L124 96 L152 208 L58 208 Z" />
        </clipPath>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FBDE6" />
          <stop offset="0.6" stopColor="#A8DCF2" />
          <stop offset="1" stopColor="#E3F3FB" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E0BB87" />
          <stop offset="1" stopColor="#C49A64" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF0F6" />
          <stop offset="0.55" stopColor="#B9C6D2" />
          <stop offset="1" stopColor="#7F8D9C" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-ray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8EF2A8" stopOpacity="0.8" />
          <stop offset="0.7" stopColor="#8EF2A8" stopOpacity="0.24" />
          <stop offset="1" stopColor="#8EF2A8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />

        {/* big low sun */}
        <circle cx="250" cy="196" r="62" fill="#FACE5A" opacity="0.3" />
        <circle cx="250" cy="196" r="34" fill="#F7C93F" />

        {/* dunes */}
        <path d="M0 208 Q 46 168 96 200 Q 150 232 208 194 Q 262 158 320 198 Q 362 226 400 200 L400 240 L0 240 Z" fill="#D9AB74" />
        <path d="M0 224 Q 64 200 136 220 Q 210 240 288 214 Q 348 194 400 218 L400 240 L0 240 Z" fill="#C08D55" />
        <rect y="208" width="400" height="32" fill={`url(#${idPrefix}-sand)`} />
        <path d="M0 208 H400" stroke="#2B2436" strokeWidth="1.6" opacity="0.28" />

        {/* palms */}
        {[[212, 0.85], [352, 1]].map(([px, sc], i) => (
          <g key={i} transform={`translate(${px} 208) scale(${sc})`}>
            <path d="M0 0 Q 4 -22 8 -44" stroke="#9C6B42" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* the frond curve is rounded to 2 decimals on purpose: Node and
                the browser can disagree on the last bit of Math.sin/cos, and
                a raw value hydrates as a mismatched `d` attribute */}
            {[-2.5, -1.6, -0.7, 0.2].map((a, j) => (
              <path
                key={j}
                d={`M8 -44 Q ${(8 + Math.cos(a) * 14).toFixed(2)} ${(-44 + Math.sin(a) * 14 - 5).toFixed(2)} ${(8 + Math.cos(a) * 24).toFixed(2)} ${(-44 + Math.sin(a) * 24 + 7).toFixed(2)}`}
                stroke={j % 2 ? '#5AA758' : '#3F8043'}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </g>
        ))}

        {/* the tractor beam */}
        <g className="bb-beam" opacity="0.8">
          <path d="M86 96 L124 96 L152 208 L58 208 Z" fill={`url(#${idPrefix}-ray)`} />
          <g clipPath={`url(#${idPrefix}-cone)`}>
            {[0, 0.73, 1.46].map((d, i) => (
              <ellipse
                key={i}
                className="bb-scan"
                cx="105"
                cy="100"
                rx="22"
                ry="4.5"
                fill="none"
                stroke="#B6FFD0"
                strokeWidth="2"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </g>
          <ellipse cx="105" cy="208" rx="46" ry="9" fill="#8EF2A8" opacity="0.35" />
        </g>

        {/* the captured animal. Placement and animation are on separate <g>s: a
            CSS transform on an SVG node replaces its transform attribute. */}
        <g transform="translate(105 156)">
          <g className="bb-lift">
            {/* ears */}
            <circle cx="-15" cy="-13" r="11" fill="#9AA7B4" stroke="#2B2436" strokeWidth="2.2" />
            <circle cx="15" cy="-13" r="11" fill="#9AA7B4" stroke="#2B2436" strokeWidth="2.2" />
            <circle cx="-15" cy="-13" r="5.5" fill="#D9C8C4" />
            <circle cx="15" cy="-13" r="5.5" fill="#D9C8C4" />
            {/* legs */}
            <rect x="-13" y="20" width="6" height="13" rx="3" fill="#74818F" stroke="#2B2436" strokeWidth="2" />
            <rect x="7" y="20" width="6" height="13" rx="3" fill="#74818F" stroke="#2B2436" strokeWidth="2" />
            {/* body + head */}
            <ellipse cx="0" cy="12" rx="19" ry="16" fill="#9AA7B4" stroke="#2B2436" strokeWidth="2.4" />
            <ellipse cx="2" cy="16" rx="11" ry="10" fill="#D9C8C4" opacity="0.8" />
            <circle cx="0" cy="-4" r="15" fill="#9AA7B4" stroke="#2B2436" strokeWidth="2.4" />
            {/* wide, worried eyes */}
            <circle cx="-5" cy="-6" r="4.4" fill="#FFFFFF" stroke="#2B2436" strokeWidth="1.3" />
            <circle cx="6" cy="-6" r="4.4" fill="#FFFFFF" stroke="#2B2436" strokeWidth="1.3" />
            <circle cx="-4" cy="-8" r="2.3" fill="#2B2334" />
            <circle cx="7" cy="-8" r="2.3" fill="#2B2334" />
            {/* trunk */}
            <path d="M1 3 C 7 8, 10 16, 5 21" stroke="#9AA7B4" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            {/* brows */}
            <path d="M-10 -13 L-2 -11" stroke="#2B2436" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M11 -13 L3 -11" stroke="#2B2436" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        {/* the saucer */}
        <g className="bb-bob">
          <ellipse cx="105" cy="92" rx="62" ry="16" fill="#8EF2A8" opacity="0.3" />
          <path d="M88 74 A 18 17 0 0 1 122 74 Z" fill="#A8F2E4" stroke="#2B2436" strokeWidth="2.2" />
          <ellipse cx="97" cy="68" rx="3" ry="4.5" fill="#FFFFFF" opacity="0.65" transform="rotate(-28 97 68)" />
          <ellipse cx="105" cy="80" rx="48" ry="13" fill={`url(#${idPrefix}-hull)`} stroke="#2B2436" strokeWidth="2.4" />
          <ellipse cx="105" cy="83" rx="36" ry="6" fill="#FFFFFF" opacity="0.3" />
          <ellipse cx="105" cy="89" rx="18" ry="4.5" fill="#8EF2A8" stroke="#2B2436" strokeWidth="1.8" />
          {[-36, -22, -8, 6, 20, 34].map((dx, i) => (
            <circle
              key={dx}
              className="bb-lamp"
              cx={105 + dx}
              cy={85 - Math.abs(dx) * 0.05}
              r="2.8"
              fill={i % 2 ? '#FFE27A' : '#8EF2A8'}
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
          <path d="M94 60 L89 51" stroke="#2B2436" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M116 60 L121 51" stroke="#2B2436" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="89" cy="49" r="2.6" fill="#FF7D7D" />
          <circle cx="121" cy="49" r="2.6" fill="#FF7D7D" />
        </g>

        {/* the keycap tile row you actually play on */}
        {letters.map((ch, i) => {
          const x = rowX + i * (TILE + GAP);
          const typed = i === 0;
          const current = i === 1;
          const fill = typed ? '#3EC97A' : current ? '#FFC93C' : '#FFFDF6';
          return (
            <g key={i}>
              {current && <rect x={x - 4} y={rowY - 4} width={TILE + 8} height={TILE + 8} rx="12" fill="#FFC93C" opacity="0.28" />}
              <rect x={x} y={rowY + 3} width={TILE} height={TILE} rx="8" fill="#2B2436" opacity="0.85" />
              <rect x={x} y={rowY} width={TILE} height={TILE} rx="8" fill={fill} stroke="#2B2436" strokeWidth="2.2" />
              <rect x={x + 5} y={rowY + 4} width={TILE - 10} height={7} rx="3.5" fill="#FFFFFF" opacity="0.4" />
              <text
                x={x + TILE / 2}
                y={rowY + TILE * 0.68}
                textAnchor="middle"
                fontSize={TILE * 0.52}
                fontWeight="900"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                style={{ fill: typed ? '#FFFFFF' : '#2B2436' }}
              >
                {String(ch).toUpperCase()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
