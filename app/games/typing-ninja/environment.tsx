/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs */
"use client";

import { memo, useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { getSoftTexture } from "./characters";

// =========================================================================
// 🎥 CAMERA RIG — trauma shake on damage, punch-in on kills, FOV widens
// as the survival speed ramps up.
// =========================================================================
export const CameraRig = ({ stateRef }: any) => {
    const camRef = useRef<any>(null!);
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

        cam.position.set(ox, 4.5 + oy, 11);
        const targetFov = 48 + ((s.speedRamp || 1) - 1) * 14 - (s.camPunch || 0) * 3;
        cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-10 * dt));
        cam.updateProjectionMatrix();
        cam.lookAt(ox * 0.5, 1.5, 2);
    });
    return <PerspectiveCamera ref={camRef} makeDefault position={[0, 4.5, 11]} fov={48} />;
};

// =========================================================================
// 🌅 SKY — soft blue-to-cream gradient dome; the cream horizon matches the
// scene fog so distant objects melt into it seamlessly.
// =========================================================================
export const SkyDome = memo(() => {
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                side: THREE.BackSide,
                depthWrite: false,
                fog: false,
                uniforms: {
                    top: { value: new THREE.Color("#a7d8ec") },
                    bottom: { value: new THREE.Color("#f4e0c5") },
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
// ⛰️ MOUNTAINS — static hazy silhouettes past the fog line (fog disabled,
// colors pre-mixed toward the horizon tint).
// =========================================================================
const MOUNTAINS: Array<[number, number, number, number, string]> = [
    // x, z, radius, height, color
    [-29, -35, 13, 11, "#e6c8ab"],
    [-18, -34, 10, 9, "#e9cdb0"],
    [-7, -38, 12, 12, "#e2c2a2"],
    [6, -37, 11, 10, "#e6c8ab"],
    [17, -33, 9, 8, "#eed6bd"],
    [28, -36, 12, 10, "#e9cdb0"],
];

export const Mountains = memo(() => (
    <group>
        {MOUNTAINS.map(([x, z, r, h, c], i) => (
            <mesh key={i} position={[x, h / 2 - 0.4, z]}>
                <coneGeometry args={[r, h, 6]} />
                <meshStandardMaterial color={c} flatShading fog={false} />
            </mesh>
        ))}
    </group>
));
Mountains.displayName = "Mountains";

// =========================================================================
// ☁️ CLOUDS — soft billboard puffs drifting slowly; also alive on the menu.
// =========================================================================
const CLOUDS = Array.from({ length: 6 }).map((_, i) => ({
    x: -30 + i * 11 + (i % 3) * 4,
    y: 9 + (i % 3) * 2.2,
    z: -26 - (i % 4) * 4,
    s: 4.5 + (i % 3) * 1.6,
    v: 0.25 + (i % 3) * 0.12,
}));

export const Clouds = memo(() => {
    const groupRef = useRef<THREE.Group>(null!);
    const mat = useMemo(
        () =>
            new THREE.SpriteMaterial({
                map: getSoftTexture(),
                color: "#ffffff",
                transparent: true,
                opacity: 0.75,
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
            if (kids[i].position.x > 36) kids[i].position.x = -36;
        }
    });
    return (
        <group ref={groupRef}>
            {CLOUDS.map((c, i) => (
                <sprite key={i} material={mat} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.38, 1]} />
            ))}
        </group>
    );
});
Clouds.displayName = "Clouds";

// =========================================================================
// 🌲 INSTANCED SCENERY — all pines in 2 draw calls, stumps and rocks in 1
// each (was ~320 draw calls as individual meshes).
// =========================================================================
const dummy = new THREE.Object3D();

export const InstancedScenery = ({ stateRef }: any) => {
    const scenery = stateRef.current.scenery;
    const rocks = stateRef.current.rocks;

    const { treeIdx, stumpIdx } = useMemo(() => {
        const t: number[] = [], st: number[] = [];
        scenery.forEach((s: any, i: number) => (s.isStump ? st : t).push(i));
        return { treeIdx: t, stumpIdx: st };
    }, [scenery]);

    const foliageGeo = useMemo(() => {
        const c1 = new THREE.ConeGeometry(2.5, 3, 5); c1.translate(0, 1.6, 0);
        const c2 = new THREE.ConeGeometry(2, 2.5, 5); c2.translate(0, 3.2, 0);
        const c3 = new THREE.ConeGeometry(1.5, 2, 5); c3.translate(0, 4.4, 0);
        return mergeGeometries([c1, c2, c3]);
    }, []);
    const trunkGeo = useMemo(() => {
        const g = new THREE.CylinderGeometry(0.2, 0.4, 0.8, 5);
        g.translate(0, 0.2, 0);
        return g;
    }, []);
    const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.35, 0), []);

    const trunkRef = useRef<THREE.InstancedMesh>(null!);
    const foliageRef = useRef<THREE.InstancedMesh>(null!);
    const stumpRef = useRef<THREE.InstancedMesh>(null!);
    const rockRef = useRef<THREE.InstancedMesh>(null!);

    // per-tree foliage color, fixed for the session
    useEffect(() => {
        if (!foliageRef.current) return;
        const col = new THREE.Color();
        treeIdx.forEach((si, k) => {
            foliageRef.current.setColorAt(k, col.set(scenery[si].mainColor));
        });
        if (foliageRef.current.instanceColor) foliageRef.current.instanceColor.needsUpdate = true;
    }, [treeIdx, scenery]);

    useFrame(() => {
        const sc = stateRef.current.scenery;
        const rk = stateRef.current.rocks;

        if (trunkRef.current && foliageRef.current) {
            treeIdx.forEach((si, k) => {
                dummy.position.set(sc[si].x, 0, sc[si].z);
                dummy.scale.setScalar(0.65);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                trunkRef.current.setMatrixAt(k, dummy.matrix);
                foliageRef.current.setMatrixAt(k, dummy.matrix);
            });
            trunkRef.current.instanceMatrix.needsUpdate = true;
            foliageRef.current.instanceMatrix.needsUpdate = true;
        }
        if (stumpRef.current) {
            stumpIdx.forEach((si, k) => {
                dummy.position.set(sc[si].x, 0, sc[si].z);
                dummy.scale.setScalar(0.8);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                stumpRef.current.setMatrixAt(k, dummy.matrix);
            });
            stumpRef.current.instanceMatrix.needsUpdate = true;
        }
        if (rockRef.current) {
            rk.forEach((r: any, k: number) => {
                dummy.position.set(r.x, 0.1, r.z);
                dummy.scale.setScalar(r.s);
                dummy.rotation.set(0, r.ry, 0);
                dummy.updateMatrix();
                rockRef.current.setMatrixAt(k, dummy.matrix);
            });
            rockRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group>
            <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, treeIdx.length]} frustumCulled={false}>
                <meshStandardMaterial color="#825229" flatShading />
            </instancedMesh>
            <instancedMesh ref={foliageRef} args={[foliageGeo, undefined, treeIdx.length]} frustumCulled={false}>
                <meshStandardMaterial color="#ffffff" flatShading />
            </instancedMesh>
            <instancedMesh ref={stumpRef} args={[trunkGeo, undefined, stumpIdx.length]} frustumCulled={false}>
                <meshStandardMaterial color="#825229" flatShading />
            </instancedMesh>
            <instancedMesh ref={rockRef} args={[rockGeo, undefined, rocks.length]} frustumCulled={false}>
                <meshStandardMaterial color="#cbb49c" flatShading />
            </instancedMesh>
        </group>
    );
};
