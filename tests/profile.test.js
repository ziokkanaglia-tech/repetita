// Test del profilo e di come cambia il resto dell'app.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, emptyState, touch } from '../src/core/model.js';
import * as P from '../src/core/profile.js';
import * as M from '../src/core/metrics.js';
import * as W from '../src/core/workout.js';
import * as R from '../src/core/recommend.js';
import { DAY } from '../src/core/util.js';

const NOW = new Date('2026-11-15T18:00:00').getTime();
const sets = (kg, reps, n = 3) => Array.from({ length: n }, () => ({ t: 'n', kg: String(kg), reps: String(reps) }));
function seeded() {
  const s = emptyState();
  for (let i = 0; i < 8; i++) s.workouts.push({ id: 'w' + i, name: 'T', start: NOW - (28 - i * 3.5) * DAY, end: NOW - (28 - i * 3.5) * DAY + 36e5,
    items: [{ exId: 'p-panca-piana-bilanciere', sets: sets(60 + i * 2.5, 8) }, { exId: 'p-squat', sets: sets(100, 5) }, ...(i % 4 ? [] : [{ exId: 'p-lat-machine', sets: sets(50, 10, 2) }])] });
  M.recomputePRs(s);
  return s;
}

test('profilo: valori sbagliati vengono corretti o scartati', () => {
  const p = P.normProfile({ name: '  Nico  ', height: 999, goal: 'boh', setup: 'luna', weeklyTarget: 12, avoid: ['Petto', 'Ali', 'Petto'], photo: 'javascript:x', birth: '1990-13', sex: 'm' });
  assert.equal(p.name, 'Nico'); assert.equal(p.height, ''); assert.equal(p.goal, ''); assert.equal(p.setup, 'palestra');
  assert.equal(p.weeklyTarget, 7); assert.deepEqual(p.avoid, ['Petto']); assert.equal(p.photo, ''); assert.equal(p.birth, ''); assert.equal(p.sex, 'm');
  assert.deepEqual(P.normProfile(null), P.DEFAULT_PROFILE);
  assert.deepEqual(normalize({}).profile, P.DEFAULT_PROFILE, 'chi non ha mai compilato il profilo parte dai valori base');
});

test('età, peso attuale, BMI', () => {
  assert.equal(P.age('1995-11-16', NOW), 30, 'il compleanno è domani');
  assert.equal(P.age('1995-11-15', NOW), 31);
  assert.equal(P.age('', NOW), '');
  const s = emptyState();
  s.body.push({ id: 'a', date: '2026-10-01', weight: 80 }, { id: 'b', date: '2026-11-10', weight: 78.5 }, { id: 'c', date: '2026-11-12', weight: '', waist: 85 });
  assert.equal(P.currentWeight(s), 78.5, 'il più recente con un peso');
  assert.equal(P.bmi(78.5, 180), 24.2); assert.equal(P.bmiLabel(24.2), 'normopeso'); assert.equal(P.bmi('', 180), '');
});

test('obiettivo: ripetizioni di base nelle schede nuove', () => {
  const s = emptyState();
  assert.equal(W.routineReps(s), '');
  s.profile.goal = 'forza'; assert.equal(W.routineReps(s), '3-5');
  s.profile.goal = 'massa'; assert.equal(W.routineReps(s), '8-12');
});

test('salvare il profilo con un peso nuovo aggiunge una misura, con lo stesso peso no', () => {
  const s = emptyState();
  W.saveProfile(s, { name: 'Nico', goal: 'massa', height: '180' }, { weight: '78,5', today: '2026-11-15' });
  assert.equal(s.profile.name, 'Nico'); assert.equal(s.profile.height, 180);
  assert.equal(s.body.length, 1); assert.equal(s.body[0].weight, 78.5);
  W.saveProfile(s, { bio: 'ancora una' }, { weight: '78.5', today: '2026-11-16' });
  assert.equal(s.body.length, 1, 'peso uguale: nessuna misura doppia');
  assert.equal(s.profile.goal, 'massa', 'i campi non toccati restano');
});

test('consigli: niente muscoli da evitare, niente attrezzi che non hai', () => {
  const s = seeded();
  const before = R.suggestions(s, NOW).out;
  assert.ok(before.some(o => o.ex.muscle === 'Schiena'), 'senza profilo consiglia la schiena');
  s.profile.avoid = ['Schiena']; touch(s);
  const after = R.suggestions(s, NOW).out;
  assert.ok(after.every(o => o.ex.muscle !== 'Schiena'), 'schiena da evitare: mai consigliata');
  s.profile.avoid = []; s.profile.setup = 'casa'; touch(s);
  const home = [...R.suggestions(s, NOW).out, ...R.alternatives(s, 'p-panca-piana-bilanciere', 6, [], NOW)];
  assert.ok(home.length > 0);
  assert.ok(home.every(o => ['Manubri', 'Corpo libero', 'Kettlebell', 'Altro'].includes(o.ex.equip)), 'a casa: niente macchine né bilanciere');
});

test('statistiche di sempre, massimali, obiettivo settimanale, calendario', () => {
  const s = seeded();
  const L = M.lifetime(s);
  assert.equal(L.workouts, 8); assert.equal(Math.round(L.hours), 8); assert.ok(L.tons > 0); assert.ok(L.prs > 0);
  assert.equal(L.since, Math.min(...s.workouts.map(w => w.start)));
  const lifts = M.mainLifts(s, 80);
  assert.equal(lifts.find(l => l.id === 'p-squat').e1rm, 100 * (1 + 5 / 30));
  assert.equal(lifts.find(l => l.id === 'p-stacco-da-terra').e1rm, 0, 'mai fatto');
  assert.ok(Math.abs(lifts.find(l => l.id === 'p-squat').ratio - 100 * (1 + 5 / 30) / 80) < 1e-9);
  s.profile.weeklyTarget = 4; touch(s);
  assert.equal(M.thisWeek(s, NOW).target, 4);
  const hm = M.heatmap(s, 6, NOW);
  assert.equal(hm.length, 6); assert.ok(hm.every(c => c.length === 7));
  assert.equal(hm.flat().reduce((n, d) => n + d.n, 0), s.workouts.filter(w => w.start >= hm[0][0].t).length);
  const wed = new Date('2026-11-11T12:00:00').getTime(), last = M.heatmap(s, 2, wed)[1];
  assert.deepEqual(last.map(d => d.future), [false, false, false, true, true, true, true], 'mercoledì: da giovedì in poi è futuro');
  assert.ok(!M.heatmap(s, 2, NOW)[1].some(d => d.future), 'domenica: la settimana è tutta passata');
});

test('il profilo entra ed esce dal backup', async () => {
  const { exportJSON, parseBackup } = await import('../src/core/backup.js');
  const s = emptyState(); s.profile = P.normProfile({ name: 'Nico', goal: 'forza', avoid: ['Polpacci'] });
  const back = parseBackup(exportJSON(s)).state.profile;
  assert.equal(back.name, 'Nico'); assert.equal(back.goal, 'forza'); assert.deepEqual(back.avoid, ['Polpacci']);
});
