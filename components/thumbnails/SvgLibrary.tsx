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

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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
           <g key={`key-${i}`}>
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

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id={`${idPrefix}-floatShadow`} x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.08"/>
         </filter>
       </defs>

       <rect width="400" height="240" rx="16" fill="#F4F4F5" />
       
       {/* Thick Background Track */}
       <path d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke="#E4E4E7" strokeWidth="16" fill="none" />
       
       {/* Active Highlight Loop */}
       <path d="M 135 120 C 135 50, 265 50, 265 120 C 265 190, 135 190, 135 120 Z" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="16 12" fill="none" />

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

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
       <rect width="400" height="240" rx="16" fill="#FFFBEB" />
       
       {/* Speedometer Background Track */}
       <path d="M 120 160 A 80 80 0 0 1 280 160" stroke="#FDE68A" strokeWidth="12" fill="none" strokeLinecap="round" />
       
       {/* Speedometer Active Progress (Fills up to the right) */}
       <path d="M 120 160 A 80 80 0 0 1 250 100" stroke="#F59E0B" strokeWidth="12" fill="none" strokeLinecap="round" />
       
       {/* Center Hub & Needle Base */}
       <circle cx="200" cy="155" r="8" fill="#D97706" />
       <path d="M 200 155 L 240 105" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />

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
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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
// 5. LESSON 5: MINION BOSS COVER (Light Minimalist Version)
// ============================================================================
export const MinionBossCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  // Extract parameters with safe fallbacks (Defaults to a punchy red)
  const accent = params?.accentColor === 'emerald' ? '#10B981' :
                 params?.accentColor === 'amber' ? '#F59E0B' : 
                 params?.accentColor === 'blue' ? '#3B82F6' : '#EF4444';
  
  const threatCount = params?.enemyCount || 20;

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
       {/* Premium Light Background to match the app */}
       <rect width="400" height="240" rx="16" fill="#FAFAFA" />
       
       {/* Subtle background wash for depth */}
       <rect width="400" height="240" rx="16" fill="#F1F5F9" opacity="0.6" />

       {/* Accent Threat Ring (Big Warning Circle) */}
       <circle cx="200" cy="115" r="85" fill={accent} opacity="0.08" />
       <circle cx="200" cy="115" r="55" stroke={accent} strokeWidth="2" strokeDasharray="4 4" opacity="0.4" fill="none" />

       {/* SIMPLIFIED MINION GRAPHIC (1-Eye Iconic Look) */}
       <g transform="translate(165, 45)">
         {/* Main Pill Body */}
         <rect x="0" y="0" width="70" height="110" rx="35" fill="#FDE047" />
         
         {/* Blue Overalls (Simple bottom cut) */}
         <path d="M 0 75 L 70 75 L 70 95 Q 70 110 35 110 Q 0 110 0 95 Z" fill="#3B82F6" />
         
         {/* Goggle Strap */}
         <rect x="-4" y="26" width="78" height="12" rx="2" fill="#1F2937" />
         
         {/* Single Big Goggle */}
         <circle cx="35" cy="32" r="22" fill="#E5E7EB" /> {/* Metal Frame */}
         <circle cx="35" cy="32" r="16" fill="#FFFFFF" /> {/* Lens */}
         <circle cx="35" cy="32" r="6" fill="#1F2937" />  {/* Pupil */}
         
         {/* Minimalist Smile */}
         <path d="M 25 60 Q 35 65 45 60" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
       </g>

       {/* Typography */}
       <text x="200" y="200" textAnchor="middle" fontSize="20" fontWeight="900" letterSpacing="4" fontFamily="sans-serif" style={{ fill: '#0F172A' }}>
         Minions
       </text>
       
       {/* Dynamic Target Count Badge (Top Right) */}
       <rect x="290" y="15" width="95" height="24" rx="12" fill={accent} opacity="0.1" />
       <text x="337" y="31" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" style={{ fill: accent }}>
         TARGETS: {threatCount}
       </text>
    </svg>
  );
};

// ============================================================================
// 6. COURSE: FOUNDATIONS COVER (Perfected from Reference)
// ============================================================================
export const CourseFoundationsCover: React.FC<SvgTemplateProps> = ({ params, className }) => {
  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  return (
    <svg className={className} viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
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
             
             {/* Solid White Keycap */}
             <rect x={x} y={y} width={boxW} height={boxW} rx={r} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
             
             {/* Huge Dark Letter */}
             <text x={cx} y={120 + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="900" fill="#0F172A" fontFamily="monospace">
               {k.toUpperCase()}
             </text>
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