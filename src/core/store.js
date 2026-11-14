// Unico punto in cui lo stato vive e viene salvato.
// - update(): cambia lo stato, salva, avvisa l'interfaccia
// - patch():  cambia lo stato mentre scrivi (salva dopo un attimo, non ridisegna)
// - undo():   annulla l'ultima modifica "annullabile"
// - copie di sicurezza giornaliere, usate in automatico se il salvataggio principale è rovinato
import { normalize, emptyState, touch } from './model.js';
import { isoDay } from './util.js';

const KEY = 'repetita.v2', OLD_KEYS = ['ferro.v2', 'ferro.v1'], SNAP = 'repetita.snap.', KEEP_SNAPS = 3;

export const localAdapter = () => ({
  get: k => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v),
  remove: k => localStorage.removeItem(k), keys: () => Object.keys(localStorage)
});
export const memoryAdapter = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { get: k => (m.has(k) ? m.get(k) : null), set: (k, v) => { m.set(k, v); }, remove: k => { m.delete(k); }, keys: () => [...m.keys()] };
};

let adapter = memoryAdapter(), state = emptyState(), undoSnap = null, lazy = null;
const subs = new Set();
let onError = () => { };
export const info = { recovered: false, migrated: false };

const parse = k => { const raw = adapter.get(k); return raw ? normalize(JSON.parse(raw)) : null; };
const snapKeys = () => adapter.keys().filter(k => k.startsWith(SNAP)).sort();

function read() {
  info.recovered = info.migrated = false;
  try { const s = parse(KEY); if (s) return s; } catch (e) { info.recovered = true; }
  if (!info.recovered) for (const k of OLD_KEYS) { try { const s = parse(k); if (s) { info.migrated = true; return s; } } catch (e) { } }
  for (const k of snapKeys().reverse()) { try { const s = parse(k); if (s) { info.recovered = true; return s; } } catch (e) { } }
  info.recovered = false;
  return emptyState();
}
function write() {
  clearTimeout(lazy); lazy = null;
  try { adapter.set(KEY, JSON.stringify(state)); return true; }
  catch (e) { onError(e); return false; }
}
function snapshot(now) {
  if (!state.workouts.length && !state.routines.length) return;
  const today = SNAP + isoDay(now);
  try {
    if (!adapter.get(today)) adapter.set(today, JSON.stringify({ ...state, active: null, timer: null }));
    snapKeys().slice(0, -KEEP_SNAPS).forEach(k => adapter.remove(k));
  } catch (e) { /* spazio finito: le copie sono un di più */ }
}
const emit = () => subs.forEach(f => f(state));

export function init(a, { now = Date.now(), error } = {}) {
  adapter = a; if (error) onError = error;
  state = read(); undoSnap = null;
  if (info.migrated || info.recovered) write();
  snapshot(now);
  return state;
}
export const getState = () => state;
export const subscribe = f => { subs.add(f); return () => subs.delete(f); };

/** Modifica lo stato. opts.undo = etichetta: la modifica diventa annullabile. */
export function update(fn, { undo, silent } = {}) {
  undoSnap = undo ? { label: undo, json: JSON.stringify(state) } : null;
  const out = fn(state);
  touch(state);
  write();
  if (!silent) emit();
  return out;
}
/** Modifica leggera mentre scrivi in un campo: niente ridisegno, salvataggio dopo 250 ms. */
export function patch(fn) {
  undoSnap = null;
  fn(state); touch(state);
  if (!lazy) lazy = setTimeout(write, 250);
}
/** Salva subito le modifiche in sospeso (quando l'app va in secondo piano). */
export const flush = () => (lazy ? write() : true);
export const canUndo = () => (undoSnap ? undoSnap.label : null);
export function undo() {
  if (!undoSnap) return false;
  state = normalize(JSON.parse(undoSnap.json)); undoSnap = null;
  write(); emit();
  return true;
}
/** Sostituisce tutto lo stato (import di un backup, cancellazione totale). */
export function replace(next) { state = normalize(next); undoSnap = null; write(); emit(); return state; }
