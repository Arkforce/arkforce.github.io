import * as THREE from 'three';
import { routes, stationPosition } from './atlas-data.js';
import { renderIcons } from './shared.js';

// A demand-rendered model: no camera spin, scroll interception, or idle loop.
export function startTopology(container, onSelect) {
  const canvas = container.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 767px)');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x72786a, 2.7);
  scene.add(ambient);
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-4, 14, 7); light.castShadow = true;
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, near: .5, far: 40 });
  light.shadow.mapSize.set(1024, 1024); light.shadow.normalBias = .04;
  scene.add(light);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xd9ddd2, roughness: .95 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(13.4, .18, 10.2), baseMaterial);
  base.position.y = -.38; base.receiveShadow = true; scene.add(base);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb7beb0 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), lineMaterial);
  edge.position.copy(base.position); scene.add(edge);

  const pickable = [];
  const stationGeometry = new THREE.CylinderGeometry(.34, .34, .14, 32);
  const tileGeometry = new THREE.BoxGeometry(.8, .17, .8);
  const capGeometry = new THREE.BoxGeometry(.6, .05, .6);
  const lanes = routes.map((route, laneIndex) => {
    const group = new THREE.Group(); scene.add(group);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xaab4a1, roughness: .65 });
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xd0d9c4, roughness: .75 });
    const routeMaterial = new THREE.MeshStandardMaterial({ color: 0x6c8338, roughness: .7 });
    const stops = route.stages.map((_, stageIndex) => {
      const [x, , z] = stationPosition(laneIndex, stageIndex);
      const station = new THREE.Group(); station.position.set(x, 0, z); group.add(station);
      const foot = new THREE.Mesh(stationGeometry, routeMaterial); foot.position.y = .04; station.add(foot);
      for (let level = 0; level < stageIndex + 1; level++) {
        const tile = new THREE.Mesh(tileGeometry, bodyMaterial);
        tile.position.y = .22 + level * .23;
        tile.castShadow = true; tile.receiveShadow = true;
        tile.userData.route = route.id; pickable.push(tile); station.add(tile);
      }
      const top = .22 + stageIndex * .23 + .11;
      const cap = new THREE.Mesh(capGeometry, capMaterial); cap.position.y = top; station.add(cap);
      return { position: new THREE.Vector3(x, .16, z), labelPosition: new THREE.Vector3(x, top + .5, z) };
    });
    const points = [];
    stops.forEach((stop, index) => {
      if (index) {
        const previous = stops[index - 1].position;
        points.push(new THREE.Vector3(previous.x + 1.05, .16, previous.z));
        points.push(new THREE.Vector3(stop.position.x - 1.05, .16, stop.position.z));
      }
      points.push(stop.position);
    });
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const track = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, .045, 6, false), routeMaterial);
    track.userData.route = route.id; group.add(track); pickable.push(track);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(.10, 12, 8), new THREE.MeshBasicMaterial({ color: 0x242b2c }));
    marker.visible = false; group.add(marker);
    return { group, bodyMaterial, capMaterial, routeMaterial, stops, curve, marker, height: 0 };
  });
  const labels = routes[0].labels.map(() => {
    const element = document.createElement('span'); element.className = 'map-label';
    container.querySelector('#map-labels').append(element); return element;
  });
  let active = 0, plan = narrow.matches, playing = false, visible = true, disposed = false;
  let width = 1, height = 1, frame = null, lastFrame = 0, phase = 0, tween = null;
  const isoPosition = new THREE.Vector3(8, 13, 15);
  const planPosition = new THREE.Vector3(0, 20, .001);
  camera.position.copy(plan ? planPosition : isoPosition);
  const viewButton = document.querySelector('#view-toggle');
  const motionButton = document.querySelector('#motion-toggle');
  const markerPoint = new THREE.Vector3();
  const labelPoint = new THREE.Vector3();

  function syncControls() {
    viewButton.disabled = false;
    viewButton.setAttribute('aria-pressed', String(plan));
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(playing));
    motionButton.lastElementChild.textContent = reduced.matches ? 'Motion reduced' : playing ? 'Pause flow' : 'Play flow';
    motionButton.firstElementChild.dataset.icon = playing ? 'pause' : 'play';
    renderIcons(motionButton);
  }
  function applyPalette() {
    const css = getComputedStyle(document.documentElement);
    baseMaterial.color.set(css.getPropertyValue('--surface').trim());
    lineMaterial.color.set(css.getPropertyValue('--line').trim());
    lanes.forEach((lane, i) => {
      const chosen = active === i;
      lane.bodyMaterial.color.set(chosen ? css.getPropertyValue('--ink').trim() : css.getPropertyValue('--line').trim());
      lane.capMaterial.color.set(chosen ? '#c4e56b' : css.getPropertyValue('--muted').trim());
      lane.routeMaterial.color.set(chosen ? css.getPropertyValue('--route').trim() : css.getPropertyValue('--line').trim());
      lane.marker.material.color.set(css.getPropertyValue('--ink').trim());
    });
    requestRender();
  }
  function requestRender() {
    if (frame === null && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function settle() {
    tween = null;
    lanes.forEach((lane, i) => lane.group.position.y = i === active && !plan ? .6 : 0);
    camera.position.copy(plan ? planPosition : isoPosition);
  }
  function transition(instant) {
    if (instant || reduced.matches) settle();
    else tween = { start: performance.now(), fromCamera: camera.position.clone(), fromHeights: lanes.map(lane => lane.group.position.y) };
    requestRender();
  }
  // Exact inverse of cubic-bezier(.23, 1, .32, 1), shared with the CSS timing token.
  function easeOut(t) {
    let low = 0, high = 1;
    for (let i = 0; i < 12; i++) {
      const u = (low + high) / 2;
      const x = 3 * (1 - u) ** 2 * u * .23 + 3 * (1 - u) * u ** 2 * .32 + u ** 3;
      if (x < t) low = u; else high = u;
    }
    return 1 - (1 - (low + high) / 2) ** 3;
  }
  function draw(time) {
    frame = null;
    if (disposed || !visible || document.hidden) return;
    if (time - lastFrame < 1000 / 30) { requestRender(); return; }
    const delta = Math.min((time - lastFrame) / 1000, .1); lastFrame = time;
    if (tween) {
      const progress = Math.min((time - tween.start) / 250, 1);
      const eased = easeOut(progress);
      camera.position.lerpVectors(tween.fromCamera, plan ? planPosition : isoPosition, eased);
      lanes.forEach((lane, i) => lane.group.position.y = THREE.MathUtils.lerp(tween.fromHeights[i], i === active && !plan ? .6 : 0, eased));
      if (progress === 1) tween = null;
    }
    camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    if (playing && !reduced.matches) phase = (phase + delta / 5) % 1;
    lanes.forEach((lane, i) => {
      lane.marker.visible = playing && !reduced.matches && i === active;
      if (lane.marker.visible) { lane.curve.getPointAt(phase, markerPoint); lane.marker.position.copy(markerPoint); }
    });
    scene.updateMatrixWorld(true);
    labels.forEach((label, i) => {
      labelPoint.copy(lanes[active].stops[i].labelPosition);
      lanes[active].group.localToWorld(labelPoint); labelPoint.project(camera);
      const x = THREE.MathUtils.clamp((labelPoint.x * .5 + .5) * width, 38, width - 38);
      const y = THREE.MathUtils.clamp((-labelPoint.y * .5 + .5) * height - 12, 14, height - 40);
      label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    });
    renderer.render(scene, camera);
    if (tween || (playing && !reduced.matches)) requestRender();
  }
  function resize() {
    width = container.clientWidth; height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfHeight = Math.max(6.2, 8 / aspect);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix();
    requestRender();
  }
  function select(id, instant = false) {
    const next = routes.findIndex(route => route.id === id);
    if (next < 0) return;
    active = next; phase = 0;
    labels.forEach((label, i) => label.textContent = routes[active].labels[i]);
    applyPalette(); transition(instant);
  }
  function toggleView(event) { plan = !plan; syncControls(); transition(event.detail === 0); }
  function toggleMotion() { playing = !playing && !reduced.matches; syncControls(); requestRender(); }
  function motionPreference() { if (reduced.matches) { playing = false; settle(); } syncControls(); requestRender(); }
  function layoutPreference() { plan = narrow.matches; settle(); syncControls(); resize(); }
  function visibility() { if (document.hidden) { if (frame !== null) cancelAnimationFrame(frame); frame = null; } else { lastFrame = performance.now(); requestRender(); } }
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickable, false)[0];
    if (hit) onSelect(hit.object.userData.route);
  }
  function contextLost(event) {
    event.preventDefault(); dispose();
    document.querySelector('#atlas-caption').textContent = '3D paused by your browser. The static route diagram and all case studies remain available.';
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && frame !== null) { cancelAnimationFrame(frame); frame = null; }
    if (visible) { lastFrame = performance.now(); requestRender(); }
  });
  intersection.observe(container);
  viewButton.addEventListener('click', toggleView); motionButton.addEventListener('click', toggleMotion);
  reduced.addEventListener('change', motionPreference); narrow.addEventListener('change', layoutPreference);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('themechange', applyPalette);
  canvas.addEventListener('click', pick); canvas.addEventListener('webglcontextlost', contextLost);
  function pageHide(event) { if (!event.persisted) dispose(); else { if (frame !== null) cancelAnimationFrame(frame); frame = null; } }
  window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', visibility);
  function dispose() {
    if (disposed) return;
    disposed = true; if (frame !== null) cancelAnimationFrame(frame);
    resizeObserver.disconnect(); intersection.disconnect();
    viewButton.removeEventListener('click', toggleView); motionButton.removeEventListener('click', toggleMotion);
    reduced.removeEventListener('change', motionPreference); narrow.removeEventListener('change', layoutPreference);
    document.removeEventListener('visibilitychange', visibility); document.removeEventListener('themechange', applyPalette);
    canvas.removeEventListener('click', pick); canvas.removeEventListener('webglcontextlost', contextLost);
    window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', visibility);
    const geometries = new Set(), materials = new Set();
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); renderer.dispose();
    labels.forEach(label => label.remove()); container.classList.remove('is-ready');
    viewButton.disabled = true; motionButton.disabled = true;
  }
  resize(); select(routes[0].id, true); syncControls(); container.classList.add('is-ready');
  return { select: (...args) => { if (!disposed) select(...args); }, dispose };
}
