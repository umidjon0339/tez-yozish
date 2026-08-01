import React from "react";

/**
 * The platform mark: a keyboard keycap with `Y` on it.
 *
 * Three variants are kept side by side so the look can be chosen (and
 * changed) without touching the navbar:
 *
 *   `outline` — drawn from ONE colour. A mask paints the cap in
 *               `currentColor`, punches the top face back out to transparent
 *               and draws the legend in again, so the face shows whatever is
 *               behind it and the mark inverts with the theme by itself.
 *   `depth`   — a lit keycap: gradient body, gradient top face, drop shadow.
 *   `flat`    — the same silhouette with two flat greys and no shadow.
 *
 * `depth` and `flat` carry **painted** colours, so unlike `outline` they do
 * not follow the theme — see the `themed` note on each. Every gradient,
 * filter and mask id is `useId()`-namespaced: these are referenced by
 * `url(#id)`, and two marks on one page sharing an id makes one of them
 * render blank.
 *
 * The browser-tab versions live in `app/icon.svg` (active) and
 * `public/brand/` (the alternates). Change a variant, change its icon file.
 */

export type BrandVariant = "outline" | "depth" | "flat";

export const BRAND_VARIANTS: BrandVariant[] = ["outline", "depth", "flat"];

type Props = { className?: string; variant?: BrandVariant };

/** Legend shared by `depth` and `flat` — a stemmed Y on their 64×64 grid. */
const Y_PATH =
  "M20 19 L31 32 V44 H33 V32 L44 19 H39.5 L32 29 L24.5 19 Z";

export function BrandMark({ className = "", variant = "outline" }: Props) {
  const raw = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `bm${raw}`;

  if (variant === "depth") {
    return (
      <svg
        viewBox="0 0 64 64"
        className={className}
        role="img"
        aria-label="tez/yozish"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B3B3B" />
            <stop offset="100%" stopColor="#111111" />
          </linearGradient>
          <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4A4A4A" />
            <stop offset="100%" stopColor="#202020" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.35" />
          </filter>
        </defs>

        <g filter={`url(#${id}-shadow)`}>
          <rect x="4" y="4" width="56" height="56" rx="13" fill={`url(#${id}-body)`} />
          <rect
            x="10"
            y="8"
            width="44"
            height="38"
            rx="9"
            fill={`url(#${id}-top)`}
            stroke="#666"
            strokeWidth="1"
          />
          <path d="M20 20 L30.5 33 V44 H33.5 V33 L44 20 H39.8 L32 30 L24.2 20 Z" fill="white" />
        </g>
      </svg>
    );
  }

  if (variant === "flat") {
    return (
      <svg
        viewBox="0 0 64 64"
        className={className}
        role="img"
        aria-label="tez/yozish"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="5" y="5" width="54" height="54" rx="12" fill="#181818" />
        <rect x="10" y="9" width="44" height="37" rx="8" fill="#2C2C2C" />
        <path d={Y_PATH} fill="#FFF" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="tez/yozish"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        {/* nothing painted by default … */}
        <rect width="32" height="32" fill="black" />
        {/* … the keycap body … */}
        <rect x="2" y="1.5" width="28" height="29" rx="7" fill="white" />
        {/* … its top face punched back out, leaving the front edge thicker
            than the sides, which is what reads as a key rather than a box … */}
        <rect x="5" y="4" width="22" height="20" rx="5" fill="black" />
        {/* … and the legend drawn back in. */}
        <path
          d="M11 8.6 L16 14.2 L21 8.6 M16 14.2 L16 19.6"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>

      <rect width="32" height="32" fill="currentColor" mask={`url(#${id}-m)`} />
    </svg>
  );
}
