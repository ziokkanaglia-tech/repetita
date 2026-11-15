// Coach IA: chat con Claude che conosce il tuo profilo, i tuoi allenamenti e la ricerca sulle discipline.
import { html, raw, on, onInput, $ } from '../dom.js';
import { view, ui, go, render, navigate, atRoot } from '../app.js';
import { IC } from '../icons.js';
import { ask as askYesNo, menu, closeSheet, toast } from '../sheet.js';
import * as AI from '../ai.js';
import * as store from '../../core/store.js';
import * as W from '../../core/workout.js';
import { MODELS, MAX_MESSAGES, validateProposal, proposalsIn, messageText, isToolResultOnly } from '../../core/coach.js';
import { DISCIPLINES } from '../../core/disciplines.js';
import { getEx } from '../../core/metrics.js';
import { esc, fmt } from '../../core/util.js';

const S = () => store.getState();
let controller = null;

/** Markdown minimo e sicuro: grassetto, elenchi, titoletti, a capo. Il testo viene prima reso innocuo. */
export function md(text) {
  const lines = esc(text).split('\n'), out = [];
  let list = null;
  const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const l of lines) {
    const ul = l.match(/^\s*[-*•]\s+(.*)/), ol = l.match(/^\s*\d+[.)]\s+(.*)/), h = l.match(/^#{1,4}\s+(.*)/);
    if (ul || ol) { const t = ul ? 'ul' : 'ol'; if (list !== t) { close(); out.push(`<${t}>`); list = t; } out.push(`<li>${inline((ul || ol)[1])}</li>`); continue; }
    close();
    if (h) out.push(`<p class="md-h">${inline(h[1])}</p>`);
    else if (l.trim()) out.push(`<p>${inline(l)}</p>`);
  }
  close();
  return raw(out.join(''));
}

const QUICK = [
  'Creami una scheda adatta alla mia disciplina',
  'Analizza le mie ultime 4 settimane: cosa migliorare?',
  'Sono fermo su un esercizio: come sblocco i progressi?',
  'Quante serie a settimana dovrei fare per ogni muscolo?',
  'Che differenza c\'è tra powerlifting e powerbuilding?'
];

view('coach', st => {
  if (!AI.hasKey()) return { title: 'Coach', body: onboarding(st) };
  const msgs = st.coach.messages, busy = !!ui.coachBusy;
  const shown = msgs.map((m, i) => ({ m, i })).filter(x => !isToolResultOnly(x.m));
  const main = DISCIPLINES[st.profile.disciplines[0]];
  const body = html`
    ${!shown.length && html`<div class="coach-hello"><div class="ico">${IC.spark}</div><b>Ciao${st.profile.name ? ' ' + st.profile.name.split(' ')[0] : ''}, sono il tuo coach</b>
      <div class="muted small">Conosco il tuo profilo${main ? `, il ${main.name.toLowerCase()}` : ''} e i tuoi allenamenti, e ragiono sugli studi scientifici. Chiedimi una scheda, un'analisi o un dubbio.</div></div>
      ${!st.profile.disciplines.length && html`<button class="routine" data-a="profile.edit"><div class="badge">${IC.user}</div><div class="grow small"><div class="t1">Scegli le tue discipline</div><div class="muted">Così i consigli partono dal tuo modo di allenarti</div></div>${IC.chev}</button>`}
      <div class="quick">${QUICK.map(q => html`<button class="chip" data-a="coach.quick" data-q="${q}">${q}</button>`)}</div>`}
    <div class="chat">${shown.map(({ m, i }) => bubble(st, m, i))}
      ${busy && html`<div class="msg ai"><div class="bubble" id="coachLive">${ui.coachLive ? md(ui.coachLive) : html`<span class="typing"><i></i><i></i><i></i></span>`}</div></div>`}
      ${ui.coachError && html`<div class="msg err"><div class="bubble">${ui.coachError}</div></div>`}
    </div>
    ${msgs.length >= MAX_MESSAGES && html`<div class="card small muted">La conversazione è lunga: per risposte più rapide ed economiche <button class="link" data-a="coach.new">inizia una nuova chat</button>.</div>`}
    <div class="composer"><textarea id="coachIn" data-in="coach.draft" rows="1" placeholder="Scrivi al coach…" enterkeyhint="send">${ui.coachDraft || ''}</textarea>
      ${busy ? html`<button class="send stop" data-a="coach.stop" aria-label="Interrompi">■</button>` : html`<button class="send" data-a="coach.send" aria-label="Invia">↑</button>`}</div>
    <div class="tiny muted center">Le risposte sono generate da IA: verifica i consigli importanti. ${MODELS[st.settings.aiModel].l} · speso finora ${money(st.coach.spent)}</div>`;
  return { title: 'Coach', body, right: html`<button class="icon-btn" data-a="coach.menu" aria-label="Opzioni coach">${IC.more}</button>` };
});

const money = v => (v < 0.01 ? 'meno di 1 cent' : '$' + fmt(v, 2));

function bubble(st, m, i) {
  if (m.role === 'user') return html`<div class="msg me"><div class="bubble">${md(messageText(m.content))}</div></div>`;
  const text = messageText(m.content), props = proposalsIn(m.content);
  return html`<div class="msg ai">${text && html`<div class="bubble">${md(text)}</div>`}
    ${props.map(b => proposalCard(st, b, i, (m.saved || []).includes(b.id)))}
    ${m.cost > 0 && html`<div class="tiny faint">${money(m.cost)}</div>`}</div>`;
}
function proposalCard(st, block, i, saved) {
  const p = validateProposal(block.input, st);
  return html`<div class="card proposal"><div class="row"><b class="grow t1 big">${p.name}</b><span class="chip">${p.items.length} esercizi</span></div>
    ${p.why && html`<div class="small muted gap">${p.why}</div>`}
    <div class="lines small">${p.items.map(it => html`<div class="row"><span class="grow">${getEx(st, it.exId).name}</span><b class="num">${it.sets}×${it.reps || '—'}</b></div>
      ${it.note && html`<div class="tiny muted">${it.note}</div>`}`)}</div>
    ${p.dropped.length > 0 && html`<div class="tiny muted gap">Tolti perché non disponibili o da evitare: ${p.dropped.join(', ')}</div>`}
    <div class="grid2 gap">${saved ? html`<button class="btn" disabled>✓ Salvata</button>` : html`<button class="btn" data-a="coach.saveRoutine" data-i="${i}" data-id="${block.id}">Salva scheda</button>`}
      <button class="btn acc" data-a="coach.startRoutine" data-i="${i}" data-id="${block.id}">${IC.play} Inizia ora</button></div></div>`;
}

function onboarding(st) {
  const m = MODELS[st.settings.aiModel];
  return html`<div class="coach-hello"><div class="ico">${IC.spark}</div><b>Il tuo coach con intelligenza artificiale</b>
      <div class="muted small">Un vero modello di Claude che legge profilo e allenamenti, conosce la ricerca su ${Object.keys(DISCIPLINES).length} discipline e ti propone schede da salvare con un tocco.</div></div>
    <div class="sec-title">Come attivarlo</div>
    <div class="card steps">
      <div class="step"><span>1</span><div>Vai su <b>platform.claude.com</b> e crea un account (è separato da quello di claude.ai).</div></div>
      <div class="step"><span>2</span><div>In <b>Billing</b> aggiungi un po' di credito: bastano 5 $ per centinaia di domande.</div></div>
      <div class="step"><span>3</span><div>In <b>API Keys</b> crea una chiave e copiala.</div></div>
      <div class="step"><span>4</span><div>Incollala qui sotto.</div></div>
    </div>
    <div class="card"><div class="field"><label for="keyIn">Chiave API</label><input id="keyIn" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…"></div>
      <button class="btn acc block" data-a="coach.saveKey">Collega il coach</button>
      <div class="tiny muted gap">La chiave resta solo su questo telefono: non va nei backup né su internet, se non verso Anthropic per le tue domande.</div></div>
    <div class="sec-title">Costi e privacy</div>
    <div class="card small muted">Con ${m.l} una domanda costa in media 2-5 centesimi; puoi scegliere un modello più economico nelle impostazioni del coach. A Claude arrivano solo profilo e riepilogo dei tuoi allenamenti, mai la foto. Anthropic non usa i dati dell'API per addestrare i modelli.</div>
    <button class="routine gap" data-a="disc.list"><div class="badge">${IC.list}</div><div class="grow"><div class="t1">Le discipline e gli studi</div><div class="small muted">La base di conoscenza del coach, consultabile anche senza chiave</div></div>${IC.chev}</button>`;
}

// ---- invio
const apiMessages = msgs => msgs.map(m => ({ role: m.role, content: m.content }));
function scrollDown() { requestAnimationFrame(() => scrollTo(0, document.body.scrollHeight)); }

async function send(text) {
  text = String(text || '').trim();
  if (!text || ui.coachBusy) return;
  ui.coachDraft = ''; ui.coachError = ''; ui.coachLive = ''; ui.coachBusy = true;
  store.update(s => { s.coach.messages.push({ role: 'user', content: text }); }, { silent: true });
  render(); scrollDown();
  controller = new AbortController();
  try {
    const res = await AI.ask(S(), apiMessages(S().coach.messages), {
      signal: controller.signal,
      onText: t => { ui.coachLive = t; const el = $('#coachLive'); if (el) { el.innerHTML = String(md(t)); scrollDown(); } }
    });
    if (res.stop === 'refusal') {
      store.update(s => { s.coach.spent += res.cost; s.coach.messages.pop(); }, { silent: true });
      ui.coachError = 'Il coach non può rispondere a questa richiesta. Prova a riformularla.';
      ui.coachDraft = text;
    } else {
      const tools = res.content.filter(b => b.type === 'tool_use');
      store.update(s => {
        s.coach.messages.push({ role: 'assistant', content: res.content, cost: res.cost });
        // ogni proposta riceve subito la sua «risposta tecnica», così la chat resta valida per l'API
        if (tools.length) s.coach.messages.push({ role: 'user', content: tools.map(b => ({ type: 'tool_result', tool_use_id: b.id, content: 'Proposta mostrata all\'utente con i pulsanti Salva e Inizia.' })) });
        s.coach.spent += res.cost; s.coach.asked++;
      }, { silent: true });
      if (res.stop === 'max_tokens') toast('Risposta troncata: chiedimi di continuare');
    }
  } catch (err) {
    if (controller && controller.signal.aborted) {
      store.update(s => { s.coach.messages.pop(); }, { silent: true });
      ui.coachDraft = text;
    } else {
      ui.coachError = await AI.explain(err);
      store.update(s => { s.coach.messages.pop(); }, { silent: true });
      ui.coachDraft = text;
    }
  } finally {
    controller = null; ui.coachBusy = false; ui.coachLive = '';
    render(); scrollDown();
  }
}
on('coach.send', () => send(($('#coachIn') || {}).value));
on('coach.quick', d => send(d.q));
on('coach.stop', () => { if (controller) controller.abort(); });
onInput('coach.draft', (v, d, el) => { ui.coachDraft = v; el.style.height = 'auto'; el.style.height = Math.min(160, el.scrollHeight) + 'px'; });
/** Invio sulla tastiera = manda il messaggio (Maiusc+Invio va a capo). Collegato all'avvio da main.js. */
export function coachKeydown(e) {
  if (e.target && e.target.id === 'coachIn' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(e.target.value); return true; }
  return false;
}

// ---- schede proposte
function proposalFrom(d) {
  const m = S().coach.messages[+d.i], b = m && proposalsIn(m.content).find(x => x.id === d.id);
  return b ? validateProposal(b.input, S()) : null;
}
function saveProposal(d) {
  const p = proposalFrom(d);
  if (!p || !p.items.length) { toast('Questa proposta non ha esercizi validi'); return null; }
  return store.update(s => {
    const r = W.saveRoutine(s, { id: null, name: p.name, items: p.items });
    const m = s.coach.messages[+d.i]; m.saved = [...(m.saved || []), d.id];
    return r;
  });
}
on('coach.saveRoutine', d => { if (saveProposal(d)) toast('Scheda salvata in Schede'); });
on('coach.startRoutine', d => {
  if (S().active) { toast('Hai già un allenamento in corso'); navigate('allena'); return; }
  const m = S().coach.messages[+d.i], already = m && (m.saved || []).includes(d.id);
  const r = already ? S().routines.find(x => x.name === proposalFrom(d).name) : saveProposal(d);
  if (!r) return;
  store.update(s => W.startWorkout(s, { name: r.name, items: W.itemsFromRoutine(s, r), routineId: r.id }), { silent: true });
  navigate('allena');
});

// ---- impostazioni del coach
on('coach.menu', () => menu('Coach', [
  { l: 'Nuova chat', a: 'coach.new' },
  { l: 'Impostazioni del coach', a: 'coach.settings' },
  { l: 'Le discipline e gli studi', a: 'disc.list' }
]));
on('coach.new', async () => {
  closeSheet();
  if (S().coach.messages.length && !await askYesNo('Iniziare una nuova chat?', { ok: 'Nuova chat', danger: false, msg: 'La conversazione attuale verrà cancellata. Le schede salvate restano.' })) return;
  ui.coachError = '';
  store.update(s => { s.coach.messages = []; });
});
on('coach.settings', () => { closeSheet(); if (atRoot('coach')) go('coachSettings'); else navigate('coach', [{ v: 'coachSettings' }]); });
on('coach.saveKey', async () => {
  const el = $('#keyIn'), key = el ? el.value.trim() : '';
  if (!key) { toast('Incolla prima la chiave'); return; }
  toast('Controllo la chiave…', { ms: 8000 });
  try { await AI.testKey(key, S().settings.aiModel); AI.setKey(key); toast('Coach collegato ✓'); render(); }
  catch (e) { toast(await AI.explain(e), { ms: 5000 }); }
});
on('coach.removeKey', async () => {
  if (!await askYesNo('Scollegare il coach?', { ok: 'Scollega', msg: 'La chiave viene cancellata da questo telefono. Puoi revocarla anche su platform.claude.com.' })) return;
  AI.setKey(''); render(); toast('Chiave rimossa');
});
on('coach.model', d => { store.update(s => { s.settings.aiModel = d.k; }); toast(MODELS[d.k].l + ' selezionato'); });

view('coachSettings', st => {
  const key = AI.getKey();
  return {
    title: 'Impostazioni coach',
    body: html`<div class="sec-title">Collegamento</div>
      ${key ? html`<div class="card"><div class="row"><div class="grow"><div class="t1">Chiave collegata</div><div class="small muted num">${AI.maskKey(key)}</div></div><button class="btn sm bad" data-a="coach.removeKey">Scollega</button></div></div>`
        : html`<div class="card"><div class="field"><label for="keyIn">Chiave API</label><input id="keyIn" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="sk-ant-…"></div><button class="btn acc block" data-a="coach.saveKey">Collega</button></div>`}
      <div class="sec-title">Modello</div>
      <div class="choice">${Object.entries(MODELS).map(([k, m]) => html`<button class="${st.settings.aiModel === k ? 'on' : ''}" data-a="coach.model" data-k="${k}"><b>${m.l}</b><span>${m.d} · $${fmt(m.in, 2)} / $${fmt(m.out, 2)} per milione di token</span></button>`)}</div>
      <div class="sec-title">Spesa</div>
      <div class="card"><div class="row"><span class="grow">Domande fatte</span><b class="num">${st.coach.asked}</b></div><div class="row gap"><span class="grow">Spesa stimata totale</span><b class="num">${money(st.coach.spent)}</b></div>
        <div class="tiny muted gap">Stima calcolata dai token di ogni risposta. Il conto esatto è su platform.claude.com.</div></div>
      <div class="sec-title">Cosa vede il coach</div>
      <div class="card small muted">Profilo (senza foto), misure, discipline, riepilogo degli allenamenti, record, schede e questa chat. I dati vanno ad Anthropic solo quando fai una domanda. Le istruzioni e la base scientifica restano in cache per qualche minuto: le domande ravvicinate costano meno.</div>`
  };
});
