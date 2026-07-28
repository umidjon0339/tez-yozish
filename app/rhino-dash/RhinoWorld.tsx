/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
"use client";

// =========================================================================
// 🦏 RHINO DASH — 3D cliff-top typing endurance duel (@react-three/fiber).
// Two rhinos shove head-to-head on a meadow over the ocean. Every correct
// letter adds push force; the rival pushes back non-stop. Typos knock you
// back. Shove the rival past the cliff edge and a NEW, stronger rival with
// longer words walks in — the battle never stops. One life: the moment YOUR
// rhino is thrown into the water the game ends (WPM / accuracy / time).
// Same architecture as typing-ninja: one mutable state object in stateRef,
// simulation in useFrame, React state only for HUD/menus/particle IDs.
// =========================================================================

import React, { useState, useEffect, useRef, useCallback, memo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Mascot } from "@/components/Mascot";
import { Rhino } from "./rhino";
import { CameraRig, SkyDome, SunAndClouds, Ocean, CliffIsland, WORLD, getSoftTexture } from "./environment";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/stats";

// ==========================================
// DIFFICULTY & TUG-OF-WAR TUNING
// ==========================================
// Push model: each correct key adds `pushPerKey` to a force that decays with
// FORCE_TAU. Steady typing at r keys/sec holds ≈ pushPerKey · r · τ against
// the rival's constant `enemyPush` (× round scale). Pools grow with length.
const FORCE_TAU = 0.55;
const MAX_FORCE = 4;
const WORD_LUNGE = 0.3;      // instant shove on completing a word
const MISS_KNOCKBACK = 0.35; // instant loss on a typo
const WAVE_RAMP = 0.15;      // rival strength ramp per defeated rival
const WAVE_RAMP_CAP = 2.4;   // strongest rival = 2.4× the base push
const TIER_EVERY = 2;        // words move to the next (longer) pool every N waves

const EASY_WORDS = [
    "cat", "dog", "sun", "run", "red", "box", "fox", "hat", "map", "pen", "cup", "big", "top", "win", "yes",
    "fun", "jam", "net", "owl", "pig", "ten", "van", "zip", "ant", "bee", "cow", "egg", "ice", "jet", "key",
    "mud", "sit", "wet", "bird", "fish", "frog", "jump", "kick", "lion", "moon", "nest", "park", "rain",
    "shoe", "star", "tree", "wolf", "milk", "cake", "door", "gold", "hand",
];
const MEDIUM_WORDS = [
    "apple", "tiger", "horse", "water", "grass", "stone", "cloud", "river", "happy", "quick", "brown",
    "plant", "sound", "light", "world", "dream", "smile", "house", "bread", "sugar", "charge", "forest",
    "monkey", "rocket", "planet", "silver", "orange", "purple", "window", "garden", "basket", "bridge",
    "castle", "dragon", "island", "jungle", "magnet", "pepper", "rabbit", "spider", "stripe", "temple",
    "turtle", "valley", "wizard", "yellow", "flower", "branch",
];
const HARD_WORDS = [
    "thunder", "mountain", "champion", "strength", "elephant", "stampede", "powerful", "keyboard",
    "treasure", "victory", "journey", "monster", "crystal", "warrior", "charging", "rumbling",
    "gigantic", "fearless", "adventure", "avalanche", "butterfly", "chocolate", "crocodile",
    "dangerous", "dinosaur", "fantastic", "hurricane", "lightning", "wonderful", "waterfall",
    "whirlwind", "challenge", "earthquake", "incredible", "rhinoceros",
];

// Word pools ordered short → long; a run climbs them as waves progress.
const WORD_TIERS = [EASY_WORDS, MEDIUM_WORDS, HARD_WORDS];

const DIFFICULTY_CONFIG = {
    EASY: { enemyPush: 0.42, pushPerKey: 0.62, startTier: 0 },
    MEDIUM: { enemyPush: 0.75, pushPerKey: 0.55, startTier: 1 },
    HARD: { enemyPush: 1.15, pushPerKey: 0.5, startTier: 2 },
};

type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

// --- AUDIO SYNTHESIZER (oscillators only, no files — ninja-style) ---
class SoundSynthesizer {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled = false;
    muted = false;
    bgmTimer: number | null = null;
    nextNoteTime = 0;
    bgmStep = 0;

    init() {
        if (typeof window !== "undefined" && !this.audioCtx) {
            try {
                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                this.audioCtx = new Ctx();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.value = 0.4;
                this.masterGain.connect(this.audioCtx.destination);
                this.enabled = true;
            } catch (e) {
                console.warn("Web Audio API not supported", e);
            }
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === "suspended") this.audioCtx.resume();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.audioCtx.currentTime, 0.05);
        }
        return this.muted;
    }

    private ready() {
        return this.enabled && this.audioCtx && this.masterGain && !this.muted;
    }

    private createNoiseBuffer(duration: number) {
        if (!this.audioCtx) return null;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
    }

    playKeyTap() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
        osc.connect(g).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.015);
    }

    // Heavy hoof stomp — plays on every correct letter, alternating stereo
    playStomp(right: boolean) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(105, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        const pan = ctx.createStereoPanner();
        pan.pan.value = right ? 0.25 : -0.25;
        osc.connect(g).connect(pan).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.09);
        const nb = this.createNoiseBuffer(0.04);
        if (nb) {
            const src = ctx.createBufferSource();
            src.buffer = nb;
            const f = ctx.createBiquadFilter();
            f.type = "lowpass"; f.frequency.value = 500;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.15, t);
            ng.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
            src.connect(f).connect(ng).connect(this.masterGain!);
            src.start(t);
        }
    }

    playTypo() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
        f.type = "lowpass"; f.frequency.value = 400;
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        osc.connect(f).connect(g).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.04);
    }

    // Word complete — whoosh + boom lunge
    playShove() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const nb = this.createNoiseBuffer(0.14);
        if (nb) {
            const src = ctx.createBufferSource();
            src.buffer = nb;
            const f = ctx.createBiquadFilter();
            f.type = "bandpass";
            f.frequency.setValueAtTime(1400, t);
            f.frequency.exponentialRampToValueAtTime(300, t + 0.12);
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.3, t);
            ng.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
            src.connect(f).connect(ng).connect(this.masterGain!);
            src.start(t);
        }
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(g).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.18);
    }

    // Rival rage telegraph — two low horn blasts
    playRageWarn() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        [0, 0.18].forEach((off) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(92, t + off);
            g.gain.setValueAtTime(0.22, t + off);
            g.gain.exponentialRampToValueAtTime(0.01, t + off + 0.14);
            osc.connect(g).connect(this.masterGain!);
            osc.start(t + off); osc.stop(t + off + 0.14);
        });
    }

    playFallWhistle() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.9);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
        osc.connect(g).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.9);
    }

    playSplash() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const nb = this.createNoiseBuffer(0.5);
        if (nb) {
            const src = ctx.createBufferSource();
            src.buffer = nb;
            const f = ctx.createBiquadFilter();
            f.type = "lowpass";
            f.frequency.setValueAtTime(1600, t);
            f.frequency.exponentialRampToValueAtTime(300, t + 0.45);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.4, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            src.connect(f).connect(g).connect(this.masterGain!);
            src.start(t);
        }
        const osc = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(75, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(g2).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.3);
    }

    private arpeggio(freqs: number[], stepDur: number, noteDur: number, gainVal: number) {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, t + i * stepDur);
            g.gain.setValueAtTime(gainVal, t + i * stepDur);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * stepDur + noteDur);
            osc.connect(g).connect(this.masterGain!);
            osc.start(t + i * stepDur); osc.stop(t + i * stepDur + noteDur);
        });
    }

    playRoundStart() { this.arpeggio([392, 523.25], 0.14, 0.25, 0.3); }
    playRoundWin() { this.arpeggio([523.25, 659.25, 783.99], 0.1, 0.3, 0.35); }

    playDefeat() {
        if (!this.ready()) return;
        const ctx = this.audioCtx!, t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(261.63, t);
        osc.frequency.setValueAtTime(220.0, t + 0.1);
        osc.frequency.setValueAtTime(174.61, t + 0.2);
        osc.frequency.setValueAtTime(130.81, t + 0.3);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
        g.gain.setValueAtTime(0.2, t);
        g.gain.setValueAtTime(0.2, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        osc.connect(g).connect(this.masterGain!);
        osc.start(t); osc.stop(t + 0.8);
    }

    // Savanna drum groove — kick / shaker / tom, tempo rises with tension
    startProceduralBGM(getLiveSpeedMultiplier: () => number) {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        this.bgmStep = 0;

        const scheduleNote = () => {
            if (!this.audioCtx || !this.masterGain) return;
            while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
                const nt = this.nextNoteTime;
                const step = this.bgmStep % 4;
                if (!this.muted) {
                    // kick on 0 & 2
                    if (step === 0 || step === 2) {
                        const osc = this.audioCtx.createOscillator();
                        const g = this.audioCtx.createGain();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(130, nt);
                        osc.frequency.exponentialRampToValueAtTime(42, nt + 0.11);
                        g.gain.setValueAtTime(0.16, nt);
                        g.gain.exponentialRampToValueAtTime(0.01, nt + 0.11);
                        osc.connect(g).connect(this.masterGain);
                        osc.start(nt); osc.stop(nt + 0.11);
                    }
                    // tom on 3
                    if (step === 3) {
                        const osc = this.audioCtx.createOscillator();
                        const g = this.audioCtx.createGain();
                        osc.type = "triangle";
                        osc.frequency.setValueAtTime(196, nt);
                        osc.frequency.exponentialRampToValueAtTime(88, nt + 0.1);
                        g.gain.setValueAtTime(0.1, nt);
                        g.gain.exponentialRampToValueAtTime(0.01, nt + 0.1);
                        osc.connect(g).connect(this.masterGain);
                        osc.start(nt); osc.stop(nt + 0.1);
                    }
                    // shaker every step
                    const nb = this.createNoiseBuffer(0.03);
                    if (nb) {
                        const src = this.audioCtx.createBufferSource();
                        src.buffer = nb;
                        const f = this.audioCtx.createBiquadFilter();
                        f.type = "highpass"; f.frequency.value = 6000;
                        const g = this.audioCtx.createGain();
                        g.gain.setValueAtTime(0.05, nt);
                        g.gain.exponentialRampToValueAtTime(0.005, nt + 0.03);
                        src.connect(f).connect(g).connect(this.masterGain);
                        src.start(nt);
                    }
                }
                const mult = getLiveSpeedMultiplier() || 1;
                this.nextNoteTime += 0.42 / mult;
                this.bgmStep++;
            }
            this.bgmTimer = window.setTimeout(scheduleNote, 25) as unknown as number;
        };
        scheduleNote();
    }

    stopProceduralBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
const sfx = new SoundSynthesizer();

// --- STATE ---

type BattlePhase = "idle" | "countdown" | "battle" | "fall" | "roundover";

const getInitialState = () => ({
    phase: "idle" as BattlePhase,
    cfg: DIFFICULTY_CONFIG.MEDIUM as (typeof DIFFICULTY_CONFIG)[Difficulty],
    countdown: 0,
    entry: 0,               // 0→1 walk-in progress during countdown
    pushX: 0,               // contact point; +x = rival losing ground
    pushVel: 0,             // smoothed velocity (drives lean animations)
    playerForce: 0,         // decaying force fed by correct keystrokes
    enemyPushMul: 1,        // round scaling of rival strength
    ragePhase: "idle" as "idle" | "tele" | "shove",
    rageT: 0,
    rageTimer: 6,
    wave: 1,                // which rival you're facing (1-based)
    rivalsDefeated: 0,
    entryFrom: -9.5,        // where the player walks in from on a new wave
    word: "",
    typed: 0,
    stompFlip: false,
    score: 0,
    wordsTyped: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    battleTimeMs: 0,        // WPM clock runs only during 'battle'
    falling: null as null | { who: "player" | "enemy"; x: number; y: number; vx: number; vy: number; rot: number; splashed: boolean },
    fallT: 0,
    victor: null as null | "player" | "enemy",
    particles: [] as any[],
    dustTimer: 0,
    // game-feel channels (written by loop/input, read by visuals)
    lungeCount: 0,
    flinchCount: 0,
    camTrauma: 0,
    camPunch: 0,
    redFlash: 0,
    streak: 0,
    hudTick: 0,
    fxDirty: false,
});

const pickWord = (pool: string[], not: string) => {
    let w = pool[Math.floor(Math.random() * pool.length)];
    if (w === not) w = pool[(pool.indexOf(w) + 1) % pool.length];
    return w;
};

// Words get longer as waves progress: climb one tier every TIER_EVERY waves.
const wordPoolFor = (s: any) =>
    WORD_TIERS[Math.min(WORD_TIERS.length - 1, s.cfg.startTier + Math.floor((s.wave - 1) / TIER_EVERY))];

// --- PARTICLES (dust puffs, sparks, grass clods, splash, +score text) ---

const ParticleNode = ({ pid, stateRef }: any) => {
    const meshRef = useRef<THREE.Group>(null!);
    const matRef = useRef<any>(null!);
    const [init] = useState(() => stateRef.current.particles.find((x: any) => x.id === pid));

    useFrame((_, delta) => {
        const p = stateRef.current.particles.find((x: any) => x.id === pid);
        if (!p || !meshRef.current) return;
        meshRef.current.position.set(p.x, p.y, p.z);
        const frac = Math.max(0, p.life / p.maxLife);
        if (p.kind === "puff") {
            meshRef.current.scale.setScalar((p.size || 0.3) * (1 + (1 - frac) * 1.8));
            if (matRef.current) matRef.current.opacity = frac * 0.55;
        } else if (!p.isText) {
            meshRef.current.rotation.x += (p.rx || 0) * delta;
            meshRef.current.rotation.y += (p.ry || 0) * delta;
            meshRef.current.scale.setScalar(frac);
        }
    });

    if (!init) return null;
    if (init.isText) {
        return (
            <group ref={meshRef}>
                <Html center distanceFactor={10} zIndexRange={[40, 0]}>
                    <div className="text-amber-500 font-black text-2xl drop-shadow-md">+{init.score}</div>
                </Html>
            </group>
        );
    }
    if (init.kind === "puff") {
        return (
            <group ref={meshRef}>
                <sprite>
                    <spriteMaterial ref={matRef} map={getSoftTexture()} color={init.color || "#d8d2c8"} transparent depthWrite={false} opacity={0.5} />
                </sprite>
            </group>
        );
    }
    if (init.kind === "spark") {
        return (
            <group ref={meshRef}>
                <mesh>
                    <octahedronGeometry args={[0.09, 0]} />
                    <meshBasicMaterial color={init.color || "#fbbf24"} />
                </mesh>
            </group>
        );
    }
    return (
        <group ref={meshRef}>
            <mesh>
                <boxGeometry args={[0.14, 0.14, 0.14]} />
                <meshBasicMaterial color={init.color || "#3da33c"} />
            </mesh>
        </group>
    );
};

const spawnImpactBurst = (s: any) => {
    // sparks + grass clods where the horns clash, and the floating score
    for (let i = 0; i < 5; i++) {
        s.particles.push({
            id: Math.random().toString(), kind: "spark",
            x: s.pushX, y: 1.1, z: 0.3,
            vx: (Math.random() - 0.5) * 7, vy: 2 + Math.random() * 5, vz: 1.5 + Math.random() * 3,
            rx: Math.random() * 20, ry: Math.random() * 20, grav: 22,
            life: 0.35, maxLife: 0.35, color: "#fbbf24",
        });
    }
    for (let i = 0; i < 6; i++) {
        s.particles.push({
            id: Math.random().toString(), kind: "debris",
            x: s.pushX + (Math.random() - 0.5), y: 0.2, z: (Math.random() - 0.5) * 1.4,
            vx: (Math.random() - 0.5) * 6, vy: 3 + Math.random() * 5, vz: (Math.random() - 0.5) * 4,
            rx: Math.random() * 12, ry: Math.random() * 12, grav: 16,
            life: 0.8, maxLife: 0.8 + Math.random() * 0.4,
            color: Math.random() > 0.5 ? "#3da33c" : "#7a5b3a",
        });
    }
    s.particles.push({
        id: Math.random().toString(),
        x: s.pushX, y: 1.9, z: 0.6, vx: 0, vy: 1.4, vz: 0,
        life: 0.9, maxLife: 0.9, isText: true, score: s.word.length * 10,
    });
    s.fxDirty = true;
};

const spawnSplash = (s: any, x: number) => {
    for (let i = 0; i < 16; i++) {
        s.particles.push({
            id: Math.random().toString(), kind: "puff",
            x: x + (Math.random() - 0.5) * 1.6, y: WORLD.WATER_Y + 0.2, z: (Math.random() - 0.5) * 1.5,
            vx: (Math.random() - 0.5) * 3, vy: 2.5 + Math.random() * 4, vz: (Math.random() - 0.5) * 2,
            grav: 9, life: 0.9, maxLife: 0.9, size: 0.4 + Math.random() * 0.5,
            color: i % 3 === 0 ? "#ffffff" : "#bfe6fa",
        });
    }
    s.fxDirty = true;
};

// --- GAME LOOP (mounted only while PLAYING) ---

const GameLoop = ({ stateRef, onFallDone, setActiveParticleIds, setHudState }: any) => {
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        const s = stateRef.current;
        let listsChanged = false;

        if (s.phase === "countdown") {
            s.entry = Math.min(1, s.entry + dt / 1.4);
            s.countdown -= dt;
            if (s.countdown <= 0) {
                s.phase = "battle";
                sfx.playRoundStart();
            }
        } else if (s.phase === "battle") {
            s.battleTimeMs += dt * 1000;

            // rival rage cycle: telegraph (backs off) → shove (2.6× push)
            if (s.ragePhase === "idle") {
                s.rageTimer -= dt;
                if (s.rageTimer <= 0) { s.ragePhase = "tele"; s.rageT = 0.8; sfx.playRageWarn(); }
            } else {
                s.rageT -= dt;
                if (s.ragePhase === "tele" && s.rageT <= 0) { s.ragePhase = "shove"; s.rageT = 0.7; s.camTrauma = Math.max(s.camTrauma, 0.35); }
                else if (s.ragePhase === "shove" && s.rageT <= 0) { s.ragePhase = "idle"; s.rageTimer = 6 + Math.random() * 3; }
            }

            let enemyRate = s.cfg.enemyPush * s.enemyPushMul;
            if (s.ragePhase === "tele") enemyRate *= 0.15;
            else if (s.ragePhase === "shove") enemyRate *= 2.6;

            s.playerForce *= Math.exp(-dt / FORCE_TAU);
            const vel = s.playerForce - enemyRate;
            s.pushX += vel * dt;
            s.pushVel += (vel - s.pushVel) * (1 - Math.exp(-8 * dt));

            // scuffle dust at the contact point (bounded)
            s.dustTimer -= dt;
            if (s.dustTimer <= 0 && s.particles.length < 70) {
                s.dustTimer = 0.09;
                s.particles.push({
                    id: Math.random().toString(), kind: "puff",
                    x: s.pushX + (Math.random() - 0.5) * 1.6, y: 0.15, z: 0.4 + (Math.random() - 0.5),
                    vx: (Math.random() - 0.5) * 1.4, vy: 0.6 + Math.random() * 0.7, vz: (Math.random() - 0.5),
                    grav: 0, life: 0.7, maxLife: 0.7, size: 0.3 + Math.random() * 0.35,
                    color: Math.random() > 0.5 ? "#cfc7ba" : "#a8d29b",
                });
                listsChanged = true;
            }

            // cliff edge — someone goes over
            if (s.pushX >= WORLD.FALL_X || s.pushX <= -WORLD.FALL_X) {
                const who = s.pushX >= WORLD.FALL_X ? "enemy" : "player";
                const d = who === "enemy" ? 1 : -1;
                s.victor = who === "enemy" ? "player" : "enemy";
                s.phase = "fall";
                s.fallT = 0;
                s.falling = {
                    who,
                    x: s.pushX + d * WORLD.RHINO_GAP,
                    y: 0, vx: d * 3.2, vy: 2.6, rot: 0, splashed: false,
                };
                s.camTrauma = Math.max(s.camTrauma, 0.6);
                sfx.playFallWhistle();
            }
        } else if (s.phase === "fall" && s.falling) {
            const f = s.falling;
            f.vy -= 11 * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.rot += 3.2 * dt;
            if (!f.splashed && f.y < WORLD.WATER_Y + 0.4) {
                f.splashed = true;
                spawnSplash(s, f.x);
                listsChanged = true;
                sfx.playSplash();
                if (s.victor === "player") sfx.playRoundWin();
            }
            s.fallT += dt;
            if (s.fallT > 2.2) {
                s.phase = "roundover"; // transient guard — onFallDone fires exactly once
                onFallDone(f.who);
            }
        }

        // particles
        s.particles.forEach((p: any) => {
            if (p.grav) p.vy -= p.grav * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.life -= dt;
        });
        const oldLen = s.particles.length;
        s.particles = s.particles.filter((p: any) => p.life > 0);
        if (s.particles.length !== oldLen) listsChanged = true;

        if (listsChanged || s.fxDirty) {
            setActiveParticleIds(s.particles.map((p: any) => p.id));
            s.fxDirty = false;
        }

        if (s.redFlash > 0) s.redFlash = Math.max(0, s.redFlash - dt * (0.25 / 0.15));

        s.hudTick += dt;
        if (s.hudTick > 0.05) {
            s.hudTick = 0;
            const minutes = s.battleTimeMs / 60000;
            const wpm = minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0;
            const acc = s.totalKeystrokes > 0 ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100) : 0;
            setHudState({
                score: s.score, wpm, accuracy: acc, streak: s.streak,
                pushX: s.pushX, wave: s.wave, rivalsDefeated: s.rivalsDefeated,
                phase: s.phase, countdown: s.countdown, victor: s.victor,
                ragePhase: s.ragePhase, redFlash: s.redFlash,
            });
        }
    });
    return null;
};

// --- WORD TILES (DOM, instant per-keystroke updates) ---

const WordTiles = memo(({ word, typed, errorTick }: { word: string; typed: number; errorTick: number }) => (
    <div className="flex gap-1.5 justify-center">
        {word.split("").map((ch, i) => {
            const isTyped = i < typed;
            const isCurrent = i === typed;
            return (
                <div
                    key={`${i}-${isCurrent ? errorTick : 0}`}
                    style={{ width: "min(52px, 7.5vw)", height: "min(62px, 9vw)" }}
                    className={`flex items-center justify-center rounded-xl border-b-4 font-mono font-black uppercase select-none text-[min(30px,4.5vw)] shadow-lg transition-colors duration-75 ${
                        isTyped
                            ? "bg-emerald-400 border-emerald-600 text-white rd-pop"
                            : isCurrent
                                ? `bg-amber-300 border-amber-500 text-[#31404f] ${errorTick > 0 ? "rd-shake !bg-red-400 !border-red-600 !text-white" : ""}`
                                : "bg-white/95 border-slate-300 text-[#31404f]"
                    }`}
                >
                    {ch}
                </div>
            );
        })}
    </div>
));
WordTiles.displayName = "WordTiles";

// --- MAIN COMPONENT ---

export default function RhinoWorld() {
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [activeParticleIds, setActiveParticleIds] = useState<string[]>([]);
    const [wordState, setWordState] = useState({ word: "", typed: 0, errorTick: 0 });
    const [hudState, setHudState] = useState({
        score: 0, wpm: 0, accuracy: 0, streak: 0, pushX: 0, wave: 1,
        rivalsDefeated: 0, phase: "idle" as BattlePhase, countdown: 0,
        victor: null as null | string, ragePhase: "idle", redFlash: 0,
    });
    // lazy init — this component only ever renders client-side (ssr: false)
    const [highScore, setHighScore] = useState(() => {
        try {
            return typeof window === "undefined" ? 0 : Number(localStorage.getItem("tz-rhino-highscore") || 0);
        } catch {
            return 0;
        }
    });
    const [isNewRecord, setIsNewRecord] = useState(false);

    const [initState] = useState(getInitialState);
    const stateRef = useRef(initState);
    const statsSession = useRef<StatsSession | null>(null);

    const nextWord = useCallback(() => {
        const s = stateRef.current;
        s.word = pickWord(wordPoolFor(s), s.word);
        s.typed = 0;
        setWordState((ws) => ({ word: s.word, typed: 0, errorTick: ws.errorTick }));
    }, []);

    // A new rival walks in: wave 1 gets the full 3-2-1 countdown; later waves
    // a quick 2-count while the player walks back to center from where it won.
    const startWave = useCallback((n: number) => {
        const s = stateRef.current;
        s.wave = n;
        s.enemyPushMul = Math.min(WAVE_RAMP_CAP, 1 + (n - 1) * WAVE_RAMP);
        s.phase = "countdown";
        s.countdown = n === 1 ? 3.2 : 2.0;
        s.entry = 0;
        s.entryFrom = n === 1 ? -9.5 : Math.min(4.5, s.pushX - WORLD.RHINO_GAP);
        s.pushX = 0;
        s.pushVel = 0;
        s.playerForce = 0;
        s.ragePhase = "idle";
        s.rageT = 0;
        s.rageTimer = 5 + Math.random() * 3;
        s.falling = null;
        s.fallT = 0;
        s.victor = null;
        nextWord();
    }, [nextWord]);

    const endRun = useCallback(() => {
        sfx.stopProceduralBGM();
        sfx.playDefeat();
        setGameState("GAME_OVER");
    }, []);

    // One life: the player going over the edge ends the run immediately.
    // A defeated rival is replaced by a stronger one — the game never stops.
    const handleFallDone = useCallback((who: "player" | "enemy") => {
        const s = stateRef.current;
        if (who === "player") { endRun(); return; }
        s.rivalsDefeated++;
        s.score += 150;
        startWave(s.wave + 1);
    }, [endRun, startWave]);

    const startGame = useCallback((diff: Difficulty) => {
        sfx.init();
        sfx.resume();
        statsSession.current?.end();
        statsSession.current = createStatsSession();
        setDifficulty(diff);

        const s = stateRef.current;
        s.cfg = DIFFICULTY_CONFIG[diff];
        s.rivalsDefeated = 0;
        s.score = 0;
        s.wordsTyped = 0;
        s.correctKeystrokes = 0;
        s.totalKeystrokes = 0;
        s.battleTimeMs = 0;
        s.streak = 0;
        s.lungeCount = 0;
        s.flinchCount = 0;
        s.camTrauma = 0;
        s.camPunch = 0;
        s.redFlash = 0;
        s.particles = [];
        s.dustTimer = 0;
        s.hudTick = 0;
        s.fxDirty = false;
        startWave(1);

        setActiveParticleIds([]);
        setHudState({
            score: 0, wpm: 0, accuracy: 0, streak: 0, pushX: 0, wave: 1,
            rivalsDefeated: 0, phase: "countdown", countdown: 3.2,
            victor: null, ragePhase: "idle", redFlash: 0,
        });
        setGameState("PLAYING");
        setIsNewRecord(false);
        sfx.startProceduralBGM(() => {
            const st = stateRef.current;
            return Math.min(1.8, 1 + (st.wave - 1) * 0.08 + Math.min(0.3, (Math.abs(st.pushX) / WORLD.FALL_X) * 0.3));
        });
    }, [startWave]);

    // Run ended: flush keystroke stats, log the attempt, update the record
    useEffect(() => {
        if (gameState !== "GAME_OVER") return;
        statsSession.current?.end();
        statsSession.current = null;
        const s = stateRef.current;
        const minutes = s.battleTimeMs / 60000;
        recordAttempt({
            lessonId: "rhino-dash",
            type: "game",
            wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
            accuracy: s.totalKeystrokes > 0 ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100) : 0,
            stars: 0,
            timeMs: Math.round(s.battleTimeMs),
            errors: s.totalKeystrokes - s.correctKeystrokes,
            problemKeys: {},
        });
        setIsNewRecord(s.score > 0 && s.score > highScore);
        if (s.score > highScore) {
            setHighScore(s.score);
            try {
                localStorage.setItem("tz-rhino-highscore", String(s.score));
            } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    // --- TYPING INPUT (battle phase only) ---
    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const handleKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            if (s.phase !== "battle") return;
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();
            sfx.playKeyTap();

            const char = e.key.toLowerCase();
            s.totalKeystrokes++;
            const expected = s.word[s.typed]?.toLowerCase();

            if (char === expected) {
                s.typed++;
                s.correctKeystrokes++;
                s.streak++;
                statsSession.current?.stroke(char, true);
                const bonus = 1 + Math.min(0.3, Math.floor(s.streak / 10) * 0.1);
                s.playerForce = Math.min(MAX_FORCE, s.playerForce + s.cfg.pushPerKey * bonus);
                s.stompFlip = !s.stompFlip;
                sfx.playStomp(s.stompFlip);

                if (s.typed >= s.word.length) {
                    s.score += s.word.length * 10;
                    s.wordsTyped++;
                    s.lungeCount++;
                    s.pushX += WORD_LUNGE;
                    s.camPunch = 1;
                    sfx.playShove();
                    spawnImpactBurst(s);
                    s.word = pickWord(wordPoolFor(s), s.word);
                    s.typed = 0;
                    setWordState((ws) => ({ word: s.word, typed: 0, errorTick: ws.errorTick }));
                } else {
                    setWordState((ws) => ({ ...ws, typed: s.typed }));
                }
            } else {
                statsSession.current?.stroke(expected ?? char, false);
                s.streak = 0;
                s.flinchCount++;
                s.pushX -= MISS_KNOCKBACK;
                s.playerForce *= 0.3;
                s.camTrauma = Math.max(s.camTrauma, 0.45);
                s.redFlash = 1;
                sfx.playTypo();
                setWordState((ws) => ({ ...ws, errorTick: ws.errorTick + 1 }));
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [gameState]);

    // --- GAME CONTROL KEYS (Esc = pause/resume, Enter = restart) ---
    useEffect(() => {
        const handleControlKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (gameState === "PLAYING") { sfx.audioCtx?.suspend(); setGameState("PAUSED"); }
                else if (gameState === "PAUSED") { sfx.resume(); setGameState("PLAYING"); }
            } else if (e.key === "Enter" && gameState === "GAME_OVER") {
                startGame(difficulty);
            }
        };
        window.addEventListener("keydown", handleControlKey);
        return () => window.removeEventListener("keydown", handleControlKey);
    }, [gameState, difficulty, startGame]);

    // --- CLEANUP ON UNMOUNT ---
    useEffect(() => {
        return () => {
            sfx.stopProceduralBGM();
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
        };
    }, []);

    const fmtTime = (ms: number) => {
        const secs = Math.round(ms / 1000);
        return secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`;
    };
    const meterPos = Math.max(-1, Math.min(1, hudState.pushX / WORLD.FALL_X));
    const inDanger = meterPos < -0.6 && hudState.phase === "battle";
    const countdownNum = Math.ceil(hudState.countdown);

    return (
        <div className="w-full h-full relative bg-[#bfe5f8]">
            <style>{`
                @keyframes rd-pop { 0% { transform: scale(1.3); } 100% { transform: scale(1); } }
                .rd-pop { animation: rd-pop 0.15s ease-out; }
                @keyframes rd-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .rd-shake { animation: rd-shake 0.18s ease-in-out; }
            `}</style>
            <Canvas>
                <CameraRig stateRef={stateRef} />
                <fog attach="fog" args={["#dff2fd", 34, 90]} />
                <ambientLight intensity={0.6} />
                <hemisphereLight args={["#bfe6ff", "#86c06a", 0.5]} />
                <directionalLight position={[8, 14, 10]} intensity={1.1} color="#fff6de" />

                <Suspense fallback={null}>
                    <SkyDome />
                    <SunAndClouds />
                    <Ocean />
                    <CliffIsland />
                    <Rhino variant="player" stateRef={stateRef} />
                    <Rhino variant="enemy" stateRef={stateRef} />
                    {activeParticleIds.map((id) => <ParticleNode key={id} pid={id} stateRef={stateRef} />)}
                </Suspense>

                {(gameState === "PLAYING") && (
                    <GameLoop
                        stateRef={stateRef}
                        onFallDone={handleFallDone}
                        setActiveParticleIds={setActiveParticleIds}
                        setHudState={setHudState}
                    />
                )}
            </Canvas>

            {/* typo red flash */}
            <div className="absolute inset-0 bg-red-500 pointer-events-none transition-opacity duration-150 z-40" style={{ opacity: hudState.redFlash * 0.35 }} />

            {/* HUD */}
            {(gameState === "PLAYING" || gameState === "PAUSED") && (
                <>
                    <div className="absolute top-5 left-5 z-50 pointer-events-none flex flex-wrap gap-2 font-sans">
                        {[
                            ["Score", String(hudState.score)],
                            ["WPM", String(hudState.wpm)],
                            ["Acc", `${hudState.accuracy}%`],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-[#f2fbff]/95 backdrop-blur border-2 border-[#14344f] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(20,52,79,0.9)]">
                                <span className="text-[10px] font-black text-[#5d87a5] uppercase tracking-widest">{label}</span>
                                <span className="font-mono font-black text-[#14344f]">{value}</span>
                            </div>
                        ))}
                        {hudState.streak >= 5 && (
                            <div className="bg-amber-400/95 backdrop-blur border-2 border-[#14344f] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(20,52,79,0.9)] animate-in zoom-in duration-200 -rotate-2">
                                <span className="text-sm">🔥</span>
                                <span className="font-mono font-black text-[#14344f]">×{hudState.streak}</span>
                            </div>
                        )}
                    </div>

                    {/* wave badge + rivals defeated */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 font-sans">
                        <div className="bg-[#f2fbff]/95 border-2 border-[#14344f] rounded-full px-4 py-1 shadow-[0_3px_0_rgba(20,52,79,0.9)]">
                            <span className="text-xs font-black text-[#14344f] uppercase tracking-widest">Rival {hudState.wave}</span>
                        </div>
                        {hudState.rivalsDefeated > 0 && (
                            <div className="bg-emerald-400/95 border-2 border-[#14344f] rounded-full px-3 py-1 shadow-[0_3px_0_rgba(20,52,79,0.9)] flex items-center gap-1.5">
                                <span className="text-xs">🦏</span>
                                <span className="text-xs font-black text-[#14344f]">×{hudState.rivalsDefeated}</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-5 right-5 z-50 flex gap-2 font-sans">
                        <button title="Pause (Esc)" onClick={() => { if (gameState === "PLAYING") { sfx.audioCtx?.suspend(); setGameState("PAUSED"); } }} className="bg-[#f2fbff]/95 backdrop-blur border-2 border-[#14344f] text-[#14344f] px-4 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(20,52,79,0.9)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            Pause <span className="text-[#5d87a5] font-mono text-xs">Esc</span>
                        </button>
                        <a title="Quit" href="/games" className="bg-[#f2fbff]/95 backdrop-blur border-2 border-[#14344f] text-red-500 px-4 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(20,52,79,0.9)] hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            Quit
                        </a>
                    </div>

                    {/* word + push meter */}
                    {gameState === "PLAYING" && (hudState.phase === "battle" || hudState.phase === "countdown") && (
                        <div className="absolute top-[4.7rem] left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-3 font-sans">
                            <WordTiles word={wordState.word} typed={wordState.typed} errorTick={wordState.errorTick} />
                            <div className={`relative h-4 w-[min(280px,60vw)] rounded-full border-2 border-[#14344f] bg-gradient-to-r from-red-400 via-amber-200 to-emerald-400 shadow-[0_3px_0_rgba(20,52,79,0.9)] ${inDanger ? "animate-pulse" : ""}`}>
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#14344f]/40" />
                                <div
                                    className="absolute -top-[7px] w-6 h-6 rounded-full bg-white border-[3px] border-[#14344f] shadow transition-all duration-100"
                                    style={{ left: `calc(${50 + meterPos * 50}% - 12px)` }}
                                >
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px]">🦏</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* rage warning */}
                    {gameState === "PLAYING" && hudState.ragePhase !== "idle" && hudState.phase === "battle" && (
                        <div className="absolute top-[13rem] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                            <div className={`px-5 py-2 rounded-full border-2 border-[#14344f] font-black text-sm tracking-widest shadow-[0_3px_0_rgba(20,52,79,0.9)] ${hudState.ragePhase === "tele" ? "bg-amber-300 text-[#7c2d12] animate-pulse" : "bg-red-500 text-white"}`}>
                                {hudState.ragePhase === "tele" ? "⚠️ RIVAL CHARGING UP…" : "💢 RAGE SHOVE — TYPE FAST!"}
                            </div>
                        </div>
                    )}

                    {/* countdown banner */}
                    {gameState === "PLAYING" && hudState.phase === "countdown" && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className="flex flex-col items-center -mt-16">
                                <div className="px-6 py-2 bg-[#f2fbff]/95 border-2 border-[#14344f] rounded-full font-black text-lg text-[#14344f] shadow-[0_3px_0_rgba(20,52,79,0.9)] mb-3 -rotate-1">
                                    Rival {hudState.wave} {hudState.wave > 1 ? "— STRONGER!" : "— FIGHT!"}
                                </div>
                                <div key={countdownNum} className="text-8xl font-black text-white [text-shadow:0_5px_0_#14344f] animate-in zoom-in duration-200">
                                    {countdownNum > 0 ? countdownNum : "GO!"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* round result banner (during the fall) */}
                    {gameState === "PLAYING" && (hudState.phase === "fall" || hudState.phase === "roundover") && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center font-sans">
                            <div className={`flex flex-col items-center gap-1 px-8 py-4 rounded-3xl border-4 border-[#14344f] shadow-[0_6px_0_#14344f] animate-in zoom-in duration-300 -rotate-1 ${hudState.victor === "player" ? "bg-emerald-400" : "bg-red-400"}`}>
                                <span className="text-3xl font-black text-white">
                                    {hudState.victor === "player" ? "RIVAL DOWN! 🎉" : "YOU FELL! 😵"}
                                </span>
                                {hudState.victor === "player" && (
                                    <span className="text-sm font-black text-white/85 tracking-wide">a stronger rival is coming…</span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* GAME OVER — endurance summary: WPM, accuracy, time survived */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#0c2438]/70 backdrop-blur-sm flex items-center justify-center font-sans">
                    <div className="w-[400px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-8 flex flex-col items-center animate-in zoom-in duration-300">
                        <h1 className="text-3xl font-black tracking-tight text-[#14344f] mb-2">💥 You Fell!</h1>
                        <p className="text-sm font-bold text-[#5d87a5] mb-4">
                            {stateRef.current.rivalsDefeated > 0
                                ? `You knocked ${stateRef.current.rivalsDefeated} rival${stateRef.current.rivalsDefeated > 1 ? "s" : ""} into the sea!`
                                : "The rival was too strong this time…"}
                        </p>
                        {isNewRecord && (
                            <p className="-mt-2 mb-4 px-3 py-1 bg-amber-300 border-2 border-[#14344f] rounded-full text-xs font-black text-[#14344f] -rotate-2 shadow-[0_2px_0_#14344f]">★ New record!</p>
                        )}

                        <div className="grid grid-cols-3 gap-2 w-full mb-6">
                            {[
                                { label: "WPM", value: String(hudState.wpm), tint: "bg-sky-200" },
                                { label: "Acc", value: `${hudState.accuracy}%`, tint: "bg-emerald-200" },
                                { label: "Time", value: fmtTime(stateRef.current.battleTimeMs), tint: "bg-rose-200" },
                                { label: "Score", value: String(hudState.score), tint: "bg-amber-200" },
                                { label: "Best", value: String(highScore), tint: "bg-violet-200" },
                                { label: "Rivals", value: String(stateRef.current.rivalsDefeated), tint: "bg-lime-200" },
                            ].map((s) => (
                                <div key={s.label} className={`flex flex-col items-center ${s.tint} border-2 border-[#14344f] rounded-2xl px-2 py-3 shadow-[0_3px_0_#14344f]`}>
                                    <span className="font-mono text-lg font-black text-[#14344f]">{s.value}</span>
                                    <span className="text-[9px] uppercase tracking-widest text-[#14344f]/60 font-black mt-0.5">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => startGame(difficulty)}
                            className="w-full py-3.5 bg-emerald-500 text-white font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#14344f] [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                        >
                            Play Again <span className="text-white/80 font-mono text-xs ml-1">Enter ↵</span>
                        </button>

                        <div className="flex items-center gap-5 mt-4 text-sm">
                            <button onClick={() => { stateRef.current.phase = "idle"; stateRef.current.falling = null; stateRef.current.victor = null; setGameState("MENU"); }} className="font-bold text-[#5d87a5] hover:text-[#14344f] underline decoration-2 decoration-[#bfe0f2] underline-offset-4 hover:decoration-amber-400 transition-colors">
                                Menu
                            </button>
                            <a href="/games" className="font-bold text-red-500 hover:text-red-600 underline decoration-2 decoration-[#bfe0f2] underline-offset-4 hover:decoration-red-300 transition-colors">
                                Quit
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* MENU / PAUSED */}
            {(gameState === "MENU" || gameState === "PAUSED") && (
                <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-[#0c2438]/55 backdrop-blur-sm font-sans">
                    <div className="w-[380px] max-w-[92%] bg-[#f2fbff] rounded-[28px] border-4 border-[#14344f] shadow-[0_10px_0_#14344f,0_28px_60px_rgba(0,0,0,0.35)] p-7 relative flex flex-col items-center animate-in zoom-in duration-300">
                        <button
                            onClick={() => { setIsMuted(sfx.toggleMute()); }}
                            title={isMuted ? "Unmute" : "Mute"}
                            className="absolute -top-3 -right-3 bg-[#f2fbff] text-[#14344f] border-2 border-[#14344f] w-11 h-11 rounded-full shadow-[0_3px_0_#14344f] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center z-10"
                        >
                            {isMuted ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                            )}
                        </button>

                        <Mascot mood={gameState === "MENU" ? "focused" : "happy"} className="w-20 h-20 -mt-2 mb-2" />
                        <h2 className="text-3xl font-black tracking-tight text-[#14344f]">
                            {gameState === "MENU" ? <>Rhino <span className="text-amber-500">Dash</span></> : "Paused"}
                        </h2>

                        {gameState === "MENU" && (
                            <>
                                <p className="text-sm font-medium text-[#5d87a5] text-center leading-snug mt-2 mb-1">
                                    Type fast — shove rivals off the cliff! Each one is stronger. One fall and it&apos;s over — how long can you last?
                                </p>
                                {highScore > 0 && (
                                    <p className="mt-1 mb-1 px-3 py-1 bg-amber-300 border-2 border-[#14344f] rounded-full text-xs font-black text-[#14344f] -rotate-1 shadow-[0_2px_0_#14344f]">
                                        ★ Best: {highScore}
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex flex-col gap-3 mt-4 w-full">
                            {gameState === "MENU" && (
                                <>
                                    {([
                                        ["EASY", "🌱", "bg-emerald-500"],
                                        ["MEDIUM", "⚡", "bg-amber-500"],
                                        ["HARD", "🔥", "bg-red-500"],
                                    ] as const).map(([diff, emoji, tint]) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            className={`w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] ${tint} font-black text-sm tracking-widest text-white [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2.5`}
                                        >
                                            <span className="text-base [text-shadow:none]">{emoji}</span>
                                            {diff}
                                        </button>
                                    ))}
                                    <a
                                        href="/games"
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-red-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Quit
                                    </a>
                                </>
                            )}

                            {gameState === "PAUSED" && (
                                <>
                                    <button
                                        onClick={() => { sfx.resume(); setGameState("PLAYING"); }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-emerald-500 text-white font-black text-sm tracking-wide [text-shadow:0_1px_0_rgba(20,52,79,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Continue <span className="text-white/80 font-mono text-xs ml-1">Esc</span>
                                    </button>
                                    <button
                                        onClick={() => startGame(difficulty)}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#dbeffc] text-[#14344f] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Restart
                                    </button>
                                    <button
                                        onClick={() => { stateRef.current.phase = "idle"; stateRef.current.falling = null; stateRef.current.victor = null; sfx.stopProceduralBGM(); setGameState("MENU"); }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-[#14344f] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Menu
                                    </button>
                                    <button
                                        onClick={() => { window.location.href = "/games"; }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#14344f] bg-[#f2fbff] text-red-500 font-black text-sm tracking-wide hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Quit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
