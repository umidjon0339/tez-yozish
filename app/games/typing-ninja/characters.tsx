/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/immutability, react-hooks/purity */
"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export const HERO_MODEL = "/models/hero.glb";
export const ENEMY_MODEL = "/models/enemy.glb";

// KayKit rigs face +Z; the hero runs away from the camera, enemies toward it.
export const HERO_YAW = Math.PI;
export const ENEMY_YAW = 0;

export type HeroMode = "idle" | "run" | "frozen" | "dead";

// GLTFLoader strips "." from node names ("hand.r" -> "handr")
const UPPER_BONES = [
    "spine", "chest", "head",
    "upperarml", "upperarmr", "lowerarml", "lowerarmr",
    "wristl", "wristr", "handl", "handr", "handslotl", "handslotr",
    "handIKl", "handIKr", "elbowIKl", "elbowIKr",
];

const isUpperTrack = (t: THREE.KeyframeTrack) => {
    const node = t.name.slice(0, t.name.lastIndexOf("."));
    return UPPER_BONES.includes(node);
};

const subClip = (clip: THREE.AnimationClip, name: string, keepUpper: boolean) =>
    new THREE.AnimationClip(
        name,
        clip.duration,
        clip.tracks.filter((t) => isUpperTrack(t) === keepUpper)
    );

// Shared soft radial-gradient texture (blob shadows, dust, smoke, clouds)
let softTex: THREE.Texture | null = null;
export const getSoftTexture = () => {
    if (!softTex) {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const ctx = c.getContext("2d")!;
        const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.55, "rgba(255,255,255,0.55)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        softTex = new THREE.CanvasTexture(c);
    }
    return softTex;
};

export const BlobShadow = ({ radius = 0.5, opacity = 0.32 }: { radius?: number; opacity?: number }) => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial map={getSoftTexture()} transparent opacity={opacity} color="#2a1d10" depthWrite={false} />
    </mesh>
);

// =========================================================================
// 🥷 HERO — hooded rogue. Lower body always runs; throws/flinches play as
// upper-body overlays so the sprint never breaks while typing fast.
// =========================================================================
export const HeroNinja = memo(({ stateRef, mode, onFootstep }: {
    stateRef: any;
    mode: HeroMode;
    onFootstep?: (rightFoot: boolean) => void;
}) => {
    const { scene, animations } = useGLTF(HERO_MODEL);

    const { model, mats } = useMemo(() => {
        const m = cloneSkeleton(scene);
        const collected: THREE.MeshStandardMaterial[] = [];
        m.traverse((o: any) => {
            if (o.isSkinnedMesh) o.frustumCulled = false;
            // The pack ships showcase weapons in the hand slots (crossbow,
            // knives). Keep only the off-hand knife — the right hand must be
            // free to throw shurikens.
            if (o.isMesh && !o.isSkinnedMesh && o.name !== "Knife_Offhand") {
                o.visible = false;
                return;
            }
            if (o.isMesh && o.material) {
                o.material = o.material.clone();
                o.material.emissive = new THREE.Color("#f59e0b");
                o.material.emissiveIntensity = 0;
                collected.push(o.material);
            }
        });
        m.rotation.y = HERO_YAW;
        return { model: m, mats: collected };
    }, [scene]);

    const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

    const acts = useMemo(() => {
        const find = (n: string) => animations.find((a) => a.name === n)!;
        const run = find("Running_A");
        const a = {
            idle: mixer.clipAction(find("Idle")),
            death: mixer.clipAction(find("Death_A")),
            runLower: mixer.clipAction(subClip(run, "RunLower", false)),
            runUpper: mixer.clipAction(subClip(run, "RunUpper", true)),
            throwUpper: mixer.clipAction(subClip(find("Throw"), "ThrowUpper", true)),
            hitUpper: mixer.clipAction(subClip(find("Hit_A"), "HitUpper", true)),
        };
        a.death.setLoop(THREE.LoopOnce, 1);
        a.death.clampWhenFinished = true;
        a.throwUpper.setLoop(THREE.LoopOnce, 1);
        a.throwUpper.timeScale = 2.6;
        a.hitUpper.setLoop(THREE.LoopOnce, 1);
        a.hitUpper.timeScale = 1.8;
        return a;
    }, [mixer, animations]);

    // Overlay finished -> blend the running arms back in (time stayed in
    // sync because fadeOut never stops the action)
    useEffect(() => {
        const onFinished = (e: any) => {
            if (e.action === acts.throwUpper || e.action === acts.hitUpper) {
                e.action.fadeOut(0.12);
                acts.runUpper.fadeIn(0.12);
            }
        };
        mixer.addEventListener("finished", onFinished);
        return () => mixer.removeEventListener("finished", onFinished);
    }, [mixer, acts]);

    useEffect(() => {
        if (mode === "frozen") return; // pause: keep the pose, skip updates
        mixer.stopAllAction();
        if (mode === "run") {
            acts.runLower.reset().play();
            acts.runUpper.reset().play();
        } else if (mode === "dead") {
            acts.death.reset().fadeIn(0.1).play();
        } else {
            acts.idle.reset().fadeIn(0.2).play();
        }
    }, [mode, acts, mixer]);

    const handBone = useMemo(() => model.getObjectByName("handr") ?? null, [model]);
    const footL = useMemo(() => model.getObjectByName("footl") ?? null, [model]);
    const footR = useMemo(() => model.getObjectByName("footr") ?? null, [model]);

    const seen = useRef({ throw: 0, damage: 0, phase: 0, glow: 0 });
    const auraRef = useRef<any>(null!);
    const tmp = useMemo(() => new THREE.Vector3(), []);

    const spawnDust = (foot: THREE.Object3D | null) => {
        const s = stateRef.current;
        if (!foot || s.particles.length > 60) return;
        foot.getWorldPosition(tmp);
        s.particles.push({
            id: Math.random().toString(),
            kind: "dust",
            x: tmp.x + (Math.random() - 0.5) * 0.15, y: 0.08, z: tmp.z + 0.1,
            vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.4, vz: 0.7 + Math.random() * 0.5,
            rx: 0, ry: 0, grav: 0,
            life: 0.45, maxLife: 0.45,
            size: 0.28 + Math.random() * 0.15,
            color: "#dcb98e",
        });
        s.fxDirty = true;
    };

    useFrame((_, delta) => {
        if (mode === "frozen") return;
        const s = stateRef.current;
        const dt = Math.min(delta, 0.1);

        if (mode === "run") {
            const ts = 0.85 + (s.speedRamp || 1) * 0.35;
            acts.runLower.timeScale = ts;
            acts.runUpper.timeScale = ts;

            // keystroke -> throw overlay (retrigger only past the release point,
            // so ultra-fast typing reads as continuous rapid-fire)
            if (s.throwCount > seen.current.throw) {
                seen.current.throw = s.throwCount;
                const t = acts.throwUpper;
                if (!t.isRunning() || t.time > t.getClip().duration * 0.45) {
                    t.reset().fadeIn(0.05).play();
                    acts.runUpper.fadeOut(0.05);
                }
            }

            // taking damage -> flinch overlay
            if (s.damageCount > seen.current.damage) {
                seen.current.damage = s.damageCount;
                acts.throwUpper.fadeOut(0.05);
                acts.hitUpper.reset().fadeIn(0.05).play();
                acts.runUpper.fadeOut(0.05);
            }

            // footsteps + dust keyed to the actual run cycle
            const dur = acts.runLower.getClip().duration;
            const frac = (acts.runLower.time % dur) / dur;
            const prev = seen.current.phase;
            if (frac < prev) seen.current.phase = frac; // cycle wrapped
            else {
                if (prev < 0.25 && frac >= 0.25) { onFootstep?.(false); spawnDust(footL); }
                if (prev < 0.75 && frac >= 0.75) { onFootstep?.(true); spawnDust(footR); }
                seen.current.phase = frac;
            }

            // publish the throwing-hand world position for shuriken spawns
            if (handBone) {
                handBone.getWorldPosition(tmp);
                s.heroHandPos = { x: tmp.x, y: tmp.y, z: tmp.z };
            }
        }

        // streak glow: burns brighter the longer the no-typo run
        const glowTarget = mode === "run" && s.streak >= 3 ? Math.min(0.85, 0.25 + s.streak * 0.08) : 0;
        seen.current.glow = THREE.MathUtils.lerp(seen.current.glow, glowTarget, 1 - Math.exp(-8 * dt));
        const glow = seen.current.glow;
        for (const m of mats) m.emissiveIntensity = glow;
        if (auraRef.current) {
            auraRef.current.material.opacity = glow * 0.5;
            const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;
            auraRef.current.scale.setScalar(pulse);
            auraRef.current.rotation.z += dt * 1.5;
        }

        mixer.update(dt);
    });

    return (
        <group>
            <primitive object={model} />
            <BlobShadow radius={0.55} opacity={0.35} />
            <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <ringGeometry args={[0.55, 0.95, 32]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    );
});
HeroNinja.displayName = "HeroNinja";

// =========================================================================
// 💀 ENEMY — skeleton minion. Runs at the player, flinches per shuriken
// hit, crumbles with a real death animation when its word is finished.
// =========================================================================
export const EnemyNinja = memo(({ stateRef, enemyId, paused }: {
    stateRef: any;
    enemyId: string;
    paused: boolean;
}) => {
    const { scene, animations } = useGLTF(ENEMY_MODEL);

    const model = useMemo(() => {
        const m = cloneSkeleton(scene);
        m.traverse((o: any) => {
            if (o.isSkinnedMesh) o.frustumCulled = false;
        });
        m.rotation.y = ENEMY_YAW;
        return m;
    }, [scene]);

    const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

    const acts = useMemo(() => {
        const find = (n: string) => animations.find((a) => a.name === n)!;
        const runClip = Math.random() > 0.5 ? find("Running_A") : find("Running_C");
        const a = {
            run: mixer.clipAction(runClip),
            hit: mixer.clipAction(find("Hit_A")),
            death: mixer.clipAction(find("Death_A")),
            baseTs: 0.9 + Math.random() * 0.35,
        };
        a.hit.setLoop(THREE.LoopOnce, 1);
        a.hit.timeScale = 2.2;
        a.death.setLoop(THREE.LoopOnce, 1);
        a.death.clampWhenFinished = true;
        a.death.timeScale = 1.35;
        return a;
    }, [mixer, animations]);

    const local = useRef({ hits: 0, dead: false });

    useEffect(() => {
        acts.run.play();
        acts.run.time = Math.random() * acts.run.getClip().duration; // desync the horde
        const onFinished = (e: any) => {
            if (e.action === acts.hit && !local.current.dead) {
                acts.hit.fadeOut(0.1);
                acts.run.fadeIn(0.1);
            }
        };
        mixer.addEventListener("finished", onFinished);
        return () => mixer.removeEventListener("finished", onFinished);
    }, [acts, mixer]);

    useFrame((_, delta) => {
        if (paused) return;
        const e = stateRef.current.enemies.find((x: any) => x.id === enemyId);
        if (!e) return;

        if (e.isDead && !local.current.dead) {
            local.current.dead = true;
            mixer.stopAllAction();
            acts.death.reset().fadeIn(0.06).play();
        }
        if (!e.isDead) {
            acts.run.timeScale = acts.baseTs * (stateRef.current.speedRamp || 1) * 0.9;
            if (e.hitCount > local.current.hits) {
                local.current.hits = e.hitCount;
                acts.hit.reset().fadeIn(0.05).play();
                acts.run.fadeOut(0.05);
            }
        }
        mixer.update(Math.min(delta, 0.1));
    });

    return (
        <group>
            <primitive object={model} />
            <BlobShadow radius={0.5} opacity={0.3} />
        </group>
    );
});
EnemyNinja.displayName = "EnemyNinja";

useGLTF.preload(HERO_MODEL);
useGLTF.preload(ENEMY_MODEL);
