// Catalogo: muscoli, attrezzi, schemi di movimento, tipi di esercizio e gli esercizi già pronti.
import { norm } from './util.js';

export const MUSCLES = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Avambracci', 'Quadricipiti', 'Femorali', 'Glutei', 'Polpacci', 'Addome', 'Cardio'];
export const EQUIP = ['Bilanciere', 'Manubri', 'Cavi', 'Macchina', 'Corpo libero', 'Kettlebell', 'Altro'];
export const PATTERNS = {
  'spinta-o': 'Spinta orizzontale', 'spinta-v': 'Spinta verticale', 'tirata-o': 'Tirata orizzontale', 'tirata-v': 'Tirata verticale',
  squat: 'Squat', hinge: "Piegamento d'anca", affondo: 'Affondi', croci: 'Croci', laterali: 'Alzate', curl: 'Curl',
  estensione: 'Estensioni', 'leg-ext': 'Estensione gamba', 'leg-curl': 'Flessione gamba', polpacci: 'Polpacci', core: 'Core', cardio: 'Cardio', altro: 'Altro'
};
/** Cosa si registra per ogni tipo di esercizio. */
export const TYPES = {
  kg_reps: { label: 'Peso + ripetizioni', cols: ['kg', 'reps'] },
  reps: { label: 'Solo ripetizioni', cols: ['reps'] },
  time: { label: 'Tempo', cols: ['sec'] },
  cardio: { label: 'Cardio (km + minuti)', cols: ['km', 'min'] }
};
export const COL = {
  kg: { l: 'kg', im: 'decimal' }, reps: { l: 'Rip', im: 'numeric' }, sec: { l: 'Sec', im: 'numeric' },
  km: { l: 'km', im: 'decimal' }, min: { l: 'Min', im: 'decimal' }, rpe: { l: 'RPE', im: 'decimal' }
};
export const SET_FIELDS = Object.keys(COL);
export const SET_TYPES = { n: 'Normale', w: 'Riscaldamento', d: 'Drop set', f: 'A cedimento' };
export const REST_STEPS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

// [nome, muscolo, tipo, schema di movimento, attrezzo]
export const PRESETS = [
  ['Panca piana bilanciere', 'Petto', 'kg_reps', 'spinta-o', 'Bilanciere'],
  ['Panca inclinata bilanciere', 'Petto', 'kg_reps', 'spinta-o', 'Bilanciere'],
  ['Panca piana manubri', 'Petto', 'kg_reps', 'spinta-o', 'Manubri'],
  ['Panca inclinata manubri', 'Petto', 'kg_reps', 'spinta-o', 'Manubri'],
  ['Chest press', 'Petto', 'kg_reps', 'spinta-o', 'Macchina'],
  ['Piegamenti', 'Petto', 'reps', 'spinta-o', 'Corpo libero'],
  ['Dip alle parallele', 'Petto', 'reps', 'spinta-o', 'Corpo libero'],
  ['Croci manubri', 'Petto', 'kg_reps', 'croci', 'Manubri'],
  ['Croci ai cavi', 'Petto', 'kg_reps', 'croci', 'Cavi'],
  ['Pec deck', 'Petto', 'kg_reps', 'croci', 'Macchina'],
  ['Stacco da terra', 'Schiena', 'kg_reps', 'hinge', 'Bilanciere'],
  ['Rematore bilanciere', 'Schiena', 'kg_reps', 'tirata-o', 'Bilanciere'],
  ['Rematore manubrio', 'Schiena', 'kg_reps', 'tirata-o', 'Manubri'],
  ['Pulley basso', 'Schiena', 'kg_reps', 'tirata-o', 'Cavi'],
  ['Row machine', 'Schiena', 'kg_reps', 'tirata-o', 'Macchina'],
  ['T-bar row', 'Schiena', 'kg_reps', 'tirata-o', 'Bilanciere'],
  ['Lat machine', 'Schiena', 'kg_reps', 'tirata-v', 'Cavi'],
  ['Lat machine presa stretta', 'Schiena', 'kg_reps', 'tirata-v', 'Cavi'],
  ['Trazioni alla sbarra', 'Schiena', 'reps', 'tirata-v', 'Corpo libero'],
  ['Pullover ai cavi', 'Schiena', 'kg_reps', 'tirata-v', 'Cavi'],
  ['Military press', 'Spalle', 'kg_reps', 'spinta-v', 'Bilanciere'],
  ['Lento avanti manubri', 'Spalle', 'kg_reps', 'spinta-v', 'Manubri'],
  ['Shoulder press', 'Spalle', 'kg_reps', 'spinta-v', 'Macchina'],
  ['Arnold press', 'Spalle', 'kg_reps', 'spinta-v', 'Manubri'],
  ['Alzate laterali manubri', 'Spalle', 'kg_reps', 'laterali', 'Manubri'],
  ['Alzate laterali ai cavi', 'Spalle', 'kg_reps', 'laterali', 'Cavi'],
  ['Alzate posteriori', 'Spalle', 'kg_reps', 'laterali', 'Manubri'],
  ['Reverse pec deck', 'Spalle', 'kg_reps', 'laterali', 'Macchina'],
  ['Face pull', 'Spalle', 'kg_reps', 'tirata-o', 'Cavi'],
  ['Curl bilanciere', 'Bicipiti', 'kg_reps', 'curl', 'Bilanciere'],
  ['Curl manubri', 'Bicipiti', 'kg_reps', 'curl', 'Manubri'],
  ['Curl a martello', 'Bicipiti', 'kg_reps', 'curl', 'Manubri'],
  ['Curl ai cavi', 'Bicipiti', 'kg_reps', 'curl', 'Cavi'],
  ['Curl panca Scott', 'Bicipiti', 'kg_reps', 'curl', 'Bilanciere'],
  ['Curl su panca inclinata', 'Bicipiti', 'kg_reps', 'curl', 'Manubri'],
  ['Pushdown ai cavi', 'Tricipiti', 'kg_reps', 'estensione', 'Cavi'],
  ['Estensioni sopra la testa ai cavi', 'Tricipiti', 'kg_reps', 'estensione', 'Cavi'],
  ['French press', 'Tricipiti', 'kg_reps', 'estensione', 'Bilanciere'],
  ['Estensioni manubrio sopra la testa', 'Tricipiti', 'kg_reps', 'estensione', 'Manubri'],
  ['Panca presa stretta', 'Tricipiti', 'kg_reps', 'spinta-o', 'Bilanciere'],
  ['Dip tra due panche', 'Tricipiti', 'reps', 'estensione', 'Corpo libero'],
  ['Wrist curl', 'Avambracci', 'kg_reps', 'curl', 'Manubri'],
  ['Farmer walk', 'Avambracci', 'time', 'altro', 'Manubri'],
  ['Squat', 'Quadricipiti', 'kg_reps', 'squat', 'Bilanciere'],
  ['Front squat', 'Quadricipiti', 'kg_reps', 'squat', 'Bilanciere'],
  ['Goblet squat', 'Quadricipiti', 'kg_reps', 'squat', 'Manubri'],
  ['Hack squat', 'Quadricipiti', 'kg_reps', 'squat', 'Macchina'],
  ['Leg press', 'Quadricipiti', 'kg_reps', 'squat', 'Macchina'],
  ['Leg extension', 'Quadricipiti', 'kg_reps', 'leg-ext', 'Macchina'],
  ['Affondi manubri', 'Quadricipiti', 'kg_reps', 'affondo', 'Manubri'],
  ['Bulgarian split squat', 'Quadricipiti', 'kg_reps', 'affondo', 'Manubri'],
  ['Step up', 'Quadricipiti', 'kg_reps', 'affondo', 'Manubri'],
  ['Stacco rumeno', 'Femorali', 'kg_reps', 'hinge', 'Bilanciere'],
  ['Stacco rumeno manubri', 'Femorali', 'kg_reps', 'hinge', 'Manubri'],
  ['Good morning', 'Femorali', 'kg_reps', 'hinge', 'Bilanciere'],
  ['Leg curl sdraiato', 'Femorali', 'kg_reps', 'leg-curl', 'Macchina'],
  ['Leg curl seduto', 'Femorali', 'kg_reps', 'leg-curl', 'Macchina'],
  ['Hip thrust', 'Glutei', 'kg_reps', 'hinge', 'Bilanciere'],
  ['Glute bridge', 'Glutei', 'reps', 'hinge', 'Corpo libero'],
  ['Abductor machine', 'Glutei', 'kg_reps', 'altro', 'Macchina'],
  ['Kickback ai cavi', 'Glutei', 'kg_reps', 'hinge', 'Cavi'],
  ['Calf in piedi', 'Polpacci', 'kg_reps', 'polpacci', 'Macchina'],
  ['Calf seduto', 'Polpacci', 'kg_reps', 'polpacci', 'Macchina'],
  ['Calf alla leg press', 'Polpacci', 'kg_reps', 'polpacci', 'Macchina'],
  ['Crunch', 'Addome', 'reps', 'core', 'Corpo libero'],
  ['Crunch ai cavi', 'Addome', 'kg_reps', 'core', 'Cavi'],
  ['Plank', 'Addome', 'time', 'core', 'Corpo libero'],
  ['Leg raise alla sbarra', 'Addome', 'reps', 'core', 'Corpo libero'],
  ['Ab wheel', 'Addome', 'reps', 'core', 'Altro'],
  ['Russian twist', 'Addome', 'reps', 'core', 'Corpo libero'],
  ['Corsa', 'Cardio', 'cardio', 'cardio', 'Altro'],
  ['Tapis roulant', 'Cardio', 'cardio', 'cardio', 'Macchina'],
  ['Camminata in salita', 'Cardio', 'cardio', 'cardio', 'Macchina'],
  ['Cyclette', 'Cardio', 'cardio', 'cardio', 'Macchina'],
  ['Ellittica', 'Cardio', 'cardio', 'cardio', 'Macchina'],
  ['Vogatore', 'Cardio', 'cardio', 'cardio', 'Macchina'],
  ['Corda', 'Cardio', 'time', 'cardio', 'Altro']
];

const slug = s => 'p-' + norm(s).replace(/[^a-z0-9]+/g, '-');
export const presetExercises = () => PRESETS.map(([name, muscle, type, pattern, equip]) => ({ id: slug(name), name, muscle, type, pattern, equip, preset: true }));
