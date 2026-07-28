// =========================================================================
// 🦏 build-rhino-model.mjs — authors public/models/rhino.glb
//
// Builds the Rhino Dash character as a real GLB (like the ninja's hero.glb),
// sculpted from displaced/bent primitives with per-face normals (baked
// faceted low-poly look). ONE model serves both duelists — the game tints
// materials per side at load (they are looked up BY NAME, see rhino.tsx).
//
// The node hierarchy is the animation rig — every named node is a pivot the
// game drives directly in useFrame (no skeleton / baked clips; gait speed
// must track live typing force):
//
//   RhinoRoot
//   ├ Body   (pivot at shoulder height — bob / lean / lunge thrust)
//   │ ├ Head (pivot at the neck — head-butt tilts)  [+ BrowL/BrowR meshes,
//   │ │                                hidden for the player at runtime]
//   │ └ Tail (pivot at the base — swish)
//   ├ LegFR / LegFL / LegBR / LegBL  (pivots at the hips — gait swings)
//
// Keep pivots/dimensions in sync with app/rhino-dash/rhino.tsx (BODY_Y,
// leg positions, RHINO_GAP in environment.tsx). Regenerate with:
//   npm run model:rhino
// =========================================================================

import * as fs from "node:fs";
import * as path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// GLTFExporter reads its result Blob through FileReader — shim it for Node.
if (typeof globalThis.FileReader === "undefined") {
    globalThis.FileReader = class {
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then((ab) => {
                this.result = ab;
                this.onloadend?.();
            });
        }
        readAsDataURL(blob) {
            blob.arrayBuffer().then((ab) => {
                this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(ab).toString("base64")}`;
                this.onloadend?.();
            });
        }
    };
}

const OUT = path.resolve(process.cwd(), "public/models/rhino.glb");

// --- materials (neutral hero palette; recolored at runtime by name) ---
const MAT = {
    Body: new THREE.MeshStandardMaterial({ name: "Body", color: "#aeb8c2", roughness: 0.85 }),
    Fold: new THREE.MeshStandardMaterial({ name: "Fold", color: "#96a1ac", roughness: 0.9 }),
    Horn: new THREE.MeshStandardMaterial({ name: "Horn", color: "#f2e8cf", roughness: 0.6 }),
    Hoof: new THREE.MeshStandardMaterial({ name: "Hoof", color: "#5d6670", roughness: 0.8 }),
    Eye: new THREE.MeshStandardMaterial({ name: "Eye", color: "#1f2937", roughness: 0.35 }),
    EyeShine: new THREE.MeshStandardMaterial({ name: "EyeShine", color: "#ffffff", roughness: 0.2 }),
    InnerEar: new THREE.MeshStandardMaterial({ name: "InnerEar", color: "#7d8791", roughness: 0.9 }),
};

// Facet a geometry: unindex + face normals so the export keeps the
// low-poly look without needing a flatShading flag (glTF has none).
const facet = (geo) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.computeVertexNormals();
    if (g !== geo) geo.dispose();
    return g;
};

const mesh = (geo, material, name, { pos, rot, scale } = {}) => {
    const m = new THREE.Mesh(facet(geo), material);
    m.name = name;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scale) m.scale.set(...(typeof scale === "number" ? [scale, scale, scale] : scale));
    return m;
};

// --- body core: ellipsoid with a shoulder hump and a flattened belly ---
const bodyGeo = () => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    g.scale(1.34, 0.95, 0.82);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i);
        if (y > 0) {
            // shoulder hump over the front legs
            y += 0.15 * Math.exp(-((x - 0.55) ** 2) / 0.06) * (y / 0.92);
            // slight rump rise
            y += 0.06 * Math.exp(-((x + 0.85) ** 2) / 0.1) * (y / 0.92);
        }
        if (y < -0.6) y = -0.6 + (y + 0.6) * 0.45; // flatten the belly
        p.setY(i, y);
    }
    return g;
};

// --- the big horn: cone bent gently backwards ---
const hornGeo = (r, h) => {
    const g = new THREE.ConeGeometry(r, h, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + h / 2) / h; // 0 at base → 1 at tip
        p.setX(i, p.getX(i) - 0.22 * h * t * t);
    }
    return g;
};

// --- assemble ---
const root = new THREE.Group();
root.name = "RhinoRoot";

const body = new THREE.Group();
body.name = "Body";
body.position.set(0, 1.12, 0);
root.add(body);

body.add(mesh(bodyGeo(), MAT.Body, "BodyCore"));
// chest fill toward the head
body.add(mesh(new THREE.IcosahedronGeometry(1, 1), MAT.Body, "Chest", { pos: [0.72, -0.05, 0], scale: [0.62, 0.68, 0.66] }));
// skin-fold bands ringing the torso (rhino "armor plates")
body.add(mesh(new THREE.TorusGeometry(0.9, 0.055, 8, 22), MAT.Fold, "FoldShoulder", { pos: [0.34, 0.02, 0], rot: [0, Math.PI / 2, 0], scale: [0.94, 0.99, 1] }));
body.add(mesh(new THREE.TorusGeometry(0.86, 0.05, 8, 22), MAT.Fold, "FoldHip", { pos: [-0.52, 0.02, 0], rot: [0, Math.PI / 2, 0], scale: [0.9, 0.97, 1] }));

// --- head ---
const head = new THREE.Group();
head.name = "Head";
head.position.set(1.12, 0.14, 0);
body.add(head);

head.add(mesh(new THREE.IcosahedronGeometry(1, 1), MAT.Body, "Skull", { scale: [0.74, 0.62, 0.6] }));
head.add(mesh(new THREE.IcosahedronGeometry(1, 1), MAT.Body, "Snout", { pos: [0.52, -0.14, 0], scale: [0.52, 0.42, 0.5] }));
head.add(mesh(new THREE.IcosahedronGeometry(1, 0), MAT.Fold, "Jaw", { pos: [0.34, -0.4, 0], scale: [0.34, 0.18, 0.34] }));
// horns
head.add(mesh(hornGeo(0.18, 0.95), MAT.Horn, "HornMain", { pos: [0.84, 0.42, 0], rot: [0, 0, -0.5] }));
head.add(mesh(hornGeo(0.12, 0.42), MAT.Horn, "HornSmall", { pos: [0.42, 0.48, 0], rot: [0, 0, -0.35] }));
// ears (outer + inner)
for (const side of [1, -1]) {
    const sfx = side > 0 ? "R" : "L";
    head.add(mesh(new THREE.ConeGeometry(0.13, 0.34, 6), MAT.Fold, `Ear${sfx}`, { pos: [-0.32, 0.54, 0.25 * side], rot: [0.38 * side, 0, 0.28] }));
    head.add(mesh(new THREE.ConeGeometry(0.075, 0.2, 6), MAT.InnerEar, `EarInner${sfx}`, { pos: [-0.29, 0.52, 0.27 * side], rot: [0.38 * side, 0, 0.28] }));
}
// eyes + shine + brow ridges (brows hidden for the hero at runtime)
for (const side of [1, -1]) {
    const sfx = side > 0 ? "R" : "L";
    head.add(mesh(new THREE.SphereGeometry(0.085, 10, 8), MAT.Eye, `Eye${sfx}`, { pos: [0.22, 0.16, 0.36 * side] }));
    head.add(mesh(new THREE.SphereGeometry(0.026, 6, 6), MAT.EyeShine, `EyeShine${sfx}`, { pos: [0.25, 0.19, 0.4 * side] }));
    head.add(mesh(new THREE.BoxGeometry(0.2, 0.05, 0.09), MAT.Fold, `Brow${sfx}`, { pos: [0.24, 0.26, 0.36 * side], rot: [0, 0, -0.5] }));
}

// --- tail ---
const tail = new THREE.Group();
tail.name = "Tail";
tail.position.set(-1.24, 0.18, 0);
body.add(tail);
tail.add(mesh(new THREE.CylinderGeometry(0.05, 0.032, 0.34, 6), MAT.Fold, "TailUpper", { pos: [-0.08, -0.12, 0], rot: [0, 0, 0.65] }));
tail.add(mesh(new THREE.CylinderGeometry(0.032, 0.02, 0.3, 6), MAT.Fold, "TailLower", { pos: [-0.24, -0.36, 0], rot: [0, 0, 0.3] }));
tail.add(mesh(new THREE.ConeGeometry(0.075, 0.22, 6), MAT.Hoof, "TailTuft", { pos: [-0.29, -0.56, 0], rot: [Math.PI, 0, 0] }));

// --- legs: hip-pivot groups with knee, hoof and three toes ---
const LEGS = [
    ["LegFR", 0.62, 0.42],
    ["LegFL", 0.62, -0.42],
    ["LegBR", -0.72, 0.42],
    ["LegBL", -0.72, -0.42],
];
for (const [name, lx, lz] of LEGS) {
    const leg = new THREE.Group();
    leg.name = name;
    leg.position.set(lx, 0.78, lz);
    root.add(leg);
    leg.add(mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.6, 8), MAT.Body, `${name}Upper`, { pos: [0, -0.27, 0] }));
    leg.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), MAT.Body, `${name}Knee`, { pos: [0, -0.44, 0] }));
    leg.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.28, 8), MAT.Body, `${name}Lower`, { pos: [0, -0.56, 0] }));
    leg.add(mesh(new THREE.BoxGeometry(0.3, 0.16, 0.3), MAT.Hoof, `${name}Hoof`, { pos: [0, -0.66, 0] }));
    // three toes across the front of the hoof
    for (let t = 0; t < 3; t++) {
        leg.add(mesh(new THREE.BoxGeometry(0.085, 0.11, 0.08), MAT.Horn, `${name}Toe${t}`, { pos: [0.16, -0.69, -0.09 + t * 0.09] }));
    }
}

// --- report + export ---
const bbox = new THREE.Box3().setFromObject(root);
const size = new THREE.Vector3();
bbox.getSize(size);
console.log(`bbox min ${bbox.min.toArray().map((v) => v.toFixed(2))} max ${bbox.max.toArray().map((v) => v.toFixed(2))}`);
console.log(`size ${size.toArray().map((v) => v.toFixed(2))}`);
let meshes = 0;
root.traverse((o) => { if (o.isMesh) meshes++; });
console.log(`meshes: ${meshes}`);

const exporter = new GLTFExporter();
exporter.parse(
    root,
    (result) => {
        fs.mkdirSync(path.dirname(OUT), { recursive: true });
        fs.writeFileSync(OUT, Buffer.from(result));
        console.log(`✓ wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
    },
    (err) => {
        console.error("export failed:", err);
        process.exit(1);
    },
    { binary: true }
);
