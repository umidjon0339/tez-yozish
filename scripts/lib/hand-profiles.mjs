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
    id: "slim",
    componentName: "SlimKeyboard",
    tsx: "components/keyboard/handsSlim.tsx",
    svg: "public/hands/slim-hands.svg",
    shape: { ...DEFAULT_SHAPE, atFingers: 2.5, atWrist: 0.7 },
    /** restyle applied to the standalone svg only */
    svgRestyle: [
      [/stroke="#8fa0b5" stroke-width="1\.75"/g, 'stroke="#96a1ad" stroke-width="1.45"'],
      [
        /stroke-linecap="round" stroke-miterlimit="10"/g,
        'stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"',
      ],
    ],
    title: "Typing hands — slim",
    desc: "narrower fingers",
  },
  {
    id: "female",
    componentName: "FemaleKeyboard",
    tsx: "components/keyboard/handsFemale.tsx",
    svg: "public/hands/female-hands.svg",
    // Deeper inset, and a wider gap between the two numbers than `slim` uses:
    // that difference is the taper, since the erosion is strongest at the
    // fingertip end. Narrow tapering fingers on a palm that stays broad enough
    // to still read as a palm.
    shape: { ...DEFAULT_SHAPE, atFingers: 4.1, atWrist: 1.5 },
    svgRestyle: [
      [/stroke="#8fa0b5" stroke-width="1\.75"/g, `stroke="${SKIN.rose.crease}" stroke-width="1.35"`],
      [
        /stroke-linecap="round" stroke-miterlimit="10"/g,
        'stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"',
      ],
    ],
    title: "Typing hands — female",
    desc: "slender, tapered fingers",
  },
];

export const getProfile = (id) => PROFILES.find((p) => p.id === id);
