// Scheda "Allena": schermata di partenza e allenamento in corso.
import { html, on, onInput } from '../dom.js';
import { view, ui, navigate, render } from '../app.js';
import { IC } from '../icons.js';
import { sheet, closeSheet, menu, ask, askText, toast } from '../sheet.js';
import { startRest, stopRest } from '../timer.js';
import { restText, suggList, stats, workoutCard } from '../parts.js';
import { avatar } from './profile.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { COL, REST_STEPS, SET_TYPES } from '../../core/catalog.js';
import { getEx, colsFor, setText, workoutVolume, workoutSets, workoutsDesc, streak, thisWeek, metric } from '../../core/metrics.js';
import { suggestions, alternatives, suggestForItems } from '../../core/recommend.js';
import { fmt, dur, dLong, DAY } from '../../core/util.js';

const S = () => store.getState();
const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
/** I numeri sono salvati col punto ma mostrati con la virgola, come sulla tastiera italiana. */
const comma = v => String(v ?? '').replace('.', ',');

view('allena', st => (st.active ? workoutView(st) : startView(st)));

function startView(st) {
  const now = Date.now(), wk = thisWeek(st, now), today = (new Date(now).getDay() + 6) % 7, h = new Date(now).getHours();
  const sg = suggestions(st, now), last = workoutsDesc(st)[0];
  const backupDue = st.workouts.length >= 3 && now - (st.settings.lastBackup || 0) > 14 * DAY;
  const body = html`
    <div class="card"><div class="row"><b class="grow card-title">Questa settimana</b><span class="small muted">${wk.target ? `${wk.list.length} di ${wk.target}` : wk.list.length} ${(wk.target || wk.list.length) === 1 ? 'allenamento' : 'allenamenti'}${wk.target && wk.list.length >= wk.target ? ' ✓' : ''}</span></div>
      <div class="week">${DAYS.map((d, i) => html`<div class="day ${wk.days.has(i) ? 'on' : ''} ${i === today ? 'today' : ''}"><i>${wk.days.has(i) && IC.check}</i>${d}</div>`)}</div>
      <div class="hero-stats"><div><b>${streak(st, now)}</b><span>sett. di fila</span></div><div><b>${fmt(wk.volume / 1000)} t</b><span>sollevate</span></div><div><b>${wk.sets}</b><span>serie</span></div></div></div>
    ${!st.profile.name && html`<button class="routine" data-a="profile.edit"><div class="badge">${IC.user}</div><div class="grow"><div class="t1">Crea il tuo profilo</div><div class="small muted">Obiettivo e dati personali, per consigli su misura</div></div>${IC.chev}</button>`}
    <button class="btn acc block lg" data-a="workout.startEmpty">${IC.plus} Inizia allenamento libero</button>
    ${backupDue && html`<button class="routine gap" data-a="settings.open"><div class="badge warn">!</div><div class="grow small"><div class="t1">Fai un backup</div><div class="muted">I dati sono solo su questo telefono</div></div>${IC.chev}</button>`}
    <div class="sec-title">Le tue schede${st.routines.length > 0 && html`<button class="link" data-a="routine.new">Nuova</button>`}</div>
    ${st.routines.length ? st.routines.map(r => html`<button class="routine" data-a="workout.startRoutine" data-id="${r.id}"><div class="grow"><div class="t1 big">${r.name}</div>
        <div class="small muted ell">${r.items.length} esercizi · ${r.items.map(i => getEx(st, i.exId).name).join(', ') || 'vuota'}</div></div><span class="play">${IC.play}</span></button>`)
      : html`<button class="routine" data-a="routine.new"><div class="badge">${IC.plus}</div><div class="grow"><div class="t1">Crea la tua prima scheda</div><div class="small muted">Esercizi e serie pronti, avvii con un tocco</div></div>${IC.chev}</button>`}
    <button class="routine coach-cta" data-a="nav.tab" data-t="coach"><div class="badge">${IC.spark}</div><div class="grow"><div class="t1">Chiedi al coach</div><div class="small muted">Schede, analisi e dubbi, con la ricerca scientifica</div></div>${IC.chev}</button>
    ${sg.out.length > 0 && html`<div class="sec-title">${IC.spark} Consigli per te<button class="link" data-a="prog.openSugg">Tutti</button></div><div class="card flat">${suggList(sg.out.slice(0, 2))}</div>`}
    ${last && html`<div class="sec-title">Ultimo allenamento</div>${workoutCard(st, last)}`}`;
  const hello = h < 6 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera', first = st.profile.name.split(' ')[0];
  return { title: first ? `${hello}, ${first}` : hello, body, right: html`<button class="avatar-btn" data-a="nav.tab" data-t="profilo" aria-label="Profilo">${avatar(st.profile, 'sm')}</button>` };
}

function workoutView(st) {
  const a = st.active, p = W.progress(a);
  const body = html`${a.note && html`<button class="ex-note tap" data-a="workout.note">${a.note}</button>`}
    ${a.items.map((it, i) => exCard(st, it, i))}
    ${!a.items.length && html`<div class="empty"><div class="ico">${IC.dumbbell}</div><b>Allenamento vuoto</b>Aggiungi il primo esercizio per iniziare.</div>`}
    <div class="grid2"><button class="btn soft" data-a="pick.open" data-mode="add">${IC.plus} Esercizio</button><button class="btn soft" data-a="workout.suggest">${IC.spark} Consigli</button></div>
    <div class="wk-actions"><button class="btn" data-a="workout.rename">Rinomina</button><button class="btn" data-a="workout.note">Nota</button><button class="btn bad" data-a="workout.discard">${a.editId ? 'Annulla' : 'Scarta'}</button></div>`;
  return {
    title: a.name, body, progress: p.tot ? p.done / p.tot * 100 : 0,
    sub: html`${a.editId ? dLong(a.start) : html`⏱ <span data-elapsed></span>`} · ${fmt(workoutVolume(st, a), 0)} kg · ${p.done}/${p.tot} serie`,
    right: html`<button class="btn sm acc" data-a="workout.finish">${a.editId ? 'Salva' : 'Fine'}</button>`
  };
}

function exCard(st, it, i) {
  const a = st.active, ex = getEx(st, it.exId), cols = colsFor(ex, st.settings), hints = W.rowHints(st, it);
  const linked = it.ss || (a.items[i - 1] && a.items[i - 1].ss);
  const nWork = it.sets.filter(s => s.t !== 'w').length;
  return html`<section class="ex ${linked ? 'ss' : ''}">
    <div class="ex-title"><h3 class="grow" data-a="ex.open" data-id="${ex.id}">${ex.name}</h3><button class="icon-btn" data-a="item.menu" data-i="${i}" aria-label="Opzioni esercizio">${IC.more}</button></div>
    <div class="ex-meta"><span class="chip">${ex.muscle}</span>${it.target && html`<span class="chip">🎯 ${nWork}×${it.target}</span>`}
      <button class="chip" data-a="item.rest" data-i="${i}">⏱ ${restText(it.rest ?? st.settings.rest)}</button>${it.ss && html`<span class="chip k-Equilibrio">Superserie ↓</span>`}</div>
    ${it.note && html`<div class="ex-note">${it.note}</div>`}
    <table class="sets"><colgroup><col style="width:40px"><col><col span="${cols.length}" style="width:${cols.length >= 3 ? 54 : 70}px"><col style="width:50px"></colgroup>
      <thead><tr><th>Serie</th><th>Prec.</th>${cols.map(c => html`<th>${COL[c].l}</th>`)}<th>✓</th></tr></thead>
      <tbody>${it.sets.map((s, j) => { const hint = hints[j]; return html`<tr class="${s.done ? 'done' : ''} ${ui.just === i + ':' + j ? 'just' : ''}">
        <td><button class="set-n ${s.t}" data-a="set.menu" data-i="${i}" data-j="${j}" aria-label="Tipo di serie">${hint.label}</button></td>
        <td class="prev">${hint.prev ? setText(hint.prev, ex.type, true) : '—'}</td>
        ${cols.map(c => html`<td><input data-in="set.field" data-i="${i}" data-j="${j}" data-f="${c}" inputmode="${COL[c].im}" enterkeyhint="next" autocomplete="off" value="${comma(s[c])}" placeholder="${comma(hint.ph[c])}" aria-label="${COL[c].l}, serie ${j + 1}"></td>`)}
        <td><button class="chk" data-a="set.check" data-i="${i}" data-j="${j}" aria-label="${s.done ? 'Togli spunta' : 'Serie fatta'}">${IC.check}</button></td></tr>`; })}</tbody></table>
    <button class="btn block sm add-set" data-a="set.add" data-i="${i}">${IC.plus} Aggiungi serie</button></section>`;
}

// ---- avvio
function start(name, items, routineId) {
  if (S().active) { toast('Hai già un allenamento in corso'); navigate('allena'); return; }
  store.update(s => W.startWorkout(s, { name, items, routineId }), { silent: true });
  navigate('allena');
}
on('workout.startEmpty', () => { const h = new Date().getHours(); start(h < 12 ? 'Allenamento del mattino' : h < 18 ? 'Allenamento del pomeriggio' : 'Allenamento serale', []); });
on('workout.startRoutine', d => { const r = S().routines.find(x => x.id === d.id); if (r) start(r.name, W.itemsFromRoutine(S(), r), r.id); });
on('workout.repeat', d => { const w = S().workouts.find(x => x.id === d.id); if (w) start(w.name, W.itemsFromWorkout(S(), w), w.routineId); });

// ---- serie
onInput('set.field', (v, d) => store.patch(s => { if (s.active) W.setField(s, +d.i, +d.j, d.f, v); }));
on('set.check', d => {
  ui.just = d.i + ':' + d.j;
  const r = store.update(s => W.toggleSet(s, +d.i, +d.j));
  ui.just = null;
  if (!r.ok) toast('Scrivi prima i valori della serie');
  else if (r.done) startRest(r.rest);
});
on('set.add', d => store.update(s => W.addSet(s, +d.i)));
on('set.menu', d => {
  const cur = S().active.items[+d.i].sets[+d.j].t, color = { w: 'warm', d: 'drop', f: 'fail' };
  menu('Serie', [...Object.entries(SET_TYPES).map(([t, l]) => ({ l, a: 'set.type', d: { i: d.i, j: d.j, t }, mark: t === 'n' ? '1' : t.toUpperCase(), markColor: color[t], on: t === cur })),
    { l: 'Elimina serie', a: 'set.delete', d: { i: d.i, j: d.j }, bad: true, mark: '×' }]);
});
on('set.type', d => { closeSheet(); store.update(s => W.setType(s, +d.i, +d.j, d.t)); });
on('set.delete', d => { closeSheet(); store.update(s => W.removeSet(s, +d.i, +d.j), { undo: 'Serie eliminata' }); toast('Serie eliminata', { undo: true }); });

// ---- esercizio dentro l'allenamento
on('item.menu', d => {
  const st = S(), i = d.i, it = st.active.items[+i];
  menu(getEx(st, it.exId).name, [
    { l: it.note ? 'Modifica nota' : 'Aggiungi nota', a: 'item.note', d: { i } },
    { l: `Tempo di recupero (${restText(it.rest ?? st.settings.rest)})`, a: 'item.rest', d: { i } },
    { l: 'Alternative consigliate', a: 'item.alt', d: { i }, mark: '✨' },
    { l: 'Sostituisci esercizio', a: 'pick.open', d: { mode: 'replace', i } },
    { l: it.ss ? 'Togli superserie' : 'Superserie con il successivo', a: 'item.ss', d: { i } },
    { l: 'Sposta su', a: 'item.move', d: { i, dir: -1 } }, { l: 'Sposta giù', a: 'item.move', d: { i, dir: 1 } },
    { l: 'Rimuovi esercizio', a: 'item.delete', d: { i }, bad: true }]);
});
on('item.note', async d => {
  const v = await askText("Nota sull'esercizio", { value: S().active.items[+d.i].note || '', ph: 'Es. sedile 4, presa larga' });
  if (v !== null) store.update(s => { s.active.items[+d.i].note = v.trim(); });
});
on('item.rest', d => {
  const st = S(), cur = st.active.items[+d.i].rest ?? st.settings.rest;
  menu('Tempo di recupero', REST_STEPS.map(s => ({ l: restText(s), a: 'item.restSet', d: { i: d.i, s }, on: s === cur })));
});
on('item.restSet', d => { closeSheet(); store.update(s => { s.active.items[+d.i].rest = +d.s; }); });
on('item.alt', d => {
  const st = S(), it = st.active.items[+d.i];
  sheet('Alternative a ' + getEx(st, it.exId).name, html`<div class="ask-msg">Macchina occupata o voglia di cambiare? Scelte in base a come ti alleni.</div>
    ${suggList(alternatives(st, it.exId, 6, st.active.items.map(x => x.exId)), { action: 'item.replaceWith', label: 'Usa', extra: { i: d.i } })}`);
});
on('item.replaceWith', d => { closeSheet(); store.update(s => W.replaceExercise(s, +d.i, d.id), { undo: 'Esercizio sostituito' }); toast('Esercizio sostituito', { undo: true }); });
on('item.ss', d => { closeSheet(); store.update(s => { const it = s.active.items[+d.i]; it.ss = !it.ss; }); });
on('item.move', d => { closeSheet(); store.update(s => W.moveItem(s, +d.i, +d.dir)); });
on('item.delete', d => { closeSheet(); store.update(s => W.removeItem(s, +d.i), { undo: 'Esercizio rimosso' }); toast('Esercizio rimosso', { undo: true }); });

// ---- allenamento
on('workout.suggest', () => {
  const st = S();
  sheet('Cosa potrei aggiungere?', suggList(suggestForItems(st, st.active.items.map(i => i.exId), 6), { action: 'workout.addSuggested' }));
});
on('workout.addSuggested', d => { closeSheet(); store.update(s => W.addExercises(s, [d.id])); toast(getEx(S(), d.id).name + ' aggiunto'); });
on('workout.rename', async () => { const v = await askText("Nome dell'allenamento", { value: S().active.name }); if (v && v.trim()) store.update(s => { s.active.name = v.trim(); }); });
on('workout.note', async () => { const v = await askText("Nota sull'allenamento", { value: S().active.note || '', ph: 'Come ti sei sentito, cosa cambiare…' }); if (v !== null) store.update(s => { s.active.note = v.trim(); }); });

function discard() {
  const id = store.update(s => W.discardWorkout(s), { silent: true });
  stopRest();
  if (id) navigate('storico', [{ v: 'workout', id }]); else render();
}
on('workout.discard', async () => {
  const edit = !!S().active.editId;
  if (await ask(edit ? 'Annullare le modifiche?' : "Scartare l'allenamento?", { ok: edit ? 'Annulla modifiche' : 'Scarta', msg: edit ? '' : 'Le serie fatte finora andranno perse.' })) discard();
});
on('workout.finish', async () => {
  const p = W.progress(S().active);
  if (!p.done) {
    if (await ask('Nessuna serie spuntata', { ok: 'Scarta allenamento', msg: "Spunta le serie fatte con ✓, oppure scarta l'allenamento." })) discard();
    return;
  }
  if (p.undone && !await ask("Concludere l'allenamento?", { ok: 'Concludi', danger: false, msg: `${p.undone} ${p.undone === 1 ? 'serie non spuntata verrà tolta' : 'serie non spuntate verranno tolte'}.` })) return;
  const out = store.update(s => W.finishWorkout(s), { silent: true });
  stopRest();
  const w = out.workout, st = S();
  navigate('storico', [{ v: 'workout', id: w.id }]);
  if (out.edited) { toast('Modifiche salvate'); return; }
  const r = st.routines.find(x => x.id === w.routineId), wks = streak(st);
  sheet('Allenamento salvato 🎉', html`${stats([[dur(w.end - w.start), 'Durata'], [fmt(workoutVolume(st, w), 0), 'Volume kg'], [workoutSets(w), 'Serie']])}
    ${w.prs.length ? html`<div class="card inset gap"><b class="pr">${IC.trophy} ${w.prs.length} ${w.prs.length === 1 ? 'nuovo record' : 'nuovi record'}</b>
        <div class="small lines">${w.prs.map(p => { const ex = getEx(st, p.exId), m = metric(ex.type, p.k); return html`<div>${ex.name}: ${m.l} ${fmt(p.v)} ${m.u}</div>`; })}</div></div>`
      : html`<div class="ask-msg gap">Allenamento numero ${st.workouts.length}. ${wks} ${wks === 1 ? 'settimana' : 'settimane'} di fila.</div>`}
    ${out.routineChanged && r && html`<button class="btn block gap" data-a="workout.updateRoutine" data-id="${w.id}">Aggiorna la scheda «${r.name}»</button>`}`,
    html`<button class="btn acc block" data-a="sheet.close">Chiudi</button>`);
});
on('workout.updateRoutine', d => { closeSheet(); store.update(s => W.updateRoutineFromWorkout(s, d.id)); toast('Scheda aggiornata'); });
