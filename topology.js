import * as THREE from "three";

export function startTopology(container, motionButton) {
  const canvas = container.querySelector("canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return () => {};
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 800px)");
  const revealLabel = document.querySelector("#reveal-label");
  const revealFill = document.querySelector("#reveal-fill");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(9, 8, 12);
  camera.lookAt(0, 0.4, 0);
  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xb5d8b6, 2));
  const light = new THREE.DirectionalLight(0xe8ffd4, 3);
  light.position.set(3, 8, 5);
  scene.add(light);
  const layers = [];
  const nodes = [];
  const lines = [];
  const geometry = new THREE.BoxGeometry(0.62, 0.52, 0.62);
  const positions = [
    [-2, -2],
    [0, -2],
    [2, -2],
    [-2, 0],
    [0, 0],
    [2, 0],
    [-2, 2],
    [0, 2],
    [2, 2],
  ];
  for (let level = 0; level < 3; level++) {
    const tier = new THREE.Group();
    tier.position.y = (1 - level) * 1.65;
    group.add(tier);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.06, 5.6),
      new THREE.MeshStandardMaterial({
        color: 0x4a7251,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    );
    floor.position.y = -0.33;
    tier.add(floor);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(floor.geometry),
      new THREE.LineBasicMaterial({
        color: 0x779a6b,
        transparent: true,
        opacity: 0.32,
      }),
    );
    outline.position.copy(floor.position);
    tier.add(outline);
    positions.forEach(([x, z], index) => {
      const material = new THREE.MeshStandardMaterial({
        color: level === 0 ? 0x9fb58e : 0x526e51,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x223c25,
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 0, z);
      if (index === 4) mesh.scale.set(1.2, 1.45, 1.2);
      tier.add(mesh);
      nodes.push({ mesh, level });
    });
    const points = [];
    for (let i = 0; i < 3; i++) {
      points.push(
        new THREE.Vector3(-2, 0, i * 2 - 2),
        new THREE.Vector3(2, 0, i * 2 - 2),
      );
      points.push(
        new THREE.Vector3(i * 2 - 2, 0, -2),
        new THREE.Vector3(i * 2 - 2, 0, 2),
      );
    }
    const links = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: 0xa3d997,
        transparent: true,
        opacity: 0.3,
      }),
    );
    tier.add(links);
    lines.push(links);
    layers.push(tier);
  }
  const verticalPoints = [];
  for (const [x, z] of [
    [-2, -2],
    [2, 2],
    [0, 0],
  ])
    verticalPoints.push(
      new THREE.Vector3(x, -1.65, z),
      new THREE.Vector3(x, 1.65, z),
    );
  const verticalLinks = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(verticalPoints),
    new THREE.LineBasicMaterial({
      color: 0x9bcb91,
      transparent: true,
      opacity: 0.4,
    }),
  );
  group.add(verticalLinks);
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xe2ffc4 }),
  );
  group.add(pulse);
  let frame = 0;
  let visible = true;
  let manuallyPaused = false;
  let failed = false;
  let activeLayer = 0;
  let lastTime = 0;
  let phase = 0;
  let reveal = 0;
  const darkNode = new THREE.Color(0x334b39);
  const litNode = new THREE.Color(0x8aaa7d);
  const animated = () => !reduced.matches && !mobile.matches && !manuallyPaused;
  function paint() {
    if (failed) return;
    try {
      renderer.render(scene, camera);
      container.classList.add("has-webgl");
    } catch {
      failed = true;
      container.classList.remove("has-webgl");
      motionButton.hidden = true;
    }
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || !animated() || failed) return;
    if (time - lastTime >= 32) {
      phase += Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      group.rotation.y = -0.15 + Math.sin(phase * 0.14) * 0.14;
      group.rotation.x = Math.sin(phase * 0.1) * 0.025;
      pulse.position.set(0, Math.sin(phase * 0.65) * (1.45 + reveal * 0.5), 0);
      paint();
    }
    if (!failed) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    motionButton.hidden = reduced.matches || mobile.matches || failed;
    motionButton.textContent = manuallyPaused
      ? "Resume motion"
      : "Pause motion";
    motionButton.setAttribute("aria-pressed", String(manuallyPaused));
    if (!visible || document.hidden || failed) return;
    updateReveal();
    paint();
    if (animated()) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function select(level) {
    activeLayer = level;
    nodes.forEach(({ mesh, level: own }) => {
      mesh.material.color.copy(darkNode).lerp(litNode, reveal);
      if (own === activeLayer)
        mesh.material.color.lerp(new THREE.Color(0xb8d8a1), 0.65);
      mesh.material.emissiveIntensity =
        own === activeLayer ? 0.2 + reveal * 0.3 : reveal * 0.15;
    });
    lines.forEach((line, own) => {
      line.material.opacity =
        own === activeLayer ? 0.2 + reveal * 0.6 : 0.03 + reveal * 0.45;
    });
    paint();
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, mobile.matches ? 1.25 : 1.5),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(9, 8, 12).multiplyScalar(camera.aspect < 1.2 ? 1.2 : 1);
    camera.updateProjectionMatrix();
    paint();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  visibilityObserver.observe(container);
  let scrollFrame = 0;
  function updateReveal() {
    scrollFrame = 0;
    if (!visible || document.hidden || failed) return;
    if (manuallyPaused && !reduced.matches && !mobile.matches) return;
    const staticView = reduced.matches || mobile.matches;
    const hero = container.closest(".hero");
    const distance = Math.max(hero.getBoundingClientRect().height * 0.35, 1);
    const progress = Math.max(
      0,
      Math.min(-hero.getBoundingClientRect().top / distance, 1),
    );
    reveal = staticView ? 1 : progress * progress * (3 - 2 * progress);
    layers.forEach((tier, index) => {
      tier.position.y = (1 - index) * (1.45 + reveal * 0.5);
    });
    const endpoints = verticalLinks.geometry.attributes.position;
    for (let index = 0; index < endpoints.count; index++)
      endpoints.setY(index, (index % 2 ? 1 : -1) * (1.45 + reveal * 0.5));
    endpoints.needsUpdate = true;
    verticalLinks.material.opacity = 0.06 + reveal * 0.6;
    pulse.visible = !staticView && reveal > 0.5;
    revealLabel.textContent = staticView
      ? "Resources, automation, and signals connected"
      : reveal < 0.25
        ? "Scroll to reveal the connections"
        : reveal < 0.8
          ? "Dependencies come into view"
          : "The connected system, made visible";
    revealFill.style.transform = `scaleX(${reveal})`;
    select(activeLayer);
  }
  addEventListener(
    "scroll",
    () => {
      if (!scrollFrame && visible && animated())
        scrollFrame = requestAnimationFrame(updateReveal);
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  mobile.addEventListener("change", sync);
  motionButton.addEventListener("click", () => {
    manuallyPaused = !manuallyPaused;
    sync();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    failed = true;
    cancelAnimationFrame(frame);
    container.classList.remove("has-webgl");
    motionButton.hidden = true;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    failed = false;
    resize();
    sync();
  });
  resize();
  select(0);
  sync();
  return select;
}
