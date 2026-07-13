import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

// Special keys render as icons or short labels so they fit a keycap.
const KEY_LABELS: Record<string, string> = {
  enter: '↵',
  backspace: '⌫',
  tab: '⇥',
  capslock: 'caps',
  control: 'ctrl',
  alt: 'alt',
  shift: '⇧',
};
const keyLabel = (key: string): string => KEY_LABELS[key.toLowerCase()] ?? key;

export const TwoKeysFocus: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const keys = params?.keys || ['f', 'j'];
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
         const label = keyLabel(k);
         const fs = label.length > 3 ? 15 : label.length > 1 ? 20 : 32;
         return (
           <g key={`key-${i}`} className="tk-key" style={{ transitionDelay: `${i * 60}ms` }}>
             <rect x={x} y="85" width={boxW} height={boxH} rx="16" fill="#FFFFFF" filter={`url(#${idPrefix}-softShadow)`} />
             <text x={cx} y={118 + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight="800" fontFamily="monospace" style={{ fill: '#18181B' }}>{label}</text>
             <circle cx={cx} cy="144" r="3" opacity="0.3" style={{ fill: '#18181B' }} />
           </g>
         );
       })}
    </svg>
  );
};

export const RhythmLoopCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const key1 = keyLabel(params?.keys?.[0] || 'f');
  const key2 = keyLabel(params?.keys?.[1] || 'j');
  const fs1 = key1.length > 3 ? 12 : key1.length > 1 ? 16 : 28;
  const fs2 = key2.length > 3 ? 12 : key2.length > 1 ? 16 : 28;
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
         <text x="135" y={120 + fs1 * 0.35} textAnchor="middle" fontSize={fs1} fontWeight="900" fontFamily="monospace" style={{ fill: '#18181B' }}>{key1}</text>
       </g>

       {/* Right Key Pill */}
       <g>
         <circle cx="265" cy="120" r="32" fill="#FFFFFF" filter={`url(#${idPrefix}-floatShadow)`} />
         <circle cx="265" cy="120" r="26" fill="#FAFAFA" stroke="#F4F4F5" strokeWidth="2" />
         <text x="265" y={120 + fs2 * 0.35} textAnchor="middle" fontSize={fs2} fontWeight="900" fontFamily="monospace" style={{ fill: '#18181B' }}>{key2}</text>
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
// 4. SHARED GAME CAST ART — the cast of the typing-ninja game, drawn once and
// used by both game covers (NinjaArenaCover, MinionBossCover). Matches the
// actual 3D models: a green hooded-rogue ninja hero (hero.glb) versus a wave
// of skeleton minions (enemy.glb), on the game's sand palette
// (#dfa276/#eeb68e, fog #f4e0c5).
// ============================================================================
const NINJA = { hood: '#15803D', tunic: '#16A34A', sleeve: '#134E2A', pants: '#1F2937', boots: '#92400E', belt: '#7F1D1D', skin: '#E8B98B' };
const BONE = { body: '#F1EAD6', shade: '#D8CCAF', wrap: '#334155', eye: '#EF4444' };

// The hooded ninja hero, drawn in a 60×92 local box (origin = top-left of the
// body). facing=-1 mirrors it. Positioning lives on the OUTER group so the
// inner group stays free for CSS animation transforms.
const ninjaFigure = (
  x: number, y: number, s: number, facing: 1 | -1,
  opts: { sword?: boolean; animClass?: string; delayMs?: number } = {},
) => (
  <g transform={facing === 1 ? `translate(${x} ${y}) scale(${s})` : `translate(${x + 60 * s} ${y}) scale(${-s} ${s})`}>
    <g className={opts.animClass} style={opts.delayMs ? { animationDelay: `${opts.delayMs}ms` } : undefined}>
      {/* Scarf tails flying behind */}
      <path d="M 2 12 Q -14 6 -20 16 Q -10 20 2 18 Z" fill={NINJA.hood} />
      <path d="M 2 17 Q -12 24 -16 34 Q -6 29 3 22 Z" fill={NINJA.hood} opacity="0.8" />
      {/* Back arm (dark sleeve) */}
      <g transform="translate(5 48) rotate(28)">
        <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={NINJA.sleeve} />
      </g>
      {/* Legs (running pose): dark pants, leather boots */}
      <g transform="translate(17 74) rotate(16)">
        <rect x="-5" y="0" width="11" height="14" rx="5" fill={NINJA.pants} />
        <rect x="-6" y="10" width="13" height="6" rx="3" fill={NINJA.boots} />
      </g>
      <g transform="translate(41 74) rotate(-12)">
        <rect x="-5" y="0" width="11" height="14" rx="5" fill={NINJA.pants} />
        <rect x="-6" y="10" width="13" height="6" rx="3" fill={NINJA.boots} />
      </g>
      {/* Tunic capsule */}
      <rect x="0" y="0" width="60" height="78" rx="30" fill={NINJA.tunic} />
      {/* Skirt of the tunic + belt with knot */}
      <path d="M 0 52 H 60 V 62 Q 60 78 30 78 Q 0 78 0 62 Z" fill={NINJA.hood} />
      <rect x="0" y="47" width="60" height="7" rx="3.5" fill={NINJA.belt} />
      <rect x="20" y="45" width="9" height="11" rx="2.5" fill="#991B1B" />
      {/* Hood: dome over the head with a pointed tip at the back */}
      <path d="M -2 30 Q -6 -6 30 -6 Q 64 -6 62 30 Q 62 36 55 35 L 7 35 Q -2 36 -2 30 Z" fill={NINJA.hood} />
      <path d="M 2 8 L -9 -1 L 6 -4 Z" fill={NINJA.hood} />
      {/* Face window: shadowed opening, skin band, one focused eye */}
      <rect x="26" y="11" width="29" height="18" rx="9" fill="#111827" />
      <rect x="29" y="14" width="23" height="12" rx="6" fill={NINJA.skin} />
      <circle cx="45" cy="20" r="3.2" fill="#111827" />
      <circle cx="46.2" cy="18.8" r="1" fill="#FFFFFF" />
      {/* Front arm (dark sleeve, + katana) */}
      <g transform="translate(52 44) rotate(-42)">
        <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={NINJA.sleeve} />
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

// A skeleton minion in the same 60×92 local box, so both figures share
// positioning and animation plumbing.
const skeletonFigure = (
  x: number, y: number, s: number, facing: 1 | -1,
  opts: { animClass?: string; delayMs?: number } = {},
) => (
  <g transform={facing === 1 ? `translate(${x} ${y}) scale(${s})` : `translate(${x + 60 * s} ${y}) scale(${-s} ${s})`}>
    <g className={opts.animClass} style={opts.delayMs ? { animationDelay: `${opts.delayMs}ms` } : undefined}>
      {/* Back arm (bone) */}
      <g transform="translate(5 48) rotate(28)">
        <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={BONE.shade} />
      </g>
      {/* Legs (shamble pose): bone shins, bare bone feet */}
      <g transform="translate(17 74) rotate(16)">
        <rect x="-5" y="0" width="11" height="14" rx="5" fill={BONE.shade} />
        <rect x="-6" y="10" width="13" height="6" rx="3" fill={BONE.body} />
      </g>
      <g transform="translate(41 74) rotate(-12)">
        <rect x="-5" y="0" width="11" height="14" rx="5" fill={BONE.shade} />
        <rect x="-6" y="10" width="13" height="6" rx="3" fill={BONE.body} />
      </g>
      {/* Skull-and-body capsule */}
      <rect x="0" y="0" width="60" height="78" rx="30" fill={BONE.body} />
      {/* Rib lines */}
      <g stroke={BONE.shade} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 16 42 Q 30 46 46 42" />
        <path d="M 18 49 Q 30 52 44 49" />
      </g>
      {/* Tattered wrap */}
      <path d="M 0 56 L 10 53 L 20 57 L 30 53 L 40 57 L 50 53 L 60 56 V 62 Q 60 78 30 78 Q 0 78 0 62 Z" fill={BONE.wrap} />
      {/* Skull crack */}
      <path d="M 18 2 L 22 8 L 18 13" stroke={BONE.shade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Eye socket with a glowing pupil + nasal notch */}
      <circle cx="42" cy="19" r="11" fill="#111827" />
      <circle cx="45" cy="19" r="3.8" fill={BONE.eye} />
      <path d="M 55 27 L 52 32" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
      {/* Gritted teeth */}
      <path d="M 32 38 Q 42 41 52 37" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 38 36.5 L 38 41" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 44 37.5 L 44 41.5" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      {/* Front arm reaching forward */}
      <g transform="translate(52 44) rotate(-42)">
        <rect x="-4" y="0" width="9" height="17" rx="4.5" fill={BONE.shade} />
      </g>
    </g>
  </g>
);

// Word tag exactly like the in-game word badge (brown + amber ring). Width
// stretches with the text so it fits full words, not just single letters.
const letterTag = (
  x: number, y: number, rot: number, text: string,
  s = 1, delayMs = 0, animClass = 'mbx-tag',
) => {
  const label = keyLabel(text);
  const w = Math.max(32, 14 + label.length * 11);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <g className={animClass} style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}>
        <path d="M -5 12 L 5 12 L 0 19 Z" fill="#5C4033" />
        <rect x={-w / 2} y="-14" width={w} height="28" rx="9" fill="#5C4033" stroke="#FBBF24" strokeWidth="2.5" />
        <text x="0" y={label.length > 1 ? 5 : 7} textAnchor="middle" fontSize={label.length > 1 ? 14 : 19} fontWeight="900" fontFamily="monospace" style={{ fill: '#FFFFFF' }}>
          {label}
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// 5. NINJA ARENA COVER — the /games poster: a living slice of the survival
// game. Always animated (hero run-bobs, minions hop closer, shurikens fly,
// the track scrolls) so the card reads as "this is a game" at a glance.
// Honors prefers-reduced-motion.
// ============================================================================
export const NinjaArenaCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const words = params?.keys?.length ? params.keys : ['wolf', 'fox'];
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `na-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .${cls} .na-spin { transform-box: fill-box; transform-origin: center; }
        .${cls} .na-dust { transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: no-preference) {
          .${cls} .na-run { animation: ${cls}-run .34s ease-in-out infinite alternate; }
          .${cls} .na-hop { animation: ${cls}-hop .4s ease-in-out infinite alternate; }
          .${cls} .na-bob { animation: ${cls}-bob .6s ease-in-out infinite alternate; }
          .${cls} .na-spin { animation: ${cls}-spin .5s linear infinite; }
          .${cls} .na-throw { animation: ${cls}-throw 1.15s linear infinite; }
          .${cls} .na-cloud { animation: ${cls}-cloud 7s ease-in-out infinite alternate; }
          .${cls} .na-dust { animation: ${cls}-dust .9s ease-out infinite; }
          @keyframes ${cls}-run { to { transform: translateY(-4px); } }
          @keyframes ${cls}-hop { to { transform: translateY(-6px); } }
          @keyframes ${cls}-bob { to { transform: translateY(-4px); } }
          @keyframes ${cls}-spin { to { transform: rotate(360deg); } }
          @keyframes ${cls}-throw {
            0% { transform: translateX(-46px); opacity: 0; }
            12% { opacity: 1; }
            82% { opacity: 1; }
            100% { transform: translateX(92px); opacity: 0; }
          }
          @keyframes ${cls}-cloud { to { transform: translateX(-16px); } }
          @keyframes ${cls}-dust {
            0% { transform: scale(.3); opacity: .8; }
            100% { transform: scale(1.6) translateX(-14px); opacity: 0; }
          }
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
        {/* Sky + sun + drifting clouds */}
        <rect width="400" height="240" fill={`url(#${idPrefix}-sky)`} />
        <circle cx="84" cy="52" r="27" fill="#FFD98E" opacity="0.35" />
        <circle cx="84" cy="52" r="17" fill="#FFE3A8" />
        <g className="na-cloud" fill="#FFFFFF" opacity="0.65">
          <rect x="130" y="32" width="52" height="11" rx="5.5" />
          <rect x="144" y="24" width="30" height="11" rx="5.5" />
        </g>
        <g className="na-cloud" style={{ animationDelay: '-3.5s' }} fill="#FFFFFF" opacity="0.55">
          <rect x="226" y="54" width="40" height="10" rx="5" />
          <rect x="312" y="34" width="44" height="10" rx="5" />
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

        {/* Sand track: base plane, light running belt, edge stripes */}
        <rect x="0" y="168" width="400" height="72" fill="#DFA276" />
        <rect x="0" y="178" width="400" height="54" fill="#EEB68E" />
        <rect x="0" y="177" width="400" height="2.5" fill="#CF8852" />
        <rect x="0" y="231" width="400" height="2.5" fill="#CF8852" />
        {/* Track dashes (static) */}
        <g fill="#CF8852" opacity="0.55">
          {[0, 1, 2, 3, 4].map(i => <rect key={`a${i}`} x={10 + i * 80} y="194" width="26" height="5" rx="2.5" />)}
          {[0, 1, 2, 3, 4].map(i => <rect key={`b${i}`} x={50 + i * 80} y="211" width="18" height="5" rx="2.5" />)}
          {[0, 1, 2, 3, 4].map(i => <rect key={`c${i}`} x={30 + i * 80} y="224" width="14" height="4" rx="2" />)}
        </g>

        {/* THE HERO — run-bobs, kicks up dust */}
        <ellipse cx="106" cy="208" rx="32" ry="6" fill="#C98D5E" opacity="0.45" />
        <g fill="#E9CBA8">
          <circle className="na-dust" cx="66" cy="202" r="6" />
          <circle className="na-dust" style={{ animationDelay: '-0.45s' }} cx="58" cy="208" r="4" />
        </g>
        {ninjaFigure(76, 118, 0.95, 1, { sword: true, animClass: 'na-run' })}

        {/* Shurikens mid-flight: spin while crossing to the minion wave */}
        <g className="na-throw">
          <g transform="translate(196 112)">
            <g className="na-spin">
              <rect x="-4" y="-15" width="8" height="30" rx="3" fill="#9CA3AF" />
              <rect x="-15" y="-4" width="30" height="8" rx="3" fill="#9CA3AF" />
              <circle cx="0" cy="0" r="4.5" fill="#6B7280" />
              <circle cx="0" cy="0" r="2" fill="#F4E0C5" />
            </g>
          </g>
        </g>
        <g className="na-throw" style={{ animationDelay: '-0.6s' }}>
          <g transform="translate(188 138)">
            <g className="na-spin" style={{ animationDelay: '-0.2s' }}>
              <rect x="-3" y="-11" width="6" height="22" rx="2.5" fill="#9CA3AF" />
              <rect x="-11" y="-3" width="22" height="6" rx="2.5" fill="#9CA3AF" />
              <circle cx="0" cy="0" r="3.5" fill="#6B7280" />
              <circle cx="0" cy="0" r="1.6" fill="#F4E0C5" />
            </g>
          </g>
        </g>

        {/* THE SKELETON WAVE — hops closer, word tags bob overhead.
            Drawn back-to-front so nearer skeletons cover farther ones. */}
        <ellipse cx="312" cy="212" rx="30" ry="6" fill="#C98D5E" opacity="0.45" />
        <ellipse cx="366" cy="220" rx="26" ry="5" fill="#C98D5E" opacity="0.4" />
        {skeletonFigure(330, 116, 0.72, -1, { animClass: 'na-hop', delayMs: 120 })}
        {skeletonFigure(378, 132, 0.85, -1, { animClass: 'na-hop', delayMs: 240 })}
        {skeletonFigure(278, 124, 0.9, -1, { animClass: 'na-hop' })}
        {letterTag(304, 90, 4, words[0] ?? 'wolf', 1, 0, 'na-bob')}
        {letterTag(364, 82, -5, words[1] ?? words[0] ?? 'fox', 0.85, 200, 'na-bob')}

        {/* HUD lives, like the in-game overlay */}
        <g>
          {[0, 1, 2].map(i => (
            <rect key={i} x={18 + i * 20} y="18" width="12" height="12" rx="2.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" transform={`rotate(45 ${24 + i * 20} 24)`} />
          ))}
        </g>
      </g>
    </svg>
  );
};

// ============================================================================
// 6. LESSON: MINION BOSS COVER — a mini-poster of the actual typing-ninja
// scene: desert track, the hooded ninja hero vs a wave of skeleton minions
// carrying the lesson's letter tags (params.keys). Animates on hover.
// ============================================================================
export const MinionBossCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = params?.accentColor === 'emerald' ? '#10B981' :
                 params?.accentColor === 'amber' ? '#F59E0B' :
                 params?.accentColor === 'blue' ? '#3B82F6' : '#EF4444';
  const threatCount = params?.enemyCount || 20;
  const keys = params?.keys?.length ? params.keys : ['f', 'j'];
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `mb-${idPrefix}`;

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

        {/* THE HERO — hooded ninja with katana */}
        {ninjaFigure(76, 118, 0.95, 1, { sword: true })}

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
        {skeletonFigure(330, 116, 0.72, -1, { animClass: 'mbx-hop', delayMs: 120 })}
        {skeletonFigure(378, 132, 0.85, -1, { animClass: 'mbx-hop', delayMs: 240 })}
        {skeletonFigure(278, 124, 0.9, -1, { animClass: 'mbx-hop' })}
        {letterTag(306, 96, 4, keys[0] ?? 'f')}
        {letterTag(352, 86, -5, keys[1] ?? keys[0] ?? 'j', 0.85, 200)}

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
  const keys = params?.keys || ['f', 'j'];

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
         const label = keyLabel(k);
         const fs = label.length > 3 ? boxW * 0.3 : label.length > 1 ? boxW * 0.42 : fontSize;

         return (
           <g key={`key-${i}`}>
             {/* Hard Green Floor Shadow (Offset Y+8px) */}
             <rect x={x} y={y + 8} width={boxW} height={boxW} rx={r} fill="#10B981" opacity="0.4" />

             {/* Keycap + letter press down toward the shadow on hover */}
             <g className="sk-cap" style={{ transitionDelay: `${i * 60}ms` }}>
               <rect x={x} y={y} width={boxW} height={boxW} rx={r} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
               <text x={cx} y={120 + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight="900" fill="#0F172A" fontFamily="monospace">
                 {label}
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