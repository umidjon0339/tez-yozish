/*
 * The hand shapes we generate from the original artwork.
 *
 * Every profile is the SAME poses reshaped by a different erosion depth (see
 * hand-geometry.mjs), so all of them keep pointing at the key each pose was
 * drawn for. Adding a hand shape is one entry here plus a `HAND_STYLES` entry
 * in components/keyboard/handStyle.ts.
 *
 * `atFingers` / `atWrist` are how far the outline is pulled inward, in user
 * units, at the fingertip end and at the wrist. A finger in this artwork is
 * ~24 units across, so each unit of inset takes ~8% off a finger while barely
 * touching the ~150-unit palm — which is what makes the shapes read as
 * different hands rather than as one hand scaled.
 */
import { DEFAULT_SHAPE } from "./hand-geometry.mjs";
import { SKIN } from "../../components/keyboard/skinTones.mjs";

export const PROFILES = [
  {
    id: "female",
    componentName: "FemaleKeyboard",
    tsx: "components/keyboard/handsFemale.tsx",
    svg: "public/hands/female-hands.svg",
    // Shaped after the average anatomical differences: markedly more slender
    // fingers (deep inset at the fingertip end — the taper, since erosion is
    // strongest there, also makes fingers read longer relative to the palm),
    // and a narrower palm / slimmer wrist (milder inset at the wrist end,
    // still clearly below the finger inset so the palm keeps its mass).
    // Keep the fingertip inset ≤ ~4 units: worst-case point movement must stay
    // well under half a key width (~25 units) so every pose still points at
    // its own key. The wide tangent window + extra smoothing passes keep the
    // offset edges straight — at this depth the default window/passes leave
    // fingers visibly lumpy (thick here, pinched there) and pull the crease
    // lines off the silhouette.
    // gapR keeps the slots between pressed-together fingers closed (see
    // closeGaps in hand-geometry.mjs) — without it the skin fill shows a
    // white crack down the middle of the hand (the source art leaves a
    // 1-2 unit slit there; erosion widens it). gapArcSep is lowered so the
    // closing reaches almost down to the slot's U-turn.
    shape: {
      ...DEFAULT_SHAPE,
      atFingers: 3.2,
      atWrist: 1.3,
      window: 13,
      smoothPasses: 5,
      gapR: 7,
      gapArcSep: 10,
    },
    /** restyle applied to the standalone svg only */
    svgRestyle: [
      [/stroke="#8fa0b5" stroke-width="1\.75"/g, `stroke="${SKIN.rose.crease}" stroke-width="1.35"`],
      [
        /stroke-linecap="round" stroke-miterlimit="10"/g,
        'stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"',
      ],
    ],
    title: "Typing hands — female",
    desc: "slender, tapered fingers on a narrower palm",
  },
];

export const getProfile = (id) => PROFILES.find((p) => p.id === id);
