// Esercizi: scheda di dettaglio con grafici, elenco, creazione/modifica e la finestra per sceglierli.
import { html, on, onInput, $, $$ } from '../dom.js';
import { view, ui, go, back, render } from '../app.js';
import { IC } from '../icons.js';
import { sheet, closeSheet, menu, toast } from '../sheet.js';
import { lineChart } from '../charts.js';
import { badge, suggList, stats, seg, chips, empty } from '../parts.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { MUSCLES, EQUIP, PATTERNS, TYPES } from '../../core/catalog.js';
import { newRoutineItem } from '../../core/model.js';
import { getEx, visibleExercises, index, sessions, records, series, bestByReps, metric, METRICS, setText } from '../../core/metrics.js';
import { alternatives } from '../../core/recommend.js';
import { fmt, norm, dLong } from '../../core/util.js';

const S = () => store.getState();
const filter = (st, q, m) => { const n = norm(q); return visibleExercises(st).filter(e => (!m || e.muscle === m) && (!n || norm(e.name).includes(n))); };
const byName = (a, b) => a.name.localeCompare(b.name, 'it');

// ---- dettaglio
view('exercise', (st, c) => {
  const ex = getEx(st, c.id), ss = sessions(st, ex.id), m = metric(ex.type, ui.metric[ex.id]);
  const reps = ex.type === 'kg_reps' ? bestByReps(st, ex.id) : [];
  const body = html`<div class="ex-meta top"><span class="chip">${ex.muscle || '—'}</span><span class="chip">${ex.equip}</span><span class="chip">${PATTERNS[ex.pattern]}</span></div>
    ${ex.note && html`<div class="ex-note">${ex.note}</div>`}
    ${ss.length ? html`
      <div class="card">${seg('ex.metric', METRICS[ex.type].map(x => [x.k, x.l]), m.k, { id: ex.id })}<div class="gap">${lineChart(series(st, ex.id, m.k), { unit: m.u })}</div></div>
      <div class="sec-title">Record</div>${stats([...records(st, ex.id).map(r => [fmt(r.best), r.l + (r.u ? ' ' + r.u : '')]), [ss.length, 'Sedute']])}
      ${reps.length > 0 && html`<div class="sec-title">Peso migliore per ripetizioni</div><div class="card flat">${reps.map(x => html`<div class="list-item num"><span class="grow">${x.r} ${x.r === 1 ? 'ripetizione' : 'ripetizioni'}</span><b>${fmt(x.kg)} kg</b></div>`)}</div>`}
      <div class="sec-title">Storico</div><div class="card flat">${[...ss].reverse().slice(0, 20).map(s => html`<button class="list-item" data-a="history.open" data-id="${s.w.id}"><div class="grow">
        <div class="small muted">${dLong(s.w.start)}</div><div class="num">${s.it.sets.filter(x => x.t !== 'w').map(x => setText(x, ex.type, true)).join(' · ')}</div></div>${IC.chev}</button>`)}</div>`
      : empty(IC.chart, 'Non ancora fatto', 'Quando lo registri in un allenamento, qui trovi grafico e record.')}
    ${!ex.hidden && html`<div class="sec-title">${IC.spark} Alternative</div><div class="card flat">${suggList(alternatives(st, ex.id, 4))}</div>`}`;
  return { title: ex.name, body, right: !ex.hidden && html`<button class="icon-btn" data-a="ex.fav" data-id="${ex.id}" aria-label="Preferito">${IC.star(ex.fav)}</button><button class="icon-btn" data-a="ex.menu" data-id="${ex.id}" aria-label="Opzioni">${IC.more}</button>` };
});
on('ex.open', d => { closeSheet(); go('exercise', { id: d.id }); });
on('ex.metric', d => { ui.metric[d.id] = d.k; render(); });
on('ex.fav', d => { const fav = store.update(s => W.toggleFav(s, d.id)); toast(fav ? 'Aggiunto ai preferiti' : 'Tolto dai preferiti'); });
on('ex.menu', d => menu(getEx(S(), d.id).name, [{ l: 'Modifica esercizio', a: 'ex.edit', d: { id: d.id } }, { l: 'Elimina esercizio', a: 'ex.hide', d: { id: d.id }, bad: true }]));
on('ex.hide', d => { closeSheet(); store.update(s => W.hideExercise(s, d.id), { undo: 'Esercizio eliminato', silent: true }); back(); toast("Esercizio eliminato dall'elenco", { undo: true }); });

// ---- elenco
const libRows = st => {
  const u = index(st).usage, list = filter(st, ui.libq, ui.libm).sort(byName);
  return list.length ? html`${list.map(e => html`<button class="list-item" data-a="ex.open" data-id="${e.id}">${badge(e)}<div class="grow"><div class="t1">${e.fav && '★ '}${e.name}</div>
    <div class="small muted">${e.muscle} · ${e.equip}${u[e.id] ? ` · ${u[e.id]} volte` : ''}${e.preset ? '' : ' · tuo'}</div></div>${IC.chev}</button>`)}` : html`<div class="muted small pad">Nessun esercizio trovato.</div>`;
};
view('library', st => ({
  title: 'Esercizi', right: html`<button class="btn sm acc" data-a="ex.new">${IC.plus} Nuovo</button>`,
  body: html`<input data-in="lib.q" type="search" placeholder="Cerca tra ${visibleExercises(st).length} esercizi" value="${ui.libq}" autocomplete="off">
    <div class="gap">${chips('lib.muscle', ['', ...MUSCLES], ui.libm)}</div><div class="card flat gap" id="libList">${libRows(st)}</div>`
}));
on('lib.open', () => go('library'));
on('lib.muscle', d => { ui.libm = d.m; render(); });
onInput('lib.q', v => { ui.libq = v; const el = $('#libList'); if (el) el.innerHTML = libRows(S()); });

// ---- crea / modifica
function exForm(id, name = '') {
  const from = ui.pickBack || ui.pick;
  const e = id ? getEx(S(), id) : { name, muscle: (from && from.m) || 'Petto', type: 'kg_reps', equip: 'Manubri', pattern: 'altro', note: '' };
  const opts = (list, v) => list.map(([k, l]) => html`<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`);
  sheet(id ? 'Modifica esercizio' : 'Nuovo esercizio', html`
    <div class="field"><label for="fName">Nome</label><input id="fName" value="${e.name}" placeholder="Es. Panca su macchina" autocomplete="off"></div>
    <div class="grid2"><div class="field"><label for="fMuscle">Muscolo principale</label><select id="fMuscle">${opts(MUSCLES.map(m => [m, m]), e.muscle)}</select></div>
      <div class="field"><label for="fEquip">Attrezzo</label><select id="fEquip">${opts(EQUIP.map(m => [m, m]), e.equip)}</select></div></div>
    <div class="grid2"><div class="field"><label for="fType">Cosa registri</label><select id="fType">${opts(Object.entries(TYPES).map(([k, t]) => [k, t.label]), e.type)}</select></div>
      <div class="field"><label for="fPattern">Movimento</label><select id="fPattern">${opts(Object.entries(PATTERNS), e.pattern)}</select></div></div>
    <div class="field"><label for="fNote">Nota (facoltativa)</label><input id="fNote" value="${e.note || ''}" placeholder="Es. regolazione sedile, presa"></div>
    <div class="small muted">Muscolo, attrezzo e movimento servono ai consigli per trovarti le alternative giuste.</div>`,
    html`<button class="btn acc block" data-a="ex.save" data-id="${id || ''}">Salva</button>`, { closed: () => { ui.pickBack = null; } });
}
on('ex.new', () => exForm(null));
on('ex.edit', d => exForm(d.id));
on('ex.save', d => {
  const name = $('#fName').value.trim();
  if (!name) { toast("Dai un nome all'esercizio"); return; }
  const form = { name, muscle: $('#fMuscle').value, type: $('#fType').value, equip: $('#fEquip').value, pattern: $('#fPattern').value, note: $('#fNote').value };
  const backTo = ui.pickBack;
  const id = store.update(s => W.saveExercise(s, d.id || null, form));
  if (backTo) { ui.pick = backTo; if (backTo.mode !== 'replace' && !backTo.sel.includes(id)) backTo.sel.push(id); drawPicker(); }
  else closeSheet();
  toast('Esercizio salvato');
});

// ---- finestra di scelta (aggiungi all'allenamento, alla scheda, oppure sostituisci)
function drawPicker() {
  const p = ui.pick;
  sheet(p.mode === 'replace' ? 'Sostituisci esercizio' : 'Aggiungi esercizi', html`
    <input data-in="pick.q" type="search" placeholder="Cerca esercizio" value="${p.q}" autocomplete="off">
    <div class="gap">${chips('pick.muscle', ['', ...MUSCLES], p.m)}</div><div id="pickList" class="gap"></div>
    <button class="btn block gap" data-a="pick.new">${IC.plus} Crea nuovo esercizio</button>`,
    p.mode !== 'replace' && html`<button class="btn acc block" data-a="pick.done" id="pickBtn">Aggiungi</button>`,
    { closed: () => { if (ui.pick === p) ui.pick = null; } });
  drawPickList();
}
function drawPickList() {
  const p = ui.pick, st = S(), u = index(st).usage;
  const list = filter(st, p.q, p.m).sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (u[b.id] || 0) - (u[a.id] || 0) || byName(a, b));
  $('#pickList').innerHTML = list.length ? html`${list.map(e => { const k = p.sel.indexOf(e.id); return html`<button class="list-item" data-a="pick.toggle" data-id="${e.id}">${badge(e, k >= 0 ? k + 1 : null)}
    <div class="grow"><div class="t1">${e.fav && '★ '}${e.name}</div><div class="small muted">${e.muscle} · ${e.equip}${u[e.id] ? ` · ${u[e.id]} volte` : ''}</div></div></button>`; })}`
    : html`<div class="muted small pad">Nessun esercizio trovato. Puoi crearlo qui sotto.</div>`;
  const b = $('#pickBtn');
  if (b) b.textContent = p.sel.length ? `Aggiungi ${p.sel.length} ${p.sel.length === 1 ? 'esercizio' : 'esercizi'}` : 'Aggiungi';
}
on('pick.open', d => { ui.pick = { mode: d.mode, i: d.i, sel: [], q: '', m: '' }; drawPicker(); });
on('pick.muscle', d => { ui.pick.m = d.m; $$('#sheet .chips .chip').forEach(c => c.classList.toggle('on', c.dataset.m === d.m)); drawPickList(); });
onInput('pick.q', v => { if (ui.pick) { ui.pick.q = v; drawPickList(); } });
on('pick.toggle', d => {
  const p = ui.pick;
  if (p.mode === 'replace') { closeSheet(); store.update(s => W.replaceExercise(s, +p.i, d.id), { undo: 'Esercizio sostituito' }); toast('Esercizio sostituito', { undo: true }); return; }
  const k = p.sel.indexOf(d.id);
  if (k >= 0) p.sel.splice(k, 1); else p.sel.push(d.id);
  drawPickList();
});
on('pick.done', () => {
  const p = ui.pick;
  if (!p.sel.length) { toast('Seleziona almeno un esercizio'); return; }
  const ids = [...p.sel];
  closeSheet();
  if (p.mode === 'routine') { ids.forEach(id => ui.draft.items.push(newRoutineItem(id, S().settings.rest))); render(); }
  else store.update(s => W.addExercises(s, ids));
});
on('pick.new', () => { const p = ui.pick; ui.pickBack = p; exForm(null, p.q); });
