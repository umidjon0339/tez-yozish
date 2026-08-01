// =========================================================================
// 👾 ALIEN DROP — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it.
//
// Painter order (back to front):
//   sky → stars → haze bands → planet → far spires → mid spires → plateau →
//   ground → crystals → front lip → hero → pods → bolts → particles →
//   popups → overlays (danger vignette, flashes, nova)
//
// Everything is procedural — no image assets — and scaled off `Layout.scale`,
// so the composition holds from a phone to a 4K screen. The infinite-looking
// rock skylines come from `hash(i)`: deterministic, so they never shimmer.
// NEVER call Math.random() in this file (see CLAUDE.md).
// =========================================================================

import {
    DANGER_FRAC, GROUND_FRAC, HERO_X_FRAC, MAX_SHIELD, NOVA_TIME, POD_R,
    paletteFor,
    type AlienDropState, type Palette, type Pod,
} from "./sim";

// ---------- tiny helpers ----------

/** Deterministic pseudo-random in [0,1) — a stable world with no state. */
function hash(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function rr(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
}

function ellipse(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, rx: number, ry: number, rot = 0,
) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
}

const INK = "#2b2436";

function ink(ctx: CanvasRenderingContext2D, w: number, alpha = 0.82) {
    ctx.strokeStyle = `rgba(43,36,54,${alpha})`;
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
}

function easeOut(p: number) {
    return 1 - (1 - p) * (1 - p);
}

function clamp01(v: number) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ---------- layout: the one coordinate mapping ----------

export interface Layout {
    W: number;
    H: number;
    groundY: number;
    heroX: number;
    /** y of the hero's feet — the same line pods land on. */
    heroY: number;
    /** y below which a pod is in the red. */
    dangerY: number;
    scale: number; // 1 at 800px tall — everything scales off this
    /**
     * The hero's own unit. He is the star of the scene, so he is drawn at
     * `HERO_SCALE` × the world scale. `drawHero` and `muzzleOf` MUST both use
     * this — they share the same skeleton, and a mismatch puts the bolts'
     * origin somewhere other than the end of the barrel.
     */
    heroU: number;
    /** Pod radius in pixels. */
    podR: number;
}

/** How much bigger the hero is drawn than the rest of the world. */
const HERO_SCALE = 1.55;

export function layoutFor(W: number, H: number): Layout {
    const scale = Math.max(0.62, Math.min(1.35, H / 800));
    const groundY = H * GROUND_FRAC;
    return {
        W, H,
        groundY,
        heroX: W * HERO_X_FRAC,
        heroY: groundY,
        dangerY: groundY * DANGER_FRAC,
        scale,
        heroU: scale * HERO_SCALE,
        podR: POD_R * scale,
    };
}

/**
 * Where the blaster's muzzle sits right now — bolts and sparks start here.
 *
 * This MUST stay in step with `drawHero`'s skeleton: same `heroU`, same body
 * offsets, same gun pivot, same mirroring. The one subtlety is the mirror: the
 * hero is flipped about his own centre when `face` is -1, and the gun is drawn
 * rotated by `aim * face` inside that flip, so the two negations cancel and the
 * muzzle's horizontal offset from the pivot is `sin(aim)` either way. Only the
 * PIVOT moves with `face`.
 */
export function muzzleOf(s: AlienDropState, L: Layout): { x: number; y: number } {
    const u = L.heroU;
    const h = s.hero;
    const bodyY = L.heroY - 76 * u - Math.sin(h.bob) * 2 * u;
    const len = (46 * 1.35 - h.recoil * 8) * u; // barrel length in `drawHero`'s gun units
    const pivotX = L.heroX + h.lean * 5 * u + h.face * 26 * u;
    return {
        x: pivotX + Math.sin(h.aim) * len,
        y: bodyY + 4 * u - Math.cos(h.aim) * len,
    };
}

// ==========================================
// BACKGROUND
// ==========================================

function drawSky(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout, pal: Palette) {
    const g = ctx.createLinearGradient(0, 0, 0, L.groundY);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(0.55, pal.skyMid);
    g.addColorStop(1, pal.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(-40, -40, L.W + 80, L.groundY + 80);

    // faint drifting star dust — always on, brighter at night
    const n = pal.night ? 120 : 55;
    for (let i = 0; i < n; i++) {
        const x = hash(i * 3.1) * L.W;
        const y = hash(i * 7.7) * L.groundY * 0.86;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(s.t * 1.3 + i * 0.7));
        ctx.globalAlpha = tw * (pal.night ? 0.9 : 0.4);
        ctx.fillStyle = "#ffffff";
        const r = (0.7 + hash(i * 5.3) * 1.6) * L.scale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // the reference game's soft banded haze: wide, nearly horizontal ribbons of
    // lighter air. Long wavelength and low amplitude on purpose — steep sine
    // waves here read as diagonal stripes, not as weather.
    ctx.fillStyle = pal.cloud;
    for (let b = 0; b < 4; b++) {
        const baseY = L.groundY * (0.08 + b * 0.19) + Math.sin(b * 2.3) * 10 * L.scale;
        const amp = (7 + b * 4) * L.scale;
        const thick = (58 + hash(b * 3.3) * 70) * L.scale;
        ctx.beginPath();
        ctx.moveTo(-40, baseY);
        for (let x = -40; x <= L.W + 40; x += 46) {
            ctx.lineTo(x, baseY + Math.sin(x * 0.0016 + s.t * 0.06 + b * 1.9) * amp);
        }
        ctx.lineTo(L.W + 40, baseY + thick);
        for (let x = L.W + 40; x >= -40; x -= 46) {
            ctx.lineTo(x, baseY + thick + Math.sin(x * 0.0013 + s.t * 0.05 + b) * amp * 0.8);
        }
        ctx.closePath();
        ctx.fill();
    }
}

/** The big pale planet hanging on the right, exactly like the reference shot. */
function drawPlanet(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout, pal: Palette) {
    const r = Math.min(L.W, L.H) * 0.235;
    const cx = L.W * 0.87;
    const cy = L.groundY * 0.36 + Math.sin(s.t * 0.13) * 4 * L.scale;

    ctx.save();
    // soft halo
    const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.35);
    halo.addColorStop(0, "rgba(255,255,255,0.16)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = pal.planet;
    ctx.fill();
    ctx.clip();

    // swirled bands
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = pal.planetDark;
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
        const y = cy - r + (i + 0.6) * (r * 2 / 7);
        ctx.beginPath();
        ctx.moveTo(cx - r, y);
        for (let x = cx - r; x <= cx + r; x += r * 0.14) {
            ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 1.7 + s.t * 0.05) * r * 0.045);
        }
        ctx.stroke();
    }
    // lit crescent on the side facing the sky's light
    ctx.globalAlpha = 0.5;
    const lit = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.4, cy + r);
    lit.addColorStop(0, pal.planetLight);
    lit.addColorStop(0.55, "rgba(255,255,255,0)");
    ctx.fillStyle = lit;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
}

/**
 * One rock formation: a stepped mesa base with a cluster of tall, slant-topped
 * obelisks standing on it — the reference game's skyline, not a comb of equal
 * triangles. Called twice (a hazy far range and a bold near one), so `seed`,
 * `hFrac` and the two colours are all that separate the layers.
 *
 * Heights peak in the middle of the range and fall away to the sides, which is
 * what makes it read as ONE formation instead of a row of separate hills.
 */
function drawRockRange(
    ctx: CanvasRenderingContext2D, L: Layout,
    seed: number, baseY: number, hFrac: number,
    fill: string, edge: string, count: number,
) {
    const peak = L.groundY * hFrac;
    // the range never runs edge to edge — it sits in the middle distance
    const left = -L.W * 0.06;
    const span = L.W * 1.12;
    const step = span / count;

    // ---- the stepped mesa the spires stand on ----
    const mesaTop = baseY - peak * 0.3;
    ctx.beginPath();
    ctx.moveTo(left + span * 0.06, baseY + 12);
    ctx.lineTo(left + span * 0.1, mesaTop + peak * 0.14);
    ctx.lineTo(left + span * 0.24, mesaTop + peak * 0.14);
    ctx.lineTo(left + span * 0.28, mesaTop);
    ctx.lineTo(left + span * 0.7, mesaTop);
    ctx.lineTo(left + span * 0.74, mesaTop + peak * 0.11);
    ctx.lineTo(left + span * 0.9, mesaTop + peak * 0.11);
    ctx.lineTo(left + span * 0.94, baseY + 12);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // ---- the obelisks ----
    // shape: a tall quad, wide at the base, narrow at the top, with a SLANTED
    // cut across the tip — that slant is what makes them read as broken stone
    // rather than as party hats.
    const spire = (cx: number, h: number, w: number, tilt: number, tall: boolean) => {
        const topY = baseY - h;
        const tw = w * (tall ? 0.16 : 0.3); // top width
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, baseY + 12);
        ctx.lineTo(cx - tw + tilt, topY + h * 0.06);
        ctx.lineTo(cx + tilt, topY); // the high corner
        ctx.lineTo(cx + tw + tilt, topY + h * 0.13); // the slanted cut
        ctx.lineTo(cx + w / 2, baseY + 12);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        // lit left facet
        ctx.save();
        ctx.clip();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = edge;
        ctx.beginPath();
        ctx.moveTo(cx - tw + tilt, topY + h * 0.06);
        ctx.lineTo(cx - w * 0.06 + tilt, topY + h * 0.09);
        ctx.lineTo(cx - w * 0.04, baseY + 12);
        ctx.lineTo(cx - w / 2, baseY + 12);
        ctx.closePath();
        ctx.fill();
        // a couple of horizontal strata, cartoon rock
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#000000";
        for (let k = 1; k <= 2; k++) {
            const y = topY + h * (0.34 + k * 0.22);
            ctx.fillRect(cx - w, y, w * 2, Math.max(1.5, h * 0.015));
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    };

    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        // a smooth arch across the range, roughened per index
        const arch = 0.42 + Math.sin(t * Math.PI) * 0.58;
        const rough = 0.62 + hash(i * 2.3 + seed) * 0.38;
        const tall = hash(i * 8.9 + seed) > 0.42;
        const h = peak * arch * rough * (tall ? 1 : 0.62);
        const cx = left + step * (i + 0.5) + (hash(i * 5.1 + seed) - 0.5) * step * 0.4;
        const w = step * (tall ? 0.52 + hash(i * 3.7 + seed) * 0.3 : 0.8 + hash(i * 1.9 + seed) * 0.5);
        const tilt = (hash(i * 6.7 + seed) - 0.5) * w * 0.5;
        spire(cx, h, w, tilt, tall);
    }
}

function drawGround(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout, pal: Palette) {
    const gy = L.groundY;

    /** One terrace: a wavy-topped slab from `top` down to the bottom of frame. */
    const terrace = (top: number, wave: number, phase: number, fill: string | CanvasGradient) => {
        ctx.beginPath();
        ctx.moveTo(-20, top);
        for (let x = -20; x <= L.W + 20; x += 54) {
            ctx.lineTo(x, top + Math.sin(x * 0.0055 + phase) * wave);
        }
        ctx.lineTo(L.W + 20, L.H + 20);
        ctx.lineTo(-20, L.H + 20);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
    };

    // the flat plateau the rock ranges stand on, and the desert floor behind
    terrace(gy - 74 * L.scale, 5 * L.scale, 0.9, pal.plateau);

    // three stepped terraces marching toward the camera, each darker than the
    // last — that stack is what gives the foreground its depth
    const mid = ctx.createLinearGradient(0, gy - 40 * L.scale, 0, gy + 40 * L.scale);
    mid.addColorStop(0, pal.groundTop);
    mid.addColorStop(1, pal.groundMid);
    terrace(gy - 34 * L.scale, 6 * L.scale, 2.4, mid);

    // the shaded lip of that step
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = pal.groundDark;
    terrace(gy + 4 * L.scale, 7 * L.scale, 4.1, pal.groundDark);
    ctx.globalAlpha = 1;

    const near = ctx.createLinearGradient(0, gy + 24 * L.scale, 0, L.H);
    near.addColorStop(0, pal.groundMid);
    near.addColorStop(1, pal.groundDark);
    terrace(gy + 30 * L.scale, 8 * L.scale, 5.6, near);

    // a canyon crack cutting across the middle terrace — free depth
    ctx.fillStyle = pal.groundDark;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    const crackY = gy - 12 * L.scale;
    ctx.moveTo(-20, crackY);
    for (let x = -20; x <= L.W + 20; x += 48) {
        ctx.lineTo(x, crackY + Math.sin(x * 0.009 + 1.4) * 7 * L.scale);
    }
    ctx.lineTo(L.W + 20, crackY + 15 * L.scale);
    for (let x = L.W + 20; x >= -20; x -= 48) {
        ctx.lineTo(x, crackY + 15 * L.scale + Math.sin(x * 0.008) * 6 * L.scale);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // scattered boulders and crystals along the ground line
    for (let i = 0; i < 16; i++) {
        const x = (hash(i * 9.7) * 1.04 - 0.02) * L.W;
        const isCrystal = hash(i * 4.4) > 0.55;
        const sc = (0.6 + hash(i * 2.9) * 0.8) * L.scale;
        const y = gy - 42 * L.scale + hash(i * 6.1) * 10 * L.scale;
        if (isCrystal) {
            const h = 34 * sc;
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + 11 * sc, y - h * 0.35);
            ctx.lineTo(x + 7 * sc, y);
            ctx.lineTo(x - 7 * sc, y);
            ctx.lineTo(x - 11 * sc, y - h * 0.35);
            ctx.closePath();
            ctx.fillStyle = pal.crystal;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, y - h);
            ctx.lineTo(x + 11 * sc, y - h * 0.35);
            ctx.lineTo(x + 2 * sc, y);
            ctx.closePath();
            ctx.fillStyle = pal.crystalLight;
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
            ink(ctx, 1.6 * L.scale, 0.35);
        } else {
            ellipse(ctx, x, y - 6 * sc, 16 * sc, 10 * sc);
            ctx.fillStyle = pal.groundDark;
            ctx.fill();
            ellipse(ctx, x - 3 * sc, y - 9 * sc, 9 * sc, 5 * sc);
            ctx.fillStyle = pal.groundTop;
            ctx.globalAlpha = 0.6;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // the lit strip along the very front — the reference game's pink lip
    const lipY = L.H - 34 * L.scale;
    ctx.beginPath();
    ctx.moveTo(-20, lipY + 22 * L.scale);
    for (let x = -20; x <= L.W + 20; x += 56) {
        ctx.lineTo(x, lipY + Math.sin(x * 0.007 + 2.2) * 6 * L.scale);
    }
    ctx.lineTo(L.W + 20, L.H + 10);
    ctx.lineTo(-20, L.H + 10);
    ctx.closePath();
    ctx.fillStyle = pal.lip;
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, lipY - 2 * L.scale, L.W, 3 * L.scale);
    ctx.globalAlpha = 1;
}

// ==========================================
// THE HERO — a kid in a space suit with a blaster. Everything is drawn around
// the feet at (L.heroX, L.heroY), so the ground line is the single anchor.
// ==========================================

export function drawHero(
    ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout, pal: Palette,
) {
    const u = L.heroU; // NOT L.scale — see `Layout.heroU`
    const h = s.hero;
    const hop = h.hop * 9 * u;
    const bob = Math.sin(h.bob) * 2 * u;
    const x = L.heroX + h.lean * 5 * u;
    const feetY = L.heroY - hop;
    // the skeleton: hips at `hipY`, shoulders at `bodyY`, helmet centred on `headY`
    const bodyY = feetY - 76 * u - bob;
    const hipY = bodyY + 34 * u;
    const headY = bodyY - 20 * u;

    const suit = "#eef4f9";
    const suitDark = "#b6c6d5";
    const accent = "#ff6b4a";
    const visor = pal.night ? "#3ad0ff" : "#2aa6e0";
    // The gun is held well out to the side, clear of the helmet's radius, so
    // the barrel can never cross the visor — the face has to stay readable at
    // every aim angle, and the muzzle has to be visible for the bolts to look
    // like they come from it.
    const gunX = x + 26 * u;
    const gunY = bodyY + 4 * u;

    ctx.save();

    // ---- shadow, squashed by the hop. Drawn OUTSIDE the mirror so it stays
    // centred on the hero's feet whichever way he is facing. ----
    ctx.globalAlpha = 0.24 * (1 - h.hop * 0.5);
    ctx.fillStyle = "#000000";
    ellipse(ctx, L.heroX, L.heroY + 3 * u, 32 * u * (1 - h.hop * 0.2), 8 * u);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ---- everything below is drawn in the hero's own mirrored frame, so he
    // physically turns to face the pod he is shooting. The gun is therefore
    // rotated by `aim * face` (see `muzzleOf`). ----
    ctx.translate(L.heroX, 0);
    ctx.scale(h.face, 1);
    ctx.translate(-L.heroX, 0);

    // ---- backpack (behind everything) ----
    ctx.fillStyle = suitDark;
    rr(ctx, x - 27 * u, bodyY - 6 * u, 15 * u, 32 * u, 6 * u);
    ctx.fill();
    ink(ctx, 2 * u, 0.5);
    // thruster glow, brighter as the nova meter fills
    ctx.globalAlpha = 0.3 + h.charge * 0.7;
    ctx.fillStyle = pal.beam;
    ellipse(ctx, x - 19.5 * u, bodyY + 28 * u, 6.5 * u, 4 * u);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ---- legs, planted wide, and boots ----
    ctx.strokeStyle = suitDark;
    ctx.lineWidth = 10 * u;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 6 * u, hipY);
    ctx.lineTo(x - 15 * u, feetY - 6 * u);
    ctx.moveTo(x + 6 * u, hipY);
    ctx.lineTo(x + 15 * u, feetY - 6 * u);
    ctx.stroke();
    ctx.fillStyle = accent;
    rr(ctx, x - 24 * u, feetY - 11 * u, 19 * u, 11 * u, 4.5 * u);
    ctx.fill();
    ink(ctx, 2 * u, 0.5);
    rr(ctx, x + 5 * u, feetY - 11 * u, 19 * u, 11 * u, 4.5 * u);
    ctx.fill();
    ink(ctx, 2 * u, 0.5);

    // ---- torso ----
    ctx.fillStyle = suit;
    rr(ctx, x - 19 * u, bodyY - 6 * u, 38 * u, 42 * u, 14 * u);
    ctx.fill();
    ink(ctx, 2.4 * u, 0.6);
    // chest panel — this IS the nova charge meter, right on the hero
    ctx.fillStyle = "#2b3a4a";
    rr(ctx, x - 11 * u, bodyY + 5 * u, 22 * u, 13 * u, 5 * u);
    ctx.fill();
    const cw = 18 * u * clamp01(h.charge);
    if (cw > 0.5) {
        ctx.fillStyle = h.charge >= 1
            ? (Math.sin(s.t * 12) > 0 ? "#ffffff" : pal.beam)
            : pal.beam;
        rr(ctx, x - 9 * u, bodyY + 7.5 * u, cw, 8 * u, 3.5 * u);
        ctx.fill();
    }
    // belt
    ctx.fillStyle = accent;
    rr(ctx, x - 19 * u, bodyY + 26 * u, 38 * u, 8 * u, 4 * u);
    ctx.fill();

    // ---- helmet: drawn before the arms and the gun, but after the torso, so
    // the face is never covered by anything the hero is holding ----
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.arc(x, headY, 21 * u, 0, Math.PI * 2);
    ctx.fill();
    ink(ctx, 2.4 * u, 0.6);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + 2 * u, headY + 1 * u, 15.5 * u, 12.5 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = visor;
    ctx.fill();
    ctx.clip();
    // the kid's face behind the glass
    ctx.fillStyle = "#f6cba4";
    ctx.beginPath();
    ctx.arc(x + 2 * u, headY + 4 * u, 11 * u, 0, Math.PI * 2);
    ctx.fill();
    const eyeH = h.blink > 0.5 ? 0.9 * u : 3.3 * u;
    ctx.fillStyle = INK;
    ellipse(ctx, x - 2.5 * u, headY + 1.5 * u, 2.3 * u, eyeH);
    ctx.fill();
    ellipse(ctx, x + 6.5 * u, headY + 1.5 * u, 2.3 * u, eyeH);
    ctx.fill();
    // mouth: a determined line, an "o" while firing, a grimace when hurt
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8 * u;
    ctx.beginPath();
    if (h.hurt > 0.3) {
        ctx.moveTo(x - 3 * u, headY + 9 * u);
        ctx.quadraticCurveTo(x + 2 * u, headY + 5.5 * u, x + 7 * u, headY + 9 * u);
    } else if (h.recoil > 0.3) {
        ctx.ellipse(x + 2 * u, headY + 8 * u, 2.6 * u, 3 * u, 0, 0, Math.PI * 2);
    } else {
        ctx.moveTo(x - 1.5 * u, headY + 8.5 * u);
        ctx.lineTo(x + 5.5 * u, headY + 8.5 * u);
    }
    ctx.stroke();
    // glass shine
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x - 6 * u, headY - 5.5 * u, 6.5 * u, 3.6 * u, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // helmet crest
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x - 4 * u, headY - 20 * u);
    ctx.lineTo(x + 4 * u, headY - 20 * u);
    ctx.lineTo(x + 1 * u, headY - 29 * u);
    ctx.closePath();
    ctx.fill();
    ink(ctx, 1.6 * u, 0.5);

    // ---- arms reaching out to the grip ----
    // Drawn after the helmet and before the gun, so the hands end up ON the
    // grip: helmet → arms → blaster is the only order where nothing important
    // is hidden.
    ctx.strokeStyle = "#f6cba4";
    ctx.lineWidth = 7.5 * u;
    ctx.lineCap = "round";
    const gripX = gunX + Math.sin(h.aim) * 8 * u;
    const gripY = gunY - Math.cos(h.aim) * 8 * u;
    ctx.beginPath();
    ctx.moveTo(x + 13 * u, bodyY + 2 * u);
    ctx.lineTo(gripX, gripY);
    ctx.moveTo(x - 8 * u, bodyY + 12 * u);
    ctx.lineTo(gripX - 5 * u, gripY + 13 * u);
    ctx.stroke();

    // ---- the blaster, held clear of the helmet and aimed along `h.aim` ----
    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(h.aim * h.face); // the mirror negates it back — see `muzzleOf`
    const g = 1.35 * u; // the gun's own unit — it is deliberately oversized
    const back = h.recoil * 8 * u;
    // stock / grip
    ctx.fillStyle = "#3d4a5c";
    rr(ctx, -8 * g, -20 * g + back, 16 * g, 26 * g, 6 * g);
    ctx.fill();
    ink(ctx, 2 * u, 0.55);
    // barrel
    ctx.fillStyle = "#63748c";
    rr(ctx, -6.5 * g, -46 * g + back, 13 * g, 30 * g, 5 * g);
    ctx.fill();
    ink(ctx, 2 * u, 0.55);
    // energy cell down the side, so the silhouette is not a plain tube
    ctx.fillStyle = accent;
    rr(ctx, -12 * g, -30 * g + back, 5.5 * g, 15 * g, 2.5 * g);
    ctx.fill();
    ink(ctx, 1.5 * u, 0.45);
    ctx.fillStyle = pal.beam;
    ctx.globalAlpha = 0.45 + h.charge * 0.55;
    rr(ctx, -4 * g, -40 * g + back, 8 * g, 12 * g, 3 * g);
    ctx.fill();
    ctx.globalAlpha = 1;
    // muzzle ring, flaring with the recoil
    ctx.fillStyle = pal.beam;
    ctx.globalAlpha = 0.6 + h.recoil * 0.4;
    ellipse(ctx, 0, -46 * g + back, 8.5 * g, 4.5 * g);
    ctx.fill();
    ctx.globalAlpha = 1;
    // muzzle flash
    if (h.recoil > 0.05) {
        ctx.globalAlpha = h.recoil;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(0, -46 * g + back - 58 * g * h.recoil);
        ctx.lineTo(12 * g, -44 * g + back);
        ctx.lineTo(-12 * g, -44 * g + back);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();

    // hurt overlay — a red wash over the whole hero
    if (h.hurt > 0.01) {
        ctx.globalAlpha = h.hurt * 0.4;
        ctx.fillStyle = "#ff4d4d";
        ellipse(ctx, x, bodyY + 6 * u, 40 * u, 60 * u);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

// ==========================================
// THE PODS — the reference game's dark drop-pod: a charcoal capsule with red
// bat wings, a braking flame on top, a status light and a big amber porthole
// with the character on it.
// ==========================================

/**
 * Draw one pod. Exported so the menu badge and the `/games` HUD chips can use
 * the exact same painter as the game.
 */
export function drawPod(
    ctx: CanvasRenderingContext2D, pod: Pod, x: number, y: number, r: number,
    t: number, danger: number, tagged: number,
) {
    const body = pod.kind === "gold" ? "#f2b134"
        : pod.kind === "medic" ? "#37b6a0"
            : "#4a4f5c";
    const bodyDark = pod.kind === "gold" ? "#c2861d"
        : pod.kind === "medic" ? "#23806f"
            : "#2e323c";
    const bodyLight = pod.kind === "gold" ? "#ffd977"
        : pod.kind === "medic" ? "#6de0c8"
            : "#6d7484";
    const wing = pod.kind === "gold" ? "#fff0c0"
        : pod.kind === "medic" ? "#d9fff5"
            : "#d63a3a";
    const glass = pod.kind === "gold" ? "#fff3c4"
        : pod.kind === "medic" ? "#c6ffe9"
            : "#ffb92e";

    ctx.save();
    ctx.translate(x, y);
    // a TAGGED pod (its character has been typed, the bolt is still in flight)
    // stops dead and swells slightly — the player gets their confirmation on the
    // keystroke, not on the impact.
    if (tagged > 0) ctx.scale(1 + tagged * 0.12, 1 + tagged * 0.12);
    ctx.scale(pod.born, pod.born);

    const flap = Math.sin(pod.flap) * 0.28;

    // ---- braking flame above the pod (it is decelerating into the atmosphere) ----
    const fl = 0.75 + Math.abs(Math.sin(t * 18 + pod.id)) * 0.45;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.5, -r * 0.98);
    ctx.quadraticCurveTo(0, -r * (1 + 0.5 * fl), 4.5, -r * 0.98);
    ctx.closePath();
    ctx.fillStyle = "#ff9d3c";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2.4, -r * 0.98);
    ctx.quadraticCurveTo(0, -r * (1 + 0.32 * fl), 2.4, -r * 0.98);
    ctx.closePath();
    ctx.fillStyle = "#fff0b0";
    ctx.fill();
    ctx.globalAlpha = 1;

    // ---- wings ----
    for (const dir of [-1, 1] as const) {
        ctx.save();
        ctx.translate(dir * r * 0.5, -r * 0.34);
        ctx.rotate(dir * flap);
        ctx.beginPath();
        ctx.moveTo(0, r * 0.18);
        ctx.lineTo(dir * r * 0.86, -r * 0.5);
        ctx.lineTo(dir * r * 0.5, -r * 0.05);
        ctx.lineTo(dir * r * 0.78, r * 0.16);
        ctx.lineTo(0, r * 0.4);
        ctx.closePath();
        ctx.fillStyle = wing;
        ctx.fill();
        ink(ctx, Math.max(1.4, r * 0.075), 0.75);
        ctx.restore();
    }

    // ---- hull: a teardrop capsule, wide at the bottom ----
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.62, -r * 0.92, r * 0.92, -r * 0.2, r * 0.9, r * 0.16);
    ctx.bezierCurveTo(r * 0.9, r * 0.82, r * 0.5, r * 1.05, 0, r * 1.05);
    ctx.bezierCurveTo(-r * 0.5, r * 1.05, -r * 0.9, r * 0.82, -r * 0.9, r * 0.16);
    ctx.bezierCurveTo(-r * 0.92, -r * 0.2, -r * 0.62, -r * 0.92, 0, -r);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    // top-left sheen
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = bodyLight;
    ellipse(ctx, -r * 0.34, -r * 0.42, r * 0.42, r * 0.3, -0.5);
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = bodyDark;
    ctx.fillRect(r * 0.3, -r, r, r * 2.2);
    ctx.globalAlpha = 1;
    ctx.restore();
    ink(ctx, Math.max(1.7, r * 0.085), 0.85);

    // ---- neck band + status light ----
    ctx.fillStyle = bodyDark;
    rr(ctx, -r * 0.42, -r * 0.86, r * 0.84, r * 0.3, r * 0.14);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r * 0.71, r * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = danger > 0.5
        ? (Math.sin(t * 16) > 0 ? "#ff4d4d" : "#7a1f1f")
        : "#8ef06a";
    ctx.fill();

    // ---- porthole ----
    const pr = r * 0.55;
    ctx.beginPath();
    ctx.arc(0, r * 0.2, pr, 0, Math.PI * 2);
    ctx.fillStyle = "#20232b";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r * 0.2, pr * 0.86, 0, Math.PI * 2);
    ctx.fillStyle = glass;
    ctx.fill();
    // inner shadow so the glass reads as recessed
    const gg = ctx.createRadialGradient(
        -pr * 0.3, r * 0.2 - pr * 0.3, pr * 0.1, 0, r * 0.2, pr * 0.9,
    );
    gg.addColorStop(0, "rgba(255,255,255,0.75)");
    gg.addColorStop(0.55, "rgba(255,255,255,0)");
    gg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(0, r * 0.2, pr * 0.86, 0, Math.PI * 2);
    ctx.fill();

    // ---- the character ----
    ctx.fillStyle = "#241f18";
    ctx.font = `900 ${pr * 1.28}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pod.ch.toUpperCase(), 0, r * 0.24);

    // medic pods wear a cross so they read at a glance
    if (pod.kind === "medic") {
        ctx.fillStyle = "#ffffff";
        rr(ctx, -r * 0.09, -r * 0.5, r * 0.18, r * 0.44, r * 0.05);
        ctx.fill();
        rr(ctx, -r * 0.22, -r * 0.37, r * 0.44, r * 0.18, r * 0.05);
        ctx.fill();
    }

    // A tagged pod flashes so a fast typist sees they connected before the bolt
    // has even left the barrel — but only as a rim and a thin wash: a solid
    // white fill hid the character, which is the one thing that must stay
    // readable while the pod is still on screen.
    if (tagged > 0) {
        const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 26));
        ctx.globalAlpha = pulse * 0.3;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = r * 0.16;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // ---- danger ring: the pod is nearly down ----
    if (danger > 0.02 && tagged <= 0) {
        ctx.globalAlpha = danger * (0.5 + 0.5 * Math.abs(Math.sin(t * 9)));
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
        ctx.strokeStyle = "#ff3d3d";
        ctx.lineWidth = Math.max(2, r * 0.11);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

function drawPods(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout) {
    for (const pod of s.pods) {
        const x = pod.x + Math.sin(pod.sway) * pod.swayAmp * 9;
        const danger = pod.state === "fall"
            ? clamp01((pod.y - L.dangerY) / Math.max(1, L.groundY - L.dangerY))
            : 0;
        // a thin descent trail so the eye can track a fast pod
        if (pod.state === "fall" && pod.born > 0.6) {
            ctx.globalAlpha = 0.16;
            ctx.fillStyle = pod.kind === "gold" ? "#ffd977" : "#ffffff";
            ellipse(ctx, x, pod.y - L.podR * 1.5, L.podR * 0.28, L.podR * 1.1);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        drawPod(ctx, pod, x, pod.y, L.podR, s.t, danger, pod.state === "hit" ? 1 : 0);
    }
}

// ==========================================
// BOLTS, PARTICLES, POPUPS
// ==========================================

function drawBolts(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout) {
    for (const b of s.bolts) {
        const m = Math.hypot(b.vx, b.vy) || 1;
        const ux = b.vx / m, uy = b.vy / m;
        // a long tracer: the bolt only lives ~0.2 s, so it has to be visible in
        // the two or three frames it is actually on screen
        const len = Math.min(58 * L.scale, b.remain + 20 * L.scale);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        // outer glow
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 13 * L.scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(b.x - ux * len, b.y - uy * len);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        // hot core
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4.4 * L.scale;
        ctx.beginPath();
        ctx.moveTo(b.x - ux * len * 0.75, b.y - uy * len * 0.75);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
    }
}

function drawParticles(ctx: CanvasRenderingContext2D, s: AlienDropState) {
    for (const p of s.particles) {
        const k = 1 - p.life / p.ttl;
        ctx.save();
        if (p.kind === "ring") {
            const grow = easeOut(p.life / p.ttl);
            ctx.globalAlpha = k * 0.85;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1, 5 * k);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + grow * p.size * 4.5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.kind === "smoke") {
            ctx.globalAlpha = k * 0.4;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, Math.PI * 2);
            ctx.fill();
        } else if (p.kind === "star") {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const rad = i % 2 === 0 ? p.size : p.size * 0.42;
                const a = (i / 8) * Math.PI * 2;
                ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath();
            ctx.fill();
        } else if (p.kind === "shard") {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        } else {
            // spark / ember
            ctx.globalAlpha = k;
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function drawPopups(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of s.popups) {
        const k = p.life / p.ttl;
        const size = (p.big ? 30 : 20) * L.scale * (1 + (1 - Math.min(1, k * 5)) * 0.4);
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.font = `900 ${size}px ui-sans-serif, system-ui, sans-serif`;
        ctx.lineWidth = 4 * L.scale;
        ctx.strokeStyle = "rgba(43,36,54,0.85)";
        ctx.lineJoin = "round";
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
}

// ==========================================
// OVERLAYS
// ==========================================

function drawOverlays(ctx: CanvasRenderingContext2D, s: AlienDropState, L: Layout, pal: Palette) {
    // the nova shockwave: a white ring sweeping the whole sky
    if (s.novaT > 0) {
        const p = 1 - s.novaT / NOVA_TIME;
        const r = easeOut(p) * Math.hypot(L.W, L.H) * 1.1;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.strokeStyle = pal.beam;
        ctx.lineWidth = 26 * L.scale * (1 - p * 0.7);
        ctx.beginPath();
        ctx.arc(L.heroX, L.heroY - 60 * L.scale, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = (1 - p) * 0.35;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 9 * L.scale;
        ctx.stroke();
        ctx.restore();
    }

    // danger vignette — closes in as the shield falls
    const hurt = 1 - s.shield / MAX_SHIELD;
    const vig = Math.max(hurt * 0.85, s.hurtFlash * 0.6);
    if (vig > 0.02) {
        const g = ctx.createRadialGradient(
            L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.32,
            L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.72,
        );
        g.addColorStop(0, "rgba(220,30,40,0)");
        g.addColorStop(1, `rgba(190,25,35,${0.55 * vig})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L.W, L.H);
    }

    // hit / heal / gold washes
    if (s.flash > 0.01) {
        ctx.globalAlpha = s.flash * 0.13;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }
    if (s.goldFlash > 0.01) {
        ctx.globalAlpha = s.goldFlash * 0.2;
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }
    if (s.healFlash > 0.01) {
        ctx.globalAlpha = s.healFlash * 0.18;
        ctx.fillStyle = "#5ce8b0";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }
    if (s.errFlash > 0.01) {
        ctx.globalAlpha = s.errFlash * 0.12;
        ctx.fillStyle = "#ff5b5b";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }
}

// ==========================================
// THE ONE ENTRY POINT
// ==========================================

export function draw(
    ctx: CanvasRenderingContext2D, s: AlienDropState, W: number, H: number,
) {
    const L = layoutFor(W, H);
    const pal = paletteFor(s.wave);

    ctx.clearRect(0, 0, W, H);

    // screen shake — a pod cracking open on the colony is a real impact, so this
    // game (unlike beam-break) does have a trauma channel. Deterministic sine
    // pair, never Math.random(), so it reads as a thud instead of noise.
    const tr = s.trauma * s.trauma;
    ctx.save();
    if (tr > 0.001) {
        ctx.translate(
            Math.sin(s.t * 61) * 13 * tr * L.scale,
            Math.sin(s.t * 47 + 1.3) * 9 * tr * L.scale,
        );
    }

    drawSky(ctx, s, L, pal);
    drawPlanet(ctx, s, L, pal);
    // far ridge, then the near one — two calls, two seeds
    // far range first, then a haze wash, then the bold near range in front of it
    drawRockRange(ctx, L, 11.3, L.groundY - 58 * L.scale, 0.46, pal.spireDark, pal.spireMid, 9);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = pal.haze;
    ctx.fillRect(0, L.groundY - 210 * L.scale, L.W, 190 * L.scale);
    ctx.globalAlpha = 1;
    drawRockRange(ctx, L, 4.7, L.groundY - 34 * L.scale, 0.66, pal.spireMid, pal.spireLight, 6);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = pal.haze;
    ctx.fillRect(0, L.groundY - 96 * L.scale, L.W, 80 * L.scale);
    ctx.globalAlpha = 1;
    drawGround(ctx, s, L, pal);

    drawHero(ctx, s, L, pal);
    drawPods(ctx, s, L);
    drawBolts(ctx, s, L);
    drawParticles(ctx, s);
    drawPopups(ctx, s, L);

    ctx.restore();
    drawOverlays(ctx, s, L, pal);
}
