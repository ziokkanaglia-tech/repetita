// Progressi: panoramica, esercizi, consigli, misure del corpo.
import { html, on, $ } from '../dom.js';
import { view, ui, navigate, render } from '../app.js';
import { IC } from '../icons.js';
import { toast } from '../sheet.js';
import { lineChart, barChart, hbars } from '../charts.js';
import { stats, seg, suggList, empty } from '../parts.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { getEx, index, visibleExercises, weekly, thisWeek, streak, muscleSets, recentPRs, records, metric } from '../../core/metrics.js';
import { suggestions, alternatives } from '../../core/recommend.js';
import { fmt, dShort, dLong, isoDay, has, num } from '../../core/util.js';

const TABS = [['gen', 'Panoramica'], ['ex', 'Esercizi'], ['sugg', 'Consigli'], ['body', 'Corpo']];
view('progressi', st => ({
  title: 'Progressi',
  body: html`<div class="seg-wrap">${seg('prog.tab', TABS, ui.prog)}</div>${ui.prog === 'gen' ? overview(st) : ui.prog === 'ex' ? exercises(st) : ui.prog === 'sugg' ? advice(st) : body(st)}`
}));
on('prog.tab', d => { ui.prog = d.k; render(); scrollTo(0, 0); });
on('prog.range', d => { ui.mrange = +d.k; render(); });
on('prog.openSugg', () => { ui.prog = 'sugg'; navigate('progressi'); });

function overview(st) {
  if (!st.workouts.length) return empty(IC.chart, 'Nessun dato', 'Fai il primo allenamento e qui vedrai grafici e record.');
  const now = Date.now(), weeks = weekly(st, now, 12), labels = weeks.map(w => dShort(w.key)), prs = recentPRs(st), mus = muscleSets(st, ui.mrange, now);
  return html`${stats([[st.workouts.length, 'Allenamenti'], [thisWeek(st, now).list.length, 'Questa settimana'], [streak(st, now), 'Settimane di fila']])}
    <div class="sec-title">Allenamenti per settimana</div><div class="card">${barChart(weeks.map(w => w.count), labels)}</div>
    <div class="sec-title">Volume per settimana</div><div class="card">${barChart(weeks.map(w => Math.round(w.volume)), labels, { compact: true })}<div class="tiny muted center">kg sollevati</div></div>
    <div class="sec-title">Serie per muscolo</div><div class="card">${seg('prog.range', [[7, '7 giorni'], [30, '30 giorni'], [90, '90 giorni']], ui.mrange)}
      <div class="gap">${mus.length ? hbars(mus) : html`<div class="muted small">Nessuna serie in questo periodo.</div>`}</div></div>
    ${prs.length > 0 && html`<div class="sec-title">Record recenti</div><div class="card flat">${prs.map(p => { const ex = getEx(st, p.exId), m = metric(ex.type, p.k);
      return html`<button class="list-item" data-a="ex.open" data-id="${ex.id}"><span class="pr">${IC.trophy}</span><div class="grow"><div class="t1">${ex.name}</div><div class="small muted">${m.l} ${fmt(p.v)} ${m.u}</div></div><span class="small muted">${dShort(p.ts)}</span></button>`; })}</div>`}`;
}
function exercises(st) {
  const { usage, last } = index(st), list = Object.keys(usage).map(id => getEx(st, id)).sort((a, b) => last[b.id] - last[a.id]);
  if (!list.length) return empty(IC.dumbbell, 'Nessun esercizio fatto', 'Dopo i primi allenamenti trovi qui i progressi di ogni esercizio.');
  return html`<div class="card flat">${list.map(ex => { const r = records(st, ex.id)[0];
    return html`<button class="list-item" data-a="ex.open" data-id="${ex.id}"><div class="badge">${usage[ex.id]}</div><div class="grow"><div class="t1">${ex.fav && '★ '}${ex.name}</div>
      <div class="small muted">${r.l} ${fmt(r.best)} ${r.u} · ultimo ${dShort(last[ex.id])}</div></div>${IC.chev}</button>`; })}</div>`;
}
function advice(st) {
  const sg = suggestions(st), favs = visibleExercises(st).filter(e => e.fav).slice(0, 4);
  const intro = html`<div class="card small muted">I consigli nascono dai tuoi dati: esercizi che fai più spesso, preferiti (★), muscoli che abbini e attrezzi che usi. Più ti alleni, più diventano precisi.</div>`;
  if (sg.few) return html`${intro}${empty(IC.spark, "Servono un po' di allenamenti", 'Registra qualche seduta e qui troverai cosa aggiungere e cosa provare.')}`;
  return html`${intro}<div class="card flat">${suggList(sg.out)}</div><div class="sec-title">Alternative ai tuoi preferiti</div>
    ${favs.length ? favs.map(f => html`<div class="card flat"><div class="fav-head">★ ${f.name}</div>${suggList(alternatives(st, f.id, 3))}</div>`)
      : html`<div class="card small muted">Segna come preferiti gli esercizi che ti piacciono (★ nella pagina dell'esercizio) e qui vedrai le loro alternative.</div>`}`;
}
function body(st) {
  const b = [...st.body].sort((x, y) => x.date.localeCompare(y.date));
  const pts = b.filter(x => has(x.weight)).map(x => ({ x: new Date(x.date).getTime(), y: num(x.weight) }));
  return html`<div class="card"><div class="grid2"><div class="field"><label for="bDate">Data</label><input type="date" id="bDate" value="${isoDay()}"></div>
      <div class="field"><label for="bW">Peso (kg)</label><input id="bW" inputmode="decimal" placeholder="75,5"></div></div>
    <div class="grid2"><div class="field"><label for="bWaist">Vita (cm)</label><input id="bWaist" inputmode="decimal" placeholder="facoltativo"></div>
      <div class="field"><label for="bFat">Grasso (%)</label><input id="bFat" inputmode="decimal" placeholder="facoltativo"></div></div>
    <button class="btn acc block" data-a="body.save">Salva misura</button></div>
    <div class="sec-title">Peso corporeo</div><div class="card">${lineChart(pts, { unit: 'kg' })}</div>
    ${b.length > 0 && html`<div class="card flat">${[...b].reverse().map(x => html`<div class="list-item num"><div class="grow"><div class="t1">${has(x.weight) ? fmt(x.weight) + ' kg' : '—'}</div>
      <div class="small muted">${dLong(new Date(x.date))}${has(x.waist) ? ` · vita ${fmt(x.waist)} cm` : ''}${has(x.fat) ? ` · grasso ${fmt(x.fat)}%` : ''}</div></div>
      <button class="icon-btn" data-a="body.delete" data-id="${x.id}" aria-label="Elimina misura">${IC.x}</button></div>`)}</div>`}`;
}
on('body.save', () => {
  const w = $('#bW').value, wa = $('#bWaist').value, f = $('#bFat').value;
  if (!has(w) && !has(wa) && !has(f)) { toast('Scrivi almeno una misura'); return; }
  store.update(s => W.addMeasure(s, { date: $('#bDate').value || isoDay(), weight: has(w) ? num(w) : '', waist: has(wa) ? num(wa) : '', fat: has(f) ? num(f) : '' }));
  toast('Misura salvata');
});
on('body.delete', d => { store.update(s => W.deleteMeasure(s, d.id), { undo: 'Misura eliminata' }); toast('Misura eliminata', { undo: true }); });
