const canvas = document.querySelector('#terrain');
const graphicsStatus = document.querySelector('#webgl-health');
const walkthroughValue = document.querySelector('#walkthrough-value');
const trace = document.querySelector('#signal-trace');
const traceContext = trace?.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const traceSamples = Array(64).fill(0);
let pageProgress = 0;
let progressFrame = 0;

function drawProgressTrace(progress) {
  if (!traceContext || !trace) return;
  const width = trace.width;
  const height = trace.height;
  traceContext.clearRect(0, 0, width, height);
  traceContext.strokeStyle = '#21262d';
  traceContext.lineWidth = 1;
  for (let y = 18; y < height; y += 18) {
    traceContext.beginPath();
    traceContext.moveTo(0, y + .5);
    traceContext.lineTo(width, y + .5);
    traceContext.stroke();
  }
  traceSamples.push(progress);
  traceSamples.shift();
  traceContext.beginPath();
  traceSamples.forEach((sample, index) => {
    const x = index / (traceSamples.length - 1) * width;
    const y = height - sample / 100 * (height - 10) - 5;
    if (index === 0) traceContext.moveTo(x, y); else traceContext.lineTo(x, y);
  });
  traceContext.strokeStyle = '#3fb950';
  traceContext.lineWidth = 2;
  traceContext.stroke();
}

function updatePageProgress() {
  progressFrame = 0;
  pageProgress = scrollY / Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const explored = Math.round(Math.max(0, Math.min(pageProgress, 1)) * 100);
  if (walkthroughValue) walkthroughValue.textContent = `${explored}%`;
  drawProgressTrace(explored);
}

function queueProgressUpdate() {
  if (!progressFrame) progressFrame = requestAnimationFrame(updatePageProgress);
}

addEventListener('scroll', queueProgressUpdate, { passive: true });
addEventListener('resize', queueProgressUpdate);
updatePageProgress();

const navigationLinks = [...document.querySelectorAll('header nav a[href^="#"]')];
const navigationSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function setCurrentSection(id) {
  navigationLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (visible) setCurrentSection(visible.target.id);
  }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
  navigationSections.forEach((section) => sectionObserver.observe(section));
}

function markGraphicsUnavailable() {
  if (graphicsStatus) graphicsStatus.textContent = 'unavailable';
  canvas?.classList.add('visual-fallback');
}

function startVisual(THREE) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    markGraphicsUnavailable();
    return;
  }

  if (graphicsStatus) graphicsStatus.textContent = 'available';
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d1117, 9, 31);
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 60);
  camera.position.set(8, 6.4, 13);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0x8b949e, 0x05080c, 2.1));
  const sun = new THREE.DirectionalLight(0x7ee787, 2.6);
  sun.position.set(5, 9, 6);
  scene.add(sun);

  const field = new THREE.Group();
  field.position.set(3.7, -2.4, 0);
  scene.add(field);
  const grid = 11;
  const total = grid * grid;
  const columnGeometry = new THREE.BoxGeometry(.34, 1, .34);
  const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: .55, metalness: .14, transparent: true, opacity: .3 });
  const columns = new THREE.InstancedMesh(columnGeometry, columnMaterial, total);
  field.add(columns);
  const dummy = new THREE.Object3D();
  const heights = new Float32Array(total);

  for (let z = 0; z < grid; z++) for (let x = 0; x < grid; x++) {
    const i = z * grid + x;
    heights[i] = .25 + Math.random() * 2.2;
    dummy.position.set((x - grid / 2) * .72, heights[i] / 2, (z - grid / 2) * .72);
    dummy.scale.set(1, heights[i], 1);
    dummy.updateMatrix();
    columns.setMatrixAt(i, dummy.matrix);
    columns.setColorAt(i, new THREE.Color(i % 17 === 0 ? 0x3fb950 : i % 23 === 0 ? 0xf0883e : 0x30363d));
  }

  const planeGeometry = new THREE.PlaneGeometry(12, 12, 42, 42);
  planeGeometry.rotateX(-Math.PI / 2);
  const basePositions = planeGeometry.attributes.position.array.slice();
  const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({ color: 0x3fb950, wireframe: true, transparent: true, opacity: .04 }));
  plane.position.y = -.05;
  field.add(plane);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(.55, 28, 28),
    new THREE.MeshPhysicalMaterial({ color: 0xf0883e, roughness: .2, metalness: .1, clearcoat: 1, transparent: true, opacity: .38 })
  );
  orb.position.set(-1.4, 2.6, 0);
  field.add(orb);

  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  let animationFrame = 0;
  let running = false;

  function renderFrame() {
    const t = reducedMotion.matches ? 0 : clock.getElapsedTime();
    const visualProgress = reducedMotion.matches ? 0 : pageProgress;
    for (let z = 0; z < grid; z++) for (let x = 0; x < grid; x++) {
      const i = z * grid + x;
      const wave = reducedMotion.matches ? 0 : Math.sin(t * .85 + x * .55 + z * .38) * .25;
      const h = Math.max(.15, heights[i] + wave + visualProgress * Math.sin(i) * .8);
      dummy.position.set((x - grid / 2) * .72, h / 2, (z - grid / 2) * .72);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      columns.setMatrixAt(i, dummy.matrix);
    }
    columns.instanceMatrix.needsUpdate = true;

    const positions = planeGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const movement = reducedMotion.matches ? 0 : Math.sin(t * .55 + basePositions[i] * .7 + basePositions[i + 2] * .5) * .1;
      positions[i + 1] = basePositions[i + 1] + movement;
    }
    planeGeometry.attributes.position.needsUpdate = true;

    const observability = THREE.MathUtils.smoothstep(visualProgress, 0, 1);
    field.rotation.y += ((-.25 + visualProgress * 1.1 + (reducedMotion.matches ? 0 : pointer.x * .13)) - field.rotation.y) * (reducedMotion.matches ? 1 : .025);
    field.rotation.x += (((reducedMotion.matches ? 0 : pointer.y * .05)) - field.rotation.x) * (reducedMotion.matches ? 1 : .025);
    field.position.y = -2.4 + observability * 1.5;
    columnMaterial.opacity = .3 + observability * .7;
    plane.material.opacity = .04 + observability * .24;
    orb.material.opacity = .38 + observability * .62;
    sun.intensity = 2.6 + observability * 2.2;
    renderer.domElement.style.opacity = String(.34 + observability * .66);
    renderer.domElement.style.filter = `contrast(${.82 + observability * .38}) saturate(${.72 + observability * .48})`;
    orb.position.y = 2.5 + (reducedMotion.matches ? 0 : Math.sin(t * 1.2) * .25);
    orb.rotation.y = t;

    renderer.render(scene, camera);
  }

  function tick() {
    animationFrame = 0;
    if (document.hidden) {
      running = false;
      return;
    }
    try {
      renderFrame();
    } catch (error) {
      running = false;
      markGraphicsUnavailable();
      return;
    }
    if (reducedMotion.matches) {
      running = false;
      return;
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function startRendering() {
    if (running || document.hidden) return;
    running = true;
    animationFrame = requestAnimationFrame(tick);
  }

  addEventListener('pointermove', (event) => {
    pointer.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5);
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (reducedMotion.matches) startRendering();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
      running = false;
    } else startRendering();
  });
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(animationFrame);
    running = false;
    startRendering();
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(animationFrame);
    running = false;
    markGraphicsUnavailable();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    if (graphicsStatus) graphicsStatus.textContent = 'available';
    canvas.classList.remove('visual-fallback');
    startRendering();
  });

  startRendering();
}

import('three').then(startVisual).catch(markGraphicsUnavailable);
