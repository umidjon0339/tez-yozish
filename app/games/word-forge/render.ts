// =========================================================================
// 🔥 WORD FORGE — all canvas painting. Pure draw functions: they read the
// simulation state and never mutate it.
//
// Painter order (back to front):
//   forge floor → lava seams → lane ticks → gate wall → beams → bot shadows →
//   bots → brute words → shots → particles → turret + fire pit → popups →
//   ‖ the shake ends here ‖ → panel columns → HUD bar → the buffer plate →
//   banner → vignette → flashes
//
// **Only the lane shakes.** `trauma` offsets everything up to the popups and
// nothing after it: the two panel columns are a menu the player is reading
// words off, and a menu that jumps while a tank is hitting the gate is a menu
// you cannot read. That split is the reason the shake is allowed to be strong.
//
// Everything is procedural (no image assets) and scaled off `Layout.scale`.
// Repeating background detail comes from `hash(i)`: deterministic, so it never
// shimmers. NEVER call Math.random() in this file (see CLAUDE.md).
// =========================================================================

import {
    FORGED_AT, MAX_LEVEL,
    costOf, defOf,
    type Bot, type MenuMatch, type PanelDef, type PanelState, type WordForgeState,
} from "./sim";

// ---------- tiny helpers ----------

/** Deterministic pseudo-random in [0,1) — stable detail with no state. */
function hash(n: number): number {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function clamp01(v: number) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeOut(p: number) {
    return 1 - (1 - p) * (1 - p);
}

function roundRect(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

/** Shrink `base` until `text` fits in `maxW`. */
function fitFont(
    ctx: CanvasRenderingContext2D, text: string, maxW: number, base: number, weight = 800,
): number {
    let fs = base;
    for (let i = 0; i < 14; i++) {
        ctx.font = `${weight} ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
        if (ctx.measureText(text).width <= maxW) break;
        fs *= 0.92;
    }
    return fs;
}

// ---------- the palette ----------
const FLOOR_HI = "#342c26";
const FLOOR_LO = "#171310";
const WALL = "#0a0806";
const LAVA = "#ff5a18";
const LAVA_HOT = "#ffcf72";
const AMBER = "#ffb03a";
const STEEL = "#c9ccd4";
const STEEL_DARK = "#6a707c";
const BOT_RED = "#e0503c";
const BOT_DARK = "#7d2d24";
const PERK_A = "#5b4a86";
const PERK_B = "#3a3050";
const PERK_INK = "#e6dcff";
const WEAP_A = "#6b5236";
const WEAP_B = "#3f3123";
const WEAP_INK = "#ffe4bd";
const INK = "#f3ece2";
const GOLD = "#f5c518";
const FROST_BLUE = "#8fd8ff";

// ==========================================
// LAYOUT — the one coordinate mapping
// ==========================================

export interface Layout {
    W: number;
    H: number;
    scale: number;
    /** The fighting lane. */
    laneX0: number;
    laneX1: number;
    laneW: number;
    /** Bots that reach this line hit the gate. */
    gateY: number;
    turretX: number;
    turretY: number;
    /** Panel column geometry. */
    panelW: number;
    panelH: number;
    panelGap: number;
    colBottom: number;
    /** x of the left column's left edge and the right column's left edge. */
    leftColX: number;
    rightColX: number;
    /** How many panels fit in a column before they start overlapping. */
    colSlots: number;
}

/**
 * The screen is three columns: perks | lane | weapons.
 *
 * The two menus sit **hard against the lane** — `PANEL_PAD` is deliberately
 * small. They are read in peripheral vision while your eyes are on a bot
 * walking at you, and a menu parked out by the screen edge is a menu you have
 * to look away to use. Whatever is left over on the outside is the forge hall,
 * which is scenery and does not need to be near anything.
 *
 * The panel width is still chosen first and the lane takes the rest, so the
 * lane grows with the window instead of the margins growing.
 */
const PANEL_PAD = 14; // gap between a column and the lane wall, in layout units

export function layoutFor(W: number, H: number): Layout {
    const scale = Math.max(0.6, Math.min(1.45, Math.min(H, W * 0.62) / 860));

    const pad = PANEL_PAD * scale;
    const outer = 12 * scale; // smallest gap between a column and the screen edge
    let panelW = Math.min(228 * scale, Math.max(126 * scale, W * 0.16));

    const laneW = Math.max(
        190 * scale,
        Math.min(760 * scale, W - 2 * (panelW + pad + outer)),
    );
    const laneX0 = Math.round((W - laneW) / 2);
    const laneX1 = laneX0 + laneW;
    // On a very narrow window the lane floor wins and the panels give way.
    panelW = Math.min(panelW, Math.max(76 * scale, laneX0 - pad - outer));

    const gateY = H - 104 * scale;
    const colSlots = 6;
    const panelGap = 8 * scale;
    const colTop = 26 * scale;
    const colBottom = gateY - 26 * scale;
    const panelH = Math.min(
        54 * scale,
        (colBottom - colTop - panelGap * (colSlots - 1)) / colSlots,
    );

    return {
        W, H, scale,
        laneX0, laneX1, laneW,
        gateY,
        turretX: laneX0 + laneW / 2,
        turretY: gateY + 16 * scale,
        panelW, panelH, panelGap, colBottom,
        leftColX: Math.max(outer, laneX0 - pad - panelW),
        rightColX: Math.min(W - outer - panelW, laneX1 + pad),
        colSlots,
    };
}

/** Where a panel sits. `slot` counts up from the bottom of its column. */
export function panelAnchor(
    L: Layout, kind: PanelDef["kind"], slot: number,
): { x: number; y: number; w: number; h: number } {
    const y = L.colBottom - (slot + 1) * L.panelH - slot * L.panelGap;
    return {
        x: kind === "weapon" ? L.rightColX : L.leftColX,
        y,
        w: L.panelW,
        h: L.panelH,
    };
}

/** Where the turret's barrel ends — shots are born here. */
export function muzzleOf(L: Layout, aim: number): { x: number; y: number } {
    const len = 34 * L.scale;
    return {
        x: L.turretX + Math.sin(aim) * len,
        y: L.turretY - Math.cos(aim) * len,
    };
}

// ==========================================
// THE FORGE FLOOR
// ==========================================

/** Brick, pipes and a hanging lamp behind each menu column. */
function drawHall(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const u = L.scale;
    for (const side of [0, 1]) {
        const x0 = side === 0 ? 0 : L.laneX1 + 26 * u;
        const x1 = side === 0 ? L.laneX0 - 26 * u : L.W;
        const w = x1 - x0;
        if (w < 40 * u) continue;

        // brick courses
        const bh = 26 * u;
        const bw = 62 * u;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, 0, w, L.H);
        ctx.clip();
        for (let r = 0, y = 0; y < L.H; y += bh, r++) {
            const off = (r % 2) * bw * 0.5;
            for (let x = x0 - bw + off; x < x1; x += bw) {
                const n = hash(r * 31.7 + x * 0.13 + side * 7.3);
                ctx.fillStyle = `rgba(${28 + n * 16 | 0},${21 + n * 12 | 0},${18 + n * 10 | 0},1)`;
                ctx.fillRect(x + 1.4 * u, y + 1.4 * u, bw - 2.8 * u, bh - 2.8 * u);
            }
        }

        // two pipes running the height of the hall
        for (const px of [x0 + w * 0.22, x0 + w * 0.78]) {
            const pg = ctx.createLinearGradient(px - 9 * u, 0, px + 9 * u, 0);
            pg.addColorStop(0, "#171210");
            pg.addColorStop(0.4, "#3a2f28");
            pg.addColorStop(1, "#120e0c");
            ctx.fillStyle = pg;
            ctx.fillRect(px - 9 * u, 0, 18 * u, L.H);
            ctx.fillStyle = "#241c17";
            for (let y = 40 * u; y < L.H; y += 150 * u) {
                ctx.fillRect(px - 13 * u, y, 26 * u, 12 * u);
            }
        }

        // a lamp near the top, throwing a cone of warm light down the wall
        const lx = x0 + w * 0.5;
        const ly = 74 * u;
        const flick = 0.82 + 0.18 * Math.abs(Math.sin(s.t * 2.1 + side * 2));
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 190 * u);
        lg.addColorStop(0, `rgba(255,168,72,${0.2 * flick})`);
        lg.addColorStop(1, "rgba(255,150,60,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(x0, 0, w, 300 * u);
        ctx.fillStyle = `rgba(255,206,130,${0.6 * flick})`;
        ctx.beginPath();
        ctx.arc(lx, ly, 5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawFloor(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    // everything outside the lane is the dark forge hall
    ctx.fillStyle = WALL;
    ctx.fillRect(0, 0, L.W, L.H);

    // hall floor, very dark, with a soft glow leaking out of the lane
    const hall = ctx.createLinearGradient(0, 0, 0, L.H);
    hall.addColorStop(0, "#090707");
    hall.addColorStop(1, "#0f0c0a");
    ctx.fillStyle = hall;
    ctx.fillRect(0, 0, L.W, L.H);

    // The forge hall behind the two menus. Without it the outer thirds of a
    // wide screen are flat black and the composition reads as a letterbox; with
    // it the panels look bolted to a wall. Everything here is deterministic and
    // very low contrast — it must never compete with the words in front of it.
    drawHall(ctx, s, L);

    const bleed = ctx.createLinearGradient(L.laneX0 - 90 * L.scale, 0, L.laneX1 + 90 * L.scale, 0);
    bleed.addColorStop(0, "rgba(255,90,24,0)");
    bleed.addColorStop(0.25, "rgba(255,90,24,0.035)");
    bleed.addColorStop(0.75, "rgba(255,90,24,0.035)");
    bleed.addColorStop(1, "rgba(255,90,24,0)");
    ctx.fillStyle = bleed;
    ctx.fillRect(L.laneX0 - 90 * L.scale, 0, L.laneW + 180 * L.scale, L.H);

    // the lane itself: iron plate, lit from the gate end
    const g = ctx.createLinearGradient(0, 0, 0, L.gateY);
    g.addColorStop(0, FLOOR_LO);
    g.addColorStop(0.65, "#241d19");
    g.addColorStop(1, FLOOR_HI);
    ctx.fillStyle = g;
    ctx.fillRect(L.laneX0, 0, L.laneW, L.gateY);

    // plate seams across the lane — the only sense of distance in a top-down
    // view, so they are drawn a touch brighter than realism wants
    const cell = 74 * L.scale;
    ctx.strokeStyle = "rgba(0,0,0,0.42)";
    ctx.lineWidth = Math.max(1, 1.6 * L.scale);
    ctx.beginPath();
    for (let y = cell; y < L.gateY; y += cell) {
        ctx.moveTo(L.laneX0, y);
        ctx.lineTo(L.laneX1, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,190,130,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = cell; y < L.gateY; y += cell) {
        ctx.moveTo(L.laneX0, y + 1.6 * L.scale);
        ctx.lineTo(L.laneX1, y + 1.6 * L.scale);
    }
    ctx.stroke();

    // scattered rivets and scorch marks, deterministic so they never crawl
    for (let i = 0; i < 40; i++) {
        const x = L.laneX0 + hash(i * 3.1) * L.laneW;
        const y = hash(i * 7.7) * L.gateY;
        ctx.fillStyle = i % 4 === 0 ? "rgba(0,0,0,0.3)" : "rgba(255,214,170,0.055)";
        const r = (1.2 + hash(i * 5.3) * 2.2) * L.scale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

/** The molten channels running down both lane walls. They are the light source. */
function drawSeams(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const w = 9 * L.scale;
    for (const [i, x] of [L.laneX0, L.laneX1].entries()) {
        const side = i === 0 ? -1 : 1;
        // glow spilling onto the floor
        const gl = ctx.createLinearGradient(x - 44 * L.scale, 0, x + 44 * L.scale, 0);
        gl.addColorStop(0, "rgba(255,90,24,0)");
        gl.addColorStop(0.5, "rgba(255,120,40,0.19)");
        gl.addColorStop(1, "rgba(255,90,24,0)");
        ctx.fillStyle = gl;
        ctx.fillRect(x - 44 * L.scale, 0, 88 * L.scale, L.gateY);

        // the channel — a slow molten crawl, drawn as bright/dark bands
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - w / 2, 0, w, L.gateY);
        ctx.clip();
        ctx.fillStyle = "#3a1004";
        ctx.fillRect(x - w / 2, 0, w, L.gateY);
        const band = 40 * L.scale;
        const crawl = (s.t * 26 * L.scale) % band;
        for (let y = -band + crawl; y < L.gateY; y += band) {
            const k = 0.45 + 0.55 * Math.abs(Math.sin((y / band) * 1.7 + s.t * 0.5));
            const bg = ctx.createLinearGradient(0, y, 0, y + band);
            bg.addColorStop(0, `rgba(255,90,24,${0.35 * k})`);
            bg.addColorStop(0.5, `rgba(255,180,80,${0.95 * k})`);
            bg.addColorStop(1, `rgba(255,90,24,${0.35 * k})`);
            ctx.fillStyle = bg;
            ctx.fillRect(x - w / 2, y, w, band);
        }
        ctx.restore();

        // the raised rail either side of the channel
        ctx.fillStyle = "#241b16";
        ctx.fillRect(x + side * (w / 2), 0, side * 5 * L.scale, L.gateY);
        ctx.fillStyle = "rgba(255,200,150,0.14)";
        ctx.fillRect(x - w / 2 - 1.5 * L.scale, 0, 1.5 * L.scale, L.gateY);
        ctx.fillRect(x + w / 2, 0, 1.5 * L.scale, L.gateY);
    }
}

/** Faint chevrons pointing at the gate, so "down" reads as "toward you". */
function drawLaneTicks(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const cell = 148 * L.scale;
    const drift = (s.t * 12 * L.scale) % cell;
    ctx.save();
    ctx.strokeStyle = "rgba(255,180,120,0.06)";
    ctx.lineWidth = 3 * L.scale;
    ctx.lineCap = "round";
    const cx = L.turretX;
    const half = L.laneW * 0.26;
    for (let y = -cell + drift; y < L.gateY; y += cell) {
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx, y + 22 * L.scale);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
    }
    ctx.restore();
}

// ==========================================
// THE GATE
// ==========================================

function drawGate(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const y = L.gateY;
    const h = L.H - y;
    const frac = clamp01(s.gate / s.gateMax);

    // the wall body
    const g = ctx.createLinearGradient(0, y, 0, L.H);
    g.addColorStop(0, "#4a3d34");
    g.addColorStop(0.16, "#2c241e");
    g.addColorStop(1, "#171210");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, L.W, h);

    // battlements along the top edge, only across the lane
    const cw = 26 * L.scale;
    ctx.fillStyle = "#584838";
    for (let x = L.laneX0; x < L.laneX1 - cw * 0.5; x += cw * 2) {
        ctx.fillRect(x, y - 8 * L.scale, cw, 9 * L.scale);
    }

    // the damage line: a hot crack that opens as the gate is worn down
    const hurt = 1 - frac;
    if (hurt > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.85, hurt * 1.1);
        ctx.strokeStyle = LAVA;
        ctx.shadowColor = LAVA;
        ctx.shadowBlur = 16 * L.scale;
        ctx.lineWidth = (1 + hurt * 3) * L.scale;
        ctx.beginPath();
        let cx = L.laneX0;
        ctx.moveTo(cx, y + 3 * L.scale);
        while (cx < L.laneX1) {
            const step = 22 * L.scale;
            cx += step;
            ctx.lineTo(cx, y + (3 + hash(Math.floor(cx / step)) * 9 * hurt) * L.scale);
        }
        ctx.stroke();
        ctx.restore();
    }

    // the top highlight
    ctx.fillStyle = "rgba(255,214,170,0.16)";
    ctx.fillRect(0, y, L.W, 2 * L.scale);
}

// ==========================================
// THE TURRET
// ==========================================

/**
 * The turret, seen from above: a bolted base plate, a swinging barrel and the
 * fire pit behind it. The pit is the heat meter — it is drawn as a real fire
 * whose size, brightness and ember count all follow `heatView`, so how hard the
 * forge is running is readable without a bar anywhere on the screen.
 */
export function drawTurret(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const u = L.scale;
    const x = L.turretX;
    const y = L.turretY;
    const heat = s.heatView;
    const forged = s.heat >= FORGED_AT;

    // ---- fire pit ----
    const pitR = (26 + heat * 16) * u;
    const flick = 0.85 + 0.15 * Math.sin(s.t * 13) + 0.08 * Math.sin(s.t * 27.3);
    const glowR = pitR * 2.6 * flick;
    const fg = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    const core = forged ? "rgba(255,246,200," : "rgba(255,150,50,";
    fg.addColorStop(0, `${core}${0.5 + heat * 0.45})`);
    fg.addColorStop(0.4, `rgba(255,110,30,${0.22 + heat * 0.3})`);
    fg.addColorStop(1, "rgba(255,90,24,0)");
    ctx.fillStyle = fg;
    // Filled as a disc, not a rect: on the menu badge the canvas is transparent
    // and a rect would paint a visible orange square around the turret.
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, pitR, 0, Math.PI * 2);
    ctx.fillStyle = "#2a1108";
    ctx.fill();
    // coals: a fixed ring of lumps that brighten with heat
    for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + hash(i) * 0.6;
        const rr = pitR * (0.24 + hash(i * 2.7) * 0.6);
        const k = 0.35 + 0.65 * Math.abs(Math.sin(s.t * (2 + hash(i * 3.3) * 3) + i));
        ctx.globalAlpha = (0.35 + heat * 0.65) * k;
        ctx.fillStyle = forged ? LAVA_HOT : i % 3 === 0 ? "#ffd08a" : LAVA;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, (2.4 + hash(i * 5.1) * 3.4) * u, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // ---- base plate ----
    const baseR = 22 * u;
    ctx.save();
    ctx.translate(x, y - 2 * u);
    const bg = ctx.createLinearGradient(0, -baseR, 0, baseR);
    bg.addColorStop(0, "#9aa1ad");
    bg.addColorStop(0.5, "#6f7681");
    bg.addColorStop(1, "#454b55");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, baseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2c3038";
    ctx.lineWidth = 2 * u;
    ctx.stroke();
    // bolts
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        ctx.fillStyle = "#3a3f48";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * baseR * 0.72, Math.sin(a) * baseR * 0.72, 2.2 * u, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // ---- the barrel ----
    const recoil = s.recoil * 7 * u;
    ctx.save();
    ctx.translate(x, y - 2 * u);
    ctx.rotate(s.aim);
    ctx.translate(0, recoil);

    const heavy = s.equipped === "cannon" || s.equipped === "sniper";
    const bw = (heavy ? 11 : 7.5) * u;
    const bl = (heavy ? 40 : 34) * u;

    // housing
    ctx.fillStyle = STEEL_DARK;
    roundRect(ctx, -13 * u, -8 * u, 26 * u, 20 * u, 5 * u);
    ctx.fill();
    ctx.fillStyle = STEEL;
    roundRect(ctx, -11 * u, -6 * u, 22 * u, 14 * u, 4 * u);
    ctx.fill();

    // barrel
    const barrel = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    barrel.addColorStop(0, "#8d939d");
    barrel.addColorStop(0.4, "#e2e6ec");
    barrel.addColorStop(1, "#5b616b");
    ctx.fillStyle = barrel;
    roundRect(ctx, -bw / 2, -bl, bw, bl + 4 * u, bw * 0.35);
    ctx.fill();
    // muzzle band
    ctx.fillStyle = forged ? GOLD : "#3d424b";
    ctx.fillRect(-bw * 0.72, -bl, bw * 1.44, 5 * u);

    // muzzle flash
    if (s.recoil > 0.12) {
        const f = s.recoil;
        ctx.globalAlpha = f;
        ctx.fillStyle = forged ? "#fff3c4" : "#ffe0a0";
        ctx.beginPath();
        ctx.moveTo(-bw * 0.9 * f, -bl);
        ctx.lineTo(0, -bl - 24 * u * f);
        ctx.lineTo(bw * 0.9 * f, -bl);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ---- the forged crown ----
    if (forged) {
        const pulse = 0.6 + 0.4 * Math.sin(s.t * 8);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = GOLD;
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = 18 * u;
        ctx.lineWidth = 2.4 * u;
        ctx.beginPath();
        ctx.arc(x, y - 2 * u, (30 + Math.sin(s.t * 5) * 2) * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ==========================================
// BOTS
// ==========================================

function botShadow(ctx: CanvasRenderingContext2D, b: Bot, scale: number) {
    ctx.globalAlpha = 0.3 * b.born;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(b.x + 3 * scale, b.y + 5 * scale, b.r * 1.02, b.r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/**
 * One scrap-bot, seen from above. Four silhouettes off one painter — a kid has
 * to tell "fast and weak" from "slow and thick" in peripheral vision, so the
 * shapes differ far more than the colours do.
 */
export function drawBot(ctx: CanvasRenderingContext2D, b: Bot, t: number, scale: number) {
    const r = b.r;
    const dead = b.deadT > 0;
    const step = Math.sin(b.wob) * (b.kind === "runner" ? 3.2 : 1.8) * scale;

    ctx.save();
    ctx.translate(b.x, b.y + (dead ? 0 : step * 0.3));
    ctx.globalAlpha = b.born * (dead ? Math.max(0, 1 - b.deadT * 4) : 1);
    if (dead) ctx.rotate(b.deadT * 3);

    const hot = b.hit;
    const chilled = b.slowT > 0;
    const body = hot > 0.05 ? "#ffffff" : chilled ? "#9dc7d8" : BOT_RED;
    const edge = hot > 0.05 ? "#ffffff" : chilled ? "#5b7e91" : BOT_DARK;

    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4 * scale;
    ctx.strokeStyle = edge;

    if (b.kind === "grunt") {
        // stubby arms, shuffling out of phase with each other
        ctx.strokeStyle = edge;
        ctx.lineCap = "round";
        ctx.lineWidth = 4.2 * scale;
        ctx.beginPath();
        ctx.moveTo(-r * 0.72, -step);
        ctx.lineTo(-r * 1.16, -step * 1.5);
        ctx.moveTo(r * 0.72, step);
        ctx.lineTo(r * 1.16, step * 1.5);
        ctx.stroke();

        ctx.fillStyle = body;
        roundRect(ctx, -r * 0.78, -r * 0.74, r * 1.56, r * 1.48, r * 0.26);
        ctx.fill();
        ctx.lineWidth = 2.6 * scale;
        ctx.strokeStyle = edge;
        ctx.stroke();
        // shoulder blocks, so the silhouette is not a plain brick
        ctx.fillStyle = edge;
        roundRect(ctx, -r * 0.96, -r * 0.42, r * 0.26, r * 0.62, r * 0.1);
        ctx.fill();
        roundRect(ctx, r * 0.7, -r * 0.42, r * 0.26, r * 0.62, r * 0.1);
        ctx.fill();
        // a sunken face plate with two eye lights, facing the gate
        ctx.fillStyle = "rgba(0,0,0,0.34)";
        roundRect(ctx, -r * 0.55, r * 0.02, r * 1.1, r * 0.5, r * 0.14);
        ctx.fill();
        ctx.fillStyle = hot > 0.05 ? "#ffe6bd" : chilled ? "#d7f2ff" : "#ffca6a";
        ctx.beginPath();
        ctx.arc(-r * 0.26, r * 0.27, r * 0.14, 0, Math.PI * 2);
        ctx.arc(r * 0.26, r * 0.27, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        // hatch bolt on top
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.arc(0, -r * 0.4, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
    } else if (b.kind === "runner") {
        // a forward-leaning chevron with motion streaks behind it
        ctx.globalAlpha *= 0.55 * b.born;
        ctx.strokeStyle = chilled ? "#7fb6cc" : "#ff8a72";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        for (let i = 1; i <= 2; i++) {
            ctx.moveTo(-r * 0.7, -r * (0.5 + i * 0.75));
            ctx.lineTo(0, -r * (0.05 + i * 0.75));
            ctx.lineTo(r * 0.7, -r * (0.5 + i * 0.75));
        }
        ctx.stroke();
        ctx.globalAlpha = b.born * (dead ? Math.max(0, 1 - b.deadT * 4) : 1);

        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(0, r * 1.05);
        ctx.lineTo(r * 0.78, -r * 0.35);
        ctx.lineTo(r * 0.34, -r * 0.85);
        ctx.lineTo(-r * 0.34, -r * 0.85);
        ctx.lineTo(-r * 0.78, -r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = hot > 0.05 ? "#ffdca8" : "#ffe07a";
        ctx.beginPath();
        ctx.arc(0, r * 0.36, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
    } else if (b.kind === "tank") {
        // treads either side, then a wide plated slab
        ctx.fillStyle = "#2e211d";
        roundRect(ctx, -r * 1.12, -r * 0.7, r * 0.34, r * 1.4, r * 0.12);
        ctx.fill();
        roundRect(ctx, r * 0.78, -r * 0.7, r * 0.34, r * 1.4, r * 0.12);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,200,160,0.2)";
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const ty = -r * 0.62 + ((i * r * 0.3 + (b.wob * 5 * scale)) % (r * 1.24));
            ctx.moveTo(-r * 1.1, ty);
            ctx.lineTo(-r * 0.8, ty);
            ctx.moveTo(r * 0.8, ty);
            ctx.lineTo(r * 1.1, ty);
        }
        ctx.stroke();

        ctx.fillStyle = body;
        roundRect(ctx, -r * 0.86, -r * 0.78, r * 1.72, r * 1.56, r * 0.18);
        ctx.fill();
        ctx.lineWidth = 2.6 * scale;
        ctx.strokeStyle = edge;
        ctx.stroke();
        // brow plate with a pair of wide-set eyes
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        roundRect(ctx, -r * 0.68, r * 0.1, r * 1.36, r * 0.52, r * 0.12);
        ctx.fill();
        ctx.fillStyle = hot > 0.05 ? "#ffe6bd" : chilled ? "#d7f2ff" : "#ffca6a";
        roundRect(ctx, -r * 0.54, r * 0.26, r * 0.36, r * 0.18, r * 0.09);
        ctx.fill();
        roundRect(ctx, r * 0.18, r * 0.26, r * 0.36, r * 0.18, r * 0.09);
        ctx.fill();
        // rivets down the hull
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.arc(i * r * 0.42, -r * 0.44, r * 0.09, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // brute: a big hexagon with shoulder horns; armour plates while sealed
        ctx.fillStyle = body;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = edge;
        ctx.stroke();

        // horns
        ctx.fillStyle = edge;
        ctx.beginPath();
        ctx.moveTo(-r * 0.86, -r * 0.2);
        ctx.lineTo(-r * 1.5, r * 0.34);
        ctx.lineTo(-r * 0.66, r * 0.44);
        ctx.closePath();
        ctx.moveTo(r * 0.86, -r * 0.2);
        ctx.lineTo(r * 1.5, r * 0.34);
        ctx.lineTo(r * 0.66, r * 0.44);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = hot > 0.05 ? "#fff2d0" : "#ffb03a";
        ctx.beginPath();
        ctx.arc(0, r * 0.3, r * 0.24, 0, Math.PI * 2);
        ctx.fill();

        {
            // a rotating shell of plates that catches the light — a brute is
            // the only bot with one, so the silhouette alone says "long word"
            const spin = t * 0.7;
            ctx.save();
            ctx.rotate(spin);
            ctx.strokeStyle = "#cfd6e0";
            ctx.lineWidth = 5 * scale;
            ctx.lineCap = "butt";
            for (let i = 0; i < 6; i++) {
                const a0 = (i / 6) * Math.PI * 2 + 0.12;
                ctx.beginPath();
                ctx.arc(0, 0, r * 1.2, a0, a0 + 0.78);
                ctx.stroke();
            }
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1.6 * scale;
            for (let i = 0; i < 6; i++) {
                const a0 = (i / 6) * Math.PI * 2 + 0.12;
                ctx.beginPath();
                ctx.arc(0, 0, r * 1.28, a0, a0 + 0.78);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
}

/**
 * A slim HP bar, drawn only once a bot has actually been hurt. It goes UNDER
 * the bot: the word plate lives above every bot's head now, and the two collide
 * there.
 */
function drawBotHp(ctx: CanvasRenderingContext2D, b: Bot, scale: number) {
    const frac = clamp01(b.hp / b.maxHp);
    if (frac >= 0.999 || b.deadT > 0) return;
    const w = b.r * 2;
    const h = 4 * scale;
    const x = b.x - w / 2;
    const y = b.y + b.r + 6 * scale;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = frac > 0.5 ? "#7ed36a" : frac > 0.22 ? AMBER : "#ff5a4a";
    ctx.fillRect(x, y, w * frac, h);
}

/**
 * What a bot is carrying, on a black plate over its head. **Every** bot has
 * one — this is the thing you type, and the game has nothing else to aim at.
 *
 * Same rule as every word label in this project: once you have started typing
 * it, the typed prefix is NOT drawn but its width is still reserved, so the
 * letters you have left never slide sideways under your fingers.
 */
function drawBotWord(
    ctx: CanvasRenderingContext2D, b: Bot, L: Layout, locked: boolean,
) {
    if (b.deadT > 0 || !b.word) return;
    const word = b.word.toUpperCase();
    const fs = (b.kind === "brute" ? 25 : b.kind === "tank" ? 22 : 20) * L.scale;
    ctx.font = `800 ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const full = ctx.measureText(word).width;
    const padX = 9 * L.scale;
    const boxW = full + padX * 2;
    const boxH = fs * 1.5;
    // Keep the plate on screen in both axes. A brute walks in from above the
    // top edge, so its label would spend its first seconds off-screen — and
    // this word is the entire brute mechanic, so it has to be readable from the
    // moment the thing appears. Above the head normally, below it when there is
    // no room, and never past a side wall.
    const above = b.y - b.r - boxH - 20 * L.scale;
    const flipped = above < 6 * L.scale;
    const by = flipped ? b.y + b.r + 20 * L.scale : above;
    const bx = Math.max(
        L.laneX0 + 4 * L.scale,
        Math.min(L.laneX1 - boxW - 4 * L.scale, b.x - boxW / 2),
    );

    ctx.save();
    ctx.globalAlpha = b.born;
    ctx.fillStyle = "#0b0705";
    roundRect(ctx, bx, by, boxW, boxH, 5 * L.scale);
    ctx.fill();
    // a fresh word flashes so a refresh on a tough bot is never a silent swap
    if (b.refresh > 0.02) {
        ctx.globalAlpha = b.born * b.refresh * 0.7;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, bx, by, boxW, boxH, 5 * L.scale);
        ctx.fill();
        ctx.globalAlpha = b.born;
    }
    ctx.strokeStyle = locked ? GOLD : "rgba(255,176,58,0.5)";
    ctx.lineWidth = (locked ? 2.8 : 1.4) * L.scale;
    if (locked) {
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = 16 * L.scale;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const typedW = ctx.measureText(word.slice(0, b.typed)).width;
    ctx.fillStyle = locked ? GOLD : INK;
    ctx.fillText(word.slice(b.typed), bx + padX + typedW, by + boxH / 2 + 1);

    // a little tail pointing at the bot it belongs to, on whichever side it is
    const tailY = flipped ? by + 1 : by + boxH - 1;
    const tip = flipped ? tailY - 8 * L.scale : tailY + 8 * L.scale;
    ctx.fillStyle = "#0b0705";
    ctx.beginPath();
    ctx.moveTo(b.x - 6 * L.scale, tailY);
    ctx.lineTo(b.x + 6 * L.scale, tailY);
    ctx.lineTo(b.x, tip);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ==========================================
// SHOTS, BEAMS, PARTICLES, POPUPS
// ==========================================

function drawShots(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const sh of s.shots) {
        const m = Math.hypot(sh.vx, sh.vy) || 1;
        const ux = sh.vx / m, uy = sh.vy / m;
        const gold = sh.forged;
        if (sh.kind === "orb") {
            const cold = sh.chill > 0;
            const r = sh.r;
            const g = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, r * 2.4);
            g.addColorStop(0, "#ffffff");
            g.addColorStop(0.32, cold ? "#8fd8ff" : gold ? "#ffe9a8" : "#ffb03a");
            g.addColorStop(1, cold ? "rgba(80,160,255,0)" : "rgba(255,120,30,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(sh.x, sh.y, r * 2.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const len = 26 * L.scale + sh.r * 3;
            ctx.strokeStyle = gold ? "rgba(255,225,150,0.55)" : "rgba(255,190,120,0.42)";
            ctx.lineWidth = sh.r * 2.6;
            ctx.beginPath();
            ctx.moveTo(sh.x - ux * len, sh.y - uy * len);
            ctx.lineTo(sh.x, sh.y);
            ctx.stroke();
            ctx.strokeStyle = gold ? "#fff3c4" : "#ffffff";
            ctx.lineWidth = sh.r;
            ctx.beginPath();
            ctx.moveTo(sh.x - ux * len * 0.7, sh.y - uy * len * 0.7);
            ctx.lineTo(sh.x, sh.y);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawBeams(ctx: CanvasRenderingContext2D, s: WordForgeState) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const b of s.beams) {
        const k = 1 - b.life / b.ttl;
        const ex = b.x + Math.sin(b.ang) * b.len;
        const ey = b.y - Math.cos(b.ang) * b.len;
        ctx.globalAlpha = k;
        ctx.strokeStyle = b.forged ? "rgba(255,220,140,0.35)" : "rgba(255,90,120,0.3)";
        ctx.lineWidth = b.w * 3.4 * k;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = b.forged ? "#fff3c4" : "#ffd9e2";
        ctx.lineWidth = b.w * k;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawParticles(ctx: CanvasRenderingContext2D, s: WordForgeState) {
    ctx.save();
    for (const p of s.particles) {
        const k = clamp01(1 - p.life / p.ttl);
        if (p.kind === "smoke") {
            ctx.globalAlpha = k * 0.8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1.4 - k * 0.5), 0, Math.PI * 2);
            ctx.fill();
            continue;
        }
        ctx.globalCompositeOperation = p.kind === "shard" ? "source-over" : "lighter";
        if (p.kind === "ring") {
            const grow = easeOut(p.life / p.ttl);
            ctx.globalAlpha = k * 0.85;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1, 5 * k);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + grow * p.size * 3.4, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.kind === "shard") {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
            ctx.restore();
        } else if (p.kind === "spark") {
            ctx.globalAlpha = k;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * 0.7;
            ctx.lineCap = "round";
            const m = Math.hypot(p.vx, p.vy) || 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - (p.vx / m) * p.size * 4, p.y - (p.vy / m) * p.size * 4);
            ctx.stroke();
        } else {
            ctx.globalAlpha = k;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawPopups(
    ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout, fixed: boolean,
) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of s.popups) {
        if (!!p.fixed !== fixed) continue;
        const k = clamp01(1 - p.life / p.ttl);
        const rise = easeOut(p.life / p.ttl);
        ctx.globalAlpha = Math.min(1, k * 1.8);
        ctx.font = `900 ${p.size * L.scale}px ui-sans-serif, system-ui, sans-serif`;
        ctx.lineWidth = 4 * L.scale;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.lineJoin = "round";
        ctx.strokeText(p.text, p.x, p.y - rise * 34 * L.scale);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y - rise * 34 * L.scale);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
}

// ==========================================
// THE PANEL COLUMNS — the menu you type at
// ==========================================

/**
 * One panel plate.
 *
 * Everything the player needs in order to decide is on it and nothing else:
 * the word, what it costs, how many levels it has, and — while you are typing —
 * how much of it you have already got right. The prefix you have typed is
 * painted as a filled sweep across the plate, so a half-typed word is visible
 * from the corner of your eye.
 */
function drawPanel(
    ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout,
    st: PanelState, m: MenuMatch, buf: string,
) {
    const def = defOf(st.key);
    const a = panelAnchor(L, def.kind, st.slot);
    if (a.y < -a.h) return;

    const isWeapon = def.kind === "weapon";
    const equipped = isWeapon && s.equipped === st.key;
    const cost = costOf(s, st.key);
    const maxed = cost === null;
    const afford = cost !== null && s.scrap >= cost;
    const open = s.mode === "loadout";
    const matched = open && m.panels.includes(st.key);
    const prefix = matched ? buf.length / def.word.length : 0;

    const pop = 1 + st.flash * 0.05;
    const shake = st.deny > 0 ? Math.sin(st.deny * 46) * 4 * L.scale * st.deny : 0;

    ctx.save();
    // Closed, the columns are a reference card you glance at; open, they are
    // what your keys are talking to. The dim is the clearest possible statement
    // of which mode you are in.
    ctx.globalAlpha = open ? 1 : 0.62;
    ctx.translate(a.x + a.w / 2 + shake, a.y + a.h / 2);
    ctx.scale(pop, pop);
    ctx.translate(-a.w / 2, -a.h / 2);

    // drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, 3 * L.scale, 4 * L.scale, a.w, a.h, 6 * L.scale);
    ctx.fill();

    // plate
    const g = ctx.createLinearGradient(0, 0, 0, a.h);
    g.addColorStop(0, isWeapon ? WEAP_A : PERK_A);
    g.addColorStop(1, isWeapon ? WEAP_B : PERK_B);
    ctx.fillStyle = g;
    roundRect(ctx, 0, 0, a.w, a.h, 6 * L.scale);
    ctx.fill();

    // the typed-prefix sweep
    if (prefix > 0) {
        ctx.save();
        roundRect(ctx, 0, 0, a.w, a.h, 6 * L.scale);
        ctx.clip();
        const sweep = ctx.createLinearGradient(0, 0, a.w * Math.min(1, prefix), 0);
        sweep.addColorStop(0, isWeapon ? "rgba(255,176,58,0.5)" : "rgba(185,140,255,0.5)");
        sweep.addColorStop(1, isWeapon ? "rgba(255,214,140,0.75)" : "rgba(220,190,255,0.75)");
        ctx.fillStyle = sweep;
        ctx.fillRect(0, 0, a.w * Math.min(1, prefix), a.h);
        ctx.restore();
    }

    // buy flash
    if (st.flash > 0.01) {
        ctx.save();
        ctx.globalAlpha = st.flash * 0.8;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, 0, 0, a.w, a.h, 6 * L.scale);
        ctx.fill();
        ctx.restore();
    }

    // bevel
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.4 * L.scale;
    roundRect(ctx, 1, 1, a.w - 2, a.h - 2, 6 * L.scale);
    ctx.stroke();

    // border: matched > fresh > equipped > affordable > dim
    let border = "rgba(0,0,0,0.5)";
    let bw = 1.6 * L.scale;
    let glow = 0;
    if (matched) {
        border = "#ffffff"; bw = 3 * L.scale; glow = 16;
    } else if (st.deny > 0.02) {
        border = "#ff5a4a"; bw = 2.6 * L.scale; glow = 10;
    } else if (st.fresh > 0.02) {
        border = GOLD; bw = 2.6 * L.scale; glow = 14 * st.fresh;
    } else if (equipped) {
        border = AMBER; bw = 2.4 * L.scale;
    } else if (afford) {
        border = isWeapon ? "rgba(255,176,58,0.5)" : "rgba(185,140,255,0.55)";
        bw = 1.8 * L.scale;
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = bw;
    if (glow) {
        ctx.shadowColor = border;
        ctx.shadowBlur = glow * L.scale;
    }
    roundRect(ctx, 0, 0, a.w, a.h, 6 * L.scale);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ---- the word ----
    const rightRail = 26 * L.scale; // room for the level number
    // fitFont leaves the chosen size on ctx.font — that is all we need here
    fitFont(ctx, def.word, a.w - 18 * L.scale - rightRail, a.h * 0.5, 900);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const tx = 10 * L.scale;
    const ty = a.h * 0.44;
    const ink = matched ? "#ffffff" : maxed && !isWeapon ? GOLD : isWeapon ? WEAP_INK : PERK_INK;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(def.word, tx + 1.5 * L.scale, ty + 1.5 * L.scale);
    ctx.fillStyle = afford || maxed || matched ? ink : "rgba(255,255,255,0.42)";
    ctx.fillText(def.word, tx, ty);

    // ---- the level, big, at the right edge (the reference's read) ----
    if (!("action" in def && def.action === "repair")) {
        ctx.textAlign = "right";
        ctx.font = `900 ${a.h * 0.34}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = st.level >= MAX_LEVEL ? GOLD : "rgba(255,255,255,0.62)";
        ctx.fillText(String(st.level), a.w - 8 * L.scale, ty);
    }

    // ---- level pips along the bottom ----
    if (!("action" in def && def.action === "repair")) {
        const pw = (a.w - 20 * L.scale - rightRail) / MAX_LEVEL;
        for (let i = 0; i < MAX_LEVEL; i++) {
            ctx.fillStyle = i < st.level
                ? (st.level >= MAX_LEVEL ? GOLD : isWeapon ? AMBER : "#b98cff")
                : "rgba(0,0,0,0.4)";
            ctx.fillRect(
                10 * L.scale + i * pw, a.h - 9 * L.scale,
                pw - 3 * L.scale, 3.4 * L.scale,
            );
        }
    }

    // ---- the cost chip ----
    ctx.textAlign = "right";
    ctx.font = `800 ${Math.max(9, a.h * 0.23)}px ui-sans-serif, system-ui, sans-serif`;
    if (maxed) {
        ctx.fillStyle = GOLD;
        ctx.fillText("MAX", a.w - 8 * L.scale, a.h - 8 * L.scale);
    } else {
        ctx.fillStyle = afford ? "#9ee88a" : "#ff8878";
        ctx.fillText(`${cost}`, a.w - 8 * L.scale, a.h - 8 * L.scale);
        // the scrap glyph
        ctx.beginPath();
        const gx = a.w - 8 * L.scale - ctx.measureText(`${cost}`).width - 8 * L.scale;
        const gy = a.h - 8 * L.scale;
        ctx.moveTo(gx, gy - 3.4 * L.scale);
        ctx.lineTo(gx + 3.4 * L.scale, gy);
        ctx.lineTo(gx, gy + 3.4 * L.scale);
        ctx.lineTo(gx - 3.4 * L.scale, gy);
        ctx.closePath();
        ctx.fill();
    }

    // ---- the equipped marker ----
    if (equipped) {
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        const ax = -7 * L.scale;
        ctx.moveTo(ax, a.h / 2 - 7 * L.scale);
        ctx.lineTo(ax + 8 * L.scale, a.h / 2);
        ctx.lineTo(ax, a.h / 2 + 7 * L.scale);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawPanels(
    ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout, m: MenuMatch,
) {
    const open = s.mode === "loadout";
    // column headers
    ctx.save();
    ctx.font = `800 ${11 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = open ? 1 : 0.55;
    const topPerk = panelAnchor(L, "perk", Math.max(0, s.perkSlots - 1));
    const topWeap = panelAnchor(L, "weapon", Math.max(0, s.weaponSlots - 1));
    if (s.perkSlots) {
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(185,140,255,0.75)";
        ctx.fillText("PERKS", topPerk.x, topPerk.y - 8 * L.scale);
    }
    if (s.weaponSlots) {
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,176,58,0.75)";
        ctx.fillText("WEAPONS", topWeap.x + topWeap.w, topWeap.y - 8 * L.scale);
    }
    ctx.restore();

    for (const p of s.panels) {
        if (!p.unlocked) continue;
        drawPanel(ctx, s, L, p, m, s.buf);
    }
}

// ==========================================
// HUD
// ==========================================

function drawHudBar(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const u = L.scale;
    const barH = 16 * u;
    const y = L.gateY + 14 * u;
    const x0 = L.laneX0;
    const w = L.laneW;
    const frac = clamp01(s.gate / s.gateMax);

    // gate bar
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    roundRect(ctx, x0 - 2 * u, y - 2 * u, w + 4 * u, barH + 4 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = "#2a1a16";
    roundRect(ctx, x0, y, w, barH, 3 * u);
    ctx.fill();
    const bg = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    const low = frac < 0.3;
    bg.addColorStop(0, low ? "#ff4a3a" : "#e0503c");
    bg.addColorStop(1, low ? "#ff8a5a" : "#ff8a72");
    ctx.fillStyle = bg;
    if (low) {
        ctx.shadowColor = "#ff4a3a";
        ctx.shadowBlur = (8 + Math.sin(s.t * 9) * 6) * u;
    }
    roundRect(ctx, x0, y, Math.max(2, w * frac), barH, 3 * u);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `800 ${11 * u}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(`${Math.max(0, Math.ceil(s.gate))} / ${s.gateMax}`, x0 + w / 2, y + barH / 2 + 0.5);

    // scrap, left of the bar
    ctx.textAlign = "right";
    ctx.font = `900 ${17 * u}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = "#9ee88a";
    ctx.fillText(String(Math.floor(s.scrap)), x0 - 12 * u, y + barH / 2);

    // wave, right of the bar
    ctx.textAlign = "left";
    ctx.fillStyle = AMBER;
    ctx.fillText(`W${s.wave}`, x0 + w + 12 * u, y + barH / 2);
}

/**
 * The bar under the gate. It has one job: say, at a glance, **where your keys
 * are going right now**.
 *
 * In FIGHT it is a one-line reminder that keys hit bots and Space opens the
 * menu. In LOADOUT it becomes the menu's own input line — the letters typed in
 * white, the rest of the single matching word ghosted behind them, and a count
 * when more than one still matches. That ghost is not a crutch: it turns
 * "remember the menu" into "read and finish", which is the skill worth training.
 */
function drawBuffer(
    ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout, m: MenuMatch,
    labels: { fight: string; loadout: string; matches: string },
) {
    const u = L.scale;
    const cy = L.H - 30 * u;
    const open = s.mode === "loadout";
    const fs = (open ? 30 : 19) * u;
    ctx.save();
    ctx.font = `900 ${fs}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const typed = open ? s.buf : "";
    const ghost = open && m.ghost ? m.ghost.slice(typed.length) : "";
    const wTyped = ctx.measureText(typed).width;
    const wGhost = ctx.measureText(ghost).width;
    const caretW = 3 * u;

    ctx.font = `700 ${(open ? 15 : 15) * u}px ui-sans-serif, system-ui, sans-serif`;
    const hintW = ctx.measureText(open ? labels.loadout : labels.fight).width;
    ctx.font = `900 ${fs}px ui-sans-serif, system-ui, sans-serif`;

    const total = open
        ? Math.max(300 * u, wTyped + wGhost + caretW + 40 * u)
        : hintW + 40 * u;
    const bx = L.turretX - total / 2;
    const bh = (open ? fs * 1.72 : 38 * u);
    const by = cy - bh / 2;

    // plate — amber and lit when the menu has your keys, quiet when it does not
    ctx.fillStyle = open ? "rgba(30,18,8,0.94)" : "rgba(8,6,5,0.7)";
    roundRect(ctx, bx, by, total, bh, 8 * u);
    ctx.fill();
    const hot = s.bufFlash;
    ctx.strokeStyle = hot > 0.02
        ? `rgba(255,214,140,${0.35 + hot * 0.65})`
        : open
            ? "rgba(255,176,58,0.85)"
            : "rgba(255,255,255,0.1)";
    ctx.lineWidth = (hot > 0.02 || open ? 2.4 : 1.4) * u;
    if (hot > 0.02 || open) {
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = (open ? 12 : 0) * u + 18 * u * hot;
    }
    roundRect(ctx, bx, by, total, bh, 8 * u);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!open) {
        ctx.textAlign = "center";
        ctx.font = `700 ${15 * u}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(labels.fight, L.turretX, cy);
        ctx.restore();
        return;
    }

    const tx = bx + 19 * u;
    if (!typed) {
        ctx.fillStyle = "rgba(255,214,140,0.6)";
        ctx.font = `800 ${15 * u}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillText(labels.loadout, tx, cy);
    } else {
        ctx.font = `900 ${fs}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(typed, tx, cy);
        if (ghost) {
            ctx.fillStyle = "rgba(255,255,255,0.26)";
            ctx.fillText(ghost, tx + wTyped, cy);
        }
        if (Math.sin(s.t * 8) > -0.4) {
            ctx.fillStyle = m.panels.length ? AMBER : "#ff5a4a";
            ctx.fillRect(tx + wTyped, cy - fs * 0.5, caretW, fs);
        }
    }

    // how many things still match, so an ambiguous prefix is never a mystery
    if (typed && m.panels.length > 1) {
        ctx.textAlign = "left";
        ctx.font = `800 ${11 * u}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = "rgba(255,176,58,0.8)";
        ctx.fillText(`${m.panels.length} ${labels.matches}`, bx + total + 12 * u, cy);
    }
    ctx.restore();
}

/** A warm wash over the lane while the menu has your keys. */
function drawLoadoutVeil(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    if (s.mode !== "loadout") return;
    ctx.save();
    ctx.fillStyle = "rgba(20,10,4,0.4)";
    ctx.fillRect(L.laneX0, 0, L.laneW, L.gateY);
    ctx.strokeStyle = `rgba(255,176,58,${0.35 + 0.15 * Math.sin(s.t * 4)})`;
    ctx.lineWidth = 3 * L.scale;
    ctx.strokeRect(L.laneX0 + 1.5 * L.scale, 1.5 * L.scale, L.laneW - 3 * L.scale, L.gateY - 3 * L.scale);
    ctx.restore();
}

// ==========================================
// OVERLAYS
// ==========================================

function drawBanner(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    if (s.bannerT <= 0 || !s.banner) return;
    const p = clamp01(1 - s.bannerT / 2.4);
    const a = Math.min(1, Math.min(p * 6, (1 - p) * 4));
    ctx.save();
    ctx.globalAlpha = clamp01(a);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const y = L.H * 0.3;
    ctx.font = `900 ${52 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
    ctx.lineWidth = 8 * L.scale;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.strokeText(s.banner, L.W / 2, y);
    ctx.fillStyle = AMBER;
    ctx.shadowColor = AMBER;
    ctx.shadowBlur = 26 * L.scale;
    ctx.fillText(s.banner, L.W / 2, y);
    ctx.shadowBlur = 0;
    if (s.bannerSub) {
        ctx.font = `800 ${17 * L.scale}px ui-sans-serif, system-ui, sans-serif`;
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 5 * L.scale;
        ctx.strokeText(s.bannerSub, L.W / 2, y + 42 * L.scale);
        ctx.fillStyle = INK;
        ctx.fillText(s.bannerSub, L.W / 2, y + 42 * L.scale);
    }
    ctx.restore();
}

/** Red closing in from the edges once the gate is nearly down. */
function drawDanger(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    const frac = clamp01(s.gate / s.gateMax);
    if (frac > 0.34) return;
    const k = (0.34 - frac) / 0.34;
    const pulse = 0.65 + 0.35 * Math.sin(s.t * 6);
    const g = ctx.createRadialGradient(
        L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.28,
        L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.72,
    );
    g.addColorStop(0, "rgba(200,20,20,0)");
    g.addColorStop(1, `rgba(200,20,20,${0.5 * k * pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);
}

function drawFlashes(ctx: CanvasRenderingContext2D, s: WordForgeState, L: Layout) {
    if (s.flash > 0.01) {
        ctx.globalAlpha = s.flash * 0.32;
        ctx.fillStyle = "#fff3d0";
        ctx.fillRect(0, 0, L.W, L.H);
    }
    if (s.hurtFlash > 0.01) {
        ctx.globalAlpha = s.hurtFlash * 0.45;
        ctx.fillStyle = "#c81414";
        ctx.fillRect(0, 0, L.W, L.H);
    }
    if (s.goldFlash > 0.01) {
        ctx.globalAlpha = s.goldFlash * 0.3;
        ctx.fillStyle = GOLD;
        ctx.fillRect(0, 0, L.W, L.H);
    }
    ctx.globalAlpha = 1;
}

/** A soft frame vignette — it is what keeps the eye in the lane. */
function drawVignette(ctx: CanvasRenderingContext2D, L: Layout) {
    const g = ctx.createRadialGradient(
        L.W / 2, L.H * 0.52, Math.min(L.W, L.H) * 0.34,
        L.W / 2, L.H * 0.52, Math.max(L.W, L.H) * 0.78,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);
}

// ==========================================
// THE ONE ENTRY POINT
// ==========================================

export function draw(
    ctx: CanvasRenderingContext2D, s: WordForgeState, W: number, H: number,
    m: MenuMatch, labels: { fight: string; loadout: string; matches: string },
) {
    const L = layoutFor(W, H);

    // Only the lane shakes. A menu that jumps cannot be read — see the header.
    const tr = s.trauma * s.trauma;
    const ox = Math.sin(s.t * 46) * 13 * tr * L.scale;
    const oy = Math.cos(s.t * 39) * 10 * tr * L.scale;

    drawFloor(ctx, s, L);

    ctx.save();
    ctx.translate(ox, oy);
    drawSeams(ctx, s, L);
    drawLaneTicks(ctx, s, L);
    drawGate(ctx, s, L);
    drawBeams(ctx, s);

    for (const b of s.bots) botShadow(ctx, b, L.scale);
    for (const b of s.bots) drawBot(ctx, b, s.t, L.scale);
    for (const b of s.bots) drawBotHp(ctx, b, L.scale);
    // words in a second pass, so a bot can never be drawn over another's word
    for (const b of s.bots) drawBotWord(ctx, b, L, b.id === s.locked);

    drawShots(ctx, s, L);
    drawParticles(ctx, s);
    drawTurret(ctx, s, L);
    drawPopups(ctx, s, L, false);
    drawLoadoutVeil(ctx, s, L);
    ctx.restore();

    // steady chrome — panel popups go OVER the plates they are about
    drawPanels(ctx, s, L, m);
    drawPopups(ctx, s, L, true);
    if (s.phase !== "attract") {
        drawHudBar(ctx, s, L);
        drawBuffer(ctx, s, L, m, labels);
    }
    drawBanner(ctx, s, L);
    drawDanger(ctx, s, L);
    drawVignette(ctx, L);
    drawFlashes(ctx, s, L);
}

export { AMBER, GOLD, LAVA, FROST_BLUE, BOT_RED, INK, STEEL };
