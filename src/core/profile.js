// Il tuo profilo: chi sei, cosa vuoi ottenere, dove ti alleni, cosa evitare.
// Qui solo dati e regole pure; le statistiche "di sempre" stanno in metrics.js.
import { MUSCLES } from './catalog.js';
import { has, num } from './util.js';
import { DISCIPLINES } from './disciplines.js';

export const GOALS = {
  forza: { l: 'Forza', reps: '3-5', d: 'Carichi alti, poche ripetizioni' },
  massa: { l: 'Massa muscolare', reps: '8-12', d: 'Ipertrofia, volume medio-alto' },
  definizione: { l: 'Definizione', reps: '12-15', d: 'Più ripetizioni, recuperi brevi' },
  resistenza: { l: 'Resistenza', reps: '15-20', d: 'Tante ripetizioni, carichi leggeri' },
  forma: { l: 'Stare in forma', reps: '10-12', d: 'Un po\' di tutto, con costanza' }
};
export const LEVELS = { principiante: 'Principiante', intermedio: 'Intermedio', avanzato: 'Avanzato' };
export const SETUPS = {
  palestra: { l: 'Palestra completa', equip: null },
  casa: { l: 'A casa con manubri', equip: ['Manubri', 'Corpo libero', 'Kettlebell', 'Altro'] },
  corpo: { l: 'Solo corpo libero', equip: ['Corpo libero'] }
};
export const SEXES = { m: 'Uomo', f: 'Donna', x: 'Preferisco non dirlo' };
export const EXPERIENCE = { '0': 'Meno di 1 anno', '1': '1-3 anni', '3': '3-5 anni', '5': 'Più di 5 anni' };
export const SESSION_MIN = [30, 45, 60, 75, 90, 120];
export const DEFAULT_PROFILE = { name: '', photo: '', bio: '', sex: '', birth: '', height: '', goal: '', level: '', weeklyTarget: 0, setup: 'palestra', avoid: [], notes: '', disciplines: [], experience: '', sessionMin: 0, focus: [] };

const oneOf = (v, obj) => (Object.prototype.hasOwnProperty.call(obj, v) ? v : '');
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const PHOTO_MAX = 400000;   // ~300 KB: una foto 256x256 ci sta abbondantemente

export function normProfile(p) {
  const r = p && typeof p === 'object' ? p : {};
  const h = num(r.height), wt = parseInt(r.weeklyTarget, 10);
  const photo = typeof r.photo === 'string' && r.photo.startsWith('data:image/') && r.photo.length <= PHOTO_MAX ? r.photo : '';
  return {
    name: str(r.name, 40), photo, bio: str(r.bio, 80), sex: oneOf(r.sex, SEXES),
    birth: /^\d{4}-\d{2}-\d{2}$/.test(r.birth) ? r.birth : '',
    height: h >= 100 && h <= 250 ? h : '',
    goal: oneOf(r.goal, GOALS), level: oneOf(r.level, LEVELS),
    weeklyTarget: Number.isFinite(wt) ? Math.min(7, Math.max(0, wt)) : DEFAULT_PROFILE.weeklyTarget,
    setup: oneOf(r.setup, SETUPS) || 'palestra',
    avoid: [...new Set((Array.isArray(r.avoid) ? r.avoid : []).filter(m => MUSCLES.includes(m)))],
    notes: str(r.notes, 300),
    disciplines: [...new Set((Array.isArray(r.disciplines) ? r.disciplines : []).filter(d => DISCIPLINES[d]))].slice(0, 3),
    experience: oneOf(r.experience, EXPERIENCE),
    sessionMin: SESSION_MIN.includes(Number(r.sessionMin)) ? Number(r.sessionMin) : 0,
    focus: [...new Set((Array.isArray(r.focus) ? r.focus : []).filter(m => MUSCLES.includes(m)))].slice(0, 4)
  };
}

/** Età compiuta alla data `now`. Vuoto se la data di nascita manca. */
export function age(birth, now = Date.now()) {
  if (!birth) return '';
  const b = new Date(birth + 'T00:00:00'), n = new Date(now);
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a >= 0 && a < 120 ? a : '';
}
/** Peso più recente tra le misure del corpo. */
export function currentWeight(state) {
  const list = state.body.filter(b => has(b.weight)).sort((a, b) => b.date.localeCompare(a.date));
  return list.length ? num(list[0].weight) : '';
}
export function bmi(weight, heightCm) {
  const w = num(weight), h = num(heightCm) / 100;
  return w > 0 && h > 0 ? Math.round(w / (h * h) * 10) / 10 : '';
}
export function bmiLabel(v) {
  if (!v) return '';
  return v < 18.5 ? 'sottopeso' : v < 25 ? 'normopeso' : v < 30 ? 'sovrappeso' : 'obesità';
}
/** Ripetizioni consigliate per il tuo obiettivo (usate come base nelle schede nuove). */
export const defaultReps = p => {
  if (!p) return '';
  const d = DISCIPLINES[p.disciplines[0]];
  return d ? d.reps : GOALS[p.goal] ? GOALS[p.goal].reps : '';
};
/** Recupero di base suggerito dalla disciplina principale (secondi), 0 se nessuna. */
export const defaultRest = p => { const d = p && DISCIPLINES[p.disciplines[0]]; return d ? d.rest : 0; };
/** true se l'esercizio non fa per te: muscolo da evitare o attrezzo che non hai. */
export function excluded(p, ex) {
  if (!p || !ex) return false;
  if (p.avoid.includes(ex.muscle)) return true;
  const eq = SETUPS[p.setup] && SETUPS[p.setup].equip;
  return !!eq && !eq.includes(ex.equip);
}
/** Quanto è completo il profilo, da 0 a 1 (serve a invitarti a completarlo). */
export function completeness(p) {
  const fields = [p.name, p.birth, p.height, p.goal, p.level, p.sex, p.disciplines.length > 0, p.experience];
  return fields.filter(Boolean).length / fields.length;
}
