/*
 * Bakes the per-pose finger-colour data the hands SVG paints with.
 *
 *   components/keyboard/hands.tsx        →  fingerBands.classic.generated.ts
 *   components/keyboard/handsFemale.tsx  →  fingerBands.female.generated.ts
 *
 * For every pose it writes one outline `d` (the contour plus the crease lines,
 * concatenated into a single path) and the gradient that paints it: an axis
 * across the hand with four stops at the finger boundaries, plus a second axis
 * along the fingers that fades the colour out before it reaches the palm. The
 * geometry is in scripts/lib/finger-bands.mjs; poses it gets wrong are pinned
 * in scripts/lib/finger-band-overrides.mjs.
 *
 * Run it AFTER `npm run build:hands` — the female table is derived from the
 * reshaped artwork, so stale hand geometry means stale bands.
 *
 * Usage: npm run build:finger-bands [-- --sheet]
 *        --sheet also writes .next/finger-bands.svg, every pose rendered with
 *        its colours, for eyeballing the result.
 */
import fs from "node:fs";
import path from "node:path";
import { fingerBands, polyOf, FINGERS } from "./lib/finger-bands.mjs";
import { OVERRIDES } from "./lib/finger-band-overrides.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CSS = path.join(ROOT, "app/globals.css");

const VARIANTS = [
  { id: "classic", src: "components/keyboard/hands.tsx", out: "components/keyboard/fingerBands.classic.generated.ts" },
  { id: "female", src: "components/keyboard/handsFemale.tsx", out: "components/keyboard/fingerBands.female.generated.ts" },
];

/* ── key → finger zone, read from the finger-zone rules themselves ───────── */
function zoneMap() {
  const css = fs.readFileSync(CSS, "utf8");
  const map = {};
  for (const m of css.matchAll(/\.kb-stage :is\(([^)]*)\)\s*\{\s*--fz:\s*var\(--fz-([\w-]+)\)/g)) {
    for (const sel of m[1].split(",")) {
      const id = sel.trim().replace(/^#/, "");
      if (id) map[id] = m[2];
    }
  }
  if (!Object.keys(map).length) throw new Error("no finger-zone rules found in globals.css — did the selectors change?");
  return map;
}

/* which hand a thumb pose belongs to — the same split the pose toggling uses */
function leftHandKeys() {
  const km = fs.readFileSync(path.join(ROOT, "components/keyboard/keymap.ts"), "utf8");
  const m = km.match(/export const LEFT_HAND_KEYS = new Set\(\[([\s\S]*?)\]\)/);
  if (!m) throw new Error("LEFT_HAND_KEYS not found in keymap.ts");
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

/* ── pose extraction ─────────────────────────────────────────────────────── */
function poses(doc) {
  const re = /<g\s+id="([\w-]+)"/g;
  const marks = [];
  let m;
  while ((m = re.exec(doc))) marks.push({ id: m[1], at: m.index });
  const out = [];
  for (let i = 0; i < marks.length; i++) {
    const block = doc.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : doc.length);
    /* keys that reuse another key's drawing: <g id="capslock"><use href="#pose-a" transform="…"/></g> */
    const alias = block.match(/<use\s+href="#([\w-]+)"(?:\s+transform="([^"]*)")?\s*\/>/);
    if (alias) {
      out.push({ id: marks[i].id, aliasOf: alias[1], transform: alias[2] || null });
      continue;
    }
    const ps = [...block.matchAll(/<path\b[\s\S]*?\/>/g)]
      .map((p) => ({ cls: (p[0].match(/className="([^"]*)"/) || [])[1], d: (p[0].match(/\sd="([^"]*)"/) || [])[1] }))
      .filter((p) => p.d);
    const st2 = ps.filter((p) => p.cls === "st2");
    if (!st2.length) continue;
    const contour = st2.slice().sort((a, b) => b.d.length - a.d.length)[0];
    out.push({
      id: marks[i].id,
      contour: contour.d,
      creases: st2.filter((p) => p !== contour).map((p) => p.d),
      guide: (ps.find((p) => p.cls === "st5") || {}).d,
    });
  }
  return out;
}

/* pose id → key id: shared poses are named `pose-<key>`, and a couple of them
   stand in for a modifier that lives under a different id on the keyboard */
const KEY_ALIAS = { "option-left": "alt-left", "option-right": "alt-right" };
function keyOf(poseId) {
  const bare = poseId.replace(/^pose-/, "");
  return KEY_ALIAS[bare] ?? bare;
}

function sideOf(poseId, key, zone, leftKeys) {
  if (zone && zone !== "thumb") return zone.startsWith("l-") ? "left" : "right";
  if (zone === "thumb") return leftKeys.has(key) ? "left" : "right";
  if (poseId.includes("left")) return "left";
  if (poseId.includes("right")) return "right";
  return null;
}

/* ── build ───────────────────────────────────────────────────────────────── */
const ZONES = zoneMap();
const LEFT_KEYS = leftHandKeys();
const wantSheet = process.argv.includes("--sheet");
const wantCheck = process.argv.includes("--check");
const COLS = { pinky: "#d8964b", ring: "#9333ea", middle: "#dc2626", index: "#16a34a", thumb: "#2563eb" };

for (const variant of VARIANTS) {
  const file = path.join(ROOT, variant.src);
  if (!fs.existsSync(file)) {
    console.warn(`skipping ${variant.id}: ${variant.src} not found (run npm run build:hands first)`);
    continue;
  }
  const doc = fs.readFileSync(file, "utf8");
  const list = poses(doc);
  const rows = [];
  const cells = [];
  const byId = new Map();
  const report = [];
  let missing = 0;

  for (const pose of list) {
    if (pose.aliasOf) continue;                      // resolved in a second pass
    const key = keyOf(pose.id);
    const zone = ZONES[key] ?? null;
    const side = sideOf(pose.id, key, zone, LEFT_KEYS);
    if (!side) { missing++; continue; }
    const guideFinger = zone && zone !== "thumb" ? zone.slice(2) : zone === "thumb" ? "thumb" : null;
    let b = null;
    try {
      b = fingerBands(pose, side, pose.guide ? guideFinger : null, OVERRIDES[pose.id] ?? null);
    } catch (err) {
      console.warn(`  ${pose.id}: ${err.message}`);
    }
    if (!b) { missing++; continue; }
    const d = [pose.contour, ...pose.creases].join(" ");
    /* the pressing finger is traced exactly by the guide path, so it is drawn
       last in its own colour — a finger that reaches across its neighbours
       can't be placed by a band, and that is the finger that matters most */
    const guideZone = pose.guide && zone ? zone : null;
    const row = { id: pose.id, side: b.side, d, axis: b.axis, stops: b.stops, fade: b.fade,
      guide: guideZone ? pose.guide : null, guideZone };
    rows.push(row);
    byId.set(pose.id, row);
    if (wantSheet) cells.push({ pose, b });
    if (wantCheck) {
      const empty = b.share.map((s, i) => [FINGERS[i], s]).filter(([, s]) => s < 0.045);
      if (empty.length) {
        report.push(`  ${pose.id.padEnd(20)} ${b.side.padEnd(5)} guide=${(b.guideFinger || "—").padEnd(6)} ` +
          `evidence=${b.evidence} anchored=${b.anchored ? "y" : "n"} ` +
          `thin=[${empty.map(([f, s]) => `${f} ${(s * 100).toFixed(1)}%`).join(", ")}] ` +
          `stops=[${b.fractions.map((f) => f.toFixed(3)).join(", ")}] evidenceAt=[${(b.evidenceAt||[]).map((f) => f.toFixed(3)).join(", ")}]${OVERRIDES[pose.id] ? " (override)" : ""}`);
      }
    }
  }

  /* the keys that reuse another key's drawing get the same band, moved with it */
  for (const pose of list) {
    if (!pose.aliasOf) continue;
    const base = byId.get(pose.aliasOf);
    if (!base) { missing++; continue; }
    rows.push({ ...base, id: pose.id, transform: pose.transform });
  }

  const num = (v) => Math.round(v * 100) / 100;
  const body = rows
    .map((r) => `  "${r.id}": { hand: "${r.side}", axis: [${r.axis.map(num)}], stops: [${r.stops.map((s) => Math.round(s * 1e4) / 1e4)}], fade: [${r.fade.map(num)}]${r.transform ? `, transform: "${r.transform}"` : ""}${r.guide ? `, guide: "${r.guide}", guideZone: "${r.guideZone}"` : ""}, d: "${r.d}" },`)
    .join("\n");
  const out = `// GENERATED FILE — do not edit by hand.
// \`npm run build:finger-bands\` rebuilds it from ${path.basename(variant.src)}.
// One entry per hand pose, used by the "finger colours" toggle: \`d\` is the
// pose outline (contour + creases) drawn again on top in colour, \`axis\`/\`stops\`
// are the gradient across the hand that gives each finger its own key colour,
// and \`fade\` is the axis along the fingers that fades that colour out before
// it runs down into the palm. See docs/keyboard.md.
import type { FingerBandTable } from "./fingerBands";

export const FINGER_BANDS: FingerBandTable = {
${body}
};
`;
  fs.writeFileSync(path.join(ROOT, variant.out), out);
  console.log(`${variant.id}: ${rows.length} poses → ${variant.out}${missing ? ` (${missing} skipped)` : ""}`);
  if (wantCheck && report.length) console.log(`${report.length} pose(s) with a band holding almost no hand:\n${report.join("\n")}`);

  if (wantSheet && variant.id === "classic") {
    const CW = 300;
    const CH = 210;
    const PER = 6;
    let defs = "";
    let g = "";
    cells.forEach((c, n) => {
      const P = polyOf(c.pose.contour);
      const xs = P.map((q) => q[0]);
      const ys = P.map((q) => q[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const sc = Math.min((CW - 20) / (x1 - x0), (CH - 34) / (y1 - y0));
      const pal = FINGERS.map((f) => COLS[f]);
      let stops = `<stop offset="0%" stop-color="${pal[0]}"/>`;
      c.b.stops.forEach((s, i) => {
        const o = (s * 100).toFixed(2);
        stops += `<stop offset="${o}%" stop-color="${pal[i]}"/><stop offset="${o}%" stop-color="${pal[i + 1]}"/>`;
      });
      stops += `<stop offset="100%" stop-color="${pal[4]}"/>`;
      defs += `<linearGradient id="b${n}" gradientUnits="userSpaceOnUse" x1="${c.b.axis[0]}" y1="${c.b.axis[1]}" x2="${c.b.axis[2]}" y2="${c.b.axis[3]}">${stops}</linearGradient>
        <linearGradient id="f${n}" gradientUnits="userSpaceOnUse" x1="${c.b.fade[0]}" y1="${c.b.fade[1]}" x2="${c.b.fade[2]}" y2="${c.b.fade[3]}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
        <mask id="m${n}"><rect x="-400" y="-400" width="2000" height="1400" fill="url(#f${n})"/></mask>`;
      const lines = [c.pose.contour, ...c.pose.creases];
      const col = n % PER;
      const row = Math.floor(n / PER);
      g += `<g transform="translate(${col * CW},${row * CH})">
        <rect width="${CW - 4}" height="${CH - 4}" fill="#fff" stroke="#e2e8f0"/>
        <text x="8" y="14" font-size="11" font-family="monospace" fill="#334155">${c.pose.id} · ${c.b.side} · ${c.b.guideFinger || "—"}${OVERRIDES[c.pose.id] ? " ·fixed" : ""}</text>
        <g transform="translate(10,24) scale(${sc.toFixed(3)}) translate(${-x0},${-y0})">
          ${lines.map((d) => `<path d="${d}" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>`).join("")}
          <g mask="url(#m${n})">${lines.map((d) => `<path d="${d}" fill="none" stroke="url(#b${n})" stroke-width="3"/>`).join("")}</g>
        </g></g>`;
    });
    const rowsN = Math.ceil(cells.length / PER);
    fs.mkdirSync(path.join(ROOT, ".next"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, ".next/finger-bands.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" width="${PER * CW}" height="${rowsN * CH}"><defs>${defs}</defs><rect width="100%" height="100%" fill="#f8fafc"/>${g}</svg>`);
    console.log("sheet: .next/finger-bands.svg");
  }
}
