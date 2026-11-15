// Test di discipline, consigli per disciplina e coach IA (senza chiamare l'API).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, normalize, touch } from '../src/core/model.js';
import { DISCIPLINES, EVIDENCE, PRINCIPLES, affinity, disciplineWeights } from '../src/core/disciplines.js';
import { presetExercises, MUSCLES, PATTERNS, EQUIP } from '../src/core/catalog.js';
import * as P from '../src/core/profile.js';
import * as M from '../src/core/metrics.js';
import * as R from '../src/core/recommend.js';
import * as C from '../src/core/coach.js';
import { exportJSON, parseBackup } from '../src/core/backup.js';
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

test('coach: istruzioni stabili (per la cache), dati utente separati e senza foto', () => {
  const s = trained();
  s.profile = P.normProfile({ name: 'Nico', disciplines: ['powerbuilding'], avoid: ['Polpacci'], photo: 'data:image/jpeg;base64,AAAA', notes: 'spalla dx delicata' });
  s.body.push({ id: 'b', date: '2026-11-10', weight: 80 });
  const sys1 = C.systemPrompt(s), sys2 = C.systemPrompt(s);
  assert.equal(sys1, sys2, 'stesso testo a ogni richiesta');
  assert.ok(!sys1.includes('Nico'), 'nessun dato personale nella parte in cache');
  for (const d of Object.values(DISCIPLINES)) assert.ok(sys1.includes(d.name));
  assert.ok(sys1.includes('p-strappo |'), 'contiene il catalogo con gli id');
  const ctx = C.athleteContext(s, NOW);
  assert.match(ctx, /Powerbuilding/); assert.match(ctx, /EVITARE: Polpacci/); assert.match(ctx, /spalla dx delicata/);
  assert.match(ctx, /Panca piana/); assert.match(ctx, /80 kg/);
  assert.ok(!ctx.includes('base64'), 'la foto non viene mai inviata');
});

test('coach: la scheda proposta viene controllata prima di salvarla', () => {
  const s = emptyState(); s.profile.avoid = ['Polpacci'];
  const out = C.validateProposal({ nome: '  Gambe forza  ', motivazione: 'Perché sì', esercizi: [
    { id: 'p-squat', serie: 5, ripetizioni: '5', recupero_sec: 180, nota: 'RPE 8' },
    { id: 'p-inventato', serie: 3, ripetizioni: '10', recupero_sec: 60, nota: '' },
    { id: 'p-calf-in-piedi', serie: 4, ripetizioni: '12', recupero_sec: 60, nota: '' },
    { id: 'p-leg-press', serie: 99, ripetizioni: '10-12', recupero_sec: -5, nota: '' }] }, s);
  assert.equal(out.name, 'Gambe forza');
  assert.deepEqual(out.items.map(i => i.exId), ['p-squat', 'p-leg-press']);
  assert.equal(out.items[1].sets, 10); assert.equal(out.items[1].rest, 0);
  assert.equal(out.dropped.length, 2);
  assert.deepEqual(C.validateProposal(null, s).items, []);
});

test('coach: costi, modelli, chat nel backup ma mai la chiave', () => {
  assert.ok(Math.abs(C.costOf({ input_tokens: 1e6, output_tokens: 1e6 }, 'claude-opus-5-5') - 24) < 1e-9);
  assert.ok(Math.abs(C.costOf({ cache_read_input_tokens: 1e6 }, 'claude-sonnet-5-5') - 0.1) < 1e-9);
  assert.ok(C.costOf({ cache_creation_input_tokens: 1e6 }, 'claude-opus-5-5') === 5);
  const s = emptyState();
  assert.equal(s.settings.aiModel, 'claude-opus-5-5');
  assert.equal(normalize({ settings: { aiModel: 'gpt' } }).settings.aiModel, 'claude-opus-5-5');
  s.coach.messages.push({ role: 'user', content: 'ciao' }, { role: 'assistant', content: [{ type: 'text', text: 'Ciao!' }], cost: 0.02 });
  s.coach.spent = 0.02;
  const back = parseBackup(exportJSON(s)).state;
  assert.equal(back.coach.messages.length, 2); assert.equal(back.coach.spent, 0.02);
  assert.ok(!exportJSON(s).includes('sk-ant'), 'la chiave non è mai nello stato');
  assert.equal(normalize({ coach: { messages: [{ role: 'assistant', content: 'x' }, { role: 'user', content: 'y' }, { role: 'hacker', content: 'z' }] } }).coach.messages.length, 1, 'la chat parte sempre dall\'utente');
});

test('coach: riconosce proposte e risposte tecniche', () => {
  const content = [{ type: 'text', text: 'Ecco' }, { type: 'tool_use', id: 't1', name: 'proponi_scheda', input: {} }];
  assert.equal(C.messageText(content), 'Ecco');
  assert.equal(C.proposalsIn(content).length, 1);
  assert.ok(C.isToolResultOnly({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] }));
  assert.ok(!C.isToolResultOnly({ role: 'user', content: 'ciao' }));
  assert.equal(C.ROUTINE_TOOL.input_schema.additionalProperties, false);
  assert.deepEqual(C.ROUTINE_TOOL.input_schema.properties.esercizi.items.required.sort(), ['id', 'nota', 'recupero_sec', 'ripetizioni', 'serie']);
});
