// Test della logica. Si lanciano con:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, emptyState, touch, SCHEMA } from '../src/core/model.js';
import * as store from '../src/core/store.js';
import * as M from '../src/core/metrics.js';
import * as W from '../src/core/workout.js';
import * as R from '../src/core/recommend.js';
import { parseBackup, exportJSON } from '../src/core/backup.js';
import { num, weekKey, DAY } from '../src/core/util.js';

const NOW = new Date('2026-11-14T18:00:00').getTime();
const PANCA = 'p-panca-piana-bilanciere', LAT = 'p-lat-machine', SQUAT = 'p-squat';
const sets = (kg, reps, n = 3) => Array.from({ length: n }, () => ({ t: 'n', kg: String(kg), reps: String(reps) }));
const wk = (id, daysAgo, items) => ({ id, name: 'Test', start: NOW - daysAgo * DAY, end: NOW - daysAgo * DAY + 36e5, items });
/** Stato con tanto petto, poca schiena, niente femorali. */
function seeded() {
  const s = emptyState();
  for (let i = 0; i < 8; i++) s.workouts.push(wk('w' + i, 28 - i * 3.5, [
    { exId: PANCA, sets: [{ t: 'w', kg: '30', reps: '10' }, ...sets(60 + i * 2.5, 8)] }, { exId: SQUAT, sets: sets(80, 6) },
    ...(i % 4 === 0 ? [{ exId: LAT, sets: sets(50, 10, 2) }] : [])]));
  M.recomputePRs(s);
  return s;
}

test('numeri scritti all\'italiana', () => {
  assert.equal(num('72,5'), 72.5); assert.equal(num(''), 0); assert.equal(num('abc'), 0); assert.equal(num(null), 0);
});

test('normalize: uno stato rovinato diventa valido', () => {
  const s = normalize({ workouts: [null, { start: 'x' }, { start: 5, items: [{ exId: PANCA, sets: [{ kg: '60,5', reps: 8, t: 'zz' }] }, { exId: SQUAT, sets: [] }] }], routines: 'no', settings: { rest: -5, theme: 'rosa', accent: 'x' }, body: [{ date: 'ieri', weight: '70' }] });
  assert.equal(s.v, SCHEMA);
  assert.equal(s.workouts.length, 1);
  assert.equal(s.workouts[0].items.length, 1, 'esercizi senza serie scartati');
  assert.deepEqual(s.workouts[0].items[0].sets[0], { t: 'n', kg: '60.5', reps: '8' });
  assert.deepEqual(s.routines, []);
  assert.equal(s.settings.rest, 0); assert.equal(s.settings.theme, 'auto'); assert.equal(s.settings.accent, 'blu');
  assert.match(s.body[0].date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(s.exercises.length > 70, 'esercizi pronti presenti');
  assert.equal(normalize(null).workouts.length, 0);
});

test('normalize: gli esercizi personali restano, quelli pronti non si duplicano', () => {
  const a = emptyState(); a.exercises.push({ id: 'mio', name: 'Mio esercizio', muscle: 'Petto', type: 'kg_reps' });
  a.exercises.find(e => e.id === PANCA).fav = true;
  const b = normalize(JSON.parse(JSON.stringify(a)));
  assert.equal(b.exercises.length, a.exercises.length);
  assert.ok(b.exercises.find(e => e.id === 'mio'));
  assert.equal(b.exercises.find(e => e.id === PANCA).fav, true);
});

test('1RM stimato, volume e serie', () => {
  assert.equal(M.e1rm({ kg: '100', reps: '1' }), 100);
  assert.ok(Math.abs(M.e1rm({ kg: '60', reps: '10' }) - 80) < 1e-9);
  assert.equal(M.e1rm({ kg: '', reps: '10' }), 0);
  const s = seeded(), w = s.workouts[0];
  assert.equal(M.workoutSets(w), 8, 'il riscaldamento non conta tra le serie');
  assert.equal(M.workoutVolume(s, w), 300 + 60 * 8 * 3 + 80 * 6 * 3 + 50 * 10 * 2);
});

test('record: il primo allenamento non ne ha, i successivi sì', () => {
  const s = seeded(), byId = Object.fromEntries(s.workouts.map(w => [w.id, w]));
  assert.deepEqual(byId.w0.prs, []);
  assert.deepEqual(byId.w1.prs.map(p => p.k).sort(), ['e1rm', 'max']);
  assert.equal(byId.w1.prs.find(p => p.k === 'max').v, 62.5);
  assert.ok(!byId.w1.prs.some(p => p.exId === SQUAT), 'squat sempre uguale: nessun record');
});

test('record ricalcolati quando si elimina un allenamento', () => {
  const s = seeded();
  W.deleteWorkout(s, 'w0');
  assert.deepEqual(s.workouts.find(w => w.id === 'w1').prs, [], 'w1 ora è il primo');
  assert.ok(s.workouts.find(w => w.id === 'w2').prs.length > 0);
});

test('settimane di fila e riepilogo settimanale', () => {
  const s = seeded();
  assert.ok(M.streak(s, NOW) >= 4);
  assert.equal(M.streak(emptyState(), NOW), 0);
  const weeks = M.weekly(s, NOW, 12);
  assert.equal(weeks.length, 12);
  assert.equal(weeks.reduce((n, w) => n + w.count, 0), 8);
  assert.equal(weeks[11].key, weekKey(NOW));
  assert.equal(M.muscleSets(s, 30, NOW)[0][0], 'Petto');
});

test('allenamento: valori suggeriti, spunta, chiusura', () => {
  const s = seeded();
  assert.ok(W.startWorkout(s, { name: 'Push', items: [{ exId: PANCA, rest: 120, note: '', ss: false, sets: [{ t: 'n', done: false }, { t: 'n', done: false }] }], now: NOW }));
  assert.equal(W.startWorkout(s, { name: 'altro' }), false, 'non si avviano due allenamenti');
  const hints = W.rowHints(s, s.active.items[0]);
  assert.equal(hints[0].ph.kg, '77.5'); assert.equal(hints[0].ph.reps, '8'); assert.equal(hints[0].label, '1');
  const r = W.toggleSet(s, 0, 0);
  assert.deepEqual([r.ok, r.done, r.rest], [true, true, 120]);
  assert.equal(s.active.items[0].sets[0].kg, '77.5', 'campo vuoto riempito col valore suggerito');
  W.setField(s, 0, 1, 'kg', '82,5'); W.setField(s, 0, 1, 'reps', '8'); W.toggleSet(s, 0, 1);
  W.addSet(s, 0);
  assert.deepEqual(W.progress(s.active), { tot: 3, done: 2, undone: 1 });
  const out = W.finishWorkout(s, NOW + 30 * 6e4);
  assert.equal(s.active, null);
  assert.equal(out.workout.items[0].sets.length, 2, 'la serie non spuntata non viene salvata');
  assert.ok(!('done' in out.workout.items[0].sets[0]));
  assert.ok(out.workout.prs.some(p => p.k === 'max' && p.v === 82.5));
  assert.equal(out.workout.end - out.workout.start, 30 * 6e4);
});

test('allenamento: serie senza valori non si spunta, vuoto non si salva', () => {
  const s = emptyState();
  W.startWorkout(s, { name: 'Nuovo', now: NOW }); W.addExercises(s, [PANCA]);
  assert.equal(W.toggleSet(s, 0, 0).ok, false);
  assert.deepEqual(W.finishWorkout(s, NOW), { empty: true });
  assert.ok(s.active, 'resta aperto');
});

test('superserie: nessun recupero tra i due esercizi', () => {
  const s = emptyState();
  W.startWorkout(s, { name: 'SS', now: NOW }); W.addExercises(s, [PANCA, LAT]);
  s.active.items[0].ss = true;
  W.setField(s, 0, 0, 'kg', '50'); W.setField(s, 1, 0, 'kg', '40');
  assert.equal(W.toggleSet(s, 0, 0).rest, 0);
  assert.equal(W.toggleSet(s, 1, 0).rest, 90);
});

test('modifica di un allenamento vecchio: stessa data, record aggiornati', () => {
  const s = seeded(), before = s.workouts.find(w => w.id === 'w3');
  assert.ok(W.editWorkout(s, 'w3'));
  W.setField(s, 0, 1, 'kg', '200');
  const out = W.finishWorkout(s, NOW);
  assert.equal(out.edited, true);
  assert.equal(s.workouts.length, 8);
  assert.equal(out.workout.start, before.start); assert.equal(out.workout.end, before.end);
  assert.deepEqual(s.workouts.find(w => w.id === 'w4').prs, [], 'dopo un 200 kg i successivi non sono più record');
});

test('schede: salva, duplica, aggiorna da allenamento', () => {
  const s = emptyState();
  const r = W.saveRoutine(s, { id: null, name: '  ', items: [{ exId: PANCA, sets: '0', reps: ' 8-10 ', rest: '120', note: '' }] });
  assert.equal(r.name, 'Scheda 1'); assert.equal(r.items[0].sets, 1); assert.equal(r.items[0].reps, '8-10');
  assert.equal(W.duplicateRoutine(s, r.id).name, 'Scheda 1 (copia)');
  W.startWorkout(s, { name: r.name, items: W.itemsFromRoutine(s, r), routineId: r.id, now: NOW });
  W.addSet(s, 0); W.addExercises(s, [LAT]);
  for (const [i, j] of [[0, 0], [0, 1], [1, 0]]) { W.setField(s, i, j, 'kg', '50'); W.setField(s, i, j, 'reps', '8'); W.toggleSet(s, i, j); }
  const out = W.finishWorkout(s, NOW + 1e6);
  assert.equal(out.routineChanged, true);
  W.updateRoutineFromWorkout(s, out.workout.id);
  const upd = s.routines.find(x => x.id === r.id);
  assert.deepEqual(upd.items.map(i => [i.exId, i.sets]), [[PANCA, 2], [LAT, 1]]);
  assert.equal(upd.items[0].reps, '8-10', 'l\'obiettivo resta');
});

test('consigli: pochi dati = nessun consiglio; squilibri riconosciuti', () => {
  assert.equal(R.suggestions(emptyState(), NOW).few, true);
  const s = seeded(), { out } = R.suggestions(s, NOW);
  const eq = out.find(o => o.kind === 'Equilibrio' && o.ex.muscle === 'Schiena');
  assert.ok(eq, 'tanto petto e poca schiena → consiglia schiena');
  assert.ok(out.some(o => o.ex.muscle === 'Femorali'), 'femorali mai allenati');
  assert.ok(out.every(o => !o.ex.hidden));
  assert.equal(new Set(out.map(o => o.ex.id)).size, out.length, 'nessun doppione');
});

test('consigli: alternative stesso muscolo, mai l\'esercizio stesso né quelli da evitare', () => {
  const s = seeded(), alt = R.alternatives(s, PANCA, 5, ['p-chest-press'], NOW);
  assert.equal(alt.length, 5);
  assert.ok(alt.every(a => a.ex.muscle === 'Petto' && a.ex.id !== PANCA && a.ex.id !== 'p-chest-press'));
  assert.equal(M.getEx(s, alt[0].ex.id).pattern, 'spinta-o', 'prima lo stesso movimento');
  s.exercises.find(e => e.id === 'p-pec-deck').fav = true; touch(s);
  assert.ok(R.alternatives(s, 'p-croci-ai-cavi', 3, [], NOW)[0].ex.id === 'p-pec-deck', 'i preferiti salgono');
});

test('consigli per una scheda: propone ciò che manca', () => {
  const s = seeded(), out = R.suggestForItems(s, [PANCA], 4, NOW);
  assert.ok(out.length > 0);
  assert.ok(out.every(o => o.ex.id !== PANCA));
  const quad = out.find(o => o.ex.muscle === 'Quadricipiti');
  assert.ok(quad, 'petto e quadricipiti sono sempre abbinati');
  assert.match(quad.why, /abbini quadricipiti a petto \(8 volte\)/, 'il motivo nomina il muscolo giusto');
  // con più muscoli nella scheda, il motivo cita quello davvero abbinato (schiena va con petto, non con addome)
  const two = R.suggestForItems(s, ['p-crunch', PANCA], 6, NOW).find(o => o.ex.muscle === 'Schiena');
  assert.match(two.why, /a petto/);
});

test('salvataggio: persistenza, annulla, recupero da copia di sicurezza', () => {
  const a = store.memoryAdapter();
  store.init(a, { now: NOW });
  store.update(s => { s.workouts.push(wk('x', 1, [{ exId: PANCA, sets: sets(50, 5) }])); });
  assert.equal(JSON.parse(a.get('repetita.v2')).workouts.length, 1);
  store.update(s => { s.workouts = []; }, { undo: 'Allenamento eliminato' });
  assert.equal(store.canUndo(), 'Allenamento eliminato');
  assert.ok(store.undo());
  assert.equal(store.getState().workouts.length, 1);
  assert.equal(store.undo(), false, 'si annulla una volta sola');
  // riavvio: crea la copia del giorno, poi il salvataggio principale si rovina
  store.init(a, { now: NOW });
  assert.ok(a.keys().some(k => k.startsWith('repetita.snap.')));
  a.set('repetita.v2', '{rotto');
  const rec = store.init(a, { now: NOW });
  assert.equal(rec.workouts.length, 1); assert.equal(store.info.recovered, true);
});

test('salvataggio: i dati della versione 1 vengono portati nella nuova', () => {
  const v1 = { v: 1, exercises: [], routines: [{ id: 'r', name: 'Push', items: [{ exId: PANCA, sets: 3, reps: '8', rest: 90, note: '' }] }], workouts: [wk('old', 2, [{ exId: PANCA, sets: sets(60, 8) }])], body: [], active: null, settings: { rest: 120 } };
  const a = store.memoryAdapter({ 'ferro.v1': JSON.stringify(v1) });
  const s = store.init(a, { now: NOW });
  assert.equal(store.info.migrated, true);
  assert.equal(s.workouts.length, 1); assert.equal(s.routines[0].name, 'Push'); assert.equal(s.settings.rest, 120);
  assert.ok(a.get('repetita.v2'));
});

test('backup: andata e ritorno, file sbagliati rifiutati', () => {
  const s = seeded(); s.active = { id: 'a', name: 'x', start: NOW, items: [] };
  const { state, summary } = parseBackup(exportJSON(s));
  assert.equal(summary.workouts, 8); assert.equal(state.active, null);
  assert.throws(() => parseBackup('ciao'), /leggibile/);
  assert.throws(() => parseBackup('{"a":1}'), /Repetita/);
  assert.throws(() => parseBackup(JSON.stringify({ v: 99, workouts: [], exercises: [] })), /più nuova/);
});
