// Single source of truth for the skin-tone hand palette: `rose` is the
// "female" style (.theme-rose), drawn on the classic art.
// Plain .mjs so both the React component and the node build scripts can
// import it. Everything that draws or bakes a skin-toned hand reads it:
//
//   components/keyboard/hands.tsx  — runtime <style> block + gradient/filter defs
//   scripts/hands-previews.mjs     — bakes the picker thumbnails
//   scripts/extract-hands-svg.mjs  — resolves the refs in classic-hands.svg
//
// Change a color here, then run `npm run hands:rebuild` so the standalone
// svg and thumbnails pick it up.

export const SKIN = {
  rose: {
    accent: "#db2777", // --hands-accent: guide-finger fallback outside .kb-stage
    top: "#fadbcf", // skin gradient, lit end (upper left)
    bottom: "#e8b0a2", // skin gradient, shaded end (lower right)
    crease: "#a5646f", // deep rose, so the borders read as skin folds (not gray)
    creaseDark: "#d09aa4", // the same lines under .theme-dark
    nail: "#e59aa6", // .st4 nail shapes
    // Rose lighting: flood colors of #hands-rose / #hands-crease-rose.
    shadow: "#8e4f5c", // ambient-occlusion band along every outer edge
    highlight: "#fff1ee", // upper-left rim light
    creaseShadow: "#7c4351", // crease valley, shadow side
    creaseHighlight: "#ffeef0", // crease valley, lit side
  },
};
