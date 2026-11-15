// Test di discipline, catalogo e consigli per disciplina.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, touch } from '../src/core/model.js';
import { DISCIPLINES, EVIDENCE, PRINCIPLES, affinity, disciplineWeights } from '../src/core/disciplines.js';
import { presetExercises, MUSCLES, PATTERNS, EQUIP } from '../src/core/catalog.js';
import * as P from '../src/core/profile.js';
import * as M from '../src/core/metrics.js';
import * as R from '../src/core/recommend.js';
import { DAY } from '../src/core/util.js';

const NOW = new Date('2026-11-15T18:00:00').getTime();
const ids = new Set(presetExercises().map(e => e.id));
const sets = (kg, reps, n = 3) => Array.from({ length: n }, () => ({ t: 'n', kg: String(kg), reps: String(reps) }));
function trained() {
  const s = emptyState();
  for (let i = 0; i < 8; i++) s.workouts.push({ id: 'w' + i, name: 'T', start: NOW - (28 - i * 3.5) * DAY, end: NOW - (28 - i * 3.5) * DAY + 36e5,
    items: [{ exId: 'p-panca-piana-bilanciere', sets: sets(80, 5) }, { exId: 'p-squat', sets: sets(100, 5) }, { exId: 'p-lat-machine', sets: sets(60, 10) }] });
  M.recomputePRs(s);
  return s;
}

test('ogni disciplina è completa e usa solo esercizi e fonti che esistono', () => {
  assert.equal(Object.keys(DISCIPLINES).length, 8);
  for (const [id, d] of Object.entries(DISCIPLINES)) {
    for (const k of ['name', 'tagline', 'about', 'reps', 'goal']) assert.ok(d[k], `${id}.${k}`);
    for (const k of ['reps', 'load', 'rir', 'rest', 'sets', 'freq']) assert.ok(d.params[k], `${id}.params.${k}`);
    assert.ok(P.GOALS[d.goal], `${id}: obiettivo valido`);
    for (const x of [...d.core, ...d.staples]) assert.ok(ids.has(x), `${id}: esercizio inesistente ${x}`);
    assert.ok(d.core.length >= 3, `${id}: almeno 3 fondamentali`);
    for (const k of d.evidence) assert.ok(EVIDENCE[k], `${id}: fonte inesistente ${k}`);
    for (const e of Object.keys(d.equip)) assert.ok(EQUIP.includes(e), `${id}: attrezzo ${e}`);
    for (const p of Object.keys(d.patterns)) assert.ok(PATTERNS[p], `${id}: movimento ${p}`);
  }
  for (const p of PRINCIPLES) for (const k of p.ev) assert.ok(EVIDENCE[k], `principio ${p.t}: fonte ${k}`);
  for (const [k, e] of Object.entries(EVIDENCE)) assert.match(e.url, /^https:\/\//, `fonte ${k}: link`);
});

test('catalogo: esercizi nuovi coerenti, nessun doppione', () => {
  const list = presetExercises();
  assert.equal(new Set(list.map(e => e.id)).size, list.length);
  for (const e of list) { assert.ok(MUSCLES.includes(e.muscle), e.name); assert.ok(PATTERNS[e.pattern], e.name); assert.ok(EQUIP.includes(e.equip), e.name); }
  for (const x of ['p-strappo', 'p-muscle-up', 'p-trazioni-zavorrate', 'p-thruster', 'p-atlas-stone', 'p-front-lever']) assert.ok(ids.has(x), x);
});

test('profilo: discipline ordinate (max 3), esperienza, durata, priorità', () => {
  const p = P.normProfile({ disciplines: ['calisthenics', 'boh', 'calisthenics', 'powerlifting', 'strongman', 'crossfit'], experience: '3', sessionMin: 75, focus: ['Glutei', 'Ali'] });
  assert.deepEqual(p.disciplines, ['calisthenics', 'powerlifting', 'strongman']);
  assert.equal(p.experience, '3'); assert.equal(p.sessionMin, 75); assert.deepEqual(p.focus, ['Glutei']);
  assert.equal(P.normProfile({ sessionMin: 50 }).sessionMin, 0, 'solo durate previste');
  assert.equal(P.defaultReps({ ...P.DEFAULT_PROFILE, disciplines: ['powerlifting'], goal: 'massa' }), '3-5', 'la disciplina principale vince sull\'obiettivo');
  assert.deepEqual(disciplineWeights(['bodybuilding', 'powerlifting']), { bodybuilding: 1, powerlifting: 0.5 });
});

test('affinità: ogni disciplina premia i suoi esercizi', () => {
  const ex = id => presetExercises().find(e => e.id === id);
  assert.ok(affinity(['weightlifting'], ex('p-strappo')) > affinity(['weightlifting'], ex('p-pec-deck')));
  assert.ok(affinity(['calisthenics'], ex('p-front-lever')) > affinity(['calisthenics'], ex('p-leg-press')));
  assert.ok(affinity(['bodybuilding'], ex('p-croci-ai-cavi')) > affinity(['bodybuilding'], ex('p-atlas-stone')));
  assert.ok(affinity(['strongman'], ex('p-yoke')) > affinity(['strongman'], ex('p-curl-ai-cavi')));
  assert.equal(affinity([], ex('p-squat')), 0, 'senza discipline nessun effetto');
});

test('consigli: la disciplina cambia alternative e proposte', () => {
  const s = trained();
  const altNone = R.alternatives(s, 'p-lat-machine', 3, [], NOW).map(a => a.ex.id);
  s.profile.disciplines = ['calisthenics']; touch(s);
  const altCal = R.alternatives(s, 'p-lat-machine', 3, [], NOW);
  assert.equal(altCal[0].ex.id, 'p-trazioni-alla-sbarra', 'calisthenics: prima le trazioni');
  assert.match(altCal[0].why, /calisthenics/);
  assert.notDeepEqual(altCal.map(a => a.ex.id), altNone);
  const sg = R.suggestions(s, NOW).out;
  assert.ok(sg.some(o => o.kind === 'Disciplina' && DISCIPLINES.calisthenics.core.includes(o.ex.id)), 'propone i fondamentali trascurati');
  s.exercises.find(e => e.id === 'p-trazioni-alla-sbarra').dislike = true; touch(s);
  assert.notEqual(R.alternatives(s, 'p-lat-machine', 1, [], NOW)[0].ex.id, 'p-trazioni-alla-sbarra', '«non mi piace» lo fa scendere');
});
