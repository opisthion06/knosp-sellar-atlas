import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const C = window.Core;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = () => new Promise((r) => setTimeout(r, 0));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================================
// Content & language (texts live in content.js → window.KC)
// =====================================================================
const KC = window.KC;
let LANG = 'tr';
try { const s = localStorage.getItem('knosp-lang'); if (s === 'tr' || s === 'en') LANG = s; } catch (e) { /* storage unavailable */ }
const T = () => KC[LANG];
const t = (key, vars) => {
  let s = KC[LANG].ui[key] ?? KC.tr.ui[key] ?? key;
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
};
const infoOf = (id) => KC[LANG].info[id];
const GRADE_TXT = KC.GT;

// Bone landmarks (left side; mirrored automatically when x < 0)
const BONE_LM = {
  sella: [0, -5.2, 0.5], sellarfloor: [0, -7.4, 1], dorsum: [0, 6.5, -6.3], pclin: [5.8, 8.6, -6.3], aclin: [14.2, 2.8, 2.5], tuberculum: [0, 1.1, 6.6],
  planum: [0, 0.9, 19], sinus: [0, -13, 9], septum: [1.4, -13, 5], carprom: [7.2, -9.2, 5], clivus: [0, -16, -15], opticcanal: [10.8, 1.4, 16],
  rotundum: [15.7, -8.6, 13.5], ovale: [21, -15.5, -4.3], petrous: [22, -6.5, -22], mcf: [25, -16, 0]
};

// Labels: id (info key), optional key (step-label key with its own text), layer, anchor (fn of dynamic state)
const LABELS = [
  ...Object.entries(BONE_LM).map(([id, p]) => ({ id, layer: 'bone', pos: () => p })),
  { id: 'gland_a', layer: 'gland', pos: () => { const a = cur.gland.a; return [a[0], a[1] + 0.8, a[2] + a[5] * 0.8]; } },
  { id: 'gland_p', layer: 'gland', pos: () => { const p = cur.gland.p; return [p[0], p[1] + p[4] * 0.7, p[2] - p[5] * 0.4]; } },
  { id: 'stalk', layer: 'gland', pos: () => { const m = cur.gland.mid; return [m[0] / 2, (m[1] + 6.3) / 2, (m[2] - 2.8) / 2]; } },
  { id: 'diaphragma', layer: 'diaphragma', pos: () => [-6.8, diaEdgeY(), 2.5] },
  { id: 'chiasm', layer: 'optic', pos: () => [0, 8.7, 2.4] },
  { id: 'opticnerve', layer: 'optic', pos: () => [7.4, 3.6, 8.2] },
  { id: 'optictract', layer: 'optic', pos: () => [10.8, 10.4, -9] },
  { id: 'cs', layer: 'cs', pos: () => [16.5 + cur.push * 0.8, 0.8, -4.5] },
  { id: 'ica', key: 'ica_c2', layer: 'ica', pos: () => [18.5, -12.2, -19] },
  { id: 'ica', key: 'ica_c4', layer: 'ica', pos: () => [10.5, -2.6, -0.5] },
  { id: 'ica', key: 'ica_c5', layer: 'ica', pos: () => [13.2, -0.9, 8.7] },
  { id: 'ica', key: 'ica_c6', layer: 'ica', pos: () => [9.7, 6.9, 3.8] },
  { id: 'ica', key: 'ica_c7', layer: 'ica', pos: () => [11.9, 8.6, -1.4] },
  { id: 'mca', layer: 'vessels', pos: () => [22, 11.3, -0.2] },
  { id: 'a1', layer: 'vessels', pos: () => [5, 11.8, 3] },
  { id: 'pcom', layer: 'vessels', pos: () => [9.2, 7.7, -6] },
  { id: 'basilar', layer: 'vessels', pos: () => [0, -6, -18.6] },
  { id: 'pca', layer: 'vessels', pos: () => [12, 8.5, -13.2] },
  { id: 'sca', layer: 'vessels', pos: () => [9.5, 2.9, -15.6] },
  { id: 'oph', layer: 'vessels', pos: () => [8.6, 1.6, 8.4] },
  { id: 'cn3', layer: 'nerves', pos: () => [15.2 + cur.push, 0.1, 1] },
  { id: 'cn4', layer: 'nerves', pos: () => [16.8 + cur.push, -2.9, 4] },
  { id: 'v1', layer: 'nerves', pos: () => [16.6 + cur.push, -4.7, 4] },
  { id: 'v2', layer: 'nerves', pos: () => [17.1 + cur.push, -7.3, 4.5] },
  { id: 'cn6', layer: 'nerves', pos: () => [13.6 + cur.push * 0.4, -7.7, 4] },
  { id: 'v3', layer: 'nerves', pos: () => [22.8, -18, -3.5] },
  { id: 'gg', layer: 'nerves', pos: () => [20, -6.8, -10] },
  { id: 'cn5', layer: 'nerves', pos: () => [10, -3.6, -15] },
  { id: 'tumor', layer: 'tumor', pos: () => [0.4, 5.4, 1.2] }
];
const labelText = (L) => (L.key && T().labelText[L.key]) || infoOf(L.id)[0];

const V = {
  overview: { pos: [60, 60, 30], tgt: [4, -3, -1] },
  boneTop: { pos: [18, 88, 36], tgt: [2, -4, 1] },
  endonasal: { pos: [0, -19, 56], tgt: [0, -8.5, 0] },
  glandTop: { pos: [-24, 46, 40], tgt: [0, -0.5, 0] },
  csLat: { pos: [66, 20, 34], tgt: [10, -4, 0] },
  icaLat: { pos: [74, 6, 16], tgt: [9, -2, -3] },
  nerves: { pos: [60, 4, 44], tgt: [13, -3, 2] },
  coronal: { pos: [5, 0, 72], tgt: [5, -1, 0] },
  grade: { pos: [30, 16, 60], tgt: [7, -2, 1] },
  summary: { pos: [-40, 58, 56], tgt: [3, -3, 0] }
};

// Scene state for each lesson step; texts come from KC[LANG].steps[i]
const gradeDef = (g) => ({
  grade: g, isGrade: true, view: 'grade', cut: true, zc: 3.5, inset: true, layers: { lines: true },
  labels: g === 'g3b' || g === 'g4' ? ['tumor', 'cn6', 'v2', 'ica_c4'] : ['tumor', 'ica_c4', 'ica_c6', 'cn3']
});
const STEPS = [
  { view: 'overview', grade: 'none', labels: ['gland_a', 'chiasm', 'cs', 'ica_c4', 'ica_c6', 'dorsum', 'aclin', 'sinus'] },
  { view: 'boneTop', grade: 'none', layers: { gland: false, diaphragma: false, optic: false, vessels: false, nerves: false, cs: false },
    labels: ['sella', 'tuberculum', 'planum', 'dorsum', 'pclin', 'aclin', 'opticcanal', 'rotundum', 'ovale', 'petrous', 'clivus', 'ica_c4'] },
  { view: 'endonasal', grade: 'none', bone: 1, layers: { cs: false, optic: false, vessels: false },
    labels: ['sellarfloor', 'carprom', 'septum', 'sinus', 'clivus', 'planum'] },
  { view: 'glandTop', grade: 'none', layers: { cs: false, nerves: false, vessels: true },
    labels: ['gland_a', 'gland_p', 'stalk', 'diaphragma', 'chiasm', 'opticnerve', 'a1', 'ica_c6'] },
  { view: 'csLat', grade: 'none', layers: { vessels: false }, labels: ['cs', 'ica_c4', 'cn3', 'v1', 'v2', 'gland_a', 'aclin', 'petrous'] },
  { view: 'icaLat', grade: 'none', bone: 0.22, layers: { cs: false, nerves: false, diaphragma: false },
    labels: ['ica_c2', 'ica_c4', 'ica_c5', 'ica_c6', 'ica_c7', 'oph', 'pcom', 'mca', 'aclin'] },
  { view: 'nerves', grade: 'none', bone: 0.55, layers: { vessels: false, diaphragma: false, optic: false },
    labels: ['cn3', 'cn4', 'v1', 'v2', 'cn6', 'v3', 'gg', 'ica_c4'] },
  { view: 'coronal', grade: 'none', cut: true, zc: 3.5, inset: true, layers: { lines: true },
    labels: ['ica_c4', 'ica_c6', 'gland_a', 'sinus', 'cn3', 'v2', 'cn6'] },
  gradeDef('g0'), gradeDef('g1'), gradeDef('g2'), gradeDef('g3a'), gradeDef('g3b'), gradeDef('g4'),
  { view: 'summary', grade: 'g3b', cut: false, inset: false, autorotate: true, labels: ['tumor', 'ica_c4', 'cn6', 'v2', 'chiasm'] }
];

// =====================================================================
// Renderer / scene
// =====================================================================
const viewport = $('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.domElement.className = 'gl';
viewport.prepend(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
renderer.domElement.after(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 1200);
camera.position.set(...V.overview.pos);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(...V.overview.tgt);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 14; controls.maxDistance = 240;
controls.rotateSpeed = 0.75; controls.zoomSpeed = 0.9; controls.screenSpacePanning = true;
controls.autoRotateSpeed = 0.6;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.75;
const key = new THREE.DirectionalLight(0xfff0dc, 2.3);
key.position.set(38, 78, 58); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 260 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.04; key.shadow.radius = 3;
key.target.position.set(0, -5, 0);
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0xb9ccff, 0.55); fill.position.set(-60, 18, -20); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe2d0, 0.7); rim.position.set(10, -30, -70); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a1f1a, 0.35));

const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e4);

// ---------- shader patching: cut caps, micro-relief, fresnel veil ----------
const NOISE_GLSL = `
float h3n(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3n(i),h3n(i+vec3(1,0,0)),f.x), mix(h3n(i+vec3(0,1,0)),h3n(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3n(i+vec3(0,0,1)),h3n(i+vec3(1,0,1)),f.x), mix(h3n(i+vec3(0,1,1)),h3n(i+vec3(1,1,1)),f.x),f.y), f.z); }`;
function patch(m, kind, cap, bump = 0) {
  m.clippingPlanes = [clipPlane];
  m.clipShadows = true;
  if (cap) { m.side = THREE.DoubleSide; m.shadowSide = THREE.BackSide; }
  const capColor = new THREE.Color(cap || '#000000');
  m.userData.kind = kind;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCap = { value: capColor };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;\nuniform vec3 uCap;\n' + NOISE_GLSL);
    if (bump > 0) {
      fs = fs.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = normalize(normal + ${bump.toFixed(3)} * faceDirection * (vec3(vnoise(vW*3.1), vnoise(vW*3.1+7.7), vnoise(vW*3.1+13.3)) - 0.5)
                                  + ${(bump * 0.5).toFixed(3)} * faceDirection * (vec3(vnoise(vW*9.0), vnoise(vW*9.0+3.1), vnoise(vW*9.0+5.3)) - 0.5));`);
    }
    if (cap) {
      fs = fs.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        if (!gl_FrontFacing) {
          float n = vnoise(vW*1.4);
          vec3 c = uCap * (0.82 + 0.3*n);
          ${kind === 'bone' ? 'float tr = smoothstep(0.52,0.74, vnoise(vW*3.4)); c = mix(c, uCap*0.5, tr*0.75);' : ''}
          ${kind === 'tumor' ? 'c *= 0.9 + 0.2*vnoise(vW*2.6);' : ''}
          gl_FragColor = vec4(c, 1.0);
        }`);
    }
    if (kind === 'veil') {
      fs = fs.replace('#include <opaque_fragment>', `#include <opaque_fragment>
        float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
        gl_FragColor.a = clamp(gl_FragColor.a * (0.45 + 2.2*fr), 0.0, 0.88);`);
    }
    sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => `${kind}|${cap ? 1 : 0}|${bump}`;
  return m;
}

// nerve fibre texture
function fibreTexture() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#e9dcb4'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 64, a = 0.05 + Math.random() * 0.12;
    g.strokeStyle = Math.random() < 0.5 ? `rgba(120,95,40,${a})` : `rgba(255,250,230,${a * 1.4})`;
    g.lineWidth = 0.6 + Math.random() * 1.4;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 0.8);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const FIBRE = fibreTexture();

const MAT = {
  bone: () => patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 }), 'bone', '#cdb88f', 0.22),
  artery: () => patch(new THREE.MeshPhysicalMaterial({ color: '#a8141f', roughness: 0.38, clearcoat: 0.85, clearcoatRoughness: 0.16, sheen: 0.12, sheenColor: new THREE.Color('#ff6a60') }), 'artery', '#6e0d15', 0.03),
  nerve: () => patch(new THREE.MeshPhysicalMaterial({ color: '#ecd394', map: FIBRE, bumpMap: FIBRE, bumpScale: 0.6, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#fff4cc'), clearcoat: 0.2 }), 'nerve', '#cdb27a'),
  optic: () => patch(new THREE.MeshPhysicalMaterial({ color: '#dccaa2', roughness: 0.6, sheen: 0.35, sheenColor: new THREE.Color('#fff0cc'), clearcoat: 0.15 }), 'optic', '#cdb98f', 0.12),
  gland: () => patch(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color('#ffd0c0') }), 'gland', '#b85e48', 0.06),
  tumor: () => patch(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.35, sheenColor: new THREE.Color('#ecc8e0') }), 'tumor', '#7d5a70', 0.1),
  cs: () => patch(new THREE.MeshPhysicalMaterial({ color: '#6a5cc8', roughness: 0.25, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 0.4 }), 'veil', null),
  dia: () => patch(new THREE.MeshPhysicalMaterial({ color: '#d8c6b4', roughness: 0.45, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, sheen: 0.4 }), 'dia', null)
};

// =====================================================================
// Geometry builders
// =====================================================================
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
function surfaceNets(G) {
  const { f, nx, ny, nz, ox, oy, oz, h } = G;
  const nxy = nx * ny;
  const cell = new Int32Array(nx * ny * nz);
  let pos = new Float32Array(3 * 32768), vc = 0;
  let idx = new Uint32Array(6 * 32768), ic = 0;
  const g = new Float64Array(8), co = [0, 0, 0], R = [1, nx, nxy];
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      let ci = j * nx + k * nxy;
      for (let i = 0; i < nx - 1; i++, ci++) {
        g[0] = f[ci]; g[1] = f[ci + 1]; g[2] = f[ci + nx]; g[3] = f[ci + nx + 1];
        g[4] = f[ci + nxy]; g[5] = f[ci + nxy + 1]; g[6] = f[ci + nxy + nx]; g[7] = f[ci + nxy + nx + 1];
        let mask = 0;
        for (let c = 0; c < 8; c++) if (g[c] < 0) mask |= 1 << c;
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (let e = 0; e < 12; e++) {
          const a = EDGES[e][0], b = EDGES[e][1];
          if (((mask >> a) & 1) === ((mask >> b) & 1)) continue;
          const t = g[a] / (g[a] - g[b]);
          const ax = a & 1, ay = (a >> 1) & 1, az = (a >> 2) & 1;
          sx += ax + ((b & 1) - ax) * t; sy += ay + (((b >> 1) & 1) - ay) * t; sz += az + (((b >> 2) & 1) - az) * t; cnt++;
        }
        if (vc * 3 + 3 > pos.length) { const n = new Float32Array(pos.length * 2); n.set(pos); pos = n; }
        pos[vc * 3] = ox + (i + sx / cnt) * h; pos[vc * 3 + 1] = oy + (j + sy / cnt) * h; pos[vc * 3 + 2] = oz + (k + sz / cnt) * h;
        cell[ci] = vc++;
        co[0] = i; co[1] = j; co[2] = k;
        for (let d = 0; d < 3; d++) {
          const s0 = mask & 1, s1 = (mask >> (1 << d)) & 1;
          if (s0 === s1) continue;
          const u = (d + 1) % 3, v = (d + 2) % 3;
          if (co[u] === 0 || co[v] === 0) continue;
          const A = cell[ci], B = cell[ci - R[u]], Cc = cell[ci - R[u] - R[v]], D = cell[ci - R[v]];
          if (ic + 6 > idx.length) { const n = new Uint32Array(idx.length * 2); n.set(idx); idx = n; }
          if (s0) { idx[ic++] = A; idx[ic++] = B; idx[ic++] = Cc; idx[ic++] = A; idx[ic++] = Cc; idx[ic++] = D; }
          else { idx[ic++] = A; idx[ic++] = Cc; idx[ic++] = B; idx[ic++] = A; idx[ic++] = D; idx[ic++] = Cc; }
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, vc * 3), 3));
  geo.setIndex(new THREE.BufferAttribute(idx.slice(0, ic), 1));
  geo.computeVertexNormals();
  return geo;
}
function makeGrid(b, h) {
  const nx = Math.round((b[1] - b[0]) / h) + 1, ny = Math.round((b[3] - b[2]) / h) + 1, nz = Math.round((b[5] - b[4]) / h) + 1;
  return { nx, ny, nz, ox: b[0], oy: b[2], oz: b[4], h, f: new Float32Array(nx * ny * nz) };
}
function fillGrid(G, fn) {
  const { nx, ny, nz, ox, oy, oz, h, f } = G;
  let i = 0;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let x = 0; x < nx; x++) f[i++] = fn(ox + x * h, oy + j * h, oz + k * h, i - 1);
}
function trilinear(G, x, y, z) {
  const fx = (x - G.ox) / G.h, fy = (y - G.oy) / G.h, fz = (z - G.oz) / G.h;
  if (fx < 0 || fy < 0 || fz < 0 || fx >= G.nx - 1 || fy >= G.ny - 1 || fz >= G.nz - 1) return 5;
  const i = fx | 0, j = fy | 0, k = fz | 0, u = fx - i, v = fy - j, w = fz - k;
  const nx = G.nx, nxy = G.nx * G.ny, o = i + j * nx + k * nxy, f = G.f;
  const c00 = f[o] + (f[o + 1] - f[o]) * u, c10 = f[o + nx] + (f[o + nx + 1] - f[o + nx]) * u;
  const c01 = f[o + nxy] + (f[o + nxy + 1] - f[o + nxy]) * u, c11 = f[o + nxy + nx] + (f[o + nxy + nx + 1] - f[o + nxy + nx]) * u;
  const c0 = c00 + (c10 - c00) * v, c1 = c01 + (c11 - c01) * v;
  return c0 + (c1 - c0) * w;
}

// Tube with per-point radius, parallel-transport frames and rounded ends
function tubeGeometry(path, radial = 14) {
  const n = path.n, { X, Y, Z, R } = path;
  const ds = path.length / (n - 1);
  const pos = new Float32Array(n * (radial + 1) * 3), nor = new Float32Array(n * (radial + 1) * 3), uv = new Float32Array(n * (radial + 1) * 2);
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3(), rd = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    T.set(X[b] - X[a], Y[b] - Y[a], Z[b] - Z[a]).normalize();
    if (i === 0) { tmp.set(0, 1, 0); if (Math.abs(T.dot(tmp)) > 0.9) tmp.set(1, 0, 0); N.crossVectors(T, tmp).normalize(); }
    else { N.addScaledVector(T, -N.dot(T)).normalize(); }
    B.crossVectors(T, N).normalize();
    const s = Math.min(i, n - 1 - i) * ds, r0 = R[i];
    let r = r0, tilt = 0;
    if (s < r0) { const q = 1 - s / r0; r = r0 * Math.sqrt(Math.max(0, 1 - q * q)); tilt = (i < n / 2 ? -1 : 1) * q; }
    for (let j = 0; j <= radial; j++) {
      const ang = (j / radial) * Math.PI * 2, c = Math.cos(ang), sn = Math.sin(ang);
      rd.set(N.x * c + B.x * sn, N.y * c + B.y * sn, N.z * c + B.z * sn);
      const o = (i * (radial + 1) + j);
      pos[o * 3] = X[i] + rd.x * r; pos[o * 3 + 1] = Y[i] + rd.y * r; pos[o * 3 + 2] = Z[i] + rd.z * r;
      tmp.copy(rd).multiplyScalar(Math.sqrt(1 - tilt * tilt)).addScaledVector(T, tilt).normalize();
      nor[o * 3] = tmp.x; nor[o * 3 + 1] = tmp.y; nor[o * 3 + 2] = tmp.z;
      uv[o * 2] = (i * ds) / 5; uv[o * 2 + 1] = j / radial;
    }
  }
  const index = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    index.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  return geo;
}

// =====================================================================
// Scene graph
// =====================================================================
const layers = {};
['bone', 'gland', 'tumor', 'ica', 'vessels', 'nerves', 'cs', 'optic', 'diaphragma', 'lines', 'mrplane'].forEach((k) => {
  layers[k] = new THREE.Group(); layers[k].name = k; scene.add(layers[k]);
});
const pickables = [];
function addMesh(layer, geo, mat, id, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.userData.id = id;
  m.castShadow = opts.cast !== false; m.receiveShadow = true;
  layers[layer].add(m);
  if (opts.pick !== false) pickables.push(m);
  return m;
}
function replaceGeo(mesh, geo, bvh) {
  if (mesh.geometry.boundsTree) mesh.geometry.disposeBoundsTree();
  mesh.geometry.dispose();
  mesh.geometry = geo;
  if (bvh && geo.index && geo.index.count > 0) geo.computeBoundsTree();
}

// ---------- tubes: ICA, arteries, nerves ----------
const icaDense = C.makePath(C.A.ica.ctrl, C.A.ica.radii, 0.3);
const icaDenseR = C.makePath(C.mirror(C.A.ica.ctrl), C.A.ica.radii, 0.3);
for (const [p, side] of [[icaDense, 1], [icaDenseR, -1]]) {
  const m = addMesh('ica', tubeGeometry(p, 22), MAT.artery(), 'ica');
  m.userData.path = p; m.userData.side = side;
}
const vesselCoarse = [];
for (const [id, v] of Object.entries(C.A.vessels)) {
  for (const ctrl of [v.ctrl, C.mirror(v.ctrl)]) {
    addMesh('vessels', tubeGeometry(C.makePath(ctrl, v.radii, 0.3), 12), MAT.artery(), id);
    vesselCoarse.push(C.makePath(ctrl, v.radii, 0.8));
  }
}
for (const [id, v] of Object.entries(C.A.midline)) {
  addMesh('vessels', tubeGeometry(C.makePath(v.ctrl, v.radii, 0.3), 14), MAT.artery(), id);
  vesselCoarse.push(C.makePath(v.ctrl, v.radii, 0.8));
}
// nerves
const nerveMeshL = {}, nerveCoarseL = {}, nerveCoarseStatic = [];
function pushedCtrl(ctrl, push, factor) { return ctrl.map((p) => [p[0] + push * factor * C.pushW(p[2]), p[1], p[2]]); }
for (const [id, nv] of Object.entries(C.A.nerves)) {
  const radii = nv.ctrl.map(() => nv.r);
  const pR = C.makePath(C.mirror(nv.ctrl), radii, 0.3);
  addMesh('nerves', tubeGeometry(pR, 12), MAT.nerve(), id);
  nerveCoarseStatic.push(C.makePath(C.mirror(nv.ctrl), radii, 0.8));
  nerveMeshL[id] = addMesh('nerves', tubeGeometry(C.makePath(nv.ctrl, radii, 0.3), 12), MAT.nerve(), id);
  nerveCoarseL[id] = C.makePath(nv.ctrl, radii, 0.8);
}
for (const [id, nv] of Object.entries(C.A.nervesStatic)) {
  const radii = nv.ctrl.map(() => nv.r);
  for (const ctrl of [nv.ctrl, C.mirror(nv.ctrl)]) {
    addMesh('nerves', tubeGeometry(C.makePath(ctrl, radii, 0.3), 14), MAT.nerve(), id);
    nerveCoarseStatic.push(C.makePath(ctrl, radii, 0.8));
  }
}
for (const s of [1, -1]) {
  const g = new THREE.SphereGeometry(1, 40, 24);
  const m = addMesh('nerves', g, MAT.nerve(), 'gg');
  const a = C.A.ganglion;
  m.scale.set(a.r[0], a.r[1], a.r[2]); m.position.set(a.c[0] * s, a.c[1], a.c[2]); m.rotation.y = a.yaw * s;
}
function updateNerves(push) {
  for (const [id, nv] of Object.entries(C.A.nerves)) {
    const radii = nv.ctrl.map(() => nv.r), f = id === 'cn6' ? 0.4 : 1;
    const ctrl = pushedCtrl(nv.ctrl, push, f);
    replaceGeo(nerveMeshL[id], tubeGeometry(C.makePath(ctrl, radii, 0.3), 12), false);
    nerveCoarseL[id] = C.makePath(ctrl, radii, 0.8);
  }
}
function nerveDist(x, y, z) {
  let d = 1e3;
  for (const p of nerveCoarseStatic) d = Math.min(d, p.dist(x, y, z, 2));
  if (x > 0) for (const k in nerveCoarseL) d = Math.min(d, nerveCoarseL[k].dist(x, y, z, 2));
  return d;
}
function vesselDist(x, y, z) { let d = 1e3; for (const p of vesselCoarse) d = Math.min(d, p.dist(x, y, z, 2)); return d; }

// ---------- diaphragma ----------
const diaGeo = new THREE.RingGeometry(0.24, 1, 72, 10);
diaGeo.rotateX(-Math.PI / 2);
const diaBase = diaGeo.attributes.position.array.slice();
const DIA = { sx: 8.6, sz: 6.4, cz: -0.4, y: -1.3 };
const diaMesh = addMesh('diaphragma', diaGeo, MAT.dia(), 'diaphragma', { cast: false });
let diaEdge = DIA.y;
function diaEdgeY() { return diaEdge + 0.2; }
function updateDiaphragma(st) {
  const p = diaGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const u = diaBase[i], w = diaBase[i + 2], rho = Math.hypot(u, w);
    const x = u * DIA.sx, z = w * DIA.sz + DIA.cz;
    let y = DIA.y;
    for (let yy = 9; yy > DIA.y; yy -= 0.3) {
      if (C.tumorRaw(x, yy, z, st.slots) < 0) { y = Math.max(y, yy + 0.45); break; }
    }
    const k = 1 - THREE.MathUtils.smoothstep(rho, 0.78, 1.0);
    p[i] = x; p[i + 1] = DIA.y + (y - DIA.y) * k; p[i + 2] = z;
  }
  diaEdge = DIA.y;
  diaGeo.attributes.position.needsUpdate = true;
  diaGeo.computeVertexNormals();
  diaGeo.computeBoundingSphere();
}

// ---------- Knosp line meshes ----------
const LINE_COL = { medial: '#5fcbe3', central: '#f0c75e', lateral: '#ec7ba2' };
const lineMats = Object.fromEntries(Object.entries(LINE_COL).map(([k, c]) => [k, new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, opacity: 0.95, toneMapped: false })]));
const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true, opacity: 0.8, toneMapped: false });
let knosp = null;
const zoneLabels = [];
function segMesh(a, b, mat, r = 0.16) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  m.renderOrder = 20;
  return m;
}
function rebuildLines() {
  const grp = layers.lines;
  grp.children.slice().forEach((c) => { grp.remove(c); c.geometry?.dispose(); });
  zoneLabels.forEach((l) => { l.parent && l.parent.remove(l); });
  zoneLabels.length = 0;
  knosp = C.knospAt(icaDense, state.zc);
  if (!knosp) return;
  const z = state.zc + 0.06;
  for (const s of [1, -1]) {
    for (const k of ['medial', 'central', 'lateral']) {
      const [a, b] = knosp[k];
      grp.add(segMesh([a[0] * s, a[1], z], [b[0] * s, b[1], z], lineMats[k]));
    }
    for (const c of [knosp.lo, knosp.up]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(c.r, 0.07, 6, 48), ringMat);
      ring.position.set(c.x * s, c.y, z); ring.renderOrder = 21; grp.add(ring);
    }
    // zone numbers
    const ytop = knosp.up.y + knosp.up.r + 3.2;
    const xs = [C.lineX(knosp.medial, ytop), C.lineX(knosp.central, ytop), C.lineX(knosp.lateral, ytop)];
    const mids = [xs[0] - 1.6, (xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2, xs[2] + 1.8];
    mids.forEach((mx, i) => {
      const el = document.createElement('div'); el.className = 'zone'; el.textContent = String(i);
      const o = new CSS2DObject(el); o.position.set(mx * s, ytop, z); grp.add(o); zoneLabels.push(o);
    });
  }
}

// =====================================================================
// State
// =====================================================================
const state = {
  grade: 'none', step: 0, cut: false, zc: 3.5, boneOpacity: 1, labelMode: 'step', stepLabels: [],
  layers: { bone: true, gland: true, tumor: true, ica: true, vessels: true, nerves: true, cs: true, optic: true, diaphragma: true, lines: true, mrplane: false },
  inset: false, quiz: null
};
let cur = C.lerpState(C.STATES.none, C.STATES.none, 0);
let morph = null;
let meshes = {};

// =====================================================================
// Heavy builds (async with progress)
// =====================================================================
const loaderBar = $('loadBar'), loaderTxt = $('loadTxt');
async function progress(t, p) { loaderTxt.textContent = t; loaderBar.style.width = `${Math.round(p * 100)}%`; await sleep(); }

let boneG, tumG, glaG, csG;
async function buildBone() {
  const B = [-36, 36, -29, 11, -32, 32];
  // coarse pass
  const coarse = makeGrid(B, 1.1);
  let i = 0;
  for (let k = 0; k < coarse.nz; k++) {
    for (let j = 0; j < coarse.ny; j++) for (let x = 0; x < coarse.nx; x++) coarse.f[i++] = C.boneSDF(coarse.ox + x * coarse.h, coarse.oy + j * coarse.h, coarse.oz + k * coarse.h);
    if (k % 6 === 0) await progress(t('load.skull'), 0.05 + 0.2 * (k / coarse.nz));
  }
  const G = makeGrid(B, 0.55);
  i = 0;
  for (let k = 0; k < G.nz; k++) {
    const z = G.oz + k * G.h;
    for (let j = 0; j < G.ny; j++) {
      const y = G.oy + j * G.h;
      for (let x = 0; x < G.nx; x++) {
        const xx = G.ox + x * G.h;
        const c = trilinear(coarse, xx, y, z);
        G.f[i++] = Math.abs(c) > 2.4 ? c : C.boneSDF(xx, y, z);
      }
    }
    if (k % 8 === 0) await progress(t('load.bone'), 0.25 + 0.45 * (k / G.nz));
  }
  await progress(t('load.mesh'), 0.72);
  const geo = surfaceNets(G);
  // vertex colours: ivory, marbling and SDF ambient occlusion
  const p = geo.attributes.position.array, nrm = geo.attributes.normal.array;
  const col = new Float32Array(p.length);
  const base = new THREE.Color('#e2d4b6'), warm = new THREE.Color('#c9b088'), grey = new THREE.Color('#b9b2a3'), tmp = new THREE.Color();
  const steps = [0.7, 1.5, 3.0, 5.5], wts = [0.34, 0.3, 0.22, 0.14];
  for (let v = 0; v < p.length; v += 3) {
    const x = p[v], y = p[v + 1], z = p[v + 2];
    let occ = 0;
    for (let s = 0; s < 4; s++) {
      const d = trilinear(G, x + nrm[v] * steps[s], y + nrm[v + 1] * steps[s], z + nrm[v + 2] * steps[s]);
      occ += wts[s] * Math.max(0, steps[s] - d) / steps[s];
    }
    const ao = clamp(1 - 1.6 * occ, 0.12, 1);
    const m = 0.5 + 0.5 * C.noise3(x * 0.16, y * 0.16, z * 0.16), m2 = 0.5 + 0.5 * C.noise3(x * 0.07 + 9, y * 0.07, z * 0.07);
    tmp.copy(base).lerp(warm, m * 0.75).lerp(grey, m2 * 0.35);
    const g = Math.pow(ao, 1.4) * (0.9 + 0.12 * C.noise3(x * 0.9, y * 0.9, z * 0.9));
    col[v] = tmp.r * g; col[v + 1] = tmp.g * g; col[v + 2] = tmp.b * g;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundsTree();
  meshes.bone = addMesh('bone', geo, MAT.bone(), 'bone');
  boneG = G;
}
function buildOptic() {
  const G = makeGrid([-18, 18, -1.5, 12.5, -17, 22], 0.45);
  fillGrid(G, (x, y, z) => C.opticSDF(x, y, z));
  const geo = surfaceNets(G); geo.computeBoundsTree();
  meshes.optic = addMesh('optic', geo, MAT.optic(), 'optic');
}
function buildCS() {
  // right side static
  const GR = makeGrid([-23, -5, -12, 4, -15, 17], 0.5);
  fillGrid(GR, (x, y, z) => C.csSDF(x, y, z, 0, trilinear(boneG, x, y, z)));
  const gR = surfaceNets(GR); gR.computeBoundsTree();
  meshes.csR = addMesh('cs', gR, MAT.cs(), 'cs', { cast: false });
  // left side: precompute static fields
  csG = makeGrid([5, 23, -12, 4, -15, 17], 0.5);
  const n = csG.f.length;
  csG.bone = new Float32Array(n); csG.stat = new Float32Array(n);
  fillGrid(csG, (x, y, z, i) => { csG.bone[i] = trilinear(boneG, x, y, z); csG.stat[i] = C.csStatic(x, y, z); return 0; });
  meshes.csL = addMesh('cs', new THREE.BufferGeometry(), MAT.cs(), 'cs', { cast: false });
}
// fine grids for the resting shape, coarse grids while morphing between grades
function buildTumorGrids() {
  tumG = {};
  for (const [q, h] of [['fine', 0.5], ['coarse', 0.9]]) {
    const G = makeGrid([-11, 21, -13, 9.5, -10, 12.5], h), n = G.f.length;
    G.ica = new Float32Array(n); G.opt = new Float32Array(n); G.noise = new Float32Array(n);
    fillGrid(G, (x, y, z, i) => { G.ica[i] = C.P.ica.dist(Math.abs(x), y, z, 3); G.opt[i] = C.opticSDF(x, y, z); G.noise[i] = C.tumorNoise(x, y, z); return 0; });
    tumG[q] = G;
  }
  glaG = {};
  for (const [q, h] of [['fine', 0.4], ['coarse', 0.7]]) {
    const G = makeGrid([-11, 9, -8.5, 9.5, -9, 7.5], h);
    G.ica = new Float32Array(G.f.length);
    fillGrid(G, (x, y, z, i) => { G.ica[i] = C.P.ica.dist(Math.abs(x), y, z, 3); return 0; });
    glaG[q] = G;
  }
  meshes.tumor = addMesh('tumor', new THREE.BufferGeometry(), MAT.tumor(), 'tumor');
  meshes.gland = addMesh('gland', new THREE.BufferGeometry(), MAT.gland(), 'gland');
}

const TUM_COL = [new THREE.Color('#b596a8'), new THREE.Color('#8f6f86'), new THREE.Color('#c8a9b0')];
const GL_COL = { a: new THREE.Color('#d98a6c'), p: new THREE.Color('#f0d2b8'), s: new THREE.Color('#e3b193') };
let lastPush = -1;
function rebuildDynamic(st, final) {
  const q = final ? 'fine' : 'coarse';
  // tumour
  let has = st.slots.some((s) => s[3] > 0.05);
  if (has) {
    const G = tumG[q];
    fillGrid(G, (x, y, z, i) => C.tumorSDF(x, y, z, st, G.ica[i], G.opt[i], G.noise[i]));
    const geo = surfaceNets(G);
    has = geo.index.count > 0;
    const p = geo.attributes.position.array, col = new Float32Array(p.length), t = new THREE.Color();
    for (let v = 0; v < p.length; v += 3) {
      const n1 = 0.5 + 0.5 * C.noise3(p[v] * 0.5, p[v + 1] * 0.5, p[v + 2] * 0.5), n2 = 0.5 + 0.5 * C.noise3(p[v] * 1.7 + 4, p[v + 1] * 1.7, p[v + 2] * 1.7);
      t.copy(TUM_COL[0]).lerp(TUM_COL[1], n1 * 0.6).lerp(TUM_COL[2], n2 * 0.35);
      col[v] = t.r; col[v + 1] = t.g; col[v + 2] = t.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    replaceGeo(meshes.tumor, geo, final);
  } else replaceGeo(meshes.tumor, new THREE.BufferGeometry(), false);
  meshes.tumor.visible = has;
  // gland
  {
    const G = glaG[q];
    fillGrid(G, (x, y, z, i) => C.glandSDF(x, y, z, st, has ? C.tumorRaw(x, y, z, st.slots) : 1e3, G.ica[i]));
    const geo = surfaceNets(G);
    const p = geo.attributes.position.array, col = new Float32Array(p.length), t = new THREE.Color();
    const g = st.gland;
    for (let v = 0; v < p.length; v += 3) {
      const x = p[v], y = p[v + 1], z = p[v + 2];
      const da = C.sdEll(x, y, z, ...g.a), dp = C.sdEll(x, y, z, ...g.p);
      const wa = Math.exp(-Math.max(0, da) * 1.2), wp = Math.exp(-Math.max(0, dp) * 1.2) * 1.1, ws = y > g.a[1] + g.a[4] * 0.9 ? 1.4 : 0.15;
      const s = wa + wp + ws;
      t.setRGB((GL_COL.a.r * wa + GL_COL.p.r * wp + GL_COL.s.r * ws) / s, (GL_COL.a.g * wa + GL_COL.p.g * wp + GL_COL.s.g * ws) / s, (GL_COL.a.b * wa + GL_COL.p.b * wp + GL_COL.s.b * ws) / s);
      const nn = 0.94 + 0.08 * C.noise3(x * 1.3, y * 1.3, z * 1.3);
      col[v] = t.r * nn; col[v + 1] = t.g * nn; col[v + 2] = t.b * nn;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    replaceGeo(meshes.gland, geo, final);
  }
  // left cavernous sinus + lateral-wall nerves (only when the wall moves)
  if (final || Math.abs(st.push - lastPush) > 0.04) {
    const G = csG;
    fillGrid(G, (x, y, z, i) => C.csSDF(x, y, z, st.push, G.bone[i], G.stat[i]));
    replaceGeo(meshes.csL, surfaceNets(G), final);
    updateNerves(st.push);
    lastPush = st.push;
  }
  updateDiaphragma(st);
}

// =====================================================================
// Synthetic coronal MR slice
// =====================================================================
const mrCanvas = document.createElement('canvas'); mrCanvas.width = 600; mrCanvas.height = 480;
const mrCtx = mrCanvas.getContext('2d');
const mrTmp = document.createElement('canvas');
const MRB = { x0: -25, x1: 25, y0: -20, y1: 20 };
const mrTex = new THREE.CanvasTexture(mrCanvas); mrTex.colorSpace = THREE.SRGBColorSpace;
const mrPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), new THREE.MeshBasicMaterial({ map: mrTex, toneMapped: false, transparent: true, opacity: 0.96, side: THREE.DoubleSide }));
mrPlane.position.set(0, 0, 3.5); mrPlane.renderOrder = 5;
layers.mrplane.add(mrPlane);
const insetCanvas = $('mrInset'), insetCtx = insetCanvas.getContext('2d');

function mrValue(x, y, z) {
  const ax = Math.abs(x);
  const cov = (d) => (d <= -0.2 ? 1 : d >= 0.2 ? 0 : 0.5 - d / 0.4);
  const mix = (a, b, t) => a + (b - a) * t;
  let v;
  const csf = (x / 9.5) ** 2 + ((y - 7) / 5.5) ** 2 + 0.35 * C.noise3(x * 0.3, y * 0.3, z * 0.3);
  if (y > -3) v = csf < 1 ? 0.12 : 0.4; else v = 0.31;
  if (ax > 15 && y > -19) { const e = ((ax - 24) / 13) ** 2 + ((y + 3) / 14.5) ** 2 + ((z + 1) / 16) ** 2; if (e < 1) v = 0.4; }
  if (v > 0.35) v += 0.035 * C.noise3(x * 0.45, y * 0.45, z * 0.45);
  const bd = C.boneSDF(x, y, z);
  if (bd < 0.2) v = mix(v, bd < -1.4 ? 0.56 + 0.1 * C.noise3(x * 0.9, y * 0.9, z) : 0.07, cov(bd));
  if (bd < 1.5) { const ad = C.airSDF(x, y, z); if (ad < 0.2) v = mix(v, 0.02, cov(ad)); }
  const csd = C.csSDF(x, y, z, cur.push, bd); if (csd < 0.2) v = mix(v, 0.74 + 0.05 * C.noise3(x, y * 1.3, z), cov(csd));
  const icad = C.P.ica.dist(ax, y, z, 3); if (icad < 0.2) v = mix(v, 0.03, cov(icad));
  const vd = vesselDist(x, y, z); if (vd < 0.2) v = mix(v, 0.05, cov(vd));
  const nd = nerveDist(x, y, z); if (nd < 0.2) v = mix(v, 0.25, cov(nd));
  const od = C.opticSDF(x, y, z); if (od < 0.2) v = mix(v, 0.45, cov(od));
  const tr = C.tumorRaw(x, y, z, cur.slots);
  let td = 1e3;
  if (tr < 3) { td = C.tumorSDF(x, y, z, cur, icad, od, C.tumorNoise(x, y, z)); if (td < 0.2) v = mix(v, 0.52 + 0.08 * C.noise3(x * 0.8, y * 0.8, z * 0.8), cov(td)); }
  const gd = C.glandSDF(x, y, z, cur, tr, icad);
  if (gd < 0.2) { const post = C.sdEll(x, y, z, ...cur.gland.p) < 0; v = mix(v, post ? 0.96 : 0.86, cov(gd)); }
  return v;
}
let mrLowTimer = 0;
function renderMR(low) {
  const sc = low ? 0.42 : 1, W = Math.round(300 * sc), H = Math.round(240 * sc);
  mrTmp.width = W; mrTmp.height = H;
  const tctx = mrTmp.getContext('2d'), img = tctx.createImageData(W, H), d = img.data;
  const z = state.zc;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let j = 0; j < H; j++) {
    const y = MRB.y1 - ((j + 0.5) / H) * (MRB.y1 - MRB.y0);
    for (let i = 0; i < W; i++) {
      const x = MRB.x0 + ((i + 0.5) / W) * (MRB.x1 - MRB.x0);
      let v = mrValue(x, y, z) + (rnd() - 0.5) * 0.05;
      v = Math.pow(clamp(v, 0, 1), 0.92) * 255;
      const o = (j * W + i) * 4;
      d[o] = v; d[o + 1] = v; d[o + 2] = v * 1.01; d[o + 3] = 255;
    }
  }
  tctx.putImageData(img, 0, 0);
  const cw = mrCanvas.width, ch = mrCanvas.height;
  mrCtx.imageSmoothingEnabled = true; mrCtx.imageSmoothingQuality = 'high';
  mrCtx.drawImage(mrTmp, 0, 0, cw, ch);
  // overlay: Knosp lines
  const X = (x) => ((x - MRB.x0) / (MRB.x1 - MRB.x0)) * cw, Y = (y) => ((MRB.y1 - y) / (MRB.y1 - MRB.y0)) * ch;
  if (knosp && state.layers.lines) {
    mrCtx.lineWidth = 2.2; mrCtx.setLineDash([]);
    for (const s of [1, -1]) {
      for (const k of ['medial', 'central', 'lateral']) {
        const [a, b] = knosp[k];
        mrCtx.strokeStyle = LINE_COL[k];
        mrCtx.beginPath(); mrCtx.moveTo(X(a[0] * s), Y(a[1])); mrCtx.lineTo(X(b[0] * s), Y(b[1])); mrCtx.stroke();
      }
      mrCtx.strokeStyle = 'rgba(255,255,255,0.55)'; mrCtx.lineWidth = 1.2;
      for (const c of [knosp.lo, knosp.up]) { mrCtx.beginPath(); mrCtx.arc(X(c.x * s), Y(c.y), (c.r / 50) * cw, 0, Math.PI * 2); mrCtx.stroke(); }
      mrCtx.lineWidth = 2.2;
    }
  }
  // annotations
  mrCtx.font = '600 17px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
  mrCtx.fillStyle = 'rgba(240,200,120,0.95)';
  mrCtx.textBaseline = 'top';
  mrCtx.fillText(t('mr.R'), 12, 10); mrCtx.textAlign = 'right'; mrCtx.fillText(t('mr.L'), cw - 12, 10); mrCtx.textAlign = 'left';
  mrCtx.font = '500 14px "IBM Plex Mono", ui-monospace, monospace';
  mrCtx.fillStyle = 'rgba(230,236,240,0.85)';
  mrCtx.fillText(`COR  T1+C   z ${state.zc >= 0 ? '+' : ''}${state.zc.toFixed(1)} mm`, 12, ch - 26);
  // 10 mm scale bar
  const px10 = (10 / 50) * cw;
  mrCtx.fillRect(cw - 20 - px10, ch - 18, px10, 3);
  mrCtx.textAlign = 'right'; mrCtx.fillText('10 mm', cw - 20, ch - 38); mrCtx.textAlign = 'left';
  mrTex.needsUpdate = true;
  insetCtx.drawImage(mrCanvas, 0, 0, insetCanvas.width, insetCanvas.height);
}
// quick low-res preview on the next frame, full resolution once input settles
let mrPending = false, mrLast = 0;
function scheduleMR() {
  if (!state.inset && !(state.layers.mrplane && state.cut)) return;
  mrPending = true;
  clearTimeout(mrLowTimer);
  mrLowTimer = setTimeout(() => { mrPending = false; renderMR(false); }, 280);
}
function mrTick(now) {
  if (mrPending && now - mrLast > 140) { mrLast = now; mrPending = false; renderMR(true); }
}

// =====================================================================
// Labels
// =====================================================================
const labelObjs = [];
for (const L of LABELS) {
  const el = document.createElement('div');
  el.className = 'lbl';
  el.innerHTML = `<span class="dot"></span><span class="txt">${labelText(L)}</span>`;
  const o = new CSS2DObject(el);
  o.userData = { L, key: L.key || L.id };
  scene.add(o);
  labelObjs.push(o);
}
const axisLabels = [['axis.ant', [0, -4, 34]], ['axis.left', [38, -8, 0]], ['axis.right', [-38, -8, 0]], ['axis.sup', [0, 22, -6]]].map(([k, p]) => {
  const el = document.createElement('div'); el.className = 'axis'; el.dataset.key = k; el.textContent = t(k);
  const o = new CSS2DObject(el); o.position.set(...p); scene.add(o); return o;
});
function relabel() {
  for (const o of labelObjs) o.element.querySelector('.txt').textContent = labelText(o.userData.L);
  for (const o of axisLabels) o.element.textContent = t(o.element.dataset.key);
}
function updateLabels() {
  const mode = state.labelMode;
  for (const o of labelObjs) {
    const { L, key } = o.userData;
    let show = mode !== 'off' && state.layers[L.layer] && (mode === 'all' ? true : state.stepLabels.includes(key));
    if (L.layer === 'tumor' && !meshes.tumor?.visible) show = false;
    if (show && state.cut && L.pos()[2] > state.zc + 0.5) show = false;
    o.visible = show;
    if (show) { const p = L.pos(); o.position.set(p[0], p[1], p[2]); o.element.classList.toggle('left', p[0] < -0.5); }
  }
}
function meshIdOf(id) {
  if (BONE_LM[id]) return 'bone';
  if (id === 'gland_a' || id === 'gland_p' || id === 'stalk') return 'gland';
  if (id === 'chiasm' || id === 'opticnerve' || id === 'optictract') return 'optic';
  return id;
}
// occlusion test (round-robin) against opaque meshes
const occRay = new THREE.Raycaster(); occRay.firstHitOnly = false;
let occIdx = 0;
function occlusionTick() {
  const vis = labelObjs.filter((o) => o.visible);
  if (!vis.length) return;
  const targets = pickables.filter((m) => m.visible && m.parent.visible && m.material.opacity >= 0.99 && !m.material.transparent);
  for (let n = 0; n < 4; n++) {
    const o = vis[occIdx++ % vis.length];
    const dir = o.position.clone().sub(camera.position); const dist = dir.length(); dir.normalize();
    occRay.set(camera.position, dir); occRay.far = dist - 0.8;
    const hits = occRay.intersectObjects(targets, false).filter((h) => !(state.cut && h.point.z > state.zc));
    const own = meshIdOf(o.userData.L.id);
    const blocked = hits.some((h) => h.object.userData.id !== own || h.distance < dist - 3);
    o.element.classList.toggle('occ', blocked);
  }
}

// =====================================================================
// Controls: layers, grades, cut, steps
// =====================================================================
function applyLayerVis() {
  for (const k of ['bone', 'gland', 'tumor', 'ica', 'vessels', 'nerves', 'cs', 'optic', 'diaphragma']) layers[k].visible = state.layers[k];
  layers.lines.visible = state.layers.lines && state.cut && !state.layers.mrplane;
  layers.mrplane.visible = state.layers.mrplane && state.cut;
  zoneLabels.forEach((o) => { o.visible = layers.lines.visible; });
}
function setLayer(k, on) {
  state.layers[k] = on;
  const cb = document.querySelector(`[data-layer="${k}"]`); if (cb) cb.checked = on;
  applyLayerVis();
  if (k === 'mrplane' || k === 'lines') scheduleMR();
  updateLabels();
}
function setBoneOpacity(v) {
  state.boneOpacity = v;
  $('boneOp').value = Math.round(v * 100); $('boneOpVal').textContent = `${Math.round(v * 100)}%`;
  const m = meshes.bone?.material; if (!m) return;
  const tr = v < 0.99;
  if (m.transparent !== tr) { m.transparent = tr; m.depthWrite = !tr; m.side = tr ? THREE.FrontSide : THREE.DoubleSide; m.needsUpdate = true; }
  m.opacity = v; meshes.bone.castShadow = !tr;
}
function setCut(on, zc) {
  state.cut = on;
  if (zc !== undefined) state.zc = zc;
  clipPlane.constant = on ? state.zc : 1e4;
  mrPlane.position.z = state.zc + 0.04;
  $('cutToggle').checked = on; $('cutZ').value = state.zc; $('cutZ').disabled = !on;
  $('cutVal').textContent = `${state.zc >= 0 ? '+' : ''}${state.zc.toFixed(1)} mm`;
  rebuildLines();
  applyLayerVis();
  $('kNote').hidden = !(on && !knosp);
  updateLabels();
  scheduleMR();
}
function setInset(on) {
  state.inset = on; $('inset').hidden = !on; $('insetBtn').setAttribute('aria-pressed', String(on));
  if (on) { placeInset(); scheduleMR(); }
}

// ---------- MR window: drag, resize, minimise; the 3D view shifts away from it ----------
const insetEl = $('inset'), insetHead = $('insetHead');
let insetPos = null, insetMin = false, insetW = null, insetDrag = null;
try {
  const s = JSON.parse(localStorage.getItem('knosp-inset') || 'null');
  if (s) { insetPos = s.pos || null; insetMin = !!s.min; insetW = s.w || null; }
} catch (e) { /* storage unavailable */ }
function saveInset() { try { localStorage.setItem('knosp-inset', JSON.stringify({ pos: insetPos, min: insetMin, w: insetW })); } catch (e) { /* storage unavailable */ } }
function placeInset() {
  insetEl.classList.toggle('min', insetMin);
  $('insetMin').setAttribute('aria-pressed', String(insetMin));
  $('insetMin').textContent = insetMin ? '▢' : '–';
  insetEl.style.width = insetW ? `${insetW}px` : '';
  if (insetEl.hidden) return;
  const vw = viewport.clientWidth, vh = viewport.clientHeight, phone = vw < 860 && matchMedia('(max-width: 860px)').matches;
  const r = insetEl.getBoundingClientRect();
  // default dock: bottom-right above the controls (desktop), top-right (phone)
  const def = phone ? [vw - r.width - 12, 12] : [vw - r.width - 16, vh - r.height - 76];
  const p = insetPos || def;
  insetEl.style.left = `${clamp(p[0], 4, Math.max(4, vw - r.width - 4))}px`;
  insetEl.style.top = `${clamp(p[1], 4, Math.max(4, vh - r.height - 4))}px`;
  insetEl.style.right = 'auto'; insetEl.style.bottom = 'auto';
}
function wireInset() {
  insetHead.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.button > 0) return;
    const r = insetEl.getBoundingClientRect(), vr = viewport.getBoundingClientRect();
    insetDrag = { dx: e.clientX - r.left, dy: e.clientY - r.top, vl: vr.left, vt: vr.top };
    insetHead.setPointerCapture(e.pointerId);
    insetEl.classList.add('dragging');
    e.preventDefault();
  });
  insetHead.addEventListener('pointermove', (e) => {
    if (!insetDrag) return;
    insetPos = [e.clientX - insetDrag.vl - insetDrag.dx, e.clientY - insetDrag.vt - insetDrag.dy];
    placeInset();
  });
  const end = () => { if (!insetDrag) return; insetDrag = null; insetEl.classList.remove('dragging'); saveInset(); };
  insetHead.addEventListener('pointerup', end);
  insetHead.addEventListener('pointercancel', end);
  insetHead.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    insetPos = null; insetW = null; placeInset(); saveInset();
  });
  insetHead.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key];
    if (!d) return;
    e.preventDefault(); e.stopPropagation();
    const r = insetEl.getBoundingClientRect(), vr = viewport.getBoundingClientRect();
    insetPos = [r.left - vr.left + d[0], r.top - vr.top + d[1]];
    placeInset(); saveInset();
  });
  $('insetMin').addEventListener('click', () => { insetMin = !insetMin; placeInset(); saveInset(); });
  // user resize via the CSS corner handle writes an inline width
  new ResizeObserver(() => {
    if (insetEl.hidden || insetMin) return;
    const w = parseFloat(insetEl.style.width);
    if (w && w !== insetW) { insetW = Math.round(w); saveInset(); placeInset(); }
  }).observe(insetEl);
}
let viewShift = 0;
function shiftTarget() {
  const vw = viewport.clientWidth;
  if (insetEl.hidden || insetMin || vw < 700) return 0;
  const r = insetEl.getBoundingClientRect(), vr = viewport.getBoundingClientRect();
  const cx = r.left - vr.left + r.width / 2;
  const s = Math.min(r.width / 2 + 8, vw * 0.24);
  return cx > vw / 2 ? s : -s; // positive: scene moves left, away from a right-hand window
}
let lastViewKey = '';
function shiftTick() {
  const tgt = shiftTarget();
  viewShift = reduceMotion ? tgt : viewShift + (tgt - viewShift) * 0.12;
  if (Math.abs(tgt - viewShift) < 0.3) viewShift = tgt;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  const key = `${viewShift.toFixed(1)}|${w}|${h}`;
  if (key === lastViewKey) return;
  lastViewKey = key;
  if (viewShift === 0) camera.clearViewOffset();
  else camera.setViewOffset(w, h, viewShift, 0, w, h);
}
function setGrade(g, instant) {
  const same = g === state.grade && !morph;
  state.grade = g;
  document.querySelectorAll('#gradeBar button').forEach((b) => b.classList.toggle('on', b.dataset.g === g));
  if (same) { updateBadge(); return; }
  const from = cur, to = C.STATES[g];
  if (instant || reduceMotion) { cur = C.lerpState(to, to, 0); rebuildDynamic(cur, true); afterMorph(); return; }
  morph = { from, to, t0: performance.now(), dur: 950 };
  updateBadge();
}
function afterMorph() { updateBadge(); updateLabels(); scheduleMR(); }
function morphTick(now) {
  if (!morph) return;
  const k = clamp((now - morph.t0) / morph.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  cur = lerpFrom(morph.from, morph.to, e);
  rebuildDynamic(cur, k >= 1);
  if (k >= 1) { morph = null; afterMorph(); }
}
function lerpFrom(a, b, t) { // a is an interpolated state, b a named state
  const slots = a.slots.map((s, i) => {
    let bs = b.slots[i];
    if (bs[3] < 0.05) bs = [s[0] * 0.6, s[1] * 0.6, s[2], 0.01, 0.01, 0.01];
    let as = s;
    if (as[3] < 0.05) as = [bs[0] * 0.6, bs[1] * 0.6, bs[2], 0.01, 0.01, 0.01];
    return as.map((v, j) => v + (bs[j] - v) * t);
  });
  const gl = {}; for (const k of ['a', 'p', 'mid', 'bot']) gl[k] = a.gland[k].map((v, j) => v + (b.gland[k][j] - v) * t);
  return { slots, gland: gl, push: a.push + (b.push - a.push) * t };
}
function updateBadge() {
  const g = state.grade, q = !!state.quiz;
  $('badgeGrade').textContent = q ? '?' : GRADE_TXT[g];
  $('badgeGrade').className = 'bg-num g-' + (q ? 'q' : g);
  $('badgeTxt').textContent = q ? t('badge.ask') : g === 'none' ? t('badge.none') : t('badge.grade', { g: GRADE_TXT[g] });
}

// ---------- camera fly ----------
let fly = null;
function flyTo(v, dur = 1400) {
  const view = typeof v === 'string' ? V[v] : v;
  if (reduceMotion) { camera.position.set(...view.pos); controls.target.set(...view.tgt); return; }
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...view.pos), t1: new THREE.Vector3(...view.tgt), start: performance.now(), dur };
}
controls.addEventListener('start', () => { fly = null; });
function flyTick(now) {
  if (!fly) return;
  const k = clamp((now - fly.start) / fly.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const tg = fly.t0.clone().lerp(fly.t1, e);
  const s0 = new THREE.Spherical().setFromVector3(fly.p0.clone().sub(fly.t0)), s1 = new THREE.Spherical().setFromVector3(fly.p1.clone().sub(fly.t1));
  let dth = s1.theta - s0.theta; if (dth > Math.PI) dth -= 2 * Math.PI; if (dth < -Math.PI) dth += 2 * Math.PI;
  const s = new THREE.Spherical(s0.radius + (s1.radius - s0.radius) * e, s0.phi + (s1.phi - s0.phi) * e, s0.theta + dth * e);
  camera.position.copy(tg).add(new THREE.Vector3().setFromSpherical(s));
  controls.target.copy(tg);
  if (k >= 1) fly = null;
}

// ---------- lesson ----------
const DEFAULT_LAYERS = { bone: true, gland: true, tumor: true, ica: true, vessels: true, nerves: true, cs: true, optic: true, diaphragma: true, lines: true, mrplane: false };
function applyStep(i) {
  i = clamp(i, 0, STEPS.length - 1);
  const s = STEPS[i];
  state.step = i;
  if (state.quiz) endQuiz(true);
  const L = { ...DEFAULT_LAYERS, ...(s.layers || {}) };
  for (const k in L) setLayer(k, L[k]);
  setBoneOpacity(s.bone ?? 1);
  setCut(!!s.cut, s.zc ?? state.zc);
  setInset(!!s.inset);
  state.stepLabels = s.labels || [];
  state.labelMode = state.labelMode === 'off' ? 'off' : 'step';
  syncLabelMode();
  setGrade(s.grade || 'none');
  controls.autoRotate = !!s.autorotate; $('autoRot').checked = controls.autoRotate;
  flyTo(s.view);
  renderStep();
  $('stepScroll').scrollTop = 0;
  updateLabels();
}
function renderStep() {
  const s = T().steps[state.step];
  $('stepKicker').textContent = s.kicker;
  $('stepTitle').textContent = s.title;
  $('stepBody').innerHTML = s.body + (s.facts ? `<dl class="facts">${s.facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : '');
  $('stepCount').textContent = `${state.step + 1} / ${STEPS.length}`;
  $('prev').disabled = state.step === 0;
  $('prev').textContent = t('nav.prev');
  $('next').textContent = state.step === STEPS.length - 1 ? t('nav.restart') : t('nav.next');
  document.querySelectorAll('#stepDots button').forEach((b, i) => {
    const title = T().steps[i].title;
    b.title = `${i + 1}. ${title}`; b.setAttribute('aria-label', t('nav.stepAria', { n: i + 1, t: title }));
    b.classList.toggle('on', i === state.step); b.classList.toggle('done', i < state.step); b.setAttribute('aria-current', i === state.step ? 'step' : 'false');
  });
}
function buildStepDots() {
  const wrap = $('stepDots');
  STEPS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.isGrade ? GRADE_TXT[s.grade] : String(i + 1);
    if (s.isGrade) b.classList.add('gdot', 'g-' + s.grade);
    b.addEventListener('click', () => { applyStep(i); $('stepScroll').scrollTop = 0; });
    wrap.appendChild(b);
  });
}

// ---------- quiz ----------
function renderQuizFeedback() {
  const q = state.quiz;
  if (!q) { $('quizFeedback').innerHTML = ''; return; }
  if (!q.done) { $('quizFeedback').innerHTML = `<p class="muted">${t('quiz.hint')}</p>`; return; }
  const ok = q.last === q.answer;
  $('quizFeedback').innerHTML = `<p class="${ok ? 'ok' : 'bad'}"><b>${ok ? t('quiz.right') : t('quiz.wrong', { g: GRADE_TXT[q.answer] })}</b> ${T().quiz[q.answer]}</p><p class="muted">${t('quiz.score', { s: q.score, n: q.n })}</p>`;
}
function newCase() {
  const pool = ['g0', 'g1', 'g2', 'g3a', 'g3b', 'g4'].filter((g) => g !== state.quiz?.answer);
  const g = pool[Math.floor(Math.random() * pool.length)];
  state.quiz = { answer: g, done: false, score: state.quiz?.score || 0, n: state.quiz?.n || 0 };
  $('app').classList.add('quiz');
  for (const k in DEFAULT_LAYERS) setLayer(k, DEFAULT_LAYERS[k]);
  setBoneOpacity(1); setCut(true, 3.5); setInset(true);
  state.stepLabels = []; updateLabels();
  setGrade(g);
  const vs = [V.coronal, V.grade, { pos: [-24, 12, 64], tgt: [5, -2, 1] }];
  flyTo(vs[Math.floor(Math.random() * vs.length)]);
  renderQuizFeedback();
  document.querySelectorAll('#quizAnswers button').forEach((b) => { b.disabled = false; b.classList.remove('right', 'wrong'); });
  $('quizNext').hidden = true;
  updateBadge();
}
function answer(g) {
  const q = state.quiz; if (!q || q.done) return;
  q.done = true; q.n++; q.last = g; if (g === q.answer) q.score++;
  document.querySelectorAll('#quizAnswers button').forEach((b) => { b.disabled = true; if (b.dataset.g === q.answer) b.classList.add('right'); else if (b.dataset.g === g) b.classList.add('wrong'); });
  renderQuizFeedback();
  $('quizNext').hidden = false;
  $('app').classList.remove('quiz');
  updateBadge();
  document.querySelectorAll('#gradeBar button').forEach((b) => b.classList.toggle('on', b.dataset.g === state.grade));
}
function endQuiz(silent) {
  state.quiz = null; $('app').classList.remove('quiz'); updateBadge();
  if (!silent) $('quizFeedback').innerHTML = '';
}

// ---------- picking / hover ----------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hoverDirty = false, lastHover = 0, hovered = null, selected = null, downAt = null;
function pick() {
  ray.setFromCamera(ndc, camera);
  const targets = pickables.filter((m) => m.visible && m.parent.visible);
  let hits = ray.intersectObjects(targets, false);
  if (state.cut) hits = hits.filter((h) => h.point.z <= state.zc + 0.01);
  if (state.boneOpacity < 0.6) hits = hits.filter((h, i) => h.object.userData.id !== 'bone' || hits.every((o) => o.object.userData.id === 'bone'));
  if (!hits.length) return null;
  let h = hits[0];
  if (h.object.userData.id === 'cs') { const nxt = hits.find((o) => o.object.userData.id !== 'cs' && o.object.userData.id !== 'bone'); if (nxt && nxt.distance - h.distance < 9) h = nxt; }
  return h;
}
function resolve(h) {
  const id = h.object.userData.id, p = h.point;
  if (id === 'bone') {
    let best = 'bone', bd = 7.5;
    for (const [k, q] of Object.entries(BONE_LM)) { const d = Math.hypot(Math.abs(p.x) - q[0], p.y - q[1], p.z - q[2]); if (d < bd) { bd = d; best = k; } }
    return { key: best };
  }
  if (id === 'ica') {
    const c = nearestC(h.object.userData.path, p);
    const si = C.A.ica.segments.findIndex((s) => c >= s[0] && c <= s[1]);
    return { key: 'ica', seg: si };
  }
  if (id === 'gland') {
    const g = cur.gland; const da = C.sdEll(p.x, p.y, p.z, ...g.a), dp = C.sdEll(p.x, p.y, p.z, ...g.p);
    if (p.y > g.a[1] + g.a[4] + 0.3 && da > 0.4 && dp > 0.4) return { key: 'stalk' };
    return { key: dp < da ? 'gland_p' : 'gland_a' };
  }
  if (id === 'optic') {
    if (Math.abs(p.x) < 5 && p.y > 5.2 && p.z > -1) return { key: 'chiasm' };
    return { key: p.z > 3 ? 'opticnerve' : 'optictract' };
  }
  return { key: id };
}
function nearestC(path, p) {
  let bi = 0, bd = 1e9;
  for (let i = 0; i < path.n; i++) { const d = (path.X[i] - p.x) ** 2 + (path.Y[i] - p.y) ** 2 + (path.Z[i] - p.z) ** 2; if (d < bd) { bd = d; bi = i; } }
  return path.C[bi];
}
function highlight(mesh, on, strength) {
  if (!mesh || mesh.userData.id === 'bone') return;
  const m = mesh.material; if (!m.emissive) return;
  if (on) { m.emissive.set(mesh.userData.id === 'cs' ? '#8f86ff' : '#ffb24d'); m.emissiveIntensity = strength; }
  else { m.emissive.set('#000000'); m.emissiveIntensity = 0; }
}
const tip = $('tip');
renderer.domElement.addEventListener('pointermove', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 12}px)`;
  hoverDirty = e.pointerType === 'mouse';
});
renderer.domElement.addEventListener('pointerleave', () => { tip.hidden = true; if (hovered && hovered !== selected?.mesh) highlight(hovered, false); hovered = null; });
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const h = pick();
  if (selected) highlight(selected.mesh, false);
  if (!h) { selected = null; $('infoCard').hidden = true; return; }
  const res = resolve(h);
  selected = { mesh: h.object, point: h.point.clone(), ...res };
  highlight(h.object, true, 0.55);
  showInfo(res);
});
renderer.domElement.addEventListener('dblclick', () => {
  const h = pick(); if (!h) return;
  const off = camera.position.clone().sub(controls.target);
  const dist = Math.max(24, off.length() * 0.55);
  flyTo({ pos: h.point.clone().add(off.normalize().multiplyScalar(dist)).toArray(), tgt: h.point.toArray() }, 900);
});
function hoverTick(now) {
  if (!hoverDirty || now - lastHover < 60 || morph) return;
  hoverDirty = false; lastHover = now;
  const h = pick();
  if (hovered && hovered !== selected?.mesh) highlight(hovered, false);
  hovered = h ? h.object : null;
  if (!h) { tip.hidden = true; renderer.domElement.style.cursor = ''; return; }
  if (hovered !== selected?.mesh) highlight(hovered, true, 0.28);
  const res = resolve(h), info = infoOf(res.key), extra = segText(res);
  tip.innerHTML = `<b>${info[0]}</b>${extra ? `<span>${extra}</span>` : ''}`;
  tip.hidden = false; renderer.domElement.style.cursor = 'pointer';
}
function segText(res) { return res.seg >= 0 ? T().icaSeg[res.seg] : ''; }
function showInfo(res) {
  const info = infoOf(res.key), extra = segText(res);
  $('infoName').textContent = info[0] + (extra ? ` · ${extra.split(' · ')[0]}` : '');
  $('infoLatin').textContent = extra ? `${info[1]} · ${extra}` : info[1];
  $('infoText').textContent = info[2];
  $('infoCard').hidden = false;
}
$('infoClose').addEventListener('click', () => { $('infoCard').hidden = true; if (selected) highlight(selected.mesh, false); selected = null; });
$('infoFocus').addEventListener('click', () => {
  if (!selected) return;
  const off = camera.position.clone().sub(controls.target);
  flyTo({ pos: selected.point.clone().add(off.normalize().multiplyScalar(30)).toArray(), tgt: selected.point.toArray() }, 900);
});

// ---------- language ----------
function applyStaticI18n() {
  document.documentElement.lang = T().htmlLang;
  document.title = T().docTitle;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
}
function setLanguage(l) {
  if (l === LANG) return;
  LANG = l;
  try { localStorage.setItem('knosp-lang', l); } catch (e) { /* storage unavailable */ }
  applyStaticI18n(); relabel(); renderStep(); updateBadge(); renderQuizFeedback();
  if (selected && !$('infoCard').hidden) showInfo(selected);
  scheduleMR();
}

// ---------- UI wiring ----------
function wireUI() {
  applyStaticI18n();
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLanguage(b.dataset.lang)));
  buildStepDots();
  $('prev').addEventListener('click', () => applyStep(state.step - 1));
  $('next').addEventListener('click', () => applyStep(state.step === STEPS.length - 1 ? 0 : state.step + 1));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') applyStep(state.step + 1);
    if (e.key === 'ArrowLeft') applyStep(state.step - 1);
  });
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((o) => o.setAttribute('aria-selected', String(o === b)));
    document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== b.dataset.tab; });
    if (b.dataset.tab === 'tab-test' && !state.quiz) newCase();
    if (b.dataset.tab !== 'tab-test' && state.quiz) endQuiz();
  }));
  document.querySelectorAll('[data-layer]').forEach((cb) => cb.addEventListener('change', () => setLayer(cb.dataset.layer, cb.checked)));
  $('boneOp').addEventListener('input', (e) => setBoneOpacity(e.target.value / 100));
  $('mrOp').addEventListener('input', (e) => { mrPlane.material.opacity = e.target.value / 100; $('mrOpVal').textContent = `${e.target.value}%`; });
  $('autoRot').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
  document.querySelectorAll('[name="lblmode"]').forEach((r) => r.addEventListener('change', () => { state.labelMode = r.value; updateLabels(); }));
  document.querySelectorAll('#gradeBar button').forEach((b) => b.addEventListener('click', () => {
    if (state.quiz && !state.quiz.done) return;
    setGrade(b.dataset.g);
    if (b.dataset.g !== 'none' && !state.inset) setInset(true);
    if (!state.stepLabels.includes('tumor')) state.stepLabels = [...state.stepLabels, 'tumor'];
  }));
  $('cutToggle').addEventListener('change', (e) => { setCut(e.target.checked); if (e.target.checked && !state.inset) setInset(true); });
  $('cutZ').addEventListener('input', (e) => setCut(true, parseFloat(e.target.value)));
  $('insetBtn').addEventListener('click', () => setInset(!state.inset));
  $('insetClose').addEventListener('click', () => setInset(false));
  wireInset();
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.view;
    if (v === 'coronal') { setCut(true, state.zc); setInset(true); }
    flyTo(v);
  }));
  $('resetView').addEventListener('click', () => flyTo(STEPS[state.step].view));
  document.querySelectorAll('#quizAnswers button').forEach((b) => b.addEventListener('click', () => answer(b.dataset.g)));
  $('quizNext').addEventListener('click', newCase);
}
function syncLabelMode() { document.querySelectorAll('[name="lblmode"]').forEach((r) => { r.checked = r.value === state.labelMode; }); }

// ---------- resize ----------
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false); labelRenderer.setSize(w, h);
  camera.aspect = w / Math.max(1, h);
  camera.fov = w < 560 ? 42 : 32;
  camera.updateProjectionMatrix();
  lastViewKey = '';
  if (!insetEl.hidden) placeInset();
}
new ResizeObserver(resize).observe(viewport);

// ---------- loop ----------
let lastOcc = 0;
function loop(now) {
  requestAnimationFrame(loop);
  flyTick(now); morphTick(now); mrTick(now); shiftTick();
  controls.update();
  hoverTick(now);
  if (!morph && now - lastOcc > 120) { lastOcc = now; occlusionTick(); }
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ---------- boot ----------
(async function boot() {
  try {
    resize();
    wireUI();
    await progress(t('load.optic'), 0.03);
    buildOptic();
    await buildBone();
    await progress(t('load.cs'), 0.82);
    buildCS();
    await progress(t('load.tumor'), 0.9);
    buildTumorGrids();
    rebuildDynamic(cur, true);
    await progress(t('load.ready'), 1);
    camera.position.set(90, 70, 130);
    applyStep(0);
    $('loader').classList.add('done');
    setTimeout(() => { $('loader').hidden = true; }, 700);
    requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    loaderTxt.textContent = t('load.err') + err.message;
  }
})();
