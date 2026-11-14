// Pannelli dal basso, menu, domande di conferma, campi di testo e avvisi.
import { html, data, $, on } from './dom.js';
import { IC } from './icons.js';
import * as store from '../core/store.js';

let onClose = null, askRes = null, toastT = null;

export function sheet(title, body, foot, { closed } = {}) {
  const el = $('#sheet');
  if (!el.hidden) settle();
  onClose = closed || null;
  el.innerHTML = html`<div class="panel" role="dialog" aria-label="${title}"><div class="panel-head"><h2>${title}</h2>
    <button class="icon-btn" data-a="sheet.close" aria-label="Chiudi">${IC.x}</button></div>
    <div class="panel-body">${body}</div>${foot && html`<div class="panel-foot">${foot}</div>`}</div>`;
  el.hidden = false;
}
function settle() {
  const c = onClose, r = askRes; onClose = askRes = null;
  if (c) c();
  if (r) r(null);
}
export function closeSheet() { const el = $('#sheet'); el.hidden = true; el.innerHTML = ''; settle(); }
export const sheetOpen = () => !$('#sheet').hidden;

/** items: [{ l: testo, a: azione, d: {dati}, bad, mark, markColor }] */
export function menu(title, items) {
  sheet(title, html`<div class="menu">${items.map(it => html`<button class="${it.bad ? 'bad' : ''}" data-a="${it.a}" ${data(it.d)}>
    ${it.mark != null && html`<span class="mi" style="${it.markColor ? `color:var(--${it.markColor})` : ''}">${it.mark}</span>`}<span class="grow">${it.l}</span>${it.on && IC.check}</button>`)}</div>`);
}
const buttons = (ok, danger) => html`<div class="grid2"><button class="btn" data-a="ask.no">Annulla</button><button class="btn ${danger ? 'danger' : 'acc'}" data-a="ask.yes">${ok}</button></div>`;
/** Domanda sì/no. Risolve true oppure null. */
export function ask(question, { ok = 'Conferma', danger = true, msg = '' } = {}) {
  return new Promise(res => { sheet(question, msg && html`<div class="ask-msg">${msg}</div>`, buttons(ok, danger)); askRes = res; });
}
/** Chiede un testo. Risolve la stringa oppure null se annullato. */
export function askText(question, { value = '', ph = '' } = {}) {
  return new Promise(res => {
    sheet(question, html`<input id="askIn" value="${value}" placeholder="${ph}" enterkeyhint="done" autocomplete="off">`, buttons('Salva', false));
    askRes = res;
    setTimeout(() => { const i = $('#askIn'); if (i) { i.focus(); i.select(); } }, 80);
  });
}
on('sheet.close', closeSheet);
on('ask.no', closeSheet);
on('ask.yes', () => { const r = askRes, i = $('#askIn'); askRes = null; const v = i ? i.value : true; closeSheet(); if (r) r(v); });

/** Avviso breve in alto. Con undo:true mostra "Annulla" che ripristina l'ultima modifica. */
export function toast(msg, { undo = false, ms } = {}) {
  const el = $('#toast');
  el.innerHTML = html`<span>${msg}</span>${undo && html`<button data-a="toast.undo">Annulla</button>`}`;
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, ms || (undo ? 5000 : 2400));
}
on('toast.undo', () => { $('#toast').hidden = true; if (store.undo()) toast('Ripristinato'); });
