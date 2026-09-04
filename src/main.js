import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#terrain'), antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d1117, 9, 31);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 60);
camera.position.set(8, 6.4, 13); camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0x8b949e, 0x05080c, 2.1));
const sun = new THREE.DirectionalLight(0x7ee787, 2.6); sun.position.set(5, 9, 6); scene.add(sun);

const field = new THREE.Group(); field.position.set(3.7, -2.4, 0); scene.add(field);
const grid = 11; const total = grid * grid;
const columnGeometry = new THREE.BoxGeometry(.34, 1, .34);
const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: .55, metalness: .14, transparent: true, opacity: .3 });
const columns = new THREE.InstancedMesh(columnGeometry, columnMaterial, total);
field.add(columns);
const dummy = new THREE.Object3D();
const heights = new Float32Array(total);
for (let z = 0; z < grid; z++) for (let x = 0; x < grid; x++) {
  const i = z * grid + x; heights[i] = .25 + Math.random() * 2.2;
  dummy.position.set((x - grid / 2) * .72, heights[i] / 2, (z - grid / 2) * .72);
  dummy.scale.set(1, heights[i], 1); dummy.updateMatrix(); columns.setMatrixAt(i, dummy.matrix);
  const color = new THREE.Color(i % 17 === 0 ? 0x3fb950 : i % 23 === 0 ? 0xf0883e : 0x30363d); columns.setColorAt(i, color);
}

const planeGeometry = new THREE.PlaneGeometry(12, 12, 42, 42); planeGeometry.rotateX(-Math.PI / 2);
const basePositions = planeGeometry.attributes.position.array.slice();
const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({ color: 0x3fb950, wireframe: true, transparent: true, opacity: .04 }));
plane.position.y = -.05; field.add(plane);

const orb = new THREE.Mesh(new THREE.SphereGeometry(.55, 28, 28), new THREE.MeshPhysicalMaterial({ color: 0xf0883e, roughness: .2, metalness: .1, clearcoat: 1, transparent: true, opacity: .38 }));
orb.position.set(-1.4, 2.6, 0); field.add(orb);

const pointer = new THREE.Vector2();
let pageProgress = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1);
addEventListener('pointermove', (event) => pointer.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5));
addEventListener('scroll', () => { pageProgress = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1); }, { passive: true });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); });

const readout = document.querySelector('#field-value');
const trace = document.querySelector('#signal-trace');
const traceContext = trace?.getContext('2d');
const assetHealth = document.querySelector('#asset-health');
const webglHealth = document.querySelector('#webgl-health');
const walkthroughHealth = document.querySelector('#walkthrough-health');
const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
let loadedStylesheets = stylesheets.filter((link) => link.sheet).length;
let assetRatio = stylesheets.length ? loadedStylesheets / stylesheets.length : 1;
let webglRatio = renderer.getContext() ? 1 : 0;
let lastTraceSample = 0;
const traceSamples = Array(64).fill(72.4);

function updateAssetHealth() {
  loadedStylesheets = stylesheets.filter((link) => link.sheet).length;
  assetRatio = stylesheets.length ? loadedStylesheets / stylesheets.length : 1;
  if (assetHealth) assetHealth.textContent = `${loadedStylesheets}/${stylesheets.length} ready`;
}

stylesheets.forEach((link) => {
  link.addEventListener('load', updateAssetHealth);
  link.addEventListener('error', updateAssetHealth);
});
updateAssetHealth();

renderer.domElement.addEventListener('webglcontextlost', () => {
  webglRatio = 0;
  if (webglHealth) webglHealth.textContent = 'offline';
});
renderer.domElement.addEventListener('webglcontextrestored', () => {
  webglRatio = 1;
  if (webglHealth) webglHealth.textContent = 'active';
});

function sessionScore() {
  return 36.2 * assetRatio + 36.2 * webglRatio + 27.6 * THREE.MathUtils.clamp(pageProgress, 0, 1);
}

function drawTrace(score) {
  if (!traceContext || !trace) return;
  const width = trace.width;
  const height = trace.height;
  traceContext.clearRect(0, 0, width, height);
  traceContext.strokeStyle = '#21262d';
  traceContext.lineWidth = 1;
  for (let y = 18; y < height; y += 18) {
    traceContext.beginPath();
    traceContext.moveTo(0, y + 0.5);
    traceContext.lineTo(width, y + 0.5);
    traceContext.stroke();
  }
  const gradient = traceContext.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(63, 185, 80, 0.28)');
  gradient.addColorStop(1, 'rgba(63, 185, 80, 0)');
  traceContext.beginPath();
  traceSamples.forEach((sample, index) => {
    const x = index / (traceSamples.length - 1) * width;
    const y = height - ((sample - 65) / 35) * (height - 10) - 5;
    if (index === 0) traceContext.moveTo(x, y); else traceContext.lineTo(x, y);
  });
  traceContext.lineTo(width, height);
  traceContext.lineTo(0, height);
  traceContext.closePath();
  traceContext.fillStyle = gradient;
  traceContext.fill();
  traceContext.beginPath();
  traceSamples.forEach((sample, index) => {
    const x = index / (traceSamples.length - 1) * width;
    const y = height - ((sample - 65) / 35) * (height - 10) - 5;
    if (index === 0) traceContext.moveTo(x, y); else traceContext.lineTo(x, y);
  });
  traceContext.strokeStyle = '#3fb950';
  traceContext.lineWidth = 2;
  traceContext.stroke();
}

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  for (let z = 0; z < grid; z++) for (let x = 0; x < grid; x++) {
    const i = z * grid + x; const wave = Math.sin(t * .85 + x * .55 + z * .38) * .25;
    const h = Math.max(.15, heights[i] + wave + pageProgress * Math.sin(i) * .8);
    dummy.position.set((x - grid / 2) * .72, h / 2, (z - grid / 2) * .72); dummy.scale.set(1, h, 1); dummy.updateMatrix(); columns.setMatrixAt(i, dummy.matrix);
  }
  columns.instanceMatrix.needsUpdate = true;
  const pos = planeGeometry.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) pos[i + 1] = basePositions[i + 1] + Math.sin(t * .55 + basePositions[i] * .7 + basePositions[i + 2] * .5) * .1;
  planeGeometry.attributes.position.needsUpdate = true;
  field.rotation.y += ((-.25 + pageProgress * 1.1 + pointer.x * .13) - field.rotation.y) * .025;
  field.rotation.x += ((pointer.y * .05) - field.rotation.x) * .025;
  const observability = THREE.MathUtils.smoothstep(pageProgress, 0, 1);
  field.position.y = -2.4 + observability * 1.5;
  columnMaterial.opacity = .3 + observability * .7;
  plane.material.opacity = .04 + observability * .24;
  orb.material.opacity = .38 + observability * .62;
  sun.intensity = 2.6 + observability * 2.2;
  renderer.domElement.style.opacity = String(.34 + observability * .66);
  renderer.domElement.style.filter = `contrast(${.82 + observability * .38}) saturate(${.72 + observability * .48})`;
  orb.position.y = 2.5 + Math.sin(t * 1.2) * .25; orb.rotation.y = t;
  const score = sessionScore();
  if (readout) readout.textContent = `${score.toFixed(1)}%`;
  if (walkthroughHealth) walkthroughHealth.textContent = `${Math.round(THREE.MathUtils.clamp(pageProgress, 0, 1) * 100)}%`;
  if (t - lastTraceSample > .12) {
    traceSamples.push(score);
    traceSamples.shift();
    drawTrace(score);
    lastTraceSample = t;
  }
  renderer.render(scene, camera); requestAnimationFrame(animate);
}
animate();
