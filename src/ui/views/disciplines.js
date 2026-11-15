// Le discipline e gli studi: la base di conoscenza, consultabile da chiunque.
import { html, on } from '../dom.js';
import { view, go, atRoot, navigate, ui } from '../app.js';
import { IC } from '../icons.js';
import { closeSheet } from '../sheet.js';
import { DISCIPLINES, EVIDENCE, PRINCIPLES } from '../../core/disciplines.js';
import { getEx } from '../../core/metrics.js';

const P_LABELS = [['reps', 'Ripetizioni'], ['load', 'Carico'], ['rir', 'Ripetizioni di riserva'], ['rest', 'Recupero'], ['sets', 'Volume'], ['freq', 'Frequenza']];
const sources = keys => html`<div class="card flat">${keys.map(k => { const e = EVIDENCE[k]; return html`<a class="list-item src" href="${e.url}" target="_blank" rel="noopener"><div class="grow"><div class="small">${e.finding}</div><div class="tiny muted">${e.ref}</div></div>${IC.chev}</a>`; })}</div>`;

view('disciplines', st => ({
  title: 'Discipline',
  body: html`<div class="small muted pad">Cosa dice la ricerca su come allenarsi, disciplina per disciplina. È la stessa conoscenza che usa il coach.</div>
    ${Object.entries(DISCIPLINES).map(([id, d]) => html`<button class="routine" data-a="disc.open" data-id="${id}"><div class="badge">${d.short}</div>
      <div class="grow"><div class="t1">${d.name}${st.profile.disciplines[0] === id ? html` <span class="chip k-Da">La tua</span>` : st.profile.disciplines.includes(id) ? html` <span class="chip">Anche tua</span>` : ''}</div><div class="small muted">${d.tagline}</div></div>${IC.chev}</button>`)}
    <div class="sec-title">Principi validi per tutti</div>
    <div class="card flat">${PRINCIPLES.map(p => html`<div class="list-item"><div class="grow"><div class="t1">${p.t}</div><div class="small muted">${p.d}</div></div></div>`)}</div>
    <div class="sec-title">Gli studi</div>${sources(Object.keys(EVIDENCE))}`
}));

view('discipline', (st, c) => {
  const d = DISCIPLINES[c.id];
  if (!d) return { title: 'Disciplina', body: '' };
  return {
    title: d.name, sub: d.tagline,
    body: html`<div class="card">${d.about}</div>
      <div class="sec-title">I numeri tipici</div>
      <div class="card flat">${P_LABELS.map(([k, l]) => html`<div class="list-item"><span class="small muted p-lab">${l}</span><span class="grow small">${d.params[k]}</span></div>`)}</div>
      <div class="sec-title">Gli esercizi che la definiscono</div>
      <div class="chips wrap">${d.core.map(id => html`<button class="chip" data-a="ex.open" data-id="${id}">${getEx(st, id).name}</button>`)}</div>
      <div class="sec-title">Complementari tipici</div>
      <div class="chips wrap">${d.staples.map(id => html`<button class="chip" data-a="ex.open" data-id="${id}">${getEx(st, id).name}</button>`)}</div>
      <div class="sec-title">Consigli pratici</div>
      <div class="card"><ul class="plain">${d.advice.map(a => html`<li>${a}</li>`)}</ul></div>
      <div class="sec-title">Rischi</div><div class="card small">${d.risks}</div>
      <div class="sec-title">Fonti</div>${sources(d.evidence)}
      <button class="btn soft block gap" data-a="disc.ask" data-id="${c.id}">${IC.spark} Chiedi al coach una scheda di ${d.name.toLowerCase()}</button>`
  };
});

on('disc.list', () => { closeSheet(); go('disciplines'); });
on('disc.open', d => go('discipline', { id: d.id }));
on('disc.ask', d => {
  ui.coachDraft = `Creami una scheda di ${DISCIPLINES[d.id].name.toLowerCase()} adatta a me`;
  if (atRoot('coach')) return;
  navigate('coach');
});
