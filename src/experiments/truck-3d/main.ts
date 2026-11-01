import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const viewport = document.querySelector<HTMLDivElement>('#viewport')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#aebbc4');

const camera = new THREE.PerspectiveCamera(
  40,
  viewport.clientWidth / viewport.clientHeight,
  0.01,
  10000
);

camera.position.set(9, 5, 9);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

viewport.appendChild(renderer.domElement);


// =====================================================
// PREMIUM TRUCK SHOWROOM
// =====================================================

scene.background = new THREE.Color('#101820');

// Showroom materials
const floorMaterial = new THREE.MeshPhysicalMaterial({
  color: '#30383e',
  roughness: 0.24,
  metalness: 0.35,
  clearcoat: 0.8,
  clearcoatRoughness: 0.2
});

const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#202a32',
  roughness: 0.8,
  metalness: 0.15
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#8299a8',
  roughness: 0.12,
  metalness: 0.25,
  transparent: true,
  opacity: 0.16,
  side: THREE.DoubleSide
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: '#64717a',
  metalness: 0.8,
  roughness: 0.3
});

const ledMaterial = new THREE.MeshBasicMaterial({
  color: '#e7f4ff'
});

function createBox(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  castShadow = false
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);

  return mesh;
}

// Main polished showroom floor
createBox(60, 0.3, 60, floorMaterial, 0, -0.16, 0);

// Display platform
const platformMaterial = new THREE.MeshStandardMaterial({
  color: '#454e55',
  metalness: 0.55,
  roughness: 0.3
});

createBox(17, 0.18, 13, platformMaterial, 0, -0.015, 0);

// Platform LED border
const borderMaterial = new THREE.MeshBasicMaterial({
  color: '#8bbbd6'
});

createBox(17, 0.035, 0.08, borderMaterial, 0, 0.09, 6.45);
createBox(17, 0.035, 0.08, borderMaterial, 0, 0.09, -6.45);
createBox(0.08, 0.035, 13, borderMaterial, 8.45, 0.09, 0);
createBox(0.08, 0.035, 13, borderMaterial, -8.45, 0.09, 0);

// Rear wall
createBox(60, 18, 0.5, wallMaterial, 0, 9, -25);

// Side walls
createBox(0.4, 18, 50, wallMaterial, -30, 9, 0);
createBox(0.4, 18, 50, wallMaterial, 30, 9, 0);

// Glass display sections
createBox(0.12, 13, 42, glassMaterial, -29.65, 8, 0);
createBox(0.12, 13, 42, glassMaterial, 29.65, 8, 0);

// Ceiling
createBox(60, 0.4, 60, wallMaterial, 0, 18, 0);

// Structural ceiling beams
for (const z of [-20, -10, 0, 10, 20]) {
  createBox(60, 0.3, 0.35, metalMaterial, 0, 17.65, z);
}

for (const x of [-25, -15, 15, 25]) {
  createBox(0.35, 0.3, 60, metalMaterial, x, 17.65, 0);
}

// LED ceiling panels
for (const x of [-14, -7, 0, 7, 14]) {
  createBox(0.18, 0.08, 32, ledMaterial, x, 17.35, 0);
}

// Showroom support pillars
for (const x of [-26, 26]) {
  for (const z of [-18, 0, 18]) {
    createBox(0.65, 17, 0.65, metalMaterial, x, 8.5, z, true);
  }
}

// Main showroom lighting
scene.add(new THREE.HemisphereLight(0xdceaff, 0x343943, 1.7));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(8, 15, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 60;
keyLight.shadow.bias = -0.0002;
keyLight.shadow.normalBias = 0.025;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8d8ff, 2.0);
fillLight.position.set(-12, 8, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe2bd, 2.5);
rimLight.position.set(0, 12, -15);
scene.add(rimLight);

// Additional showroom spotlights
for (const x of [-10, 0, 10]) {
  const spotlight = new THREE.SpotLight(
    0xffffff,
    110,
    35,
    Math.PI / 5,
    0.55,
    1.5
  );

  spotlight.position.set(x, 16.5, 5);
  spotlight.target.position.set(x, 0, 0);
  spotlight.castShadow = x === 0;

  scene.add(spotlight);
  scene.add(spotlight.target);
}

// =====================================================

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2 - 0.02;

// Loading indicator
const status = document.createElement('div');
status.style.cssText = `
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  color:white;
  background:#19232d;
  padding:18px 24px;
  border-radius:8px;
  font:14px Arial;
  z-index:5;
  text-align:center;
`;
status.textContent = 'Loading Scania 3D model...';
viewport.appendChild(status);

let truckModel: THREE.Group | null = null;

function fitModel(model: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  const longestDimension = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(longestDimension) || longestDimension <= 0) {
    throw new Error('Invalid model dimensions.');
  }

  // Normalize model size for consistent viewing.
  const scale = 8 / longestDimension;
  model.scale.setScalar(scale);

  // Center the model horizontally.
  const scaledBounds = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());

  model.position.x -= scaledCenter.x;
  model.position.z -= scaledCenter.z;
  model.position.y -= scaledBounds.min.y;

  model.updateMatrixWorld(true);

  const finalBounds = new THREE.Box3().setFromObject(model);
  const finalSize = finalBounds.getSize(new THREE.Vector3());
  const finalCenter = finalBounds.getCenter(new THREE.Vector3());

  controls.target.copy(finalCenter);

  const maxDimension = Math.max(
    finalSize.x,
    finalSize.y,
    finalSize.z
  );

  const distance = maxDimension * 1.65;

  camera.position.set(
    finalCenter.x + distance,
    finalCenter.y + distance * 0.55,
    finalCenter.z + distance
  );

  camera.near = Math.max(0.01, maxDimension / 1000);
  camera.far = maxDimension * 100;
  camera.updateProjectionMatrix();

  controls.minDistance = maxDimension * 0.35;
  controls.maxDistance = maxDimension * 8;

  // Fit shadow camera around the model.
  keyLight.shadow.camera.left = -maxDimension * 2;
  keyLight.shadow.camera.right = maxDimension * 2;
  keyLight.shadow.camera.top = maxDimension * 2;
  keyLight.shadow.camera.bottom = -maxDimension * 2;
  keyLight.shadow.camera.updateProjectionMatrix();
}

function showError(message: string) {
  status.style.background = '#762525';
  status.textContent = message;
  console.error(message);
}

// Load the actual truck.
const loader = new GLTFLoader();

loader.load(
  '/models/trucks/scania-test.glb',

  (gltf) => {
    truckModel = gltf.scene;

    truckModel.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        // Preserve the model's original materials and textures.
        object.frustumCulled = true;
      }
    });

    scene.add(truckModel);

    try {
      fitModel(truckModel);
      status.remove();
      console.log('Scania model loaded successfully.');
    } catch (error) {
      showError('Model loaded, but its dimensions could not be calculated.');
      console.error(error);
    }
  },

  (progress) => {
    if (progress.total > 0) {
      const percentage = Math.round(
        (progress.loaded / progress.total) * 100
      );
      status.textContent = `Loading Scania model... ${percentage}%`;
    }
  },

  (error) => {
    showError('Could not load Scania model. Check the GLB file path.');
    console.error('GLB loading error:', error);
  }
);

// Reset camera
document.querySelector('#reset-camera')?.addEventListener('click', () => {
  if (truckModel) fitModel(truckModel);
});

// Responsive rendering
const resizeObserver = new ResizeObserver(() => {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

resizeObserver.observe(viewport);

// Render loop
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
