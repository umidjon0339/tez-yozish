/*
 * Shared geometry for the hand-slimming scripts.
 *
 * Both consumers — the standalone SVG (slim-hands-svg.mjs) and the React
 * component variant (slim-hands-tsx.mjs) — work on the same artwork, so the
 * path maths lives here once.
 *
 * The idea: erode each silhouette along its own normals, hard at the fingers
 * and tapering to nothing at the wrist, so fingers lose real width while the
 * palm keeps its mass. Everything else in the same pose (the outline that
 * traces the contour, tendon lines, guide highlights, shading) follows a
 * displacement field derived from that erosion, so the layers stay registered.
 */

/* ── how much to take off ────────────────────────────────────────────────── */
export const DEFAULT_SHAPE = {
  /** inset at the fingertip end of a pose, in user units (a keycap is ~51) */
  atFingers: 2.5,
  /** inset down at the wrist — the palm should stay broad */
  atWrist: 0.7,
  /** below this y the drawing is cut off by the viewBox; don't inset the cut */
  cutFadeFrom: 360,
  cutFadeTo: 379,
  /** arc length the contour tangent is measured over — anchors here are spaced
   *  very unevenly, so a short window picks up noise and kinks the offset */
  window: 7,
  /** displacement field: full strength within r0, gone by r1 */
  r0: 4,
  r1: 42,
};

const TOKENS = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;

/** `d` → subpaths of absolute cubic/line segments. */
export function parsePath(d) {
  const toks = [];
  let m;
  while ((m = TOKENS.exec(d))) toks.push(m[1] ?? parseFloat(m[2]));

  const subs = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let prevC2 = null; // for S/s reflection
  let cmd = null;
  let i = 0;
  const num = () => toks[i++];

  while (i < toks.length) {
    if (typeof toks[i] === "string") cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ax = rel ? x : 0;
    const ay = rel ? y : 0;

    if (C === "M") {
      x = ax + num();
      y = ay + num();
      sx = x;
      sy = y;
      cur = { start: [x, y], segs: [], closed: false };
      subs.push(cur);
      cmd = rel ? "l" : "L";
      prevC2 = null;
    } else if (C === "L") {
      x = ax + num();
      y = ay + num();
      cur.segs.push({ t: "L", p: [x, y] });
      prevC2 = null;
    } else if (C === "H") {
      x = ax + num();
      cur.segs.push({ t: "L", p: [x, y] });
      prevC2 = null;
    } else if (C === "V") {
      y = ay + num();
      cur.segs.push({ t: "L", p: [x, y] });
      prevC2 = null;
    } else if (C === "C" || C === "S") {
      let c1;
      if (C === "C") {
        c1 = [ax + num(), ay + num()];
      } else {
        // S reflects the previous curve's second control point
        c1 = prevC2 ? [2 * x - prevC2[0], 2 * y - prevC2[1]] : [x, y];
      }
      const c2 = [ax + num(), ay + num()];
      const p = [ax + num(), ay + num()];
      cur.segs.push({ t: "C", c1, c2, p });
      prevC2 = c2;
      x = p[0];
      y = p[1];
    } else if (C === "Z") {
      cur.closed = true;
      x = sx;
      y = sy;
      prevC2 = null;
    } else {
      throw new Error(`unsupported path command "${cmd}"`);
    }
  }
  return subs;
}

const r2 = (v) => {
  const n = Math.round(v * 100) / 100;
  return Object.is(n, -0) ? 0 : n;
};

export function serialize(subs) {
  let out = "";
  for (const sub of subs) {
    out += `M${r2(sub.start[0])},${r2(sub.start[1])}`;
    let last = null;
    for (const s of sub.segs) {
      if (s.t !== last) out += s.t;
      else out += " ";
      last = s.t;
      out +=
        s.t === "L"
          ? `${r2(s.p[0])},${r2(s.p[1])}`
          : `${r2(s.c1[0])},${r2(s.c1[1])} ${r2(s.c2[0])},${r2(s.c2[1])} ${r2(s.p[0])},${r2(s.p[1])}`;
    }
    if (sub.closed) out += "Z";
  }
  return out;
}

/** Every on-curve anchor, plus the control points that belong to it. */
export function anchors(subs) {
  const list = [];
  for (const sub of subs) {
    let prev = { pt: sub.start, owns: [sub.start] };
    list.push(prev);
    for (const s of sub.segs) {
      if (s.t === "C") prev.owns.push(s.c1);
      const node = { pt: s.p, owns: s.t === "C" ? [s.p, s.c2] : [s.p] };
      list.push(node);
      prev = node;
    }
  }
  return list;
}

/** Anchors of one subpath, keeping each segment's control points addressable so
 *  they can be displaced by an interpolated amount rather than their endpoint's. */
function ring(sub) {
  const pts = [sub.start, ...sub.segs.map((s) => s.p)];
  return { pts, segs: sub.segs, closed: sub.closed };
}

const cubicAt = (a, s, t) => {
  const m = 1 - t;
  const w = [m * m * m, 3 * m * m * t, 3 * m * t * t, t * t * t];
  const pts = s.t === "C" ? [a, s.c1, s.c2, s.p] : [a, a, s.p, s.p];
  return [
    w[0] * pts[0][0] + w[1] * pts[1][0] + w[2] * pts[2][0] + w[3] * pts[3][0],
    w[0] * pts[0][1] + w[1] * pts[1][1] + w[2] * pts[2][1] + w[3] * pts[3][1],
  ];
};

export function flatten(subs, per = 8) {
  const polys = [];
  for (const sub of subs) {
    const pts = [sub.start];
    let a = sub.start;
    for (const s of sub.segs) {
      for (let k = 1; k <= per; k++) pts.push(cubicAt(a, s, k / per));
      a = s.p;
    }
    polys.push(pts);
  }
  return polys;
}

const signedArea = (pts) => {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};

/* ── the erosion itself ──────────────────────────────────────────────────── */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

/** Inset depth for a point: deep at the fingers, shallow at the wrist, and
 *  zero where the drawing runs off the bottom of the viewBox. */
function insetAt(y, yTop, yBottom, SHAPE) {
  const t = smoothstep(clamp01((y - yTop) / Math.max(1, yBottom - yTop)));
  let d = SHAPE.atFingers + (SHAPE.atWrist - SHAPE.atFingers) * t;
  const cut = clamp01((y - SHAPE.cutFadeFrom) / (SHAPE.cutFadeTo - SHAPE.cutFadeFrom));
  return d * (1 - cut);
}

/**
 * Unit normal per anchor, measured over an arc-length window instead of the
 * two adjacent anchors. Anchors in this artwork are spaced very unevenly, and
 * a tangent taken from immediate neighbours picks up that noise and kinks the
 * offset curve — especially around fingertips.
 */
function normals(pts, closed, SHAPE) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  for (let i = 0; i < n; i++) {
    let a = pts[i];
    let b = pts[i];
    let back = 0;
    let fwd = 0;
    for (let k = 1; k <= n && back < SHAPE.window; k++) {
      const p = at(i - k);
      back += Math.hypot(p[0] - a[0], p[1] - a[1]);
      a = p;
    }
    for (let k = 1; k <= n && fwd < SHAPE.window; k++) {
      const p = at(i + k);
      fwd += Math.hypot(p[0] - b[0], p[1] - b[1]);
      b = p;
    }
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const L = Math.hypot(tx, ty) || 1;
    out.push([-ty / L, tx / L]);
  }
  return out;
}

/** One box-filter pass over the displacement ring — kills the last kinks. */
function smoothVectors(vs, closed, passes = 2) {
  const n = vs.length;
  let cur = vs;
  for (let p = 0; p < passes; p++) {
    const next = [];
    for (let i = 0; i < n; i++) {
      const a = closed ? cur[(i - 1 + n) % n] : cur[Math.max(0, i - 1)];
      const b = closed ? cur[(i + 1) % n] : cur[Math.min(n - 1, i + 1)];
      next.push([(a[0] + 2 * cur[i][0] + b[0]) / 4, (a[1] + 2 * cur[i][1] + b[1]) / 4]);
    }
    cur = next;
  }
  return cur;
}

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/**
 * Offsets a contour inward along its own normals and returns dense displacement
 * samples for the other paths to follow. The normal's sign is chosen by testing
 * which way shrinks the outline — no assumptions about winding order.
 */
export function erode(subs, yTop, yBottom, SHAPE = DEFAULT_SHAPE) {
  const samples = [];

  for (const sub of subs) {
    const r = ring(sub);
    const pts = r.pts.map((p) => [...p]);
    const closed = sub.closed;
    const ns = normals(pts, closed, SHAPE);

    // Which way is "in"? Whichever shrinks this subpath's own area.
    let sign = 1;
    const poly = flatten([sub])[0];
    const before = Math.abs(signedArea(poly));
    if (before > 1) {
      const test = pts.map((p, i) => [p[0] + ns[i][0], p[1] + ns[i][1]]);
      if (Math.abs(signedArea(test)) > before) sign = -1;
    }

    let vs = pts.map((p, i) => {
      const d = insetAt(p[1], yTop, yBottom, SHAPE) * sign;
      return [ns[i][0] * d, ns[i][1] * d];
    });
    vs = smoothVectors(vs, closed);

    // Anchors move by their own vector; control points by an interpolated one,
    // so a segment whose ends turn sharply bends instead of shearing.
    for (let i = 0; i < sub.segs.length; i++) {
      const s = sub.segs[i];
      if (s.t === "C") {
        const c1v = lerp2(vs[i], vs[i + 1], 1 / 3);
        const c2v = lerp2(vs[i], vs[i + 1], 2 / 3);
        s.c1[0] += c1v[0];
        s.c1[1] += c1v[1];
        s.c2[0] += c2v[0];
        s.c2[1] += c2v[1];
      }
      // dense samples along the original segment, for the displacement field
      const a = pts[i];
      for (let k = 0; k < 6; k++) {
        const t = k / 6;
        samples.push({ p: cubicAt(a, s, t), v: lerp2(vs[i], vs[i + 1], t) });
      }
    }
    sub.start[0] += vs[0][0];
    sub.start[1] += vs[0][1];
    for (let i = 0; i < sub.segs.length; i++) {
      sub.segs[i].p[0] += vs[i + 1][0];
      sub.segs[i].p[1] += vs[i + 1][1];
    }
    samples.push({ p: [...pts[pts.length - 1]], v: vs[vs.length - 1] });
  }
  return samples;
}

/** Move a point the way the nearest bit of contour moved, fading with distance. */
export function applyField(pt, samples, SHAPE = DEFAULT_SHAPE) {
  let best = Infinity;
  let bv = null;
  for (const s of samples) {
    const dx = pt[0] - s.p[0];
    const dy = pt[1] - s.p[1];
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      bv = s.v;
    }
  }
  if (!bv) return;
  const dist = Math.sqrt(best);
  const w = 1 - clamp01((dist - SHAPE.r0) / (SHAPE.r1 - SHAPE.r0));
  if (w <= 0) return;
  pt[0] += bv[0] * w;
  pt[1] += bv[1] * w;
}

/* ── driver ──────────────────────────────────────────────────────────────── */

/**
 * Slims one pose. `silhouettes` and `others` are arrays of `d` strings; returns
 * the rewritten `d` strings in the same order.
 */
export function slimPose(silhouettes, others, SHAPE = DEFAULT_SHAPE) {
  const samples = [];
  const parsed = silhouettes.map((d) => {
    const subs = parsePath(d);
    const ys = flatten(subs).flat().map((p) => p[1]);
    samples.push(...erode(subs, Math.min(...ys), Math.max(...ys), SHAPE));
    return subs;
  });
  return {
    silhouettes: parsed.map(serialize),
    others: others.map((d) => {
      const subs = parsePath(d);
      for (const node of anchors(subs)) for (const pt of node.owns) applyField(pt, samples, SHAPE);
      return serialize(subs);
    }),
  };
}

/**
 * Splits a document into poses. A silhouette opens a pose and collects every
 * following path until the next silhouette; two silhouettes back to back are
 * the two hands of one pose and share a displacement field.
 */
export function groupPoses(tags, isSilhouette) {
  const units = [];
  let unit = null;
  for (const it of tags) {
    if (isSilhouette(it.tag)) {
      const backToBack =
        unit && unit.depth === it.depth && unit.members.at(-1) === unit.silhouettes.at(-1);
      if (backToBack) {
        unit.silhouettes.push(it);
        unit.members.push(it);
      } else {
        unit = { depth: it.depth, silhouettes: [it], members: [it] };
        units.push(unit);
      }
    } else if (unit) {
      unit.members.push(it);
    }
  }
  return units;
}
