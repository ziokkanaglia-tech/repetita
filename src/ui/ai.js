// Collegamento con Claude tramite l'SDK ufficiale Anthropic, caricato solo quando serve il coach.
// La chiave API resta in questo telefono (archivio del browser, chiave separata dai dati):
// non entra nello stato, nei backup, né nel codice pubblicato.
import { systemPrompt, athleteContext, ROUTINE_TOOL, costOf } from '../core/coach.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.8.0/+esm';
const KEY_STORE = 'repetita.apikey';
let sdkPromise = null;

export const getKey = () => { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } };
export const setKey = k => { try { if (k) localStorage.setItem(KEY_STORE, k); else localStorage.removeItem(KEY_STORE); } catch (e) { } };
export const hasKey = () => !!getKey();
export const maskKey = k => (k ? k.slice(0, 10) + '…' + k.slice(-4) : '');

async function sdk() {
  if (!sdkPromise) sdkPromise = import(SDK_URL).then(m => m.default).catch(e => { sdkPromise = null; throw e; });
  return sdkPromise;
}
async function client(key = getKey()) {
  const Anthropic = await sdk();
  // dangerouslyAllowBrowser: l'app non ha un server; la chiave è dell'utente e resta sul suo telefono
  return { Anthropic, c: new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 2 }) };
}

/** Traduce gli errori dell'API in messaggi comprensibili. */
export async function explain(err) {
  let A = null;
  try { A = await sdk(); } catch (e) { return 'Non riesco a caricare il collegamento con Claude: controlla la connessione.'; }
  if (err instanceof A.AuthenticationError) return 'La chiave API non è valida o è stata revocata. Controllala in Impostazioni coach.';
  if (err instanceof A.PermissionDeniedError) return 'La chiave non ha accesso a questo modello. Prova un altro modello nelle impostazioni del coach.';
  if (err instanceof A.RateLimitError) return 'Troppe richieste o credito esaurito. Aspetta un minuto o controlla il credito su platform.claude.com.';
  if (err instanceof A.BadRequestError) return 'Richiesta non accettata: ' + (err.message || '').slice(0, 160);
  if (err instanceof A.InternalServerError) return 'Claude è momentaneamente sovraccarico. Riprova tra poco.';
  if (err instanceof A.APIConnectionError) return 'Niente connessione: il coach ha bisogno di internet.';
  if (err instanceof A.APIError) return `Errore ${err.status || ''} dal servizio: ${(err.message || '').slice(0, 160)}`;
  return 'Qualcosa è andato storto: ' + String((err && err.message) || err).slice(0, 160);
}

/** Verifica una chiave senza consumare credito (legge solo le informazioni del modello). */
export async function testKey(key, model) {
  const { c } = await client(key);
  await c.models.retrieve(model);
  return true;
}

/**
 * Manda la conversazione a Claude e restituisce la risposta completa.
 * onText(testoParziale) viene chiamata mentre arriva il testo.
 */
export async function ask(state, messages, { onText, signal } = {}) {
  const model = state.settings.aiModel;
  const { c } = await client();
  const stream = c.beta.messages.stream({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',                     // se un filtro di sicurezza rifiuta, l'API riprova da sola con un modello di riserva
    output_config: { effort: 'medium' },      // ragionamento adattivo: il modello decide quanto pensare
    system: [
      { type: 'text', text: systemPrompt(state), cache_control: { type: 'ephemeral' } },   // fisso: in cache
      { type: 'text', text: athleteContext(state) }                                       // cambia coi tuoi dati
    ],
    tools: [{ ...ROUTINE_TOOL, eager_input_streaming: true }],
    messages
  }, { signal });
  let text = '';
  stream.on('text', delta => { text += delta; if (onText) onText(text); });
  const msg = await stream.finalMessage();
  return { content: msg.content, stop: msg.stop_reason, details: msg.stop_details || null, usage: msg.usage, cost: costOf(msg.usage, model), model: msg.model };
}
