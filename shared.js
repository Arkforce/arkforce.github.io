import arrowUpRight from '@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw';
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import arrowLeft from '@phosphor-icons/core/assets/regular/arrow-left.svg?raw';
import play from '@phosphor-icons/core/assets/regular/play.svg?raw';
import pause from '@phosphor-icons/core/assets/regular/pause.svg?raw';
import map from '@phosphor-icons/core/assets/regular/map-trifold.svg?raw';
import sun from '@phosphor-icons/core/assets/regular/sun.svg?raw';
import moon from '@phosphor-icons/core/assets/regular/moon.svg?raw';

const icons = { 'arrow-up-right': arrowUpRight, 'arrow-right': arrowRight, 'arrow-left': arrowLeft, play, pause, 'map-trifold': map, sun, moon };
export function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(node => {
    // Local, trusted library assets only; no request data enters this markup.
    if (icons[node.dataset.icon]) node.innerHTML = icons[node.dataset.icon];
    node.setAttribute('aria-hidden', 'true');
    node.querySelector('svg')?.setAttribute('focusable', 'false');
  });
}
renderIcons();
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;
try {
  const saved = localStorage.getItem('atlas-theme');
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
} catch { /* System preference remains the default when storage is unavailable. */ }
const themeButton = document.createElement('button');
themeButton.type = 'button'; themeButton.className = 'theme-toggle';
const themeIcon = document.createElement('span'); themeButton.append(themeIcon);
document.querySelector('.site-header nav')?.append(themeButton);
function refreshTheme() {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.title = themeButton.getAttribute('aria-label');
  themeIcon.dataset.icon = dark ? 'sun' : 'moon'; renderIcons(themeButton);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1d2424' : '#ededeb');
  document.dispatchEvent(new Event('themechange'));
}
themeButton.addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('atlas-theme', root.dataset.theme); } catch { /* Theme still works in this document. */ }
  refreshTheme();
});
systemTheme.addEventListener('change', refreshTheme);
refreshTheme();
