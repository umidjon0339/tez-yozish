import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

export const TwoKeysFocus: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const keys = params?.keys || ['F', 'J'];
  const accent = params?.accentColor === 'emerald' ? '#34D399' : '#60A5FA';

  const n = keys.length;
  const boxW = 70;
  const boxH = 70;
  const gap = 20;
  const totalW = n * boxW + (n - 1) * gap;
  const startX = (400 - totalW) / 2;
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `tk-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       <style>{`
         @media (hover: hover) and (prefers-reduced-motion: no-preference) {
           .${cls} .tk-key { transition: transform .35s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
           .${cls}:hover .tk-key { transform: translateY(6px); }
         }
       `}</style>
       <defs>
         <filter id={`${idPrefix}-heavyGlow`} x="-50%" y="-50%" width="200%" height="200%">
           <feGaussianBlur stdDeviation="24" result="blur" />
         </filter>
         <filter id={`${idPrefix}-softShadow`} x="-10%" y="-10%" width="120%" height="120%">
           <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05"/>
         </filter>
       </defs>

       <rect width="400" height="240" rx="16" fill="#F4F4F5" />
       
       {keys.map((k, i) => {
         const cx = startX + i * (boxW + gap) + boxW / 2;
         return (
           <circle key={`glow-${i}`} cx={cx} cy="120" r="45" fill={accent} opacity="0.3" filter={`url(#${idPrefix}-heavyGlow)`} />
         );
       })}

       {keys.map((k, i) => {
         const x = startX + i * (boxW + gap);
         const cx = x + boxW / 2;
         return (
           <g key={`key-${i}`} className="tk-key" style={{ transitionDelay: `${i * 60}ms` }}>
             <rect x={x} y="85" width={boxW} height={boxH} rx="16" fill="#FFFFFF" filter={`url(#${idPrefix}-softShadow)`} />
             <text x={cx} y="130" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="monospace" style={{ fill: '#18181B' }}>{k.toUpperCase()}</text>
             <circle cx={cx} cy="144" r="3" opacity="0.3" style={{ fill: '#18181B' }} />
           </g>
         );
       })}
    </svg>
  );
};

export const RhythmLoopCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const key1 = params?.keys?.[0]?.toUpperCase() || 'F';
  const key2 = params?.keys?.[1]?.toUpperCase() || 'J';
  const accent = params?.accentColor === 'emerald' ? '#10B981' : 
                 params?.accentColor === 'amber' ? '#F59E0B' : '#3B82F6';
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `rl-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       <style>{`
         @media (hover: hover) and (prefers-reduced-motion: no-preference) {
           .${cls}:hover .rl-dash { animation: ${cls}-flow 1s linear infinite; }
           @keyframes ${cls}-flow { to { stroke-dashoffset: -28; } }
         }
       `}</style>
       <defs>
         <filter id={`${idPrefix}-floatShadow`} x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.08"/>
         </filter>
       </defs>

       <rect width="400" height="240" rx="16" fill="#F4F4F5" />

       {/* Thick Background Track */}
       <path d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke="#E4E4E7" strokeWidth="16" fill="none" />

       {/* Active Highlight Loop — dashes flow on hover */}
       <path className="rl-dash" d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="16 12" fill="none" />

       {/* Left Key Pill */}
       <g>
         <circle cx="135" cy="120" r="32" fill="#FFFFFF" filter={`url(#${idPrefix}-floatShadow)`} />
         <circle cx="135" cy="120" r="26" fill="#FAFAFA" stroke="#F4F4F5" strokeWidth="2" />
         <text x="135" y="130" textAnchor="middle" fontSize="28" fontWeight="900" fontFamily="monospace" style={{ fill: '#18181B' }}>{key1}</text>
       </g>

       {/* Right Key Pill */}
       <g>
         <circle cx="265" cy="120" r="32" fill="#FFFFFF" filter={`url(#${idPrefix}-floatShadow)`} />
         <circle cx="265" cy="120" r="26" fill="#FAFAFA" stroke="#F4F4F5" strokeWidth="2" />
         <text x="265" y="130" textAnchor="middle" fontSize="28" fontWeight="900" fontFamily="monospace" style={{ fill: '#18181B' }}>{key2}</text>
       </g>
    </svg>
  );
};

export const PrecisionTargetCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const wpm = params?.targetWPM || 15;
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `pt-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       <style>{`
         .${cls} .pt-needle { transform-origin: 200px 155px; }
         @media (hover: hover) and (prefers-reduced-motion: no-preference) {
           .${cls} .pt-needle { transition: transform .6s cubic-bezier(.34,1.56,.64,1); }
           .${cls}:hover .pt-needle { transform: rotate(22deg); }
         }
       `}</style>
       <rect width="400" height="240" rx="16" fill="#FFFBEB" />

       {/* Speedometer Background Track */}
       <path d="M 120 160 A 80 80 0 0 1 280 160" stroke="#FDE68A" strokeWidth="12" fill="none" strokeLinecap="round" />

       {/* Speedometer Active Progress (Fills up to the right) */}
       <path d="M 120 160 A 80 80 0 0 1 250 100" stroke="#F59E0B" strokeWidth="12" fill="none" strokeLinecap="round" />

       {/* Center Hub & Needle — sweeps on hover */}
       <g className="pt-needle">
         <circle cx="200" cy="155" r="8" fill="#D97706" />
         <path d="M 200 155 L 240 105" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
       </g>

       {/* Floating WPM Badge */}
       <rect x="160" y="180" width="80" height="32" rx="8" fill="#FFFFFF" stroke="#FCD34D" strokeWidth="2" />
       <text x="200" y="202" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="sans-serif" style={{ fill: '#D97706' }}>
         {wpm} <tspan fontSize="12" fontWeight="bold" style={{ fill: '#F59E0B' }}>WPM</tspan>
       </text>
    </svg>
  );
};


// ============================================================================
// 4. LESSON 4: NINJA ARENA (Boss Level)
// ============================================================================
export const NinjaArenaCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const count = params?.enemyCount || 10;

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       {/* Dark Mode Theme */}
       <rect width="400" height="240" rx="16" fill="#171717" />
       
       {/* Threat Glow */}
       <circle cx="200" cy="120" r="70" fill="#EF4444" opacity="0.15" />
       <circle cx="200" cy="120" r="40" fill="#EF4444" opacity="0.8" />
       
       <text x="200" y="128" textAnchor="middle" fontSize="24" fontWeight="900" letterSpacing="4" fontFamily="sans-serif" style={{ fill: '#FFFFFF' }}>ARENA</text>
       
       {/* Dynamic Enemy Count passed from JSON */}
       <text x="380" y="220" textAnchor="end" fontSize="12" fontWeight="bold" fontFamily="monospace" style={{ fill: '#EF4444' }}>
         THREAT LEVEL: {count} MINIONS
       </text>
    </svg>
  );
};

// ============================================================================
// 5. LESSON 5: MINION BOSS COVER — a mini-poster of the actual typing-ninja
// scene: desert track, katana-wielding player minion vs a wave of enemy
// minions carrying the lesson's letter tags (params.keys). Palette is lifted
// straight from NinjaWorld.tsx (sand #dfa276/#eeb68e, fog #f4e0c5, minion
// #FCE588, player overalls #2563EB, enemy overalls #1E293B).
// ============================================================================
export const MinionBossCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = params?.accentColor === 'emerald' ? '#10B981' :
                 params?.accentColor === 'amber' ? '#F59E0B' :
                 params?.accentColor === 'blue' ? '#3B82F6' : '#EF4444';
  const threatCount = params?.enemyCount || 20;
  const keys = params?.keys?.length ? params.keys : ['f', 'j'];
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `mb-${idPrefix}`;

  const PLAYER = { body: '#FCE588', overalls: '#2563EB', strap: '#111827', headband: '#EF4444' };
  const ENEMY = { body: '#FCE588', overalls: '#1E293B', strap: '#374151', headband: '#DC2626' };

  // One side-view minion, drawn in a 60×92 local box (origin = top-left of the
  // body). facing=-1 mirrors it. Positioning lives on the OUTER group so the
  // inner group stays free for CSS hover transforms.
  const minion = (
    x: number, y: number, s: number, facing: 1 | -1,
    c: typeof PLAYER, opts: { sword?: boolean; animClass?: string; delayMs?: number } = {},
  ) => (
    <g transform={facing === 1 ? `translate(${x} ${y}) scale(${s})` : `translate(${x + 60 * s} ${y}) scale(${-s} ${s})`}>
      <g className={opts.animClass} style={opts.delayMs ? { animationDelay: `${opts.delayMs}ms` } : undefined}>
        {/* Headband tails flying behind */}
        <path d="M 2 8 Q -13 4 -18 12 Q -9 15 2 14 Z" fill={c.headband} />
        <path d="M 2 12 Q -11 18 -15 26 Q -6 22 3 17 Z" fill={c.headband} opacity="0.85" />
        {/* Back arm */}
        <g transform="translate(5 48) rotate(28)">
          <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={c.body} />
        </g>
        {/* Legs (running pose) */}
        <g transform="translate(17 74) rotate(16)">
          <rect x="-5" y="0" width="11" height="14" rx="5" fill={c.overalls} />
          <rect x="-6" y="10" width="13" height="6" rx="3" fill="#0F172A" />
        </g>
        <g transform="translate(41 74) rotate(-12)">
          <rect x="-5" y="0" width="11" height="14" rx="5" fill={c.overalls} />
          <rect x="-6" y="10" width="13" height="6" rx="3" fill="#0F172A" />
        </g>
        {/* Body capsule */}
        <rect x="0" y="0" width="60" height="78" rx="30" fill={c.body} />
        {/* Overalls + front strap + pocket */}
        <path d="M 0 50 H 60 V 62 Q 60 78 30 78 Q 0 78 0 62 Z" fill={c.overalls} />
        <rect x="44" y="40" width="10" height="12" rx="2" fill={c.overalls} />
        <circle cx="49" cy="46" r="2" fill="#0F172A" opacity="0.55" />
        <rect x="21" y="55" width="17" height="11" rx="3" fill="#000000" opacity="0.16" />
        {/* Headband + goggle strap + single goggle (looking toward facing side) */}
        <rect x="-1" y="5" width="62" height="8" rx="4" fill={c.headband} />
        <rect x="-1" y="14" width="62" height="9" fill={c.strap} />
        <circle cx="42" cy="19" r="13" fill="#94A3B8" />
        <circle cx="42" cy="19" r="9" fill="#FFFFFF" />
        <circle cx="45" cy="19" r="3.5" fill="#111827" />
        {/* Mouth: player grins, enemies grit */}
        {opts.sword
          ? <path d="M 34 36 Q 42 42 50 36" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          : <path d="M 34 40 Q 42 35 50 40" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
        {/* Front arm (+ katana for the player) */}
        <g transform="translate(52 44) rotate(-42)">
          <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={c.body} />
        </g>
        {opts.sword && (
          <g transform="translate(66 34) rotate(-36)">
            <path d="M -2.6 4 L -2.6 -32 Q -2.6 -39 0 -41 Q 2.6 -39 2.6 -32 L 2.6 4 Z" fill="#E2E8F0" />
            <path d="M 0 -38 L 0 2" stroke="#CBD5E1" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="-8" y="4" width="16" height="5" rx="2.5" fill="#94A3B8" />
            <rect x="-3" y="9" width="6" height="14" rx="2" fill="#111827" />
            <rect x="-3" y="12" width="6" height="2.5" fill="#DC2626" />
            <rect x="-3" y="17" width="6" height="2.5" fill="#DC2626" />
          </g>
        )}
      </g>
    </g>
  );

  // Letter tag exactly like the in-game word badge (brown + amber ring)
  const tag = (x: number, y: number, rot: number, letter: string, s = 1, delayMs = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <g className="mbx-tag" style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
        <path d="M -5 12 L 5 12 L 0 19 Z" fill="#5C4033" />
        <rect x="-16" y="-14" width="32" height="28" rx="9" fill="#5C4033" stroke="#FBBF24" strokeWidth="2.5" />
        <text x="0" y="7" textAnchor="middle" fontSize="19" fontWeight="900" fontFamily="monospace" style={{ fill: '#FFFFFF' }}>
          {letter.toUpperCase()}
        </text>
      </g>
    </g>
  );

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .${cls} .mbx-spin { transform-box: fill-box; transform-origin: center; }
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls}:hover .mbx-spin { animation: ${cls}-spin .45s linear infinite; }
          .${cls}:hover .mbx-fly { animation: ${cls}-fly .45s ease-in-out infinite alternate; }
          .${cls}:hover .mbx-hop { animation: ${cls}-hop .38s ease-in-out infinite alternate; }
          .${cls}:hover .mbx-tag { animation: ${cls}-bob .55s ease-in-out infinite alternate; }
          @keyframes ${cls}-spin { to { transform: rotate(360deg); } }
          @keyframes ${cls}-fly { to { transform: translateX(26px); } }
          @keyframes ${cls}-hop { to { transform: translateY(-5px); } }
          @keyframes ${cls}-bob { to { transform: translateY(-4px); } }
        }
      `}</style>
      <defs>
        <clipPath id={`${idPrefix}-frame`}>
          <rect width="400" height="240" rx="16" />
        </clipPath>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDF1DD" />
          <stop offset="1" stopColor="#F4E0C5" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${idPrefix}-frame)`}>
        {/* Sky (game fog color) + sun + clouds */}
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />
        <circle cx="84" cy="52" r="27" fill="#FFD98E" opacity="0.35" />
        <circle cx="84" cy="52" r="17" fill="#FFE3A8" />
        <g fill="#FFFFFF" opacity="0.65">
          <rect x="130" y="32" width="52" height="11" rx="5.5" />
          <rect x="144" y="24" width="30" height="11" rx="5.5" />
          <rect x="216" y="54" width="40" height="10" rx="5" />
        </g>

        {/* Distant dunes */}
        <ellipse cx="104" cy="172" rx="140" ry="38" fill="#F0CDA2" />
        <ellipse cx="316" cy="174" rx="160" ry="50" fill="#E9BE90" />

        {/* Canyon trees (game foliage colors) */}
        <g>
          <rect x="33" y="130" width="8" height="40" rx="3" fill="#825229" />
          <circle cx="37" cy="116" r="18" fill="#2DD4BF" />
          <circle cx="24" cy="126" r="11" fill="#2DD4BF" opacity="0.85" />
          <circle cx="51" cy="125" r="10" fill="#14B8A6" />
        </g>
        <g>
          <rect x="246" y="142" width="6" height="28" rx="3" fill="#825229" />
          <circle cx="249" cy="132" r="12" fill="#16A34A" />
          <circle cx="259" cy="139" r="8" fill="#15803D" />
        </g>

        {/* Sand track: base plane, light running belt, edge stripes, speed dashes */}
        <rect x="0" y="168" width="400" height="72" fill="#DFA276" />
        <rect x="0" y="178" width="400" height="54" fill="#EEB68E" />
        <rect x="0" y="177" width="400" height="2.5" fill="#CF8852" />
        <rect x="0" y="231" width="400" height="2.5" fill="#CF8852" />
        <g fill="#CF8852" opacity="0.55">
          <rect x="152" y="196" width="28" height="5" rx="2.5" />
          <rect x="226" y="210" width="20" height="5" rx="2.5" />
          <rect x="56" y="216" width="24" height="5" rx="2.5" />
          <rect x="296" y="190" width="18" height="5" rx="2.5" />
          <rect x="180" y="224" width="16" height="5" rx="2.5" />
        </g>

        {/* Ground shadows + dust */}
        <ellipse cx="106" cy="208" rx="32" ry="6" fill="#C98D5E" opacity="0.45" />
        <ellipse cx="312" cy="212" rx="30" ry="6" fill="#C98D5E" opacity="0.45" />
        <ellipse cx="362" cy="196" rx="22" ry="5" fill="#C98D5E" opacity="0.35" />
        <g fill="#E9CBA8">
          <circle cx="62" cy="204" r="6" />
          <circle cx="52" cy="209" r="4" />
          <circle cx="352" cy="208" r="6" />
          <circle cx="364" cy="212" r="4" />
        </g>

        {/* THE HERO — blue overalls, red headband, katana */}
        {minion(76, 118, 0.95, 1, PLAYER, { sword: true })}

        {/* Shuriken mid-flight (spins + darts on hover) */}
        <g className="mbx-fly">
          <g transform="translate(206 118)">
            <g className="mbx-spin">
              <rect x="-4" y="-15" width="8" height="30" rx="3" fill="#9CA3AF" />
              <rect x="-15" y="-4" width="30" height="8" rx="3" fill="#9CA3AF" />
              <circle cx="0" cy="0" r="4.5" fill="#6B7280" />
              <circle cx="0" cy="0" r="2" fill="#F4E0C5" />
            </g>
            <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7">
              <path d="M -24 -6 H -38" />
              <path d="M -22 6 H -32" />
            </g>
          </g>
        </g>

        {/* THE MINION WAVE — dark overalls, letter tags from the lesson keys.
            Drawn back-to-front so nearer minions cover farther ones. */}
        {minion(330, 116, 0.72, -1, ENEMY, { animClass: 'mbx-hop', delayMs: 120 })}
        {minion(378, 132, 0.85, -1, ENEMY, { animClass: 'mbx-hop', delayMs: 240 })}
        {minion(278, 124, 0.9, -1, ENEMY, { animClass: 'mbx-hop' })}
        {tag(306, 96, 4, keys[0] ?? 'f')}
        {tag(352, 86, -5, keys[1] ?? keys[0] ?? 'j', 0.85, 200)}

        {/* Dynamic target-count badge (top right, matches the app chip style) */}
        <rect x="272" y="14" width="114" height="26" rx="13" fill="#FFFFFF" opacity="0.92" />
        <circle cx="288" cy="27" r="4" fill={accent} />
        <text x="336" y="31" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" style={{ fill: accent }}>
          TARGETS: {threatCount}
        </text>
      </g>
    </svg>
  );
};

// ============================================================================
// 6. COURSE: FOUNDATIONS COVER (Perfected from Reference)
// ============================================================================
export const CourseFoundationsCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       {/* 1. Background */}
       <rect width="400" height="240" fill="#139CE0" />
       
       {/* 2. Background Stars (Clean 5-point stars matching the image) */}
       <g fill="#57B8EB" opacity="0.8">
         {/* Small Stars */}
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(0.7) translate(10, 40)"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(0.6) translate(300, 100)"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(0.8) translate(180, -10)"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(0.7) translate(480, 20)"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(0.9) translate(390, -15)"/>
         {/* Lower Stars / Shadow Stars */}
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(1.2) translate(10, 140)" fill="#1084C0"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(1.5) translate(110, 120)" fill="#1084C0"/>
         <polygon points="30,20 33,28 41,28 35,33 37,41 30,36 23,41 25,33 19,28 27,28" transform="scale(1.3) translate(250, 140)" fill="#1084C0"/>
       </g>

       {/* 3. Floating Alphabet Blocks (Layered BEHIND the keyboard now) */}
       <g transform="translate(60, 45) rotate(-35)">
         <rect x="0" y="8" width="55" height="55" rx="8" fill="#E67A00" />
         <rect x="0" y="0" width="55" height="55" rx="8" fill="#FF952B" />
         <text x="27.5" y="42" fill="#FFF" fontSize="36" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">F</text>
       </g>
       
       <g transform="translate(130, 40) rotate(-5)">
         <rect x="0" y="8" width="55" height="55" rx="8" fill="#609A17" />
         <rect x="0" y="0" width="55" height="55" rx="8" fill="#88C72A" />
         <text x="27.5" y="42" fill="#FFF" fontSize="36" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">G</text>
       </g>

       <g transform="translate(195, 35) rotate(15)">
         <rect x="0" y="8" width="55" height="55" rx="8" fill="#D34141" />
         <rect x="0" y="0" width="55" height="55" rx="8" fill="#F45B5B" />
         <text x="27.5" y="42" fill="#FFF" fontSize="36" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">H</text>
       </g>

       <g transform="translate(265, 50) rotate(40)">
         <rect x="0" y="8" width="55" height="55" rx="8" fill="#D4A017" />
         <rect x="0" y="0" width="55" height="55" rx="8" fill="#F4C430" />
         <text x="27.5" y="42" fill="#FFF" fontSize="36" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">J</text>
       </g>

       {/* 4. Keyboard Base & Shadows */}
       {/* Keyboard Drop Shadow */}
       <rect x="42" y="94" width="316" height="80" rx="4" fill="#1084C0" />
       {/* Main Keyboard Chassis */}
       <rect x="42" y="88" width="316" height="80" rx="4" fill="#F1F5F9" />
       <rect x="42" y="86" width="316" height="80" rx="4" fill="#FFFFFF" />
       
       {/* 5. Fixed Key Rows (Perfect math, no overflow) */}
       <g>
         {/* Row 1 */}
         {[...Array(14)].map((_, i) => (
           <g key={`r1-${i}`}>
             <rect x={48 + i*22} y={94} width="18" height="16" rx="2" fill="#E2E8F0" />
             <rect x={48 + i*22} y={92} width="18" height="15" rx="2" fill="#FFFFFF" />
           </g>
         ))}
         {/* Row 2 */}
         {[...Array(14)].map((_, i) => (
           <g key={`r2-${i}`}>
             <rect x={54 + i*22} y={114} width="18" height="16" rx="2" fill="#E2E8F0" />
             <rect x={54 + i*22} y={112} width="18" height="15" rx="2" fill="#FFFFFF" />
           </g>
         ))}
         {/* Row 3 */}
         {[...Array(13)].map((_, i) => (
           <g key={`r3-${i}`}>
             <rect x={60 + i*22} y={134} width="18" height="16" rx="2" fill="#E2E8F0" />
             <rect x={60 + i*22} y={132} width="18" height="15" rx="2" fill="#FFFFFF" />
           </g>
         ))}
         {/* Spacebar Row */}
         <rect x="130" y="154" width="130" height="16" rx="2" fill="#E2E8F0" />
         <rect x="130" y="152" width="130" height="15" rx="2" fill="#FFFFFF" />
       </g>

       {/* 6. Hand Shadows on the Background */}
       <g fill="#0D78AE">
         <path d="M 85 240 L 85 170 C 85 150 145 150 160 170 L 160 240 Z" />
         <path d="M 235 240 L 235 170 C 250 150 310 150 310 240 Z" />
       </g>

       {/* 7. Hands Layer (Cleaned up vectors to match the cute cartoon style) */}
       <g fill="#FFCBA4">
         {/* --- LEFT HAND --- */}
         <g>
           {/* Pinky to Index */}
           <rect x="85" y="115" width="16" height="40" rx="8" />
           <rect x="103" y="110" width="16" height="50" rx="8" />
           <rect x="121" y="110" width="16" height="55" rx="8" />
           <rect x="139" y="115" width="16" height="45" rx="8" />
           {/* Thumb */}
           <rect x="160" y="155" width="30" height="16" rx="8" transform="rotate(15 160 155)" />
           {/* Palm / Arm */}
           <path d="M 85 140 L 155 140 Q 170 170 155 240 L 95 240 Q 85 180 85 140 Z" />
           {/* Subtle Shadow on arm edge */}
           <path d="M 155 140 Q 170 170 155 240 L 145 240 Q 160 170 145 140 Z" fill="#EFA07A" opacity="0.5"/>
         </g>

         {/* --- RIGHT HAND --- */}
         <g>
           {/* Index to Pinky */}
           <rect x="245" y="115" width="16" height="45" rx="8" />
           <rect x="263" y="110" width="16" height="55" rx="8" />
           <rect x="281" y="110" width="16" height="50" rx="8" />
           <rect x="299" y="115" width="16" height="40" rx="8" />
           {/* Thumb */}
           <rect x="210" y="163" width="30" height="16" rx="8" transform="rotate(-15 210 163)" />
           {/* Palm / Arm */}
           <path d="M 315 140 L 245 140 Q 230 170 245 240 L 305 240 Q 315 180 315 140 Z" />
           {/* Subtle Shadow on arm edge */}
           <path d="M 315 140 Q 315 180 305 240 L 295 240 Q 305 180 305 140 Z" fill="#EFA07A" opacity="0.5"/>
         </g>
       </g>
    </svg>
  );
};

export const SectionKeysShowcase: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const keys = params?.keys || ['F', 'J'];

  const n = Math.max(1, keys.length);
  const gap = n > 6 ? 8 : 16;
  const boxW = Math.min(74, (340 - (n - 1) * gap) / n);
  const totalW = n * boxW + (n - 1) * gap;
  const startX = (400 - totalW) / 2;
  const fontSize = Math.max(16, boxW * 0.62);
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `sk-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
       <style>{`
         @media (hover: hover) and (prefers-reduced-motion: no-preference) {
           .${cls} .sk-cap { transition: transform .3s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
           .${cls}:hover .sk-cap { transform: translateY(7px); }
         }
       `}</style>
       <rect width="400" height="240" rx="16" fill="#F1F5F9" />

       {keys.map((k, i) => {
         const x = startX + i * (boxW + gap);
         const cx = x + boxW / 2;
         const y = 120 - boxW / 2;
         const r = boxW * 0.22;

         return (
           <g key={`key-${i}`}>
             {/* Hard Green Floor Shadow (Offset Y+8px) */}
             <rect x={x} y={y + 8} width={boxW} height={boxW} rx={r} fill="#10B981" opacity="0.4" />

             {/* Keycap + letter press down toward the shadow on hover */}
             <g className="sk-cap" style={{ transitionDelay: `${i * 60}ms` }}>
               <rect x={x} y={y} width={boxW} height={boxW} rx={r} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
               <text x={cx} y={120 + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="900" fill="#0F172A" fontFamily="monospace">
                 {k.toUpperCase()}
               </text>
             </g>
           </g>
         );
       })}
    </svg>
  );
};
export const ThumbnailRegistry: Record<string, React.FC<SvgTemplateProps>> = {
  'TWO_KEYS_FOCUS': TwoKeysFocus,
  'RHYTHM_LOOP': RhythmLoopCover,
  'PRECISION_TARGET': PrecisionTargetCover,
  'NINJA_ARENA_COVER': NinjaArenaCover,
  'MINION_BOSS_COVER': MinionBossCover,
  'COURSE_FOUNDATIONS_COVER': CourseFoundationsCover,
  'SECTION_KEYS_SHOWCASE': SectionKeysShowcase,
};