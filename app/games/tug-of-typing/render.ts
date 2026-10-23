// =========================================================================
// 🪢 TUG OF TYPING — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it.
//
// Top-down view of a mown grass pitch. Painter order: turf → mown stripes →
// mud → stadium bands → skid marks → chalk lines → rope → the two kids →
// particles → letter tiles + the rival's race bar → overlays.
//
// Everything is procedural (no image assets) and scaled off `Layout.scale`, so
// the pitch composes the same on a phone and on a 4K screen.
// =========================================================================

import { FIELD_Y, GRIP_GAP, LINE_L, LINE_R, RAMP_MAX, type TugState } from "./sim";

// ---------- helpers ----------

/** Deterministic pseudo-random in [0,1) — keeps the turf from shimmering. */
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
    fieldY: number;
    lineL: number;
    lineR: number;
    centerX: number;
    scale: number;
}

export function layoutFor(W: number, H: number): Layout {
    return {
        W, H,
        fieldY: H * FIELD_Y,
        lineL: W * LINE_L,
        lineR: W * LINE_R,
        centerX: W * 0.5,
        scale: Math.max(0.6, Math.min(1.3, Math.min(H / 800, W / 1280))),
    };
}

/** Screen x of the rope's centre marker for the current rope position. */
export function markerX(s: TugState, L: Layout) {
    return L.centerX + s.rope * (L.lineR - L.centerX);
}

export function playerX(s: TugState, L: Layout) {
    return markerX(s, L) + GRIP_GAP * L.W;
}

export function botX(s: TugState, L: Layout) {
    return markerX(s, L) - GRIP_GAP * L.W;
}

// ---------- the pitch ----------

function drawField(ctx: CanvasRenderingContext2D, s: TugState, L: Layout) {
    // base turf + mown stripes
    ctx.fillStyle = "#3f8f38";
    ctx.fillRect(0, 0, L.W, L.H);
    const stripe = 88 * L.scale;
    for (let i = 0; i * stripe < L.W; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#46a03c" : "#3d8a35";
        ctx.fillRect(i * stripe, 0, stripe, L.H);
    }

    // a light grass speckle for texture — kept sparse so the pitch stays calm
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 220; i++) {
        const x = hash(i * 3.7) * L.W;
        const y = hash(i * 8.3) * L.H;
        ctx.fillStyle = hash(i) > 0.5 ? "#8fd97a" : "#2b6d24";
        ctx.fillRect(x, y, 2.5 * L.scale, 5 * L.scale);
    }
    ctx.globalAlpha = 1;

    // churned mud where the fight happens
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = "#6a5231";
    for (let i = 0; i < 18; i++) {
        const x = L.centerX + (hash(i * 5.1) - 0.5) * L.W * 0.45;
        const y = L.fieldY + (hash(i * 9.7) - 0.5) * 160 * L.scale;
        ctx.beginPath();
        ctx.ellipse(x, y, (16 + hash(i) * 30) * L.scale, (7 + hash(i * 2) * 10) * L.scale, hash(i * 3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // stadium framing: darker bands top and bottom with chalk sidelines
    const bandTop = L.H * 0.2;
    const bandBottom = L.H * 0.86;
    ctx.fillStyle = "rgba(12,48,14,0.55)";
    ctx.fillRect(0, 0, L.W, bandTop);
    ctx.fillRect(0, bandBottom, L.W, L.H - bandBottom);
    ctx.fillStyle = "rgba(244,251,242,0.85)";
    ctx.fillRect(0, bandTop - 5 * L.scale, L.W, 5 * L.scale);
    ctx.fillRect(0, bandBottom, L.W, 5 * L.scale);

    // skid marks left by whoever is losing ground
    for (const sk of s.skids) {
        const f = sk.life / sk.ttl;
        ctx.globalAlpha = (1 - f) * 0.35;
        ctx.strokeStyle = "#4a3a22";
        ctx.lineWidth = 5 * L.scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sk.x, sk.y);
        ctx.lineTo(sk.x + (sk.side === "player" ? -sk.len : sk.len) * L.scale, sk.y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // chalk lines: the two boundaries plus the halfway line
    const chalk = (x: number, w: number, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#f4fbf2";
        ctx.fillRect(x - w / 2, 0, w, L.H);
        ctx.globalAlpha = 1;
    };
    chalk(L.centerX, 5 * L.scale, 0.4);
    chalk(L.lineL, 12 * L.scale, 0.85);
    chalk(L.lineR, 12 * L.scale, 0.85);

    // the boundary the rope is closing on lights up
    const glow = (x: number, amount: number, color: string) => {
        if (amount <= 0.5) return;
        ctx.globalAlpha = (amount - 0.5) * 1.6 * (0.6 + 0.4 * Math.sin(s.t * 10));
        ctx.fillStyle = color;
        ctx.fillRect(x - 7 * L.scale, 0, 14 * L.scale, L.H);
        ctx.globalAlpha = 1;
    };
    glow(L.lineL, Math.max(0, -s.rope), "#ef4444");
    glow(L.lineR, Math.max(0, s.rope), "#34d399");
}

// ---------- the rope ----------

function drawRope(ctx: CanvasRenderingContext2D, s: TugState, L: Layout) {
    const y = L.fieldY;
    const x0 = botX(s, L) + 30 * L.scale;
    const x1 = playerX(s, L) - 30 * L.scale;
    const mx = markerX(s, L);
    // a taut rope is straight; a slack one sags and wobbles
    const sag = (1 - s.tension) * 16 * L.scale;
    const wob = Math.sin(s.t * 9) * (1 - s.tension) * 4 * L.scale;

    const ropeY = (x: number) => {
        const t = (x - x0) / Math.max(1, x1 - x0);
        return y + Math.sin(t * Math.PI) * (sag + wob);
    };

    ctx.lineCap = "round";
    // shadow
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 14 * L.scale;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) {
        const yy = ropeY(x) + 6 * L.scale;
        if (x === x0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
    }
    ctx.stroke();

    // core + two braided strands
    ctx.strokeStyle = "#8a5f2b";
    ctx.lineWidth = 13 * L.scale;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) {
        const yy = ropeY(x);
        if (x === x0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    for (const phase of [0, Math.PI]) {
        ctx.strokeStyle = phase === 0 ? "#d6a256" : "#b8853f";
        ctx.lineWidth = 5.5 * L.scale;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 4) {
            const yy = ropeY(x) + Math.sin(x * 0.16 + phase) * 4 * L.scale;
            if (x === x0) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
        }
        ctx.stroke();
    }

    // the centre marker — a diamond flag, as in the original
    const my = ropeY(mx);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(Math.PI / 4 + Math.sin(s.t * 3) * 0.05);
    const r = 15 * L.scale * (1 + s.tension * 0.14);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-r / 2, -r / 2, r, r);
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 2.5 * L.scale;
    ctx.strokeRect(-r / 2, -r / 2, r, r);
    ctx.restore();
}

// ---------- the two kids ----------

interface KidSkin {
    shirt: string;
    shirtDark: string;
    shorts: string;
    hair: string;
    hairDark: string;
    band: string;
    shoe: string;
    ponytail: boolean;
}

const SKIN = "#f2c9a0";
const SKIN_SHADE = "#dfae83";

const PLAYER_SKIN: KidSkin = {
    shirt: "#2f7fd6", shirtDark: "#1f5da1", shorts: "#22405f",
    hair: "#3b2a20", hairDark: "#2a1d16", band: "#7ec8ff", shoe: "#f5f5f5",
    ponytail: false,
};
const BOT_SKIN: KidSkin = {
    shirt: "#e03b3b", shirtDark: "#b12727", shorts: "#5c1f1f",
    hair: "#c96a2a", hairDark: "#a2521d", band: "#ffb4a0", shoe: "#f5f5f5",
    ponytail: true,
};

/**
 * A kid pulling the rope, seen from above and drawn facing LEFT (the rope is
 * at −x); the right-hand puller is mirrored. The pose is laid out along local
 * x from the rope outward:
 *
 *   shoes (−36) → knees (−8) → hips (+9) → shoulders (+24) → head (+46)
 *
 * so the heels brace toward the rope while the body leans away and the arms
 * reach forward to the grip. Human proportions: bare shins and forearms, a
 * team shirt with short sleeves, shorts, sneakers, and a face that screws up
 * under strain. `heave` hauls the body back, `dragged` tips it toward the rope,
 * `dig` is the rival's late-level dig-in.
 */
function drawKid(
    ctx: CanvasRenderingContext2D, x: number, y: number, L: Layout,
    dir: number, skin: KidSkin, o: { heave: number; strain: number; t: number; dragged: number; dig: number },
) {
    const k = L.scale * 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1); // draw facing left, mirror for the right-hand puller

    const haul = o.heave * 9 * k - o.dragged * 7 * k;
    const judder = Math.sin(o.t * 11) * 1.6 * k * (0.25 + o.strain);

    // a red glow under the heels while this puller is digging in
    if (o.dig > 0.02) {
        const g = ctx.createRadialGradient(-20 * k, 0, 2, -20 * k, 0, 60 * k);
        g.addColorStop(0, `rgba(239,68,68,${0.3 * o.dig})`);
        g.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-80 * k, -60 * k, 160 * k, 120 * k);
    }

    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(8 * k + haul * 0.5, 9 * k, 44 * k, 19 * k, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(haul, 0);

    // --- legs: hips back, knees bent, heels planted toward the rope ---
    // splayed wide on purpose: any narrower and they vanish behind the arms
    for (const sgn of [-1, 1]) {
        ctx.strokeStyle = skin.shorts; // thigh in shorts
        ctx.lineWidth = 15 * k;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(9 * k, sgn * 11 * k);
        ctx.lineTo(-8 * k, sgn * (23 * k + judder));
        ctx.stroke();
        ctx.strokeStyle = SKIN; // bare shin
        ctx.lineWidth = 11 * k;
        ctx.beginPath();
        ctx.moveTo(-8 * k, sgn * (23 * k + judder));
        ctx.lineTo(-30 * k, sgn * (22 * k + judder));
        ctx.stroke();
    }
    // sneakers with a team stripe
    for (const sgn of [-1, 1]) {
        ctx.save();
        ctx.translate(-36 * k, sgn * (22 * k + judder));
        ctx.rotate(sgn * 0.35);
        ctx.fillStyle = skin.shoe;
        rr(ctx, -10 * k, -7 * k, 22 * k, 14 * k, 6 * k);
        ctx.fill();
        ctx.fillStyle = skin.shirt;
        rr(ctx, -10 * k, -1.5 * k, 22 * k, 4 * k, 2 * k);
        ctx.fill();
        ctx.restore();
    }

    // --- torso in a team shirt, leaning away from the rope ---
    ctx.save();
    ctx.rotate(-0.12 - o.strain * 0.06);
    ctx.fillStyle = skin.shirt;
    rr(ctx, 2 * k, -18 * k, 32 * k, 36 * k, 14 * k);
    ctx.fill();
    ctx.fillStyle = skin.shirtDark; // side shading, for a little roundness
    rr(ctx, 2 * k, 8 * k, 32 * k, 10 * k, 8 * k);
    ctx.fill();
    ctx.fillStyle = SKIN_SHADE; // neck, bridging collar to skull
    rr(ctx, 28 * k, -9 * k, 14 * k, 18 * k, 6 * k);
    ctx.fill();
    ctx.restore();

    // --- arms: short sleeve, then bare forearm out to the grip ---
    for (const sgn of [-1, 1]) {
        ctx.strokeStyle = skin.shirt;
        ctx.lineWidth = 13 * k;
        ctx.beginPath();
        ctx.moveTo(24 * k, sgn * 13 * k);
        ctx.lineTo(12 * k, sgn * 13 * k);
        ctx.stroke();
        ctx.strokeStyle = SKIN;
        ctx.lineWidth = 10 * k;
        ctx.beginPath();
        ctx.moveTo(13 * k, sgn * 13 * k);
        ctx.quadraticCurveTo(-6 * k, sgn * 9 * k, -32 * k, sgn * 4 * k);
        ctx.stroke();
        ctx.strokeStyle = skin.band; // wristband
        ctx.lineWidth = 10 * k;
        ctx.beginPath();
        ctx.moveTo(-24 * k, sgn * 5.2 * k);
        ctx.lineTo(-28 * k, sgn * 4.6 * k);
        ctx.stroke();
    }
    // fists closed on the rope
    ctx.fillStyle = SKIN;
    for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(-35 * k, sgn * 4 * k, 7 * k, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- head: hair over the back of the skull, face toward the rope ---
    ctx.save();
    ctx.translate(45 * k, 0);
    ctx.rotate(-0.1);

    if (skin.ponytail) {
        const sway = Math.sin(o.t * 6) * 4 * k;
        ctx.strokeStyle = skin.hair;
        ctx.lineWidth = 8 * k;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(14 * k, 0);
        ctx.quadraticCurveTo(30 * k, sway, 40 * k, 8 * k + sway);
        ctx.stroke();
    }

    ctx.fillStyle = SKIN_SHADE; // ears
    for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(-1 * k, sgn * 17.5 * k, 4 * k, 5.5 * k, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = SKIN; // face
    ctx.beginPath();
    ctx.arc(0, 0, 18 * k, 0, Math.PI * 2);
    ctx.fill();
    // hair: a crescent capping the back of the head
    ctx.fillStyle = skin.hair;
    ctx.beginPath();
    ctx.arc(0, 0, 18.5 * k, -Math.PI * 0.52, Math.PI * 0.52);
    ctx.lineTo(5 * k, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.hairDark;
    ctx.beginPath();
    ctx.arc(0, 0, 18.5 * k, -Math.PI * 0.52, -Math.PI * 0.22);
    ctx.lineTo(5 * k, 0);
    ctx.closePath();
    ctx.fill();

    // eyes — brows lower and eyes squeeze shut as the strain rises
    const squint = 1 - Math.min(0.8, o.strain * 0.9);
    for (const sgn of [-1, 1]) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(-7 * k, sgn * 6.5 * k, 4.2 * k, 4.4 * k * squint + 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#26313f";
        ctx.beginPath();
        ctx.ellipse(-8.5 * k, sgn * 6.5 * k, 2.2 * k, 2.4 * k * squint + 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skin.hairDark; // brow
        ctx.lineWidth = 2.2 * k;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-12 * k, sgn * (2 * k + o.strain * 1.8 * k));
        ctx.lineTo(-3 * k, sgn * (10 * k - o.strain * 1.8 * k));
        ctx.stroke();
    }
    ctx.fillStyle = SKIN_SHADE; // nose
    ctx.beginPath();
    ctx.ellipse(-15.5 * k, 0, 3 * k, 3.8 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    // mouth: a small line at rest, an open grimace under load
    if (o.strain > 0.4) {
        ctx.fillStyle = "#7f1d1d";
        ctx.beginPath();
        ctx.ellipse(-11.5 * k, 0, 3.4 * k, 2.8 * k + o.strain * 1.8 * k, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.strokeStyle = "#a1553f";
        ctx.lineWidth = 1.8 * k;
        ctx.beginPath();
        ctx.moveTo(-12 * k, -2.5 * k);
        ctx.lineTo(-12 * k, 2.5 * k);
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
}

// ---------- particles ----------

function drawParticles(ctx: CanvasRenderingContext2D, s: TugState, L: Layout) {
    for (const p of s.particles) {
        const f = p.life / p.ttl;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = 1 - f * f;
        switch (p.kind) {
            case "dust":
                ctx.globalAlpha = (1 - f) * 0.45;
                ctx.fillStyle = "#d9e6c8";
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 + f * 1.5) * L.scale, 0, Math.PI * 2);
                ctx.fill();
                break;
            case "chip":
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                rr(ctx, -p.size * 0.5 * L.scale, -p.size * 0.3 * L.scale, p.size * L.scale, p.size * 0.6 * L.scale, 2);
                ctx.fill();
                break;
            case "sweat":
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 0.6 * L.scale, p.size * L.scale, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// ---------- the word race readout ----------

/**
 * Keycap tiles for the shared word, plus the rival's progress on the SAME word
 * drawn directly underneath — so "am I winning this word?" is one glance.
 */
function drawTiles(ctx: CanvasRenderingContext2D, s: TugState, L: Layout) {
    const k = L.scale;
    const n = s.word.length;
    if (!n) return;

    const maxW = L.W * 0.72;
    let tw = 54 * k;
    let gap = 8 * k;
    if (n * (tw + gap) > maxW) {
        const shrink = maxW / (n * (tw + gap));
        tw *= shrink;
        gap *= shrink;
    }
    const th = tw * 1.2;
    const total = n * tw + (n - 1) * gap;
    const x0 = L.centerX - total / 2;
    const y = L.H * 0.045;

    for (let i = 0; i < n; i++) {
        const x = x0 + i * (tw + gap);
        const isTyped = i < s.typed;
        const isCurrent = i === s.typed;
        const err = isCurrent ? s.errFlash : 0;

        ctx.save();
        ctx.translate(x + tw / 2, y + th / 2);
        if (err > 0) ctx.translate(Math.sin(err * 40) * 5 * k, 0);

        ctx.fillStyle = isTyped
            ? "#34d399"
            : isCurrent
                ? (err > 0 ? "#ef4444" : "#fbbf24")
                : "#ffffff";
        rr(ctx, -tw / 2, -th / 2, tw, th, 8 * k);
        ctx.fill();
        ctx.strokeStyle = "#14344f";
        ctx.lineWidth = 3 * k;
        ctx.stroke();
        ctx.fillStyle = "rgba(20,52,79,0.18)";
        rr(ctx, -tw / 2, th / 2 - 6 * k, tw, 6 * k, 4 * k);
        ctx.fill();

        ctx.fillStyle = "#0f2c44";
        ctx.font = `900 ${Math.round(th * 0.55)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.word[i].toUpperCase(), 0, 1 * k);
        ctx.restore();
    }

    // ---- the rival's progress on the same word, aligned under the tiles ----
    const barY = y + th + 12 * k;
    const barH = 9 * k;
    rr(ctx, x0, barY, total, barH, barH / 2);
    ctx.fillStyle = "rgba(15,44,68,0.35)";
    ctx.fill();

    const botFrac = Math.max(0, Math.min(1, s.botTyped / n));
    if (botFrac > 0) {
        rr(ctx, x0, barY, Math.max(barH, total * botFrac), barH, barH / 2);
        ctx.fillStyle = "#e03b3b";
        ctx.fill();
    }
    // your own progress as a bright notch, for direct comparison
    const youX = x0 + total * (s.typed / n);
    ctx.fillStyle = "#2f7fd6";
    ctx.beginPath();
    ctx.moveTo(youX, barY - 3 * k);
    ctx.lineTo(youX - 6 * k, barY - 12 * k);
    ctx.lineTo(youX + 6 * k, barY - 12 * k);
    ctx.closePath();
    ctx.fill();

    ctx.font = `900 ${Math.round(11 * k)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("RIVAL", x0 - 12 * k, barY + barH / 2);
}

// ---------- overlays ----------

function drawOverlays(ctx: CanvasRenderingContext2D, s: TugState, L: Layout) {
    if (s.errFlash > 0) {
        ctx.fillStyle = `rgba(239,68,68,${s.errFlash * 0.16})`;
        ctx.fillRect(0, 0, L.W, L.H);
    }
    // vignette — keeps the eye on the middle of the pitch
    const g = ctx.createRadialGradient(L.centerX, L.fieldY, L.H * 0.3, L.centerX, L.fieldY, L.H * 1.05);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,20,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);
}

// ---------- main entry ----------

export function draw(ctx: CanvasRenderingContext2D, s: TugState, W: number, H: number) {
    const L = layoutFor(W, H);

    ctx.save();
    if (s.trauma > 0) {
        const m = s.trauma * s.trauma * 10 * L.scale;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    drawField(ctx, s, L);
    drawRope(ctx, s, L);

    const strain = Math.min(1, s.tension);
    const dig = (s.botRamp - 1) / (RAMP_MAX - 1);
    drawKid(ctx, botX(s, L), L.fieldY, L, -1, BOT_SKIN, {
        heave: s.botHeaveT, strain: Math.min(1, strain + dig * 0.4), t: s.t + 1.7,
        dragged: Math.max(0, s.rope) * 0.8, dig,
    });
    drawKid(ctx, playerX(s, L), L.fieldY, L, 1, PLAYER_SKIN, {
        heave: s.heaveT, strain, t: s.t,
        dragged: Math.max(0, -s.rope) * 0.8, dig: 0,
    });

    drawParticles(ctx, s, L);
    if (s.phase === "pull" || s.phase === "countdown") drawTiles(ctx, s, L);
    drawOverlays(ctx, s, L);
    ctx.restore();
}
