// =========================================================================
// 🐘 BEAM BREAK — the animal painter.
//
// ONE body plan (round body → four legs → tail → head → ears → snout → eyes)
// driven by the knobs on `Species` in `sim.ts`, so ten cute animals cost one
// painter instead of ten. Pure draw code: it reads state, never mutates it —
// same contract as `render.ts`, which is why this file lives beside it and not
// beside the sim.
//
// The pose is expressive but always SMOOTH: legs pedal, ears trail, the body
// stretches toward the beam and the face widens with `panic`. Nothing here
// jitters or shakes — every input is an eased 0..1 channel.
// =========================================================================

import type { Species } from "./sim";

export interface AnimalPose {
    /** 0 = calm on the ground, 1 = terrified at the saucer's mouth. */
    panic: number;
    /**
     * Smoothed vertical velocity, -1..1. Positive = being drawn up the beam
     * (the body stretches), negative = being yanked down (it squashes).
     *
     * This is a CONTINUOUS channel on purpose. Driving the squash off the
     * discrete per-keystroke yank instead made the animal flutter during fast
     * typing — see `GRAB_VIEW_EASE` in `sim.ts`.
     */
    vel: number;
    /** Leg-pedalling phase in radians. */
    kick: number;
    /** 0 = eyes open, 1 = shut. */
    blink: number;
    /** True while the feet are on the ground (legs plant, no pedalling). */
    grounded: boolean;
    /** 0..1 — squashed and stretched into the beam during the abduction. */
    swallow: number;
    /** Wall clock, for idle breathing. */
    t: number;
}

// ---- the shared body plan, in animal units (see `drawAnimal`) ----
// These live here rather than inline because `footOffset()` has to agree with
// `drawAnimal()` exactly, or the animal floats above the sand / sinks into it.
const BODY_W = 1.45; // body ellipse radius x
const BODY_H = 1.25; // body ellipse radius y
const LEG_H = 1.05; // leg length
const HEAD_R = 1.0; // head ellipse radius y

/**
 * Units from the animal's CENTRE down to the soles of its feet. `grabToY()`
 * uses this to stand each species on the ground line exactly.
 */
export function footOffset(sp: Species): number {
    return BODY_H * sp.bodyH * 0.72 + LEG_H * sp.legLen * 0.64 + 0.19;
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

/** Everything the animal is drawn with gets this ink outline — hand-drawn look. */
function ink(ctx: CanvasRenderingContext2D, w: number) {
    ctx.strokeStyle = "rgba(38,32,46,0.82)";
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
}

/**
 * Draw the animal centred on (`x`, `y`). `u` is the unit size: the body is
 * roughly `3.4u` wide, so pass `u = 22 * layoutScale` for a chunky character.
 */
export function drawAnimal(
    ctx: CanvasRenderingContext2D,
    sp: Species,
    x: number,
    y: number,
    u: number,
    pose: AnimalPose,
) {
    const { panic, vel, kick, blink, grounded, swallow, t } = pose;

    // Vertical stretch, driven by the smoothed velocity: rising up the beam pulls
    // the body long, being yanked down squashes it. Both directions are eased, so
    // the animal breathes with the tug of war instead of twitching per keystroke.
    const rising = Math.max(0, vel);
    const falling = Math.max(0, -vel);
    const stretch = 1 + swallow * 0.5 + panic * 0.06 + rising * 0.07 - falling * 0.05;
    const squash = 1 - swallow * 0.22 + falling * 0.05 - rising * 0.03;
    // Idle breathing — a slow, tiny scale wobble, never a position jolt.
    const breathe = 1 + Math.sin(t * 2.1) * 0.014;

    const bw = BODY_W * u * sp.bodyW * squash * breathe;
    const bh = BODY_H * u * sp.bodyH * stretch;
    const headR = HEAD_R * u * sp.headR;
    // The head sits ON TOP of the body with only its chin overlapping, and tips
    // back as the panic rises. Bury it any deeper and every species reads as one
    // grey blob instead of a face.
    const headY = y - bh - headR * 0.55;
    const tilt = -panic * 0.14 - falling * 0.06;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 1.3) * 0.012 + panic * 0.03);
    ctx.translate(-x, -y);

    // ---------- legs (behind the body) ----------
    drawLegs(ctx, sp, x, y, u, bw, bh, kick, grounded, panic);

    // ---------- tail ----------
    drawTail(ctx, sp, x, y, u, bw, bh, t, panic);

    // ---------- body ----------
    ellipse(ctx, x, y, bw, bh);
    const bodyGrad = ctx.createLinearGradient(x - bw, y - bh, x + bw * 0.6, y + bh);
    bodyGrad.addColorStop(0, sp.bodyLight);
    bodyGrad.addColorStop(0.55, sp.body);
    bodyGrad.addColorStop(1, sp.bodyDark);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ink(ctx, u * 0.15);

    // tummy patch
    ellipse(ctx, x + bw * 0.1, y + bh * 0.24, bw * 0.62, bh * 0.58);
    ctx.fillStyle = sp.belly;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    drawPattern(ctx, sp, x, y, u, bw, bh);

    // ---------- head ----------
    ctx.save();
    ctx.translate(x, headY);
    ctx.rotate(tilt);

    drawEars(ctx, sp, headR, u, panic, t);

    ellipse(ctx, 0, 0, headR * 1.06, headR);
    const headGrad = ctx.createLinearGradient(-headR, -headR, headR * 0.5, headR);
    headGrad.addColorStop(0, sp.bodyLight);
    headGrad.addColorStop(0.6, sp.body);
    headGrad.addColorStop(1, sp.bodyDark);
    ctx.fillStyle = headGrad;
    ctx.fill();
    ink(ctx, u * 0.15);

    drawHeadPattern(ctx, sp, headR);
    drawSnout(ctx, sp, headR, u, panic);
    drawEyes(ctx, sp, headR, u, panic, blink);

    ctx.restore();
    ctx.restore();
}

// ---------- parts ----------

function drawLegs(
    ctx: CanvasRenderingContext2D, sp: Species,
    x: number, y: number, u: number, bw: number, bh: number,
    kick: number, grounded: boolean, panic: number,
) {
    const legW = u * 0.42;
    const legH = u * LEG_H * sp.legLen;
    const feetY = y + bh * 0.72;
    // On the ground the legs plant; in the beam they pedal thin air.
    const pairs: Array<[number, number]> = [
        [-bw * 0.52, 0],
        [-bw * 0.16, 1],
        [bw * 0.3, 2],
        [bw * 0.62, 3],
    ];
    ctx.fillStyle = sp.bodyDark;
    for (const [dx, i] of pairs) {
        const swing = grounded ? 0 : Math.sin(kick + i * 1.6) * (0.5 + panic * 0.5);
        ctx.save();
        ctx.translate(x + dx, feetY - legH * 0.3);
        ctx.rotate(swing * 0.55);
        rr(ctx, -legW / 2, 0, legW, legH, legW * 0.5);
        ctx.fillStyle = i % 2 === 0 ? sp.bodyDark : sp.body;
        ctx.fill();
        ink(ctx, u * 0.12);
        // foot
        ellipse(ctx, 0, legH * 0.94, legW * 0.72, legW * 0.46);
        ctx.fillStyle = sp.bodyDark;
        ctx.fill();
        ink(ctx, u * 0.1);
        ctx.restore();
    }
}

function drawTail(
    ctx: CanvasRenderingContext2D, sp: Species,
    x: number, y: number, u: number, bw: number, bh: number,
    t: number, panic: number,
) {
    if (sp.tail === "none") return;
    const bx = x - bw * 0.94;
    const by = y + bh * 0.05;
    const wag = Math.sin(t * 3.2) * (0.18 + panic * 0.3);

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(wag);

    if (sp.tail === "fluff") {
        ellipse(ctx, -u * 0.55, -u * 0.15, u * 0.72, u * 0.6, -0.4);
        ctx.fillStyle = sp.bodyLight;
        ctx.fill();
        ink(ctx, u * 0.13);
        ellipse(ctx, -u * 0.9, -u * 0.35, u * 0.34, u * 0.3, -0.4);
        ctx.fillStyle = sp.belly;
        ctx.fill();
    } else if (sp.tail === "curl") {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-u * 0.7, -u * 0.1, -u * 0.2, -u * 0.75, -u * 0.72, -u * 0.62);
        ctx.strokeStyle = sp.bodyDark;
        ctx.lineWidth = u * 0.24;
        ctx.lineCap = "round";
        ctx.stroke();
    } else if (sp.tail === "stub") {
        ellipse(ctx, -u * 0.22, 0, u * 0.3, u * 0.28);
        ctx.fillStyle = sp.bodyLight;
        ctx.fill();
        ink(ctx, u * 0.11);
    } else {
        // thin, whip-like
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-u * 0.7, -u * 0.2, -u * 1.1, -u * 0.62);
        ctx.strokeStyle = sp.bodyDark;
        ctx.lineWidth = u * 0.17;
        ctx.lineCap = "round";
        ctx.stroke();
        ellipse(ctx, -u * 1.12, -u * 0.66, u * 0.16, u * 0.2);
        ctx.fillStyle = sp.bodyDark;
        ctx.fill();
    }
    ctx.restore();
}

function drawEars(
    ctx: CanvasRenderingContext2D, sp: Species,
    headR: number, u: number, panic: number, t: number,
) {
    const size = sp.earSize;
    // Ears trail upward as the beam pulls — a free, readable panic cue.
    const trail = panic * 0.45 + Math.sin(t * 2.6) * 0.06;

    const one = (side: number) => {
        ctx.save();
        ctx.translate(side * headR * 0.62, -headR * 0.6);
        ctx.rotate(side * (0.35 - trail));

        if (sp.ear === "round") {
            // capped well under the head radius: a koala's ears are big, but if
            // they reach head-size the whole silhouette stops reading as a face
            ellipse(ctx, 0, -headR * 0.1 * size, headR * 0.42 * size, headR * 0.44 * size);
            ctx.fillStyle = sp.body;
            ctx.fill();
            ink(ctx, u * 0.13);
            ellipse(ctx, 0, -headR * 0.08 * size, headR * 0.24 * size, headR * 0.26 * size);
            ctx.fillStyle = sp.belly;
            ctx.fill();
        } else if (sp.ear === "point") {
            ctx.beginPath();
            ctx.moveTo(-headR * 0.34 * size, headR * 0.16);
            ctx.quadraticCurveTo(-headR * 0.1 * size, -headR * 1.1 * size, headR * 0.36 * size, headR * 0.1);
            ctx.closePath();
            ctx.fillStyle = sp.body;
            ctx.fill();
            ink(ctx, u * 0.13);
            ctx.beginPath();
            ctx.moveTo(-headR * 0.16 * size, headR * 0.08);
            ctx.quadraticCurveTo(-headR * 0.04 * size, -headR * 0.68 * size, headR * 0.18 * size, headR * 0.04);
            ctx.closePath();
            ctx.fillStyle = sp.belly;
            ctx.fill();
        } else if (sp.ear === "long") {
            ellipse(ctx, 0, -headR * 0.75 * size, headR * 0.26 * size, headR * 0.9 * size, side * 0.12);
            ctx.fillStyle = sp.body;
            ctx.fill();
            ink(ctx, u * 0.13);
            ellipse(ctx, 0, -headR * 0.78 * size, headR * 0.12 * size, headR * 0.62 * size, side * 0.12);
            ctx.fillStyle = sp.belly;
            ctx.fill();
        } else if (sp.ear === "floppy") {
            ctx.beginPath();
            ctx.moveTo(-headR * 0.3 * size, -headR * 0.1);
            ctx.quadraticCurveTo(headR * 0.1 * size, -headR * 0.75 * size, headR * 0.5 * size, headR * 0.34 * size);
            ctx.quadraticCurveTo(headR * 0.1 * size, headR * 0.26 * size, -headR * 0.3 * size, -headR * 0.1);
            ctx.closePath();
            ctx.fillStyle = sp.bodyLight;
            ctx.fill();
            ink(ctx, u * 0.13);
        } else if (sp.ear === "tuft") {
            ctx.beginPath();
            ctx.moveTo(0, headR * 0.1);
            ctx.quadraticCurveTo(headR * 0.2 * size, -headR * 0.9 * size, headR * 0.44 * size, headR * 0.06);
            ctx.closePath();
            ctx.fillStyle = sp.bodyDark;
            ctx.fill();
        } else {
            // tiny
            ellipse(ctx, 0, 0, headR * 0.26 * size, headR * 0.24 * size);
            ctx.fillStyle = sp.bodyDark;
            ctx.fill();
            ink(ctx, u * 0.1);
        }
        ctx.restore();
    };

    one(-1);
    one(1);
}

function drawSnout(
    ctx: CanvasRenderingContext2D, sp: Species,
    headR: number, u: number, panic: number,
) {
    const sx = headR * 0.66;
    const sy = headR * 0.26;

    if (sp.snout === "trunk") {
        // the trunk curls up when panicked — an elephant's whole personality
        const curl = 0.4 + panic * 0.8;
        ctx.beginPath();
        ctx.moveTo(sx * 0.5, sy - headR * 0.1);
        ctx.bezierCurveTo(
            sx * 1.5, sy + headR * 0.3,
            sx * 1.7, sy + headR * (1.4 - curl * 0.5),
            sx * (0.9 + curl * 0.5), sy + headR * (1.5 - curl),
        );
        ctx.strokeStyle = sp.snoutColor;
        ctx.lineWidth = u * 0.42;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.strokeStyle = "rgba(38,32,46,0.5)";
        ctx.lineWidth = u * 0.06;
        ctx.stroke();
        if (sp.tusks) {
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(sx * 0.34 + side * headR * 0.16, sy + headR * 0.28);
                ctx.quadraticCurveTo(
                    sx * 0.5 + side * headR * 0.22, sy + headR * 0.72,
                    sx * 0.34 + side * headR * 0.3, sy + headR * 0.86,
                );
                ctx.strokeStyle = "#fdf6e6";
                ctx.lineWidth = u * 0.14;
                ctx.stroke();
            }
        }
        return;
    }

    if (sp.snout === "beak") {
        ctx.beginPath();
        ctx.moveTo(headR * 0.36, sy - headR * 0.16);
        ctx.lineTo(headR * 1.24, sy + headR * 0.06);
        ctx.lineTo(headR * 0.36, sy + headR * 0.32);
        ctx.closePath();
        ctx.fillStyle = sp.snoutColor;
        ctx.fill();
        ink(ctx, u * 0.11);
        return;
    }

    if (sp.snout === "wide") {
        ellipse(ctx, headR * 0.62, sy + headR * 0.16, headR * 0.56, headR * 0.42);
        ctx.fillStyle = sp.snoutColor;
        ctx.fill();
        ink(ctx, u * 0.12);
        ctx.fillStyle = "rgba(38,32,46,0.6)";
        for (const dy of [-0.1, 0.24]) {
            ellipse(ctx, headR * (0.5 + dy * 0.6), sy + headR * (0.06 + dy), headR * 0.09, headR * 0.11);
            ctx.fill();
        }
        return;
    }

    if (sp.snout === "muzzle") {
        ellipse(ctx, headR * 0.66, sy + headR * 0.18, headR * 0.46, headR * 0.34);
        ctx.fillStyle = sp.snoutColor;
        ctx.fill();
        ink(ctx, u * 0.11);
        ellipse(ctx, headR * 0.94, sy + headR * 0.1, headR * 0.14, headR * 0.11);
        ctx.fillStyle = "#3a3040";
        ctx.fill();
        return;
    }

    // button nose
    ellipse(ctx, headR * 0.5, sy + headR * 0.08, headR * 0.2, headR * 0.17);
    ctx.fillStyle = sp.snoutColor;
    ctx.fill();
    ink(ctx, u * 0.1);
}

function drawEyes(
    ctx: CanvasRenderingContext2D, sp: Species,
    headR: number, u: number, panic: number, blink: number,
) {
    // Wide-eyed terror is the panic read: the eye grows and the highlight
    // shrinks as the beam wins.
    const r = headR * (0.2 + panic * 0.1);
    const open = 1 - blink;
    const eyes: Array<[number, number]> = [
        [headR * 0.06, -headR * 0.12],
        [headR * 0.52, -headR * 0.16],
    ];

    for (const [ex, ey] of eyes) {
        // white
        ellipse(ctx, ex, ey, r * 1.15, r * 1.15 * Math.max(0.06, open));
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "rgba(38,32,46,0.7)";
        ctx.lineWidth = u * 0.08;
        ctx.stroke();

        if (open > 0.2) {
            // pupil drifts up toward the saucer with the panic
            ellipse(ctx, ex + r * 0.14, ey - panic * r * 0.34, r * 0.58, r * 0.62 * open);
            ctx.fillStyle = "#2b2334";
            ctx.fill();
            ellipse(ctx, ex + r * 0.34, ey - r * 0.36, r * 0.2, r * 0.2 * open);
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fill();
        }
    }

    // brows tilt inward with panic — the difference between "cute" and "help!"
    ctx.strokeStyle = "rgba(38,32,46,0.75)";
    ctx.lineWidth = u * 0.11;
    ctx.lineCap = "round";
    for (const [i, [ex, ey]] of eyes.entries()) {
        const dir = i === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(ex - r * 0.9, ey - r * (1.5 + panic * 0.5) + dir * panic * r * 0.4);
        ctx.lineTo(ex + r * 0.9, ey - r * (1.5 + panic * 0.2) - dir * panic * r * 0.4);
        ctx.stroke();
    }

    // a worried little mouth appears once the panic is real
    if (panic > 0.35 && sp.snout !== "beak" && sp.snout !== "trunk") {
        const a = Math.min(1, (panic - 0.35) / 0.4);
        ctx.globalAlpha = a;
        ellipse(ctx, headR * 0.34, headR * 0.62, headR * 0.16, headR * (0.1 + a * 0.14));
        ctx.fillStyle = "#5b3644";
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawPattern(
    ctx: CanvasRenderingContext2D, sp: Species,
    x: number, y: number, u: number, bw: number, bh: number,
) {
    if (sp.pattern === "none") return;
    ctx.save();
    // clip to the body so patterns never bleed past the silhouette
    ellipse(ctx, x, y, bw, bh);
    ctx.clip();

    if (sp.pattern === "panda") {
        ctx.fillStyle = sp.patternColor;
        ellipse(ctx, x - bw * 0.55, y - bh * 0.1, bw * 0.42, bh * 0.85);
        ctx.fill();
        ellipse(ctx, x + bw * 0.72, y + bh * 0.1, bw * 0.4, bh * 0.8);
        ctx.fill();
    } else if (sp.pattern === "stripes") {
        ctx.strokeStyle = sp.patternColor;
        ctx.lineWidth = u * 0.24;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * bw * 0.34, y - bh);
            ctx.quadraticCurveTo(x + i * bw * 0.34 + bw * 0.1, y, x + i * bw * 0.34, y + bh * 0.2);
            ctx.stroke();
        }
    } else if (sp.pattern === "spots") {
        ctx.fillStyle = sp.patternColor;
        for (let i = 0; i < 7; i++) {
            const a = i * 2.4;
            ellipse(ctx, x + Math.cos(a) * bw * 0.55, y + Math.sin(a) * bh * 0.5, u * 0.2, u * 0.17);
            ctx.fill();
        }
    } else if (sp.pattern === "shell") {
        // a domed shell with plates — turns the round body into a tortoise
        ellipse(ctx, x - bw * 0.05, y - bh * 0.18, bw * 0.95, bh * 0.86);
        ctx.fillStyle = sp.patternColor;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = u * 0.12;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * bw * 0.42, y - bh);
            ctx.lineTo(x + i * bw * 0.42, y + bh * 0.3);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x - bw, y - bh * 0.28);
        ctx.lineTo(x + bw, y - bh * 0.28);
        ctx.stroke();
    } else if (sp.pattern === "tuxedo") {
        ctx.fillStyle = sp.patternColor;
        ellipse(ctx, x + bw * 0.16, y + bh * 0.12, bw * 0.62, bh * 0.78);
        ctx.fill();
    }

    ctx.restore();
}

function drawHeadPattern(ctx: CanvasRenderingContext2D, sp: Species, headR: number) {
    if (sp.pattern === "panda") {
        // the eye patches — the one mark that makes a panda a panda
        ctx.fillStyle = sp.patternColor;
        ellipse(ctx, headR * 0.06, -headR * 0.12, headR * 0.3, headR * 0.34, -0.3);
        ctx.fill();
        ellipse(ctx, headR * 0.54, -headR * 0.16, headR * 0.28, headR * 0.32, 0.3);
        ctx.fill();
    } else if (sp.pattern === "tuxedo") {
        ctx.fillStyle = sp.patternColor;
        ellipse(ctx, headR * 0.28, headR * 0.16, headR * 0.62, headR * 0.5);
        ctx.fill();
    } else if (sp.pattern === "stripes") {
        ctx.strokeStyle = sp.patternColor;
        ctx.lineWidth = headR * 0.12;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-headR * (0.55 - i * 0.12), -headR * (0.72 - i * 0.2));
            ctx.lineTo(-headR * (0.1 - i * 0.05), -headR * (0.5 - i * 0.16));
            ctx.stroke();
        }
    }
}

/**
 * The head-only badge used by the HUD life pips and the game-over card, so the
 * player sees WHICH animal they were saving. Same painter, no body.
 */
export function drawAnimalHead(
    ctx: CanvasRenderingContext2D,
    sp: Species,
    x: number,
    y: number,
    headR: number,
    panic = 0,
) {
    const u = headR;
    ctx.save();
    ctx.translate(x, y);
    drawEars(ctx, sp, headR, u, panic, 0);
    ellipse(ctx, 0, 0, headR * 1.06, headR);
    ctx.fillStyle = sp.body;
    ctx.fill();
    ink(ctx, u * 0.14);
    drawHeadPattern(ctx, sp, headR);
    drawSnout(ctx, sp, headR, u, panic);
    drawEyes(ctx, sp, headR, u, panic, 0);
    ctx.restore();
}
