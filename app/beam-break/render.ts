// =========================================================================
// 🛸 BEAM BREAK — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it.
//
// Painter order (back to front):
//   sky → stars/aurora → sun → far dunes → clouds → near dunes → haze →
//   ground → plants → level signs → ground drifts → sky drifts →
//   beam cone → UFO → alien → snare ring → animal → beam front glow →
//   particles → letter tiles → overlays (flashes, danger vignette)
//
// Everything is procedural (no image assets) and scaled off `Layout.scale`, so
// the composition holds from a phone to a 4K screen. Infinite layers are
// generated from `hash(i)` over the visible index range — deterministic, so
// they never shimmer as the world scrolls past.
//
// NO SCREEN SHAKE: this renderer never offsets the whole scene. Impact reads
// as an eased glow/scale/colour change only.
// =========================================================================

import {
    ANIMAL_X_FRAC, GRAB_VEL_FULL, GROUND_FRAC, UFO_Y_FRAC, paletteFor, speciesOf,
    type BeamBreakState, type Palette,
} from "./sim";
import { drawAnimal, footOffset } from "./animals";

// ---------- tiny helpers ----------

/** Deterministic pseudo-random in [0,1) — lets us draw an infinite, stable world. */
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

function ink(ctx: CanvasRenderingContext2D, w: number) {
    ctx.strokeStyle = "rgba(43,36,54,0.8)";
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
}

function easeOut(p: number) {
    return 1 - (1 - p) * (1 - p);
}

// ---------- layout: the one coordinate mapping ----------

export interface Layout {
    W: number;
    H: number;
    groundY: number;
    ufoY: number;
    animalX: number;
    scale: number; // 1 at 800px tall — everything scales off this
    /** The animal's unit size (see `drawAnimal`). */
    u: number;
}

export function layoutFor(W: number, H: number): Layout {
    const scale = Math.max(0.6, Math.min(1.3, H / 800));
    return {
        W, H,
        groundY: H * GROUND_FRAC,
        // on short viewports the saucer drops away from the top edge so it never
        // hides behind the HUD row
        ufoY: H * (H < 700 ? 0.23 : UFO_Y_FRAC),
        animalX: W * ANIMAL_X_FRAC,
        scale,
        u: 22 * scale,
    };
}

/**
 * Grip → screen y of the animal's CENTRE. 0 stands its feet exactly on the
 * ground line, 1 puts it inside the saucer's mouth.
 *
 * Reads `grabView`, NOT `grab`: the logical grip steps down on every keystroke,
 * and drawing that directly made the animal jump per key. Everything visual in
 * this file reads `grabView` for the same reason.
 *
 * The stand height comes from `footOffset(species)`, so a long-legged fox and a
 * squat turtle both touch the sand instead of floating or sinking.
 */
export function grabToY(s: BeamBreakState, L: Layout): number {
    const standY = L.groundY - footOffset(speciesOf(s)) * L.u;
    const mouthY = L.ufoY + 6 * L.scale;
    return standY + (mouthY - standY) * Math.max(0, Math.min(1, s.grabView));
}

/** Scroll-space x → screen x. */
export function screenX(wx: number, s: BeamBreakState): number {
    return wx - s.scrollPx;
}

/** The saucer drifts gently side to side; the beam follows it. */
export function ufoX(s: BeamBreakState, L: Layout): number {
    return L.animalX + Math.sin(s.t * 0.52) * 9 * L.scale;
}

const UFO_R = 78; // saucer radius in layout units

// ==========================================
// BACKGROUND
// ==========================================

function drawSky(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    const g = ctx.createLinearGradient(0, 0, 0, L.groundY);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(0.56, pal.skyMid);
    g.addColorStop(1, pal.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.groundY + 1);

    if (pal.night) {
        // star field — a whisper of parallax so it reads as very far away
        const off = s.scrollPx * 0.015;
        for (let i = 0; i < 100; i++) {
            const span = L.W * 2;
            const x = (((hash(i * 3.1) * span - off) % span) + span) % span - L.W * 0.5;
            const y = hash(i * 7.7) * L.groundY * 0.7;
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(s.t * 1.5 + i));
            ctx.globalAlpha = tw * 0.9;
            ctx.fillStyle = "#ffffff";
            const r = 0.7 + hash(i * 5.3) * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    if (pal.key === "aurora") {
        // slow curtains of light — pure sin waves, no randomness per frame
        for (let b = 0; b < 3; b++) {
            const ag = ctx.createLinearGradient(0, L.groundY * 0.1, 0, L.groundY * 0.7);
            ag.addColorStop(0, "rgba(150,255,210,0)");
            ag.addColorStop(0.5, b % 2 ? "rgba(120,240,255,0.16)" : "rgba(160,255,180,0.18)");
            ag.addColorStop(1, "rgba(150,255,210,0)");
            ctx.fillStyle = ag;
            ctx.beginPath();
            ctx.moveTo(-40, L.groundY * 0.72);
            for (let x = -40; x <= L.W + 40; x += 34) {
                const y = L.groundY * 0.24
                    + Math.sin(x * 0.004 + s.t * 0.25 + b * 2.1) * 40 * L.scale
                    + b * 26 * L.scale;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(L.W + 40, L.groundY * 0.72);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawSun(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    // The video's big low sun sitting on the dunes — it barely parallaxes.
    const x = L.W * 0.68 - (s.scrollPx * 0.01) % (L.W * 2);
    const cx = ((x % (L.W * 2)) + L.W * 2) % (L.W * 2) - L.W * 0.2;
    // High enough to clear the near dune band (152 units) — the reference game's
    // sun is a bold disc on the horizon, not a glow hiding behind the hills.
    const cy = L.groundY - 118 * L.scale;
    const r = 66 * L.scale;

    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 4.2);
    glow.addColorStop(0, pal.sunGlow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - r * 4.2, cy - r * 4.2, r * 8.4, r * 8.4);

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    if (pal.night) {
        // bite a crescent out of the moon
        ctx.fillStyle = pal.skyMid;
        ctx.beginPath();
        ctx.arc(cx + r * 0.48, cy - r * 0.3, r * 0.92, 0, Math.PI * 2);
        ctx.fill();
    }
}

/** Rolling dune ridges. `par` = parallax factor, `band` = height on screen. */
function drawDunes(
    ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout,
    color: string, par: number, band: number, seed: number, alpha: number,
) {
    const off = s.scrollPx * par;
    const gap = 260 * L.scale;
    const i0 = Math.floor((off - L.W) / gap);
    const i1 = Math.ceil((off + L.W * 2) / gap);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-L.W, L.groundY + 2);
    for (let i = i0; i <= i1; i++) {
        const cx = i * gap - off;
        const h = band * (0.45 + hash(i * 1.7 + seed) * 0.9);
        const w = gap * (0.7 + hash(i * 3.3 + seed) * 0.55);
        ctx.lineTo(cx - w / 2, L.groundY + 2);
        ctx.quadraticCurveTo(cx - w * 0.2, L.groundY - h, cx, L.groundY - h * 0.94);
        ctx.quadraticCurveTo(cx + w * 0.26, L.groundY - h * 0.7, cx + w / 2, L.groundY + 2);
    }
    ctx.lineTo(L.W * 2, L.groundY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawClouds(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    const off = s.scrollPx * 0.09;
    const gap = 460 * L.scale;
    const i0 = Math.floor((off - L.W) / gap);
    const i1 = Math.ceil((off + L.W * 1.4) / gap);
    ctx.fillStyle = pal.cloud;
    for (let i = i0; i <= i1; i++) {
        const cx = i * gap - off + hash(i * 2.3) * gap * 0.5;
        const cy = L.groundY * (0.1 + hash(i * 5.1) * 0.4);
        const sc = (0.7 + hash(i * 7.3) * 0.8) * L.scale;
        ctx.globalAlpha = 0.5 + hash(i * 9.1) * 0.34;
        for (const [dx, dy, r] of [[-34, 6, 26], [0, -6, 34], [34, 8, 24], [12, 12, 22]]) {
            ctx.beginPath();
            ctx.arc(cx + dx * sc, cy + dy * sc, r * sc, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function drawGround(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    // horizon haze so the dunes melt into the sand
    const haze = ctx.createLinearGradient(0, L.groundY - 40 * L.scale, 0, L.groundY + 4);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(1, pal.haze);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = haze;
    ctx.fillRect(0, L.groundY - 40 * L.scale, L.W, 44 * L.scale);
    ctx.globalAlpha = 1;

    const g = ctx.createLinearGradient(0, L.groundY, 0, L.H);
    g.addColorStop(0, pal.ground);
    g.addColorStop(1, pal.groundDark);
    ctx.fillStyle = g;
    ctx.fillRect(0, L.groundY, L.W, L.H - L.groundY + 1);

    // the ground line itself
    ctx.strokeStyle = "rgba(43,36,54,0.35)";
    ctx.lineWidth = 2.5 * L.scale;
    ctx.beginPath();
    ctx.moveTo(0, L.groundY);
    ctx.lineTo(L.W, L.groundY);
    ctx.stroke();

    // scrolling speckles — these carry all the sense of SPEED
    const off = s.scrollPx;
    const gap = 46 * L.scale;
    const i0 = Math.floor((off - 40) / gap);
    const i1 = Math.ceil((off + L.W + 40) / gap);
    for (let i = i0; i <= i1; i++) {
        const x = i * gap - off + hash(i * 1.9) * gap;
        const y = L.groundY + 8 * L.scale + hash(i * 4.7) * (L.H - L.groundY - 10 * L.scale);
        const w = (3 + hash(i * 6.1) * 12) * L.scale;
        ctx.globalAlpha = 0.16 + hash(i * 8.3) * 0.2;
        ctx.fillStyle = hash(i * 3.7) > 0.5 ? "#ffffff" : INK;
        rr(ctx, x, y, w, 2.2 * L.scale, 1.4 * L.scale);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/** Palms, cacti and rocks planted along the ground, moving at full scroll speed. */
function drawPlants(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    const off = s.scrollPx;
    const gap = 300 * L.scale;
    const i0 = Math.floor((off - gap) / gap);
    const i1 = Math.ceil((off + L.W + gap) / gap);

    for (let i = i0; i <= i1; i++) {
        const h1 = hash(i * 1.31);
        if (h1 < 0.24) continue; // gaps, so the horizon is not a picket fence
        const x = i * gap - off + hash(i * 2.71) * gap * 0.6;
        const sc = (0.75 + hash(i * 5.17) * 0.6) * L.scale;
        const kind = hash(i * 7.19);
        const baseY = L.groundY + 2;

        if (kind < 0.55) {
            drawPalm(ctx, x, baseY, sc, pal, s.t + i);
        } else if (kind < 0.82) {
            drawCactus(ctx, x, baseY, sc, pal);
        } else {
            drawRock(ctx, x, baseY, sc, pal);
        }
    }
}

function drawPalm(
    ctx: CanvasRenderingContext2D, x: number, baseY: number,
    sc: number, pal: Palette, phase: number,
) {
    const h = 92 * sc;
    const lean = Math.sin(phase * 0.55) * 4 * sc;
    // trunk
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + lean * 0.5 + 5 * sc, baseY - h * 0.55, x + lean + 8 * sc, baseY - h);
    ctx.strokeStyle = pal.night ? "#3a3040" : "#9c6b42";
    ctx.lineWidth = 7 * sc;
    ctx.lineCap = "round";
    ctx.stroke();
    // fronds
    const tx = x + lean + 8 * sc;
    const ty = baseY - h;
    for (let f = 0; f < 6; f++) {
        const a = -Math.PI * 0.5 + (f - 2.5) * 0.52 + Math.sin(phase * 0.7 + f) * 0.05;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
            tx + Math.cos(a) * 26 * sc, ty + Math.sin(a) * 26 * sc - 10 * sc,
            tx + Math.cos(a) * 44 * sc, ty + Math.sin(a) * 44 * sc + 14 * sc,
        );
        ctx.strokeStyle = f % 2 ? pal.plant : pal.plantDark;
        ctx.lineWidth = 6.5 * sc;
        ctx.stroke();
    }
    ctx.fillStyle = pal.plantDark;
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5 * sc, 0, Math.PI * 2);
    ctx.fill();
}

function drawCactus(
    ctx: CanvasRenderingContext2D, x: number, baseY: number, sc: number, pal: Palette,
) {
    const h = 64 * sc;
    ctx.fillStyle = pal.plant;
    rr(ctx, x - 8 * sc, baseY - h, 16 * sc, h, 8 * sc);
    ctx.fill();
    ink(ctx, 2 * sc);
    // arms
    for (const [side, ah] of [[-1, 0.55], [1, 0.4]] as const) {
        ctx.fillStyle = pal.plant;
        rr(ctx, x + side * 20 * sc - 5 * sc, baseY - h * ah - 26 * sc, 10 * sc, 30 * sc, 5 * sc);
        ctx.fill();
        ink(ctx, 1.8 * sc);
        ctx.fillStyle = pal.plant;
        rr(ctx, x + (side > 0 ? 8 : -22) * sc, baseY - h * ah - 4 * sc, 16 * sc, 10 * sc, 5 * sc);
        ctx.fill();
        ink(ctx, 1.8 * sc);
    }
    ctx.strokeStyle = pal.plantDark;
    ctx.lineWidth = 1.6 * sc;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 4 * sc, baseY - h + 8 * sc);
        ctx.lineTo(x + i * 4 * sc, baseY - 6 * sc);
        ctx.stroke();
    }
}

function drawRock(
    ctx: CanvasRenderingContext2D, x: number, baseY: number, sc: number, pal: Palette,
) {
    ctx.beginPath();
    ctx.moveTo(x - 26 * sc, baseY);
    ctx.quadraticCurveTo(x - 20 * sc, baseY - 24 * sc, x - 2 * sc, baseY - 26 * sc);
    ctx.quadraticCurveTo(x + 20 * sc, baseY - 28 * sc, x + 26 * sc, baseY);
    ctx.closePath();
    ctx.fillStyle = pal.duneNear;
    ctx.fill();
    ink(ctx, 2.2 * sc);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x - 14 * sc, baseY - 6 * sc);
    ctx.quadraticCurveTo(x - 8 * sc, baseY - 20 * sc, x + 4 * sc, baseY - 21 * sc);
    ctx.quadraticCurveTo(x - 4 * sc, baseY - 12 * sc, x - 14 * sc, baseY - 6 * sc);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/** Level milestone posts — proof of progress sliding past on the sand. */
function drawSigns(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout) {
    for (const sign of s.signs) {
        const x = screenX(sign.wx, s);
        if (x < -80 * L.scale || x > L.W + 80 * L.scale) continue;
        const sc = L.scale;
        const baseY = L.groundY + 2;
        ctx.fillStyle = "#9c6b42";
        rr(ctx, x - 4 * sc, baseY - 70 * sc, 8 * sc, 70 * sc, 3 * sc);
        ctx.fill();
        ink(ctx, 2 * sc);
        ctx.fillStyle = "#fdf6e6";
        rr(ctx, x - 34 * sc, baseY - 100 * sc, 68 * sc, 34 * sc, 7 * sc);
        ctx.fill();
        ink(ctx, 2.4 * sc);
        ctx.fillStyle = INK;
        ctx.font = `900 ${17 * sc}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${sign.level}`, x, baseY - 83 * sc);
    }
}

// ==========================================
// AMBIENT DRIFTERS (birds, kites, tumbleweed)
// ==========================================

const KITE_HUES = ["#ef6b6b", "#f7c34a", "#5fc9e8", "#7d6be0", "#4fbf7a"];

function drawDrifts(
    ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout,
    pal: Palette, layer: "ground" | "sky",
) {
    for (const d of s.drifts) {
        if ((layer === "ground") !== (d.kind === "weed")) continue;
        const x = screenX(d.wx, s);
        if (x < -120 * L.scale || x > L.W + 120 * L.scale) continue;
        const sc = d.scale * L.scale;

        if (d.kind === "bird") {
            const flap = Math.sin(s.t * 7 + d.phase);
            const y = d.y + Math.sin(s.t * 1.4 + d.phase) * 7 * L.scale;
            ctx.strokeStyle = pal.night ? "#c6d4ea" : "rgba(43,36,54,0.7)";
            ctx.lineWidth = 2.6 * sc;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x - 13 * sc, y + flap * 6 * sc);
            ctx.quadraticCurveTo(x - 5 * sc, y - 4 * sc, x, y);
            ctx.quadraticCurveTo(x + 5 * sc, y - 4 * sc, x + 13 * sc, y + flap * 6 * sc);
            ctx.stroke();
            // little body so it does not read as a pure "M"
            ellipse(ctx, x, y + 1 * sc, 4 * sc, 2.6 * sc);
            ctx.fillStyle = pal.night ? "#c6d4ea" : "rgba(43,36,54,0.7)";
            ctx.fill();
            continue;
        }

        if (d.kind === "kite") {
            const y = d.y + Math.sin(s.t * 0.9 + d.phase) * 12 * L.scale;
            const rot = Math.sin(s.t * 0.7 + d.phase) * 0.22;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            const r = 15 * sc;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.78, 0);
            ctx.lineTo(0, r);
            ctx.lineTo(-r * 0.78, 0);
            ctx.closePath();
            ctx.fillStyle = KITE_HUES[d.hue % KITE_HUES.length];
            ctx.fill();
            ink(ctx, 1.8 * sc);
            ctx.strokeStyle = "rgba(43,36,54,0.45)";
            ctx.lineWidth = 1.4 * sc;
            ctx.beginPath();
            ctx.moveTo(0, -r); ctx.lineTo(0, r);
            ctx.moveTo(-r * 0.78, 0); ctx.lineTo(r * 0.78, 0);
            ctx.stroke();
            // tail with bows
            ctx.beginPath();
            ctx.moveTo(0, r);
            ctx.quadraticCurveTo(-8 * sc, r + 18 * sc, 4 * sc, r + 36 * sc);
            ctx.strokeStyle = "rgba(43,36,54,0.5)";
            ctx.lineWidth = 1.5 * sc;
            ctx.stroke();
            ctx.restore();
            continue;
        }

        // tumbleweed rolling along the sand
        const y = d.y - 9 * sc;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s.t * 4 + d.phase);
        ctx.strokeStyle = pal.night ? "#4a4258" : "#8d6b45";
        ctx.lineWidth = 1.8 * sc;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 3 * sc, Math.sin(a) * 3 * sc);
            ctx.lineTo(Math.cos(a) * 10 * sc, Math.sin(a) * 10 * sc);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 8 * sc, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ==========================================
// THE UFO AND ITS BEAM
// ==========================================

function drawBeam(
    ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette,
    front: boolean,
) {
    const ux = ufoX(s, L);
    const topY = L.ufoY + 14 * L.scale;
    const topW = UFO_R * 0.42 * L.scale;
    const botW = UFO_R * 1.15 * L.scale;
    const botY = L.groundY;

    // Strength reads in the beam: it brightens as it wins, so the player feels
    // the danger without a single pixel of shake.
    const heat = 0.34 + s.grabView * 0.4 + s.beamPulse * 0.22;
    const alpha = front ? heat * 0.3 : heat * 0.72;

    ctx.save();
    ctx.globalCompositeOperation = front ? "lighter" : "source-over";

    const g = ctx.createLinearGradient(0, topY, 0, botY);
    g.addColorStop(0, hexA(pal.beam, alpha * 0.95));
    g.addColorStop(0.65, hexA(pal.beam, alpha * 0.5));
    g.addColorStop(1, hexA(pal.beam, alpha * 0.12));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ux - topW, topY);
    ctx.lineTo(ux + topW, topY);
    ctx.lineTo(ux + botW, botY);
    ctx.lineTo(ux - botW, botY);
    ctx.closePath();
    ctx.fill();

    if (!front) {
        // scan rings sliding down — the beam's "pull" made visible. Their speed
        // tracks the beam strength, so a strong beam visibly races.
        const speed = 0.22 + s.grabView * 0.3;
        for (let i = 0; i < 7; i++) {
            const p = ((s.t * speed + i / 7) % 1);
            const y = topY + (botY - topY) * p;
            const w = topW + (botW - topW) * p;
            ctx.globalAlpha = (1 - p) * 0.4 * heat;
            ctx.strokeStyle = pal.beam;
            ctx.lineWidth = 2.4 * L.scale;
            ellipse(ctx, ux, y, w, w * 0.13);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // pool of light on the sand
        const pool = ctx.createRadialGradient(ux, botY, 0, ux, botY, botW * 1.3);
        pool.addColorStop(0, hexA(pal.beam, 0.42 * heat));
        pool.addColorStop(1, hexA(pal.beam, 0));
        ctx.fillStyle = pool;
        ellipse(ctx, ux, botY, botW * 1.3, botW * 0.3);
        ctx.fill();
    }

    ctx.restore();
}

function drawUfo(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    const x = ufoX(s, L);
    const y = L.ufoY + Math.sin(s.t * 1.15) * 5 * L.scale;
    const r = UFO_R * L.scale;

    ctx.save();

    // underside glow
    const ug = ctx.createRadialGradient(x, y + r * 0.2, 0, x, y + r * 0.2, r * 1.5);
    ug.addColorStop(0, hexA(pal.beam, 0.4));
    ug.addColorStop(1, hexA(pal.beam, 0));
    ctx.fillStyle = ug;
    ellipse(ctx, x, y + r * 0.2, r * 1.5, r * 0.6);
    ctx.fill();

    // dome
    const dome = ctx.createLinearGradient(x - r * 0.4, y - r * 0.7, x + r * 0.4, y);
    dome.addColorStop(0, "rgba(190,255,240,0.95)");
    dome.addColorStop(1, "rgba(90,200,190,0.85)");
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.06, r * 0.5, r * 0.46, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = dome;
    ctx.fill();
    ink(ctx, 2.6 * L.scale);
    // dome shine
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#ffffff";
    ellipse(ctx, x - r * 0.18, y - r * 0.2, r * 0.12, r * 0.16, -0.5);
    ctx.fill();
    ctx.globalAlpha = 1;

    // hull — the classic saucer: wide flat disc with a rim
    const hull = ctx.createLinearGradient(x, y - r * 0.2, x, y + r * 0.34);
    hull.addColorStop(0, "#e8eef4");
    hull.addColorStop(0.5, "#b9c6d2");
    hull.addColorStop(1, "#7f8d9c");
    ellipse(ctx, x, y, r, r * 0.3);
    ctx.fillStyle = hull;
    ctx.fill();
    ink(ctx, 2.8 * L.scale);

    // rim plate
    ellipse(ctx, x, y + r * 0.1, r * 0.82, r * 0.16);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    // blinking rim lights — a smooth sine per lamp, never a hard strobe
    for (let i = 0; i < 9; i++) {
        const p = (i / 8) * 2 - 1;
        const lx = x + p * r * 0.86;
        const ly = y + r * 0.14 - Math.abs(p) * r * 0.03;
        const glow = 0.35 + 0.65 * Math.max(0, Math.sin(s.t * 3.4 - i * 0.7));
        ctx.globalAlpha = glow;
        ctx.fillStyle = i % 2 ? "#ffe27a" : pal.beam;
        ctx.beginPath();
        ctx.arc(lx, ly, r * 0.075, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = glow * 0.35;
        ctx.beginPath();
        ctx.arc(lx, ly, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // beam emitter ring under the hull
    ellipse(ctx, x, y + r * 0.26, r * 0.44, r * 0.11);
    ctx.fillStyle = hexA(pal.beam, 0.85);
    ctx.fill();
    ink(ctx, 2 * L.scale);

    // antennae
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + side * r * 0.3, y - r * 0.4);
        ctx.lineTo(x + side * r * 0.44, y - r * 0.66);
        ctx.strokeStyle = "rgba(43,36,54,0.75)";
        ctx.lineWidth = 2.4 * L.scale;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + side * r * 0.44, y - r * 0.68, r * 0.055, 0, Math.PI * 2);
        ctx.fillStyle = "#ff7d7d";
        ctx.fill();
    }

    ctx.restore();
}

/**
 * The alien leans out of the dome to announce a level, exactly like the video's
 * "Level 2" bubble. It slides in and out on an eased curve.
 */
function drawAlien(
    ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout,
    label: string, sublabel: string,
) {
    if (s.alienT <= 0) return;
    const total = 2.6;
    const p = 1 - s.alienT / total;
    // 0..1 in, hold, 0..1 out — all eased, nothing snaps
    const rise = p < 0.18 ? easeOut(p / 0.18) : p > 0.82 ? easeOut((1 - p) / 0.18) : 1;
    if (rise <= 0.01) return;

    const x = ufoX(s, L) + UFO_R * 0.62 * L.scale;
    const y = L.ufoY + Math.sin(s.t * 1.15) * 5 * L.scale - UFO_R * 0.42 * L.scale;
    const sc = L.scale * 1.05;

    ctx.save();
    ctx.globalAlpha = rise;
    ctx.translate(x, y + (1 - rise) * 26 * sc);

    // body
    ctx.fillStyle = "#8fd86a";
    rr(ctx, -9 * sc, -2 * sc, 18 * sc, 30 * sc, 8 * sc);
    ctx.fill();
    ink(ctx, 2.2 * sc);

    // waving arm — a slow sine wave, in keeping with everything else
    const wave = Math.sin(s.t * 5.5) * 0.5;
    ctx.save();
    ctx.translate(9 * sc, 6 * sc);
    ctx.rotate(-0.8 + wave);
    ctx.strokeStyle = "#8fd86a";
    ctx.lineWidth = 5 * sc;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16 * sc, 0);
    ctx.stroke();
    ctx.restore();

    // head
    ellipse(ctx, 0, -12 * sc, 13 * sc, 15 * sc);
    ctx.fillStyle = "#a5e77c";
    ctx.fill();
    ink(ctx, 2.2 * sc);
    // big almond eyes
    for (const side of [-1, 1]) {
        ellipse(ctx, side * 5 * sc, -13 * sc, 4 * sc, 6 * sc, side * 0.4);
        ctx.fillStyle = "#221c2c";
        ctx.fill();
        ellipse(ctx, side * 5.8 * sc, -15 * sc, 1.3 * sc, 1.8 * sc, side * 0.4);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
    }
    // antennae
    for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 7 * sc, -24 * sc);
        ctx.quadraticCurveTo(side * 12 * sc, -32 * sc, side * 9 * sc, -36 * sc);
        ctx.strokeStyle = "#8fd86a";
        ctx.lineWidth = 2.4 * sc;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(side * 9 * sc, -37 * sc, 2.4 * sc, 0, Math.PI * 2);
        ctx.fillStyle = "#ffe27a";
        ctx.fill();
    }

    // speech bubble
    const padX = 12 * sc;
    ctx.font = `900 ${16 * sc}px ui-sans-serif, system-ui, sans-serif`;
    const w1 = ctx.measureText(label).width;
    ctx.font = `700 ${11 * sc}px ui-sans-serif, system-ui, sans-serif`;
    const w2 = ctx.measureText(sublabel).width;
    const bw = Math.max(w1, w2) + padX * 2;
    const bh = 46 * sc;
    // Well BELOW and to the right of the alien. The letter-tile row owns the
    // top-centre of the screen and its plate reaches ~170px down, so a bubble any
    // higher than this covers the word the player is racing — with a 10-letter
    // word the tile row reaches almost this far left.
    const bx = 26 * sc;
    const by = 56 * sc;

    ctx.fillStyle = "rgba(255,255,255,0.96)";
    rr(ctx, bx, by, bw, bh, 12 * sc);
    ctx.fill();
    ink(ctx, 2.4 * sc);
    // tail
    // tail points up-left, back at the alien's chest
    ctx.beginPath();
    ctx.moveTo(bx + 6 * sc, by + 2 * sc);
    ctx.lineTo(bx - 14 * sc, by - 22 * sc);
    ctx.lineTo(bx + 6 * sc, by + 18 * sc);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fill();

    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${16 * sc}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(label, bx + bw / 2, by + bh * 0.36);
    ctx.fillStyle = "rgba(43,36,54,0.6)";
    ctx.font = `700 ${11 * sc}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(sublabel, bx + bw / 2, by + bh * 0.68);

    ctx.restore();
}

/** The capture ring: charges at the emitter, then slides down the beam. */
function drawSnare(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout) {
    const sn = s.snare;
    if (!sn) return;
    const ux = ufoX(s, L);
    const topY = L.ufoY + 22 * L.scale;
    const animalY = grabToY(s, L);
    const y = topY + (animalY - topY) * sn.p;
    const w = (UFO_R * 0.42 + (UFO_R * 0.85 - UFO_R * 0.42) * sn.p) * L.scale;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (sn.phase === "burst") {
        const p = Math.min(1, sn.t / 0.4);
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = "#b6ffd0";
        ctx.lineWidth = (6 - p * 5) * L.scale;
        ellipse(ctx, ux, y, w * (1 + p * 1.5), w * (1 + p * 1.5) * 0.22);
        ctx.stroke();
        ctx.restore();
        return;
    }

    const charging = sn.phase === "tele";
    const pulse = 0.6 + 0.4 * Math.sin(s.t * (charging ? 11 : 6));
    ctx.globalAlpha = charging ? 0.5 + pulse * 0.45 : 0.95;

    // double ring so it reads as a solid hoop, not a scan line
    for (const [rw, lw] of [[1, 5.5], [0.86, 2.4]] as const) {
        ctx.strokeStyle = charging ? "#ffd166" : "#ff8a6b";
        ctx.lineWidth = lw * L.scale;
        ellipse(ctx, ux, y, w * rw, w * rw * 0.2);
        ctx.stroke();
    }
    // glow blob
    const g = ctx.createRadialGradient(ux, y, 0, ux, y, w * 1.6);
    g.addColorStop(0, charging ? "rgba(255,209,102,0.4)" : "rgba(255,138,107,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ellipse(ctx, ux, y, w * 1.6, w * 0.5);
    ctx.fill();

    ctx.restore();
}

// ==========================================
// THE ANIMAL
// ==========================================

function drawHero(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    const sp = speciesOf(s);
    const y = grabToY(s, L);
    const grounded = s.grabView < 0.02;
    const swallow = s.phase === "abducted" ? Math.min(1, s.abductT / 0.7) : 0;

    // contact shadow on the sand, fading as the animal is lifted
    const shadowA = Math.max(0, 0.32 - s.grabView * 0.34);
    if (shadowA > 0.01) {
        ctx.globalAlpha = shadowA;
        ctx.fillStyle = INK;
        ellipse(ctx, L.animalX, L.groundY + 3 * L.scale, L.u * 1.9, L.u * 0.34);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // immunity halo after a rescue — a soft breathing ring, no flicker
    if (s.immune > 0) {
        const a = 0.25 + 0.2 * Math.sin(s.t * 8);
        ctx.globalAlpha = a * Math.min(1, s.immune);
        ctx.strokeStyle = "#8ef2a8";
        ctx.lineWidth = 3 * L.scale;
        ellipse(ctx, L.animalX, y, L.u * 2.5, L.u * 2.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    ctx.save();
    if (swallow > 0) {
        // sucked into the saucer: shrink toward the mouth as it goes
        const k = 1 - swallow * 0.75;
        ctx.translate(L.animalX, y);
        ctx.scale(k, k);
        ctx.translate(-L.animalX, -y);
        ctx.globalAlpha = 1 - swallow * 0.65;
    }

    drawAnimal(ctx, sp, L.animalX, y, L.u, {
        panic: s.panic,
        // continuous, not the per-keystroke spike — see AnimalPose.vel
        vel: Math.max(-1, Math.min(1, s.grabVelView / GRAB_VEL_FULL)),
        kick: s.kick,
        blink: s.blink,
        grounded,
        swallow,
        t: s.t,
    });
    ctx.restore();
    ctx.globalAlpha = 1;

    // the green beam wash over the animal, so it clearly reads as "held"
    if (s.grabView > 0.03) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(0.3, s.grabView * 0.3);
        const g = ctx.createRadialGradient(L.animalX, y, 0, L.animalX, y, L.u * 3);
        g.addColorStop(0, pal.beam);
        g.addColorStop(1, hexA(pal.beam, 0));
        ctx.fillStyle = g;
        ellipse(ctx, L.animalX, y, L.u * 3, L.u * 3);
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// PARTICLES
// ==========================================

export function drawParticles(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout) {
    for (const p of s.particles) {
        const k = 1 - p.life / p.ttl;
        if (k <= 0) continue;
        const x = p.fixed ? p.wx : screenX(p.wx, s);
        if (x < -60 || x > L.W + 60) continue;

        ctx.globalAlpha = Math.max(0, Math.min(1, k));

        if (p.kind === "ring") {
            const grow = 1 - k;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = (5 - grow * 4) * L.scale;
            ctx.beginPath();
            ctx.arc(x, p.y, p.size * L.scale * (1 + grow * 5), 0, Math.PI * 2);
            ctx.stroke();
            continue;
        }

        if (p.kind === "star") {
            ctx.save();
            ctx.translate(x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            const r = p.size * L.scale;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const rad = i % 2 ? r * 0.42 : r;
                ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            continue;
        }

        if (p.kind === "shard") {
            ctx.save();
            ctx.translate(x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            rr(ctx, -p.size * 0.5 * L.scale, -p.size * 0.24 * L.scale,
                p.size * L.scale, p.size * 0.48 * L.scale, p.size * 0.2 * L.scale);
            ctx.fill();
            ctx.restore();
            continue;
        }

        if (p.kind === "dust") {
            ctx.globalAlpha = k * 0.4;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(x, p.y, p.size * L.scale * (1.6 - k * 0.6), 0, Math.PI * 2);
            ctx.fill();
            continue;
        }

        // spark — a short downward streak, the animal's effort made visible
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.5 * L.scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x - p.vx * 0.02, p.y - p.vy * 0.03);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// ==========================================
// LETTER TILES — the video's keycap row, our house style
// ==========================================

const TILE_TYPED = "#3ec97a";
const TILE_CURRENT = "#ffc93c";
const TILE_ERROR = "#f4645f";
const TILE_PENDING = "#fffdf6";
const TILE_GOLD_RIM = "#e0a213";

function drawTiles(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout) {
    const word = s.word;
    if (!word) return;

    const n = word.length;
    // shrink the tiles rather than overflow when a long word lands on a phone
    const maxRow = L.W * 0.86;
    let size = 52 * L.scale;
    let gap = 9 * L.scale;
    if (n * (size + gap) > maxRow) {
        const k = maxRow / (n * (size + gap));
        size *= k;
        gap *= k;
    }
    const totalW = n * size + (n - 1) * gap;
    const x0 = (L.W - totalW) / 2;
    const y = L.H * (L.H < 700 ? 0.1 : 0.115);

    // a soft plate behind the row so the letters read on any sky
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    rr(ctx, x0 - 18 * L.scale, y - 14 * L.scale,
        totalW + 36 * L.scale, size + 28 * L.scale, 20 * L.scale);
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let i = 0; i < n; i++) {
        // staggered intro: each tile eases up into place when a word appears
        const introDelay = i * 0.035;
        const intro = Math.max(0, Math.min(1, (s.wordAge - introDelay) / 0.18));
        if (intro <= 0) continue;
        const introEase = easeOut(intro);

        const isTyped = i < s.typed;
        const isCurrent = i === s.typed;
        const x = x0 + i * (size + gap);

        // the current tile breathes; a typo washes it red, then eases back
        const pulse = isCurrent ? 1 + Math.sin(s.t * 6.2) * 0.035 : 1;
        const lift = isCurrent ? -3 * L.scale : 0;
        const sc = introEase * pulse;

        ctx.save();
        ctx.translate(x + size / 2, y + size / 2 + (1 - introEase) * 16 * L.scale + lift);
        ctx.scale(sc, sc);
        ctx.globalAlpha = introEase;

        let fill = TILE_PENDING;
        let letterColor = INK;
        if (isTyped) {
            fill = TILE_TYPED;
            letterColor = "#ffffff";
        } else if (isCurrent) {
            fill = s.errFlash > 0
                ? mix(TILE_CURRENT, TILE_ERROR, Math.min(1, s.errFlash))
                : TILE_CURRENT;
            letterColor = INK;
        }

        // glow under the active tile
        if (isCurrent) {
            const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.1);
            gl.addColorStop(0, s.errFlash > 0 ? "rgba(244,100,95,0.55)" : "rgba(255,201,60,0.55)");
            gl.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gl;
            ctx.beginPath();
            ctx.arc(0, 0, size * 1.1, 0, Math.PI * 2);
            ctx.fill();
        }

        // the keycap: a plate with a drop shadow lip, no bevel noise
        ctx.fillStyle = "rgba(43,36,54,0.85)";
        rr(ctx, -size / 2, -size / 2 + 4 * L.scale, size, size, size * 0.24);
        ctx.fill();
        ctx.fillStyle = fill;
        rr(ctx, -size / 2, -size / 2, size, size, size * 0.24);
        ctx.fill();
        ctx.strokeStyle = s.gold ? TILE_GOLD_RIM : "rgba(43,36,54,0.85)";
        ctx.lineWidth = (s.gold ? 3.4 : 2.6) * L.scale;
        rr(ctx, -size / 2, -size / 2, size, size, size * 0.24);
        ctx.stroke();

        // top highlight
        ctx.globalAlpha = introEase * 0.4;
        ctx.fillStyle = "#ffffff";
        rr(ctx, -size / 2 + size * 0.14, -size / 2 + size * 0.12,
            size * 0.72, size * 0.22, size * 0.11);
        ctx.fill();
        ctx.globalAlpha = introEase;

        ctx.fillStyle = letterColor;
        ctx.font = `900 ${size * 0.56}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(word[i].toUpperCase(), 0, size * 0.03);

        ctx.restore();
    }

    // caret under the active tile — a steady eased bar, never a blink
    if (s.typed < n) {
        const cx = x0 + s.typed * (size + gap) + size / 2;
        const cy = y + size + 9 * L.scale;
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(s.t * 3.4));
        ctx.fillStyle = s.errFlash > 0 ? TILE_ERROR : TILE_CURRENT;
        rr(ctx, cx - size * 0.24, cy, size * 0.48, 4.5 * L.scale, 2.5 * L.scale);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    if (s.gold) {
        // a small crown so a golden word is unmistakable
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = TILE_GOLD_RIM;
        ctx.font = `900 ${13 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("★ ★ ★", L.W / 2, y - 20 * L.scale);
        ctx.globalAlpha = 1;
    }
}

// ==========================================
// OVERLAYS
// ==========================================

function drawOverlays(ctx: CanvasRenderingContext2D, s: BeamBreakState, L: Layout, pal: Palette) {
    // danger vignette — eases in as the beam wins. This replaces the shake that
    // an arcade game would normally use, and it never moves the scene.
    const danger = Math.max(0, (s.grabView - 0.55) / 0.45);
    if (danger > 0.01) {
        const g = ctx.createRadialGradient(
            L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.26,
            L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.72,
        );
        g.addColorStop(0, "rgba(255,60,60,0)");
        g.addColorStop(1, `rgba(180,30,40,${(0.16 + 0.1 * Math.sin(s.t * 4)) * danger})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L.W, L.H);
    }

    if (s.freeFlash > 0) {
        ctx.globalAlpha = s.freeFlash * 0.16;
        ctx.fillStyle = pal.beam;
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }

    if (s.goldFlash > 0) {
        ctx.globalAlpha = s.goldFlash * 0.2;
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }

    if (s.errFlash > 0) {
        ctx.globalAlpha = s.errFlash * 0.1;
        ctx.fillStyle = "#f4645f";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }

    // speed streaks once the world is really moving — reward for typing fast
    if (s.scrollV > 260) {
        const k = Math.min(1, (s.scrollV - 260) / 260);
        ctx.globalAlpha = k * 0.16;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 * L.scale;
        for (let i = 0; i < 9; i++) {
            const y = (hash(i * 4.1) * 0.7 + 0.08) * L.groundY;
            const len = (60 + hash(i * 8.7) * 130) * L.scale;
            const x = (L.W + 200 - ((s.scrollPx * 1.7 + hash(i * 2.9) * 2000) % (L.W + 400)));
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}

// ==========================================
// COLOUR HELPERS
// ==========================================

function hexA(hex: string, a: number): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}

function mix(a: string, b: string, k: number): string {
    const pa = a.replace("#", "");
    const pb = b.replace("#", "");
    const ch = (h: string, i: number) => parseInt(h.slice(i * 2, i * 2 + 2), 16);
    const r = Math.round(ch(pa, 0) + (ch(pb, 0) - ch(pa, 0)) * k);
    const g = Math.round(ch(pa, 1) + (ch(pb, 1) - ch(pa, 1)) * k);
    const bl = Math.round(ch(pa, 2) + (ch(pb, 2) - ch(pa, 2)) * k);
    return `rgb(${r},${g},${bl})`;
}

// ==========================================
// THE ONE ENTRY POINT
// ==========================================

export interface DrawLabels {
    /** e.g. "Level 3" — shown in the alien's bubble. */
    level: string;
    /** e.g. "longer words · stronger beam" */
    levelNote: string;
}

export function draw(
    ctx: CanvasRenderingContext2D,
    s: BeamBreakState,
    W: number,
    H: number,
    labels: DrawLabels,
) {
    const L = layoutFor(W, H);
    const pal = paletteFor(s.palette);

    ctx.clearRect(0, 0, W, H);

    drawSky(ctx, s, L, pal);
    drawSun(ctx, s, L, pal);
    drawDunes(ctx, s, L, pal.duneFar, 0.16, 108 * L.scale, 3.1, 0.75);
    drawClouds(ctx, s, L, pal);
    drawDunes(ctx, s, L, pal.duneNear, 0.34, 152 * L.scale, 11.7, 0.95);
    drawGround(ctx, s, L, pal);
    drawPlants(ctx, s, L, pal);
    drawSigns(ctx, s, L);
    drawDrifts(ctx, s, L, pal, "ground");
    drawDrifts(ctx, s, L, pal, "sky");

    drawBeam(ctx, s, L, pal, false);
    drawUfo(ctx, s, L, pal);
    drawAlien(ctx, s, L, labels.level, labels.levelNote);
    drawSnare(ctx, s, L);
    drawHero(ctx, s, L, pal);
    drawBeam(ctx, s, L, pal, true);
    drawParticles(ctx, s, L);
    drawTiles(ctx, s, L);
    drawOverlays(ctx, s, L, pal);
}

/** Distance in metres, the way the HUD and the cards show it. */
export function metres(s: BeamBreakState): number {
    return Math.floor(s.distance);
}
