// Scheda "Altro": aspetto, impostazioni, backup, cancellazione dati.
import { html, on, onInput, $ } from '../dom.js';
import { view, render } from '../app.js';
import { IC } from '../icons.js';
import { ask, toast } from '../sheet.js';
import { restOptions, seg } from '../parts.js';
import { applyTheme } from '../theme.js';
import { syncWake } from '../timer.js';
import * as store from '../../core/store.js';
import { ACCENTS, emptyState } from '../../core/model.js';
import { visibleExercises } from '../../core/metrics.js';
import { exportJSON, parseBackup, backupName } from '../../core/backup.js';
import { dLong } from '../../core/util.js';

const S = () => store.getState();
const toggle = (label, key, val) => html`<label class="list-item"><span class="grow">${label}</span><input type="checkbox" data-in="settings.set" data-k="${key}" ${val ? 'checked' : ''}></label>`;

view('settings', st => {
  const s = st.settings, standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return { title: 'Impostazioni', body: html`
    ${!standalone && html`<div class="card small"><b>Installala sul telefono</b><div class="muted">In Safari tocca Condividi e poi «Aggiungi alla schermata Home». Si aprirà a tutto schermo come un'app.</div></div>`}
    <button class="routine" data-a="lib.open"><div class="grow"><div class="t1">Esercizi</div><div class="small muted">${visibleExercises(st).length} esercizi · aggiungi i tuoi</div></div>${IC.chev}</button>
    <div class="sec-title">Aspetto</div><div class="card">${seg('settings.theme', [['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']], s.theme)}
      <div class="small muted gap">Colore principale</div><div class="swatches">${Object.entries(ACCENTS).map(([k, [c]]) => html`<button class="sw ${s.accent === k ? 'on' : ''}" style="background:${c};color:${c}" data-a="settings.accent" data-k="${k}" aria-label="Colore ${k}"></button>`)}</div></div>
    <div class="sec-title">Allenamento</div><div class="card flat">
      <div class="list-item"><label class="grow" for="sRest">Recupero predefinito</label><select id="sRest" class="auto" data-in="settings.set" data-k="rest">${restOptions(s.rest)}</select></div>
      ${toggle('Mostra colonna RPE', 'rpe', s.rpe)}${toggle('Suono a fine recupero', 'sound', s.sound)}${toggle("Schermo acceso durante l'allenamento", 'wake', s.wake)}</div>
    <div class="sec-title">Backup</div><div class="card"><div class="small muted">I dati restano solo su questo telefono. Ultimo backup: <b class="text">${s.lastBackup ? dLong(s.lastBackup) : 'mai'}</b>. Salva il file su iCloud Drive o mandalo a te stesso.</div>
      <div class="grid2 gap"><button class="btn acc" data-a="backup.export">Esporta</button><button class="btn" data-a="backup.import">Importa</button></div>
      <input type="file" id="importFile" data-in="backup.file" accept="application/json,.json" hidden></div>
    <div class="sec-title">Zona pericolosa</div><button class="btn bad block" data-a="data.wipe">Cancella tutti i dati</button>
    <div class="tiny muted center gap">Repetita 2.1 · ${st.workouts.length} allenamenti · ${st.routines.length} schede</div>` };
});

on('settings.theme', d => { store.update(s => { s.settings.theme = d.k; }); applyTheme(S().settings); });
on('settings.accent', d => { store.update(s => { s.settings.accent = d.k; }); applyTheme(S().settings); });
onInput('settings.set', (v, d) => { store.update(s => { s.settings[d.k] = typeof v === 'boolean' ? v : Number(v); }, { silent: true }); syncWake(); });

on('backup.export', async () => {
  const name = backupName(), blob = new Blob([exportJSON(S())], { type: 'application/json' });
  const done = () => { store.update(s => { s.settings.lastBackup = Date.now(); }); toast('Backup pronto'); };
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Backup Repetita' }); done(); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  done();
});
on('backup.import', () => $('#importFile').click());
onInput('backup.file', async (v, d, el) => {
  const f = el.files && el.files[0]; if (!f) return;
  el.value = '';
  let parsed;
  try { parsed = parseBackup(await f.text()); } catch (e) { toast(e.message, { ms: 3500 }); return; }
  const { state, summary } = parsed;
  if (!await ask('Sostituire i dati attuali?', { ok: 'Importa', msg: `Il backup contiene ${summary.workouts} allenamenti e ${summary.routines} schede.` })) return;
  const cur = S();
  store.replace({ ...state, active: cur.active, timer: cur.timer });
  applyTheme(S().settings); toast('Backup importato');
});
on('data.wipe', async () => {
  if (!await ask('Cancellare tutti i dati?', { ok: 'Continua', msg: 'Allenamenti, schede e misure. Fai prima un backup.' })) return;
  if (!await ask('Sei sicuro? Non si torna indietro.', { ok: 'Cancella tutto' })) return;
  store.replace(emptyState()); applyTheme(S().settings); render(); toast('Dati cancellati');
});
