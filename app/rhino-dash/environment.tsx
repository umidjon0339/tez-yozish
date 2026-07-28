/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// Shared world measurements (imported by RhinoWorld + rhino.tsx)
export const WORLD = {
    FALL_X: 5.4,          // |pushX| beyond this = the loser tips off the cliff
    PLATFORM_HALF: 6.7,   // half-width of the grass meadow
    WATER_Y: -4.8,        // ocean surface height
    RHINO_GAP: 1.6,       // body-center distance from the contact point
};

// Module-cached radial-gradient sprite texture (dust, clouds, foam, splash).
// Local copy — importing the ninja one would preload its GLTF models.
let softTex: THREE.CanvasTexture | null = null;
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

// =========================================================================
// 🎥 CAMERA RIG — side-on duel camera. Pans with the contact point, shakes
// with trauma, punches in on word-complete lunges, and tilts down to follow
// the loser tumbling into the ocean.
// =========================================================================
export const CameraRig = ({ stateRef }: any) => {
    const camRef = useRef<any>(null!);
    const look = useRef({ x: 0, y: 0.9 });
    useFrame((rootState, delta) => {
        const cam = camRef.current;
        if (!cam) return;
        const s = stateRef.current;
        const dt = Math.min(delta, 0.1);

        s.camTrauma = Math.max(0, (s.camTrauma || 0) - dt * 2.2);
        s.camPunch = Math.max(0, (s.camPunch || 0) - dt * 3.5);

        const tr = s.camTrauma * s.camTrauma;
        const t = rootState.clock.elapsedTime;
        const ox = tr * 0.35 * Math.sin(t * 41);
        const oy = tr * 0.25 * Math.cos(t * 47);

        // Follow the battle line; during a fall, follow the faller down.
        const targetX = s.phase === "fall" && s.falling ? s.falling.x * 0.45 : s.pushX * 0.4;
        const targetLookY = s.phase === "fall" ? -0.9 : 0.9;
        const k = 1 - Math.exp(-4 * dt);
        look.current.x += (targetX - look.current.x) * k;
        look.current.y += (targetLookY - look.current.y) * k;

        cam.position.set(look.current.x + ox, 3.4 + oy, 13.6);
        const targetFov = 50 + (s.phase === "fall" ? 4 : 0) - (s.camPunch || 0) * 4;
        cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-10 * dt));
        cam.updateProjectionMatrix();
        cam.lookAt(look.current.x + ox * 0.5, look.current.y, 0);
    });
    return <PerspectiveCamera ref={camRef} makeDefault position={[0, 3.4, 13.6]} fov={50} />;
};

// =========================================================================
// 🌅 SKY — bright tropical blue-to-haze gradient; horizon matches scene fog.
// =========================================================================
export const SkyDome = memo(() => {
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                side: THREE.BackSide,
                depthWrite: false,
                fog: false,
                uniforms: {
                    top: { value: new THREE.Color("#4fb3ee") },
                    bottom: { value: new THREE.Color("#dff2fd") },
                },
                vertexShader: `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying float vY; void main(){ float h = clamp(vY / 80.0, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.75)), 1.0); }`,
            }),
        []
    );
    return (
        <mesh material={mat} renderOrder={-10}>
            <sphereGeometry args={[150, 24, 12]} />
        </mesh>
    );
});
SkyDome.displayName = "SkyDome";

// =========================================================================
// ☀️ SUN + ☁️ CLOUDS — soft billboard sprites; clouds drift, alive on menu.
// =========================================================================
const CLOUDS = Array.from({ length: 7 }).map((_, i) => ({
    x: -34 + i * 11 + (i % 3) * 3,
    y: 7.5 + (i % 3) * 2.6,
    z: -26 - (i % 4) * 5,
    s: 5 + (i % 3) * 1.8,
    v: 0.22 + (i % 3) * 0.11,
}));

export const SunAndClouds = memo(() => {
    const groupRef = useRef<THREE.Group>(null!);
    const cloudMat = useMemo(
        () =>
            new THREE.SpriteMaterial({
                map: getSoftTexture(),
                color: "#ffffff",
                transparent: true,
                opacity: 0.8,
                depthWrite: false,
                fog: false,
            }),
        []
    );
    const sunMat = useMemo(
        () =>
            new THREE.SpriteMaterial({
                map: getSoftTexture(),
                color: "#fff0a8",
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                fog: false,
            }),
        []
    );
    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const kids = groupRef.current.children;
        for (let i = 0; i < kids.length; i++) {
            kids[i].position.x += CLOUDS[i].v * Math.min(delta, 0.1);
            if (kids[i].position.x > 40) kids[i].position.x = -40;
        }
    });
    return (
        <group>
            <sprite material={sunMat} position={[-16, 13, -42]} scale={[9, 9, 1]} />
            <group ref={groupRef}>
                {CLOUDS.map((c, i) => (
                    <sprite key={i} material={cloudMat} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.36, 1]} />
                ))}
            </group>
        </group>
    );
});
SunAndClouds.displayName = "SunAndClouds";

// =========================================================================
// 🌊 OCEAN — flat sea with a shimmering overlay and drifting foam streaks.
// =========================================================================
export const Ocean = memo(() => {
    const shimmerRef = useRef<THREE.Mesh>(null!);
    const foamRef = useRef<THREE.Group>(null!);
    const foamMat = useMemo(
        () =>
            new THREE.SpriteMaterial({
                map: getSoftTexture(),
                color: "#ffffff",
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
            }),
        []
    );
    const streaks = useMemo(
        () =>
            Array.from({ length: 9 }).map((_, i) => ({
                x: -30 + i * 7 + (i % 3) * 2,
                z: -20 + (i % 5) * 7,
                s: 5 + (i % 4) * 2,
                v: 0.15 + (i % 3) * 0.08,
            })),
        []
    );
    useFrame((rootState, delta) => {
        const t = rootState.clock.elapsedTime;
        if (shimmerRef.current) {
            shimmerRef.current.position.x = Math.sin(t * 0.22) * 2.2;
            (shimmerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.16 + Math.sin(t * 0.55) * 0.05;
        }
        if (foamRef.current) {
            const kids = foamRef.current.children;
            for (let i = 0; i < kids.length; i++) {
                kids[i].position.x += streaks[i].v * Math.min(delta, 0.1);
                if (kids[i].position.x > 34) kids[i].position.x = -34;
            }
        }
    });
    return (
        <group position={[0, WORLD.WATER_Y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[320, 160]} />
                <meshStandardMaterial color="#2f9fe0" />
            </mesh>
            <mesh ref={shimmerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 8]}>
                <planeGeometry args={[320, 120]} />
                <meshBasicMaterial color="#7cd0f5" transparent opacity={0.18} depthWrite={false} />
            </mesh>
            {/* foam ring hugging the island base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} scale={[1, 0.5, 1]}>
                <ringGeometry args={[6.4, 8.6, 40]} />
                <meshBasicMaterial color="#dff6ff" transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <group ref={foamRef}>
                {streaks.map((f, i) => (
                    <sprite key={i} material={foamMat} position={[f.x, 0.08, f.z]} scale={[f.s, 0.5, 1]} />
                ))}
            </group>
        </group>
    );
});
Ocean.displayName = "Ocean";

// =========================================================================
// ⛰️ CLIFF ISLAND — grass meadow slab over a striated dirt cliff, standing
// in the ocean (the arena from the original Rhino Dash). Plus far islands.
// =========================================================================
const RIDGES = Array.from({ length: 11 }).map((_, i) => ({
    x: -5.6 + i * 1.12 + ((i * 7) % 3) * 0.14,
    w: 0.7 + ((i * 5) % 4) * 0.16,
    h: 3.3 + ((i * 3) % 5) * 0.22,
    tint: i % 2 === 0 ? "#c89759" : "#e0b884",
}));

const TUFTS = Array.from({ length: 16 }).map((_, i) => ({
    x: -6 + (i * 0.79) + ((i * 11) % 5) * 0.07,
    z: -2.2 + ((i * 7) % 9) * 0.5,
    s: 0.7 + ((i * 3) % 4) * 0.18,
}));

const FLOWERS = Array.from({ length: 8 }).map((_, i) => ({
    x: -5.5 + i * 1.55 + ((i * 5) % 3) * 0.2,
    z: -1.8 + ((i * 13) % 7) * 0.55,
    c: i % 2 === 0 ? "#fff7d6" : "#ffd166",
}));

export const CliffIsland = memo(() => (
    <group>
        {/* grass slab + brighter lip */}
        <mesh position={[0, -0.31, 0]}>
            <boxGeometry args={[WORLD.PLATFORM_HALF * 2, 0.62, 6.2]} />
            <meshStandardMaterial color="#4eb84a" flatShading />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[WORLD.PLATFORM_HALF * 2 + 0.35, 0.14, 6.5]} />
            <meshStandardMaterial color="#68cf58" flatShading />
        </mesh>

        {/* dirt cliff body */}
        <mesh position={[0, -2.75, 0]}>
            <boxGeometry args={[WORLD.PLATFORM_HALF * 2 - 0.9, 4.3, 5.4]} />
            <meshStandardMaterial color="#d9ad76" flatShading />
        </mesh>
        {/* vertical striation ridges on the front face */}
        {RIDGES.map((r, i) => (
            <mesh key={i} position={[r.x, -0.7 - r.h / 2, 2.75]}>
                <boxGeometry args={[r.w, r.h, 0.26]} />
                <meshStandardMaterial color={r.tint} flatShading />
            </mesh>
        ))}
        {/* waterline rocks */}
        {[-4.6, -1.2, 2.2, 5.1].map((x, i) => (
            <mesh key={i} position={[x, WORLD.WATER_Y + 0.15, 2.9]} rotation={[0, i * 1.2, 0]}>
                <dodecahedronGeometry args={[0.45 + (i % 2) * 0.2, 0]} />
                <meshStandardMaterial color="#c2a077" flatShading />
            </mesh>
        ))}

        {/* meadow decoration: grass tufts + flowers */}
        {TUFTS.map((tf, i) => (
            <group key={i} position={[tf.x, 0, tf.z]} scale={tf.s}>
                <mesh position={[0, 0.13, 0]}>
                    <coneGeometry args={[0.09, 0.3, 4]} />
                    <meshStandardMaterial color="#3da33c" flatShading />
                </mesh>
                <mesh position={[0.1, 0.1, 0.04]}>
                    <coneGeometry args={[0.07, 0.22, 4]} />
                    <meshStandardMaterial color="#57bd4e" flatShading />
                </mesh>
            </group>
        ))}
        {FLOWERS.map((f, i) => (
            <group key={i} position={[f.x, 0, f.z]}>
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.24, 4]} />
                    <meshStandardMaterial color="#3da33c" />
                </mesh>
                <mesh position={[0, 0.26, 0]}>
                    <sphereGeometry args={[0.06, 6, 6]} />
                    <meshStandardMaterial color={f.c} />
                </mesh>
            </group>
        ))}

        {/* hazy far islands for depth — cone hills rising out of the sea */}
        {([
            [-27, -46, 5.5, 6.5, "#a9cfc0"],
            [-21.5, -48, 3.5, 4, "#b6d8ca"],
            [26, -52, 4.5, 5.5, "#b2d5c8"],
            [31, -50, 3, 3.5, "#bfdccf"],
        ] as const).map(([x, z, r, h, c], i) => (
            <mesh key={i} position={[x, WORLD.WATER_Y + h / 2 - 0.3, z]}>
                <coneGeometry args={[r, h, 7]} />
                <meshStandardMaterial color={c} flatShading fog={false} />
            </mesh>
        ))}
    </group>
));
CliffIsland.displayName = "CliffIsland";
