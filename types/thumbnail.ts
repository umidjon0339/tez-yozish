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
}

/**
 * The standard Props interface that EVERY SVG template in the registry must use.
 */
export interface SvgTemplateProps {
  params?: ThumbnailParams;      // The payload passed from the JSON
  className?: string;            // Allows Tailwind styling from the parent
}