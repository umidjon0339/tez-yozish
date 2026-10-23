import React from 'react';
import { SvgTemplateProps } from '@/types/thumbnail';

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
