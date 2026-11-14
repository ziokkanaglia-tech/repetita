// Mattoni dell'interfaccia.
// html`...`  costruisce l'HTML rendendo sicuro in automatico ogni valore inserito (nomi, note…).
// on()/onInput() registrano cosa succede al tocco di un elemento con data-a o scrivendo in uno con data-in.
import { esc } from '../core/util.js';

class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
/** Marca una stringa come HTML già sicuro (icone, markup scritto da noi). */
export const raw = s => new Safe(String(s ?? ''));
const out = v => (v == null || v === false || v === true ? '' : Array.isArray(v) ? v.map(out).join('') : v instanceof Safe ? v.s : esc(String(v)));
export const html = (strings, ...vals) => new Safe(strings.reduce((a, s, i) => a + s + (i < vals.length ? out(vals[i]) : ''), ''));
/** Attributi data-* da un oggetto: {i: 2, id: 'x'} → data-i="2" data-id="x" */
export const data = obj => raw(Object.entries(obj || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' '));

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const actions = new Map(), inputs = new Map();
export function on(name, fn) { if (actions.has(name)) throw new Error('Azione registrata due volte: ' + name); actions.set(name, fn); }
export function onInput(name, fn) { if (inputs.has(name)) throw new Error('Campo registrato due volte: ' + name); inputs.set(name, fn); }
export const registered = () => ({ actions: [...actions.keys()], inputs: [...inputs.keys()] });

/** Collega una volta sola tutti gli eventi della pagina alle azioni registrate. */
export function bind(root, { backdrop } = {}) {
  root.addEventListener('click', e => {
    if (backdrop && backdrop(e)) return;
    const el = e.target.closest('[data-a]');
    if (!el) return;
    const fn = actions.get(el.dataset.a);
    if (!fn) { console.error('Azione sconosciuta:', el.dataset.a); return; }
    e.preventDefault();
    Promise.resolve(fn(el.dataset, el, e)).catch(err => console.error(err));
  });
  const onIn = e => {
    const el = e.target.closest('[data-in]');
    const fn = el && inputs.get(el.dataset.in);
    if (fn) fn(el.type === 'checkbox' ? el.checked : el.value, el.dataset, el, e);
  };
  root.addEventListener('input', onIn);
  root.addEventListener('change', onIn);
}
