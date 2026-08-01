import React from 'react';
import {
  Atom, BookOpen, Calculator, Coins, Dumbbell, Flag, FlaskConical, Globe2,
  GraduationCap, Heart, Languages, Laptop, Leaf, Music, Palette, Scale,
  Scroll, Shapes, Type, Wrench, type LucideIcon,
} from 'lucide-react';
import {
  Binary, Blocks, Boxes, Braces, BrainCircuit, Briefcase, Bug, ChartColumn,
  Cloud, Component, Cpu, Database, FileCode2, Fingerprint, Gamepad2, GitBranch,
  HardDrive, Keyboard, Layers, LayoutTemplate, Lightbulb, Link2, Monitor,
  Network, SearchCode, Server, ShieldCheck, Smartphone, SquareTerminal,
  TestTubeDiagonal, Trophy, Waypoints, Workflow,
} from 'lucide-react';
import { Award, FileText, Headphones, Mic, PenLine, Target } from 'lucide-react';
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

       <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
       
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
             {/* The edge stroke is what separates the cap from the panel in
                 dark mode, where the drop shadow does nothing. */}
             <rect x={x} y="85" width={boxW} height={boxH} rx="16" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-softShadow)`} />
             <text x={cx} y={118 + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight="800" fontFamily="monospace" style={{ fill: 'var(--thumb-ink)' }}>{label}</text>
             <circle cx={cx} cy="144" r="3" opacity="0.3" style={{ fill: 'var(--thumb-ink)' }} />
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

       <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />

       {/* Thick Background Track */}
       <path d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke="var(--thumb-edge)" strokeWidth="16" fill="none" />

       {/* Active Highlight Loop — dashes flow on hover */}
       <path className="rl-dash" d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="16 12" fill="none" />

       {/* Left Key Pill */}
       <g>
         <circle cx="135" cy="120" r="32" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-floatShadow)`} />
         <circle cx="135" cy="120" r="26" fill="var(--thumb-key-2)" stroke="var(--thumb-panel)" strokeWidth="2" />
         <text x="135" y={120 + fs1 * 0.35} textAnchor="middle" fontSize={fs1} fontWeight="900" fontFamily="monospace" style={{ fill: 'var(--thumb-ink)' }}>{key1}</text>
       </g>

       {/* Right Key Pill */}
       <g>
         <circle cx="265" cy="120" r="32" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-floatShadow)`} />
         <circle cx="265" cy="120" r="26" fill="var(--thumb-key-2)" stroke="var(--thumb-panel)" strokeWidth="2" />
         <text x="265" y={120 + fs2 * 0.35} textAnchor="middle" fontSize={fs2} fontWeight="900" fontFamily="monospace" style={{ fill: 'var(--thumb-ink)' }}>{key2}</text>
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
       <rect width="400" height="240" rx="16" fill="var(--thumb-panel-warm)" />

       {/* Speedometer Background Track */}
       <path d="M 120 160 A 80 80 0 0 1 280 160" stroke="var(--thumb-amber-track)" strokeWidth="12" fill="none" strokeLinecap="round" />

       {/* Speedometer Active Progress (Fills up to the right) */}
       <path d="M 120 160 A 80 80 0 0 1 250 100" stroke="#F59E0B" strokeWidth="12" fill="none" strokeLinecap="round" />

       {/* Center Hub & Needle — sweeps on hover */}
       <g className="pt-needle">
         <circle cx="200" cy="155" r="8" fill="var(--thumb-amber-ink)" />
         <path d="M 200 155 L 240 105" stroke="var(--thumb-amber-ink)" strokeWidth="4" strokeLinecap="round" />
       </g>

       {/* Floating WPM Badge */}
       <rect x="160" y="180" width="80" height="32" rx="8" fill="var(--thumb-key)" stroke="#FCD34D" strokeWidth="2" />
       <text x="200" y="202" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="sans-serif" style={{ fill: 'var(--thumb-amber-ink)' }}>
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
       <rect width="400" height="240" rx="16" fill="var(--thumb-panel-cool)" />

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
               <rect x={x} y={y} width={boxW} height={boxW} rx={r} fill="var(--thumb-key)" stroke="var(--thumb-edge-cool)" strokeWidth="1.5" />
               <text x={cx} y={120 + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight="900" fill="var(--thumb-ink-cool)" fontFamily="monospace">
                 {label}
               </text>
             </g>
           </g>
         );
       })}
    </svg>
  );
};
/* ── Letter-unit lesson covers ─────────────────────────────────────────
   One parametric cover per track (letters / codes); `letter` is merged in
   at runtime by the hub page, `motif` says which lesson the card depicts.
   Accents follow the lesson-type badge hues (sky/emerald/amber/violet). */

const LETTER_MOTIF_ACCENT: Record<string, string> = {
  meet: '#0EA5E9',
  type: '#10B981',
  caps: '#10B981',
  hear: '#10B981',
  mix: '#F59E0B',
  rain: '#8B5CF6',
};

export const LetterStageCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const letter = (params?.letter || 'a').toLowerCase();
  const motif = params?.motif || 'meet';
  const accent = LETTER_MOTIF_ACCENT[motif] ?? '#0EA5E9';
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `ls-${idPrefix}`;
  const up = letter.toUpperCase();

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .ls-cap { transition: transform .35s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
          .${cls}:hover .ls-cap { transform: translateY(6px); }
        }
      `}</style>
      <defs>
        <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="24" result="blur" />
        </filter>
        <filter id={`${idPrefix}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05"/>
        </filter>
      </defs>

      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <circle cx="200" cy="120" r="52" fill={accent} opacity="0.28" filter={`url(#${idPrefix}-glow)`} />

      {/* Center keycap with the letter */}
      <g className="ls-cap">
        <rect x="160" y="80" width="80" height="80" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
        <text x="200" y="134" textAnchor="middle" fontSize="40" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink)">
          {motif === 'caps' ? up : letter}
        </text>
      </g>

      {motif === 'meet' && (
        <g stroke={accent} strokeWidth="3" strokeLinecap="round">
          <path d="M118 76 l0 16 M110 84 l16 0" />
          <path d="M288 148 l0 12 M282 154 l12 0" />
          <text x="120" y="176" textAnchor="middle" fontSize="26" fontFamily="serif" fontStyle="italic" fill="var(--thumb-ink-soft)" stroke="none">{up}{letter}</text>
        </g>
      )}
      {motif === 'type' && (
        <g fill="var(--thumb-key)" stroke="var(--thumb-edge)">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={62} y={80 + i * 30} width={64} height={20} rx={10} filter={`url(#${idPrefix}-shadow)`} />
              <rect x={76} y={88 + i * 30} width={36 - i * 8} height={4} rx={2} fill={accent} stroke="none" opacity="0.7" />
            </g>
          ))}
        </g>
      )}
      {motif === 'caps' && (
        <g>
          <rect x="86" y="102" width="52" height="52" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
          <text x="112" y="136" textAnchor="middle" fontSize="24" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink-soft)">{letter}</text>
          <path d="M150 128 h14 m-5 -5 l5 5 -5 5" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {motif === 'hear' && (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M262 104 a22 22 0 0 1 0 32" />
          <path d="M274 92 a38 38 0 0 1 0 56" />
          <path d="M100 92 v56 l24 -14 v-28 z" fill={accent} stroke="none" opacity="0.85" />
        </g>
      )}
      {motif === 'mix' && (
        <g>
          <rect x="88" y="96" width="52" height="52" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(-8 114 122)" />
          <text x="114" y="130" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink-soft)" transform="rotate(-8 114 122)">?</text>
          <rect x="260" y="96" width="52" height="52" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(8 286 122)" />
          <text x="286" y="130" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(8 286 122)">{letter}</text>
        </g>
      )}
      {motif === 'rain' && (
        <g>
          {[
            { x: 92, y: 66, r: 17 },
            { x: 132, y: 128, r: 14 },
            { x: 292, y: 92, r: 17 },
            { x: 318, y: 160, r: 13 },
          ].map((d, i) => (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={0.16} />
              <circle cx={d.x} cy={d.y} r={d.r} stroke={accent} strokeWidth="2" fill="var(--thumb-key)" opacity="0.9" />
              <text x={d.x} y={d.y + d.r * 0.36} textAnchor="middle" fontSize={d.r} fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink)">{letter}</text>
            </g>
          ))}
          <line x1="56" y1="204" x2="344" y2="204" stroke="var(--thumb-dim)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" />
        </g>
      )}
    </svg>
  );
};

export const CodesStageCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const letter = (params?.letter || 'a').toLowerCase();
  const motif = params?.motif || 'learn';
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `cs-${idPrefix}`;

  const RED = '#E03131';
  const YEL = '#FCC419';
  const INK = 'var(--thumb-ink)';

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .cs-lift { transition: transform .35s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
          .${cls}:hover .cs-lift { transform: translateY(-5px); }
        }
      `}</style>
      <defs>
        <filter id={`${idPrefix}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05"/>
        </filter>
      </defs>

      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />

      {/* Letter tag — the cover's constant anchor, top-left */}
      <rect x="24" y="22" width="44" height="44" rx="11" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
      <text x="46" y="52" textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="monospace" fill={INK}>{letter.toUpperCase()}</text>

      {motif === 'learn' && (
        <g className="cs-lift">
          {/* mini flag, morse and braille side by side */}
          <rect x="96" y="88" width="64" height="64" rx="8" fill={RED} filter={`url(#${idPrefix}-shadow)`} />
          <polygon points="96,88 160,88 160,152" fill={YEL} opacity="0.9" />
          <g fill={INK}>
            <circle cx="204" cy="120" r="7" />
            <rect x="222" y="113" width="34" height="14" rx="7" />
          </g>
          <g>
            {[0, 1, 2].map((r) =>
              [0, 1].map((c) => (
                <circle key={`${r}${c}`} cx={296 + c * 24} cy={96 + r * 24} r="8" fill={(r + c) % 2 === 0 ? INK : 'var(--thumb-dim)'} />
              )),
            )}
          </g>
        </g>
      )}
      {motif === 'flags' && (
        <g className="cs-lift">
          <line x1="150" y1="66" x2="150" y2="190" stroke="var(--thumb-ink-soft)" strokeWidth="5" strokeLinecap="round" />
          <path d="M155 70 h92 l-20 26 20 26 h-92 z" fill={RED} filter={`url(#${idPrefix}-shadow)`} />
          <path d="M155 70 h46 v52 h-46 z" fill={YEL} />
        </g>
      )}
      {motif === 'morse' && (
        <g className="cs-lift" fill={INK}>
          <circle cx="120" cy="120" r="12" />
          <rect x="150" y="108" width="56" height="24" rx="12" />
          <circle cx="238" cy="120" r="12" />
          <circle cx="276" cy="120" r="12" />
          <rect x="140" y="164" width="120" height="6" rx="3" fill="var(--thumb-dim)" />
        </g>
      )}
      {motif === 'quiz' && (
        <g className="cs-lift">
          <circle cx="200" cy="122" r="52" stroke="var(--thumb-dim)" strokeWidth="8" fill="var(--thumb-key)" filter={`url(#${idPrefix}-shadow)`} />
          <circle cx="200" cy="122" r="28" stroke={RED} strokeWidth="8" fill="none" />
          <circle cx="200" cy="122" r="8" fill={INK} />
        </g>
      )}
      {motif === 'game' && (
        <g className="cs-lift">
          <rect x="128" y="88" width="144" height="72" rx="36" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
          <path d="M162 124 h24 m-12 -12 v24" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <circle cx="230" cy="112" r="7" fill={RED} />
          <circle cx="248" cy="132" r="7" fill={YEL} />
        </g>
      )}
    </svg>
  );
};

/* ── Phoneme-unit lesson covers ────────────────────────────────────────
   One parametric cover for the phonemes track; `symbol` is merged in at
   runtime by the hub page, `motif` says which lesson the card depicts.
   Accents follow the lesson-type badge hues (sky/emerald/amber/violet). */

const PHONEME_MOTIF_ACCENT: Record<string, string> = {
  meet: '#0EA5E9',
  shades: '#0EA5E9',
  shade: '#0EA5E9',
  type: '#10B981',
  hear: '#10B981',
  spell: '#10B981',
  pairs: '#F59E0B',
  master: '#F59E0B',
  rain: '#8B5CF6',
  ninja: '#8B5CF6',
};

export const PhonemeStageCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const symbol = params?.symbol || 'ə';
  const motif = params?.motif || 'meet';
  const accent = PHONEME_MOTIF_ACCENT[motif] ?? '#0EA5E9';
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `ps-${idPrefix}`;
  // Long symbols (diphthongs like aʊə) need a smaller glyph.
  const fontSize = symbol.length >= 3 ? 26 : symbol.length === 2 ? 32 : 38;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .ps-tile { transition: transform .35s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
          .${cls}:hover .ps-tile { transform: translateY(-5px); }
        }
      `}</style>
      <defs>
        <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="24" result="blur" />
        </filter>
        <filter id={`${idPrefix}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05"/>
        </filter>
      </defs>

      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <circle cx="200" cy="120" r="52" fill={accent} opacity="0.28" filter={`url(#${idPrefix}-glow)`} />

      {/* Center tile with the IPA symbol between slashes */}
      <g className="ps-tile">
        <rect x="152" y="80" width="96" height="80" rx="18" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
        <text x="200" y="132" textAnchor="middle" fontSize={fontSize} fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink)">
          /{symbol}/
        </text>
      </g>

      {motif === 'meet' && (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
          {/* small sound waves either side */}
          <path d="M112 108 a18 18 0 0 1 0 26" />
          <path d="M100 96 a34 34 0 0 1 0 50" />
          <path d="M288 108 a18 18 0 0 0 0 26" />
          <path d="M300 96 a34 34 0 0 0 0 50" />
        </g>
      )}
      {motif === 'type' && (
        <g fill="var(--thumb-key)" stroke="var(--thumb-edge)">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={62} y={80 + i * 30} width={64} height={20} rx={10} filter={`url(#${idPrefix}-shadow)`} />
              <rect x={76} y={88 + i * 30} width={36 - i * 8} height={4} rx={2} fill={accent} stroke="none" opacity="0.7" />
            </g>
          ))}
        </g>
      )}
      {motif === 'hear' && (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M262 104 a22 22 0 0 1 0 32" />
          <path d="M274 92 a38 38 0 0 1 0 56" />
          <path d="M100 92 v56 l24 -14 v-28 z" fill={accent} stroke="none" opacity="0.85" />
        </g>
      )}
      {motif === 'pairs' && (
        <g>
          <rect x="60" y="96" width="64" height="48" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(-6 92 120)" />
          <text x="92" y="126" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(-6 92 120)">1</text>
          <rect x="276" y="96" width="64" height="48" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(6 308 120)" />
          <text x="308" y="126" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink-soft)" transform="rotate(6 308 120)">2</text>
        </g>
      )}
      {motif === 'spell' && (
        <g fill="var(--thumb-key)" stroke="var(--thumb-edge)">
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={68 + i * 232} y={100} width={40} height={40} rx={10} filter={`url(#${idPrefix}-shadow)`} />
              <text x={88 + i * 232} y={126} textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink-soft)" stroke="none">
                {i === 0 ? 'ea' : 'ee'}
              </text>
            </g>
          ))}
        </g>
      )}
      {motif === 'shades' && (
        <g>
          {/* fanned ghost tiles behind: one sound, many shades */}
          <rect x="72" y="88" width="52" height="52" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(-10 98 114)" opacity="0.9" />
          <rect x="84" y="96" width="52" height="52" rx="12" fill={accent} opacity="0.18" transform="rotate(-4 110 122)" />
          <rect x="276" y="96" width="52" height="52" rx="12" fill={accent} opacity="0.18" transform="rotate(4 302 122)" />
          <rect x="288" y="88" width="52" height="52" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(10 314 114)" opacity="0.9" />
          <text x="98" y="122" textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(-10 98 114)">ʰ</text>
          <text x="314" y="122" textAnchor="middle" fontSize="15" fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(10 314 114)">̃ </text>
        </g>
      )}
      {motif === 'shade' && (
        <g>
          {/* ONE shade: its variant symbol on a ringed foreground tile */}
          <rect x="252" y="128" width="76" height="64" rx="14" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(6 290 160)" />
          <rect x="252" y="128" width="76" height="64" rx="14" fill="none" stroke={accent} strokeWidth="2.5" opacity="0.7" transform="rotate(6 290 160)" />
          <text x="290" y="170" textAnchor="middle" fontSize={String(params?.shade ?? '').length >= 3 ? 20 : 26} fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(6 290 160)">
            {params?.shade || 'iˑ'}
          </text>
          <g stroke={accent} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6">
            <path d="M96 108 a16 16 0 0 1 0 24" />
            <path d="M86 98 a30 30 0 0 1 0 44" />
          </g>
        </g>
      )}
      {motif === 'master' && (
        <g>
          {/* medal ribbons + star above the tile */}
          <path d="M188 52 l12 20 12 -20 z" fill={accent} opacity="0.35" />
          <path d="M92 96 l20 24 -20 24" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M308 96 l-20 24 20 24" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M200 34 l5.5 11 12 1.8 -8.7 8.6 2 12 -10.8 -5.6 -10.8 5.6 2 -12 -8.7 -8.6 12 -1.8 z" fill={accent} />
        </g>
      )}
      {motif === 'rain' && (
        <g>
          {/* word chips falling at different heights */}
          {[
            { x: 66, y: 58, w: 64, o: 0.5 },
            { x: 288, y: 46, w: 56, o: 0.35 },
            { x: 84, y: 150, w: 52, o: 0.85 },
            { x: 276, y: 138, w: 66, o: 0.7 },
          ].map((c, i) => (
            <g key={i} opacity={c.o}>
              <rect x={c.x} y={c.y} width={c.w} height={24} rx={12} fill="var(--thumb-key)" stroke="var(--thumb-edge)" filter={`url(#${idPrefix}-shadow)`} />
              <rect x={c.x + 12} y={c.y + 10} width={c.w - 24} height={4} rx={2} fill={accent} opacity="0.8" />
              <path d={`M${c.x + c.w / 2} ${c.y + 30} v10`} stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            </g>
          ))}
        </g>
      )}
      {motif === 'ninja' && (
        <g>
          {/* shuriken + speed lines */}
          <g transform="translate(96 120)">
            <path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7 Z" fill={accent} opacity="0.85" />
            <circle r="6" fill="var(--thumb-key)" />
          </g>
          <g stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.45">
            <path d="M276 102 h44" />
            <path d="M288 120 h56" />
            <path d="M276 138 h44" />
          </g>
        </g>
      )}
    </svg>
  );
};

/* ── Grapheme-unit lesson covers ───────────────────────────────────────
   One parametric cover shared by the graphemes and spellings tracks;
   `symbol` is merged in at runtime by the hub ("sh" for a spelling,
   "/iː/" for a sound), `motif` says which lesson the card depicts. */

const GRAPHEME_MOTIF_ACCENT: Record<string, string> = {
  meet: '#0EA5E9',
  type: '#10B981',
  hear: '#10B981',
  which: '#F59E0B',
  master: '#F59E0B',
  rain: '#8B5CF6',
  ninja: '#8B5CF6',
};

export const GraphemeStageCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const symbol = params?.symbol || 'sh';
  const motif = params?.motif || 'meet';
  const accent = GRAPHEME_MOTIF_ACCENT[motif] ?? '#0EA5E9';
  const idPrefix = React.useId().replace(/:/g, "");
  const cls = `gs-${idPrefix}`;
  const fontSize = symbol.length >= 5 ? 22 : symbol.length >= 3 ? 28 : 36;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .gs-tile { transition: transform .35s cubic-bezier(.34,1.56,.64,1); transform-box: fill-box; }
          .${cls}:hover .gs-tile { transform: translateY(-5px); }
        }
      `}</style>
      <defs>
        <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="24" result="blur" />
        </filter>
        <filter id={`${idPrefix}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05"/>
        </filter>
      </defs>

      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <circle cx="200" cy="120" r="52" fill={accent} opacity="0.28" filter={`url(#${idPrefix}-glow)`} />

      {/* Center tile with the spelling / sound, drawn as a keycap-ish card */}
      <g className="gs-tile">
        <rect x="148" y="80" width="104" height="80" rx="14" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} />
        <rect x="148" y="80" width="104" height="80" rx="14" stroke="var(--thumb-edge)" />
        <text x="200" y="132" textAnchor="middle" fontSize={fontSize} fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink)">
          {symbol}
        </text>
      </g>

      {motif === 'meet' && (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M108 108 a18 18 0 0 1 0 26" />
          <path d="M96 96 a34 34 0 0 1 0 50" />
          <path d="M292 108 a18 18 0 0 0 0 26" />
          <path d="M304 96 a34 34 0 0 0 0 50" />
        </g>
      )}
      {motif === 'type' && (
        <g fill="var(--thumb-key)" stroke="var(--thumb-edge)">
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={62} y={80 + i * 30} width={64} height={20} rx={10} filter={`url(#${idPrefix}-shadow)`} />
              <rect x={76} y={88 + i * 30} width={36 - i * 8} height={4} rx={2} fill={accent} stroke="none" opacity="0.7" />
            </g>
          ))}
        </g>
      )}
      {motif === 'hear' && (
        <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M262 104 a22 22 0 0 1 0 32" />
          <path d="M274 92 a38 38 0 0 1 0 56" />
          <path d="M100 92 v56 l24 -14 v-28 z" fill={accent} stroke="none" opacity="0.85" />
        </g>
      )}
      {motif === 'which' && (
        <g>
          <rect x="60" y="96" width="64" height="48" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(-6 92 120)" />
          <text x="92" y="126" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill={accent} transform="rotate(-6 92 120)">1</text>
          <rect x="276" y="96" width="64" height="48" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" filter={`url(#${idPrefix}-shadow)`} transform="rotate(6 308 120)" />
          <text x="308" y="126" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="monospace" fill="var(--thumb-ink-soft)" transform="rotate(6 308 120)">2</text>
        </g>
      )}
      {motif === 'master' && (
        <g>
          {/* medal ribbons + star above the tile */}
          <path d="M188 52 l12 20 12 -20 z" fill={accent} opacity="0.35" />
          <path d="M92 96 l20 24 -20 24" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M308 96 l-20 24 20 24" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M200 34 l5.5 11 12 1.8 -8.7 8.6 2 12 -10.8 -5.6 -10.8 5.6 2 -12 -8.7 -8.6 12 -1.8 z" fill={accent} />
        </g>
      )}
      {motif === 'rain' && (
        <g>
          {/* word chips falling at different heights */}
          {[
            { x: 66, y: 58, w: 64, o: 0.5 },
            { x: 288, y: 46, w: 56, o: 0.35 },
            { x: 84, y: 150, w: 52, o: 0.85 },
            { x: 276, y: 138, w: 66, o: 0.7 },
          ].map((c, i) => (
            <g key={i} opacity={c.o}>
              <rect x={c.x} y={c.y} width={c.w} height={24} rx={12} fill="var(--thumb-key)" stroke="var(--thumb-edge)" filter={`url(#${idPrefix}-shadow)`} />
              <rect x={c.x + 12} y={c.y + 10} width={c.w - 24} height={4} rx={2} fill={accent} opacity="0.8" />
              <path d={`M${c.x + c.w / 2} ${c.y + 30} v10`} stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            </g>
          ))}
        </g>
      )}
      {motif === 'ninja' && (
        <g>
          {/* shuriken + speed lines */}
          <g transform="translate(96 120)">
            <path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7 Z" fill={accent} opacity="0.85" />
            <circle r="6" fill="var(--thumb-key)" />
          </g>
          <g stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.45">
            <path d="M276 102 h44" />
            <path d="M288 120 h56" />
            <path d="M276 138 h44" />
          </g>
        </g>
      )}
    </svg>
  );
};

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

/**
 * Cover for the 2D balloon game at `/sky-hop`: the ninja dangling from a
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

/**
 * Cover for the top-down tug-of-war at `/tug-of-typing`: two pullers on a mown
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

/**
 * Cover for `/word-forge`: the forge corridor seen from above — molten seams
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

/* ── K-12 curriculum covers ────────────────────────────────────────────
   Two templates carry the whole `/courses` K-12 tree: one per grade, one
   per subject. Both are UI covers (§ docs/thumbnails.md), so the panel and
   the tile come from `--thumb-*` variables and only the accent stays a
   literal hue. The glyphs are lucide components rendered as a nested
   `<svg x y>` — the repo's rule is "no hand-rolled inline SVGs for standard
   glyphs", and a beaker is as standard as it gets. */

const TONE_HEX: Record<string, string> = {
  sky: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  rose: '#F43F5E',
  indigo: '#6366F1',
  teal: '#14B8A6',
  orange: '#F97316',
  lime: '#84CC16',
  cyan: '#06B6D4',
  fuchsia: '#D946EF',
  slate: '#64748B',
};
const toneHex = (tone?: string): string => TONE_HEX[tone ?? ''] ?? TONE_HEX.slate;

const SUBJECT_GLYPHS: Record<string, LucideIcon> = {
  abc: Type,
  book: BookOpen,
  calc: Calculator,
  shapes: Shapes,
  leaf: Leaf,
  flask: FlaskConical,
  atom: Atom,
  globe: Globe2,
  scroll: Scroll,
  laptop: Laptop,
  tools: Wrench,
  palette: Palette,
  music: Music,
  ball: Dumbbell,
  heart: Heart,
  flag: Flag,
  translate: Languages,
  scales: Scale,
  coin: Coins,
};

export const GradeCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const grade = params?.grade ?? 1;
  const accent = toneHex(params?.tone);
  const label = String(grade);
  // 11 is the only two-digit grade — shrink it so both fit the same optical box.
  const fontSize = label.length > 1 ? 126 : 150;
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `gc-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .gc-num { transition: transform .35s cubic-bezier(.34,1.4,.64,1); transform-origin: 200px 110px; }
          .${cls}:hover .gc-num { transform: scale(1.07); }
          .${cls} .gc-blob { transition: transform .5s ease-out; transform-box: view-box; }
          .${cls}:hover .gc-blob { transform: translate(-10px, 6px); }
        }
      `}</style>
      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />

      {/* Two accent washes give the flat panel depth without a gradient. */}
      <g className="gc-blob">
        <circle cx="326" cy="52" r="112" fill={accent} opacity="0.15" />
        <circle cx="64" cy="214" r="76" fill={accent} opacity="0.09" />
      </g>

      <GraduationCap x={26} y={22} width={34} height={34} stroke={accent} strokeWidth={1.8} opacity={0.55} />

      <text
        className="gc-num"
        x="200"
        y={110 + fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill={accent}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="-6"
      >
        {label}
      </text>

      {/* Shelf rule + three "book spines" — a class, not just a number. */}
      <rect x="140" y="196" width="120" height="4" rx="2" fill="var(--thumb-dim)" />
      <rect x="158" y="178" width="12" height="18" rx="3" fill={accent} opacity="0.7" />
      <rect x="176" y="172" width="12" height="24" rx="3" fill={accent} opacity="0.45" />
      <rect x="194" y="182" width="12" height="14" rx="3" fill={accent} opacity="0.9" />
    </svg>
  );
};

export const SubjectCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = toneHex(params?.tone);
  const Glyph = SUBJECT_GLYPHS[params?.subjectIcon ?? ''] ?? BookOpen;
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `sc-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .sc-tile { transition: transform .3s cubic-bezier(.34,1.5,.64,1); transform-box: view-box; }
          .${cls}:hover .sc-tile { transform: translateY(-7px); }
        }
      `}</style>
      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <rect width="400" height="240" rx="16" fill={accent} opacity="0.07" />

      {/* Corner marks keep the composition from floating in the middle. */}
      <circle cx="46" cy="46" r="7" fill={accent} opacity="0.35" />
      <circle cx="354" cy="194" r="10" fill={accent} opacity="0.2" />
      <rect x="330" y="40" width="30" height="4" rx="2" fill={accent} opacity="0.28" />
      <rect x="330" y="52" width="18" height="4" rx="2" fill={accent} opacity="0.18" />

      <g className="sc-tile">
        {/* Accent glow sits under the tile so the white face reads as raised. */}
        <rect x="136" y="60" width="128" height="128" rx="34" fill={accent} opacity="0.22" />
        <rect x="142" y="52" width="116" height="116" rx="30" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
        <Glyph x={170} y={80} width={60} height={60} stroke={accent} strokeWidth={1.7} />
      </g>
    </svg>
  );
};

/* ── Coding catalogue cover ────────────────────────────────────────────
   One template for all 35 tracks of `/coding` (lib/coding.ts). It draws an
   editor window holding that track's real `sample` line, because the point
   of the unit is that you learn the field and type its syntax at the same
   time — a cover with no code on it would be selling half the promise. */

const CODE_GLYPHS: Record<string, LucideIcon> = {
  Binary, Blocks, Boxes, Braces, BrainCircuit, Briefcase, Bug, ChartColumn,
  Cloud, Component, Cpu, Database, FileCode2, Fingerprint, Gamepad2, GitBranch,
  HardDrive, Keyboard, Layers, LayoutTemplate, Lightbulb, Link2, Monitor,
  Network, Palette, SearchCode, Server, Shapes, ShieldCheck, Smartphone,
  SquareTerminal, TestTubeDiagonal, Trophy, Waypoints, Workflow,
};

export const CodeTrackCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = toneHex(params?.tone);
  const Glyph = CODE_GLYPHS[params?.codeIcon ?? ''] ?? FileCode2;
  const line = params?.codeLine ?? 'print("hello")';
  // Shrink the monospace line to whatever fits the 300px window interior —
  // samples run from 14 to 42 characters and every one has to stay on one row.
  const fontSize = Math.min(13, 300 / (line.length * 0.605));
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `ct-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .ct-win { transition: transform .3s cubic-bezier(.34,1.4,.64,1); transform-box: view-box; }
          .${cls}:hover .ct-win { transform: translateY(-5px); }
          .${cls} .ct-caret { animation: ct-blink-${idPrefix} 1s steps(1) infinite; }
          @keyframes ct-blink-${idPrefix} { 50% { opacity: 0; } }
        }
      `}</style>
      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <rect width="400" height="240" rx="16" fill={accent} opacity="0.08" />

      <circle cx="360" cy="206" r="9" fill={accent} opacity="0.2" />
      <circle cx="40" cy="30" r="6" fill={accent} opacity="0.28" />

      <g className="ct-win">
        {/* Editor chrome — the title bar is what makes it read as code */}
        <rect x="36" y="44" width="328" height="152" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
        <path d="M36 56a12 12 0 0 1 12-12h304a12 12 0 0 1 12 12v18H36z" fill={accent} opacity="0.12" />
        <circle cx="56" cy="59" r="3.5" fill={accent} opacity="0.85" />
        <circle cx="69" cy="59" r="3.5" fill="var(--thumb-dim)" />
        <circle cx="82" cy="59" r="3.5" fill="var(--thumb-dim)" />

        <Glyph x={172} y={92} width={56} height={56} stroke={accent} strokeWidth={1.6} />

        {/* The sample line, monospace, with a blinking caret at its end */}
        <text
          x="200"
          y="174"
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="var(--thumb-ink)"
          opacity="0.9"
        >
          {line}
        </text>
        <rect
          className="ct-caret"
          x={200 + (line.length * fontSize * 0.605) / 2 + 2}
          y={174 - fontSize * 0.82}
          width={fontSize * 0.55}
          height={fontSize * 1.05}
          rx="1"
          fill={accent}
        />
      </g>
    </svg>
  );
};

/* ── Book cover ────────────────────────────────────────────────────────
   One template for every book on `/books`, shipped or pasted in. It carries
   no title text: the cards print the real (localized, learner-supplied)
   title below the art, and a title baked into the SVG could not be either. */

export const BookCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = toneHex(params?.tone);
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `bk-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .bk-body { transition: transform .35s cubic-bezier(.34,1.4,.64,1); transform-box: view-box; }
          .${cls}:hover .bk-body { transform: translateY(-6px) rotate(-1.5deg); }
        }
      `}</style>
      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <rect width="400" height="240" rx="16" fill={accent} opacity="0.08" />

      <g className="bk-body">
        {/* page edges peeking out to the right of the cover */}
        <rect x="252" y="46" width="14" height="150" rx="4" fill="var(--thumb-key-2)" stroke="var(--thumb-edge)" strokeWidth="1" />
        <rect x="248" y="42" width="14" height="156" rx="4" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1" />

        {/* the cover board, with a darker spine down its left edge */}
        <rect x="134" y="34" width="120" height="172" rx="8" fill={accent} />
        <path d="M134 42a8 8 0 0 1 8-8h10v172h-10a8 8 0 0 1-8-8z" fill="#000" opacity="0.18" />

        {/* three lines of "title" on the board — shape only, never words */}
        <rect x="166" y="92" width="66" height="7" rx="3.5" fill="#fff" opacity="0.92" />
        <rect x="166" y="108" width="48" height="7" rx="3.5" fill="#fff" opacity="0.62" />
        <rect x="166" y="142" width="30" height="5" rx="2.5" fill="#fff" opacity="0.42" />
      </g>
    </svg>
  );
};

const EXAM_GLYPHS: Record<string, LucideIcon> = {
  Award, BookOpen, Calculator, FileText, Globe2, Headphones, Languages,
  Mic, PenLine, Target,
};

/* ── Exam cover ────────────────────────────────────────────────────────
   One template for every exam on `/courses` (lib/exams.ts). It draws a score
   card: the exam's glyph over a ruled answer sheet, with the score range
   printed as the one piece of text — that range is never translated, so it
   is the only string safe to bake into the art. */

export const ExamCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  const accent = toneHex(params?.tone);
  const Glyph = EXAM_GLYPHS[params?.codeIcon ?? ''] ?? Award;
  const scale = params?.codeLine ?? '';
  const idPrefix = React.useId().replace(/:/g, '');
  const cls = `ex-${idPrefix}`;

  return (
    <svg className={`${className || ''} ${cls}`} viewBox="0 0 400 240" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @media (hover: hover) and (prefers-reduced-motion: no-preference) {
          .${cls} .ex-card { transition: transform .3s cubic-bezier(.34,1.4,.64,1); transform-box: view-box; }
          .${cls}:hover .ex-card { transform: translateY(-6px); }
        }
      `}</style>
      <rect width="400" height="240" rx="16" fill="var(--thumb-panel)" />
      <rect width="400" height="240" rx="16" fill={accent} opacity="0.08" />

      <circle cx="352" cy="48" r="10" fill={accent} opacity="0.22" />
      <circle cx="44" cy="200" r="7" fill={accent} opacity="0.3" />

      <g className="ex-card">
        {/* the sheet */}
        <rect x="92" y="38" width="216" height="164" rx="12" fill="var(--thumb-key)" stroke="var(--thumb-edge)" strokeWidth="1.5" />
        {/* a coloured tab across the top, so it reads as a graded paper */}
        <path d="M92 50a12 12 0 0 1 12-12h192a12 12 0 0 1 12 12v10H92z" fill={accent} opacity="0.9" />

        <Glyph x={176} y={78} width={48} height={48} stroke={accent} strokeWidth={1.7} />

        {/* the score range — the one string that is the same in every locale */}
        <text
          x="200"
          y="152"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill={accent}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {scale}
        </text>

        {/* ruled answer lines under it */}
        <rect x="140" y="170" width="120" height="5" rx="2.5" fill="var(--thumb-dim)" />
        <rect x="160" y="182" width="80" height="5" rx="2.5" fill="var(--thumb-dim)" opacity="0.6" />
      </g>
    </svg>
  );
};

export const ThumbnailRegistry: Record<string, React.FC<SvgTemplateProps>> = {
  'EXAM_COVER': ExamCover,
  'GRADE_COVER': GradeCover,
  'SUBJECT_COVER': SubjectCover,
  'CODE_TRACK_COVER': CodeTrackCover,
  'BOOK_COVER': BookCover,
  'WORD_FORGE_COVER': WordForgeCover,
  'STAR_TYPE_COVER': StarTypeCover,
  'ALIEN_DROP_COVER': AlienDropCover,
  'SKY_HOP_COVER': SkyHopCover,
  'TUG_OF_TYPING_COVER': TugOfTypingCover,
  'BEAM_BREAK_COVER': BeamBreakCover,
  'LETTER_STAGE': LetterStageCover,
  'CODES_STAGE': CodesStageCover,
  'PHONEME_STAGE': PhonemeStageCover,
  'GRAPHEME_STAGE': GraphemeStageCover,
  'TWO_KEYS_FOCUS': TwoKeysFocus,
  'RHYTHM_LOOP': RhythmLoopCover,
  'PRECISION_TARGET': PrecisionTargetCover,
  'NINJA_ARENA_COVER': NinjaArenaCover,
  'RHINO_DASH_COVER': RhinoDashCover,
  'MINION_BOSS_COVER': MinionBossCover,
  'COURSE_FOUNDATIONS_COVER': CourseFoundationsCover,
  'SECTION_KEYS_SHOWCASE': SectionKeysShowcase,
};