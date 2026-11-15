# Repetita

App personale per tracciare gli allenamenti. È una web app installabile sull'iPhone (Safari → Condividi → «Aggiungi alla schermata Home»), funziona senza rete e tiene i dati sul telefono. Nessuna libreria esterna, nessun passaggio di compilazione: i file si pubblicano così come sono.

## Comandi

```bash
npm test         # controlla la logica e l'interfaccia (37 test)
npm run serve    # apre l'app su http://localhost:8765
```

## Com'è fatta

```
index.html, manifest.webmanifest, sw.js   pagina, installazione, funzionamento offline
css/app.css                               sistema di design: colori, temi, componenti
icons/                                    icone dell'app
src/main.js                               avvio
src/core/     LOGICA, non sa nulla dello schermo e si prova con i test
  catalog.js    muscoli, attrezzi, movimenti, esercizi pronti
  model.js      forma dei dati e validazione (normalize)
  profile.js    profilo: discipline, obiettivo, livello, dove ti alleni, priorità, muscoli da evitare
  disciplines.js le 8 discipline, i principi generali e le fonti (vedi docs/ricerca-discipline.md)
  store.js      stato, salvataggio, annulla, copie di sicurezza
  metrics.js    volume, 1RM stimato, record, andamenti
  recommend.js  motore dei consigli
  workout.js    operazioni su allenamento, schede, esercizi, misure
  backup.js     esporta / importa
src/ui/       INTERFACCIA
  dom.js        html`...` sicuro, registro delle azioni
  app.js        schede in basso, pagine, intestazione, ridisegno
  sheet.js      pannelli, menu, conferme, avvisi
  timer.js      recupero, cronometro, suono, schermo acceso
  charts.js     grafici SVG
  parts.js      pezzi riusati (elenchi, schede, selettori)
  theme.js      tema e colore
  views/        una schermata per file
tests/        core, profile, disciplines (logica), ui (pulsanti, file offline)
docs/         ricerca-discipline.md: studi e fonti della base di conoscenza
```

## Regole del progetto

- **I dati passano sempre da `normalize()`**: salvataggi, backup e versioni vecchie escono con la forma giusta o vengono scartati.
- **Lo stato si cambia solo con `store.update()`** (o `patch()` mentre si scrive). Con `{ undo: 'etichetta' }` la modifica è annullabile.
- **L'HTML si scrive con `` html`...` ``**: il testo inserito viene reso sicuro in automatico.
- **Ogni pulsante ha `data-a="nome.azione"`** e la sua `on('nome.azione', …)`. Il test fallisce se ne manca una o se ne resta una inutilizzata.
- **Quando aggiungi un file** in `src/`, `css/` o `icons/`, aggiungilo all'elenco in `sw.js` e cambia `VERSIONE`. Il test lo controlla.

## Online

https://ziokkanaglia-tech.github.io/repetita/ — GitHub Pages dal ramo `main`. Per aggiornare: `npm test`, cambia `VERSIONE` in `sw.js`, poi commit e `git push`.

## Dati

Chiave `ferro.v2` nell'archivio del browser. Ogni giorno viene salvata una copia (`ferro.snap.AAAA-MM-GG`, le ultime 3): se il salvataggio principale si rovina, l'app riparte dall'ultima copia. I dati della versione 1 (`ferro.v1`) vengono portati nella nuova al primo avvio.

