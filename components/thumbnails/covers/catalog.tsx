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
import { Award, FileText, Gauge, Headphones, Mic, PenLine, Target } from 'lucide-react';
import { SvgTemplateProps } from '@/types/thumbnail';

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
   One template for all 35 tracks of `/coding` (lib/catalog/coding.ts). It draws an
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
  Award, BookOpen, Braces, Calculator, FileText, Gauge, Globe2, GraduationCap,
  Headphones, Keyboard, Languages, Mic, PenLine, Target,
};

/* ── Exam cover ────────────────────────────────────────────────────────
   One template for every exam on `/courses` (lib/catalog/exams.ts). It draws a score
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
