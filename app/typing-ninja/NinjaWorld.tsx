/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import { StepNode } from "../../types/lesson";

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
    embeddedQueue: [] as string[]
});

// --- PROCEDURAL 3D MODELS (Trees, Ninjas, Shurikens) ---

// =========================================================================
// 🥷 NINJA APPEARANCE BLOCK 🥷
// Modify the geometries and materials here to change how the ninjas look!
// The 'isPlayer' boolean controls the Hero ninja vs the Opponent ninjas.
// =========================================================================
const MinionHero = ({ position, scale, isPlayer, wordTag }: any) => {
    const leftLegRef = useRef<THREE.Group>(null!);
    const rightLegRef = useRef<THREE.Group>(null!);
    const upperBodyRef = useRef<THREE.Group>(null!);
    const leftArmRef = useRef<THREE.Group>(null!);
    const rightArmRef = useRef<THREE.Group>(null!);

    const phaseRef = useRef(0);
    const colors = isPlayer ? {
        body: "#FCE588", overalls: "#2563EB", strap: "#111827", headband: "#ef4444"
    } : {
        body: "#FCE588", overalls: "#1E293B", strap: "#374151", headband: "#DC2626"
    };

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * (MASTER_CONFIG.SPEEDS.playerAnimRunRate * 1.2);
        
        if (leftLegRef.current && rightLegRef.current) {
            const leftRot = Math.sin(t) * 0.6;
            const rightRot = Math.sin(t + Math.PI) * 0.6;
            leftLegRef.current.rotation.x = leftRot;
            rightLegRef.current.rotation.x = rightRot;
            
            // Detect maximum forward extension (peak of Math.sin)
            const phase = t % (Math.PI * 2);
            if (phaseRef.current < Math.PI/2 && phase >= Math.PI/2) sfx.playFootstep(false);
            if (phaseRef.current < 3*Math.PI/2 && phase >= 3*Math.PI/2) sfx.playFootstep(true);
            if (phase < phaseRef.current && phase >= Math.PI/2) sfx.playFootstep(false);
            phaseRef.current = phase;
        }
        if (upperBodyRef.current) {
            upperBodyRef.current.position.y = 0; // Lock vertical height
            upperBodyRef.current.rotation.z = Math.cos(t * 0.5) * 0.03; // Buttery-smooth sway
        }
        if (leftArmRef.current && rightArmRef.current) {
            if (isPlayer) {
                leftArmRef.current.rotation.x = Math.sin(t + Math.PI) * 0.4;
                rightArmRef.current.rotation.x = -Math.PI / 4; 
            } else {
                leftArmRef.current.rotation.x = -Math.PI/2 + Math.sin(t*2) * 0.2;
                rightArmRef.current.rotation.x = -Math.PI/2 + Math.sin(t*2 + 0.5) * 0.2;
            }
        }
    });

    const radius = MASTER_CONFIG.SCALES.minionRadius || 0.39;

    return (
        <group position={position} scale={scale}>
            {/* PROCEDURAL RUNNING ENGINE (LEGS) */}
            <group ref={leftLegRef} position={[-0.18, 0.35, 0]}>
                <mesh position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
            </group>
            <group ref={rightLegRef} position={[0.18, 0.35, 0]}>
                <mesh position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
            </group>

            {/* UPPER BODY (Smooth Sway) */}
            <group ref={upperBodyRef}>
                {/* 1. HIGH-POLY CAPSULE */}
                <mesh position={[0, 0.75, 0]}>
                    <capsuleGeometry args={[radius, 0.5, 8, 32]} />
                    <meshStandardMaterial color={colors.body} />
                </mesh>

                {/* 2. OVERALLS "BIB & STRAP" ARCHITECTURE */}
                <mesh position={[0, 0.52, 0]}>
                    <cylinderGeometry args={[0.41, radius, 0.45, 32, 1, true]} />
                    <meshStandardMaterial color={colors.overalls} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0.72, radius + 0.02]}>
                    <boxGeometry args={[0.38, 0.28, 0.04]} />
                    <meshStandardMaterial color={colors.overalls} />
                </mesh>
                <mesh position={[-0.14, 0.86, 0]} rotation={[0.4, 0, 0]}>
                    <boxGeometry args={[0.08, 0.3, 0.02]} />
                    <meshStandardMaterial color={colors.overalls} />
                </mesh>
                <mesh position={[0.14, 0.86, 0]} rotation={[0.4, 0, 0]}>
                    <boxGeometry args={[0.08, 0.3, 0.02]} />
                    <meshStandardMaterial color={colors.overalls} />
                </mesh>
                <mesh position={[-0.14, 0.8, radius + 0.03]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color="#0F172A" />
                </mesh>
                <mesh position={[0.14, 0.8, radius + 0.03]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color="#0F172A" />
                </mesh>

                {/* Rubber Strap (Wraps head) */}
                <mesh position={[0, 0.92, 0]}>
                    <cylinderGeometry args={[radius + 0.015, radius + 0.015, 0.12, 32, 1, true]} />
                    <meshStandardMaterial color={colors.strap} side={THREE.DoubleSide} />
                </mesh>

                {/* FRONT / BACK RENDERING LOGIC */}
                {isPlayer ? (
                    // HERO: Back of head only.
                    <group position={[0, 0.92, 0]}>
                        {/* Rear Red Headband Knot */}
                        <mesh position={[0, 0, -(radius + 0.02)]}>
                            <sphereGeometry args={[0.08, 8, 8]} />
                            <meshStandardMaterial color={colors.headband} />
                        </mesh>
                        {/* Fluttering Ribbons */}
                        <mesh position={[-0.1, -0.1, -(radius + 0.06)]} rotation={[0.2, -0.4, 0.2]}>
                            <boxGeometry args={[0.04, 0.25, 0.02]} />
                            <meshStandardMaterial color={colors.headband} />
                        </mesh>
                        <mesh position={[0.1, -0.15, -(radius + 0.06)]} rotation={[0.3, 0.4, -0.2]}>
                            <boxGeometry args={[0.04, 0.3, 0.02]} />
                            <meshStandardMaterial color={colors.headband} />
                        </mesh>
                    </group>
                ) : (
                    // ENEMY: Front-facing details.
                    <group position={[0, 0.92, 0]}>
                        {/* Metallic Rim */}
                        <mesh position={[0, 0, radius - 0.02]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.22, 0.22, 0.1, 32]} />
                            <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
                        </mesh>
                        {/* Sclera (White Eyeball) */}
                        <mesh position={[0, 0, radius - 0.02]}>
                            <sphereGeometry args={[0.18, 32, 32]} />
                            <meshStandardMaterial color="#FFFFFF" />
                            
                            {/* Angry Iris */}
                            <mesh position={[0, 0, 0.16]}>
                                <sphereGeometry args={[0.07, 16, 16]} />
                                <meshBasicMaterial color="#DC2626" />
                                
                                {/* Pupil */}
                                <mesh position={[0, 0, 0.07]}>
                                    <sphereGeometry args={[0.04, 16, 16]} />
                                    <meshStandardMaterial color="#000000" />
                                    
                                    {/* Specular Catchlight */}
                                    <mesh position={[0.015, 0.015, 0.035]}>
                                        <sphereGeometry args={[0.015, 8, 8]} />
                                        <meshBasicMaterial color="#FFFFFF" />
                                    </mesh>
                                </mesh>
                            </mesh>
                        </mesh>

                        {/* Face slit */}
                        <mesh position={[0, -0.18, radius + 0.01]}>
                            <boxGeometry args={[0.4, 0.08, 0.02]} />
                            <meshStandardMaterial color="#000000" />
                        </mesh>

                        {/* Headband Ribbons blowing backward away from camera */}
                        <mesh position={[-0.1, 0, -(radius + 0.06)]} rotation={[-0.2, 0.4, 0.2]}>
                            <boxGeometry args={[0.04, 0.25, 0.02]} />
                            <meshStandardMaterial color={colors.headband} />
                        </mesh>
                        <mesh position={[0.1, 0.05, -(radius + 0.06)]} rotation={[-0.3, -0.4, -0.2]}>
                            <boxGeometry args={[0.04, 0.3, 0.02]} />
                            <meshStandardMaterial color={colors.headband} />
                        </mesh>
                    </group>
                )}

                {/* 4. COMEDIC HAIR SPROUTS */}
                <group position={[0, 1.25, 0]}>
                    {isPlayer ? (
                        <>
                            <mesh rotation={[0, 0, -0.15]} position={[-0.05, 0.08, 0]}><cylinderGeometry args={[0.008, 0.008, 0.16, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[0, 0, 0]} position={[0, 0.09, 0]}><cylinderGeometry args={[0.008, 0.008, 0.18, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[0, 0, 0.15]} position={[0.05, 0.08, 0]}><cylinderGeometry args={[0.008, 0.008, 0.16, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                        </>
                    ) : (
                        // Frizzy Evil Hair
                        <>
                            <mesh rotation={[0.2, 0, -0.3]} position={[-0.08, 0.1, 0.05]}><cylinderGeometry args={[0.006, 0.006, 0.2, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[-0.1, 0, -0.1]} position={[-0.04, 0.12, -0.02]}><cylinderGeometry args={[0.006, 0.006, 0.24, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[0, 0, 0]} position={[0, 0.14, 0]}><cylinderGeometry args={[0.006, 0.006, 0.28, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[0.1, 0, 0.2]} position={[0.04, 0.12, 0.02]}><cylinderGeometry args={[0.006, 0.006, 0.24, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                            <mesh rotation={[-0.2, 0, 0.3]} position={[0.08, 0.1, -0.05]}><cylinderGeometry args={[0.006, 0.006, 0.2, 8]} /><meshStandardMaterial color="#111827" /></mesh>
                        </>
                    )}
                </group>

                {/* 5. ANGLED ARMS & RUBBER GLOVES */}
                <group ref={leftArmRef} position={[-(radius + 0.03), 0.78, 0]}>
                    <group rotation={[0, 0, 0.4]}>
                        <mesh position={[0, -0.2, 0]}>
                            <cylinderGeometry args={[0.08, 0.06, 0.4, 16]} />
                            <meshStandardMaterial color={colors.body} />
                        </mesh>
                        <mesh position={[0, -0.45, 0]}>
                            <sphereGeometry args={[0.09, 16, 16]} />
                            <meshStandardMaterial color="#111827" />
                        </mesh>
                    </group>
                </group>

                <group ref={rightArmRef} position={[(radius + 0.03), 0.78, 0]}>
                    <group rotation={[0, 0, -0.4]}>
                        <mesh position={[0, -0.2, 0]}>
                            <cylinderGeometry args={[0.08, 0.06, 0.4, 16]} />
                            <meshStandardMaterial color={colors.body} />
                        </mesh>
                        <mesh position={[0, -0.45, 0]}>
                            <sphereGeometry args={[0.09, 16, 16]} />
                            <meshStandardMaterial color="#111827" />
                        </mesh>
                        {isPlayer && (
                            /* Katana */
                            <mesh position={[0, -0.45, 0.4]} rotation={[Math.PI/2, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.1} />
                            </mesh>
                        )}
                    </group>
                </group>
            </group>

            {/* HTML WORD PILL MOUNT (Unaffected by body sway) */}
            {wordTag && (
                <group position={[0, 2.8, 0]}>
                    {wordTag}
                </group>
            )}
        </group>
    );
};

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
        meshRef.current.position.set(e.x, 0, e.z);
        if (e.isDead) {
          meshRef.current.scale.setScalar(Math.max(0, e.deathTimer));
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
            <MinionHero 
                position={[0, 0, 0]} 
                isPlayer={false} 
                wordTag={!isPaused && textState.show && (
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
                )} 
            />
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
        </group>
    );
};

const ParticleNode = ({ pid, stateRef }: any) => {
    const meshRef = useRef<THREE.Group>(null!);
    const [textProps, setTextProps] = useState<any>(null);
    useFrame((_, delta) => {
        const p = stateRef.current.particles.find((x: any) => x.id === pid);
        if (p && meshRef.current) {
            meshRef.current.position.set(p.x, p.y, p.z);
            if (p.isText) {
                if (!textProps) setTextProps({ score: p.score, maxLife: p.maxLife });
            } else {
                meshRef.current.rotation.x += p.rx * delta;
                meshRef.current.rotation.y += p.ry * delta;
                meshRef.current.scale.setScalar(Math.max(0, p.life / p.maxLife));
            }
        }
    });

    return (
        <group ref={meshRef}>
            {textProps ? (
                <Html center distanceFactor={10}>
                    <div className="text-amber-400 font-black text-2xl drop-shadow-md">+{textProps.score}</div>
                </Html>
            ) : (
                <mesh>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshBasicMaterial color="#f97316" />
                </mesh>
            )}
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

const SceneryLayer = ({ stateRef }: any) => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(() => {
        if (!groupRef.current) return;
        const children = groupRef.current.children;
        const sc = stateRef.current.scenery;
        for (let i = 0; i < children.length; i++) {
            children[i].position.z = sc[i].z;
            children[i].position.x = sc[i].x;
        }
    });

    return (
        <group ref={groupRef}>
            {stateRef.current.scenery.map((s: any) => (
                <group key={s.id} scale={s.isStump ? MASTER_CONFIG.SCALES.stump : MASTER_CONFIG.SCALES.pineTree}>
                    {s.isStump ? (
                        <mesh position={[0, 0.2, 0]}>
                            <cylinderGeometry args={[0.2, 0.4, 0.8, 5]} />
                            <meshStandardMaterial color="#825229" flatShading />
                        </mesh>
                    ) : (
                        <>
                            <mesh position={[0, 0.2, 0]}>
                                <cylinderGeometry args={[0.2, 0.4, 0.8, 5]} />
                                <meshStandardMaterial color="#825229" flatShading />
                            </mesh>
                            <mesh position={[0, 1.6, 0]}>
                                <coneGeometry args={[2.5, 3, 5]} />
                                <meshStandardMaterial color={s.mainColor} flatShading />
                            </mesh>
                            <mesh position={[0, 3.2, 0]}>
                                <coneGeometry args={[2, 2.5, 5]} />
                                <meshStandardMaterial color={s.mainColor} flatShading />
                            </mesh>
                            <mesh position={[0, 4.4, 0]}>
                                <coneGeometry args={[1.5, 2, 5]} />
                                <meshStandardMaterial color={s.mainColor} flatShading />
                            </mesh>
                        </>
                    )}
                </group>
            ))}
        </group>
    );
};

// --- R3F SCENE GRAPH & GAME LOOP ---

const CamSetup = () => {
    const camRef = useRef<any>(null!);
    useEffect(() => {
        camRef.current.lookAt(0, 1.5, 2);
    }, []);
    return <PerspectiveCamera ref={camRef} makeDefault position={[0, 4.5, 11]} fov={48} />;
};

const GameLoop = ({ stateRef, difficulty, setGameState, setActiveEnemyIds, setActiveProjectileIds, setActiveParticleIds, setHudState }: any) => {
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        const state = stateRef.current;
        state.timeSurvived += dt * 1000;

        const speedMultiplier = DIFFICULTY_CONFIG[difficulty as Difficulty].baseSpeed / 18; // Normalized to MEDIUM
        const worldMoveDist = MASTER_CONFIG.SPEEDS.worldScrollBase * speedMultiplier * dt;
        const enemyMoveDist = MASTER_CONFIG.SPEEDS.enemyRunBase * (speedMultiplier * 0.8) * dt;

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
                sfx.playDamage();
                if (state.targetId === e.id) state.targetId = null;
                if (state.lives <= 0) { setGameState("GAME_OVER"); sfx.playDeath(); }
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
                        sfx.playEnemyPop();

                        if (target.typed === target.word) {
                            target.isDead = true;
                            target.deathTimer = 1;
                            sfx.playEnemyDefeat();
                            
                            for(let i=0; i<10; i++) {
                                state.particles.push({
                                    id: Math.random().toString(),
                                    x: target.x, y: 1.0, z: target.z,
                                    vx: (Math.random()-0.5)*15, vy: Math.random()*15, vz: (Math.random()-0.5)*15,
                                    rx: Math.random()*10, ry: Math.random()*10,
                                    life: 1.0, maxLife: 1.0 + Math.random(),
                                    isText: false
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
            if (state.embeddedQueue.length > 0 && state.spawnTimer > 1.4) {
                state.spawnTimer = 0;
                const word = state.embeddedQueue.shift();
                if (word) {
                    state.enemies.push({
                        id: Math.random().toString(),
                        word,
                        typed: "",
                        queuedHits: 0,
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
                    triggerVictory();
                    // Prevent multiple calls
                    (window as any)._ninjaOnComplete = null; 
                }
            }
        } else {
            if (state.spawnTimer > DIFFICULTY_CONFIG[difficulty as Difficulty].spawnInterval / 1000) {
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
                    x: -MASTER_CONFIG.LAYOUT.trackWidth + 0.3 + Math.random() * ((MASTER_CONFIG.LAYOUT.trackWidth*2) - 0.6),
                    z: -45,
                    isDead: false,
                    deathTimer: 0
                });
                listsChanged = true;
            }
        }

        if (listsChanged) {
            setActiveEnemyIds(state.enemies.map((e: any) => e.id));
            setActiveProjectileIds(state.projectiles.map((e: any) => e.id));
            setActiveParticleIds(state.particles.map((e: any) => e.id));
        }

        if (state.vignette > 0) state.vignette = Math.max(0, state.vignette - dt * 2);
        if (state.redFlash > 0) state.redFlash = Math.max(0, state.redFlash - dt * (0.25 / 0.15)); // fade over 150ms

        state.hudTick += dt;
        if (state.hudTick > 0.05) {
            state.hudTick = 0;
            const minutes = state.timeSurvived / 60000;
            const wpm = minutes > 0 ? Math.round(state.wordsTyped / minutes) : 0;
            const acc = state.totalKeystrokes > 0 ? Math.round((state.correctKeystrokes / state.totalKeystrokes)*100) : 0;
            setHudState({ score: state.score, lives: state.lives, wpm, accuracy: acc, vignette: state.vignette, redFlash: state.redFlash });
        }
    });
    return null;
};


// --- HTML UI OVERLAYS (HUD, Menus) ---

export default function NinjaWorld({ step, onComplete, isEmbedded }: { step?: any, onComplete?: () => void, isEmbedded?: boolean }) {
    const [gameState, setGameState] = useState<GameState>(isEmbedded ? "PLAYING" : "MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    
    const [activeEnemyIds, setActiveEnemyIds] = useState<string[]>([]);
    const [activeProjectileIds, setActiveProjectileIds] = useState<string[]>([]);
    const [activeParticleIds, setActiveParticleIds] = useState<string[]>([]);
    
    const [hudState, setHudState] = useState({ score: 0, lives: 3, wpm: 0, accuracy: 0, vignette: 0, redFlash: 0 });

    const [initState] = useState(getInitialState);
    const stateRef = useRef(initState);

    const startGame = useCallback((diff: Difficulty) => {
        sfx.init();
        sfx.resume();
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
        setHudState({ score: 0, lives: 3, wpm: 0, accuracy: 0, vignette: 0, redFlash: 0 });
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
                sfx.playTypo();
                
                if (isEmbedded && step && step.rules) {
                    state.embeddedMistakes++;
                    if (state.embeddedMistakes > step.rules.maxMistakesAllowed) {
                        setGameState("GAME_OVER");
                        sfx.stopProceduralBGM();
                    }
                }
                
                const pid = Math.random().toString();
                state.projectiles.push({ 
                    id: pid, isHit: false, 
                    x: -2 + Math.random() * 4, y: 1.5, z: MASTER_CONFIG.LAYOUT.playerZ, 
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
                            const pid = Math.random().toString();
                            state.projectiles.push({ id: pid, isHit: true, targetId: target.id, x: 0, y: 1.0, z: MASTER_CONFIG.LAYOUT.playerZ, toRemove: false });
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
                                const pid = Math.random().toString();
                                state.projectiles.push({ id: pid, isHit: true, targetId: newTarget.id, x: 0, y: 1.0, z: MASTER_CONFIG.LAYOUT.playerZ, toRemove: false });
                                setActiveProjectileIds((prev: any) => [...prev, pid]);
                                sfx.playWordLaunch();

                                if (newTarget.queuedHits + newTarget.typed.length === newTarget.word.length) {
                                    state.targetId = null;
                                }
                            } else {
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
                    const pid = Math.random().toString();
                    state.projectiles.push({ id: pid, isHit: true, targetId: target.id, x: 0, y: 1.0, z: MASTER_CONFIG.LAYOUT.playerZ, toRemove: false });
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

    return (
        <div className="w-full h-full relative bg-[#f4e0c5]">
            <Canvas>
                <CamSetup />
                <fog attach="fog" args={['#f4e0c5', 20, 50]} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 20, 15]} intensity={0.8} />

                <GroundLayer stateRef={stateRef} />
                <SceneryLayer stateRef={stateRef} />
                
                <MinionHero position={[0, 0, MASTER_CONFIG.LAYOUT.playerZ]} scale={MASTER_CONFIG.SCALES.playerNinja} isPlayer />

                {activeEnemyIds.map(id => <EnemyNode key={id} enemyId={id} stateRef={stateRef} isPaused={gameState !== 'PLAYING'} />)}
                {activeProjectileIds.map(id => <ProjectileNode key={id} pid={id} stateRef={stateRef} />)}
                {activeParticleIds.map(id => <ParticleNode key={id} pid={id} stateRef={stateRef} />)}

                {gameState === 'PLAYING' && (
                    <GameLoop 
                        stateRef={stateRef} 
                        difficulty={difficulty} 
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
                    <div className="absolute top-6 left-6 z-50 pointer-events-none flex gap-4">
                        <div className="bg-[#5c4033]/90 border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center shadow-md">
                            <span className="font-bold text-[#e4dfd7] mr-2">💵</span>
                            <span className="font-mono font-black text-white">0</span>
                        </div>
                        <div className="bg-[#5c4033]/90 border-2 border-[#3d2a21] rounded-full px-4 py-1.5 flex items-center shadow-md">
                            <span className="font-black text-[#e4dfd7] uppercase tracking-wider mr-2 text-sm">Score:</span>
                            <span className="font-mono font-black text-amber-400">{hudState.score}</span>
                        </div>
                    </div>

                    {!isEmbedded && (
                        <div className="absolute top-6 right-6 z-50 pointer-events-none flex gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-6 h-6 rounded-sm border-2 ${i < hudState.lives ? 'bg-red-500 border-red-800' : 'bg-[#554e44] border-[#3d2a21]'} rotate-45 shadow-sm mx-1`} />
                            ))}
                        </div>
                    )}

                    <div className="absolute top-20 right-6 z-50 flex gap-2">
                        <button onClick={() => { sfx.audioCtx?.suspend(); setGameState('PAUSED'); }} className="bg-[#7a6f61] text-white border-[3px] border-[#554e44] px-4 py-2 rounded-lg font-black tracking-widest shadow-md hover:scale-105 active:scale-95 transition-transform uppercase text-sm">
                            ⏸ PAUSE
                        </button>
                    </div>

                </>
            )}

            {/* MENUS (Stone Tablet UI) */}
            {gameState === "GAME_OVER" && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center font-mono">
                    <h1 className="text-6xl font-bold text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAME OVER</h1>
                    {isEmbedded ? (
                        <p className="text-xl text-neutral-300 mb-8">You were overwhelmed by the minions.</p>
                    ) : (
                        <p className="text-xl text-neutral-300 mb-8">Final Score: {hudState.score} | WPM: {hudState.wpm}</p>
                    )}
                    
                    <button 
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-4 bg-white text-black font-bold text-xl uppercase rounded shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all cursor-pointer"
                    >
                        {isEmbedded ? 'Retry Module' : 'Play Again'}
                    </button>
                    
                    {!isEmbedded && (
                        <button 
                            onClick={() => setGameState("MENU")}
                            className="mt-6 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Return to Menu
                        </button>
                    )}
                </div>
            )}
            {gameState !== 'PLAYING' && gameState !== 'GAME_OVER' && (
                <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-[340px] bg-[#7a6f61] border-[8px] border-[#554e44] rounded-lg p-6 shadow-2xl relative flex flex-col items-center">
                        <button onClick={() => { setIsMuted(sfx.toggleMute()); }} className="absolute -top-4 -right-4 bg-[#7a6f61] text-white border-[3px] border-[#554e44] w-12 h-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-2xl z-10">
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                        <div className="absolute -top-6 bg-[#655a4d] border-4 border-[#4a4339] px-6 py-1.5 text-white font-black text-xl tracking-wider uppercase shadow-md">
                            {gameState === 'MENU' ? 'Ninja Run' : 'Paused'}
                        </div>

                        <div className="flex flex-col gap-4 mt-6 w-full">
                            {gameState === 'MENU' && (
                                ['EASY', 'MEDIUM', 'HARD'].map(diff => (
                                    <div key={diff} className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(diff as Difficulty)} className={`w-full border-4 border-[#4a4339] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] ${diff === 'EASY' ? 'bg-[#3ea0e6] text-white border-[#2b7bb5]' : 'bg-[#e4dfd7] text-[#554e44] border-[#c0bbb5]'}`}>
                                            {diff}
                                        </button>
                                    </div>
                                ))
                            )}

                            {gameState === 'PAUSED' && (
                                <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                    <button onClick={() => { sfx.resume(); setGameState('PLAYING'); }} className="w-full bg-[#3ea0e6] text-white border-4 border-[#2b7bb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        CONTINUE
                                    </button>
                                </div>
                            )}

                            {gameState === 'PAUSED' && (
                                <>
                                    <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(difficulty)} className="w-full bg-[#e4dfd7] text-[#554e44] border-4 border-[#c0bbb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            RESTART
                                        </button>
                                    </div>
                                    <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => setGameState('MENU')} className="w-full bg-[#e4dfd7] text-[#554e44] border-4 border-[#c0bbb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            HOME
                                        </button>
                                    </div>
                                    <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => { window.location.href = '/'; }} className="w-full bg-[#ef4444] text-white border-4 border-[#b91c1c] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            QUIT
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
