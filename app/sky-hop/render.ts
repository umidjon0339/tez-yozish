// =========================================================================
// 🎈 SKY HOP — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it (the only exception is nothing).
//
// Painter order: sky → stars/sun → far hills → far clouds → sea → near
// clouds → checkpoint islands → chain balloons → free balloons → hero →
// crow → particles → overlays.
//
// Everything is procedural (no image assets), sized off the canvas height so
// the scene composes the same on a phone and on a 4K screen.
// =========================================================================

import {
    BALLOON_HUES, GOLD_HUE, HERO_X_FRAC, RISE_PER, SEA_FRAC, SKY_FRAC, SPACING,
    paletteFor, type Balloon, type SkyHopState, type SkyPalette,
} from "./sim";

// ---------- tiny helpers ----------

/** Deterministic pseudo-random in [0,1) — lets us draw an infinite, stable world. */
function hash(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
}

export interface Layout {
    W: number;
    H: number;
    seaY: number;
    skyY: number;
    heroX: number;
    scale: number; // 1 at 800px tall — everything scales off this
}

export function layoutFor(W: number, H: number): Layout {
    return {
        W, H,
        seaY: H * SEA_FRAC,
        // on short viewports the ceiling drops further from the top edge, so a
        // maxed-out balloon never hides behind the HUD row
        skyY: H * (H < 700 ? 0.25 : SKY_FRAC),
        heroX: W * HERO_X_FRAC,
        scale: Math.max(0.62, Math.min(1.25, H / 800)),
    };
}

/** How far below the envelope centre the hero dangles (× Layout.scale). */
export const HERO_DROP = 108;

/**
 * Altitude → screen y of the ENVELOPE CENTRE. `alt = 0` puts the hero (which
 * hangs HERO_DROP below it) exactly on the waterline, so the splash reads true.
 */
export function altToY(alt: number, L: Layout) {
    const low = L.seaY - HERO_DROP * L.scale;
    return low - alt * (low - L.skyY);
}

export function screenX(wx: number, s: SkyHopState, L: Layout) {
    return wx - s.camX + L.heroX;
}

/** Screen y of the chain balloon `ix` (the chain climbs away to the right). */
export function balloonY(b: Balloon, s: SkyHopState, L: Layout) {
    const heroY = altToY(s.alt, L);
    return heroY - (b.ix - s.heroIx) * RISE_PER * L.scale + Math.sin(s.t * 0.9 + b.bob) * 7 * L.scale;
}

// ---------- background ----------

function drawSky(ctx: CanvasRenderingContext2D, pal: SkyPalette, L: Layout, s: SkyHopState) {
    const g = ctx.createLinearGradient(0, 0, 0, L.seaY);
    g.addColorStop(0, pal.top);
    g.addColorStop(0.55, pal.mid);
    g.addColorStop(1, pal.low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.seaY + 1);

    // stars (night only) — fixed field with a whisper of parallax
    if (pal.night) {
        const off = s.camX * 0.04;
        for (let i = 0; i < 90; i++) {
            const x = ((hash(i * 3.1) * L.W * 2 - off) % (L.W * 2) + L.W * 2) % (L.W * 2) - L.W * 0.5;
            const y = hash(i * 7.7) * L.seaY * 0.72;
            const tw = 0.45 + 0.55 * Math.abs(Math.sin(s.t * 1.6 + i));
            ctx.globalAlpha = tw * 0.9;
            ctx.fillStyle = "#ffffff";
            const r = 0.7 + hash(i * 5.3) * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // sun / moon
    const sx = L.W * 0.8;
    const sy = L.seaY * 0.2;
    const sr = 34 * L.scale;
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 4.4);
    glow.addColorStop(0, pal.night ? "rgba(230,240,255,0.35)" : "rgba(255,240,190,0.5)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - sr * 4.4, sy - sr * 4.4, sr * 8.8, sr * 8.8);
    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    if (pal.night) {
        // bite a crescent out of the moon
        ctx.fillStyle = pal.top;
        ctx.beginPath();
        ctx.arc(sx + sr * 0.5, sy - sr * 0.28, sr * 0.92, 0, Math.PI * 2);
        ctx.fill();
    }
}

/** Rolling hill silhouettes. `par` = parallax factor, `band` = height on screen. */
function drawHills(
    ctx: CanvasRenderingContext2D, s: SkyHopState, L: Layout,
    color: string, par: number, band: number, seed: number, alpha: number,
) {
    const off = s.camX * par;
    const gap = 250 * L.scale;
    const i0 = Math.floor((off - L.W) / gap);
    const i1 = Math.ceil((off + L.W * 2) / gap);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-L.W, L.seaY + 2);
    for (let i = i0; i <= i1; i++) {
        const cx = i * gap - off;
        const h = band * (0.5 + hash(i * 1.7 + seed) * 0.85);
        const w = gap * (0.62 + hash(i * 3.3 + seed) * 0.5);
        ctx.lineTo(cx - w / 2, L.seaY + 2);
        ctx.quadraticCurveTo(cx - w * 0.22, L.seaY - h, cx, L.seaY - h * 0.92);
        ctx.quadraticCurveTo(cx + w * 0.26, L.seaY - h * 0.72, cx + w / 2, L.seaY + 2);
    }
    ctx.lineTo(L.W * 2, L.seaY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawCloudShape(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x - r * 1.05, y + r * 0.3, r * 0.68, 0, Math.PI * 2);
    ctx.arc(x + r * 1.0, y + r * 0.26, r * (0.6 + hash(seed) * 0.25), 0, Math.PI * 2);
    ctx.arc(x + r * 0.35, y - r * 0.5, r * (0.5 + hash(seed * 2.1) * 0.3), 0, Math.PI * 2);
    ctx.arc(x - r * 0.45, y - r * 0.42, r * 0.52, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function drawClouds(
    ctx: CanvasRenderingContext2D, s: SkyHopState, L: Layout,
    color: string, par: number, alpha: number, scale: number, seed: number, drift: number,
) {
    const off = s.camX * par + s.t * drift;
    const gap = 420 * L.scale;
    const i0 = Math.floor((off - L.W) / gap);
    const i1 = Math.ceil((off + L.W * 2) / gap);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let i = i0; i <= i1; i++) {
        const x = i * gap - off + hash(i * 2.3 + seed) * gap * 0.6;
        const y = (0.06 + hash(i * 5.1 + seed) * 0.62) * L.seaY;
        const r = (16 + hash(i * 9.7 + seed) * 22) * L.scale * scale;
        drawCloudShape(ctx, x, y, r, i + seed);
    }
    ctx.globalAlpha = 1;
}

function drawSea(ctx: CanvasRenderingContext2D, s: SkyHopState, L: Layout, pal: SkyPalette) {
    const g = ctx.createLinearGradient(0, L.seaY, 0, L.H);
    g.addColorStop(0, pal.sea);
    g.addColorStop(1, pal.seaDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, L.seaY, L.W, L.H - L.seaY);

    // horizon haze
    const hz = ctx.createLinearGradient(0, L.seaY - 26 * L.scale, 0, L.seaY + 6);
    hz.addColorStop(0, "rgba(255,255,255,0)");
    hz.addColorStop(1, pal.night ? "rgba(180,205,235,0.35)" : "rgba(255,255,255,0.5)");
    ctx.fillStyle = hz;
    ctx.fillRect(0, L.seaY - 26 * L.scale, L.W, 32 * L.scale);

    // wave bands: each band scrolls at its own speed and wobbles
    const bands = 7;
    for (let b = 0; b < bands; b++) {
        const f = (b + 1) / bands;
        const y = L.seaY + f * f * (L.H - L.seaY) * 1.05;
        const par = 0.25 + f * 0.6;
        const off = (s.camX * par + s.t * (14 + b * 9)) % (L.W + 400);
        ctx.globalAlpha = 0.16 + f * 0.2;
        ctx.strokeStyle = pal.foam;
        ctx.lineWidth = (1 + f * 2.4) * L.scale;
        ctx.beginPath();
        for (let x = -60; x <= L.W + 60; x += 14) {
            const yy = y + Math.sin((x + off) * 0.03 + b) * (2 + f * 4) * L.scale;
            if (x === -60) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
        }
        ctx.stroke();

        // foam dashes
        ctx.globalAlpha = 0.32 * f;
        for (let i = 0; i < 5; i++) {
            const fx = ((i * 331 + b * 97) * 1.7 - off * 1.4) % (L.W + 300) - 100;
            const fw = (26 + hash(i + b * 3) * 40) * L.scale;
            rr(ctx, fx, y + 3 * L.scale, fw, 2.6 * L.scale, 2);
            ctx.fillStyle = pal.foam;
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // glitter path under the sun/moon
    const sx = L.W * 0.8;
    ctx.globalAlpha = pal.night ? 0.3 : 0.42;
    ctx.fillStyle = pal.night ? "#dce8ff" : "#fff6d8";
    for (let i = 0; i < 16; i++) {
        const p = i / 16;
        const y = L.seaY + p * (L.H - L.seaY);
        const w = (10 + hash(i * 4.4) * 46) * (0.4 + p) * L.scale;
        const wob = Math.sin(s.t * 2 + i) * 12 * L.scale;
        rr(ctx, sx - w / 2 + wob, y, w, 2.4 * L.scale * (0.6 + p), 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ---------- checkpoint islands ----------

function drawIslandAt(ctx: CanvasRenderingContext2D, x: number, L: Layout, pal: SkyPalette, stage: number) {
    const k = L.scale;
    const y = L.seaY;
    const w = 190 * k;
    ctx.save();
    ctx.translate(x, y);

    // rock body
    ctx.fillStyle = pal.night ? "#3c4a63" : "#c99a63";
    ctx.beginPath();
    ctx.moveTo(-w / 2, 2);
    ctx.lineTo(-w / 2 + 14 * k, -34 * k);
    ctx.lineTo(w / 2 - 18 * k, -32 * k);
    ctx.lineTo(w / 2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.night ? "#4c5b76" : "#dcb17a";
    rr(ctx, -w / 2 + 10 * k, -40 * k, w - 24 * k, 12 * k, 6 * k);
    ctx.fill();

    // grass cap
    ctx.fillStyle = pal.night ? "#2e6a4a" : "#5cc258";
    rr(ctx, -w / 2 + 4 * k, -48 * k, w - 8 * k, 14 * k, 7 * k);
    ctx.fill();
    ctx.fillStyle = pal.night ? "#3a805a" : "#75d968";
    rr(ctx, -w / 2 + 4 * k, -48 * k, w - 8 * k, 6 * k, 3 * k);
    ctx.fill();

    // a torii gate (ninja island) — mirrors the typing-ninja look
    const tx = 0;
    const ty = -48 * k;
    ctx.fillStyle = pal.night ? "#8d3a3a" : "#d94f3d";
    rr(ctx, tx - 26 * k, ty - 52 * k, 52 * k, 7 * k, 3 * k);
    ctx.fill();
    rr(ctx, tx - 21 * k, ty - 40 * k, 42 * k, 5 * k, 2 * k);
    ctx.fill();
    rr(ctx, tx - 18 * k, ty - 52 * k, 6 * k, 52 * k, 3 * k);
    ctx.fill();
    rr(ctx, tx + 12 * k, ty - 52 * k, 6 * k, 52 * k, 3 * k);
    ctx.fill();

    // palm on the right
    ctx.strokeStyle = pal.night ? "#5a4b33" : "#8a6a3b";
    ctx.lineWidth = 4 * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.28, -46 * k);
    ctx.quadraticCurveTo(w * 0.32, -68 * k, w * 0.26, -84 * k);
    ctx.stroke();
    ctx.fillStyle = pal.night ? "#2f6b48" : "#3fa85a";
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.55;
        ctx.beginPath();
        ctx.moveTo(w * 0.26, -84 * k);
        ctx.quadraticCurveTo(
            w * 0.26 + Math.cos(a) * 30 * k, -84 * k + Math.sin(a) * 30 * k - 8 * k,
            w * 0.26 + Math.cos(a) * 40 * k, -84 * k + Math.sin(a) * 22 * k + 6 * k,
        );
        ctx.quadraticCurveTo(
            w * 0.26 + Math.cos(a) * 22 * k, -84 * k + Math.sin(a) * 18 * k,
            w * 0.26, -84 * k,
        );
        ctx.fill();
    }

    // stage flag
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(13 * k)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.9;
    ctx.fillText(`STAGE ${stage}`, 0, -114 * k);
    ctx.globalAlpha = 1;

    // foam ring
    ctx.fillStyle = pal.foam;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 4 * k, w * 0.62, 7 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ---------- balloons ----------

interface BalloonStyle {
    body: string;
    dark: string;
    light: string;
}

/**
 * One balloon: teardrop envelope + gores + specular + knot + rigging + basket.
 * `r` is the envelope radius; the basket hangs `r*1.9` below the centre.
 */
function drawBalloon(
    ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
    hue: BalloonStyle, opts: { glow?: number; tilt?: number; basket?: boolean; alpha?: number } = {},
) {
    const { glow = 0, tilt = 0, basket = true, alpha = 1 } = opts;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(tilt);

    if (glow > 0) {
        const g = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 2.5);
        g.addColorStop(0, `rgba(255,255,255,${0.5 * glow})`);
        g.addColorStop(0.5, `rgba(255,255,255,${0.16 * glow})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // envelope: circle top, tapering to a nozzle at the bottom
    const bottom = r * 1.32;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 1.02, -r, r * 1.06, r * 0.35, r * 0.2, bottom - r * 0.1);
    ctx.quadraticCurveTo(0, bottom + r * 0.06, -r * 0.2, bottom - r * 0.1);
    ctx.bezierCurveTo(-r * 1.06, r * 0.35, -r * 1.02, -r, 0, -r);
    ctx.closePath();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.5);
    g.addColorStop(0, hue.light);
    g.addColorStop(0.55, hue.body);
    g.addColorStop(1, hue.dark);
    ctx.fillStyle = g;
    ctx.fill();

    // gores
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = hue.dark;
    ctx.globalAlpha = alpha * 0.28;
    ctx.lineWidth = Math.max(1, r * 0.055);
    for (const f of [-0.55, 0, 0.55]) {
        ctx.beginPath();
        ctx.moveTo(r * f * 0.75, -r);
        ctx.quadraticCurveTo(r * f * 1.5, 0, r * f * 0.28, bottom);
        ctx.stroke();
    }
    ctx.restore();

    // specular
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.42, r * 0.2, r * 0.32, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;

    // knot
    ctx.fillStyle = hue.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.16, bottom - r * 0.04);
    ctx.lineTo(r * 0.16, bottom - r * 0.04);
    ctx.lineTo(0, bottom + r * 0.2);
    ctx.closePath();
    ctx.fill();

    if (basket) {
        const by = bottom + r * 0.86;
        // rigging
        ctx.strokeStyle = "rgba(120,86,52,0.9)";
        ctx.lineWidth = Math.max(1, r * 0.05);
        for (const f of [-0.34, -0.12, 0.12, 0.34]) {
            ctx.beginPath();
            ctx.moveTo(f * r * 0.6, bottom + r * 0.1);
            ctx.lineTo(f * r, by);
            ctx.stroke();
        }
        // basket
        ctx.fillStyle = "#b07d45";
        rr(ctx, -r * 0.4, by, r * 0.8, r * 0.42, r * 0.1);
        ctx.fill();
        ctx.fillStyle = "#c9924f";
        rr(ctx, -r * 0.44, by - r * 0.06, r * 0.88, r * 0.14, r * 0.06);
        ctx.fill();
        ctx.strokeStyle = "rgba(122,84,42,0.55)";
        ctx.lineWidth = Math.max(1, r * 0.035);
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, by + r * 0.2);
        ctx.lineTo(r * 0.4, by + r * 0.2);
        ctx.stroke();
    }

    ctx.restore();
}

// ---------- the word label ----------

/**
 * Word label with per-character typing state. Single letters are painted
 * INSIDE the envelope (the classic look); words ride a pill under the basket.
 */
function drawLabel(
    ctx: CanvasRenderingContext2D, cx: number, cy: number, word: string,
    typed: number, L: Layout, opts: { active: boolean; gold: boolean; err: number; dim?: number },
) {
    const k = L.scale;
    const single = word.length === 1;
    const size = single ? 42 * k : (opts.active ? 26 * k : 18 * k);
    ctx.font = `900 ${Math.round(size)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const chars = word.split("");
    const gap = single ? 0 : Math.max(1.5, size * 0.09);
    const widths = chars.map((c) => ctx.measureText(c.toUpperCase()).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
    const shake = opts.err > 0 ? Math.sin(opts.err * 45) * 5 * k * opts.err : 0;
    let x = cx - total / 2 + shake;
    const alpha = opts.dim ?? 1;

    if (!single) {
        // pill behind the word
        const padX = 12 * k;
        const padY = 7 * k;
        ctx.globalAlpha = alpha * (opts.active ? 0.94 : 0.5);
        ctx.fillStyle = opts.active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.7)";
        rr(ctx, cx - total / 2 - padX + shake, cy - size * 0.62 - padY, total + padX * 2, size * 1.24 + padY * 2, (size * 1.24 + padY * 2) / 2);
        ctx.fill();
        if (opts.active) {
            ctx.strokeStyle = opts.gold ? GOLD_HUE.dark : "#1f4b6b";
            ctx.lineWidth = 2.5 * k;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    chars.forEach((c, i) => {
        const w = widths[i];
        const isTyped = i < typed;
        const isCurrent = i === typed && opts.active;
        const ch = c.toUpperCase();

        // highlight box behind the letter we are waiting for (words only — a
        // single letter sits inside the envelope and needs no box)
        if (isCurrent && !single) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = opts.err > 0 ? "#ef4444" : opts.gold ? GOLD_HUE.body : "#fbbf24";
            rr(ctx, x - 4 * k, cy - size * 0.62, w + 8 * k, size * 1.24, 6 * k);
            ctx.fill();
        }

        ctx.globalAlpha = alpha;
        if (single) {
            // big letter painted straight onto the envelope: dark outline first so
            // it stays legible on every balloon hue, then the white face
            ctx.lineJoin = "round";
            ctx.lineWidth = size * 0.17;
            ctx.strokeStyle = "rgba(20,52,79,0.55)";
            ctx.strokeText(ch, x, cy);
            ctx.fillStyle = isTyped ? "#a7f3d0" : opts.err > 0 && opts.active ? "#fecaca" : "#ffffff";
        } else {
            ctx.fillStyle = isTyped
                ? "#10b981"
                : isCurrent
                    ? (opts.err > 0 ? "#ffffff" : "#164e63")
                    : "#334155";
        }
        ctx.fillText(ch, x, cy);
        ctx.globalAlpha = 1;
        x += w + gap;
    });
}

// ---------- the hero ----------

/** A little ninja hanging from the rigging. Angles are radians. */
function drawHero(
    ctx: CanvasRenderingContext2D, x: number, y: number, L: Layout,
    o: { lean: number; hop: number; flail: number; immune: number; t: number },
) {
    const k = L.scale * 1.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.lean);
    if (o.immune > 0) ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(o.t * 18));

    const suit = "#26374f";
    const suitDark = "#1a2739";
    const skin = "#f2c9a0";
    const band = "#10b981";

    // hop tuck: legs pull up and the body curls
    const tuck = Math.sin(o.hop * Math.PI);
    const legSwing = Math.sin(o.t * 6 + o.flail) * 0.25 + tuck * 0.9;

    // arms up to the rigging
    ctx.strokeStyle = suit;
    ctx.lineWidth = 5 * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4 * k, -6 * k);
    ctx.quadraticCurveTo(-9 * k, -16 * k, -6 * k, -26 * k);
    ctx.moveTo(4 * k, -6 * k);
    ctx.quadraticCurveTo(9 * k, -16 * k, 6 * k, -26 * k);
    ctx.stroke();

    // legs
    ctx.strokeStyle = suit;
    ctx.lineWidth = 6 * k;
    ctx.beginPath();
    ctx.moveTo(-3 * k, 8 * k);
    ctx.quadraticCurveTo(
        -5 * k + Math.sin(legSwing) * 8 * k, 16 * k - tuck * 6 * k,
        -4 * k + Math.sin(legSwing) * 14 * k, 24 * k - tuck * 12 * k,
    );
    ctx.moveTo(3 * k, 8 * k);
    ctx.quadraticCurveTo(
        5 * k - Math.sin(legSwing) * 6 * k, 16 * k - tuck * 5 * k,
        4 * k - Math.sin(legSwing) * 12 * k, 25 * k - tuck * 11 * k,
    );
    ctx.stroke();
    // feet
    ctx.fillStyle = suitDark;
    ctx.beginPath();
    ctx.ellipse(-4 * k + Math.sin(legSwing) * 14 * k, 25 * k - tuck * 12 * k, 4 * k, 2.6 * k, 0.2, 0, Math.PI * 2);
    ctx.ellipse(4 * k - Math.sin(legSwing) * 12 * k, 26 * k - tuck * 11 * k, 4 * k, 2.6 * k, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // torso
    ctx.fillStyle = suit;
    rr(ctx, -8 * k, -8 * k, 16 * k, 18 * k, 6 * k);
    ctx.fill();
    // sash
    ctx.fillStyle = band;
    rr(ctx, -8 * k, 2 * k, 16 * k, 4 * k, 2 * k);
    ctx.fill();

    // head
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.arc(0, -17 * k, 9 * k, 0, Math.PI * 2);
    ctx.fill();
    // face slit
    ctx.fillStyle = skin;
    rr(ctx, -7 * k, -20 * k, 14 * k, 7 * k, 3.4 * k);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(-3.2 * k, -16.6 * k, 1.5 * k, 0, Math.PI * 2);
    ctx.arc(3.2 * k, -16.6 * k, 1.5 * k, 0, Math.PI * 2);
    ctx.fill();
    // headband + trailing tails
    ctx.fillStyle = band;
    rr(ctx, -9.5 * k, -23 * k, 19 * k, 4 * k, 2 * k);
    ctx.fill();
    ctx.strokeStyle = band;
    ctx.lineWidth = 3 * k;
    for (const i of [0, 1]) {
        const w = Math.sin(o.t * 7 + i * 1.4) * 4 * k;
        ctx.beginPath();
        ctx.moveTo(-9 * k, -21 * k + i * 3 * k);
        ctx.quadraticCurveTo(-20 * k, -20 * k + w, -30 * k - i * 3 * k, -14 * k + w * 1.6);
        ctx.stroke();
    }

    ctx.restore();
}

// ---------- the crow ----------

function drawCrow(ctx: CanvasRenderingContext2D, x: number, y: number, L: Layout, flap: number, tele: boolean) {
    const k = L.scale * 1.1;
    ctx.save();
    ctx.translate(x, y);
    // face left (it dives in from the right)
    ctx.scale(-1, 1);
    const up = Math.sin(flap * 12);

    ctx.fillStyle = "#1f2733";
    // body
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * k, 8 * k, 0.12, 0, Math.PI * 2);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(-12 * k, -1 * k);
    ctx.lineTo(-27 * k, -6 * k);
    ctx.lineTo(-26 * k, 3 * k);
    ctx.closePath();
    ctx.fill();
    // head + beak
    ctx.beginPath();
    ctx.arc(13 * k, -5 * k, 6.4 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(18 * k, -6 * k);
    ctx.lineTo(29 * k, -3.5 * k);
    ctx.lineTo(18 * k, -1 * k);
    ctx.closePath();
    ctx.fill();
    // eye
    ctx.fillStyle = tele ? "#f87171" : "#e5e7eb";
    ctx.beginPath();
    ctx.arc(14.5 * k, -6.6 * k, 1.9 * k, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.fillStyle = "#2b3646";
    ctx.beginPath();
    ctx.moveTo(-2 * k, -3 * k);
    ctx.quadraticCurveTo(2 * k, -20 * k - up * 12 * k, 20 * k, -24 * k - up * 14 * k);
    ctx.quadraticCurveTo(6 * k, -10 * k - up * 6 * k, 6 * k, -2 * k);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#182029";
    ctx.beginPath();
    ctx.moveTo(-2 * k, 1 * k);
    ctx.quadraticCurveTo(-6 * k, 16 * k + up * 10 * k, 10 * k, 22 * k + up * 12 * k);
    ctx.quadraticCurveTo(2 * k, 8 * k + up * 5 * k, 4 * k, 2 * k);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ---------- particles ----------

/**
 * `layer: "back"` draws the air puffs only — they vent from under the hero, so
 * they belong BEHIND them; everything else (pops, sparkles, feathers, spray)
 * draws in front.
 */
function drawParticles(ctx: CanvasRenderingContext2D, s: SkyHopState, L: Layout, layer: "back" | "front") {
    for (const p of s.particles) {
        if ((p.kind === "puff") !== (layer === "back")) continue;
        const f = p.life / p.ttl;
        const x = screenX(p.wx, s, L);
        if (x < -80 || x > L.W + 80) continue;
        ctx.save();
        ctx.translate(x, p.y);
        switch (p.kind) {
            case "puff":
                ctx.globalAlpha = (1 - f) * 0.55;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 + f * 1.6) * L.scale, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "shard":
                ctx.globalAlpha = 1 - f * f;
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                rr(ctx, -p.size * 0.5 * L.scale, -p.size * 0.22 * L.scale, p.size * L.scale, p.size * 0.44 * L.scale, 2);
                ctx.fill();
                break;
            case "drop":
                ctx.globalAlpha = 1 - f;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 0.5 * L.scale, p.size * 0.75 * L.scale, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "spark": {
                ctx.globalAlpha = 1 - f;
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                const r = p.size * (1 - f * 0.5) * L.scale;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * Math.PI * 2;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    const a2 = a + Math.PI / 4;
                    ctx.lineTo(Math.cos(a2) * r * 0.34, Math.sin(a2) * r * 0.34);
                }
                ctx.closePath();
                ctx.fill();
                break;
            }
            case "feather":
                ctx.globalAlpha = 1 - f;
                ctx.rotate(p.rot + Math.sin(p.life * 8) * 0.5);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * L.scale, p.size * 0.36 * L.scale, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// ---------- overlays ----------

function drawOverlays(ctx: CanvasRenderingContext2D, s: SkyHopState, L: Layout, pal: SkyPalette) {
    // storm rain + lightning
    if (pal.storm) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = "#cfe3ef";
        ctx.lineWidth = 1.4 * L.scale;
        for (let i = 0; i < 70; i++) {
            const x = ((hash(i * 1.3) * L.W * 1.4 + s.t * (520 + hash(i) * 260)) % (L.W * 1.4)) - L.W * 0.2;
            const y = ((hash(i * 4.7) * L.H + s.t * (900 + hash(i * 2) * 400)) % L.H);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 5 * L.scale, y + 16 * L.scale);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (s.lightning > 0) {
            ctx.fillStyle = `rgba(255,255,255,${s.lightning * 0.5})`;
            ctx.fillRect(0, 0, L.W, L.H);
        }
    }

    // danger vignette when the sea is close — edges only, so the sky keeps its
    // colour and the warning reads as a pulse rather than a filter
    const danger = Math.max(0, 1 - s.alt / 0.22);
    if (danger > 0.02) {
        const g = ctx.createRadialGradient(L.W / 2, L.H / 2, L.H * 0.5, L.W / 2, L.H / 2, L.H * 0.95);
        g.addColorStop(0, "rgba(220,38,38,0)");
        g.addColorStop(1, `rgba(200,20,20,${0.42 * danger * (0.65 + 0.35 * Math.sin(s.t * 9))})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L.W, L.H);
    }

    // typo flash
    if (s.redFlash > 0) {
        ctx.fillStyle = `rgba(239,68,68,${s.redFlash * 0.22})`;
        ctx.fillRect(0, 0, L.W, L.H);
    }
    // golden pop flash
    if (s.goldFlash > 0) {
        ctx.fillStyle = `rgba(255,214,80,${s.goldFlash * 0.3})`;
        ctx.fillRect(0, 0, L.W, L.H);
    }

    // wind streaks on a hot streak — kept in the hero's altitude band and faded
    // at both ends so they read as motion, not as scan lines
    if (s.combo >= 20) {
        const p = Math.min(1, (s.combo - 20) / 30);
        const heroY = altToY(s.alt, L);
        for (let i = 0; i < 8; i++) {
            const y = heroY + (hash(i * 8.1) - 0.5) * 300 * L.scale;
            const len = (70 + hash(i) * 130) * L.scale;
            const x = ((hash(i * 2.7) * L.W + s.t * 1500) % (L.W + 320)) - 160;
            const g = ctx.createLinearGradient(x - len, y, x, y);
            g.addColorStop(0, "rgba(255,255,255,0)");
            g.addColorStop(0.5, `rgba(255,255,255,${0.1 + p * 0.16})`);
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.strokeStyle = g;
            ctx.lineWidth = 2.2 * L.scale;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x - len, y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
}

// ---------- main entry ----------

export function draw(ctx: CanvasRenderingContext2D, s: SkyHopState, W: number, H: number) {
    const L = layoutFor(W, H);
    const pal = paletteFor(s.stage);

    ctx.save();
    // camera trauma shake
    if (s.trauma > 0) {
        const m = s.trauma * s.trauma * 9 * L.scale;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    drawSky(ctx, pal, L, s);
    drawHills(ctx, s, L, pal.hillFar, 0.1, 78 * L.scale, 11, 0.55);
    drawClouds(ctx, s, L, pal.cloud, 0.2, 0.5, 0.85, 3, 4);
    drawHills(ctx, s, L, pal.hillNear, 0.2, 52 * L.scale, 71, 0.7);
    drawSea(ctx, s, L, pal);

    // checkpoint islands sit on the horizon line
    for (const isl of s.islands) {
        const x = screenX(isl.ix * SPACING, s, L);
        if (x > -260 && x < L.W + 260) drawIslandAt(ctx, x, L, pal, isl.stage);
    }

    drawClouds(ctx, s, L, pal.cloud, 0.55, 0.72, 1.25, 17, 12);

    const heroY = altToY(s.alt, L);
    const heroX = screenX(s.heroIx * SPACING, s, L);
    drawParticles(ctx, s, L, "back");

    // free balloons drifting away / bursting
    for (const fb of s.freeBalloons) {
        const x = screenX(fb.wx, s, L);
        if (x < -160 || x > L.W + 160) continue;
        const hue = fb.gold ? GOLD_HUE : BALLOON_HUES[fb.hue];
        const f = fb.life / fb.ttl;
        drawBalloon(ctx, x, fb.y, 30 * L.scale * (1 - f * 0.25), hue, {
            tilt: fb.rot, basket: false, alpha: 1 - f * f,
        });
    }

    // the chain — draw far-to-near so the target reads on top
    const chain = [...s.balloons].sort((a, b) => b.ix - a.ix);
    for (const b of chain) {
        const x = screenX(b.ix * SPACING, s, L);
        if (x < -180 || x > L.W + 200) continue;
        const isTarget = b.ix === s.heroIx + 1;
        const isRidden = b.ix === s.heroIx;
        const dist = b.ix - s.heroIx;
        const hue = b.gold ? GOLD_HUE : BALLOON_HUES[b.hue];
        const y = balloonY(b, s, L);
        const r = (isRidden ? 38 : isTarget ? 36 : 30) * L.scale;
        const tilt = Math.sin(s.t * 0.7 + b.bob) * 0.05;
        const glow = isTarget ? 0.85 + 0.15 * Math.sin(s.t * 6) : b.gold ? 0.45 : 0;

        drawBalloon(ctx, x, y, r, hue, {
            glow, tilt, basket: !isRidden,
            alpha: dist > 4 ? 0.55 + (7 - dist) * 0.1 : 1,
        });

        if (isRidden) continue; // the ridden balloon's word is already spent

        // label: single letters inside the envelope, words on a pill below
        const single = b.word.length === 1;
        const labelY = single ? y - r * 0.05 : y + r * 2.4;
        if (dist <= 5) {
            drawLabel(ctx, x, labelY, b.word, isTarget ? s.typed : 0, L, {
                active: isTarget,
                gold: b.gold,
                err: isTarget ? s.errFlash : 0,
                dim: dist <= 2 ? 1 : 0.55,
            });
        }

        // the chevrons that mark the target (straight from the original)
        if (isTarget) {
            const pulse = 3 * Math.sin(s.t * 7) * L.scale;
            ctx.fillStyle = "#a3e635";
            for (const sgn of [-1, 1]) {
                const cx = x + sgn * (r + 16 * L.scale + pulse);
                ctx.beginPath();
                ctx.moveTo(cx + sgn * 7 * L.scale, y);
                ctx.lineTo(cx - sgn * 3 * L.scale, y - 8 * L.scale);
                ctx.lineTo(cx - sgn * 3 * L.scale, y + 8 * L.scale);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // the hero rides under the ridden balloon; the hop arc lifts them
    if (s.phase !== "over") {
        const hop = s.hopT < 1 ? s.hopT : 0;
        const arc = Math.sin(hop * Math.PI) * 34 * L.scale;
        const lean = Math.max(-0.4, Math.min(0.4, -s.sway * 0.5)) + (s.hopT < 1 ? Math.sin(s.hopT * Math.PI) * 0.25 : 0);
        // sinks slowly enough to stay on screen for the whole splash beat
        const sink = s.phase === "splash" ? s.splashT * s.splashT * 60 * L.scale : 0;
        const hy = heroY + HERO_DROP * L.scale - arc + sink;

        // rigging from the hero's hands up to the balloon knot (behind the hero)
        if (s.phase !== "splash") {
            const b = s.balloons.find((bb) => bb.ix === s.heroIx);
            if (b) {
                const by = balloonY(b, s, L) + 38 * 1.42 * L.scale;
                ctx.strokeStyle = "rgba(122,84,42,0.9)";
                ctx.lineWidth = 2.2 * L.scale;
                ctx.lineCap = "round";
                for (const f of [-7, 7]) {
                    ctx.beginPath();
                    ctx.moveTo(heroX + f * L.scale, hy - 28 * L.scale);
                    ctx.quadraticCurveTo(
                        heroX + f * 2.2 * L.scale, (hy + by) / 2,
                        heroX + f * 0.35 * L.scale, by,
                    );
                    ctx.stroke();
                }
            }
        }

        drawHero(ctx, heroX, hy, L, {
            lean, hop, flail: s.combo * 0.3, immune: s.immune, t: s.t,
        });
    }

    if (s.crow) {
        drawCrow(ctx, screenX(s.crow.wx, s, L), s.crow.y, L, s.crow.flap, s.crow.phase === "tele");
    }

    drawParticles(ctx, s, L, "front");
    drawOverlays(ctx, s, L, pal);
    ctx.restore();
}
