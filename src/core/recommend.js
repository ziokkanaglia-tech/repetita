// Motore dei consigli. Gira sul telefono, senza rete: legge le tue abitudini (esercizi più fatti,
// preferiti, muscoli abbinati, attrezzi usati) e propone alternative ed esercizi nuovi,
// sempre con il motivo. Tutte funzioni pure: stessi dati, stessi consigli.
import { PATTERNS } from './catalog.js';
import { getEx, visibleExercises, index, work } from './metrics.js';
import { sum, DAY } from './util.js';

const OPPOSITES = [['Petto', 'Schiena'], ['Quadricipiti', 'Femorali'], ['Bicipiti', 'Tricipiti']];
const MAJOR = ['Petto', 'Schiena', 'Spalle', 'Quadricipiti', 'Femorali', 'Glutei', 'Bicipiti', 'Tricipiti', 'Addome'];
export const MIN_SETS = 6;   // sotto questa soglia i dati sono troppo pochi per dare consigli

/** Fotografia delle abitudini negli ultimi `days` giorni. */
export function profile(state, days = 60, now = Date.now()) {
  const since = now - days * DAY, cnt = {}, mus = {}, eq = {}, pair = {};
  let total = 0;
  for (const w of state.workouts) {
    if (w.start < since) continue;
    const ms = new Set();
    for (const it of w.items) {
      const ex = getEx(state, it.exId), n = work(it.sets).length;
      if (!n) continue;
      cnt[it.exId] = (cnt[it.exId] || 0) + n;
      mus[ex.muscle] = (mus[ex.muscle] || 0) + n;
      eq[ex.equip] = (eq[ex.equip] || 0) + n;
      total += n; ms.add(ex.muscle);
    }
    for (const a of ms) for (const b of ms) if (a !== b) { pair[a] = pair[a] || {}; pair[a][b] = (pair[a][b] || 0) + 1; }
  }
  const eqTot = sum(Object.values(eq)) || 1;
  return { cnt, mus, eq, pair, total, now, last: index(state).last, eqPref: e => (eq[e] || 0) / eqTot };
}

/** Quanto un esercizio è adatto a te: attrezzi che usi, preferiti, novità, non appena fatto. */
function score(c, P, avoid) {
  if (c.hidden || (avoid && avoid.has(c.id))) return -1;
  let s = 1 + P.eqPref(c.equip) * 3;
  if (c.fav) s += 2.5;
  const last = P.last[c.id];
  if (!last) s += 0.6; else if (P.now - last < 10 * DAY) s -= 1.2;
  return s;
}
const ranked = (list, P, avoid, bonus = () => 0) => list
  .map(ex => ({ ex, s: score(ex, P, avoid) })).filter(x => x.s >= 0)
  .map(x => ({ ex: x.ex, s: x.s + bonus(x.ex) })).sort((a, b) => b.s - a.s || a.ex.name.localeCompare(b.ex.name, 'it'));
const bestFor = (state, muscle, P, avoid, k = 1) => ranked(visibleExercises(state).filter(c => c.muscle === muscle), P, avoid).slice(0, k).map(x => x.ex);

/** Alternative a un esercizio: prima lo stesso movimento con un altro attrezzo, poi stesso muscolo. */
export function alternatives(state, exId, n = 5, avoid = [], now = Date.now()) {
  const ex = getEx(state, exId), P = profile(state, 60, now), av = new Set([exId, ...avoid]);
  const pool = visibleExercises(state).filter(c => c.muscle === ex.muscle && (c.type === 'cardio') === (ex.type === 'cardio'));
  return ranked(pool, P, av, c => (c.pattern === ex.pattern ? 3 : 0)).slice(0, n).map(({ ex: c }) => {
    const same = c.pattern === ex.pattern;
    const why = same ? (c.equip !== ex.equip ? `Stesso movimento, con ${c.equip.toLowerCase()}` : 'Stesso movimento, variante')
      : `Lavora sempre ${ex.muscle.toLowerCase()}, angolo diverso`;
    return { ex: c, why: why + (c.fav ? ' · tra i preferiti' : '') };
  });
}

/** Consigli generali: squilibri, muscoli trascurati, esercizi da provare, varianti. */
export function suggestions(state, now = Date.now()) {
  const P = profile(state, 30, now), out = [];
  if (P.total < MIN_SETS) return { out, few: true };
  const used = new Set(Object.keys(P.cnt));
  const add = (ex, kind, why) => { if (ex && !out.some(o => o.ex.id === ex.id)) out.push({ ex, kind, why }); };

  for (const [a, b] of OPPOSITES) {                         // 1) muscoli opposti sbilanciati
    const x = P.mus[a] || 0, y = P.mus[b] || 0, hi = Math.max(x, y), lo = Math.min(x, y);
    if (hi >= MIN_SETS && lo < hi * 0.5) {
      const low = x < y ? a : b, high = x < y ? b : a;
      add(bestFor(state, low, P, used)[0], 'Equilibrio', `Nell'ultimo mese ${high.toLowerCase()} ${hi} serie, ${low.toLowerCase()} ${lo ? 'solo ' + lo : 'nessuna'}`);
    }
  }
  const trained = MAJOR.map(m => P.mus[m] || 0).filter(v => v > 0).sort((a, b) => a - b);   // 2) muscoli trascurati
  const median = trained.length ? trained[Math.floor(trained.length / 2)] : 0;
  for (const m of MAJOR) {
    const v = P.mus[m] || 0;
    if (median >= MIN_SETS && v < median * 0.25 && !out.some(o => o.ex.muscle === m))
      add(bestFor(state, m, P, used)[0], 'Poco allenato', v ? `Solo ${v} serie di ${m.toLowerCase()} in 30 giorni` : `Nessuna serie di ${m.toLowerCase()} in 30 giorni`);
  }
  const top = Object.entries(P.mus).filter(([m]) => m !== 'Cardio').sort((a, b) => b[1] - a[1]).slice(0, 3);   // 3) novità
  for (const [m] of top) {
    const fresh = ranked(visibleExercises(state).filter(c => c.muscle === m && !P.last[c.id]), P, null, c => P.eqPref(c.equip) * 2)[0];
    if (fresh) add(fresh.ex, 'Da provare', `Alleni spesso ${m.toLowerCase()} e usi ${fresh.ex.equip.toLowerCase()}, non l'hai mai fatto`);
  }
  for (const [id] of Object.entries(P.cnt).sort((a, b) => b[1] - a[1]).slice(0, 2)) {     // 4) varianti dei più fatti
    const alt = alternatives(state, id, 1, [...used], now)[0];
    if (alt) add(alt.ex, 'Variante', `Ogni tanto al posto di ${getEx(state, id).name}: ${alt.why.toLowerCase()}`);
  }
  return { out: out.slice(0, 8), few: false };
}

/** Cosa aggiungere a una scheda o a un allenamento che contiene già questi esercizi. */
export function suggestForItems(state, exIds, n = 4, now = Date.now()) {
  const P = profile(state, 90, now), avoid = new Set(exIds), exs = exIds.map(id => getEx(state, id));
  const ms = [...new Set(exs.map(e => e.muscle).filter(Boolean))], out = [];
  const add = (ex, why) => { if (ex && !out.some(o => o.ex.id === ex.id)) out.push({ ex, why }); };
  if (!ms.length) {
    for (const [id] of Object.entries(P.cnt).sort((a, b) => b[1] - a[1]).slice(0, n)) add(getEx(state, id), 'Tra quelli che fai più spesso');
    return out;
  }
  const co = {};                                            // muscoli che di solito abbini a questi
  for (const m of ms) for (const [b, c] of Object.entries(P.pair[m] || {})) {
    if (ms.includes(b)) continue;
    if (!co[b]) co[b] = { tot: 0, top: 0, withM: m };
    co[b].tot += c;
    if (c > co[b].top) { co[b].top = c; co[b].withM = m; }      // il muscolo con cui lo abbini più spesso
  }
  for (const [m, x] of Object.entries(co).sort((a, b) => b[1].tot - a[1].tot).slice(0, 2))
    add(bestFor(state, m, P, avoid)[0], `Di solito abbini ${m.toLowerCase()} a ${x.withM.toLowerCase()} (${x.top} volte)`);
  for (const m of ms) {                                      // un movimento che qui manca
    if (m === 'Cardio') continue;
    const have = new Set(exs.filter(e => e.muscle === m).map(e => e.pattern));
    const c = ranked(visibleExercises(state).filter(e => e.muscle === m && !have.has(e.pattern)), P, avoid)[0];
    if (c) add(c.ex, `${m}: aggiunge ${PATTERNS[c.ex.pattern].toLowerCase()}, che qui manca`);
  }
  return out.slice(0, n);
}
