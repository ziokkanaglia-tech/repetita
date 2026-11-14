// Funzioni di servizio pure: numeri, testi, date. Nessuna dipendenza dal browser.
export const DAY = 864e5;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
/** Legge un numero scritto all'italiana ("72,5") o all'inglese. Mai NaN. */
export const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
export const has = v => String(v ?? '').trim() !== '';
export const fmt = (n, d = 1) => Number(n || 0).toLocaleString('it-IT', { maximumFractionDigits: d });
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const clone = o => JSON.parse(JSON.stringify(o));
export const sum = a => a.reduce((x, y) => x + y, 0);
export const mx = a => (a.length ? Math.max(...a) : 0);
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export const dur = ms => { const m = Math.max(0, Math.round(ms / 6e4)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
export const dLong = ts => new Date(ts).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
export const dShort = ts => new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
export const monthLabel = ts => new Date(ts).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
export const isoDay = (ts = Date.now()) => { const d = new Date(ts); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/** Indice del giorno con lunedì = 0. */
export const dayIndex = ts => (new Date(ts).getDay() + 6) % 7;
/** Inizio (lunedì 00:00) della settimana che contiene ts. */
export function weekKey(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - dayIndex(d)); return d.getTime(); }
export function shiftWeek(key, n) { const d = new Date(key); d.setDate(d.getDate() + 7 * n); return d.getTime(); }

export function moveIn(arr, i, d) { const j = i + d; if (i < 0 || j < 0 || j >= arr.length) return false;[arr[i], arr[j]] = [arr[j], arr[i]]; return true; }
