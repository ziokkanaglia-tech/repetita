// Pezzi di interfaccia riusati in più schermate.
import { html, data } from './dom.js';
import { IC } from './icons.js';
import { REST_STEPS } from '../core/catalog.js';
import { getEx, workoutVolume, workoutSets, work } from '../core/metrics.js';
import { mmss, dLong, dur, fmt } from '../core/util.js';

export const restText = s => (s ? mmss(s) : 'off');
export const restOptions = v => html`${REST_STEPS.map(s => html`<option value="${s}" ${Number(v) === s ? 'selected' : ''}>${restText(s)}</option>`)}`;
export const badge = (ex, sel) => html`<div class="badge ${sel != null ? 'sel' : ''}">${sel != null ? sel : (ex.muscle ? ex.muscle.slice(0, 2) : ex.name[0])}</div>`;
export const empty = (icon, title, text) => html`<div class="empty"><div class="ico">${icon}</div><b>${title}</b>${text}</div>`;
export const stats = list => html`<div class="stats">${list.map(([v, l]) => html`<div class="stat"><b>${v}</b><span>${l}</span></div>`)}</div>`;
export const seg = (action, options, value, extra) => html`<div class="seg">${options.map(([k, l]) => html`<button class="${String(value) === String(k) ? 'on' : ''}" data-a="${action}" data-k="${k}" ${data(extra)}>${l}</button>`)}</div>`;
export const chips = (action, options, value) => html`<div class="chips">${options.map(m => html`<button class="chip ${value === m ? 'on' : ''}" data-a="${action}" data-m="${m}">${m || 'Tutti'}</button>`)}</div>`;

/** Elenco di consigli. action: azione del pulsante (se manca, il tocco apre l'esercizio). */
export function suggList(list, { action, label = 'Aggiungi', extra } = {}) {
  if (!list.length) return html`<div class="muted small pad">Niente da suggerire per ora.</div>`;
  return html`${list.map(o => html`<div class="list-item" ${!action && data({ a: 'ex.open', id: o.ex.id })}>${badge(o.ex)}
    <div class="grow"><div class="t1">${o.ex.name} ${o.kind && html`<span class="chip k-${o.kind.split(' ')[0]}">${o.kind}</span>`}</div><div class="small muted">${o.why}</div></div>
    ${action ? html`<button class="btn sm" data-a="${action}" data-id="${o.ex.id}" ${data(extra)}>${label}</button>` : IC.chev}</div>`)}`;
}

export function workoutCard(st, w) {
  const prs = (w.prs || []).length;
  return html`<button class="card tap" data-a="history.open" data-id="${w.id}">
    <div class="row"><b class="grow t1">${w.name}</b>${prs > 0 && html`<span class="pr">${IC.trophy}${prs}</span>`}</div>
    <div class="small muted">${dLong(w.start)} · ${dur(w.end - w.start)} · ${fmt(workoutVolume(st, w), 0)} kg · ${workoutSets(w)} serie</div>
    <div class="small lines">${w.items.slice(0, 5).map(it => html`<div>${work(it.sets).length}× ${getEx(st, it.exId).name}</div>`)}
      ${w.items.length > 5 && html`<div class="muted">+ altri ${w.items.length - 5}</div>`}</div></button>`;
}
