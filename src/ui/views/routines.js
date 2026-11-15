// Schede: elenco ed editor. L'editor lavora su una bozza (ui.draft) salvata solo con "Salva".
import { html, on, onInput } from '../dom.js';
import { view, ui, go, back, navigate, render, atRoot } from '../app.js';
import { IC } from '../icons.js';
import { closeSheet, menu, toast } from '../sheet.js';
import { restOptions, suggList, empty } from '../parts.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { newRoutineItem } from '../../core/model.js';
import { getEx } from '../../core/metrics.js';
import { suggestForItems } from '../../core/recommend.js';
import { clone, moveIn } from '../../core/util.js';

const S = () => store.getState();

view('schede', st => ({
  title: 'Schede', right: html`<button class="btn sm acc" data-a="routine.new">${IC.plus} Nuova</button>`,
  body: st.routines.length ? html`${st.routines.map(r => html`<div class="card">
      <div class="row"><b class="grow t1 big">${r.name}</b><button class="icon-btn" data-a="routine.menu" data-id="${r.id}" aria-label="Opzioni scheda">${IC.more}</button></div>
      <div class="small muted lines">${r.items.length ? r.items.map(i => html`<div>${i.sets}× ${getEx(st, i.exId).name}${i.reps && html` <span class="faint">· ${i.reps}</span>`}</div>`) : 'Nessun esercizio'}</div>
      <div class="grid2 gap"><button class="btn acc" data-a="workout.startRoutine" data-id="${r.id}">${IC.play} Inizia</button><button class="btn" data-a="routine.edit" data-id="${r.id}">Modifica</button></div></div>`)}`
    : empty(IC.list, 'Nessuna scheda', 'Crea le tue schede (Push, Pull, Gambe…) e avvia l\'allenamento con un tocco.')
}));

view('routine', st => {
  const d = ui.draft;
  if (!d) return { title: 'Scheda', body: empty(IC.list, 'Bozza non trovata', 'Torna indietro e riapri la scheda.') };
  const ph = t => (t === 'time' ? '60 s' : t === 'cardio' ? '20 min' : '8-10');
  return {
    title: d.id ? 'Modifica scheda' : 'Nuova scheda', right: html`<button class="btn sm acc" data-a="routine.save">Salva</button>`,
    body: html`<div class="field"><label for="dName">Nome della scheda</label><input id="dName" data-in="draft.name" value="${d.name}" placeholder="Es. Push, Gambe, Full body A" autocomplete="off"></div>
      ${d.items.map((it, i) => { const ex = getEx(st, it.exId); return html`<section class="ex"><div class="ex-title"><h3 class="grow">${ex.name}</h3>
          <button class="icon-btn" data-a="draft.move" data-i="${i}" data-dir="-1" aria-label="Sposta su">${IC.up}</button><button class="icon-btn" data-a="draft.move" data-i="${i}" data-dir="1" aria-label="Sposta giù">${IC.down}</button>
          <button class="icon-btn" data-a="draft.remove" data-i="${i}" aria-label="Rimuovi">${IC.x}</button></div>
        <div class="grid3 inner"><div class="field"><label>Serie</label><input data-in="draft.item" data-i="${i}" data-f="sets" inputmode="numeric" value="${it.sets}"></div>
          <div class="field"><label>Obiettivo</label><input data-in="draft.item" data-i="${i}" data-f="reps" value="${it.reps}" placeholder="${ph(ex.type)}"></div>
          <div class="field"><label>Recupero</label><select data-in="draft.item" data-i="${i}" data-f="rest">${restOptions(it.rest)}</select></div></div>
        <div class="inner"><input data-in="draft.item" data-i="${i}" data-f="note" value="${it.note}" placeholder="Nota (es. sedile 4, presa larga)"></div></section>`; })}
      <button class="btn soft block" data-a="pick.open" data-mode="routine">${IC.plus} Aggiungi esercizi</button>
      ${d.items.length > 0 && html`<div class="sec-title">${IC.spark} Potresti aggiungere</div><div class="card flat">${suggList(suggestForItems(st, d.items.map(i => i.exId)), { action: 'draft.addSuggested' })}</div>`}`
  };
});

function openDraft(draft) { ui.draft = draft; if (atRoot('schede')) go('routine'); else navigate('schede', [{ v: 'routine' }]); }
on('routine.new', () => openDraft(W.newRoutineDraft()));
on('routine.edit', d => { const r = S().routines.find(x => x.id === d.id); if (r) openDraft(clone(r)); });
on('routine.fromWorkout', d => { const w = S().workouts.find(x => x.id === d.id); if (w) openDraft(W.draftFromWorkout(S(), w)); });
on('routine.save', () => { store.update(s => W.saveRoutine(s, ui.draft), { silent: true }); ui.draft = null; back(); toast('Scheda salvata'); });
on('routine.menu', d => {
  const r = S().routines.find(x => x.id === d.id), id = d.id;
  menu(r.name, [{ l: 'Duplica', a: 'routine.duplicate', d: { id } }, { l: 'Sposta su', a: 'routine.move', d: { id, dir: -1 } }, { l: 'Sposta giù', a: 'routine.move', d: { id, dir: 1 } }, { l: 'Elimina scheda', a: 'routine.delete', d: { id }, bad: true }]);
});
on('routine.duplicate', d => { closeSheet(); store.update(s => W.duplicateRoutine(s, d.id)); });
on('routine.move', d => { closeSheet(); store.update(s => W.moveRoutine(s, d.id, +d.dir)); });
on('routine.delete', d => { closeSheet(); store.update(s => W.deleteRoutine(s, d.id), { undo: 'Scheda eliminata' }); toast('Scheda eliminata', { undo: true }); });

onInput('draft.name', v => { if (ui.draft) ui.draft.name = v; });
onInput('draft.item', (v, d) => { if (ui.draft) ui.draft.items[+d.i][d.f] = d.f === 'rest' ? +v : v; });
on('draft.move', d => { moveIn(ui.draft.items, +d.i, +d.dir); render(); });
on('draft.remove', d => { ui.draft.items.splice(+d.i, 1); render(); });
on('draft.addSuggested', d => { ui.draft.items.push(newRoutineItem(d.id, S().settings.rest, W.routineReps(S()))); render(); toast(getEx(S(), d.id).name + ' aggiunto'); });
