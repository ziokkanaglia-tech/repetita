// Storico: elenco per mese e dettaglio di un allenamento.
import { html, on } from '../dom.js';
import { view, go, back, navigate } from '../app.js';
import { IC } from '../icons.js';
import { closeSheet, toast } from '../sheet.js';
import { workoutCard, stats, empty } from '../parts.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { SET_TYPES } from '../../core/catalog.js';
import { getEx, workoutsDesc, workoutVolume, workoutSets, setText, e1rm, metric } from '../../core/metrics.js';
import { fmt, dur, dLong, monthLabel, has } from '../../core/util.js';

const S = () => store.getState();

view('storico', st => {
  const ws = workoutsDesc(st);
  if (!ws.length) return { title: 'Storico', body: empty(IC.clock, 'Ancora niente qui', 'Gli allenamenti che concludi compariranno in questa pagina.') };
  const groups = [];
  for (const w of ws) { const m = monthLabel(w.start); if (!groups.length || groups[groups.length - 1].m !== m) groups.push({ m, list: [] }); groups[groups.length - 1].list.push(w); }
  return { title: 'Storico', sub: `${ws.length} ${ws.length === 1 ? 'allenamento' : 'allenamenti'}`,
    body: html`${groups.map(g => html`<div class="sec-title cap">${g.m}<span class="count">${g.list.length}</span></div>${g.list.map(w => workoutCard(st, w))}`)}` };
});

view('workout', (st, c) => {
  const w = st.workouts.find(x => x.id === c.id);
  if (!w) return { title: 'Allenamento', body: empty(IC.clock, 'Allenamento non trovato', 'Potrebbe essere stato eliminato.') };
  const body = html`${stats([[dur(w.end - w.start), 'Durata'], [fmt(workoutVolume(st, w), 0), 'Volume kg'], [workoutSets(w), 'Serie']])}
    ${w.note && html`<div class="ex-note gap">${w.note}</div>`}
    <div class="gap">${w.items.map(it => {
      const ex = getEx(st, it.exId), prs = (w.prs || []).filter(p => p.exId === it.exId); let n = 0;
      return html`<div class="card"><button class="row tap" data-a="ex.open" data-id="${ex.id}"><b class="grow t1 acc-text">${ex.name}</b>${IC.chev}</button>
        ${it.note && html`<div class="small muted">${it.note}</div>`}
        <div class="set-list">${it.sets.map(s => { if (s.t !== 'w') n++; return html`<div class="row num"><span class="set-n mini ${s.t}" title="${SET_TYPES[s.t]}">${s.t === 'n' ? n : s.t.toUpperCase()}</span>
          <span class="grow">${setText(s, ex.type)}${has(s.rpe) && html` <span class="muted">@${s.rpe}</span>`}</span>${ex.type === 'kg_reps' && s.t !== 'w' && html`<span class="muted tiny">1RM ${fmt(e1rm(s), 0)}</span>`}</div>`; })}</div>
        ${prs.length > 0 && html`<div class="pr gap">${IC.trophy} ${prs.map(p => { const m = metric(ex.type, p.k); return `${m.l} ${fmt(p.v)}`; }).join(' · ')}</div>`}</div>`; })}</div>
    <div class="grid2"><button class="btn acc" data-a="workout.repeat" data-id="${w.id}">${IC.play} Ripeti</button><button class="btn" data-a="history.edit" data-id="${w.id}">Modifica</button></div>
    <div class="grid2 gap"><button class="btn" data-a="routine.fromWorkout" data-id="${w.id}">Crea scheda</button><button class="btn bad" data-a="history.delete" data-id="${w.id}">Elimina</button></div>`;
  return { title: w.name, sub: `${dLong(w.start)} · ${new Date(w.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, body };
});

on('history.open', d => { closeSheet(); go('workout', { id: d.id }); });
on('history.delete', d => { store.update(s => W.deleteWorkout(s, d.id), { undo: 'Allenamento eliminato', silent: true }); back(); toast('Allenamento eliminato', { undo: true }); });
on('history.edit', d => {
  if (S().active) { toast("Concludi prima l'allenamento in corso"); return; }
  store.update(s => W.editWorkout(s, d.id), { silent: true });
  navigate('allena');
});
