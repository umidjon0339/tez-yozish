/*
 * Hand-corrected finger boundaries, for the poses the automatic pass in
 * finger-bands.mjs gets wrong.
 *
 * Four numbers per pose — pinky|ring, ring|middle, middle|index, index|thumb —
 * each a fraction of the hand's width measured ACROSS the fingers, always
 * running pinky (0) → thumb (1) whichever hand it is. So 0.25 means "a quarter
 * of the way across from the pinky edge".
 *
 * To retune one: run `npm run build:finger-bands -- --sheet`, open
 * `.next/finger-bands.svg`, find the pose, and nudge. The renderer never sees
 * these — the build bakes them into the generated table.
 */
export const OVERRIDES = {
};
