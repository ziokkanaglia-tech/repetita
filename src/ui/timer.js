// Timer di recupero, cronometro dell'allenamento, suono e schermo sempre acceso.
// Il timer è salvato nello stato: se chiudi e riapri l'app continua da dove era.
import { html, $, $$, on } from './dom.js';
import { onRender } from './app.js';
import { toast } from './sheet.js';
import * as store from '../core/store.js';
import { mmss, dur } from '../core/util.js';

let audio = null, wakeLock = null;

export function startRest(sec) {
  if (!sec) return;
  store.update(s => { s.timer = { end: Date.now() + sec * 1000, total: sec }; }, { silent: true });
  draw(); tick();
}
export function stopRest() { if (store.getState().timer) store.update(s => { s.timer = null; }, { silent: true }); draw(); }

function draw() {
  const el = $('#rest'), t = store.getState().timer;
  if (!t) { el.hidden = true; el.innerHTML = ''; return; }
  if (el.innerHTML) { el.hidden = false; return; }
  el.innerHTML = html`<div class="grow"><div class="lab">Recupero</div><div class="t" aria-live="off"></div></div>
    <button class="btn sm" data-a="rest.add" data-s="-15">−15</button><button class="btn sm" data-a="rest.add" data-s="15">+15</button>
    <button class="btn sm acc" data-a="rest.skip">Salta</button><div class="bar"></div>`;
  el.hidden = false;
}
export function tick() {
  const st = store.getState(), now = Date.now();
  if (st.active) {
    const ms = now - st.active.start, txt = ms >= 36e5 ? dur(ms) : mmss(ms / 1000);
    $$('[data-elapsed]').forEach(x => { if (x.textContent !== txt) x.textContent = txt; });
  }
  if (st.timer) {
    const left = (st.timer.end - now) / 1000;
    if (left <= 0) {
      const late = left < -5;                        // scaduto mentre l'app era chiusa: niente suono in ritardo
      stopRest(); if (!late) beep(); toast('Recupero finito 💪');
      return;
    }
    draw();
    $('#rest .t').textContent = mmss(left);
    $('#rest .bar').style.width = Math.min(100, left / st.timer.total * 100) + '%';
  }
}
function beep() {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { }
  if (!store.getState().settings.sound || !audio) return;
  [0, 0.22, 0.44].forEach((t, i) => {
    const o = audio.createOscillator(), g = audio.createGain(), s = audio.currentTime + t;
    o.frequency.value = i === 2 ? 1320 : 880; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.5, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.18);
    o.start(s); o.stop(s + 0.2);
  });
}
/** Tiene lo schermo acceso durante l'allenamento (se l'impostazione è attiva). */
export async function syncWake() {
  const st = store.getState(), want = !!st.active && st.settings.wake && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if (!want && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}
export function startClock() {
  setInterval(tick, 500);
  onRender(() => { tick(); syncWake(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); syncWake(); tick(); });
  addEventListener('pagehide', () => store.flush());
  // l'audio si può attivare solo dopo un tocco
  document.addEventListener('pointerdown', () => {
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { }
  }, { passive: true });
}
on('rest.add', d => {
  store.update(s => { if (s.timer) { s.timer.end += Number(d.s) * 1000; s.timer.total = Math.max(s.timer.total, (s.timer.end - Date.now()) / 1000); } }, { silent: true });
  tick();
});
on('rest.skip', stopRest);
