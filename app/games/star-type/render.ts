// =========================================================================
// 🛰️ STAR TYPE — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it.
//
// Painter order (back to front):
//   deep space → nebula → stars → the drifting grid → bolts → drones →
//   word labels → particles → ship → overlays (wave intro, death glitch)
//
// The reference's look is almost entirely made of three things, so those get
// the most care here:
//   1. a very dark blue-green field with soft nebula wash,
//   2. a large, slightly ROTATED grid that drifts downward — it is what makes
//      empty space read as motion,
//   3. solid black label boxes with the word in white, or, once locked, the
//      remaining letters in ORANGE with the typed ones simply not drawn. The
//      box keeps the full word's width so the text never shifts under your
//      fingers mid-word.
//
// Everything is procedural (no image assets) and scaled off `Layout.scale`.
// Infinite-looking layers come from `hash(i)`: deterministic, so they never
// shimmer. NEVER call Math.random() in this file (see CLAUDE.md).
// =========================================================================

import {
    KILL_RADIUS, SHIP_DEATH_TIME, SHIP_Y_FRAC,
    type Drone, type StarTypeState,
} from "./sim";

// ---------- tiny helpers ----------

/** Deterministic pseudo-random in [0,1) — a stable starfield with no state. */
function hash(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function easeOut(p: number) {
    return 1 - (1 - p) * (1 - p);
}

function clamp01(v: number) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ---------- the palette, lifted from the reference ----------
const SPACE_TOP = "#0a1a1c";
const SPACE_MID = "#0d2426";
const SPACE_LOW = "#08181a";
const GRID_LINE = "rgba(148,196,192,0.10)";
const AMBER = "#ff9d2e";
const AMBER_HOT = "#ffd08a";
const SHIP_CYAN = "#3ff0d0";

// ---------- layout: the one coordinate mapping ----------

export interface Layout {
    W: number;
    H: number;
    shipX: number;
    shipY: number;
    scale: number; // 1 at 900px tall — everything scales off this
    /** Radius inside which a drone destroys the ship. */
    killR: number;
}

export function layoutFor(W: number, H: number): Layout {
    // The reference is a portrait phone game; this is laid out for a full
    // landscape window, so the scale is driven by the SHORTER axis or it blows
    // up on an ultrawide monitor.
    const scale = Math.max(0.6, Math.min(1.5, Math.min(H, W * 0.62) / 900));
    return {
        W, H,
        shipX: W / 2,
        shipY: H * SHIP_Y_FRAC,
        scale,
        killR: KILL_RADIUS * scale,
    };
}

/** Where the ship's gun sits — bolts start here. */
export function muzzleOf(L: Layout): { x: number; y: number } {
    return { x: L.shipX, y: L.shipY - 22 * L.scale };
}

// ==========================================
// BACKGROUND
// ==========================================

function drawSpace(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    const g = ctx.createLinearGradient(0, 0, 0, L.H);
    g.addColorStop(0, SPACE_TOP);
    g.addColorStop(0.5, SPACE_MID);
    g.addColorStop(1, SPACE_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);

    // nebula: a handful of huge, very soft radial washes that barely move
    for (let i = 0; i < 6; i++) {
        const nx = hash(i * 3.7) * L.W;
        const ny = hash(i * 8.1) * L.H;
        const nr = (0.2 + hash(i * 5.5) * 0.3) * Math.min(L.W, L.H);
        const drift = Math.sin(s.t * 0.06 + i) * 18 * L.scale;
        const tint = i % 3 === 0
            ? "rgba(70,140,150,0.10)"
            : i % 3 === 1
                ? "rgba(60,90,150,0.08)"
                : "rgba(120,70,130,0.07)";
        const rg = ctx.createRadialGradient(nx, ny + drift, 0, nx, ny + drift, nr);
        rg.addColorStop(0, tint);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(nx - nr, ny + drift - nr, nr * 2, nr * 2);
    }

    // stars
    for (let i = 0; i < 150; i++) {
        const x = hash(i * 2.3) * L.W;
        const y = hash(i * 9.1) * L.H;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(s.t * 0.9 + i * 0.6));
        ctx.globalAlpha = tw * (0.15 + hash(i * 4.7) * 0.5);
        ctx.fillStyle = "#dff6ff";
        const r = (0.5 + hash(i * 6.9) * 1.5) * L.scale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/**
 * The drifting grid. It is rotated a few degrees on purpose: axis-aligned it
 * reads as a spreadsheet, and the slight tilt is what makes the reference's
 * empty space feel like a moving surface rather than a backdrop.
 */
function drawGrid(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    const cell = 46 * L.scale;
    const drift = (s.t * 16 * L.scale) % cell;
    const diag = Math.hypot(L.W, L.H);

    ctx.save();
    ctx.translate(L.W / 2, L.H / 2);
    ctx.rotate(-0.055); // ≈ 3.2°
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = Math.max(1, 1 * L.scale);
    ctx.beginPath();
    for (let x = -diag / 2; x <= diag / 2; x += cell) {
        ctx.moveTo(x, -diag / 2);
        ctx.lineTo(x, diag / 2);
    }
    for (let y = -diag / 2 + drift; y <= diag / 2; y += cell) {
        ctx.moveTo(-diag / 2, y);
        ctx.lineTo(diag / 2, y);
    }
    ctx.stroke();
    ctx.restore();
}

// ==========================================
// THE SHIP — a cyan wireframe craft, glowing, nose up.
// ==========================================

export function drawShip(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    // Once it blows up it stays blown up. `over` matters as much as `dying`:
    // the results card is translucent, so a ship drawn behind it would be a
    // ghost of the one the player just lost.
    if (s.phase === "over") return;
    if (s.phase === "dying" && s.deathT > 0.18) return;
    const u = L.scale;
    const x = L.shipX;
    const y = L.shipY + Math.sin(s.t * 1.8) * 2 * u - s.shipRecoil * 5 * u;

    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = SHIP_CYAN;
    ctx.shadowBlur = (14 + s.shipRecoil * 16) * u;
    ctx.strokeStyle = SHIP_CYAN;
    ctx.lineWidth = 2.2 * u;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // hull
    ctx.beginPath();
    ctx.moveTo(0, -26 * u);
    ctx.lineTo(7 * u, -8 * u);
    ctx.lineTo(6 * u, 12 * u);
    ctx.lineTo(-6 * u, 12 * u);
    ctx.lineTo(-7 * u, -8 * u);
    ctx.closePath();
    ctx.stroke();

    // swept wings
    ctx.beginPath();
    ctx.moveTo(-7 * u, -6 * u);
    ctx.lineTo(-24 * u, 6 * u);
    ctx.lineTo(-20 * u, 14 * u);
    ctx.lineTo(-6 * u, 10 * u);
    ctx.moveTo(7 * u, -6 * u);
    ctx.lineTo(24 * u, 6 * u);
    ctx.lineTo(20 * u, 14 * u);
    ctx.lineTo(6 * u, 10 * u);
    ctx.stroke();

    // cockpit
    ctx.beginPath();
    ctx.moveTo(0, -18 * u);
    ctx.lineTo(3.5 * u, -6 * u);
    ctx.lineTo(-3.5 * u, -6 * u);
    ctx.closePath();
    ctx.stroke();

    // engine flare, pulsing
    const flare = (0.7 + 0.3 * Math.abs(Math.sin(s.t * 9))) * (1 + s.shipRecoil);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#c8fff4";
    ctx.beginPath();
    ctx.moveTo(-4 * u, 12 * u);
    ctx.lineTo(4 * u, 12 * u);
    ctx.lineTo(0, (18 + 12 * flare) * u);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
}

// ==========================================
// DRONES
// ==========================================

/**
 * One enemy drone: a dark disc inside a glowing amber ring, with a small arrow
 * pointing the way it is travelling. Bigger words get a bigger ring and, past a
 * threshold, outrigger arms — so how dangerous a drone is reads at a glance
 * before you have read its word.
 */
export function drawDrone(
    ctx: CanvasRenderingContext2D, d: Drone, t: number, locked: boolean, scale: number,
) {
    const r = d.r;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.globalAlpha = d.born;

    const glow = locked ? 1 : 0.55;
    const hot = d.hit;

    // outer glow
    ctx.shadowColor = hot > 0.05 ? "#ffffff" : AMBER;
    ctx.shadowBlur = (10 + glow * 12 + hot * 26) * scale;

    // arms on the big ones
    if (r > 17 * scale) {
        ctx.strokeStyle = `rgba(255,157,46,${0.5 + glow * 0.4})`;
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = d.spin + (i / 6) * Math.PI * 2;
            ctx.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
            ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
        }
        ctx.stroke();
    }

    // dark body
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.fillStyle = "#120d0a";
    ctx.fill();

    // the ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.strokeStyle = hot > 0.05 ? "#ffffff" : AMBER;
    ctx.lineWidth = (2.2 + hot * 2.4) * scale;
    ctx.stroke();

    // inner ring, counter-rotating
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, -d.spin, -d.spin + Math.PI * 1.4);
    ctx.strokeStyle = `rgba(255,208,138,${0.5 + glow * 0.5})`;
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    // the heading arrow
    ctx.shadowBlur = 0;
    const ang = Math.atan2(d.vy, d.vx);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(r * 0.42, 0);
    ctx.lineTo(-r * 0.16, r * 0.26);
    ctx.lineTo(-r * 0.16, -r * 0.26);
    ctx.closePath();
    ctx.fillStyle = hot > 0.05 ? "#ffffff" : AMBER_HOT;
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
}

/**
 * The word label: a solid black box with the word in it.
 *
 * The two states are the whole reading of the game, so they are deliberately
 * loud: an untargeted word is WHITE, and a locked word draws only the letters
 * you have LEFT, in ORANGE. The typed prefix is not drawn at all — but the box
 * still reserves its width, so the remaining text never slides sideways
 * mid-word. Getting that wrong makes the game unplayable at speed.
 */
function drawLabel(
    ctx: CanvasRenderingContext2D, d: Drone, locked: boolean, scale: number,
) {
    const fs = 21 * scale;
    ctx.font = `500 ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const full = ctx.measureText(d.word).width;
    const padX = 5 * scale;
    const boxW = full + padX * 2;
    const boxH = fs * 1.32;
    // hang the label on the side away from the screen edge, below the drone
    const bx = d.labelSide < 0 ? d.x - boxW + d.r * 0.4 : d.x - d.r * 0.4;
    const by = d.y + d.r * 0.65;

    ctx.globalAlpha = d.born;
    ctx.fillStyle = "#000000";
    ctx.fillRect(bx, by, boxW, boxH);

    if (locked) {
        // only the letters still to type, in amber, at their true x position
        const typedW = ctx.measureText(d.word.slice(0, d.typed)).width;
        ctx.fillStyle = AMBER;
        ctx.shadowColor = AMBER;
        ctx.shadowBlur = 8 * scale;
        ctx.fillText(d.word.slice(d.typed), bx + padX + typedW, by + boxH / 2);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillText(d.word, bx + padX, by + boxH / 2);
    }
    ctx.globalAlpha = 1;
}

function drawDrones(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    for (const d of s.drones) drawDrone(ctx, d, s.t, d.id === s.locked, L.scale);
    // labels in a second pass, so a drone can never be drawn over a word
    for (const d of s.drones) drawLabel(ctx, d, d.id === s.locked, L.scale);
}

// ==========================================
// BOLTS AND PARTICLES
// ==========================================

function drawBolts(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const b of s.bolts) {
        const m = Math.hypot(b.vx, b.vy) || 1;
        const ux = b.vx / m, uy = b.vy / m;
        const len = Math.min(70 * L.scale, b.remain + 26 * L.scale);
        ctx.strokeStyle = "rgba(200,255,250,0.5)";
        ctx.lineWidth = 7 * L.scale;
        ctx.beginPath();
        ctx.moveTo(b.x - ux * len, b.y - uy * len);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.4 * L.scale;
        ctx.beginPath();
        ctx.moveTo(b.x - ux * len * 0.8, b.y - uy * len * 0.8);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, s: StarTypeState) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of s.particles) {
        const k = 1 - p.life / p.ttl;
        if (p.kind === "ring") {
            const grow = easeOut(p.life / p.ttl);
            ctx.globalAlpha = k * 0.9;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1, 6 * k);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + grow * p.size * 5, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.kind === "streak") {
            ctx.globalAlpha = k;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2.5 * k;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - Math.cos(p.rot) * p.size, p.y - Math.sin(p.rot) * p.size);
            ctx.stroke();
        } else if (p.kind === "debris") {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.5);
        } else {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}

// ==========================================
// OVERLAYS
// ==========================================

function drawWaveIntro(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    if (s.phase !== "wave-intro" || s.introT <= 0) return;
    // fade in, hold, fade out
    const p = 1 - s.introT / 2.2;
    const a = Math.min(1, Math.min(p * 4, (1 - p) * 4));
    ctx.save();
    ctx.globalAlpha = clamp01(a);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = SHIP_CYAN;
    ctx.shadowColor = SHIP_CYAN;
    ctx.shadowBlur = 24 * L.scale;
    ctx.font = `300 ${64 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(`WAVE ${String(s.wave).padStart(3, "0")}`, L.W / 2, L.H * 0.42);
    ctx.restore();
}

/**
 * The reference blows the ship up in a wash of cyan and then datamoshes the
 * frame. This is that: a flash, then horizontal slices of the already-drawn
 * canvas shoved sideways for a beat.
 */
function drawDeath(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    if (s.flash > 0.01) {
        ctx.globalAlpha = s.flash * 0.85;
        ctx.fillStyle = "#d8fffa";
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.globalAlpha = 1;
    }
    if (s.glitch <= 0.01) return;

    const slices = 14;
    const h = L.H / slices;
    for (let i = 0; i < slices; i++) {
        // deterministic per slice and per 60 ms tick, so it stutters instead of
        // buzzing — and so it never uses Math.random()
        const tick = Math.floor(s.t * 16);
        const r = hash(i * 12.9 + tick * 3.1);
        if (r > 0.55) continue;
        const dx = (r - 0.28) * 240 * s.glitch * L.scale;
        try {
            ctx.drawImage(ctx.canvas, 0, i * h, L.W, h, dx, i * h, L.W, h);
        } catch {
            /* a zero-sized canvas during a resize — skip the slice */
        }
    }
    // A whisper of cyan/magenta channel split. Kept very low on purpose: at any
    // real strength a full-screen additive fill stops reading as a glitch and
    // just turns the whole frame blue.
    ctx.globalAlpha = s.glitch * 0.07;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#00fff0";
    ctx.fillRect(-8 * s.glitch * L.scale, 0, L.W, L.H);
    ctx.fillStyle = "#ff00a0";
    ctx.fillRect(8 * s.glitch * L.scale, 0, L.W, L.H);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
}

/** The wave number in its amber hexagon, bottom-right — the whole in-run HUD. */
function drawWaveBadge(ctx: CanvasRenderingContext2D, s: StarTypeState, L: Layout) {
    if (s.phase === "attract") return;
    const r = 19 * L.scale;
    const cx = L.W - 34 * L.scale;
    const cy = L.H - 34 * L.scale;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = "#f5c518";
    ctx.fill();
    ctx.fillStyle = "#1a1400";
    ctx.font = `700 ${18 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(s.wave), cx, cy + 1 * L.scale);
    ctx.restore();
}

// ==========================================
// THE ONE ENTRY POINT
// ==========================================

export function draw(
    ctx: CanvasRenderingContext2D, s: StarTypeState, W: number, H: number,
) {
    const L = layoutFor(W, H);

    drawSpace(ctx, s, L);
    drawGrid(ctx, s, L);
    drawBolts(ctx, s, L);
    drawDrones(ctx, s, L);
    drawParticles(ctx, s);
    drawShip(ctx, s, L);
    drawWaveIntro(ctx, s, L);
    drawWaveBadge(ctx, s, L);
    drawDeath(ctx, s, L);
}

/** Exported for the menu's ship badge, which reuses the game's own painter. */
export { SHIP_CYAN, AMBER, SHIP_DEATH_TIME };
