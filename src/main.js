import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080b10, 0.055);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 12);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const world = new THREE.Group();
world.position.set(3.3, 0.2, 0);
scene.add(world);

const geometry = new THREE.IcosahedronGeometry(2.35, 3);
const material = new THREE.MeshPhysicalMaterial({
  color: 0x121923,
  emissive: 0x071018,
  metalness: 0.72,
  roughness: 0.25,
  clearcoat: 1,
  clearcoatRoughness: 0.18,
  wireframe: true,
  transparent: true,
  opacity: 0.74,
});
const orb = new THREE.Mesh(geometry, material);
world.add(orb);

const inner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.42, 1),
  new THREE.MeshPhysicalMaterial({ color: 0x0b1119, emissive: 0x04121c, roughness: 0.3, metalness: 0.8 })
);
world.add(inner);

const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x6ee7d8, transparent: true, opacity: 0.42 });
const rings = [
  new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.012, 8, 180), ringMaterial),
  new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.009, 8, 180), ringMaterial.clone()),
];
rings[0].rotation.set(1.15, 0.2, 0.45);
rings[1].rotation.set(0.45, 1.2, -0.2);
rings[1].material.opacity = 0.2;
rings.forEach((ring) => world.add(ring));

const pointGeometry = new THREE.BufferGeometry();
const pointCount = 700;
const positions = new Float32Array(pointCount * 3);
for (let i = 0; i < pointCount; i += 1) {
  const radius = 7 + Math.random() * 17;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[i * 3 + 2] = radius * Math.cos(phi);
}
pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const stars = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: 0x9eb8c7, size: 0.018, transparent: true, opacity: 0.5 }));
scene.add(stars);

scene.add(new THREE.HemisphereLight(0x8be9df, 0x090b12, 1.7));
const keyLight = new THREE.PointLight(0x6ee7d8, 30, 20);
keyLight.position.set(4, 4, 5);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x748ffc, 22, 18);
rimLight.position.set(-4, -3, 2);
scene.add(rimLight);

const pointer = new THREE.Vector2();
let targetScroll = 0;
let animationPaused = false;

window.addEventListener('pointermove', ({ clientX, clientY }) => {
  pointer.x = clientX / innerWidth - 0.5;
  pointer.y = clientY / innerHeight - 0.5;
});

window.addEventListener('scroll', () => {
  targetScroll = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1);
  document.documentElement.style.setProperty('--scroll', targetScroll);
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

document.querySelector('.sound-toggle').addEventListener('click', (event) => {
  animationPaused = !animationPaused;
  event.currentTarget.classList.toggle('paused', animationPaused);
  event.currentTarget.setAttribute('aria-pressed', String(animationPaused));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
}, { threshold: 0.14 });
document.querySelectorAll('.section, .project-card').forEach((element) => observer.observe(element));

const clock = new THREE.Clock();
function animate() {
  const time = clock.getElapsedTime();
  if (!animationPaused) {
    orb.rotation.y = time * 0.09 + pointer.x * 0.3;
    orb.rotation.x = time * 0.055 + pointer.y * 0.25;
    inner.rotation.y = -time * 0.07;
    rings[0].rotation.z = 0.45 + time * 0.035;
    rings[1].rotation.z = -0.2 - time * 0.025;
    stars.rotation.y = time * 0.003;
  }
  world.position.x += ((innerWidth < 800 ? 1.2 : 3.3) + pointer.x * 0.7 - world.position.x) * 0.04;
  world.position.y += (-targetScroll * 10 - pointer.y * 0.5 - world.position.y) * 0.035;
  world.rotation.z = -targetScroll * 1.2;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
