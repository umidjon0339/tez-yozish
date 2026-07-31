/*
 * Extracts the hands artwork out of components/keyboard/hands.tsx into a plain,
 * self-contained .svg that any viewer can open (browser, Inkscape, Figma,
 * Illustrator). Everything React- or CSS-variable-shaped is resolved:
 *
 *   • the <style> block is dropped; every .stN class becomes presentation
 *     attributes on the element itself (Figma ignores <style> in SVG)
 *   • var(--fz, var(--hands-accent, #3b82f6)) → the literal #3b82f6
 *   • <use href="#pose-x"> is inlined, so no cross-references are needed
 *   • <feDropShadow> is expanded into primitives older viewers understand
 *   • JSX attribute spellings (className, xmlSpace, floodColor…) → SVG ones
 */
import fs from "node:fs";
import path from "node:path";
import { SKIN } from "../components/keyboard/skinTones.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SRC = path.join(ROOT, "components/keyboard/hands.tsx");
const OUT = path.join(ROOT, "public/hands/classic-hands.svg");

/* The class table from the component's <style> block, resolved to plain
   attributes. Light ("theme-bone") look — the dark/robot/kingfish variants are
   theme overrides and have no meaning in a standalone file. */
const CLASS_ATTRS = {
  st0: 'display="none"',
  st1: 'display="inline" fill="#ffffff" fill-opacity="0.55" filter="url(#hands-soft-shadow)"',
  st2: 'display="inline" fill="none" stroke="#8fa0b5" stroke-width="1.75" stroke-linecap="round" stroke-miterlimit="10"',
  st3: 'display="inline" opacity="0.45"',
  st4: 'fill="#94a3b8"',
  // .st5 is the guide finger; --fz/--hands-accent resolve to the default accent
  st5: 'display="inline" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-miterlimit="10"',
};

const JSX_ATTRS = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  strokeDasharray: "stroke-dasharray",
  strokeOpacity: "stroke-opacity",
  fillOpacity: "fill-opacity",
  fillRule: "fill-rule",
  clipRule: "clip-rule",
  clipPath: "clip-path",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  floodColor: "flood-color",
  floodOpacity: "flood-opacity",
  colorInterpolationFilters: "color-interpolation-filters",
  xlinkHref: "xlink:href",
  xmlSpace: "xml:space",
  xmlnsXlink: "xmlns:xlink",
};

let src = fs.readFileSync(SRC, "utf8");

/* ── 1. slice out just the <svg> element ─────────────────────────────────── */
const svgStart = src.indexOf("<svg");
const svgEnd = src.lastIndexOf("</svg>") + "</svg>".length;
if (svgStart < 0 || svgEnd < 6) throw new Error("no <svg> found in hands.tsx");
let s = src.slice(svgStart, svgEnd);

/* ── 2. strip React-only bits ────────────────────────────────────────────── */
s = s.replace(/<style[\s\S]*?<\/style>/g, "");     // the CSS class block
s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");         // {/* JSX comments */}
s = s.replace(/\s*ref=\{svgRef\}/g, "");
s = s.replace(/\s*style=\{\{\}\}/g, "");
s = s.replace(/\s*\{\.\.\.props\}/g, "");

// viewBox / className on the root are template literals — replace by hand.
s = s.replace(/viewBox=\{`[^`]*`\}/, 'viewBox="-53.86 110.2 825 306.68"');
s = s.replace(/\s*className=\{`[^`]*`\}/, "");

/* ── 3. classes → presentation attributes ────────────────────────────────── */
s = s.replace(/className="(st\d)"/g, (m, cls) => {
  if (!CLASS_ATTRS[cls]) throw new Error(`unknown class ${cls}`);
  return CLASS_ATTRS[cls];
});
// The recolor hooks on the rose gradient stops / filter floods (handColor.ts)
// carry no information here — the elements' own attributes are the defaults.
s = s.replace(/\s*className="(?:skin|rose)-[a-z-]+"/g, "");
const leftover = s.match(/className=[^\s>]*/g);
if (leftover) throw new Error(`unconverted className: ${leftover.slice(0, 3)}`);

/* ── 4. JSX attribute spellings → SVG ones ───────────────────────────────── */
for (const [jsx, svg] of Object.entries(JSX_ATTRS)) {
  s = s.replace(new RegExp(`\\b${jsx}=`, "g"), `${svg}=`);
}

/* ── 4b. skin-palette refs → literal colors ──────────────────────────────── */
// hands.tsx reads its skin hexes from skinTones.mjs (attr={SKIN.rose.top}) —
// a standalone file needs the values themselves.
s = s.replace(/=\{(SKIN(?:\.\w+)+)\}/g, (m, expr) => {
  const val = expr.split(".").reduce((o, k) => o?.[k], { SKIN });
  if (typeof val !== "string") throw new Error(`unresolvable palette ref ${expr}`);
  return `="${val}"`;
});
const unresolved = s.match(/=\{[^}]*\}/g);
if (unresolved) throw new Error(`unconverted JSX expression: ${unresolved.slice(0, 3)}`);

/* ── 5. inline every <use href="#pose-…"> ────────────────────────────────── */
// Grab the inner markup of each <g id="pose-…"> with balanced <g> counting.
function groupInner(text, openIdx) {
  const bodyStart = text.indexOf(">", openIdx) + 1;
  let depth = 1;
  let i = bodyStart;
  while (depth > 0) {
    const next = text.slice(i).search(/<\/?g[\s>]/);
    if (next < 0) throw new Error("unbalanced <g>");
    const at = i + next;
    depth += text[at + 1] === "/" ? -1 : 1;
    i = at + 2;
  }
  const closeIdx = text.lastIndexOf("</g>", i);
  return { inner: text.slice(bodyStart, closeIdx), end: closeIdx + 4, start: openIdx };
}

const poses = new Map();
for (const m of [...s.matchAll(/<g id="(pose-[^"]+)"[^>]*>/g)]) {
  poses.set(m[1], groupInner(s, m.index).inner);
}

let inlined = 0;
s = s.replace(/<use href="#(pose-[^"]+)"(\s+transform="([^"]*)")?\s*\/>/g, (m, id, _t, tf) => {
  const inner = poses.get(id);
  if (!inner) throw new Error(`<use> points at missing ${id}`);
  inlined++;
  return tf ? `<g transform="${tf}">${inner}\n      </g>` : `<g>${inner}\n      </g>`;
});
const stillReferencing = s.match(/<use\b[^>]*>/g);
if (stillReferencing) throw new Error(`unresolved <use>: ${stillReferencing.slice(0, 2)}`);

// The pose definitions are only there to be referenced — drop them, and any
// <defs> left empty afterwards.
for (const id of poses.keys()) {
  const at = s.indexOf(`<g id="${id}"`);
  if (at < 0) continue;
  const g = groupInner(s, at);
  s = s.slice(0, g.start) + s.slice(g.end);
}
s = s.replace(/<defs>\s*<\/defs>/g, "");

/* ── 6. portable drop shadow ─────────────────────────────────────────────── */
s = s.replace(
  /<feDropShadow[^>]*\/>/,
  [
    '<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="hs-blur" />',
    '<feOffset in="hs-blur" dx="0" dy="4" result="hs-offset" />',
    '<feFlood flood-color="#334155" flood-opacity="0.18" result="hs-color" />',
    '<feComposite in="hs-color" in2="hs-offset" operator="in" result="hs-shadow" />',
    "<feMerge>",
    '  <feMergeNode in="hs-shadow" />',
    '  <feMergeNode in="SourceGraphic" />',
    "</feMerge>",
  ].join("\n        "),
);

/* ── 7. show the resting pose ────────────────────────────────────────────── */
// Every group ships hidden (the component un-hides one per keystroke); a static
// file should open on the neutral hands.
for (const id of ["neutral-left", "neutral-right"]) {
  const re = new RegExp(`(<g\\s+id="${id}"\\s+)display="none"`);
  if (!re.test(s)) throw new Error(`could not un-hide ${id}`);
  s = s.replace(re, '$1display="inline"');
}

/* ── 8. rebuild a clean root element ─────────────────────────────────────── */
// The JSX root carries React/overlay-only attributes. A standalone document
// wants a plain namespace plus an intrinsic size, so viewers that need one
// (Illustrator, some thumbnailers) get it.
s = s.replace(
  /^<svg[\s\S]*?>/,
  [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    '     width="825" height="306.68"',
    '     viewBox="-53.86 110.2 825 306.68">',
    "  <title>Typing hands \u2014 classic</title>",
    "  <desc>Hands resting on a keyboard. Every key pose is included as a hidden",
    '  group; change its display=&quot;none&quot; to &quot;inline&quot; to show that pose.</desc>',
  ].join("\n"),
);
s = s.replace(/\n\s*\n\s*\n+/g, "\n\n");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, s.trimStart() + "\n");

console.log(`wrote ${OUT}`);
console.log(`  ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
console.log(`  inlined ${inlined} <use> references from ${poses.size} shared poses`);
console.log(`  groups: ${(s.match(/<g\b/g) || []).length}, paths: ${(s.match(/<path\b/g) || []).length}`);
