// Single source of truth for the skin-tone hand palettes: `flesh` is the
// "realistic" style (.theme-flesh), `rose` the "female" one (.theme-rose).
// Plain .mjs so both the React components and the node build scripts can
// import it. Everything that draws or bakes a skin-toned hand reads it:
//
//   components/keyboard/hands.tsx  — runtime <style> block + gradient/filter
//     defs (copied into handsSlim.tsx / handsFemale.tsx by build:hands)
//   scripts/hands-previews.mjs     — bakes the picker thumbnails
//   scripts/extract-hands-svg.mjs  — resolves the refs in classic-hands.svg
//   scripts/lib/hand-profiles.mjs  — the female standalone svg's line color
//
// Change a color here, then run `npm run hands:rebuild` so the generated
// components, standalone svgs and thumbnails all pick it up.

export const SKIN = {
  flesh: {
    accent: "#e0793a", // --hands-accent: guide-finger fallback outside .kb-stage
    top: "#f2cfae", // skin gradient, lit end (upper left)
    bottom: "#dfa87e", // skin gradient, shaded end (lower right)
    crease: "#9a6b4f", // .st2 finger-gap / crease lines
    creaseDark: "#c08a63", // the same lines under .theme-dark
    nail: "#b07a55", // .st4 nail shapes
  },
  rose: {
    accent: "#db2777",
    top: "#fadbcf",
    bottom: "#e8b0a2",
    crease: "#a4818a",
    creaseDark: "#c99aa2",
    nail: "#e59aa6",
  },
};

/** The lighting pass both skins share: flood colors of the #hands-flesh
 *  (edge shading) and #hands-crease (line shading) filters. */
export const SKIN_LIGHTING = {
  shadow: "#8a5230", // ambient-occlusion band along every outer edge
  highlight: "#fff6ec", // upper-left rim light
  creaseShadow: "#7a4a2c", // crease valley, shadow side
  creaseHighlight: "#fff3e6", // crease valley, lit side
};
