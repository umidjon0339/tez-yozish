/**
 * The accent hues the catalogue covers draw with. The literal values live in
 * `TONE_HEX` (components/thumbnails/covers/catalog.tsx) — this union is just the vocabulary that
 * `lib/catalog/k12.ts` and `lib/catalog/coding.ts` assign from.
 */
export type Tone =
  | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'indigo'
  | 'teal' | 'orange' | 'lime' | 'cyan' | 'fuchsia' | 'slate';

/**
 * Defines all possible custom parameters an SVG template might accept from the JSON.
 * Every property MUST be optional (?) so the app doesn't crash if omitted.
 */
export interface ThumbnailParams {
  // Geography & Keys
  keys?: string[];               // e.g., ["f", "j"] or ["r", "u"]
  
  // Theming & Colors
  accentColor?: 'emerald' | 'blue' | 'red' | 'amber' | 'slate';
  pulseEffect?: boolean;         // Triggers CSS animations inside the SVG
  
  // Game & Metrics
  enemyCount?: number;           // e.g., 14
  targetWPM?: number;            // e.g., 20
  showClock?: boolean;           // Toggles a stopwatch graphic

  // Letter-unit lesson covers (LETTER_STAGE / CODES_STAGE)
  letter?: string;               // e.g., "b" — merged in at runtime per page
  motif?: string;                // which lesson the cover depicts, e.g. "rain"

  // Phoneme-unit lesson covers (PHONEME_STAGE)
  symbol?: string;               // IPA symbol, e.g. "iː" — merged in at runtime
  shade?: string;                // allophone symbol on SHADE covers, e.g. "iˑ"

  // K-12 curriculum covers (GRADE_COVER / SUBJECT_COVER) — see lib/catalog/k12.ts
  grade?: number;                // 1..11, painted as the numeral on GRADE_COVER
  subjectIcon?: string;          // SubjectIcon id, e.g. "flask" — picks the lucide glyph
  tone?: string;                 // Tone name, e.g. "violet" — accent hue for these covers

  // Coding catalogue cover (CODE_TRACK_COVER) — see lib/catalog/coding.ts
  codeIcon?: string;             // lucide component name, e.g. "Database"
  codeLine?: string;             // the sample line drawn in the editor window
}

/**
 * The standard Props interface that EVERY SVG template in the registry must use.
 */
export interface SvgTemplateProps {
  params?: ThumbnailParams;      // The payload passed from the JSON
  className?: string;            // Allows Tailwind styling from the parent
}