import * as THREE from 'three';

const canvas = document.querySelector('#network');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03070c, 0.035);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 15);

const network = new THREE.Group();
network.position.set(innerWidth < 800 ? 2 : 4.8, 0, -1);
scene.add(network);

const count = 105;
const nodes = [];
const nodePositions = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const radius = 2.4 + Math.random() * 5.5;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const point = new THREE.Vector3(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
  nodes.push(point); nodePositions.set(point.toArray(), i * 3);
}
const nodeGeometry = new THREE.BufferGeometry();
nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
const nodeCloud = new THREE.Points(nodeGeometry, new THREE.PointsMaterial({ color: 0x65ffe3, size: 0.075, transparent: true, opacity: 0.9, sizeAttenuation: true }));
network.add(nodeCloud);

const linePositions = [];
for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
  if (nodes[i].distanceTo(nodes[j]) < 1.55 && Math.random() > 0.18) linePositions.push(...nodes[i].toArray(), ...nodes[j].toArray());
}
const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
network.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0x2fc8b5, transparent: true, opacity: 0.18 })));

const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), new THREE.MeshBasicMaterial({ color: 0xff794d, wireframe: true, transparent: true, opacity: 0.75 }));
network.add(core);
for (const [radius, tilt] of [[1.8, .5], [2.45, 1.1], [3.2, -.65]]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .008, 4, 160), new THREE.MeshBasicMaterial({ color: 0x65ffe3, transparent: true, opacity: .3 }));
  ring.rotation.set(tilt, tilt * .4, tilt * .8); network.add(ring);
}

const packetGeometry = new THREE.SphereGeometry(.045, 8, 8);
const packets = Array.from({ length: 12 }, (_, i) => {
  const mesh = new THREE.Mesh(packetGeometry, new THREE.MeshBasicMaterial({ color: i % 3 ? 0x65ffe3 : 0xff794d }));
  mesh.userData = { radius: 1.8 + Math.random() * 4, speed: .18 + Math.random() * .28, offset: Math.random() * Math.PI * 2, tilt: Math.random() * 2 - 1 };
  network.add(mesh); return mesh;
});

const pointer = new THREE.Vector2();
let scrollProgress = 0;
addEventListener('pointermove', (event) => { pointer.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5); });
addEventListener('scroll', () => { scrollProgress = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1); }, { passive: true });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); });

const labels = ['HYBRID CORE', 'AWS REGION', 'AZURE NETWORK', 'VMWARE CLUSTER', 'OBSERVABILITY', 'AUTOMATION BUS'];
let labelTick = 0;
setInterval(() => { document.querySelector('#node-label').textContent = labels[labelTick++ % labels.length]; }, 1800);

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  network.rotation.y = t * .035 + scrollProgress * 2.4 + pointer.x * .18;
  network.rotation.x += (pointer.y * .18 - network.rotation.x) * .03;
  core.rotation.x = t * .18; core.rotation.y = t * .24;
  packets.forEach((packet) => { const d = packet.userData; const a = t * d.speed + d.offset; packet.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius * .62, Math.sin(a * 1.3) * d.tilt * 2); });
  camera.position.x += (pointer.x * .8 - camera.position.x) * .025;
  camera.position.y += (-pointer.y * .6 - camera.position.y) * .025;
  renderer.render(scene, camera); requestAnimationFrame(animate);
}
animate();
