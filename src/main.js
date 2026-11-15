// Avvio dell'app: carica i dati, collega gli eventi, disegna.
import * as store from './core/store.js';
import { bind, $$ } from './ui/dom.js';
import { mount, render } from './ui/app.js';
import { closeSheet, sheetOpen, toast } from './ui/sheet.js';
import { startClock } from './ui/timer.js';
import { applyTheme, watchSystemTheme } from './ui/theme.js';
import './ui/views/workout.js';
import './ui/views/exercises.js';
import './ui/views/routines.js';
import './ui/views/history.js';
import './ui/views/progress.js';
import './ui/views/settings.js';
import './ui/views/profile.js';
import './ui/views/disciplines.js';

store.init(store.localAdapter(), { error: () => toast('Non riesco a salvare: memoria del telefono piena?', { ms: 4000 }) });
applyTheme(store.getState().settings);
watchSystemTheme(() => store.getState().settings);

bind(document, { backdrop: e => { if (e.target.id === 'sheet') { closeSheet(); return true; } return false; } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheetOpen()) { closeSheet(); return; }
  if (e.key !== 'Enter' || !e.target.matches('.sets input')) return;   // "Avanti" sulla tastiera: campo successivo
  e.preventDefault();
  const all = $$('.sets input'), next = all[all.indexOf(e.target) + 1];
  if (next) next.focus(); else e.target.blur();
});

store.subscribe(render);
mount();
startClock();

if (store.info.recovered) toast('Dati recuperati da una copia di sicurezza', { ms: 4000 });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
