// Forma dei dati e validazione. Qualsiasi cosa entri nell'app (salvataggio, backup importato,
// versione vecchia) passa da normalize(): quello che esce ha sempre la forma giusta.
import { MUSCLES, EQUIP, PATTERNS, TYPES, SET_FIELDS, SET_TYPES, presetExercises } from './catalog.js';
import { uid, has, isoDay } from './util.js';

export const SCHEMA = 2;
export const ACCENTS = {
  blu: ['#3d7bff', '#fff'], verde: ['#22c55e', '#fff'], arancio: ['#ff7a1a', '#fff'],
  viola: ['#8b5cf6', '#fff'], rosso: ['#f43f5e', '#fff'], lime: ['#c6f135', '#14170a']
};
export const DEFAULT_SETTINGS = { rest: 90, rpe: false, sound: true, wake: true, lastBackup: 0, theme: 'auto', accent: 'blu' };

/** Segna che lo stato è cambiato: invalida gli indici calcolati (vedi metrics.js). */
export const touch = state => { state.rev = (state.rev || 0) + 1; return state; };

export const newSet = (t = 'n') => ({ t, done: false });
export const newItem = (exId, rest, sets = 3) => ({ exId, rest, note: '', ss: false, sets: Array.from({ length: sets }, () => newSet()) });
export const newRoutineItem = (exId, rest) => ({ exId, sets: 3, reps: '', rest, note: '' });

const str = (v, d = '') => (typeof v === 'string' ? v : v == null ? d : String(v));
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const arr = v => (Array.isArray(v) ? v : []);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const id = v => (has(v) ? String(v) : uid());

function normSet(s, keepDone) {
  const out = { t: oneOf(s && s.t, Object.keys(SET_TYPES), 'n') };
  for (const f of SET_FIELDS) if (s && has(s[f])) out[f] = String(s[f]).replace(',', '.');
  if (keepDone) out.done = !!(s && s.done);
  return out;
}
function normItem(it, keepDone) {
  const out = {
    exId: str(it && it.exId), note: str(it && it.note), ss: !!(it && it.ss),
    rest: Math.max(0, int(it && it.rest, DEFAULT_SETTINGS.rest)),
    sets: arr(it && it.sets).map(s => normSet(s, keepDone))
  };
  if (it && has(it.target)) out.target = String(it.target);
  return out;
}
function normWorkout(w, active) {
  if (!w || typeof w !== 'object') return null;
  const start = Number(w.start);
  if (!Number.isFinite(start)) return null;
  const out = {
    id: id(w.id), name: str(w.name, 'Allenamento') || 'Allenamento', routineId: w.routineId ? String(w.routineId) : null,
    start, note: str(w.note), items: arr(w.items).map(it => normItem(it, active)).filter(it => it.exId)
  };
  if (active) {
    if (w.editId) { out.editId = String(w.editId); out.end = Math.max(start, Number(w.end) || start); }
    return out;
  }
  out.end = Math.max(start, Number(w.end) || start);
  out.items = out.items.filter(it => it.sets.length);
  out.prs = arr(w.prs).filter(p => p && p.exId && p.k).map(p => ({ exId: String(p.exId), k: String(p.k), v: Number(p.v) || 0 }));
  return out.items.length ? out : null;
}
function normExercise(e) {
  if (!e || !has(e.name)) return null;
  return {
    id: id(e.id), name: String(e.name).trim(), muscle: oneOf(e.muscle, MUSCLES, 'Petto'), type: oneOf(e.type, Object.keys(TYPES), 'kg_reps'),
    pattern: oneOf(e.pattern, Object.keys(PATTERNS), 'altro'), equip: oneOf(e.equip, EQUIP, 'Altro'),
    note: str(e.note), fav: !!e.fav, hidden: !!e.hidden, preset: !!e.preset
  };
}

/** Rende valido uno stato qualsiasi. Non lancia mai errori: scarta quello che non capisce. */
export function normalize(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const exercises = [], seen = new Map();
  for (const e of arr(r.exercises).map(normExercise)) if (e && !seen.has(e.id)) { seen.set(e.id, e); exercises.push(e); }
  for (const p of presetExercises()) {                       // esercizi pronti aggiunti con gli aggiornamenti
    const old = seen.get(p.id);
    if (!old) exercises.push({ note: '', fav: false, hidden: false, ...p });
    else { old.preset = true; if (old.pattern === 'altro') old.pattern = p.pattern; if (old.equip === 'Altro') old.equip = p.equip; }
  }
  const settings = { ...DEFAULT_SETTINGS };
  const s = r.settings && typeof r.settings === 'object' ? r.settings : {};
  settings.rest = Math.max(0, int(s.rest, DEFAULT_SETTINGS.rest));
  for (const k of ['rpe', 'sound', 'wake']) if (typeof s[k] === 'boolean') settings[k] = s[k];
  settings.lastBackup = Number(s.lastBackup) || 0;
  settings.theme = oneOf(s.theme, ['auto', 'light', 'dark'], 'auto');
  settings.accent = oneOf(s.accent, Object.keys(ACCENTS), 'blu');

  const timer = r.timer && Number.isFinite(Number(r.timer.end)) && Number(r.timer.total) > 0
    ? { end: Number(r.timer.end), total: Number(r.timer.total) } : null;

  return {
    v: SCHEMA, rev: 0, exercises, settings, timer,
    routines: arr(r.routines).filter(x => x && typeof x === 'object').map(x => ({
      id: id(x.id), name: str(x.name, 'Scheda') || 'Scheda',
      items: arr(x.items).filter(i => i && has(i.exId)).map(i => ({ exId: String(i.exId), sets: Math.max(1, int(i.sets, 3)), reps: str(i.reps), rest: Math.max(0, int(i.rest, settings.rest)), note: str(i.note) }))
    })),
    workouts: arr(r.workouts).map(w => normWorkout(w, false)).filter(Boolean),
    body: arr(r.body).filter(b => b && typeof b === 'object').map(b => ({
      id: id(b.id), date: /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : isoDay(),
      weight: has(b.weight) ? Number(b.weight) || '' : '', waist: has(b.waist) ? Number(b.waist) || '' : '', fat: has(b.fat) ? Number(b.fat) || '' : ''
    })),
    active: r.active ? normWorkout(r.active, true) : null
  };
}
export const emptyState = () => normalize({});
