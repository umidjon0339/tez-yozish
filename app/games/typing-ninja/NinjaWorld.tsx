/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Trail } from "@react-three/drei";
import * as THREE from "three";
import { Mascot } from "@/components/Mascot";
import { HeroNinja, EnemyNinja, getSoftTexture, type HeroMode } from "./characters";
import { CameraRig, SkyDome, Mountains, Clouds, InstancedScenery } from "./environment";
import { createStatsSession, recordAttempt, type StatsSession } from "@/lib/typing/stats";

// ==========================================
// THE "GOD MODE" MASTER CONFIGURATION
// ==========================================
export const MASTER_CONFIG = {
    // 1. GLOBAL SCALES [X, Y, Z]
    SCALES: {
        playerNinja: [0.6, 0.6, 0.6] as [number, number, number],
        enemyNinja: [0.7, 0.7, 0.7] as [number, number, number],
        pineTree: [0.65, 0.65, 0.65] as [number, number, number],
        stump: [0.8, 0.8, 0.8] as [number, number, number],
        minionRadius: 0.39,
    },
    // 2. SPEEDS & VELOCITIES
    SPEEDS: {
        worldScrollBase: 18,       // Speed the ground & trees rush toward the camera
        playerAnimRunRate: 15,     // Speed of the player's idle/run bobbing
        enemyRunBase: 11,          // Speed opponent ninjas run down the track
        shurikenVelocity: 45,      // Speed of thrown projectiles
    },
    // 3. SPATIAL LAYOUT
    LAYOUT: {
        trackWidth: 2.8,           // Half-width of the dirt road
        treeKeepoutRadius: 4.2,    // MINIMUM X-distance from center for trees (Wide shoulders)
        playerZ: 5.5,                // Z position of the player ninja (closer to camera = lower on screen)
        enemyKillZ: 6,             // Z boundary where enemies strike the player
    }
};

// ==========================================
// GAME DIFFICULTY & SPEED CONFIGURATION
// ==========================================
const DIFFICULTY_CONFIG = {
    EASY: { 
        baseSpeed: 4, // Move speed down the Z-axis
        spawnInterval: 3400, // ms between spawns
        wordsPerEnemy: 1 
    },
    MEDIUM: { 
        baseSpeed: 10, 
        spawnInterval: 1800, 
        wordsPerEnemy: 1 
    },
    HARD: { 
        baseSpeed: 15, 
        spawnInterval: 1200, 
        wordsPerEnemy: 1 
    }
};

const WORDS = [
    "tiger", "panther", "eagle", "wolf", "dragon", "falcon", "cobra", "shark", "rhino", "leopard",
    "gorilla", "cheetah", "python", "jaguar", "mammoth", "dolphin", "spider", "raven", "bison", "cougar",
    "forest", "mountain", "river", "ocean", "thunder", "lightning", "storm", "volcano", "desert", "jungle",
    "canyon", "glacier", "meteor", "nebula", "galaxy", "planet", "eclipse", "aurora", "breeze", "tsunami",
    "apple", "burger", "pizza", "sushi", "taco", "steak", "bacon", "cheese", "bread", "honey",
    "ninja", "sword", "blade", "kunai", "shuriken", "shadow", "stealth", "strike", "slash", "dodge"
];

type GameState = "MENU" | "PLAYING" | "GAME_OVER" | "PAUSED";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

// --- AUDIO SYNTHESIZER ---
class SoundSynthesizer {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled: boolean = false;
    muted: boolean = false;
    bgmTimer: number | null = null;
    nextNoteTime: number = 0;
    bgmStep: number = 0;

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
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.4, this.audioCtx.currentTime, 0.05);
        }
        return this.muted;
    }

    private createNoiseBuffer(duration: number) {
        if (!this.audioCtx) return null;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playKeyTap() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, t);
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.015);

        const noiseBuffer = this.createNoiseBuffer(0.015);
        if (noiseBuffer) {
            const noiseSrc = this.audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = "highpass";
            noiseFilter.frequency.value = 2000;
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015);
            noiseSrc.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSrc.start(t);
        }
    }

    playWordLaunch() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.065);
        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.065);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.065);

        const noiseBuffer = this.createNoiseBuffer(0.1);
        if (noiseBuffer) {
            const noiseSrc = this.audioCtx.createBufferSource();
            noiseSrc.buffer = noiseBuffer;
            const noiseFilter = this.audioCtx.createBiquadFilter();
            noiseFilter.type = "bandpass";
            noiseFilter.frequency.value = 1200;
            const noiseGain = this.audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.2, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noiseSrc.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
            noiseSrc.start(t);
        }
    }

    playTypo() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
        
        filter.type = "lowpass";
        filter.frequency.value = 400;

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        
        osc.connect(filter).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.04);
    }

    playEnemyPop() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(550, t + 0.1);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.linearRampToValueAtTime(800, t + 0.1);
        filter.Q.value = 10;

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(filter).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playEnemyDefeat() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Bright power-up major third chime: C5 & E5
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, t);
        osc1.frequency.exponentialRampToValueAtTime(1046.5, t + 0.1);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, t);
        osc2.frequency.exponentialRampToValueAtTime(1318.5, t + 0.1);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc1.connect(gain).connect(this.masterGain);
        osc2.connect(gain).connect(this.masterGain);
        
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.3);
        osc2.stop(t + 0.3);
    }

    playFootstep(isRightFoot: boolean) {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const noiseBuffer = this.createNoiseBuffer(0.005);
        if (!noiseBuffer) return;

        const noiseSrc = this.audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = isRightFoot ? 1650 : 1400;
        filter.Q.value = 5;

        const panner = this.audioCtx.createStereoPanner();
        panner.pan.value = isRightFoot ? 0.3 : -0.3;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

        noiseSrc.connect(filter).connect(panner).connect(gain).connect(this.masterGain);
        noiseSrc.start(t);
    }

    private makeDistortionCurve(amount = 50) {
        const k = amount;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    playDamage() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const distortion = this.audioCtx.createWaveShaper();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

        distortion.curve = this.makeDistortionCurve(400);
        distortion.oversample = '4x';

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(distortion).connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    playDeath() {
        if (!this.enabled || !this.audioCtx || !this.masterGain || this.muted) return;
        const t = this.audioCtx.currentTime;
        
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = "square";
        
        osc.frequency.setValueAtTime(261.63, t);
        osc.frequency.setValueAtTime(220.00, t + 0.1);
        osc.frequency.setValueAtTime(174.61, t + 0.2);
        osc.frequency.setValueAtTime(130.81, t + 0.3);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.setValueAtTime(0.2, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        osc.connect(gain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.8);
    }

    startProceduralBGM(getLiveSpeedMultiplier: () => number) {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        this.bgmStep = 0;

        const scheduleNote = () => {
            if (!this.audioCtx || !this.masterGain) return;

            while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
                if (!this.muted) {
                    const mult = getLiveSpeedMultiplier() || 1;
                    const notes = [110.0, 130.81, 164.81, 146.83];
                    const freq = notes[this.bgmStep % 4];

                    const osc = this.audioCtx.createOscillator();
                    const filter = this.audioCtx.createBiquadFilter();
                    const gain = this.audioCtx.createGain();

                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(freq, this.nextNoteTime);

                    filter.type = "lowpass";
                    const cutoff = 400 * mult;
                    filter.frequency.setValueAtTime(cutoff, this.nextNoteTime);
                    filter.frequency.exponentialRampToValueAtTime(100, this.nextNoteTime + 0.15);

                    gain.gain.setValueAtTime(0.1, this.nextNoteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.nextNoteTime + 0.15);

                    osc.connect(filter).connect(gain).connect(this.masterGain);
                    osc.start(this.nextNoteTime);
                    osc.stop(this.nextNoteTime + 0.15);
                }
                
                const mult = getLiveSpeedMultiplier() || 1;
                const secondsPerBeat = 0.6 / mult;
                this.nextNoteTime += secondsPerBeat;
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

// --- CONFIGURATIONS & INITIALIZATION ---

const getTreeX = () => {
    const keepout = MASTER_CONFIG.LAYOUT.treeKeepoutRadius;
    const beltWidth = 14 - keepout;
    return Math.random() > 0.5 
        ? -keepout - Math.random() * beltWidth 
        : keepout + Math.random() * beltWidth;
};

const getInitialState = () => ({
    enemies: [] as any[],
    projectiles: [] as any[],
    particles: [] as any[],
    ground: Array.from({length: 12}).map((_, i) => ({ id: i, z: -45 + i*6 })),
    scenery: Array.from({length: 80}).map((_, i) => ({
        id: `tree_${i}`,
        x: getTreeX(),
        z: -45 + Math.random() * 60,
        isStump: Math.random() > 0.8,
        mainColor: Math.random() > 0.5 ? '#2dd4bf' : '#16a34a'
    })),
    rocks: Array.from({length: 20}).map(() => ({
        x: (Math.random() > 0.5 ? 1 : -1) * (3.4 + Math.random() * 1.8),
        z: -45 + Math.random() * 60,
        s: 0.5 + Math.random() * 0.9,
        ry: Math.random() * Math.PI
    })),
    targetId: null as string | null,
    spawnTimer: 0,
    score: 0,
    lives: 3,
    wordsTyped: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    timeSurvived: 0,
    vignette: 0,
    redFlash: 0,
    hudTick: 0,
    embeddedMistakes: 0,
    embeddedQueue: [] as string[],
    // game-feel channels (written by the loop/input, read by visuals)
    heroHandPos: { x: 0, y: 1.1, z: MASTER_CONFIG.LAYOUT.playerZ },
    throwCount: 0,
    damageCount: 0,
    streak: 0,
    camTrauma: 0,
    camPunch: 0,
    speedRamp: 1,
    fxDirty: false
});

// --- PROCEDURAL 3D MODELS (Trees, Ninjas, Shurikens) ---

const EnemyNode = ({ enemyId, stateRef, isPaused }: any) => {
    const meshRef = useRef<THREE.Group>(null!);
    const [textState, setTextState] = useState({
      show: true,
      typed: "",
      untyped: "",
      isTarget: false,
    });

    useFrame(() => {
      const e = stateRef.current.enemies.find((x: any) => x.id === enemyId);
      if (e && meshRef.current) {
        // Corpse sinks into the ground at the end of the death animation
        const sink = e.isDead && e.deathTimer < 0.35 ? -(0.35 - e.deathTimer) * 3 : 0;
        meshRef.current.position.set(e.x, sink, e.z);
        if (e.isDead) {
          if (textState.show) setTextState((s) => ({ ...s, show: false }));
        } else {
          const isTarget = stateRef.current.targetId === enemyId;
          const totalTypedLength = e.typed.length + e.queuedHits;
          const instantlyTyped = e.word.slice(0, totalTypedLength);
          
          if (
            instantlyTyped !== textState.typed ||
            isTarget !== textState.isTarget ||
            textState.untyped === ""
          ) {
            setTextState({
              show: true,
              typed: instantlyTyped,
              untyped: e.word.slice(totalTypedLength),
              isTarget,
            });
          }
        }
      }
    });

    return (
        <group ref={meshRef} scale={MASTER_CONFIG.SCALES.enemyNinja}>
            <EnemyNinja stateRef={stateRef} enemyId={enemyId} paused={isPaused} />
            {!isPaused && textState.show && (
                <group position={[0, 2.5, 0]}>
                    <Html
                      center
                      distanceFactor={14}
                      zIndexRange={[100, 0]}
                    >
                      <div className={`relative px-4 py-2 rounded-lg font-mono font-black text-3xl shadow-xl border-2 transition-all ${
                        textState.isTarget
                          ? 'bg-[#5c4033] border-amber-400 text-white scale-125'
                          : 'bg-slate-800 border-slate-400 text-white/90'
                      }`}>
                        <span className="text-red-400">{textState.typed}</span>
                        <span>{textState.untyped}</span>

                        {/* Speech Bubble Pointer */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-b-2 border-r-2 transition-all ${
                          textState.isTarget
                            ? 'bg-[#5c4033] border-amber-400'
                            : 'bg-slate-800 border-slate-400'
                        }`} />
                      </div>
                    </Html>
                </group>
            )}
        </group>
    );
};

const ProjectileNode = ({ pid, stateRef }: any) => {
    const meshRef = useRef<THREE.Group>(null!);
    const spinRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        const p = stateRef.current.projectiles.find((x: any) => x.id === pid);
        if (p && meshRef.current && spinRef.current) {
            if (p.isHit) {
                const target = stateRef.current.enemies.find((e: any) => e.id === p.targetId);
                if (target) {
                    const dx = target.x - p.x;
                    const dz = target.z - p.z;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist > 2.0) {
                        p.x += (dx/dist) * MASTER_CONFIG.SPEEDS.shurikenVelocity * delta;
                        p.z += (dz/dist) * MASTER_CONFIG.SPEEDS.shurikenVelocity * delta;
                    }
                }
            } else {
                p.x += p.vx * delta;
                p.y += p.vy * delta;
                p.z += p.vz * delta;
            }
            meshRef.current.position.set(p.x, p.y, p.z);
            // Spin wildly like a shuriken
            spinRef.current.rotation.z -= 30 * delta;
        }
    });

    return (
        <group ref={meshRef}>
            {/* Comet trail while the shuriken flies */}
            <Trail width={0.5} length={2.5} color={"#ffe9c0"} attenuation={(w: number) => w * w}>
            {/* Lay the shuriken flat on the XZ plane */}
            <group ref={spinRef} rotation={[-Math.PI / 2, 0, 0]}>
                {/* Central Ring */}
                <mesh>
                    <torusGeometry args={[0.08, 0.03, 8, 12]} />
                    <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Right Blade */}
                <mesh position={[0.15, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                    <coneGeometry args={[0.08, 0.25, 3]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Left Blade */}
                <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                    <coneGeometry args={[0.08, 0.25, 3]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Top Blade */}
                <mesh position={[0, 0.15, 0]}>
                    <coneGeometry args={[0.08, 0.25, 3]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Bottom Blade */}
                <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.08, 0.25, 3]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
            </Trail>
        </group>
    );
};

const ParticleNode = ({ pid, stateRef }: any) => {
    const meshRef = useRef<THREE.Group>(null!);
    const matRef = useRef<any>(null!);
    // Snapshot kind/color once — particle data is mutable but its identity isn't
    const [init] = useState(() => stateRef.current.particles.find((x: any) => x.id === pid));

    useFrame((_, delta) => {
        const p = stateRef.current.particles.find((x: any) => x.id === pid);
        if (!p || !meshRef.current) return;
        meshRef.current.position.set(p.x, p.y, p.z);
        const frac = Math.max(0, p.life / p.maxLife);
        if (p.kind === "smoke" || p.kind === "dust") {
            // puffs expand and fade out
            meshRef.current.scale.setScalar((p.size || 0.3) * (1 + (1 - frac) * 1.8));
            if (matRef.current) matRef.current.opacity = frac * 0.55;
        } else if (!p.isText) {
            meshRef.current.rotation.x += p.rx * delta;
            meshRef.current.rotation.y += p.ry * delta;
            meshRef.current.scale.setScalar(frac);
        }
    });

    if (!init) return null;

    if (init.isText) {
        return (
            <group ref={meshRef}>
                <Html center distanceFactor={10}>
                    <div className="text-amber-400 font-black text-2xl drop-shadow-md">+{init.score}</div>
                </Html>
            </group>
        );
    }
    if (init.kind === "smoke" || init.kind === "dust") {
        return (
            <group ref={meshRef}>
                <sprite>
                    <spriteMaterial ref={matRef} map={getSoftTexture()} color={init.color || "#cfcac2"} transparent depthWrite={false} opacity={0.5} />
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
                <boxGeometry args={[0.16, 0.16, 0.16]} />
                <meshBasicMaterial color={init.color || "#f97316"} />
            </mesh>
        </group>
    );
};

const GroundLayer = ({ stateRef }: any) => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(() => {
        if (!groupRef.current) return;
        const children = groupRef.current.children;
        const gt = stateRef.current.ground;
        for (let i=0; i<children.length; i++) {
            children[i].position.z = gt[i].z;
        }
    });

    const w = MASTER_CONFIG.LAYOUT.trackWidth * 2;
    const offset = MASTER_CONFIG.LAYOUT.trackWidth + 0.35;
    const beltCenter = MASTER_CONFIG.LAYOUT.trackWidth + 0.7 + 4.25;

    return (
        <group ref={groupRef}>
            {stateRef.current.ground.map((g: any) => (
                <group key={g.id}>
                    {/* Track */}
                    <mesh rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[w, 6]} /><meshStandardMaterial color="#dfa276" /></mesh>
                    {/* Guardrails */}
                    <mesh position={[-offset, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[0.7, 6]} /><meshStandardMaterial color="#cf8852" /></mesh>
                    <mesh position={[offset, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[0.7, 6]} /><meshStandardMaterial color="#cf8852" /></mesh>
                    {/* Outer Belts */}
                    <mesh position={[-beltCenter, 0, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[8.5, 6]} /><meshStandardMaterial color="#eeb68e" /></mesh>
                    <mesh position={[beltCenter, 0, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[8.5, 6]} /><meshStandardMaterial color="#eeb68e" /></mesh>
                </group>
            ))}
        </group>
    );
};

const GameLoop = ({ stateRef, difficulty, speedFactor = 1, setGameState, setActiveEnemyIds, setActiveProjectileIds, setActiveParticleIds, setHudState }: any) => {
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        const state = stateRef.current;
        state.timeSurvived += dt * 1000;

        // Survival ramp (arcade only): speed & spawn rate grow up to +50% over ~90s
        const ramp = (window as any)._isNinjaEmbedded
            ? 1
            : Math.min(1.5, 1 + state.timeSurvived / 180000);
        const speedMultiplier = (DIFFICULTY_CONFIG[difficulty as Difficulty].baseSpeed / 18) * ramp * speedFactor; // Normalized to MEDIUM
        const worldMoveDist = MASTER_CONFIG.SPEEDS.worldScrollBase * speedMultiplier * dt;
        const enemyMoveDist = MASTER_CONFIG.SPEEDS.enemyRunBase * (speedMultiplier * 0.8) * dt;
        state.speedRamp = ramp; // read by hero run-cycle speed + camera FOV

        state.ground.forEach((g: any) => {
            g.z += worldMoveDist;
            if (g.z > 15) g.z -= 72;
        });

        state.scenery.forEach((s: any) => {
            s.z += worldMoveDist;
            if (s.z > 12) {
                s.z -= 57;
                s.x = getTreeX();
            }
        });

        state.rocks.forEach((r: any) => {
            r.z += worldMoveDist;
            if (r.z > 12) {
                r.z -= 57;
                r.x = (Math.random() > 0.5 ? 1 : -1) * (3.4 + Math.random() * 1.8);
            }
        });

        let listsChanged = false;

        state.enemies.forEach((e: any) => {
            if (!e.isDead) e.z += (worldMoveDist + enemyMoveDist);
            else {
                e.deathTimer -= dt;
                e.z += worldMoveDist; // Dead bodies scroll naturally
            }
            
            if (e.z >= MASTER_CONFIG.LAYOUT.enemyKillZ && !e.isDead) {
                e.isDead = true;
                e.deathTimer = 0;
                state.lives--;
                state.vignette = 1;
                state.camTrauma = 1;    // camera shake
                state.damageCount++;    // hero flinch animation
                state.streak = 0;
                sfx.playDamage();
                if (state.targetId === e.id) state.targetId = null;
                if (state.lives <= 0) { setGameState("GAME_OVER"); sfx.playDeath(); sfx.stopProceduralBGM(); }
            }
        });

        const oldEnLen = state.enemies.length;
        state.enemies = state.enemies.filter((e: any) => !(e.isDead && e.deathTimer <= 0) && e.z < 12);
        if (state.enemies.length !== oldEnLen) listsChanged = true;

        state.projectiles.forEach((p: any) => {
            if (p.isHit) {
                const target = state.enemies.find((e: any) => e.id === p.targetId);
                if (target) {
                    const dx = target.x - p.x;
                    const dz = target.z - p.z;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist < 2.0) {
                        p.toRemove = true;

                        target.typed += target.word[target.typed.length];
                        target.queuedHits--;
                        target.hitCount++; // enemy flinch animation
                        sfx.playEnemyPop();

                        // spark burst at the impact point
                        for (let i = 0; i < 5; i++) {
                            state.particles.push({
                                id: Math.random().toString(),
                                kind: "spark",
                                x: target.x, y: 1.0, z: target.z + 0.3,
                                vx: (Math.random()-0.5)*8, vy: 2 + Math.random()*5, vz: 2 + Math.random()*4,
                                rx: Math.random()*20, ry: Math.random()*20, grav: 25,
                                life: 0.35, maxLife: 0.35,
                                color: "#fbbf24"
                            });
                        }

                        if (target.typed === target.word) {
                            target.isDead = true;
                            target.deathTimer = 1.4; // full death animation + sink
                            state.camPunch = 1;      // camera kill punch
                            state.streak++;
                            sfx.playEnemyDefeat();

                            // bone shards
                            for(let i=0; i<8; i++) {
                                state.particles.push({
                                    id: Math.random().toString(),
                                    kind: "debris",
                                    x: target.x, y: 1.0, z: target.z,
                                    vx: (Math.random()-0.5)*10, vy: 3 + Math.random()*8, vz: (Math.random()-0.5)*10,
                                    rx: Math.random()*10, ry: Math.random()*10, grav: 18,
                                    life: 1.0, maxLife: 1.0 + Math.random(),
                                    color: "#efe9dc"
                                });
                            }
                            // smoke poof
                            for(let i=0; i<6; i++) {
                                state.particles.push({
                                    id: Math.random().toString(),
                                    kind: "smoke",
                                    x: target.x + (Math.random()-0.5)*0.5, y: 0.5 + Math.random()*0.8, z: target.z,
                                    vx: (Math.random()-0.5)*1.2, vy: 0.8 + Math.random()*0.8, vz: (Math.random()-0.5)*1.2,
                                    rx: 0, ry: 0, grav: 0,
                                    life: 0.8, maxLife: 0.8,
                                    size: 0.5 + Math.random()*0.4,
                                    color: "#d8d2c8"
                                });
                            }
                            state.particles.push({
                                id: Math.random().toString(),
                                x: target.x, y: 2.5, z: target.z,
                                vx: 0, vy: 3, vz: 0, rx: 0, ry: 0,
                                life: 1.5, maxLife: 1.5,
                                isText: true,
                                score: target.word.length * 10
                            });
                            state.score += target.word.length * 10;
                            state.wordsTyped++;
                        } else {
                            // stagger knockback per hit
                            target.z = Math.max(-46, target.z - 0.4);
                        }
                    }
                } else {
                    p.toRemove = true;
                }
            } else {
                p.life -= dt;
                if (p.life <= 0) p.toRemove = true;
            }
        });

        const oldProjLen = state.projectiles.length;
        state.projectiles = state.projectiles.filter((p: any) => !p.toRemove);
        if (state.projectiles.length !== oldProjLen) listsChanged = true;

        state.particles.forEach((p: any) => {
            if (p.grav) p.vy -= p.grav * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.life -= dt;
        });
        const oldPartLen = state.particles.length;
        state.particles = state.particles.filter((p: any) => p.life > 0);
        if (state.particles.length !== oldPartLen) listsChanged = true;

        state.spawnTimer += dt;
        
        const isEmbedded = (window as any)._isNinjaEmbedded;
        
        if (isEmbedded) {
            if (state.embeddedQueue.length > 0 && state.spawnTimer > 1.4 / speedFactor) {
                state.spawnTimer = 0;
                const word = state.embeddedQueue.shift();
                if (word) {
                    state.enemies.push({
                        id: Math.random().toString(),
                        word,
                        typed: "",
                        queuedHits: 0,
                        hitCount: 0,
                        x: -MASTER_CONFIG.LAYOUT.trackWidth + 0.3 + Math.random() * ((MASTER_CONFIG.LAYOUT.trackWidth*2) - 0.6),
                        z: -45,
                        isDead: false,
                        deathTimer: 0
                    });
                    listsChanged = true;
                }
            } else if (state.embeddedQueue.length === 0 && state.enemies.length === 0) {
                // Victory Condition for Embedded
                const triggerVictory = (window as any)._ninjaOnComplete;
                if (triggerVictory) {
                    triggerVictory({
                        correct: state.correctKeystrokes,
                        mistakes: state.totalKeystrokes - state.correctKeystrokes,
                        timeMs: Math.round(state.timeSurvived),
                        perKeyMistakes: {},
                    });
                    // Prevent multiple calls
                    (window as any)._ninjaOnComplete = null;
                }
            }
        } else {
            if (state.spawnTimer > DIFFICULTY_CONFIG[difficulty as Difficulty].spawnInterval / 1000 / ramp) {
                state.spawnTimer = 0;
                const numWords = DIFFICULTY_CONFIG[difficulty as Difficulty].wordsPerEnemy;
                let word = "";
                for (let i=0; i<numWords; i++) {
                    word += WORDS[Math.floor(Math.random() * WORDS.length)];
                    if (i < numWords - 1) word += " ";
                }
                state.enemies.push({
                    id: Math.random().toString(),
                    word,
                    typed: "",
                    queuedHits: 0,
                    hitCount: 0,
                    x: -MASTER_CONFIG.LAYOUT.trackWidth + 0.3 + Math.random() * ((MASTER_CONFIG.LAYOUT.trackWidth*2) - 0.6),
                    z: -45,
                    isDead: false,
                    deathTimer: 0
                });
                listsChanged = true;
            }
        }

        // fxDirty covers particles pushed outside this loop (hero dust puffs)
        if (listsChanged || state.fxDirty) {
            setActiveEnemyIds(state.enemies.map((e: any) => e.id));
            setActiveProjectileIds(state.projectiles.map((e: any) => e.id));
            setActiveParticleIds(state.particles.map((e: any) => e.id));
            state.fxDirty = false;
        }

        if (state.vignette > 0) state.vignette = Math.max(0, state.vignette - dt * 2);
        if (state.redFlash > 0) state.redFlash = Math.max(0, state.redFlash - dt * (0.25 / 0.15)); // fade over 150ms

        state.hudTick += dt;
        if (state.hudTick > 0.05) {
            state.hudTick = 0;
            const minutes = state.timeSurvived / 60000;
            // Standard WPM: 5 characters = 1 word
            const wpm = minutes > 0 ? Math.round(state.correctKeystrokes / 5 / minutes) : 0;
            const acc = state.totalKeystrokes > 0 ? Math.round((state.correctKeystrokes / state.totalKeystrokes)*100) : 0;
            setHudState({ score: state.score, lives: state.lives, wpm, accuracy: acc, vignette: state.vignette, redFlash: state.redFlash, streak: state.streak });
        }
    });
    return null;
};


// --- HTML UI OVERLAYS (HUD, Menus) ---

export default function NinjaWorld({ step, onComplete, isEmbedded }: { step?: any, onComplete?: (stats?: { correct: number; mistakes: number; timeMs: number; perKeyMistakes: Record<string, number> }) => void, isEmbedded?: boolean }) {
    const [gameState, setGameState] = useState<GameState>(isEmbedded ? "PLAYING" : "MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    
    const [activeEnemyIds, setActiveEnemyIds] = useState<string[]>([]);
    const [activeProjectileIds, setActiveProjectileIds] = useState<string[]>([]);
    const [activeParticleIds, setActiveParticleIds] = useState<string[]>([]);
    
    const [hudState, setHudState] = useState({ score: 0, lives: 3, wpm: 0, accuracy: 0, vignette: 0, redFlash: 0, streak: 0 });
    const [highScore, setHighScore] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);

    const [initState] = useState(getInitialState);
    const stateRef = useRef(initState);
    // Keystroke stats recorder (tz-stats-v1) — one session per run
    const statsSession = useRef<StatsSession | null>(null);

    useEffect(() => {
        try {
            setHighScore(Number(localStorage.getItem('tz-ninja-highscore') || 0));
        } catch {}
    }, []);

    // Run ended: flush keystroke stats; standalone runs also log an attempt
    // (embedded runs are recorded by the lesson page instead).
    useEffect(() => {
        if (gameState !== 'GAME_OVER') return;
        statsSession.current?.end();
        statsSession.current = null;
        if (isEmbedded) return;
        const s = stateRef.current;
        const minutes = s.timeSurvived / 60000;
        recordAttempt({
            lessonId: "typing-ninja",
            type: "game",
            wpm: minutes > 0 ? Math.round(s.correctKeystrokes / 5 / minutes) : 0,
            accuracy: s.totalKeystrokes > 0 ? Math.round((s.correctKeystrokes / s.totalKeystrokes) * 100) : 0,
            stars: 0,
            timeMs: Math.round(s.timeSurvived),
            errors: s.totalKeystrokes - s.correctKeystrokes,
            problemKeys: {},
        });
    }, [gameState, isEmbedded]);

    useEffect(() => {
        if (gameState !== 'GAME_OVER' || isEmbedded) return;
        const final = stateRef.current.score;
        setIsNewRecord(final > 0 && final > highScore);
        if (final > highScore) {
            setHighScore(final);
            try {
                localStorage.setItem('tz-ninja-highscore', String(final));
            } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, isEmbedded]);

    const startGame = useCallback((diff: Difficulty) => {
        sfx.init();
        sfx.resume();
        statsSession.current?.end();
        statsSession.current = createStatsSession();
        setDifficulty(diff);
        setGameState("PLAYING");
        sfx.startProceduralBGM(() => {
            return 1 + Math.floor(stateRef.current.wordsTyped / 10) * 0.15;
        });

        const state = stateRef.current;
        state.enemies = [];
        state.projectiles = [];
        state.particles = [];
        state.targetId = null;
        state.spawnTimer = 0;
        state.score = 0;
        state.lives = 3;
        state.wordsTyped = 0;
        state.correctKeystrokes = 0;
        state.totalKeystrokes = 0;
        state.timeSurvived = 0;
        state.hudTick = 0;
        state.vignette = 0;
        state.redFlash = 0;
        state.throwCount = 0;
        state.damageCount = 0;
        state.streak = 0;
        state.camTrauma = 0;
        state.camPunch = 0;
        state.speedRamp = 1;
        state.fxDirty = false;

        if (isEmbedded && step) {
            state.embeddedQueue = [...step.content];
            state.embeddedMistakes = 0;
            (window as any)._isNinjaEmbedded = true;
            (window as any)._ninjaOnComplete = onComplete;
        } else {
            (window as any)._isNinjaEmbedded = false;
        }
        
        setActiveEnemyIds([]);
        setActiveProjectileIds([]);
        setActiveParticleIds([]);
        setHudState({ score: 0, lives: 3, wpm: 0, accuracy: 0, vignette: 0, redFlash: 0, streak: 0 });
    }, [isEmbedded, step, onComplete]);

    useEffect(() => {
        if (isEmbedded && step) {
            startGame("MEDIUM");
        }
    }, [isEmbedded, step, startGame]);

    // --- KEYBOARD LOGIC ---
    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();
            sfx.playKeyTap();

            const char = e.key.toLowerCase();
            const state = stateRef.current;
            state.totalKeystrokes++;

            const handleMiss = () => {
                state.vignette = 1.0;
                state.redFlash = 1.0;
                state.streak = 0; // typo breaks the combo
                state.camTrauma = Math.max(state.camTrauma, 0.3);
                state.throwCount++; // arm still snaps — the throw just goes wild
                sfx.playTypo();

                if (isEmbedded && step && step.rules) {
                    state.embeddedMistakes++;
                    if (state.embeddedMistakes > step.rules.maxMistakesAllowed) {
                        setGameState("GAME_OVER");
                        sfx.stopProceduralBGM();
                    }
                }

                const hand = state.heroHandPos;
                const pid = Math.random().toString();
                state.projectiles.push({
                    id: pid, isHit: false,
                    x: hand.x, y: hand.y, z: hand.z,
                    vx: (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random()*10),
                    vy: Math.random() * 5,
                    vz: -20 - Math.random()*10,
                    life: 2.0,
                    toRemove: false
                });
                setActiveProjectileIds((prev: any) => [...prev, pid]);
            };

            if (state.targetId) {
                const target = state.enemies.find((en: any) => en.id === state.targetId);
                if (target && !target.isDead) {
                    const expectedIndex = target.typed.length + target.queuedHits;
                    if (expectedIndex < target.word.length) {
                        if (char === target.word[expectedIndex].toLowerCase()) {
                            target.queuedHits++;
                            state.correctKeystrokes++;
                            statsSession.current?.stroke(char, true);
                            state.throwCount++;
                            const pid = Math.random().toString();
                            state.projectiles.push({ id: pid, isHit: true, targetId: target.id, x: state.heroHandPos.x, y: state.heroHandPos.y, z: state.heroHandPos.z, toRemove: false });
                            setActiveProjectileIds((prev: any) => [...prev, pid]);
                            sfx.playWordLaunch();
                            
                            if (target.queuedHits + target.typed.length === target.word.length) {
                                state.targetId = null;
                            }
                        } else {
                            // Check if the key matches the next letter of ANY OTHER word on screen
                            const valid = state.enemies.filter((e: any) => {
                                if (e.isDead || e.id === target.id) return false;
                                const expectedIdx = e.typed.length + e.queuedHits;
                                return expectedIdx < e.word.length && e.word[expectedIdx].toLowerCase() === char;
                            });

                            if (valid.length > 0) {
                                // Switch target lock
                                valid.sort((a: any, b: any) => b.z - a.z);
                                const newTarget = valid[0];
                                state.targetId = newTarget.id;
                                newTarget.queuedHits++;
                                state.correctKeystrokes++;
                                statsSession.current?.stroke(char, true);
                                state.throwCount++;
                                const pid = Math.random().toString();
                                state.projectiles.push({ id: pid, isHit: true, targetId: newTarget.id, x: state.heroHandPos.x, y: state.heroHandPos.y, z: state.heroHandPos.z, toRemove: false });
                                setActiveProjectileIds((prev: any) => [...prev, pid]);
                                sfx.playWordLaunch();

                                if (newTarget.queuedHits + newTarget.typed.length === newTarget.word.length) {
                                    state.targetId = null;
                                }
                            } else {
                                // Wrong key with a locked target — the expected
                                // letter is known, so the miss is attributable
                                statsSession.current?.stroke(
                                    target.word[expectedIndex].toLowerCase(),
                                    false,
                                );
                                handleMiss();
                            }
                        }
                    }
                } else {
                    state.targetId = null;
                }
            } else {
                // No current target, find any valid word
                const valid = state.enemies.filter((e: any) => {
                    if (e.isDead) return false;
                    const expectedIdx = e.typed.length + e.queuedHits;
                    return expectedIdx < e.word.length && e.word[expectedIdx].toLowerCase() === char;
                });
                
                if (valid.length > 0) {
                    valid.sort((a: any, b: any) => b.z - a.z);
                    const target = valid[0];
                    state.targetId = target.id;
                    target.queuedHits++;
                    state.correctKeystrokes++;
                    statsSession.current?.stroke(char, true);
                    state.throwCount++;
                    const pid = Math.random().toString();
                    state.projectiles.push({ id: pid, isHit: true, targetId: target.id, x: state.heroHandPos.x, y: state.heroHandPos.y, z: state.heroHandPos.z, toRemove: false });
                    setActiveProjectileIds((prev: any) => [...prev, pid]);
                    sfx.playWordLaunch();
                    
                    if (target.queuedHits + target.typed.length === target.word.length) {
                        state.targetId = null;
                    }
                } else {
                    handleMiss();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, isEmbedded, step]);

    // --- GAME CONTROL KEYS (Esc = pause/resume, Enter = restart) ---
    useEffect(() => {
        const handleControlKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (gameState === 'PLAYING') { sfx.audioCtx?.suspend(); setGameState('PAUSED'); }
                else if (gameState === 'PAUSED') { sfx.resume(); setGameState('PLAYING'); }
            } else if (e.key === 'Enter' && gameState === 'GAME_OVER') {
                startGame(difficulty);
            }
        };
        window.addEventListener('keydown', handleControlKey);
        return () => window.removeEventListener('keydown', handleControlKey);
    }, [gameState, difficulty, startGame]);

    // --- CLEANUP ON UNMOUNT (stop music, release globals) ---
    useEffect(() => {
        return () => {
            sfx.stopProceduralBGM();
            sfx.audioCtx?.suspend();
            statsSession.current?.end();
            (window as any)._isNinjaEmbedded = false;
            (window as any)._ninjaOnComplete = null;
        };
    }, []);

    const heroMode: HeroMode =
        gameState === 'PLAYING' ? 'run'
        : gameState === 'PAUSED' ? 'frozen'
        : gameState === 'GAME_OVER' ? 'dead'
        : 'idle';

    return (
        <div className="w-full h-full relative bg-[#f4e0c5]">
            <Canvas>
                <CameraRig stateRef={stateRef} />
                <fog attach="fog" args={['#f4e0c5', 20, 50]} />
                <ambientLight intensity={0.55} />
                <hemisphereLight args={['#bfe0ee', '#e8c49a', 0.55]} />
                <directionalLight position={[10, 20, 15]} intensity={1.0} color="#fff3e0" />

                <Suspense fallback={null}>
                    <SkyDome />
                    <Mountains />
                    <Clouds />
                    <GroundLayer stateRef={stateRef} />
                    <InstancedScenery stateRef={stateRef} />

                    <group position={[0, 0, MASTER_CONFIG.LAYOUT.playerZ]} scale={MASTER_CONFIG.SCALES.playerNinja}>
                        <HeroNinja
                            stateRef={stateRef}
                            mode={heroMode}
                            onFootstep={(right: boolean) => sfx.playFootstep(right)}
                        />
                    </group>

                    {activeEnemyIds.map(id => <EnemyNode key={id} enemyId={id} stateRef={stateRef} isPaused={gameState !== 'PLAYING'} />)}
                    {activeProjectileIds.map(id => <ProjectileNode key={id} pid={id} stateRef={stateRef} />)}
                    {activeParticleIds.map(id => <ParticleNode key={id} pid={id} stateRef={stateRef} />)}
                </Suspense>

                {gameState === 'PLAYING' && (
                    <GameLoop
                        stateRef={stateRef}
                        difficulty={difficulty}
                        speedFactor={isEmbedded ? (step?.rules?.gameSpeed ?? 1) : 1}
                        setGameState={setGameState}
                        setActiveEnemyIds={setActiveEnemyIds}
                        setActiveProjectileIds={setActiveProjectileIds}
                        setActiveParticleIds={setActiveParticleIds}
                        setHudState={setHudState}
                    />
                )}
            </Canvas>

            {/* Viewport Damage Overlays */}
            <div className="pointer-events-none absolute inset-0 z-40 transition-colors duration-100" style={{ boxShadow: hudState.vignette > 0 ? `inset 0 0 ${hudState.vignette * 150}px rgba(220,38,38,${hudState.vignette})` : 'none' }} />
            <div className="absolute inset-0 bg-red-500 pointer-events-none transition-opacity duration-150 z-40" style={{ opacity: hudState.redFlash }} />

            {/* HUD */}
            {gameState === 'PLAYING' && (
                <>
                    <div className="absolute top-6 left-6 z-50 pointer-events-none flex flex-wrap gap-2 font-sans">
                        <div className="bg-[#fff6e6]/95 backdrop-blur border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(61,42,33,0.9)]">
                            <span className="text-[10px] font-black text-[#a08768] uppercase tracking-widest">Score</span>
                            <span className="font-mono font-black text-[#3d2a21]">{hudState.score}</span>
                        </div>
                        <div className="bg-[#fff6e6]/95 backdrop-blur border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(61,42,33,0.9)]">
                            <span className="text-[10px] font-black text-[#a08768] uppercase tracking-widest">WPM</span>
                            <span className="font-mono font-black text-[#3d2a21]">{hudState.wpm}</span>
                        </div>
                        <div className="bg-[#fff6e6]/95 backdrop-blur border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(61,42,33,0.9)]">
                            <span className="text-[10px] font-black text-[#a08768] uppercase tracking-widest">Acc</span>
                            <span className="font-mono font-black text-[#3d2a21]">{hudState.accuracy}%</span>
                        </div>
                        {hudState.streak >= 3 && (
                            <div className="bg-amber-400/95 backdrop-blur border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_3px_0_rgba(61,42,33,0.9)] animate-in zoom-in duration-200 -rotate-2">
                                <span className="text-sm">🔥</span>
                                <span className="font-mono font-black text-[#3d2a21]">×{hudState.streak}</span>
                            </div>
                        )}
                    </div>

                    {!isEmbedded && (
                        <div className="absolute top-6 right-6 z-50 pointer-events-none flex gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-6 h-6 rounded-sm border-2 border-[#3d2a21] ${i < hudState.lives ? 'bg-red-500 shadow-[2px_2px_0_rgba(61,42,33,0.9)]' : 'bg-[#554e44] opacity-60'} rotate-45 mx-1 transition-all duration-300`} />
                            ))}
                        </div>
                    )}

                    <div className="absolute top-20 right-6 z-50 flex gap-2 font-sans">
                        <button title="Pause (Esc)" onClick={() => { sfx.audioCtx?.suspend(); setGameState('PAUSED'); }} className="bg-[#fff6e6]/95 backdrop-blur border-2 border-[#3d2a21] text-[#3d2a21] px-4 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(61,42,33,0.9)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                            Pause <span className="text-[#a08768] font-mono text-xs">Esc</span>
                        </button>
                        {!isEmbedded && (
                            <a title="Quit" href="/games" className="bg-[#fff6e6]/95 backdrop-blur border-2 border-[#3d2a21] text-red-500 px-4 py-2 rounded-xl font-black text-sm shadow-[0_3px_0_rgba(61,42,33,0.9)] hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Quit
                            </a>
                        )}
                    </div>

                </>
            )}

            {/* GAME OVER */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-[#2a1c15]/70 backdrop-blur-sm flex items-center justify-center font-sans">
                    <div className="w-[400px] max-w-[92%] bg-[#fff6e6] rounded-[28px] border-4 border-[#3d2a21] shadow-[0_10px_0_#3d2a21,0_28px_60px_rgba(0,0,0,0.35)] p-8 flex flex-col items-center animate-in zoom-in duration-300">
                        <h1 className="text-3xl font-black tracking-tight text-[#3d2a21] mb-5">💥 Game Over</h1>
                        {isNewRecord && !isEmbedded && (
                            <p className="-mt-3 mb-4 px-3 py-1 bg-amber-300 border-2 border-[#3d2a21] rounded-full text-xs font-black text-[#3d2a21] -rotate-2 shadow-[0_2px_0_#3d2a21]">★ New record!</p>
                        )}

                        {!isEmbedded && (
                            <div className="grid grid-cols-4 gap-2 w-full mb-6">
                                {[
                                    { label: 'Score', value: String(hudState.score), tint: 'bg-amber-200' },
                                    { label: 'Best', value: String(highScore), tint: 'bg-violet-200' },
                                    { label: 'WPM', value: String(hudState.wpm), tint: 'bg-sky-200' },
                                    { label: 'Acc', value: `${hudState.accuracy}%`, tint: 'bg-emerald-200' },
                                ].map((s) => (
                                    <div key={s.label} className={`flex flex-col items-center ${s.tint} border-2 border-[#3d2a21] rounded-2xl px-2 py-3 shadow-[0_3px_0_#3d2a21]`}>
                                        <span className="font-mono text-lg font-black text-[#3d2a21]">{s.value}</span>
                                        <span className="text-[9px] uppercase tracking-widest text-[#3d2a21]/60 font-black mt-0.5">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => startGame(difficulty)}
                            className="w-full py-3.5 bg-emerald-500 text-white font-black text-sm tracking-wide rounded-2xl border-2 border-b-[6px] border-[#3d2a21] [text-shadow:0_1px_0_rgba(61,42,33,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                        >
                            {isEmbedded ? 'Retry' : 'Play Again'} <span className="text-white/80 font-mono text-xs ml-1">Enter ↵</span>
                        </button>

                        {!isEmbedded && (
                            <div className="flex items-center gap-5 mt-4 text-sm">
                                <button onClick={() => setGameState("MENU")} className="font-bold text-[#8a7563] hover:text-[#3d2a21] underline decoration-2 decoration-[#e0c9a6] underline-offset-4 hover:decoration-amber-400 transition-colors">
                                    Menu
                                </button>
                                <a href="/games" className="font-bold text-red-500 hover:text-red-600 underline decoration-2 decoration-[#e0c9a6] underline-offset-4 hover:decoration-red-300 transition-colors">
                                    Quit
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {gameState !== 'PLAYING' && gameState !== 'GAME_OVER' && (
                <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-[#2a1c15]/60 backdrop-blur-sm font-sans">
                    <div className="w-[380px] max-w-[92%] bg-[#fff6e6] rounded-[28px] border-4 border-[#3d2a21] shadow-[0_10px_0_#3d2a21,0_28px_60px_rgba(0,0,0,0.35)] p-7 relative flex flex-col items-center animate-in zoom-in duration-300">
                        <button
                            onClick={() => { setIsMuted(sfx.toggleMute()); }}
                            title={isMuted ? 'Unmute' : 'Mute'}
                            className="absolute -top-3 -right-3 bg-[#fff6e6] text-[#3d2a21] border-2 border-[#3d2a21] w-11 h-11 rounded-full shadow-[0_3px_0_#3d2a21] hover:brightness-105 active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center z-10"
                        >
                            {isMuted ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
                            ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            )}
                        </button>

                        <Mascot mood={gameState === 'MENU' ? 'focused' : 'happy'} className="w-20 h-20 -mt-2 mb-2" />
                        <h2 className="text-3xl font-black tracking-tight text-[#3d2a21]">
                            {gameState === 'MENU' ? <>Typing <span className="text-red-500">Ninja</span></> : 'Paused'}
                        </h2>

                        {gameState === 'MENU' && (
                            <>
                                <p className="text-sm font-medium text-[#8a7563] text-center leading-snug mt-2 mb-1">
                                    Type the word — stop the minions!
                                </p>
                                {highScore > 0 && (
                                    <p className="mt-1 mb-1 px-3 py-1 bg-amber-300 border-2 border-[#3d2a21] rounded-full text-xs font-black text-[#3d2a21] -rotate-1 shadow-[0_2px_0_#3d2a21]">
                                        ★ Best: {highScore}
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex flex-col gap-3 mt-4 w-full">
                            {gameState === 'MENU' && (
                                <>
                                    {([
                                        ['EASY', '🌱', 'bg-emerald-500'],
                                        ['MEDIUM', '⚡', 'bg-amber-500'],
                                        ['HARD', '🔥', 'bg-red-500'],
                                    ] as const).map(([diff, emoji, tint]) => (
                                        <button
                                            key={diff}
                                            onClick={() => startGame(diff as Difficulty)}
                                            className={`w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] ${tint} font-black text-sm tracking-widest text-white [text-shadow:0_1px_0_rgba(61,42,33,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2.5`}
                                        >
                                            <span className="text-base [text-shadow:none]">{emoji}</span>
                                            {diff}
                                        </button>
                                    ))}
                                    {!isEmbedded && (
                                        <a
                                            href="/games"
                                            className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] bg-[#fff6e6] text-red-500 font-black text-sm tracking-wide text-center hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                        >
                                            Quit
                                        </a>
                                    )}
                                </>
                            )}

                            {gameState === 'PAUSED' && (
                                <>
                                    <button
                                        onClick={() => { sfx.resume(); setGameState('PLAYING'); }}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] bg-emerald-500 text-white font-black text-sm tracking-wide [text-shadow:0_1px_0_rgba(61,42,33,0.4)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Continue <span className="text-white/80 font-mono text-xs ml-1">Esc</span>
                                    </button>
                                    <button
                                        onClick={() => startGame(difficulty)}
                                        className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] bg-[#ffe9c7] text-[#3d2a21] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                    >
                                        Restart
                                    </button>
                                    {!isEmbedded && (
                                        <>
                                            <button
                                                onClick={() => setGameState('MENU')}
                                                className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] bg-[#fff6e6] text-[#3d2a21] font-black text-sm tracking-wide hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:border-b-2 transition-all"
                                            >
                                                Menu
                                            </button>
                                            <button
                                                onClick={() => { window.location.href = '/games'; }}
                                                className="w-full py-3 rounded-2xl border-2 border-b-[6px] border-[#3d2a21] bg-[#fff6e6] text-red-500 font-black text-sm tracking-wide hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-1 active:border-b-2 transition-all"
                                            >
                                                Quit
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
