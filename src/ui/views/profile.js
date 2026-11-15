// Profilo: chi sei, i tuoi numeri di sempre, calendario, massimali. E la modifica dei dati personali.
import { html, on, onInput, $ } from '../dom.js';
import { view, ui, go, back, render, atRoot, navigate } from '../app.js';
import { IC } from '../icons.js';
import { toast } from '../sheet.js';
import { stats, empty } from '../parts.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { MUSCLES } from '../../core/catalog.js';
import { GOALS, LEVELS, SETUPS, SEXES, EXPERIENCE, SESSION_MIN, age, bmi, bmiLabel, currentWeight, completeness } from '../../core/profile.js';
import { DISCIPLINES } from '../../core/disciplines.js';
import { lifetime, mainLifts, heatmap, streak, thisWeek } from '../../core/metrics.js';
import { fmt, isoDay, dShort, clone } from '../../core/util.js';

const S = () => store.getState();
const initials = name => (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
export const avatar = (p, size = '') => html`<div class="avatar ${size}">${p.photo ? html`<img src="${p.photo}" alt="">` : initials(p.name)}</div>`;

view('profilo', st => {
  const p = st.profile, L = lifetime(st), w = currentWeight(st), a = age(p.birth), b = bmi(w, p.height);
  const wk = thisWeek(st), done = completeness(p);
  const lifts = mainLifts(st, w), anyLift = lifts.some(l => l.e1rm > 0);
  const tags = [p.goal && GOALS[p.goal].l, p.level && LEVELS[p.level], p.experience && EXPERIENCE[p.experience], p.sessionMin && `${p.sessionMin} min a seduta`, SETUPS[p.setup].l].filter(Boolean);
  const main = DISCIPLINES[p.disciplines[0]];
  const facts = [[a ? `${a} anni` : null], [p.height ? `${fmt(p.height, 0)} cm` : null], [w ? `${fmt(w)} kg` : null]].map(x => x[0]).filter(Boolean);
  const body = html`
    <div class="card profile-head">
      <button class="avatar-btn" data-a="profile.edit" aria-label="Modifica profilo">${avatar(p, 'lg')}</button>
      <div class="grow">
        <div class="p-name">${p.name || 'Il tuo profilo'}</div>
        ${p.bio ? html`<div class="small muted">${p.bio}</div>` : !p.name && html`<div class="small muted">Aggiungi nome, obiettivo e dati per consigli su misura.</div>`}
        ${facts.length > 0 && html`<div class="small p-facts">${facts.join(' · ')}</div>`}
      </div>
    </div>
    ${main ? html`<button class="card tap disc-card" data-a="disc.open" data-id="${p.disciplines[0]}"><div class="row"><div class="badge">${main.short}</div><div class="grow"><div class="tiny muted">LA TUA DISCIPLINA</div><div class="t1 big">${main.name}</div></div>${IC.chev}</div>
        <div class="small muted gap">${main.tagline}</div>
        ${p.disciplines.length > 1 && html`<div class="small gap">Anche: ${p.disciplines.slice(1).map(id => DISCIPLINES[id].name).join(', ')}</div>`}</button>`
      : html`<button class="routine" data-a="profile.edit"><div class="badge">${IC.list}</div><div class="grow"><div class="t1">Come ti piace allenarti?</div><div class="small muted">Bodybuilding, powerlifting, calisthenics… scegli le tue discipline</div></div>${IC.chev}</button>`}
    ${tags.length > 0 && html`<div class="ex-meta top">${tags.map(t => html`<span class="chip">${t}</span>`)}${p.focus.length > 0 && html`<span class="chip k-Da">Priorità: ${p.focus.join(', ').toLowerCase()}</span>`}${p.avoid.length > 0 && html`<span class="chip k-Poco">Evito: ${p.avoid.join(', ').toLowerCase()}</span>`}</div>`}
    ${done < 1 && html`<button class="routine" data-a="profile.edit"><div class="ring" style="--p:${Math.round(done * 100)}"><span>${Math.round(done * 100)}%</span></div>
      <div class="grow"><div class="t1">Completa il profilo</div><div class="small muted">Obiettivo, livello e dati personali rendono più precisi consigli e schede</div></div>${IC.chev}</button>`}

    <div class="sec-title">I tuoi numeri</div>
    ${stats([[L.workouts, 'Allenamenti'], [fmt(L.hours, 0) + ' h', 'In palestra'], [fmt(L.tons, 1) + ' t', 'Sollevate']])}
    <div class="gap">${stats([[L.prs, 'Record battuti'], [streak(st), 'Settimane di fila'], [wk.target ? `${wk.list.length}/${wk.target}` : wk.list.length, 'Questa settimana']])}</div>
    ${L.since && html`<div class="tiny muted center gap">Ti alleni con Repetita dal ${new Date(L.since).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`}

    <div class="sec-title">Costanza</div><div class="card">${calendar(st)}</div>

    <div class="sec-title">Massimali stimati</div>
    ${anyLift ? html`<div class="card flat">${lifts.map(l => html`<button class="list-item" data-a="ex.open" data-id="${l.id}"><div class="grow"><div class="t1">${l.label}</div>
        <div class="small muted">${l.e1rm ? (l.ratio ? `${fmt(l.ratio, 2)}× il tuo peso` : 'aggiungi il peso nel profilo per il rapporto') : 'non ancora fatto'}</div></div>
        <b class="num">${l.e1rm ? fmt(l.e1rm, 0) + ' kg' : '—'}</b></button>`)}</div>
      <div class="tiny muted gap">Stima del carico per una ripetizione, calcolata dalle tue serie migliori.</div>`
      : html`<div class="card small muted">Quando registri squat, panca, stacco o military press, qui vedi il tuo massimale stimato.</div>`}

    ${b && html`<div class="sec-title">Corpo</div><button class="card tap row" data-a="profile.body"><div class="grow"><div class="t1">BMI ${fmt(b)} · ${bmiLabel(b)}</div>
      <div class="small muted">Calcolato da peso e altezza. Indicativo: non distingue muscoli e grasso.</div></div>${IC.chev}</button>`}
    ${p.notes && html`<div class="sec-title">Note</div><div class="card small">${p.notes}</div>`}
    <button class="routine gap" data-a="disc.list"><div class="badge">${IC.spark}</div><div class="grow"><div class="t1">Le discipline e gli studi</div><div class="small muted">Cosa dice la ricerca su ogni modo di allenarsi</div></div>${IC.chev}</button>`;
  return {
    title: 'Profilo', body,
    right: html`<button class="icon-btn" data-a="profile.edit" aria-label="Modifica profilo">${IC.edit}</button><button class="icon-btn" data-a="settings.open" aria-label="Impostazioni">${IC.gear}</button>`
  };
});

/** Calendario a quadretti: una colonna per settimana, più è pieno più ti sei allenato. */
function calendar(st) {
  const weeks = heatmap(st, 17), total = weeks.flat().filter(d => d.n > 0).length;
  const months = weeks.map((c, i) => { const m = new Date(c[0].t).getMonth(); return i === 0 || m !== new Date(weeks[i - 1][0].t).getMonth() ? new Date(c[0].t).toLocaleDateString('it-IT', { month: 'short' }) : ''; });
  return html`<div class="heat-wrap"><div class="heat-days"><span>L</span><span></span><span>M</span><span></span><span>V</span><span></span><span>D</span></div>
    <div class="grow"><div class="heat-months">${months.map(m => html`<span>${m}</span>`)}</div>
    <div class="heat">${weeks.map(col => html`<div class="heat-col">${col.map(d => html`<i class="${d.future ? 'f' : d.n > 1 ? 'l2' : d.n ? 'l1' : ''}" title="${dShort(d.t)}${d.n ? ': ' + d.n + ' allenamento' : ''}"></i>`)}</div>`)}</div></div></div>
    <div class="small muted gap">${total} ${total === 1 ? 'giorno' : 'giorni'} di allenamento nelle ultime 17 settimane</div>`;
}

// ---- modifica
view('profileEdit', st => {
  const d = ui.prof;
  if (!d) return { title: 'Profilo', body: empty(IC.user, 'Bozza non trovata', 'Torna indietro e riapri la modifica.') };
  const opt = (obj, v, ph) => html`${ph && html`<option value="" ${!v ? 'selected' : ''}>${ph}</option>`}${Object.entries(obj).map(([k, x]) => html`<option value="${k}" ${k === v ? 'selected' : ''}>${typeof x === 'string' ? x : x.l}</option>`)}`;
  const body = html`
    <div class="center"><button class="avatar-btn big" data-a="profile.photo" aria-label="Cambia foto">${avatar(d, 'xl')}<span class="avatar-edit">${IC.camera}</span></button>
      ${d.photo && html`<div><button class="link small" data-a="profile.photoRemove">Togli foto</button></div>`}
      <input type="file" id="photoFile" data-in="profile.photoFile" accept="image/*" hidden></div>
    <div class="sec-title">Chi sei</div><div class="card">
      <div class="field"><label for="pName">Nome</label><input id="pName" data-in="prof.f" data-f="name" value="${d.name}" placeholder="Come ti chiami" autocomplete="given-name" maxlength="40"></div>
      <div class="field"><label for="pBio">Motto</label><input id="pBio" data-in="prof.f" data-f="bio" value="${d.bio}" placeholder="Es. Repetita iuvant" maxlength="80"></div>
      <div class="grid2"><div class="field"><label for="pSex">Sesso</label><select id="pSex" data-in="prof.f" data-f="sex">${opt(SEXES, d.sex, '—')}</select></div>
        <div class="field"><label for="pBirth">Data di nascita</label><input id="pBirth" type="date" data-in="prof.f" data-f="birth" value="${d.birth}" max="${isoDay()}"></div></div>
      <div class="grid2"><div class="field"><label for="pHeight">Altezza (cm)</label><input id="pHeight" data-in="prof.f" data-f="height" inputmode="numeric" value="${d.height}" placeholder="178"></div>
        <div class="field"><label for="pWeight">Peso (kg)</label><input id="pWeight" data-in="prof.weight" inputmode="decimal" value="${String(ui.profWeight ?? '').replace('.', ',')}" placeholder="75,5"></div></div>
    </div>
    <div class="sec-title">Il tuo modo di allenarti</div><div class="card">
      <div class="small muted">Scegli fino a 3 discipline, in ordine di importanza: la prima è la principale.</div>
      <div class="disc-pick gap">${Object.entries(DISCIPLINES).map(([k, x]) => { const i = d.disciplines.indexOf(k); return html`<button class="${i >= 0 ? 'on' : ''}" data-a="prof.disc" data-k="${k}">${i >= 0 && html`<span class="n">${i + 1}</span>`}<b>${x.name}</b><span>${x.tagline}</span></button>`; })}</div>
      <button class="link small gap" data-a="disc.list">Non sai quale? Leggi le schede delle discipline</button>
    </div>
    <div class="sec-title">Come ti alleni</div><div class="card">
      <div class="field"><label>Obiettivo</label><div class="choice">${Object.entries(GOALS).map(([k, g]) => html`<button class="${d.goal === k ? 'on' : ''}" data-a="prof.pick" data-f="goal" data-k="${k}"><b>${g.l}</b><span>${g.d} · ${g.reps} rip</span></button>`)}</div></div>
      <div class="field"><label>Livello</label><div class="seg">${Object.entries(LEVELS).map(([k, l]) => html`<button class="${d.level === k ? 'on' : ''}" data-a="prof.pick" data-f="level" data-k="${k}">${l}</button>`)}</div></div>
      <div class="field"><label>Allenamenti a settimana</label><div class="seg">${[1, 2, 3, 4, 5, 6, 7].map(n => html`<button class="${d.weeklyTarget === n ? 'on' : ''}" data-a="prof.pick" data-f="weeklyTarget" data-k="${n}">${n}</button>`)}</div></div>
      <div class="field"><label>Da quanto ti alleni</label><div class="seg">${Object.entries(EXPERIENCE).map(([k, l]) => html`<button class="${d.experience === k ? 'on' : ''}" data-a="prof.pick" data-f="experience" data-k="${k}">${l.replace('Meno di 1 anno', '<1 anno').replace('Più di 5 anni', '5+ anni')}</button>`)}</div></div>
      <div class="field"><label>Tempo per seduta (minuti)</label><div class="seg">${SESSION_MIN.map(n => html`<button class="${d.sessionMin === n ? 'on' : ''}" data-a="prof.pick" data-f="sessionMin" data-k="${n}">${n}</button>`)}</div></div>
      <div class="field"><label>Dove ti alleni</label><div class="seg">${Object.entries(SETUPS).map(([k, x]) => html`<button class="${d.setup === k ? 'on' : ''}" data-a="prof.pick" data-f="setup" data-k="${k}">${x.l.replace('A casa con manubri', 'Casa').replace('Palestra completa', 'Palestra').replace('Solo corpo libero', 'Corpo libero')}</button>`)}</div></div>
    </div>
    <div class="sec-title">Muscoli da sviluppare di più</div><div class="card">
      <div class="small muted">Fino a 4: i consigli daranno loro la precedenza.</div>
      <div class="chips wrap gap">${MUSCLES.filter(m => m !== 'Cardio' && m !== 'Corpo intero').map(m => html`<button class="chip ${d.focus.includes(m) ? 'on' : ''}" data-a="prof.focus" data-m="${m}">${m}</button>`)}</div>
    </div>
    <div class="sec-title">Da evitare</div><div class="card">
      <div class="small muted">Muscoli da non allenare (infortuni, fastidi): non te li proporrò nei consigli.</div>
      <div class="chips wrap gap">${MUSCLES.filter(m => m !== 'Cardio').map(m => html`<button class="chip ${d.avoid.includes(m) ? 'on bad' : ''}" data-a="prof.avoid" data-m="${m}">${m}</button>`)}</div>
      <div class="field gap"><label for="pNotes">Note (facoltative)</label><textarea id="pNotes" data-in="prof.f" data-f="notes" maxlength="300" placeholder="Es. spalla destra delicata, niente lento dietro">${d.notes}</textarea></div>
    </div>
    <button class="btn acc block lg" data-a="profile.save">Salva profilo</button>`;
  return { title: 'Modifica profilo', body, right: html`<button class="btn sm acc" data-a="profile.save">Salva</button>` };
});

function openEdit() {
  ui.prof = clone(S().profile);
  ui.profWeight = currentWeight(S());
  if (atRoot('profilo')) go('profileEdit'); else navigate('profilo', [{ v: 'profileEdit' }]);
}
on('profile.edit', openEdit);
on('profile.body', () => { ui.prog = 'body'; navigate('progressi'); });
on('settings.open', () => { if (atRoot('profilo')) go('settings'); else navigate('profilo', [{ v: 'settings' }]); });
onInput('prof.f', (v, d) => { if (ui.prof) ui.prof[d.f] = v; });
onInput('prof.weight', v => { ui.profWeight = v; });
on('prof.pick', d => {
  const num = d.f === 'weeklyTarget' || d.f === 'sessionMin', v = num ? Number(d.k) : d.k;
  ui.prof[d.f] = ui.prof[d.f] === v && d.f !== 'setup' ? (num ? 0 : '') : v;    // toccare di nuovo la scelta la toglie
  render();
});
on('prof.disc', d => { const a = ui.prof.disciplines, i = a.indexOf(d.k); if (i >= 0) a.splice(i, 1); else if (a.length < 3) a.push(d.k); else toast('Al massimo 3 discipline'); render(); });
on('prof.focus', d => { const a = ui.prof.focus, i = a.indexOf(d.m); if (i >= 0) a.splice(i, 1); else if (a.length < 4) a.push(d.m); else toast('Al massimo 4 muscoli'); render(); });
on('prof.avoid', d => { const a = ui.prof.avoid, i = a.indexOf(d.m); if (i >= 0) a.splice(i, 1); else a.push(d.m); render(); });
on('profile.save', () => {
  const data = ui.prof, weight = ui.profWeight;
  store.update(s => W.saveProfile(s, data, { weight, today: isoDay() }), { silent: true });
  ui.prof = null; back(); toast('Profilo salvato');
});
on('profile.photo', () => $('#photoFile').click());
on('profile.photoRemove', () => { ui.prof.photo = ''; render(); });
onInput('profile.photoFile', async (v, d, el) => {
  const f = el.files && el.files[0]; el.value = '';
  if (!f) return;
  try { ui.prof.photo = await squarePhoto(f, 256); render(); }
  catch (e) { toast('Non riesco a leggere questa foto'); }
});
/** Ritaglia la foto al centro, quadrata, e la rimpicciolisce: così pesa pochi KB. */
async function squarePhoto(file, size) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}
