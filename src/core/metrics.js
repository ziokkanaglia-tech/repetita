// Tutti i calcoli sui dati: volume, 1RM stimato, record, serie, andamento settimanale.
// Funzioni pure: ricevono lo stato e restituiscono numeri. Gli indici sono calcolati
// una volta sola per ogni versione dello stato (state.rev) e poi riusati.
import { TYPES } from './catalog.js';
import { touch } from './model.js';
import { num, sum, mx, DAY, weekKey, shiftWeek, dayIndex } from './util.js';

const cache = new WeakMap();
export function index(state) {
  const c = cache.get(state);
  if (c && c.rev === state.rev) return c;
  const exById = new Map(state.exercises.map(e => [e.id, e]));
  const asc = [...state.workouts].sort((a, b) => a.start - b.start);
  const byEx = new Map(), usage = {}, last = {};
  for (const w of asc) for (const it of w.items) {
    if (!byEx.has(it.exId)) byEx.set(it.exId, []);
    byEx.get(it.exId).push({ w, it });
    usage[it.exId] = (usage[it.exId] || 0) + 1;
    last[it.exId] = w.start;
  }
  const out = { rev: state.rev, exById, asc, desc: [...asc].reverse(), byEx, usage, last };
  cache.set(state, out);
  return out;
}

const UNKNOWN = id => ({ id, name: 'Esercizio eliminato', muscle: '', type: 'kg_reps', pattern: 'altro', equip: 'Altro', hidden: true });
export const getEx = (state, id) => index(state).exById.get(id) || UNKNOWN(id);
export const visibleExercises = state => state.exercises.filter(e => !e.hidden);
export const workoutsDesc = state => index(state).desc;
export const colsFor = (ex, settings) => [...TYPES[ex.type].cols, ...(settings.rpe && ex.type !== 'cardio' ? ['rpe'] : [])];

/** Serie che contano: fatte e non di riscaldamento. */
export const work = sets => sets.filter(s => s.done !== false && s.t !== 'w');
/** 1RM stimato con la formula di Epley. */
export function e1rm(s) { const k = num(s.kg), r = num(s.reps); if (!k || !r) return 0; return r === 1 ? k : k * (1 + r / 30); }

/** Metriche disponibili per tipo di esercizio. noPR = non genera record. */
export const METRICS = {
  kg_reps: [
    { k: 'e1rm', l: '1RM stimato', u: 'kg', f: ss => mx(ss.map(e1rm)) },
    { k: 'max', l: 'Peso max', u: 'kg', f: ss => mx(ss.map(s => num(s.kg))) },
    { k: 'vol', l: 'Volume', u: 'kg', f: ss => sum(ss.map(s => num(s.kg) * num(s.reps))), noPR: true },
    { k: 'reps', l: 'Rip max', u: '', f: ss => mx(ss.map(s => num(s.reps))) }
  ],
  reps: [
    { k: 'reps', l: 'Rip max', u: '', f: ss => mx(ss.map(s => num(s.reps))) },
    { k: 'tot', l: 'Rip totali', u: '', f: ss => sum(ss.map(s => num(s.reps))), noPR: true }
  ],
  time: [
    { k: 'sec', l: 'Tempo max', u: 's', f: ss => mx(ss.map(s => num(s.sec))) },
    { k: 'tots', l: 'Tempo totale', u: 's', f: ss => sum(ss.map(s => num(s.sec))), noPR: true }
  ],
  cardio: [
    { k: 'km', l: 'Distanza', u: 'km', f: ss => sum(ss.map(s => num(s.km))) },
    { k: 'mins', l: 'Durata', u: 'min', f: ss => sum(ss.map(s => num(s.min))) }
  ]
};
export const metric = (type, k) => METRICS[type].find(m => m.k === k) || METRICS[type][0];

export const workoutVolume = (state, w) => sum(w.items.map(it =>
  getEx(state, it.exId).type === 'kg_reps' ? sum(it.sets.filter(s => s.done !== false).map(s => num(s.kg) * num(s.reps))) : 0));
export const workoutSets = w => sum(w.items.map(it => work(it.sets).length));

/** Sedute di un esercizio in ordine di data. before/exclude servono per "prima di questo allenamento". */
export function sessions(state, exId, { before = Infinity, exclude } = {}) {
  const list = index(state).byEx.get(exId) || [];
  return before === Infinity && !exclude ? list : list.filter(s => s.w.start < before && s.w.id !== exclude);
}
export function lastSession(state, exId, opts) { const s = sessions(state, exId, opts); return s.length ? s[s.length - 1].it : null; }

/** Record battuti in un allenamento rispetto a tutti quelli precedenti. Il primo in assoluto non conta. */
export function findPRs(state, w) {
  const prs = [];
  for (const it of w.items) {
    const ex = getEx(state, it.exId), prior = sessions(state, it.exId, { before: w.start, exclude: w.id }), ws = work(it.sets);
    if (!prior.length || !ws.length) continue;
    for (const m of METRICS[ex.type]) {
      if (m.noPR) continue;
      const best = mx(prior.map(p => m.f(work(p.it.sets)))), v = m.f(ws);
      if (best > 0 && v > best + 1e-9 && !prs.some(p => p.exId === it.exId && p.k === m.k)) prs.push({ exId: it.exId, k: m.k, v });
    }
  }
  return prs;
}
/** Ricalcola i record dagli allenamenti da `from` in poi (dopo una modifica o una eliminazione). */
export function recomputePRs(state, from = -Infinity) {
  touch(state);
  for (const w of state.workouts) if (w.start >= from) w.prs = findPRs(state, w);
  touch(state);
}

export function records(state, exId) {
  const ex = getEx(state, exId), ss = sessions(state, exId);
  return METRICS[ex.type].map(m => ({ ...m, best: mx(ss.map(s => m.f(work(s.it.sets)))) }));
}
export function series(state, exId, k) {
  const ex = getEx(state, exId), m = metric(ex.type, k);
  return sessions(state, exId).map(s => ({ x: s.w.start, y: m.f(work(s.it.sets)) }));
}
/** Peso migliore sollevato per almeno N ripetizioni. */
export function bestByReps(state, exId, steps = [1, 3, 5, 8, 10, 12, 15]) {
  const all = sessions(state, exId).flatMap(s => work(s.it.sets));
  return steps.map(r => ({ r, kg: mx(all.filter(s => num(s.reps) >= r).map(s => num(s.kg))) })).filter(x => x.kg > 0);
}

/** Settimane consecutive con almeno un allenamento (quella in corso può essere ancora vuota). */
export function streak(state, now = Date.now()) {
  const set = new Set(state.workouts.map(w => weekKey(w.start)));
  let k = weekKey(now), n = 0;
  if (!set.has(k)) k = shiftWeek(k, -1);
  while (set.has(k)) { n++; k = shiftWeek(k, -1); }
  return n;
}
export function thisWeek(state, now = Date.now()) {
  const k = weekKey(now), list = state.workouts.filter(w => weekKey(w.start) === k);
  const target = state.profile ? state.profile.weeklyTarget : 0;
  return { list, target, days: new Set(list.map(w => dayIndex(w.start))), volume: sum(list.map(w => workoutVolume(state, w))), sets: sum(list.map(workoutSets)) };
}
export function weekly(state, now = Date.now(), n = 12) {
  const out = []; let k = weekKey(now);
  for (let i = 0; i < n; i++) { out.unshift({ key: k, count: 0, volume: 0 }); k = shiftWeek(k, -1); }
  const pos = new Map(out.map((o, i) => [o.key, i]));
  for (const w of state.workouts) { const i = pos.get(weekKey(w.start)); if (i != null) { out[i].count++; out[i].volume += workoutVolume(state, w); } }
  return out;
}
/** Serie allenanti per muscolo negli ultimi `days` giorni, dal più allenato. */
export function muscleSets(state, days, now = Date.now()) {
  const since = now - days * DAY, mus = {};
  for (const w of state.workouts) if (w.start >= since) for (const it of w.items) {
    const m = getEx(state, it.exId).muscle; if (m) mus[m] = (mus[m] || 0) + work(it.sets).length;
  }
  return Object.entries(mus).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
}
export function recentPRs(state, n = 8) {
  const out = [];
  for (const w of state.workouts) for (const p of w.prs || []) out.push({ ...p, ts: w.start });
  return out.sort((a, b) => b.ts - a.ts).slice(0, n);
}
export function setText(s, type, short) {
  const f = v => Number(num(v)).toLocaleString('it-IT', { maximumFractionDigits: 1 });
  if (type === 'kg_reps') return short ? `${f(s.kg)}×${s.reps || 0}` : `${f(s.kg)} kg × ${s.reps || 0}`;
  if (type === 'reps') return `${s.reps || 0} rip`;
  if (type === 'time') return `${s.sec || 0} s`;
  return short ? `${f(s.km)} km` : `${f(s.km)} km · ${f(s.min)} min`;
}

/** Numeri di sempre per il profilo. */
export function lifetime(state) {
  const ws = state.workouts;
  return {
    workouts: ws.length,
    hours: sum(ws.map(w => w.end - w.start)) / 36e5,
    tons: sum(ws.map(w => workoutVolume(state, w))) / 1000,
    sets: sum(ws.map(workoutSets)),
    prs: sum(ws.map(w => (w.prs || []).length)),
    since: ws.length ? Math.min(...ws.map(w => w.start)) : null
  };
}
/** I grandi esercizi: miglior 1RM stimato e rapporto col peso corporeo. */
export const MAIN_LIFTS = [['p-squat', 'Squat'], ['p-panca-piana-bilanciere', 'Panca piana'], ['p-stacco-da-terra', 'Stacco da terra'], ['p-military-press', 'Military press']];
export function mainLifts(state, bodyWeight) {
  return MAIN_LIFTS.map(([id, label]) => {
    const best = mx(sessions(state, id).map(s => mx(work(s.it.sets).map(e1rm))));
    return { id, label, e1rm: best, ratio: best && bodyWeight ? best / bodyWeight : 0 };
  });
}
/** Calendario delle ultime `weeks` settimane: per ogni giorno quanti allenamenti. */
export function heatmap(state, weeks = 17, now = Date.now()) {
  const start = shiftWeek(weekKey(now), -(weeks - 1)), count = new Map();
  for (const w of state.workouts) { const d = new Date(w.start); d.setHours(0, 0, 0, 0); count.set(d.getTime(), (count.get(d.getTime()) || 0) + 1); }
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = 0; i < weeks; i++) {
    const col = [];
    for (let j = 0; j < 7; j++) {
      const d = new Date(start); d.setDate(d.getDate() + i * 7 + j);
      const t = d.getTime();
      col.push({ t, n: count.get(t) || 0, future: t > today.getTime() });
    }
    out.push(col);
  }
  return out;
}
