// Guscio dell'app: schede in basso, pagine impilate, intestazione, ridisegno.
// La pila di pagine segue la cronologia del browser, così il gesto "indietro" dell'iPhone funziona.
import { html, raw, $, $$, on } from './dom.js';
import { IC } from './icons.js';
import { getState } from '../core/store.js';

export const TABS = [['allena', 'Allena', IC.dumbbell], ['schede', 'Schede', IC.list], ['storico', 'Storico', IC.clock], ['progressi', 'Progressi', IC.chart], ['altro', 'Altro', IC.more]];
/** Stato temporaneo dell'interfaccia (non salvato): filtri, bozze, scelte in corso. */
export const ui = { prog: 'gen', mrange: 30, metric: {}, draft: null, pick: null, libq: '', libm: '', just: null };
const nav = { tab: 'allena', stack: [] };
const views = new Map(), afterRender = [];
let pending = null;

export const view = (name, fn) => views.set(name, fn);
export const onRender = fn => afterRender.push(fn);
export const current = () => nav.stack[nav.stack.length - 1] || { v: nav.tab };
export const atRoot = tab => nav.tab === tab && !nav.stack.length;

export function go(v, params = {}) { nav.stack.push({ v, ...params }); history.pushState({ d: nav.stack.length }, ''); render(); scrollTo(0, 0); }
export function back() { if (nav.stack.length) history.back(); }
/** Cambia scheda e, se serve, apre subito delle pagine sopra. */
export function navigate(tab, stack = []) {
  const apply = () => {
    nav.tab = tab; nav.stack = [];
    for (const s of stack) { nav.stack.push(s); history.pushState({ d: nav.stack.length }, ''); }
    render(); scrollTo(0, 0);
  };
  if (nav.stack.length) { pending = apply; history.go(-nav.stack.length); } else apply();
}
function onPop(e) {
  const d = (e.state && e.state.d) || 0;
  nav.stack.length = Math.min(nav.stack.length, d);
  if (pending) { const p = pending; pending = null; p(); } else render();
}

export function render() {
  const st = getState(), c = current(), fn = views.get(c.v);
  const r = (fn ? fn(st, c) : null) || { title: 'Pagina non trovata', body: '' };
  const top = $('#top'), sub = nav.stack.length > 0;
  top.className = sub ? 'sub-page' : '';
  top.innerHTML = html`${sub && html`<button class="icon-btn back" data-a="nav.back" aria-label="Indietro">${IC.back}</button>`}
    <div class="grow"><h1>${r.title}</h1>${r.sub && html`<div class="sub">${r.sub}</div>`}</div>${r.right}
    ${r.progress != null && html`<div id="progress"><i style="width:${r.progress}%"></i></div>`}`;
  const a = st.active, onWorkout = atRoot('allena');
  const resume = a && !onWorkout && html`<button class="routine resume" data-a="nav.resume"><div class="grow">
      <div class="tiny live-lab">● ${a.editId ? 'MODIFICA IN CORSO' : 'IN CORSO'}</div><div class="t1">${a.name}</div>
      <div class="small muted num"><span data-elapsed></span></div></div><span class="btn sm ok">Riprendi</span></button>`;
  $('#view').innerHTML = html`${resume}${r.body}`;
  $$('#tabs [data-t]').forEach(b => { b.classList.toggle('on', b.dataset.t === nav.tab); b.classList.toggle('live', b.dataset.t === 'allena' && !!a); });
  afterRender.forEach(f => f(st));
}

export function mount() {
  $('#tabs').innerHTML = html`${TABS.map(([k, l, ic]) => html`<button data-a="nav.tab" data-t="${k}">${ic}<span>${l}</span></button>`)}`;
  history.replaceState({ d: 0 }, '');
  addEventListener('popstate', onPop);
  render();
}

on('nav.tab', d => navigate(d.t));
on('nav.back', back);
on('nav.resume', () => navigate('allena'));
export { raw };
