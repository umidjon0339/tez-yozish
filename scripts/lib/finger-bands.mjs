/*
 * Derives, for one hand pose, the boundaries between the five finger columns —
 * the data the "finger colours" toggle paints the hands with.
 *
 * The artwork has no per-finger geometry: a pose is one silhouette, one contour
 * tracing it, a few crease lines, and a single `.st5` guide path around the one
 * finger that presses the key. So the columns are derived instead, from the two
 * signals the art does carry reliably:
 *
 *   • the guide path — it traces the pressing finger exactly, so its own two
 *     edges ARE two of the boundaries, and we know which finger it is from the
 *     key's finger zone (fingerZones.ts / globals.css).
 *   • the crease lines and the slits the contour dips into between two fingers.
 *
 * Everything is measured on two axes: `dir` along the fingers (base → tip) and
 * `perp` across the hand, oriented pinky → thumb for either hand. A boundary is
 * one number on `perp`; four of them split the hand into pinky/ring/middle/
 * index/thumb. Fingertip detection is deliberately NOT used — it misfires badly
 * on curled poses (the same reason `docs/keyboard.md` gives for hand-authored
 * nails).
 *
 * Poses the automatic pass gets wrong are corrected by hand in
 * finger-band-overrides.mjs, which pins the four boundaries as fractions of the
 * hand's width.
 */
import { parsePath, flatten } from "./hand-geometry.mjs";

/** pinky → thumb; the order the colours are laid down in */
export const FINGERS = ["pinky", "ring", "middle", "index", "thumb"];

/** Where the four boundaries sit on a hand with nothing else to go on, as
 *  fractions of its width. Measured off the home-row poses, where the crease
 *  lines and the guide agree. */
export const DEFAULT_SPLIT = [0.2, 0.38, 0.56, 0.76];

/** how far a boundary may be pulled off its default by a crease or a slit */
const SNAP = 0.09;

/** a believable width for one finger, as a share of the hand's own width —
 *  guide endpoints outside this are drawing artefacts, not boundaries */
const MIN_FINGER_SHARE = 0.1;
const MAX_FINGER_SHARE = 0.3;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** longest flattened subpath of a `d` string */
export const polyOf = (d, per = 10) => flatten(parsePath(d), per).sort((a, b) => b.length - a.length)[0];

/** the direction a polyline runs, tip (small y) → base (large y) */
function runDir(pl) {
  const a = pl[0];
  const b = pl.at(-1);
  return norm(a[1] < b[1] ? sub(b, a) : sub(a, b));
}

function polyLength(pl) {
  let l = 0;
  for (let i = 1; i < pl.length; i++) l += len(sub(pl[i], pl[i - 1]));
  return l;
}

/**
 * @param {{contour: string, creases: string[], guide?: string}} pose
 * @param {"left"|"right"} side
 * @param {string|null} guideFinger which finger the guide traces
 * @param {number[]|null} override four boundaries as fractions of the hand width
 */
export function fingerBands(pose, side, guideFinger, override = null) {
  const contour = polyOf(pose.contour);

  /* ── the two axes ─────────────────────────────────────────────────────────
     A hand is much longer than it is wide, so its principal axis IS the finger
     direction — and unlike the guide path it doesn't tilt when one finger
     reaches sideways, which used to swing the whole frame and collapse the
     bands. Ties are broken toward "up", the way every pose is drawn. */
  let dir;
  {
    const n = contour.length;
    const cx = mean(contour.map((p) => p[0]));
    const cy = mean(contour.map((p) => p[1]));
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const p of contour) {
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
    sxx /= n; syy /= n; sxy /= n;
    const t = 0.5 * Math.atan2(2 * sxy, sxx - syy);   // major-axis angle
    dir = [Math.cos(t), Math.sin(t)];
    if (dir[1] > 0) dir = [-dir[0], -dir[1]];         // point toward the fingertips
  }
  let perp = [-dir[1], dir[0]];
  // orient across the hand pinky → thumb: the left hand's thumb sits at +x
  if ((side === "left" && perp[0] < 0) || (side === "right" && perp[0] > 0)) perp = [-perp[0], -perp[1]];
  const proj = (p) => dot(p, perp);

  const across = contour.map(proj);
  const along = contour.map((p) => dot(p, dir));
  const reachTip = Math.max(...along);
  const reachBase = Math.min(...along);

  /* The hand's width is measured across the KNUCKLES, not the whole drawing.
     A finger stretching sideways (the pinky on `1`, the index on `j`) sets the
     outermost point of the contour, and measuring there stretched the axis so
     far that all four resting fingers fell inside the first band. The knuckle
     band is where the finger columns actually start and barely moves. */
  const reach = reachTip - reachBase;
  const knuckles = across.filter(
    (_, i) => along[i] >= reachBase + reach * 0.25 && along[i] <= reachBase + reach * 0.62,
  );
  const full = Math.max(...across) - Math.min(...across);
  const knuckleSpan = knuckles.length ? Math.max(...knuckles) - Math.min(...knuckles) : 0;
  /* …unless that slice caught only a sliver — on a pose drawn at a steep angle
     the along-axis is dominated by the wrist and the slice lands on the side of
     the palm, which would blow every fraction out past the hand. */
  const wide = knuckles.length > 8 && knuckleSpan > full * 0.55 ? knuckles : across;
  const lo = Math.min(...wide);
  const hi = Math.max(...wide);

  /* ── boundary evidence ────────────────────────────────────────────────── */
  const evidence = [];
  for (const c of pose.creases) {
    const pl = polyOf(c);
    if (polyLength(pl) < 18) continue;                    // a nick, not a finger split
    if (Math.abs(dot(runDir(pl), dir)) < 0.72) continue;  // runs across the palm, not along a finger
    evidence.push(mean(pl.map(proj)));
  }
  // slits: local minima of "how far along the fingers", over the finger half
  {
    const cut = reachBase + (reachTip - reachBase) * 0.45;
    const win = 5;
    for (let i = win; i < along.length - win; i++) {
      if (along[i] < cut) continue;
      let isMin = true;
      for (let k = 1; k <= win; k++) if (along[i - k] < along[i] || along[i + k] < along[i]) { isMin = false; break; }
      if (!isMin) continue;
      let l = along[i];
      let r = along[i];
      for (let k = i - 1; k >= 0; k--) { if (along[k] >= l) l = along[k]; else break; }
      for (let k = i + 1; k < along.length; k++) { if (along[k] >= r) r = along[k]; else break; }
      if (Math.min(l - along[i], r - along[i]) < 6) continue;
      evidence.push(proj(contour[i]));
    }
  }

  /* The guide traces one finger from its base up and over the tip and back
     down, so its two ENDPOINTS are the valleys either side of that finger —
     i.e. two boundaries, exactly. (Its widest spread is not: a finger reaching
     sideways sweeps most of the hand's width.) */
  const anchors = [];
  if (pose.guide) {
    const g = polyOf(pose.guide);
    const ends = [proj(g[0]), proj(g.at(-1))].sort((a, b) => a - b);
    /* …but only when the width that implies is a believable finger. A guide
       drawn open at the base, or one whose finger reaches across the hand,
       gives endpoints that are nearly on top of each other or half a hand
       apart; trusting those was what crushed the other four bands into a
       sliver. Rejecting them costs nothing — the pressing finger is drawn
       from this very path afterwards. */
    const share = (ends[1] - ends[0]) / (hi - lo || 1);
    if (share >= MIN_FINGER_SHARE && share <= MAX_FINGER_SHARE) anchors.push(...ends);
  }

  /* ── place four boundaries ──────────────────────────────────────────────
     A hand keeps its proportions from pose to pose, so the four boundaries
     start at DEFAULT_SPLIT and are then snapped onto any real evidence close
     by. Deriving them from evidence alone (and extrapolating the rest) blew up
     on poses where a finger reaches across its neighbours: one bad anchor threw
     the other three off the hand entirely. Anchors from the guide path are
     trusted furthest, then creases and slits. */
  const span0 = hi - lo || 1;
  const slots = DEFAULT_SPLIT.map((f) => lo + span0 * f);
  const gi = FINGERS.indexOf(guideFinger);

  /* The guide anchors slide the whole comb of boundaries rather than pinning
     one of them: pinning put e.g. the pinky|ring boundary at 0.65 on poses
     where the pinky reaches out, leaving the other four fingers a third of the
     hand to share. Shifting keeps the spacing that a hand actually has. */
  if (anchors.length === 2 && gi >= 0) {
    const want = [];
    if (gi - 1 >= 0) want.push(anchors[0] - slots[gi - 1]);
    if (gi < 4) want.push(anchors[1] - slots[gi]);
    const shift = mean(want);
    const room = span0 * 0.06;
    const limited = Math.max(
      Math.min(shift, hi - room - slots[3]),
      lo + room - slots[0],
    );
    for (let i = 0; i < 4; i++) slots[i] += limited;
  }

  const candidates = [];
  const free = [];
  for (const at of evidence.sort((a, b) => a - b)) {
    if (free.length && at - free.at(-1) < 6) continue;
    if (anchors.some((a) => Math.abs(a - at) < 6)) continue;
    free.push(at);
  }
  for (const at of free) {
    /* a loose boundary belongs to the default it is nearest to */
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < 4; i++) {
      if (candidates.some((c) => c.i === i)) continue;
      const d = Math.abs(at - slots[i]);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0 && bd <= span0 * SNAP) candidates.push({ i: best, at, weight: 1 });
  }
  /* one winner per boundary: the strongest, nearest candidate */
  for (let i = 0; i < 4; i++) {
    const mine = candidates.filter((c) => c.i === i);
    if (!mine.length) continue;
    mine.sort((a, b) => b.weight - a.weight || Math.abs(a.at - slots[i]) - Math.abs(b.at - slots[i]));
    const pick = mine[0];
    if (pick.weight > 1 || Math.abs(pick.at - slots[i]) <= span0 * SNAP) slots[i] = pick.at;
  }
  /* keep them ordered and inside the hand */
  for (let i = 0; i < 4; i++) slots[i] = Math.min(Math.max(slots[i], lo), hi);
  for (let i = 1; i < 4; i++) slots[i] = Math.max(slots[i], slots[i - 1] + span0 * 0.03);
  for (let i = 2; i >= 0; i--) slots[i] = Math.min(slots[i], slots[i + 1] - span0 * 0.03);

  const span = hi - lo || 1;
  let fractions = slots.map((v) => (v - lo) / span);
  if (override) fractions = override.slice(0, 4);

  /* How much hand each band actually holds, measured over the finger half of
     the contour. A band with almost nothing in it means the boundaries slid off
     the fingers — that is the signal the build reports for hand-correction. */
  const fingerCut = reachBase + (reachTip - reachBase) * 0.5;
  const edges = [lo, ...fractions.map((f) => lo + span * f), hi];
  const fill = new Array(5).fill(0);
  let counted = 0;
  for (let i = 0; i < contour.length; i++) {
    if (along[i] < fingerCut) continue;
    counted++;
    const at = across[i];
    for (let b = 0; b < 5; b++) if (at >= edges[b] && at <= edges[b + 1]) { fill[b]++; break; }
  }
  const share = fill.map((c) => (counted ? c / counted : 0));

  /* ── what the renderer needs ──────────────────────────────────────────── */
  const at = (f) => lo + span * f;
  const fadeFrom = reachBase + reach * 0.3;   // fully grey
  const fadeTo = reachBase + reach * 0.62;    // fully coloured
  return {
    side,
    guideFinger,
    fractions,
    /* gradient across the hand, in user space */
    axis: [perp[0] * lo, perp[1] * lo, perp[0] * hi, perp[1] * hi],
    stops: fractions,
    /* the fade that keeps the colour on the fingers and off the palm */
    fade: [dir[0] * fadeFrom, dir[1] * fadeFrom, dir[0] * fadeTo, dir[1] * fadeTo],
    boundaries: slots.map((_, i) => at(fractions[i])),
    /* diagnostics for the build's --check pass */
    share,
    evidence: free.length,
    evidenceAt: free.map((v) => (v - lo) / span0),
    anchored: anchors.length === 2 && gi >= 0,
  };
}
