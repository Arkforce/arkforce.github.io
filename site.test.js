import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import { routes, getRoute, stationPosition } from './atlas-data.js';
import { evaluateRequest, requestYaml } from './demo.js';

const root = new URL('.', import.meta.url);
const source = file => readFileSync(new URL(file, root), 'utf8');
const pages = ['index.html', 'work.html', ...routes.map(route => route.href.slice(2))];
const documentFor = file => parseHTML(source(file));

test('every static page has unique IDs, a main landmark, and valid local destinations', () => {
  for (const file of pages) {
    const { document } = documentFor(file);
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    assert.equal(ids.length, new Set(ids).size, `${file}: duplicate ID`);
    assert.equal(document.querySelectorAll('main').length, 1);
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.ok(document.querySelector('a[href="mailto:khodzhaev@gmail.com"]'));
    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (!href.startsWith('.') && !href.startsWith('#')) continue;
      const [path, fragment] = href.split('#');
      const target = path || file;
      assert.ok(existsSync(new URL(target, root)), `${file}: missing ${target}`);
      if (fragment) assert.ok(documentFor(target).document.getElementById(fragment), `${file}: missing ${href}`);
    }
    for (const label of document.querySelectorAll('label[for]')) assert.ok(document.getElementById(label.htmlFor || label.getAttribute('for')));
    for (const node of document.querySelectorAll('[aria-controls]')) assert.ok(document.getElementById(node.getAttribute('aria-controls')));
    assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(source(file)), 'Fonts must be self-hosted');
  }
});

test('route model has four independent workflows and corresponding case studies', () => {
  assert.equal(routes.length, 4);
  assert.equal(new Set(routes.map(route => route.id)).size, 4);
  routes.forEach((route, lane) => {
    assert.equal(route.stages.length, 4); assert.equal(route.labels.length, 4);
    assert.equal(getRoute(route.id), route);
    assert.ok(existsSync(new URL(route.href, root)));
    for (let stop = 0; stop < 4; stop++) {
      const position = stationPosition(lane, stop);
      assert.ok(position.every(Number.isFinite));
      if (lane) assert.ok(position[2] > stationPosition(lane - 1, stop)[2]);
    }
  });
  assert.equal(getRoute('unknown'), undefined);
});

test('route selection updates labels, accessible state, fallback, and destination without WebGL', () => {
  const { document, window } = documentFor('index.html');
  class Observer { observe() {} disconnect() {} }
  const code = source('atlas.js').replace(/^import[^\n]*\n/gm, '');
  const run = new Function('document', 'window', 'matchMedia', 'IntersectionObserver', 'routes', 'getRoute', code);
  run(document, { IntersectionObserver: Observer }, () => ({ matches: true }), Observer, routes, getRoute);
  assert.equal(document.querySelectorAll('.atlas-fallback circle').length, 16);
  for (const route of routes) {
    const button = document.querySelector(`[data-route="${route.id}"]`);
    assert.equal(button.disabled, false);
    button.dispatchEvent(new window.Event('click'));
    assert.equal(document.querySelectorAll('[data-route][aria-pressed="true"]').length, 1);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('#route-title').textContent, route.title);
    assert.equal(document.querySelector('#route-link').getAttribute('href'), route.href);
    assert.deepEqual([...document.querySelectorAll('#route-stages li')].map(node => node.textContent), route.stages);
  }
});

function initDemo() {
  const { document, window } = documentFor('index.html');
  const form = document.querySelector('#request-form');
  const elements = Object.fromEntries(['role', 'trust', 'permission'].map(name => [name, document.querySelector(`[name="${name}"]`)]));
  Object.defineProperty(form, 'elements', { value: elements });
  for (const [name, value] of [['trust', 'ec2'], ['permission', 'claims-bucket-read-only']]) Object.defineProperty(elements[name], 'value', { value, writable: true, configurable: true });
  form.requestSubmit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  const clipboard = [];
  const code = source('main.js').replace(/^import[^\n]*\n/gm, '');
  new Function('document', 'location', 'navigator', 'evaluateRequest', 'requestYaml', code)(document, { hash: '', replace() {} }, { clipboard: { writeText: async value => clipboard.push(value) } }, evaluateRequest, requestYaml);
  return { document, window, form, elements, clipboard };
}

test('IAM DOM flow validates, changes tabs, copies, invalidates stale output, and rejects admin', async () => {
  const { document, window, form, elements, clipboard } = initDemo();
  const click = selector => document.querySelector(selector).dispatchEvent(new window.Event('click'));
  assert.equal(document.querySelector('#validate-button').disabled, false);
  form.requestSubmit();
  assert.equal(document.querySelector('#output-state').textContent, 'ACCEPTED');
  assert.match(document.querySelector('#generated-output').textContent, /ec2.amazonaws.com/);
  click('[data-output="permissions"]');
  assert.match(document.querySelector('#generated-output').textContent, /s3:GetObject/);
  click('#copy-output'); await Promise.resolve();
  assert.equal(clipboard.length, 1);
  assert.match(document.querySelector('#copy-message').textContent, /copied/);
  elements.role.value = 'different-role'; form.dispatchEvent(new window.Event('input'));
  assert.equal(document.querySelector('#copy-output').disabled, true);
  assert.equal(document.querySelector('#output-state').textContent, 'READY');
  click('[data-preset="blocked"]');
  assert.equal(document.querySelector('#output-state').textContent, 'BLOCKED');
  assert.equal(document.querySelector('#copy-output').disabled, true);
  assert.match(document.querySelector('#generated-output').textContent, /No policy or plan generated/);
  click('[data-preset="allowed"]');
  assert.equal(document.querySelector('#output-state').textContent, 'ACCEPTED');
  click('[data-output="plan"]');
  assert.match(document.querySelector('#generated-output').textContent, /Nothing has been deployed/);
});

test('readable text and critical links are present without scripts', () => {
  const { document } = documentFor('index.html');
  routes.forEach(route => assert.ok(document.querySelector(`a[href="${route.href}"]`)));
  assert.ok(document.querySelector('.atlas-fallback title'));
  assert.ok(document.querySelector('.atlas-fallback desc'));
  assert.match(document.querySelector('#route-detail').textContent, /AWS IAM Role Factory/);
  assert.ok(document.querySelector('#validate-button').hasAttribute('disabled'));
  assert.match(document.querySelector('.demo-note').textContent, /No credentials, AWS calls/);
});

test('core text and interface colors meet WCAG AA in both themes', () => {
  const luminance = hex => {
    const rgb = hex.match(/[a-f0-9]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  for (const [text, ground] of [['242b2c','ededeb'],['596160','ededeb'],['596160','e3e4df'],['233013','c4e56b'],['edf0e6','1d2424'],['b0baad','252f2d'],['4e6421','ededeb'],['9d342c','ededeb']]) {
    const a = luminance(text), b = luminance(ground);
    const ratio = (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
    assert.ok(ratio >= 4.5, `${text} on ${ground}: ${ratio.toFixed(2)}`);
  }
});
