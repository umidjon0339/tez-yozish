/**
 * The shape of the generated finger-band tables, plus the one function that
 * paints a pose with them.
 *
 * The "finger colours" toggle draws every finger of the shown hand in the
 * colour of the keys that finger types, instead of colouring only the finger
 * pressing the current key. The hand artwork has no per-finger geometry (a pose
 * is one silhouette plus a contour and a few crease lines), so the colours come
 * from a gradient across the hand whose stops sit on the boundaries between the
 * finger columns — derived per pose by `npm run build:finger-bands`. See
 * `docs/keyboard.md` §3c.
 */
import type { Finger } from "./keymap";

export type Hand = "left" | "right";

export interface FingerBand {
  hand: Hand;
  /** gradient axis across the hand, pinky → thumb: [x1, y1, x2, y2] */
  axis: [number, number, number, number];
  /** the four finger boundaries, as fractions along that axis */
  stops: number[];
  /** axis along the fingers that fades the colour off the palm: [x1, y1, x2, y2] */
  fade: [number, number, number, number];
  /** the pose outline (contour + crease lines) to redraw in colour */
  d: string;
  /** set on poses that are a shifted <use> of a shared pose */
  transform?: string;
  /** the pressing finger, traced exactly — drawn last, over the bands */
  guide?: string;
  /** its finger zone, e.g. `l-index` */
  guideZone?: Finger;
}

export type FingerBandTable = Record<string, FingerBand>;

/** the finger zones across one hand, pinky → thumb */
export function handZones(hand: Hand): Finger[] {
  const p = hand === "left" ? "l-" : "r-";
  return [`${p}pinky`, `${p}ring`, `${p}middle`, `${p}index`, "thumb"] as Finger[];
}

interface BandNodes {
  path: SVGPathElement;
  grad: SVGLinearGradientElement;
  stops: SVGStopElement[];
  fade: SVGLinearGradientElement;
  /** redraws the pressing finger on top of the bands */
  guide: SVGPathElement;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Point one gradient/mask pair at a pose and draw its outline. Called per
 * keystroke, so it mutates the existing nodes instead of re-rendering them —
 * the same reason pose toggling is imperative.
 */
export function paintBand(band: FingerBand, n: BandNodes) {
  n.path.setAttribute("d", band.d);
  /* The pressing finger goes on top in its own colour. A finger reaching over
     its neighbours (the index on y/u/j) lands outside its band, and that is
     exactly the finger the learner is being told to move — so it is never left
     to the gradient. */
  if (band.guide && band.guideZone) {
    n.guide.setAttribute("d", band.guide);
    n.guide.style.stroke = `var(--fz-${band.guideZone})`;
  } else {
    n.guide.removeAttribute("d");
  }
  for (const el of [n.path, n.guide]) {
    if (band.transform) el.setAttribute("transform", band.transform);
    else el.removeAttribute("transform");
  }

  const set = (el: SVGLinearGradientElement, v: readonly number[]) => {
    el.setAttribute("x1", String(v[0]));
    el.setAttribute("y1", String(v[1]));
    el.setAttribute("x2", String(v[2]));
    el.setAttribute("y2", String(v[3]));
  };
  set(n.grad, band.axis);
  set(n.fade, band.fade);

  /* Ten stops — each finger's colour is held from the previous boundary to its
     own, so the hue changes at the boundary instead of blending through the
     neighbouring finger. Colours are left as var() so the palette switcher and
     dark mode keep working. */
  const zones = handZones(band.hand);
  const offsets = [0, ...band.stops, 1];
  for (let i = 0; i < 5; i++) {
    const colour = `var(--fz-${zones[i]})`;
    const a = n.stops[i * 2];
    const b = n.stops[i * 2 + 1];
    a.setAttribute("offset", String(clamp(offsets[i])));
    b.setAttribute("offset", String(clamp(offsets[i + 1])));
    a.style.stopColor = colour;
    b.style.stopColor = colour;
  }
}

/** hide the coloured outlines (no pose shown, or the toggle is off) */
export function clearBand(...paths: (SVGPathElement | null)[]) {
  for (const p of paths) p?.removeAttribute("d");
}
