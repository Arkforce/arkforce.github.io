import { routes, getRoute } from './atlas-data.js';

const map = document.querySelector('#atlas-map');
if (map) {
  let active = 'iam';
  let scene = null;
  const buttons = [...document.querySelectorAll('[data-route]')];
  const stages = document.querySelector('#route-stages');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // This DOM projection and the Three.js scene share the route model.
  const fallback = map.querySelector('.atlas-fallback');
  const ns = 'http://www.w3.org/2000/svg';
  const fallbackGroups = routes.map((route, lane) => {
    const group = document.createElementNS(ns, 'g');
    const y = 62 + lane * 115;
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', `M85 ${y} H275 L480 ${y + 30} H715`);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '4');
    group.append(line);
    route.labels.forEach((label, i) => {
      const x = [85, 275, 480, 715][i];
      const sy = y + (i > 1 ? 30 : 0);
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', sy); dot.setAttribute('r', '8');
      dot.setAttribute('fill', 'var(--surface)'); dot.setAttribute('stroke', 'currentColor'); dot.setAttribute('stroke-width', '3');
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', x); text.setAttribute('y', sy - 19); text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '16'); text.setAttribute('fill', 'currentColor');
      text.textContent = label;
      group.append(dot, text);
    });
    return group;
  });
  // Leave the existing accessible title and description intact.
  [...fallback.children].filter(node => !['title', 'desc'].includes(node.tagName)).forEach(node => node.remove());
  fallback.append(...fallbackGroups);

  function select(id, instant = false) {
    const route = getRoute(id);
    if (!route) return;
    active = id;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.route === id)));
    for (const [key, value] of Object.entries({ code: route.code, category: route.category, title: route.title, description: route.description })) {
      document.querySelector(`#route-${key}`).textContent = value;
    }
    const link = document.querySelector('#route-link');
    link.href = route.href;
    link.setAttribute('aria-label', `Read ${route.title} case study`);
    stages.replaceChildren(...route.stages.map(stage => {
      const item = document.createElement('li'); item.textContent = stage; return item;
    }));
    fallbackGroups.forEach((group, i) => {
      group.style.color = routes[i].id === id ? 'var(--route)' : 'var(--muted)';
      group.style.opacity = routes[i].id === id ? '1' : '.35';
    });
    scene?.select(id, instant || reduced.matches);
  }
  buttons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', event => select(button.dataset.route, event.detail === 0));
  });
  select(active, true);

  // The diagram and project controls work before (and without) WebGL.
  const load = async () => {
    try {
      const { startTopology } = await import('./topology.js');
      scene = startTopology(map, (id) => select(id));
      scene.select(active, true);
    } catch {
      document.querySelector('#atlas-caption').textContent = 'Static diagram shown: 3D is unavailable. Route selection and all case studies still work.';
    }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
    }, { rootMargin: '180px' });
    observer.observe(map);
  } else load();
}
