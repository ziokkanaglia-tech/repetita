// Backup su file: cosa si esporta e come si controlla un file prima di importarlo.
import { normalize, SCHEMA } from './model.js';
import { isoDay } from './util.js';

export const backupName = (now = Date.now()) => `repetita-backup-${isoDay(now)}.json`;
/** L'allenamento in corso e il timer non entrano nel backup. */
export const exportJSON = state => JSON.stringify({ ...state, active: null, timer: null, app: 'repetita', exported: new Date().toISOString() });

/** Legge un file di backup. Lancia un errore con un messaggio chiaro se non è valido. */
export function parseBackup(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { throw new Error('Il file non è un backup leggibile'); }
  if (!d || typeof d !== 'object' || !Array.isArray(d.workouts) || !Array.isArray(d.exercises)) throw new Error('Il file non è un backup di Repetita');
  if (Number(d.v) > SCHEMA) throw new Error('Backup creato con una versione più nuova dell\'app');
  const state = normalize(d);
  return { state, summary: { workouts: state.workouts.length, routines: state.routines.length, measures: state.body.length } };
}
