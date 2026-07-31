/*
 * Builds the little hand thumbnails the picker in the lesson header shows:
 * public/hands/preview-classic.svg, preview-slim.svg and preview-realistic.svg.
 *
 * They are cut from the full standalone files — one resting hand, cropped to
 * its own bounding box — so a thumbnail is ~10 KB instead of the ~500 KB the
 * complete pose sheet would cost to load.
 *
 * Usage: npm run hands:previews
 */
import fs from "node:fs";
import path from "node:path";
import { parsePath, flatten } from "./lib/hand-geometry.mjs";
import { SKIN } from "../components/keyboard/skinTones.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
/* `female` is the classic art wearing the rose theme — the thumbnail bakes
   that theme in as attributes, because these files carry no CSS. The colors
   come from skinTones.mjs, same as the `.theme-*` rules in hands.tsx. */
const skinDefs = (skin) => `<defs>
    <linearGradient id="skin" gradientUnits="userSpaceOnUse" x1="320" y1="120" x2="480" y2="390">
      <stop offset="0" stop-color="${skin.top}"/><stop offset="1" stop-color="${skin.bottom}"/>
    </linearGradient>
    <filter id="flesh" x="-25%" y="-25%" width="150%" height="150%">
      <feComponentTransfer in="SourceAlpha" result="i"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>
      <feGaussianBlur in="i" stdDeviation="4" result="ab"/>
      <feComposite in="ab" in2="SourceAlpha" operator="in" result="am"/>
      <feFlood flood-color="${skin.shadow}" flood-opacity="0.5" result="ac"/>
      <feComposite in="ac" in2="am" operator="in" result="ao"/>
      <feOffset in="i" dx="4" dy="5" result="lo"/>
      <feGaussianBlur in="lo" stdDeviation="5" result="lb"/>
      <feComposite in="lb" in2="SourceAlpha" operator="in" result="lm"/>
      <feFlood flood-color="${skin.highlight}" flood-opacity="0.8" result="lc"/>
      <feComposite in="lc" in2="lm" operator="in" result="li"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="ao"/><feMergeNode in="li"/></feMerge>
    </filter>
  </defs>`;

const SOURCES = [
  { name: "classic", src: "public/hands/classic-hands.svg" },
  {
    // `female` is the reshaped art wearing the rose theme, so its thumbnail
    // bakes that theme over female-hands.svg (rose lighting via skinDefs).
    name: "female",
    src: "public/hands/female-hands.svg",
    defs: skinDefs(SKIN.rose),
    restyle: [
      [/fill="#ffffff" fill-opacity="0\.55"/g, 'fill="url(#skin)" filter="url(#flesh)"'],
      // the female standalone already wears the rose line color (hand-profiles.mjs)
      [
        new RegExp(`stroke="#(?:8fa0b5|96a1ad|${SKIN.rose.crease.slice(1)})" stroke-width="[\\d.]+"`, "g"),
        `stroke="${SKIN.rose.crease}" stroke-width="3.6"`,
      ],
      [/fill="#94a3b8"/g, `fill="${SKIN.rose.nail}"`],
      [/ filter="url\(#hands-soft-shadow\)"/g, ""],
    ],
  },
];
/** which resting hand to show */
const GROUP = "neutral-right";
const PAD = 10;

/* Thumbnail restyle. The overlay's own line weight is 1.45–1.75 units in a
   ~190-unit viewBox, which is under 0.2px once drawn at chip size — invisible.
   These are separate files used only by the picker, so they get a heavier line
   and a mid-tone fill that reads on both the light and the dark menu. */
const RESTYLE = [
  [/stroke="#(?:8fa0b5|96a1ad)" stroke-width="[\d.]+"/g, 'stroke="#6b7280" stroke-width="5"'],
  [/fill="#ffffff" fill-opacity="0\.55"/g, 'fill="#94a3b8" fill-opacity="0.3"'],
  // the soft shadow costs bytes and shows nothing at 18px
  [/ filter="url\(#hands-soft-shadow\)"/g, ""],
];

for (const { name, src, defs = "", restyle } of SOURCES) {
  const svg = fs.readFileSync(path.join(ROOT, src), "utf8");

  // pull out just the one group (its <g> nesting is shallow and well-formed)
  const open = svg.indexOf(`<g\n      id="${GROUP}"`);
  if (open < 0) throw new Error(`${src}: no group ${GROUP}`);
  let i = svg.indexOf(">", open) + 1;
  let depth = 1;
  while (depth > 0) {
    const next = svg.slice(i).search(/<\/?g[\s>]/);
    if (next < 0) throw new Error("unbalanced <g>");
    const at = i + next;
    depth += svg[at + 1] === "/" ? -1 : 1;
    i = at + 2;
  }
  // `i` sits just past the `</g>` that closed the group — walk back to its start
  const group = svg
    .slice(open, svg.lastIndexOf("</g>", i) + 4)
    .replace(/display="none"/g, 'display="inline"');

  // bounding box of every path in the group
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const m of group.matchAll(/\sd="([^"]*)"/g)) {
    for (const p of flatten(parsePath(m[1])).flat()) {
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
  }
  // Crop off the forearm — at thumbnail size the hand itself has to fill the chip.
  y1 = y0 + (y1 - y0) * 0.74;
  const vb = [x0 - PAD, y0 - PAD, x1 - x0 + PAD * 2, y1 - y0 + PAD * 2].map((v) => Math.round(v * 10) / 10);

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}">
  <title>${name} hand</title>
  ${defs}
  ${group}
</svg>
`;
  for (const [re, to] of restyle ?? RESTYLE) out = out.replace(re, to);
  const dest = path.join(ROOT, `public/hands/preview-${name}.svg`);
  fs.writeFileSync(dest, out);
  console.log(`wrote ${dest}  ${(fs.statSync(dest).size / 1024).toFixed(1)} KB  viewBox="${vb.join(" ")}"`);
}
