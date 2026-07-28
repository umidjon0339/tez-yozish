/*
 * Generates every reshaped hand — both the React components the lesson runtime
 * renders and the standalone SVGs — from the original artwork.
 *
 *   components/keyboard/hands.tsx   →  handsSlim.tsx, handsFemale.tsx
 *   public/hands/classic-hands.svg  →  slim-hands.svg, female-hands.svg
 *
 * Shapes live in scripts/lib/hand-profiles.mjs; the erosion itself is in
 * scripts/lib/hand-geometry.mjs. Only path `d` data changes — classes, theme
 * rules, the `--fz` guide colour and the pose-toggling effect are copied
 * through untouched, so every generated component stays a drop-in for the
 * classic <Keyboard />.
 *
 * Usage: npm run build:hands
 */
import fs from "node:fs";
import path from "node:path";
import { groupPoses, slimPose } from "./lib/hand-geometry.mjs";
import { PROFILES } from "./lib/hand-profiles.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const TSX_SRC = path.join(ROOT, "components/keyboard/hands.tsx");
const SVG_SRC = path.join(ROOT, "public/hands/classic-hands.svg");

const getD = (tag) => tag.match(/\sd="([^"]*)"/)[1];
const setD = (tag, d) => tag.replace(/(\sd=")[^"]*(")/, `$1${d}$2`);

/** Split a document on <path> elements, tagging each with its <g> nesting depth. */
function splitPaths(doc) {
  const parts = doc.split(/(<path\b[^>]*\/>)/);
  const tags = [];
  let depth = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      depth += (parts[i].match(/<g\b/g) || []).length - (parts[i].match(/<\/g>/g) || []).length;
    } else {
      tags.push({ i, depth, tag: parts[i] });
    }
  }
  return { parts, tags };
}

/** Reshape every pose in a document and return it rebuilt. */
function reshape(doc, isSilhouette, shape) {
  const { parts, tags } = splitPaths(doc);
  const units = groupPoses(tags, isSilhouette);
  if (!units.length) throw new Error("no silhouettes found — did the source change shape?");

  let silhouettes = 0;
  let carried = 0;
  for (const u of units) {
    const others = u.members.filter((m) => !u.silhouettes.includes(m));
    const out = slimPose(
      u.silhouettes.map((s) => getD(s.tag)),
      others.map((m) => getD(m.tag)),
      shape,
    );
    u.silhouettes.forEach((s, k) => (parts[s.i] = setD(s.tag, out.silhouettes[k])));
    others.forEach((m, k) => (parts[m.i] = setD(m.tag, out.others[k])));
    silhouettes += u.silhouettes.length;
    carried += others.length;
  }
  return { doc: parts.join(""), poses: units.length, silhouettes, carried };
}

const tsxSrc = fs.readFileSync(TSX_SRC, "utf8");
const svgSrc = fs.readFileSync(SVG_SRC, "utf8");

for (const p of PROFILES) {
  /* ── the component ─────────────────────────────────────────────────────── */
  const tsx = reshape(tsxSrc, (t) => t.includes('className="st1"'), p.shape);
  let out = tsx.doc.replace(
    /export const Keyboard = memo\(function Keyboard\(/,
    `export const ${p.componentName} = memo(function ${p.componentName}(`,
  );
  if (out === tsx.doc) throw new Error("could not find the Keyboard component to rename");

  const banner = `// GENERATED FILE — do not edit by hand.
// \`npm run build:hands\` rebuilds it from hands.tsx by reshaping the finger
// geometry (scripts/lib/hand-profiles.mjs → "${p.id}"). Everything else —
// classes, themes, the --fz guide colour, the pose-toggling effect — is a
// straight copy, so this component is a drop-in replacement for the classic
// <Keyboard />. Edit hands.tsx and re-run; edits here will be overwritten.

`;
  const tsxDest = path.join(ROOT, p.tsx);
  fs.writeFileSync(tsxDest, banner + out);

  /* ── the standalone svg ────────────────────────────────────────────────── */
  const svg = reshape(svgSrc, (t) => t.includes('fill-opacity="0.55"'), p.shape);
  let doc = svg.doc;
  for (const [re, to] of p.svgRestyle ?? []) doc = doc.replace(re, to);
  doc = doc.replace(/<title>[^<]*<\/title>/, `<title>${p.title}</title>`);
  doc = doc.replace(
    /<desc>[\s\S]*?<\/desc>/,
    `<desc>Hands resting on a keyboard, reshaped from classic-hands.svg with\n` +
      `  ${p.desc}. Every key pose is included as a hidden group; change its\n` +
      `  display=&quot;none&quot; to &quot;inline&quot; to show that pose.</desc>`,
  );
  const svgDest = path.join(ROOT, p.svg);
  fs.writeFileSync(svgDest, doc);

  console.log(`${p.id}:`);
  console.log(`  ${p.tsx}  ${(fs.statSync(tsxDest).size / 1024).toFixed(0)} KB  (${tsx.poses} poses)`);
  console.log(`  ${p.svg}  ${(fs.statSync(svgDest).size / 1024).toFixed(0)} KB  (${svg.poses} poses)`);
  console.log(`  inset ${p.shape.atFingers} at the fingers → ${p.shape.atWrist} at the wrist`);
}
