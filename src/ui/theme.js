// Applica tema (chiaro/scuro/automatico) e colore principale.
import { ACCENTS } from '../core/model.js';

export function applyTheme(settings) {
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement, [color, ink] = ACCENTS[settings.accent] || ACCENTS.blu;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.setProperty('--acc', color);
  root.style.setProperty('--acc-ink', ink);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = dark ? '#09090b' : '#f2f2f6';
}
export function watchSystemTheme(getSettings) {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(getSettings()));
}
