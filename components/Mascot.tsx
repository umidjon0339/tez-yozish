import React from "react";

// The app mascot: a little typing ninja. Pure stateless SVG (no hooks) so it
// renders in both server and client components. Palette matches the app:
// neutral suit + emerald headband, amber/blue accents per mood.

export type MascotMood = "happy" | "focused" | "oops" | "celebrate";

export function Mascot({
  mood = "happy",
  className = "w-24 h-24",
}: {
  mood?: MascotMood;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Arms raised when celebrating */}
      {mood === "celebrate" && (
        <>
          <rect
            x="0"
            y="40"
            width="28"
            height="12"
            rx="6"
            fill="#262626"
            transform="rotate(-42 14 46)"
          />
          <rect
            x="92"
            y="40"
            width="28"
            height="12"
            rx="6"
            fill="#262626"
            transform="rotate(42 106 46)"
          />
        </>
      )}

      {/* Head / hood */}
      <circle cx="60" cy="62" r="46" fill="#262626" />

      {/* Face opening */}
      <ellipse cx="60" cy="60" rx="33" ry="21" fill="#FFDDB3" />

      {/* Headband */}
      <path d="M 15 46 Q 60 30 105 46 L 105 58 Q 60 42 15 58 Z" fill="#10B981" />
      {/* Knot tails */}
      <path d="M 101 50 q 15 -3 17 10 q -11 3 -17 -4 z" fill="#059669" />
      <path d="M 102 55 q 12 7 7 17 q -10 -3 -11 -11 z" fill="#059669" />

      {/* ── Eyes per mood ── */}
      {mood === "happy" && (
        <>
          <path
            d="M 40 64 Q 46 56 52 64"
            stroke="#262626"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 68 64 Q 74 56 80 64"
            stroke="#262626"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <circle cx="37" cy="70" r="4" fill="#F9A8D4" opacity="0.55" />
          <circle cx="83" cy="70" r="4" fill="#F9A8D4" opacity="0.55" />
        </>
      )}

      {mood === "focused" && (
        <>
          <path d="M 38 54 L 52 58" stroke="#262626" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 82 54 L 68 58" stroke="#262626" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="40" y="62" width="12" height="5" rx="2.5" fill="#262626" />
          <rect x="68" y="62" width="12" height="5" rx="2.5" fill="#262626" />
        </>
      )}

      {mood === "oops" && (
        <>
          <path
            d="M 40 54 Q 46 50 52 54"
            stroke="#262626"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="46" cy="63" r="4.5" fill="#262626" />
          <circle cx="74" cy="62" r="6.5" fill="#262626" />
          <circle cx="76" cy="60" r="2" fill="#FFFFFF" />
          {/* sweat drop */}
          <path d="M 92 40 q 6 9 0 13 q -7 -4 0 -13" fill="#60A5FA" />
        </>
      )}

      {mood === "celebrate" && (
        <>
          <path
            d="M 46 54 L 48.2 59.5 L 54 61.5 L 48.2 63.5 L 46 69 L 43.8 63.5 L 38 61.5 L 43.8 59.5 Z"
            fill="#F59E0B"
          />
          <path
            d="M 74 54 L 76.2 59.5 L 82 61.5 L 76.2 63.5 L 74 69 L 71.8 63.5 L 66 61.5 L 71.8 59.5 Z"
            fill="#F59E0B"
          />
          <circle cx="37" cy="70" r="4" fill="#F9A8D4" opacity="0.55" />
          <circle cx="83" cy="70" r="4" fill="#F9A8D4" opacity="0.55" />
        </>
      )}
    </svg>
  );
}
