import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/environments/RoomEnvironment.js";

const canvas = document.getElementById("weaponCanvas");
const loading = document.getElementById("modelLoader");
const errorBox = document.getElementById("modelError");
if (!canvas) throw new Error("AG2 viewer canvas is missing");

function fail(message) {
  loading?.classList.add("loaded");
  if (errorBox) {
    errorBox.hidden = false;
    const strong = errorBox.querySelector("strong");
    const small = errorBox.querySelector("small");
    if (strong) strong.textContent = "AG2 3D model unavailable";
    if (small) small.textContent = message;
  }
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (error) {
  fail("WebGL is unavailable on this browser.");
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(29, 1, 0.03, 50);
const initialCamera = new THREE.Vector3(3.65, 0.72, 2.6);
camera.position.copy(initialCamera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.062;
controls.enablePan = false;
controls.rotateSpeed = 0.56;
controls.zoomSpeed = 0.72;
controls.minDistance = 2.55;
controls.maxDistance = 5.8;
controls.minPolarAngle = Math.PI * 0.2;
controls.maxPolarAngle = Math.PI * 0.8;
controls.target.set(0, -0.02, 0.02);

const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const env = pmrem.fromScene(room, 0.035).texture;
scene.environment = env;
room.dispose();
pmrem.dispose();

scene.add(new THREE.HemisphereLight(0xdde5ef, 0x080305, 1.15));

const key = new THREE.DirectionalLight(0xffffff, 3.8);
key.position.set(4.2, 5.4, 4.6);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 12;
key.shadow.bias = -0.0002;
scene.add(key);

const fill = new THREE.PointLight(0xaebfd7, 7.2, 9, 2);
fill.position.set(1.4, -1.25, 3.1);
scene.add(fill);

const rim = new THREE.SpotLight(0xb60d19, 25, 12, Math.PI * 0.23, 0.5, 1.5);
rim.position.set(-4.0, 2.5, -4.4);
rim.target.position.set(0, 0, 0);
scene.add(rim, rim.target);

const warm = new THREE.PointLight(0xd7a65f, 2.7, 7, 2);
warm.position.set(-0.8, 3.0, 2.2);
scene.add(warm);

function makeNoiseTexture(kind = "grain") {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let v;
      if (kind === "brush") {
        const stripe = Math.sin(y * 2.8) * 3.5 + Math.sin(y * 8.6) * 1.7;
        v = 126 + stripe + (Math.random() - 0.5) * 6;
      } else {
        v = 126 + (Math.random() - 0.5) * 22;
      }
      v = Math.max(0, Math.min(255, Math.round(v)));
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "brush" ? 2 : 5, kind === "brush" ? 7 : 5);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

const polymerGrain = makeNoiseTexture("grain");
const brushedMetal = makeNoiseTexture("brush");

const materials = [
  new THREE.MeshPhysicalMaterial({
    color: 0x2a2c30,
    metalness: 0.9,
    roughness: 0.25,
    roughnessMap: brushedMetal,
    clearcoat: 0.28,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.55,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0x101114,
    metalness: 0.04,
    roughness: 0.58,
    bumpMap: polymerGrain,
    bumpScale: 0.018,
    clearcoat: 0.035,
    clearcoatRoughness: 0.72,
    envMapIntensity: 1.05,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0x17191c,
    metalness: 0.82,
    roughness: 0.34,
    roughnessMap: brushedMetal,
    clearcoat: 0.12,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0x1f2226,
    metalness: 0.96,
    roughness: 0.2,
    roughnessMap: brushedMetal,
    clearcoat: 0.35,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.75,
    side: THREE.DoubleSide
  }),
  new THREE.MeshPhysicalMaterial({
    color: 0xb68a3c,
    metalness: 0.92,
    roughness: 0.24,
    clearcoat: 0.18,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.5,
    side: THREE.DoubleSide
  })
];

const root = new THREE.Group();
scene.add(root);
const baseRotation = { x: 0.045, y: -0.24, z: -0.02 };
root.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);

const contactShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(4.0, 3.2),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.27 })
);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.set(0, -0.75, 0.05);
contactShadow.receiveShadow = true;
scene.add(contactShadow);

const rounded = new RoundedBoxGeometry(1, 1, 1, 2, 0.045);
rounded.computeVertexNormals();

async function getAG2Matrices() {
  const response = await fetch(`viewer.js?geometry=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`geometry source ${response.status}`);
  const source = await response.text();
  const match = source.match(/const\s+MODEL_MATRICES\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("AG2 geometry data was not found");
  return Function(`"use strict";return (${match[1]})`)();
}

function buildModel(groups) {
  groups.forEach((matrices, groupIndex) => {
    const material = materials[groupIndex] || materials[1];
    const group = new THREE.Group();
    group.name = ["AG2_slide", "AG2_lower_receiver", "AG2_magazine", "AG2_barrel", "AG2_round"][groupIndex] || `AG2_part_${groupIndex}`;

    matrices.forEach((values) => {
      const mesh = new THREE.Mesh(rounded, material);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.fromArray(values);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      group.add(mesh);
    });

    root.add(group);
  });

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.position.y += 0.04;

  const fitted = new THREE.Box3().setFromObject(root);
  contactShadow.position.y = fitted.min.y - 0.08;
  loading?.classList.add("loaded");
  window.dispatchEvent(new CustomEvent("ag2-model-ready"));
}

getAG2Matrices().then(buildModel).catch((error) => {
  console.error("AG2 remaster viewer failed", error);
  fail("Reload the page to try again.");
});

let interacting = false;
let lastInteraction = performance.now();
let scrollProgress = 0;
let idleYaw = 0;
let targetIdleYaw = 0;

controls.addEventListener("start", () => {
  interacting = true;
  lastInteraction = performance.now();
});
controls.addEventListener("end", () => {
  interacting = false;
  lastInteraction = performance.now();
});
canvas.addEventListener("pointerdown", () => {
  lastInteraction = performance.now();
}, { passive: true });

window.addEventListener("ag2-model-scroll", (event) => {
  scrollProgress = THREE.MathUtils.clamp(Number(event.detail) || 0, 0, 1);
});

window.addEventListener("ag2-reset-viewer", () => {
  camera.position.copy(initialCamera);
  controls.target.set(0, -0.02, 0.02);
  controls.update();
  idleYaw = 0;
  targetIdleYaw = 0;
  root.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);
  lastInteraction = performance.now();
});

function resize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const pr = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(width * pr) || canvas.height !== Math.floor(height * pr)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

let lastTime = performance.now();
function render(now) {
  resize();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (root.children.length) {
    if (!interacting && now - lastInteraction > 2600) targetIdleYaw += dt * 0.105;
    idleYaw += (targetIdleYaw - idleYaw) * Math.min(1, dt * 3.2);
    const targetY = baseRotation.y + idleYaw + scrollProgress * 0.27;
    root.rotation.y += (targetY - root.rotation.y) * Math.min(1, dt * 4.2);
    root.rotation.x = baseRotation.x + Math.sin(now * 0.00042) * 0.009 - scrollProgress * 0.022;
    root.rotation.z = baseRotation.z + Math.sin(now * 0.00026) * 0.006;
    rim.intensity = 23 + Math.sin(now * 0.0011) * 1.4;
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
