// Operazioni sull'allenamento in corso, sulle schede e sullo storico.
// Ogni funzione modifica lo stato che riceve e non sa nulla dell'interfaccia:
// si usa dentro store.update() e si prova con i test.
import { TYPES } from './catalog.js';
import { newSet, newItem, newRoutineItem, touch } from './model.js';
import { getEx, lastSession, recomputePRs, work } from './metrics.js';
import { uid, has, clone, moveIn } from './util.js';

const restOf = (state, it) => it.rest ?? state.settings.rest;

export function startWorkout(state, { name, items = [], routineId = null, now = Date.now() }) {
  if (state.active) return false;
  state.active = { id: uid(), name, routineId, start: now, note: '', items };
  state.timer = null;
  return true;
}
export const itemsFromRoutine = (state, r) => r.items.map(ri => ({
  ...newItem(ri.exId, ri.rest ?? state.settings.rest, Math.max(1, parseInt(ri.sets, 10) || 1)), note: ri.note || '', target: ri.reps || ''
}));
export const itemsFromWorkout = (state, w) => w.items.map(it => ({
  exId: it.exId, rest: restOf(state, it), note: it.note || '', ss: !!it.ss, sets: it.sets.map(s => newSet(s.t || 'n'))
}));

/** Per ogni serie: cosa avevi fatto la volta scorsa (prev) e cosa suggerire nei campi vuoti (ph). */
export function rowHints(state, item) {
  const a = state.active, ex = getEx(state, item.exId);
  const prevIt = lastSession(state, item.exId, { before: a.start, exclude: a.editId });
  const prevWork = prevIt ? prevIt.sets.filter(s => s.t !== 'w') : [], prevWarm = prevIt ? prevIt.sets.filter(s => s.t === 'w') : [];
  const target = has(item.target) && ex.type !== 'cardio' ? (String(item.target).match(/\d+/) || [''])[0] : '';
  let wi = 0, ni = 0, n = 0;
  return item.sets.map(s => {
    const prev = (s.t === 'w' ? prevWarm[wi++] : prevWork[ni++]) || null;
    if (s.t !== 'w') n++;
    const ph = {};
    for (const c of TYPES[ex.type].cols) ph[c] = prev && has(prev[c]) ? prev[c] : (c === 'reps' ? target : '');
    return { prev, ph, label: s.t === 'w' ? 'W' : s.t === 'd' ? 'D' : s.t === 'f' ? 'F' : String(n) };
  });
}

/** Spunta o toglie la spunta a una serie. Se i campi sono vuoti usa i valori suggeriti. */
export function toggleSet(state, i, j) {
  const it = state.active.items[i], s = it.sets[j], ex = getEx(state, it.exId);
  if (s.done) { s.done = false; return { ok: true, done: false, rest: 0 }; }
  const { ph } = rowHints(state, it)[j], cols = TYPES[ex.type].cols;
  const filled = {};
  for (const c of cols) filled[c] = has(s[c]) ? s[c] : ph[c];
  if (cols.every(c => !has(filled[c]))) return { ok: false, done: false, rest: 0 };
  Object.assign(s, Object.fromEntries(Object.entries(filled).filter(([, v]) => has(v))));
  s.done = true;
  const linked = it.ss && state.active.items[i + 1];       // in superserie si passa subito all'esercizio dopo
  return { ok: true, done: true, rest: linked ? 0 : restOf(state, it) };
}
export function setField(state, i, j, field, value) { state.active.items[i].sets[j][field] = String(value).replace(',', '.'); }
export function addSet(state, i) { const it = state.active.items[i], last = it.sets[it.sets.length - 1]; it.sets.push(newSet(last && last.t !== 'w' ? last.t : 'n')); }
export function removeSet(state, i, j) { state.active.items[i].sets.splice(j, 1); }
export function setType(state, i, j, t) { state.active.items[i].sets[j].t = t; }
export function addExercises(state, ids) { for (const id of ids) state.active.items.push(newItem(id, state.settings.rest)); }
export function replaceExercise(state, i, exId) { const it = state.active.items[i]; it.exId = exId; delete it.target; it.sets.forEach(s => { s.done = false; }); }
export function removeItem(state, i) { state.active.items.splice(i, 1); }
export function moveItem(state, i, d) { return moveIn(state.active.items, i, d); }

export const progress = a => { const tot = a.items.reduce((n, it) => n + it.sets.length, 0), done = a.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0); return { tot, done, undone: tot - done }; };

/** Chiude l'allenamento: tiene solo le serie spuntate, lo mette nello storico, ricalcola i record. */
export function finishWorkout(state, now = Date.now()) {
  const a = state.active;
  const items = a.items.map(it => ({ ...it, sets: it.sets.filter(s => s.done) })).filter(it => it.sets.length);
  if (!items.length) return { empty: true };
  const edited = !!a.editId;
  const w = {
    id: a.editId || a.id, name: a.name, routineId: a.routineId || null, start: a.start, end: edited ? a.end : Math.max(now, a.start), note: a.note || '', prs: [],
    items: items.map(it => ({ exId: it.exId, note: it.note || '', rest: it.rest, ss: !!it.ss, sets: it.sets.map(({ done, ...s }) => s) }))
  };
  const k = state.workouts.findIndex(x => x.id === w.id);
  if (k >= 0) state.workouts[k] = w; else state.workouts.push(w);
  state.active = null; state.timer = null;
  recomputePRs(state, w.start);
  const r = !edited && w.routineId && state.routines.find(x => x.id === w.routineId);
  const shape = list => list.map(x => x.exId + ':' + x.n).join();
  const routineChanged = !!r && shape(r.items.map(i => ({ exId: i.exId, n: i.sets }))) !== shape(w.items.map(i => ({ exId: i.exId, n: i.sets.filter(s => s.t !== 'w').length })));
  return { workout: state.workouts.find(x => x.id === w.id), edited, routineChanged };
}
export function discardWorkout(state) { const id = state.active && state.active.editId; state.active = null; state.timer = null; return id || null; }
/** Riapre un allenamento già fatto per correggerlo. */
export function editWorkout(state, id) {
  const w = state.workouts.find(x => x.id === id);
  if (!w || state.active) return false;
  const a = clone(w); delete a.prs;
  a.items.forEach(it => it.sets.forEach(s => { s.done = true; }));
  state.active = { ...a, editId: w.id };
  return true;
}
export function deleteWorkout(state, id) {
  const w = state.workouts.find(x => x.id === id); if (!w) return false;
  state.workouts = state.workouts.filter(x => x.id !== id);
  recomputePRs(state, w.start);
  return true;
}

// ---- schede
export const newRoutineDraft = () => ({ id: null, name: '', items: [] });
export const draftFromWorkout = (state, w) => ({
  id: null, name: w.name, items: w.items.map(it => ({ ...newRoutineItem(it.exId, restOf(state, it)), sets: work(it.sets).length || 1, note: it.note || '' }))
});
export function saveRoutine(state, draft) {
  const r = { id: draft.id || uid(), name: (draft.name || '').trim() || `Scheda ${state.routines.length + 1}`,
    items: draft.items.map(i => ({ exId: i.exId, sets: Math.max(1, parseInt(i.sets, 10) || 1), reps: String(i.reps || '').trim(), rest: Math.max(0, parseInt(i.rest, 10) || 0), note: String(i.note || '').trim() })) };
  const k = state.routines.findIndex(x => x.id === r.id);
  if (k >= 0) state.routines[k] = r; else state.routines.push(r);
  return r;
}
export function duplicateRoutine(state, id) { const r = state.routines.find(x => x.id === id); if (!r) return null; const c = { ...clone(r), id: uid(), name: r.name + ' (copia)' }; state.routines.push(c); return c; }
export function deleteRoutine(state, id) { state.routines = state.routines.filter(r => r.id !== id); }
export function moveRoutine(state, id, d) { return moveIn(state.routines, state.routines.findIndex(r => r.id === id), d); }
/** Aggiorna la scheda con gli esercizi e le serie realmente fatti nell'allenamento. */
export function updateRoutineFromWorkout(state, workoutId) {
  const w = state.workouts.find(x => x.id === workoutId), r = w && state.routines.find(x => x.id === w.routineId);
  if (!r) return false;
  r.items = w.items.map(it => { const old = r.items.find(o => o.exId === it.exId); return { exId: it.exId, sets: it.sets.filter(s => s.t !== 'w').length || 1, reps: old ? old.reps : '', rest: restOf(state, it), note: old ? old.note : (it.note || '') }; });
  return true;
}

// ---- esercizi e misure
export function saveExercise(state, id, data) {
  const clean = { name: String(data.name).trim(), muscle: data.muscle, type: data.type, equip: data.equip, pattern: data.pattern, note: String(data.note || '').trim() };
  if (id) { Object.assign(state.exercises.find(e => e.id === id), clean); touch(state); return id; }
  const nid = uid(); state.exercises.push({ id: nid, ...clean, fav: false, hidden: false, preset: false }); touch(state); return nid;
}
export function toggleFav(state, id) { const e = state.exercises.find(x => x.id === id); if (!e) return false; e.fav = !e.fav; return e.fav; }
export function hideExercise(state, id) { const e = state.exercises.find(x => x.id === id); if (e) e.hidden = true; }
export function addMeasure(state, m) { state.body.push({ id: uid(), ...m }); }
export function deleteMeasure(state, id) { state.body = state.body.filter(b => b.id !== id); }
