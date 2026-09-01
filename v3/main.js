import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#terrain'), antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xecebe5, 9, 31);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 60);
camera.position.set(8, 6.4, 13); camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6f756c, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(5, 9, 6); scene.add(sun);

const field = new THREE.Group(); field.position.set(3.7, -2.4, 0); scene.add(field);
const grid = 11; const total = grid * grid;
const columnGeometry = new THREE.BoxGeometry(.34, 1, .34);
const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x111310, roughness: .55, metalness: .08 });
const columns = new THREE.InstancedMesh(columnGeometry, columnMaterial, total);
field.add(columns);
const dummy = new THREE.Object3D();
const heights = new Float32Array(total);
for (let z = 0; z < grid; z++) for (let x = 0; x < grid; x++) {
  const i = z * grid + x; heights[i] = .25 + Math.random() * 2.2;
  dummy.position.set((x - grid / 2) * .72, heights[i] / 2, (z - grid / 2) * .72);
  dummy.scale.set(1, heights[i], 1); dummy.updateMatrix(); columns.setMatrixAt(i, dummy.matrix);
  const color = new THREE.Color(i % 17 === 0 ? 0xff5c35 : i % 23 === 0 ? 0x3e74ff : 0x171a16); columns.setColorAt(i, color);
}

const planeGeometry = new THREE.PlaneGeometry(12, 12, 42, 42); planeGeometry.rotateX(-Math.PI / 2);
const basePositions = planeGeometry.attributes.position.array.slice();
const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({ color: 0x111310, wireframe: true, transparent: true, opacity: .11 }));
plane.position.y = -.05; field.add(plane);

const orb = new THREE.Mesh(new THREE.SphereGeometry(.55, 28, 28), new THREE.MeshPhysicalMaterial({ color: 0xff5c35, roughness: .2, metalness: .1, clearcoat: 1 }));
orb.position.set(-1.4, 2.6, 0); field.add(orb);

const pointer = new THREE.Vector2(); let pageProgress = 0;
addEventListener('pointermove', (event) => pointer.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5));
addEventListener('scroll', () => { pageProgress = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1); }, { passive: true });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); });

const readout = document.querySelector('#field-value');
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
  field.position.y = -2.4 - pageProgress * 8;
  orb.position.y = 2.5 + Math.sin(t * 1.2) * .25; orb.rotation.y = t;
  readout.textContent = (72.4 + Math.sin(t * .7) * 3.8).toFixed(1);
  renderer.render(scene, camera); requestAnimationFrame(animate);
}
animate();
