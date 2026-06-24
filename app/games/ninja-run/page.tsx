"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Home, ArrowRight, Target, Pause } from "lucide-react";

// --- AUDIO SYNTHESIZER ---
class SoundSynthesizer {
    audioCtx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    enabled: boolean = false;

    init() {
        if (typeof window !== "undefined" && !this.audioCtx) {
            try {
                const Ctx = window.AudioContext || (window as any).webkitAudioContext;
                this.audioCtx = new Ctx();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.value = 0.5;
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

    playThrow() {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playHit() {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playError() {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playDamage() {
        if (!this.enabled || !this.audioCtx || !this.masterGain) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
    }
}

const sfx = new SoundSynthesizer();

// --- CONSTANTS & DATA ---
const WORDS = [
    "tiger", "panther", "eagle", "wolf", "dragon", "falcon", "cobra", "shark", "rhino", "leopard",
    "gorilla", "cheetah", "python", "jaguar", "mammoth", "dolphin", "spider", "raven", "bison", "cougar",
    "forest", "mountain", "river", "ocean", "thunder", "lightning", "storm", "volcano", "desert", "jungle",
    "canyon", "glacier", "meteor", "nebula", "galaxy", "planet", "eclipse", "aurora", "breeze", "tsunami",
    "robot", "cyborg", "matrix", "network", "server", "quantum", "laser", "plasma", "engine", "reactor",
    "circuit", "system", "portal", "sensor", "drone", "rocket", "satellite", "module", "cyber", "digital",
    "apple", "burger", "pizza", "sushi", "taco", "steak", "bacon", "cheese", "bread", "honey",
    "lemon", "mango", "berry", "onion", "garlic", "pepper", "olive", "melon", "grape", "peach",
    "train", "plane", "ship", "boat", "ticket", "hotel", "beach", "map", "compass", "globe",
    "journey", "voyage", "safari", "cruise", "flight", "pilot", "driver", "guide", "route", "track",
    "pencil", "paper", "book", "desk", "chair", "board", "math", "science", "history", "art",
    "music", "recess", "lunch", "grade", "test", "exam", "quiz", "student", "teacher", "class",
    "soccer", "tennis", "golf", "rugby", "hockey", "track", "field", "swim", "dive", "jump",
    "throw", "catch", "pass", "goal", "score", "team", "coach", "player", "match", "game",
    "atom", "cell", "gene", "virus", "brain", "heart", "blood", "bone", "skin", "muscle",
    "nerve", "vein", "skull", "spine", "joint", "lung", "liver", "fluid", "acid", "base",
    "house", "door", "window", "roof", "wall", "floor", "room", "bed", "sleep", "wake",
    "wash", "clean", "cook", "eat", "drink", "talk", "walk", "run", "work", "play",
    "ninja", "sword", "blade", "kunai", "shuriken", "shadow", "stealth", "strike", "slash", "dodge",
    "block", "parry", "climb", "hide", "sneak", "assassin", "master", "sensei", "dojo", "temple"
];

type GameState = "MENU" | "PLAYING" | "GAME_OVER";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Enemy {
    id: string;
    word: string;
    typed: string;
    x: number; // vw
    y: number; // vh
    speed: number;
    isDead: boolean;
    isTargetable: boolean;
    deathTimer: number;
    shakeTime: number;
    scale: number;
    yOffset: number;
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    targetId: string;
    speed: number;
    toRemove: boolean;
    rotation: number;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    type: "spark" | "blood" | "text" | "smoke";
    text?: string;
}

const DIFFICULTY_SETTINGS = {
    EASY: { speed: 10, spawnRate: 2500, scoreMult: 1 },
    MEDIUM: { speed: 15, spawnRate: 1800, scoreMult: 2 },
    HARD: { speed: 22, spawnRate: 1200, scoreMult: 3 },
};

const PLAYER_X = 50; // vw
const PLAYER_Y = 80; // vh
const ENEMY_START_Y = -10; // vh

// --- PROCEDURAL BACKGROUND COMPONENTS ---
const PineTree = ({ x, y, scale, type }: any) => {
    const isCyan = type === 'cyan';
    const colors = isCyan
        ? ['#2dd4bf', '#14b8a6', '#0f766e']
        : ['#4ade80', '#22c55e', '#16a34a'];

    return (
        <div className="absolute flex flex-col items-center pointer-events-none drop-shadow-md" style={{ left: `${x}vw`, top: `${y}vh`, transform: `scale(${scale})` }}>
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px]" style={{ borderBottomColor: colors[0] }} />
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[25px] -mt-3" style={{ borderBottomColor: colors[1] }} />
            <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[30px] -mt-4" style={{ borderBottomColor: colors[2] }} />
            <div className="w-4 h-6 bg-[#8B4513] -mt-2 shadow-inner" />
        </div>
    );
};

export default function NinjaRunGame() {
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [mounted, setMounted] = useState(false);

    // Generate static tree list for the scrolling background
    const backgroundTrees = useMemo(() => {
        const list = [];
        for (let i = 0; i < 60; i++) {
            // Left forest (0 to 30vw)
            list.push({
                id: `L${i}`,
                x: Math.random() * 25,
                y: Math.random() * 100,
                scale: 0.8 + Math.random() * 0.7,
                type: Math.random() > 0.4 ? 'cyan' : 'green'
            });
            // Right forest (70 to 100vw)
            list.push({
                id: `R${i}`,
                x: 70 + Math.random() * 25,
                y: Math.random() * 100,
                scale: 0.8 + Math.random() * 0.7,
                type: Math.random() > 0.4 ? 'cyan' : 'green'
            });
        }
        return list;
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const gameRef = useRef({
        enemies: [] as Enemy[],
        projectiles: [] as Projectile[],
        particles: [] as Particle[],
        lastTime: 0,
        spawnTimer: 0,
        targetId: null as string | null,
        score: 0,
        lives: 3,
        wordsTyped: 0,
        enemiesDefeated: 0,
        correctKeystrokes: 0,
        totalKeystrokes: 0,
        timeSurvived: 0,
        difficultyMultiplier: 1,
        speedMultiplier: 1,
        spawnRateMultiplier: 1,
        isScreenShaking: 0,
        redVignette: 0,
        playerAttacking: 0,
    });

    const [renderState, setRenderState] = useState({
        enemies: [] as Enemy[],
        projectiles: [] as Projectile[],
        particles: [] as Particle[],
        score: 0,
        lives: 3,
        isScreenShaking: 0,
        redVignette: 0,
        targetId: null as string | null,
        playerAttacking: 0,
    });

    const gameLoopRef = useRef<number>(null);

    const startGame = (selectedDiff: Difficulty) => {
        sfx.init();
        sfx.resume();

        setDifficulty(selectedDiff);
        gameRef.current = {
            enemies: [],
            projectiles: [],
            particles: [],
            lastTime: performance.now(),
            spawnTimer: 0,
            targetId: null,
            score: 0,
            lives: 3,
            wordsTyped: 0,
            enemiesDefeated: 0,
            correctKeystrokes: 0,
            totalKeystrokes: 0,
            timeSurvived: 0,
            difficultyMultiplier: 1,
            speedMultiplier: 1,
            spawnRateMultiplier: 1,
            isScreenShaking: 0,
            redVignette: 0,
            playerAttacking: 0,
        };
        setGameState("PLAYING");
    };

    const spawnEnemy = () => {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        gameRef.current.enemies.push({
            id: Math.random().toString(36).substr(2, 9),
            word,
            typed: "",
            x: 35 + Math.random() * 30, // 35vw to 65vw (the path)
            y: ENEMY_START_Y,
            speed: DIFFICULTY_SETTINGS[difficulty].speed * (0.8 + Math.random() * 0.4),
            isDead: false,
            isTargetable: true,
            deathTimer: 0,
            shakeTime: 0,
            scale: 0.8 + Math.random() * 0.4,
            yOffset: Math.random() * 100,
        });
    };

    const spawnDeathParticles = (x: number, y: number, wordLength: number) => {
        const state = gameRef.current;
        // Blood/Sparks
        for (let i = 0; i < 15; i++) {
            state.particles.push({
                id: Math.random().toString(),
                x,
                y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 600 + Math.random() * 400,
                maxLife: 1000,
                color: Math.random() > 0.5 ? "#ef4444" : "#f97316",
                size: Math.random() * 8 + 4,
                type: "spark",
            });
        }
        // Score Text
        const points = wordLength * 10 * DIFFICULTY_SETTINGS[difficulty].scoreMult;
        state.particles.push({
            id: Math.random().toString(),
            x,
            y: y - 5,
            vx: 0,
            vy: -15, // floats up
            life: 1500,
            maxLife: 1500,
            color: "#facc15",
            size: 24,
            type: "text",
            text: `+${points}`,
        });
    };

    const takeDamage = () => {
        const state = gameRef.current;
        state.lives--;
        state.isScreenShaking = 400;
        state.redVignette = 1;
        sfx.playDamage();

        // Spawn damage particles on player
        for (let i = 0; i < 20; i++) {
            state.particles.push({
                id: Math.random().toString(),
                x: PLAYER_X,
                y: PLAYER_Y,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                life: 1000,
                maxLife: 1000,
                color: "#dc2626",
                size: Math.random() * 10 + 4,
                type: "blood",
            });
        }

        if (state.lives <= 0) {
            setGameState("GAME_OVER");
        }
    };

    // --- GAME LOOP ---
    useEffect(() => {
        if (gameState !== "PLAYING") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            if (e.code === "Space") e.preventDefault();

            const state = gameRef.current;
            const char = e.key.toLowerCase();
            state.totalKeystrokes++;

            const hitTarget = (target: Enemy) => {
                target.typed += target.word[target.typed.length];
                state.correctKeystrokes++;

                if (target.typed.length === target.word.length) {
                    // Word Completed
                    target.isTargetable = false;
                    state.targetId = null;
                    state.score += target.word.length * 10 * DIFFICULTY_SETTINGS[difficulty].scoreMult;
                    state.wordsTyped++;

                    state.playerAttacking = 200;
                    sfx.playThrow();

                    // Spawn Shuriken
                    state.projectiles.push({
                        id: Math.random().toString(),
                        x: PLAYER_X,
                        y: PLAYER_Y - 5,
                        targetId: target.id,
                        speed: 120, // vh per second
                        toRemove: false,
                        rotation: 0,
                    });
                } else {
                    sfx.playHit();
                }
            };

            const missTarget = (target: Enemy | null) => {
                state.isScreenShaking = 200;
                state.redVignette = 0.5;
                sfx.playError();
                if (target) {
                    target.shakeTime = 300;
                }
            };

            if (state.targetId) {
                const target = state.enemies.find((en) => en.id === state.targetId);
                if (target && target.isTargetable) {
                    const expected = target.word[target.typed.length].toLowerCase();
                    if (char === expected) {
                        hitTarget(target);
                    } else {
                        missTarget(target);
                    }
                } else {
                    state.targetId = null;
                    findNewTarget(char);
                }
            } else {
                findNewTarget(char);
            }

            function findNewTarget(inputChar: string) {
                // Find all matching enemies that are targetable
                const valid = state.enemies.filter(
                    (e) => e.isTargetable && e.word[0].toLowerCase() === inputChar
                );
                if (valid.length > 0) {
                    // Sort by closest (highest Y)
                    valid.sort((a, b) => b.y - a.y);
                    const target = valid[0];
                    state.targetId = target.id;
                    hitTarget(target);
                } else {
                    missTarget(null);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        const update = (time: number) => {
            const state = gameRef.current;
            if (!state.lastTime) state.lastTime = time;
            let dt = time - state.lastTime;
            state.lastTime = time;
            if (dt > 100) dt = 16;

            state.timeSurvived += dt;

            const minutes = state.timeSurvived / 60000;
            const diffMult = 1 + minutes * 0.4;
            state.speedMultiplier = diffMult;
            state.spawnRateMultiplier = 1 / Math.sqrt(diffMult);

            if (state.isScreenShaking > 0) state.isScreenShaking -= dt;
            if (state.playerAttacking > 0) state.playerAttacking -= dt;
            if (state.redVignette > 0) {
                state.redVignette -= dt * 0.001;
                if (state.redVignette < 0) state.redVignette = 0;
            }

            // Update Enemies
            state.enemies.forEach((enemy) => {
                if (enemy.isDead) {
                    enemy.deathTimer -= dt;
                } else {
                    // Move enemy DOWN
                    enemy.y += (enemy.speed * state.speedMultiplier * dt) / 1000;
                    if (enemy.shakeTime > 0) enemy.shakeTime -= dt;

                    // Check hit player (if enemy reaches player Y)
                    if (enemy.y >= PLAYER_Y - 5 && enemy.isTargetable) {
                        takeDamage();
                        enemy.isDead = true;
                        enemy.deathTimer = 500;
                        if (state.targetId === enemy.id) state.targetId = null;
                    }
                }
            });

            // Update Projectiles
            state.projectiles.forEach((p) => {
                const target = state.enemies.find((e) => e.id === p.targetId);
                p.rotation += 1500 * (dt / 1000);
                if (target) {
                    const dx = target.x - p.x;
                    const dy = target.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 4) { // Hit
                        p.toRemove = true;
                        target.isDead = true;
                        target.deathTimer = 800;
                        state.enemiesDefeated++;
                        sfx.playHit();
                        spawnDeathParticles(target.x, target.y, target.word.length);
                    } else {
                        p.x += (dx / dist) * p.speed * (dt / 1000);
                        p.y += (dy / dist) * p.speed * (dt / 1000);
                    }
                } else {
                    p.y -= p.speed * (dt / 1000);
                    if (p.y < -10) p.toRemove = true;
                }
            });

            // Update Particles
            state.particles.forEach((p) => {
                p.x += p.vx * (dt / 1000);
                p.y += p.vy * (dt / 1000);
                p.life -= dt;
            });

            // Spawn new enemies
            state.spawnTimer += dt;
            const currentSpawnRate = DIFFICULTY_SETTINGS[difficulty].spawnRate * state.spawnRateMultiplier;
            if (state.spawnTimer >= currentSpawnRate) {
                spawnEnemy();
                state.spawnTimer = 0;
            }

            // Cleanup
            state.enemies = state.enemies.filter((e) => !(e.isDead && e.deathTimer <= 0));
            state.projectiles = state.projectiles.filter((p) => !p.toRemove);
            state.particles = state.particles.filter((p) => p.life > 0);

            // Sync state for rendering
            setRenderState({
                enemies: [...state.enemies],
                projectiles: [...state.projectiles],
                particles: [...state.particles],
                score: state.score,
                lives: state.lives,
                isScreenShaking: state.isScreenShaking,
                redVignette: state.redVignette,
                targetId: state.targetId,
                playerAttacking: state.playerAttacking,
            });

            gameLoopRef.current = requestAnimationFrame(update);
        };

        gameLoopRef.current = requestAnimationFrame(update);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameState, difficulty]);

    if (!mounted) return null;

    const wpm = gameRef.current.timeSurvived > 0
        ? Math.round((gameRef.current.wordsTyped / (gameRef.current.timeSurvived / 60000)))
        : 0;
    const accuracy = gameRef.current.totalKeystrokes > 0
        ? Math.round((gameRef.current.correctKeystrokes / gameRef.current.totalKeystrokes) * 100)
        : 0;

    const TreeLayer = () => (
        <div className="relative w-full h-[100vh]">
            {backgroundTrees.map((t) => (
                <PineTree key={t.id} x={t.x} y={t.y} scale={t.scale} type={t.type} />
            ))}
        </div>
    );

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#eeb68e] font-sans select-none">
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        @keyframes runBounce {
          0%, 100% { transform: translateY(0) scaleX(1); }
          50% { transform: translateY(-8px) scaleX(0.95); }
        }
        .text-shadow { text-shadow: 2px 2px 0 rgba(0,0,0,0.3); }
      `}} />

            {/* --- PROCEDURAL SCROLLING BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Dirt path slightly lighter in the middle */}
                <div className="absolute top-0 bottom-0 left-[30vw] right-[30vw] bg-white/10" />

                {/* Infinite scrolling trees */}
                <div className={`absolute inset-x-0 h-[200vh] ${gameState === 'PLAYING' ? 'animate-[scrollDown_10s_linear_infinite]' : ''}`}>
                    <TreeLayer />
                    <TreeLayer />
                </div>
            </div>

            {/* Screen Shake & Damage Vignette Container */}
            <div
                className="absolute inset-0 z-30 pointer-events-none"
                style={{
                    transform: renderState.isScreenShaking > 0
                        ? `translate(${(Math.random() - 0.5) * 15}px, ${(Math.random() - 0.5) * 15}px)`
                        : 'none',
                    boxShadow: renderState.redVignette > 0
                        ? `inset 0 0 ${renderState.redVignette * 150}px rgba(220,38,38,${renderState.redVignette * 0.8})`
                        : 'none'
                }}
            >
                {gameState === "PLAYING" && (
                    <>
                        {/* HUD */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-50">
                            <div className="flex flex-col gap-2">
                                <div className="bg-[#a39481] border-4 border-[#655a4d] rounded px-4 py-2 flex items-center shadow-md">
                                    <span className="font-black text-[#554e44] uppercase tracking-wider mr-3">Score:</span>
                                    <span className="font-mono text-2xl font-black text-white text-shadow">{renderState.score}</span>
                                </div>
                                {/* Lives */}
                                <div className="flex gap-2 mt-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-sm border-2 ${i < renderState.lives ? 'bg-red-500 border-red-800' : 'bg-gray-400 border-gray-600'} rotate-45 shadow-sm transform transition-colors`} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="bg-[#e4dfd7] border-4 border-[#b5ae9f] hover:bg-gray-300 p-2 rounded text-[#554e44] pointer-events-auto">
                                    <Pause size={24} />
                                </button>
                            </div>
                        </div>

                        {/* PLAYER NINJA (Top-down) */}
                        <div className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${PLAYER_X}vw`, top: `${PLAYER_Y}vh` }}>
                            <div className={`relative w-16 h-20 flex justify-center items-center ${renderState.playerAttacking > 0 ? 'scale-110' : ''} transition-transform`}>
                                {/* Shoulders */}
                                <div className="absolute top-8 w-14 h-8 bg-gray-900 rounded-full z-10 shadow-lg" />

                                {/* Head */}
                                <div className="w-12 h-12 bg-[#111] rounded-full z-20 shadow-xl border-2 border-black flex justify-center">
                                    {/* Headband knot */}
                                    <div className="absolute top-2 right-1 w-6 h-2 bg-red-600 rotate-45 rounded" />
                                </div>

                                {/* Headband tails (flowing back/down) */}
                                <div className="absolute top-10 left-4 w-2 h-10 bg-red-600 rounded-full origin-top z-30 opacity-90 skew-x-12" />
                                <div className="absolute top-10 left-7 w-2 h-8 bg-red-500 rounded-full origin-top z-30 opacity-90 -skew-x-12" />

                                {/* Sword */}
                                <div className={`absolute top-0 right-0 w-2 h-20 bg-gradient-to-b from-gray-200 to-gray-400 rounded-full z-40 origin-bottom transition-transform duration-100 ${renderState.playerAttacking > 0 ? 'rotate-[-45deg] -translate-y-4' : 'rotate-[20deg]'}`} />
                            </div>
                        </div>

                        {/* ENEMIES (Top-down coming towards player) */}
                        {renderState.enemies.map(enemy => (
                            <div
                                key={enemy.id}
                                className="absolute z-40 flex flex-col items-center origin-center will-change-transform transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${enemy.x}vw`,
                                    top: `${enemy.y}vh`,
                                    transform: `scale(${enemy.scale}) ${enemy.shakeTime > 0 ? `translateX(${(Math.random() - 0.5) * 15}px)` : ''}`
                                }}
                            >
                                {/* Word Tag */}
                                {!enemy.isDead && (
                                    <div className={`absolute -top-10 flex flex-col items-center gap-1 ${renderState.targetId === enemy.id ? 'scale-125 z-50' : 'scale-100 z-40'} transition-transform`}>
                                        {renderState.targetId === enemy.id && (
                                            <Target size={20} className="text-red-600 animate-pulse drop-shadow-md mb-1" />
                                        )}
                                        <div className="bg-[#6b6255]/90 border-[3px] border-[#4a4339] px-3 py-1 shadow-md whitespace-nowrap">
                                            <span className="font-black text-xl tracking-widest text-shadow">
                                                <span className="text-red-400">{enemy.typed}</span>
                                                <span className="text-white">{enemy.word.slice(enemy.typed.length)}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Enemy Ninja Body */}
                                <div className={`relative w-16 h-20 flex justify-center items-center transition-opacity duration-300 ${enemy.isDead ? 'opacity-0 scale-50' : 'opacity-100 animate-[runBounce_0.4s_infinite]'}`} style={{ animationDelay: `${enemy.yOffset}ms` }}>
                                    {/* Shoulders */}
                                    <div className="absolute top-4 w-12 h-6 bg-red-900 rounded-full z-10 shadow-lg" />

                                    {/* Head */}
                                    <div className="w-12 h-12 bg-red-700 rounded-full z-20 shadow-xl border-2 border-red-900 flex flex-col items-center justify-start pt-2">
                                        {/* Face visible because they are facing the player */}
                                        <div className="w-8 h-3 bg-black rounded-full flex justify-center items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-red-300 rounded-full" />
                                            <div className="w-1.5 h-1.5 bg-red-300 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Headband tails flowing UP because they are running down */}
                                    <div className="absolute bottom-10 left-3 w-2 h-8 bg-red-900 rounded-full origin-bottom z-30 skew-x-12" />
                                </div>
                            </div>
                        ))}

                        {/* PROJECTILES (Shurikens) */}
                        {renderState.projectiles.map(p => (
                            <div
                                key={p.id}
                                className="absolute z-50 text-gray-800 will-change-transform transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${p.x}vw`,
                                    top: `${p.y}vh`,
                                    transform: `rotate(${p.rotation}deg)`
                                }}
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
                                    <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
                                </svg>
                            </div>
                        ))}

                        {/* PARTICLES */}
                        {renderState.particles.map(p => (
                            p.type === "text" ? (
                                <div
                                    key={p.id}
                                    className="absolute z-50 font-black whitespace-nowrap text-shadow transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `${p.x}vw`,
                                        top: `${p.y}vh`,
                                        color: p.color,
                                        fontSize: `${p.size}px`,
                                        opacity: p.life / p.maxLife,
                                    }}
                                >
                                    {p.text}
                                </div>
                            ) : (
                                <div
                                    key={p.id}
                                    className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 will-change-transform"
                                    style={{
                                        left: `${p.x}vw`,
                                        top: `${p.y}vh`,
                                        width: `${p.size}px`,
                                        height: `${p.size}px`,
                                        backgroundColor: p.color,
                                        opacity: p.life / p.maxLife,
                                        transform: p.type === 'spark' ? 'rotate(45deg)' : 'none'
                                    }}
                                />
                            )
                        ))}
                    </>
                )}
            </div>

            {/* --- MENUS --- */}
            <AnimatePresence>
                {gameState === "MENU" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <div className="bg-[#a39481] border-[8px] border-[#655a4d] rounded-sm p-8 shadow-2xl relative flex flex-col items-center min-w-[320px]">
                            <div className="absolute -top-6 bg-[#938472] border-4 border-[#655a4d] px-8 py-2 shadow-md">
                                <h2 className="text-white font-black text-2xl tracking-widest uppercase text-shadow">Select Level</h2>
                            </div>

                            <div className="flex flex-col gap-4 mt-8 w-full">
                                {['EASY', 'MEDIUM', 'HARD'].map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => startGame(diff as Difficulty)}
                                        className="w-full bg-[#e4dfd7] border-2 border-[#b5ae9f] border-b-[6px] hover:bg-[#3ea0e6] hover:border-[#2b71a3] hover:text-white text-[#554e44] font-black text-xl py-4 transition-colors uppercase shadow-sm"
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameState === "GAME_OVER" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <div className="bg-[#a39481] border-[8px] border-[#655a4d] rounded-sm p-8 shadow-2xl relative flex flex-col w-[350px]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#938472] border-4 border-[#655a4d] px-8 py-2 shadow-md whitespace-nowrap">
                                <h2 className="text-white font-black text-2xl tracking-widest uppercase text-shadow">Game Over</h2>
                            </div>

                            <div className="flex flex-col gap-5 mt-10 mb-8 border-l-[3px] border-[#7a6f61] pl-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black text-xl text-shadow">Speed</span>
                                    <span className="text-white font-black text-2xl text-shadow">{wpm} <span className="text-sm">WPM</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black text-xl text-shadow">Accuracy</span>
                                    <span className="text-white font-black text-2xl text-shadow">{accuracy} <span className="text-sm">%</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black text-xl text-shadow">Score</span>
                                    <span className="text-white font-black text-2xl text-shadow">{renderState.score}</span>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => startGame(difficulty)}
                                    className="bg-[#e4dfd7] border-2 border-[#b5ae9f] border-b-[6px] hover:bg-[#3ea0e6] hover:border-[#2b71a3] hover:text-white p-3 text-[#554e44] transition-colors"
                                >
                                    <RefreshCw size={28} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => setGameState("MENU")}
                                    className="bg-[#3ea0e6] border-2 border-[#2b71a3] border-b-[6px] hover:bg-[#2b71a3] text-white p-3 transition-colors"
                                >
                                    <Home size={28} strokeWidth={2.5} />
                                </button>
                                <button className="bg-[#e4dfd7] border-2 border-[#b5ae9f] border-b-[6px] hover:bg-[#3ea0e6] hover:border-[#2b71a3] hover:text-white p-3 text-[#554e44] transition-colors">
                                    <ArrowRight size={28} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
