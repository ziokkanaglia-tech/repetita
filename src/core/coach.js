// Coach IA (Claude): cosa sa, cosa vede di te, come propone una scheda.
// Qui solo funzioni pure: il collegamento vero e proprio sta in src/ui/ai.js.
// La chiave API NON passa mai da qui e non entra nello stato né nei backup.
import { DISCIPLINES, PRINCIPLES, EVIDENCE } from './disciplines.js';
import { GOALS, LEVELS, SETUPS, SEXES, EXPERIENCE, age, currentWeight, bmi } from './profile.js';
import { getEx, visibleExercises, workoutsDesc, lifetime, mainLifts, muscleSets, recentPRs, records, index, metric, workoutVolume, workoutSets } from './metrics.js';
import { TYPES } from './catalog.js';
import { fmt, dShort, DAY, has } from './util.js';

/** Modelli disponibili e prezzi in $ per milione di token (listino Anthropic, novembre 2026). */
export const MODELS = {
  'claude-opus-5-5': { l: 'Claude Opus 5.5', d: 'Il più capace (consigliato)', in: 4, out: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { l: 'Claude Sonnet 5.5', d: 'Veloce, costa la metà', in: 2, out: 10, cacheRead: 0.1 },
  'claude-haiku-5-5': { l: 'Claude Haiku 5.5', d: 'Rapidissimo, costa pochissimo', in: 0.1, out: 0.5, cacheRead: 0.01 }
};
export const DEFAULT_MODEL = 'claude-opus-5-5';
export const MAX_MESSAGES = 60;   // oltre, si propone una chat nuova (la cronologia non va mai tagliata a metà)

/** Costo in dollari di una risposta, dai token che l'API riporta. */
export function costOf(usage, model) {
  const p = MODELS[model] || MODELS[DEFAULT_MODEL], u = usage || {};
  const write = (u.cache_creation_input_tokens || 0) * p.in * 1.25, read = (u.cache_read_input_tokens || 0) * p.cacheRead;
  return ((u.input_tokens || 0) * p.in + write + read + (u.output_tokens || 0) * p.out) / 1e6;
}

/** Strumento con cui Claude propone una scheda: l'app la mostra con «Salva» e «Inizia». */
export const ROUTINE_TOOL = {
  name: 'proponi_scheda',
  description: 'Mostra all\'utente una scheda di allenamento pronta, che potrà salvare o avviare con un tocco. Usalo quando l\'utente chiede una scheda, un programma, una seduta o di modificarne una. Usa solo gli id esercizio del catalogo.',
  strict: true,
  input_schema: {
    type: 'object', additionalProperties: false,
    required: ['nome', 'motivazione', 'esercizi'],
    properties: {
      nome: { type: 'string', description: 'Nome breve della scheda, es. «Push A» o «Forza panca»' },
      motivazione: { type: 'string', description: 'Perché è fatta così, in 1-3 frasi, citando gli studi della base di conoscenza quando servono' },
      esercizi: {
        type: 'array', description: 'Esercizi in ordine di esecuzione',
        items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'serie', 'ripetizioni', 'recupero_sec', 'nota'],
          properties: {
            id: { type: 'string', description: 'Id dal catalogo, es. p-squat' },
            serie: { type: 'integer', description: 'Serie allenanti (1-10)' },
            ripetizioni: { type: 'string', description: 'Ripetizioni o tempo obiettivo, es. «6-8», «5», «30 s»' },
            recupero_sec: { type: 'integer', description: 'Recupero tra le serie in secondi' },
            nota: { type: 'string', description: 'Indicazione breve (RPE, tecnica, carico) oppure stringa vuota' }
          }
        }
      }
    }
  }
};

const line = (k, v) => (has(v) ? `- ${k}: ${v}\n` : '');

/** Istruzioni + base di conoscenza + catalogo. Sempre identico: così Anthropic lo tiene in cache e costa ~10 volte meno. */
export function systemPrompt(state) {
  const ev = Object.entries(EVIDENCE).map(([k, e]) => `[${k}] ${e.ref}: ${e.finding}`).join('\n');
  const disc = Object.entries(DISCIPLINES).map(([id, d]) => [
    `### ${d.name} (${id}) — ${d.tagline}`, d.about,
    `Parametri tipici: ripetizioni ${d.params.reps}; carico ${d.params.load}; ripetizioni di riserva ${d.params.rir}; recupero ${d.params.rest}; volume ${d.params.sets}; frequenza ${d.params.freq}.`,
    `Esercizi fondamentali: ${d.core.join(', ')}. Complementari tipici: ${d.staples.join(', ')}.`,
    `Consigli: ${d.advice.join(' ')}`, `Rischi: ${d.risks}`, `Fonti: ${d.evidence.join(', ')}.`
  ].join('\n')).join('\n\n');
  const catalog = visibleExercises(state).map(e => `${e.id} | ${e.name} | ${e.muscle} | ${e.equip} | ${TYPES[e.type].label}`).sort().join('\n');
  return `Sei il coach di Repetita, l'app di allenamento personale dell'utente. Parli italiano, in modo diretto e amichevole, come un preparatore esperto che conosce la letteratura scientifica.

Come rispondi:
- Leggi sul telefono: frasi brevi, paragrafi corti, elenchi puntati quando servono. Niente tabelle. Il grassetto con **testo** si vede.
- Basati sui dati reali dell'utente (in fondo al messaggio di sistema) e sulla base di conoscenza qui sotto. Quando un consiglio poggia su uno studio, citalo in breve, es. «(Schoenfeld 2017)». Se un tema non è coperto dagli studi, dillo invece di inventare.
- Distingui quello che è dimostrato da quello che è prassi degli allenatori.
- Rispetta il profilo: muscoli da evitare, attrezzi disponibili, disciplina scelta, tempo per seduta, livello.
- Per proporre o modificare una scheda usa lo strumento proponi_scheda, con i soli id del catalogo. Scrivi prima una frase che la introduce. Rispetta il tempo per seduta (circa 3 minuti per serie con il recupero).
- Se l'utente parla di dolore, infortuni o problemi di salute, dai solo indicazioni generali e consiglia un medico o un fisioterapista. Non fare diagnosi. Su dieta e integratori resta su indicazioni generali.
- Non ripetere all'utente i suoi dati se non servono alla risposta.

# Principi generali (validi per tutti)
${PRINCIPLES.map(p => `- ${p.t}: ${p.d} [${p.ev.join(', ')}]`).join('\n')}

# Le discipline
${disc}

# Fonti (chiave tra parentesi quadre)
${ev}

# Catalogo esercizi (id | nome | muscolo | attrezzo | cosa si registra)
${catalog}`;
}

/** Quello che il coach sa di te: profilo e allenamenti recenti. Niente foto, niente chiave. */
export function athleteContext(state, now = Date.now()) {
  const p = state.profile, w = currentWeight(state), L = lifetime(state), ws = workoutsDesc(state);
  let t = '# Dati dell\'utente (aggiornati a oggi, ' + new Date(now).toLocaleDateString('it-IT') + ')\n';
  t += line('Nome', p.name) + line('Età', age(p.birth, now)) + line('Sesso', p.sex && SEXES[p.sex]) + line('Altezza', p.height && p.height + ' cm');
  t += line('Peso', w && fmt(w) + ' kg') + line('BMI', bmi(w, p.height));
  t += line('Discipline (la prima è la principale)', p.disciplines.map(d => DISCIPLINES[d].name).join(', '));
  t += line('Obiettivo', p.goal && GOALS[p.goal].l) + line('Livello', p.level && LEVELS[p.level]) + line('Esperienza', p.experience && EXPERIENCE[p.experience]);
  t += line('Allenamenti a settimana voluti', p.weeklyTarget || '') + line('Durata seduta', p.sessionMin ? p.sessionMin + ' minuti' : '');
  t += line('Dove si allena', SETUPS[p.setup].l + (SETUPS[p.setup].equip ? ` (attrezzi: ${SETUPS[p.setup].equip.join(', ')})` : ''));
  t += line('Muscoli da sviluppare di più', p.focus.join(', ')) + line('Muscoli da EVITARE', p.avoid.join(', ')) + line('Note su infortuni e preferenze', p.notes);
  const fav = state.exercises.filter(e => e.fav).map(e => e.name), dis = state.exercises.filter(e => e.dislike && !e.hidden).map(e => e.name);
  t += line('Esercizi preferiti', fav.join(', ')) + line('Esercizi che non gli piacciono (non proporli)', dis.join(', '));
  t += `\n## Storico\n- Allenamenti totali: ${L.workouts}${L.since ? `, dal ${dShort(L.since)}` : ''}; ore ${fmt(L.hours, 0)}; record battuti ${L.prs}\n`;
  const lifts = mainLifts(state, w).filter(l => l.e1rm);
  if (lifts.length) t += `- Massimali stimati: ${lifts.map(l => `${l.label} ${fmt(l.e1rm, 0)} kg${l.ratio ? ` (${fmt(l.ratio, 2)}× peso)` : ''}`).join('; ')}\n`;
  const m28 = muscleSets(state, 28, now);
  if (m28.length) t += `- Serie allenanti per muscolo, ultime 4 settimane: ${m28.map(([m, v]) => `${m} ${v}`).join(', ')}\n`;
  const recent = ws.filter(x => x.start >= now - 28 * DAY);
  t += `- Allenamenti ultime 4 settimane: ${recent.length}\n`;
  const { usage, last } = index(state);
  const top = Object.entries(usage).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, n]) => {
    const ex = getEx(state, id), r = records(state, id)[0];
    return `${ex.name} (${n} sedute, ${r.l.toLowerCase()} ${fmt(r.best)} ${r.u}, ultima ${dShort(last[id])})`;
  });
  if (top.length) t += `- Esercizi più fatti: ${top.join('; ')}\n`;
  const prs = recentPRs(state, 6);
  if (prs.length) t += `- Record recenti: ${prs.map(x => { const ex = getEx(state, x.exId), mm = metric(ex.type, x.k); return `${ex.name} ${mm.l.toLowerCase()} ${fmt(x.v)} ${mm.u} (${dShort(x.ts)})`; }).join('; ')}\n`;
  if (ws.length) t += `\n## Ultimi allenamenti\n${ws.slice(0, 6).map(x => `- ${dShort(x.start)} «${x.name}», ${Math.round((x.end - x.start) / 6e4)} min, ${fmt(workoutVolume(state, x), 0)} kg, ${workoutSets(x)} serie: ${x.items.map(it => `${getEx(state, it.exId).name} ${it.sets.filter(s => s.t !== 'w').length}×`).join(', ')}`).join('\n')}\n`;
  if (state.routines.length) t += `\n## Schede salvate\n${state.routines.map(r => `- ${r.name}: ${r.items.map(i => `${getEx(state, i.exId).name} ${i.sets}×${i.reps || '?'}`).join(', ')}`).join('\n')}\n`;
  if (!L.workouts) t += '\nNon ha ancora registrato allenamenti.\n';
  return t;
}

/** Controlla e ripulisce la scheda proposta: esercizi esistenti, numeri sensati, niente muscoli da evitare. */
export function validateProposal(input, state) {
  const p = state.profile, byId = new Map(state.exercises.filter(e => !e.hidden).map(e => [e.id, e]));
  const items = [], dropped = [];
  const list = input && Array.isArray(input.esercizi) ? input.esercizi : [];
  for (const x of list) {
    const ex = x && byId.get(String(x.id));
    if (!ex) { dropped.push(String(x && x.id)); continue; }
    if (p.avoid.includes(ex.muscle)) { dropped.push(ex.name); continue; }
    const sets = Math.min(10, Math.max(1, parseInt(x.serie, 10) || 3));
    const rest = Math.min(600, Math.max(0, parseInt(x.recupero_sec, 10) || 0));
    items.push({ exId: ex.id, sets, reps: String(x.ripetizioni || '').slice(0, 20), rest, note: String(x.nota || '').slice(0, 120) });
  }
  const name = String((input && input.nome) || 'Scheda del coach').trim().slice(0, 40) || 'Scheda del coach';
  return { name, why: String((input && input.motivazione) || '').slice(0, 600), items, dropped };
}

/** Riassunto testuale di una risposta per lo storico della chat (testo + eventuale proposta). */
export function messageText(content) {
  if (typeof content === 'string') return content;
  return (content || []).filter(b => b.type === 'text').map(b => b.text).join('\n\n');
}
export const proposalsIn = content => (Array.isArray(content) ? content.filter(b => b.type === 'tool_use' && b.name === ROUTINE_TOOL.name) : []);
/** true se il messaggio dell'utente contiene solo risposte tecniche agli strumenti (non va mostrato). */
export const isToolResultOnly = m => m.role === 'user' && Array.isArray(m.content) && m.content.length > 0 && m.content.every(b => b.type === 'tool_result');
