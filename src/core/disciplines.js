// Base di conoscenza: le 8 discipline e la scienza generale dell'allenamento.
// Ogni parametro è legato alle fonti in EVIDENCE (studi, revisioni, regolamenti federali).
// Ricerca fatta il 15/11/2026: dettagli e link in docs/ricerca-discipline.md.

/** Studi e documenti citati. key → { ref, finding, url } */
export const EVIDENCE = {
  volume: { ref: 'Schoenfeld, Ogborn, Krieger 2017 · J Sports Sci (meta-analisi, 15 studi)', finding: 'Più serie settimanali per muscolo = più crescita: +5,4% sotto 5 serie, +6,6% con 5-9, +9,8% con 10 o più.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6303131' },
  volume2024: { ref: 'Pelland et al. 2024 · SportRxiv (meta-regressione)', finding: 'Il volume aiuta sia ipertrofia sia forza, ma per la forza i benefici calano prima: oltre un certo punto più serie servono poco.', url: 'https://sportrxiv.org/index.php/server/preprint/view/460' },
  loads: { ref: 'Schoenfeld et al. 2017 · J Strength Cond Res (meta-analisi, 21 studi)', finding: 'Carichi bassi (≤60% 1RM) e alti fanno crescere i muscoli in modo simile se si arriva vicino al cedimento; per la forza massima vincono i carichi alti.', url: 'https://pubmed.ncbi.nlm.nih.gov/28834797/' },
  failure: { ref: 'Robinson et al. 2024 · Sports Medicine (meta-regressione)', finding: 'L\'ipertrofia migliora fermandosi più vicino al cedimento; la forza cresce in modo simile in un ampio intervallo di ripetizioni di riserva.', url: 'https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/' },
  frequency: { ref: 'Schoenfeld, Grgic, Krieger 2019 · J Sports Sci (meta-analisi, 25 studi)', finding: 'A parità di volume la frequenza conta poco per l\'ipertrofia: serve soprattutto a distribuire il volume.', url: 'https://mennohenselmans.com/training-frequency-2018-meta-analysis-review/' },
  rest: { ref: 'Singer et al. 2024 · Front Sports Act Living (meta-analisi bayesiana)', finding: 'Piccolo vantaggio per recuperi oltre 60 s; oltre 90 s nessuna differenza apprezzabile per l\'ipertrofia.', url: 'https://frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/abstract' },
  rom: { ref: 'Wolf et al. 2023 · Int J Strength Cond (meta-analisi)', finding: 'Il movimento completo è leggermente migliore; i parziali in allungamento potrebbero dare un vantaggio, ma il dato non è certo.', url: 'https://journal.iusca.org/index.php/Journal/article/view/182' },
  concurrent: { ref: 'Schumann et al. 2022 · Sports Medicine (meta-analisi, 43 studi)', finding: 'Unire cardio e pesi non riduce ipertrofia e forza massima; può ridurre la forza esplosiva se fatti nella stessa seduta (meglio a 3+ ore di distanza).', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474354' },
  bbPrep: { ref: 'Helms et al. 2015 · J Sports Med Phys Fitness (raccomandazioni bodybuilding natural)', finding: 'Ogni muscolo 2+ volte a settimana, 40-70 ripetizioni per muscolo a seduta, quasi tutte tra 6 e 12 al 70-80% 1RM; cedimento soprattutto sui monoarticolari.', url: 'https://ro.ecu.edu.au/ecuworkspost2013/1869' },
  strengthVsHyp: { ref: 'Schoenfeld et al. 2014 · J Strength Cond Res (allenati, volume equiparato)', finding: 'Stile «forza» (3 rip) e stile «ipertrofia» (10 rip) fanno crescere allo stesso modo; lo stile forza dà più forza massima.', url: 'https://breakingmuscle.com/strength-and-power-rep-schemes-work-for-hypertrophy-too/' },
  rpe: { ref: 'Helms et al. 2018 · Front Physiol (powerlifter, 8 settimane)', finding: 'Caricare a RPE (ripetizioni di riserva) o a percentuale dà risultati simili; l\'RPE può dare un piccolo vantaggio sul massimale.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5877330' },
  dup: { ref: 'Zourdos et al. 2016 · J Strength Cond Res', finding: 'Nei powerlifter variare ogni giorno l\'obiettivo (ipertrofia, potenza, forza) funziona; l\'ordine dei giorni conta.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5877330' },
  minDose: { ref: 'Androulakis-Korakakis et al. 2021 · Front Sports Act Living', finding: 'Per il massimale bastano 3-6 serie pesanti da 1-5 ripetizioni a settimana per alzata, a RPE 7,5-9,5; singole a RPE 9 + 2-3 serie a ~80% come opzione minima.', url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.713655/pdf' },
  wlDerivatives: { ref: 'Suchomel, Comfort, Stone 2015 · Sports Medicine', finding: 'Le tirate senza ricezione (clean pull, jump shrug, high pull) allenano la tripla estensione e si possono caricare oltre il massimale di girata.', url: 'https://www.doi.org/10.1007/S40279-015-0314-Y' },
  iwf: { ref: 'IWF · Regolamento tecnico', finding: 'Due alzate in ordine fisso, strappo e poi slancio; tre tentativi ciascuna; il totale somma le migliori.', url: 'https://iwf.sport/weightlifting_/competition-flow/' },
  prilepin: { ref: 'Tabella di Prilepin (1975, diari di pesisti sovietici)', finding: 'Sotto 80%: 3-6 rip per serie; 80-89%: 2-4; oltre 90%: 1-2. È una descrizione storica, non una prescrizione validata.', url: 'https://catalystathletics.com/article/2229/Prilepins-Table-for-Olympic-Weightlifting/' },
  wlInjury: { ref: 'Aasa et al. 2017 · Br J Sports Med (revisione sistematica)', finding: 'Infortuni: 2,4-3,3 ogni 1000 ore nella pesistica, 1,0-4,4 nel powerlifting; simili ad altri sport senza contatto. Zone: schiena, spalla, ginocchio.', url: 'https://pubmed.ncbi.nlm.nih.gov/27707741/' },
  pushups: { ref: 'Kikuchi & Nakazato 2017 · J Exerc Sci Fit', finding: 'Piegamenti e panca allo stesso carico relativo (~40% 1RM) danno crescita e forza simili in 8 settimane.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5812864' },
  calis: { ref: 'Kotarsky et al. 2018 · J Strength Cond Res', finding: 'Piegamenti con progressioni di difficoltà migliorano forza e spessore muscolare come la panca in 4 settimane.', url: 'https://pubmed.ncbi.nlm.nih.gov/29466268/' },
  skills: { ref: 'Stato delle prove sulle skill statiche (front lever, planche)', finding: 'Non ci sono studi controllati sulle progressioni delle skill: le sequenze tuck → advanced tuck → straddle → full sono convenzioni da allenatori.', url: 'https://calisteniapp.com/articles/Does-the-front-lever-and-planche-work-for-gaining-muscle-mass' },
  street: { ref: 'ISF · Regolamento tecnico streetlifting', finding: 'Gare su trazioni e dip zavorrati (formato classico), più muscle-up e squat (All4); tre tentativi; categorie di peso corporeo.', url: 'https://streetlifting.ru/docs/rules/ISF_EN_Technical_Rules_Book_Ver_3.1.pdf' },
  crossfit: { ref: 'Claudino et al. 2018 · Sports Medicine Open (revisione + meta-analisi)', finding: 'Pochi studi di alta qualità; nessun effetto significativo dimostrato nella meta-analisi; forte senso di comunità e motivazione.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5826907' },
  cfInjury: { ref: 'Meta-analisi 2021 · Dtsch Z Sportmed (14 studi)', finding: 'Infortuni nel CrossFit: circa 3,2 ogni 1000 ore di allenamento, prevalenza circa 30%.', url: 'https://www.germanjournalsportsmedicine.com/archive/archive-2021/issue-7/musculoskeletal-injuries-in-crossfitr-a-systematic-review-and-meta-analysis-of-injury-rates-and-locations/' },
  strongman: { ref: 'Hindle et al. 2019 · Sports Medicine Open (revisione sistematica)', finding: 'La biomeccanica degli attrezzi strongman (pietre, tronco, carry, slitta) ha applicazioni per atleti e preparatori.', url: 'https://research.bond.edu.au/en/publications/the-biomechanics-and-applications-of-strongman-exercises-a-system/' },
  smInjury: { ref: 'Winwood et al. 2014 · J Strength Cond Res (213 atleti)', finding: 'Strongman: 5,5 infortuni ogni 1000 ore di allenamento; zone più colpite schiena bassa (24%) e spalla (21%).', url: 'https://ro.ecu.edu.au/ecuworkspost2013/298' }
};

/** Principi generali, validi per tutte le discipline. */
export const PRINCIPLES = [
  { t: 'Volume', d: 'Per far crescere un muscolo punta ad almeno 10 serie allenanti a settimana; oltre 20 i benefici calano e conta il recupero.', ev: ['volume', 'volume2024'] },
  { t: 'Vicinanza al cedimento', d: 'Per l\'ipertrofia fermati a 0-3 ripetizioni dal cedimento; per la forza bastano 1-4 di riserva sulle alzate pesanti.', ev: ['failure'] },
  { t: 'Carico', d: 'Tra 5 e 30 ripetizioni i muscoli crescono in modo simile; per la forza massima servono carichi alti (sopra l\'80%).', ev: ['loads', 'strengthVsHyp'] },
  { t: 'Frequenza', d: 'Allena ogni muscolo almeno 2 volte a settimana soprattutto per distribuire bene il volume.', ev: ['frequency'] },
  { t: 'Recupero tra le serie', d: 'Almeno 60-90 s sui complementari, 2-5 minuti sui multiarticolari pesanti.', ev: ['rest'] },
  { t: 'Movimento completo', d: 'Usa tutto il range di movimento, con enfasi sulla parte in allungamento.', ev: ['rom'] },
  { t: 'Cardio', d: 'Il cardio non rovina forza e massa; se vuoi esplosività tienilo separato dai pesi di qualche ora.', ev: ['concurrent'] }
];

/**
 * Le discipline. Per ognuna:
 * - params: i numeri tipici (ripetizioni, carico, ripetizioni di riserva, recupero, serie, frequenza)
 * - core: gli esercizi che la definiscono (contano molto nei consigli)
 * - staples: complementari tipici
 * - equip / patterns: preferenze di attrezzo e di movimento (moltiplicatori nei consigli)
 */
export const DISCIPLINES = {
  bodybuilding: {
    name: 'Bodybuilding', short: 'BB', tagline: 'Massa muscolare, proporzioni e simmetria',
    about: 'Lo scopo è far crescere ogni muscolo in modo armonico. Si usano pesi liberi, cavi e macchine, con tanti esercizi diversi per colpire ogni muscolo da più angolazioni. La forza è un mezzo, non il fine.',
    goal: 'massa', reps: '8-12', rest: 120,
    params: { reps: '6-12 (anche 12-20 sui monoarticolari)', load: '65-80% 1RM', rir: '0-3', rest: '1,5-3 min', sets: '10-20 serie/muscolo a settimana', freq: 'Ogni muscolo 2+ volte a settimana' },
    core: ['p-panca-inclinata-manubri', 'p-lat-machine', 'p-pulley-basso', 'p-alzate-laterali-manubri', 'p-leg-press', 'p-stacco-rumeno', 'p-curl-manubri', 'p-pushdown-ai-cavi'],
    staples: ['p-croci-ai-cavi', 'p-pec-deck', 'p-hack-squat', 'p-leg-extension', 'p-leg-curl-seduto', 'p-alzate-laterali-ai-cavi', 'p-reverse-pec-deck', 'p-curl-su-panca-inclinata', 'p-estensioni-sopra-la-testa-ai-cavi', 'p-calf-in-piedi', 'p-row-machine', 'p-hip-thrust'],
    equip: { Cavi: 1.3, Macchina: 1.3, Manubri: 1.15, Bilanciere: 1, 'Corpo libero': 0.8, Kettlebell: 0.6, Altro: 0.6 },
    patterns: { croci: 1.3, laterali: 1.3, curl: 1.2, estensione: 1.2, 'leg-ext': 1.2, 'leg-curl': 1.2, olimpico: 0.2, trasporto: 0.4, skill: 0.4, esplosivo: 0.4 },
    advice: ['Scegli 1-2 esercizi per muscolo e cambiali ogni 6-12 settimane, non ogni seduta.', 'Porta al cedimento soprattutto i monoarticolari, meno i multiarticolari pesanti.', 'Cura i muscoli in ritardo: dagli più serie e mettili a inizio seduta.'],
    risks: 'Rischio di infortunio basso; attenzione a spalle e gomiti con volumi alti.',
    evidence: ['bbPrep', 'volume', 'failure', 'loads', 'rest', 'rom']
  },
  powerlifting: {
    name: 'Powerlifting', short: 'PL', tagline: 'Forza massima su squat, panca e stacco',
    about: 'Si gareggia su tre alzate con bilanciere: squat, panca piana e stacco da terra, con tre tentativi ciascuna. Conta il totale. L\'allenamento ruota attorno a queste alzate e alle loro varianti, con carichi alti e tecnica precisa.',
    goal: 'forza', reps: '3-5', rest: 210,
    params: { reps: '1-6 sulle alzate, 6-10 sui complementari', load: '75-95% 1RM', rir: '1-4 (RPE 6-9)', rest: '3-5 min sulle alzate', sets: '3-6 serie pesanti per alzata a settimana + volume complementare', freq: 'Ogni alzata 2-3 volte a settimana' },
    core: ['p-squat', 'p-panca-piana-bilanciere', 'p-stacco-da-terra'],
    staples: ['p-squat-con-fermo', 'p-panca-con-fermo', 'p-stacco-sumo', 'p-stacco-in-deficit', 'p-front-squat', 'p-panca-presa-stretta', 'p-rematore-bilanciere', 'p-stacco-rumeno', 'p-military-press', 'p-lat-machine', 'p-good-morning'],
    equip: { Bilanciere: 1.4, Manubri: 0.9, Cavi: 0.85, Macchina: 0.85, 'Corpo libero': 0.7, Kettlebell: 0.6, Altro: 0.6 },
    patterns: { squat: 1.3, hinge: 1.3, 'spinta-o': 1.3, croci: 0.6, laterali: 0.7, olimpico: 0.3, skill: 0.3 },
    advice: ['Usa l\'RPE: lascia 1-3 ripetizioni di riserva nelle serie pesanti, 0 solo nei test.', 'Varia l\'obiettivo nei giorni della settimana (pesante, medio, tecnico).', 'Le varianti con fermo migliorano i punti deboli e la tecnica.', 'Scarico ogni 4-8 settimane e picco di 1-3 settimane prima della gara.'],
    risks: '1,0-4,4 infortuni ogni 1000 ore; zone più colpite schiena, spalla, ginocchio.',
    evidence: ['minDose', 'rpe', 'dup', 'loads', 'failure', 'wlInjury']
  },
  weightlifting: {
    name: 'Pesistica olimpica', short: 'WL', tagline: 'Potenza, velocità e tecnica: strappo e slancio',
    about: 'Due alzate esplosive con bilanciere: lo strappo (da terra sopra la testa in un solo gesto) e lo slancio (girata al petto e poi slancio sopra la testa). Contano velocità, mobilità e coordinazione. Si lavora con poche ripetizioni e tanta tecnica.',
    goal: 'forza', reps: '1-3', rest: 150,
    params: { reps: '1-3 sulle alzate, 3-6 su squat e tirate', load: '70-90% nelle alzate, fino a 100-110% nelle tirate', rir: 'Lontano dal cedimento: conta la qualità', rest: '2-3 min', sets: '15-30 ripetizioni totali per alzata a seduta', freq: '4-6 sedute a settimana negli agonisti' },
    core: ['p-strappo', 'p-girata-e-slancio', 'p-front-squat', 'p-squat'],
    staples: ['p-power-clean', 'p-power-snatch', 'p-girata-dalla-sospensione', 'p-tirata-di-strappo', 'p-tirata-di-girata', 'p-split-jerk', 'p-push-press', 'p-overhead-squat', 'p-stacco-da-terra', 'p-box-jump'],
    equip: { Bilanciere: 1.5, Manubri: 0.7, Cavi: 0.5, Macchina: 0.5, 'Corpo libero': 0.8, Kettlebell: 0.7, Altro: 0.6 },
    patterns: { olimpico: 1.6, squat: 1.3, esplosivo: 1.3, hinge: 1.1, croci: 0.3, laterali: 0.4, curl: 0.3, estensione: 0.4, 'leg-ext': 0.4, 'leg-curl': 0.6 },
    advice: ['Prima la tecnica: carichi che puoi muovere veloci e puliti.', 'Le tirate senza ricezione allenano la tripla estensione con carichi più alti.', 'Lo squat frontale è il complementare principale per la girata.', 'Lavora sulla mobilità di caviglie, anche, spalle e polsi.'],
    risks: '2,4-3,3 infortuni ogni 1000 ore; zone più colpite schiena, spalla, ginocchio.',
    evidence: ['iwf', 'wlDerivatives', 'prilepin', 'wlInjury', 'concurrent']
  },
  powerbuilding: {
    name: 'Powerbuilding', short: 'PB', tagline: 'Forza da powerlifter, fisico da bodybuilder',
    about: 'Un ibrido: ogni seduta parte da un\'alzata pesante (squat, panca, stacco o military) a poche ripetizioni, poi prosegue con lavoro da bodybuilding a ripetizioni medie. Si cerca di diventare forti e grossi insieme.',
    goal: 'massa', reps: '4-6', rest: 150,
    params: { reps: '3-6 sull\'alzata principale, 8-15 sui complementari', load: '80-90% sulle principali, 65-75% sul resto', rir: '1-3 sulle principali, 0-2 sui complementari', rest: '3-4 min sulle principali, 1,5-2 sul resto', sets: '10-20 serie/muscolo a settimana', freq: '4-5 sedute (es. upper/lower o push/pull/legs)' },
    core: ['p-squat', 'p-panca-piana-bilanciere', 'p-stacco-da-terra', 'p-military-press', 'p-rematore-bilanciere'],
    staples: ['p-panca-inclinata-manubri', 'p-lat-machine', 'p-trazioni-alla-sbarra', 'p-stacco-rumeno', 'p-leg-press', 'p-alzate-laterali-manubri', 'p-curl-bilanciere', 'p-french-press', 'p-front-squat', 'p-hip-thrust'],
    equip: { Bilanciere: 1.3, Manubri: 1.15, Cavi: 1.1, Macchina: 1.1, 'Corpo libero': 0.9, Kettlebell: 0.6, Altro: 0.6 },
    patterns: { squat: 1.2, hinge: 1.2, 'spinta-o': 1.2, 'spinta-v': 1.15, 'tirata-o': 1.1, olimpico: 0.3, skill: 0.4 },
    advice: ['Una alzata pesante a inizio seduta, poi complementari a ripetizioni medie.', 'A parità di volume lo stile forza fa crescere come lo stile ipertrofia: unire i due ha senso.', 'Progressione semplice sulle principali (es. +2,5 kg a settimana finché regge).'],
    risks: 'Simili al powerlifting sulle alzate pesanti, al bodybuilding sul resto.',
    evidence: ['strengthVsHyp', 'volume', 'loads', 'dup', 'failure']
  },
  calisthenics: {
    name: 'Calisthenics', short: 'CA', tagline: 'Forza e controllo a corpo libero, skill alla sbarra',
    about: 'Ci si allena con il proprio peso alla sbarra, alle parallele e a terra. Due anime: le skill statiche (front lever, planche, verticale) e quelle dinamiche (muscle-up, piegamenti in verticale). Si progredisce rendendo l\'esercizio più difficile, non aggiungendo dischi.',
    goal: 'forma', reps: '5-10', rest: 120,
    params: { reps: '5-12 sulle dinamiche; tenute da 5-20 s sulle statiche', load: 'Progressioni di difficoltà (leve più lunghe, meno appoggi)', rir: '1-3; cedimento solo sulle facili', rest: '2-3 min su skill e forza', sets: '3-5 serie per skill, 10-20 serie/muscolo a settimana', freq: '3-5 sedute; skill anche ogni giorno a bassa intensità' },
    core: ['p-trazioni-alla-sbarra', 'p-dip-alle-parallele', 'p-piegamenti', 'p-muscle-up', 'p-front-lever', 'p-planche', 'p-verticale', 'p-l-sit'],
    staples: ['p-trazioni-australiane', 'p-handstand-push-up', 'p-pike-push-up', 'p-pistol-squat', 'p-leg-raise-alla-sbarra', 'p-back-lever', 'p-bulgarian-split-squat', 'p-plank'],
    equip: { 'Corpo libero': 1.6, Manubri: 0.6, Bilanciere: 0.4, Cavi: 0.4, Macchina: 0.3, Kettlebell: 0.6, Altro: 0.7 },
    patterns: { skill: 1.6, 'tirata-v': 1.3, 'spinta-o': 1.1, core: 1.2, croci: 0.4, 'leg-ext': 0.3, 'leg-curl': 0.4 },
    advice: ['Progredisci per varianti: tuck → advanced tuck → straddle → completo.', 'Alterna skill (poche ripetizioni, freschi, a inizio seduta) e forza di base.', 'Non trascurare le gambe: pistol, split squat, salti.', 'I piegamenti con progressioni valgono la panca per petto e tricipiti.'],
    risks: 'Gomiti, polsi e spalle sotto stress nelle skill: progressione graduale e riscaldamento specifico.',
    evidence: ['pushups', 'calis', 'skills', 'loads', 'failure']
  },
  streetlifting: {
    name: 'Streetlifting', short: 'SL', tagline: 'Forza massima a corpo libero, con zavorra',
    about: 'È il powerlifting del calisthenics: si gareggia su trazioni e dip con zavorre pesanti (formato classico), e nel formato All4 anche muscle-up e squat. Tre tentativi per alzata, conta il totale per categoria di peso.',
    goal: 'forza', reps: '3-5', rest: 210,
    params: { reps: '1-5 zavorrati, 6-12 a corpo libero', load: '80-95% del massimale zavorrato', rir: '1-3', rest: '3-5 min', sets: '3-6 serie pesanti per alzata a settimana + volume a corpo libero', freq: 'Trazioni e dip 2-3 volte a settimana' },
    core: ['p-trazioni-zavorrate', 'p-dip-zavorrati', 'p-muscle-up-zavorrato', 'p-squat'],
    staples: ['p-trazioni-alla-sbarra', 'p-dip-alle-parallele', 'p-muscle-up', 'p-rematore-bilanciere', 'p-panca-presa-stretta', 'p-curl-bilanciere', 'p-front-squat', 'p-stacco-rumeno'],
    equip: { 'Corpo libero': 1.4, Altro: 1.2, Bilanciere: 1.1, Manubri: 0.8, Cavi: 0.8, Macchina: 0.6, Kettlebell: 0.7 },
    patterns: { 'tirata-v': 1.5, 'spinta-o': 1.2, squat: 1.2, skill: 0.9, croci: 0.4, laterali: 0.6 },
    advice: ['Programma come nel powerlifting: RPE, serie pesanti, variazione nella settimana.', 'Tecnica di gara: trazione con mento sopra la sbarra, dip con spalla sotto il gomito e blocco in alto.', 'Usa anche il volume a corpo libero per crescere.'],
    risks: 'Gomiti e spalle (bicipite, tendini): aumenta la zavorra a piccoli passi.',
    evidence: ['street', 'minDose', 'rpe', 'calis']
  },
  crossfit: {
    name: 'CrossFit', short: 'CF', tagline: 'Condizionamento completo: pesi, ginnastica, cardio',
    about: 'Allenamento funzionale ad alta intensità che mescola sollevamento pesi, ginnastica a corpo libero e cardio in circuiti a tempo (WOD: AMRAP, EMOM, For Time). L\'obiettivo è essere bravi in tutto, non il massimo in una cosa sola.',
    goal: 'resistenza', reps: '10-15', rest: 60,
    params: { reps: 'Da 1-5 (forza) a 15-30+ (metcon)', load: 'Da leggero a pesante, spesso moderato e veloce', rir: 'Variabile; la tecnica non deve crollare sotto fatica', rest: 'Brevi o nulli nei WOD, 2-3 min nella parte di forza', sets: 'Parte di forza + WOD da 8-20 minuti', freq: '3-5 sedute; giorni di riposo programmati' },
    core: ['p-thruster', 'p-wall-ball', 'p-kettlebell-swing', 'p-burpee', 'p-box-jump', 'p-power-clean', 'p-trazioni-alla-sbarra', 'p-vogatore'],
    staples: ['p-double-under', 'p-toes-to-bar', 'p-push-press', 'p-front-squat', 'p-stacco-da-terra', 'p-handstand-push-up', 'p-muscle-up', 'p-air-bike', 'p-corda', 'p-overhead-squat', 'p-power-snatch'],
    equip: { Kettlebell: 1.3, 'Corpo libero': 1.3, Bilanciere: 1.2, Altro: 1.2, Manubri: 1.1, Cavi: 0.6, Macchina: 0.8 },
    patterns: { esplosivo: 1.4, olimpico: 1.2, cardio: 1.3, skill: 1.0, croci: 0.5, laterali: 0.6, 'leg-ext': 0.4, 'leg-curl': 0.5 },
    advice: ['Separa la parte di forza dal circuito; se vuoi esplosività tieni il cardio lontano dai pesi.', 'Riduci il carico o la difficoltà (scaling) prima che la tecnica peggiori.', 'Controlla il carico settimanale: è la lacuna principale segnalata dagli studi.'],
    risks: 'Circa 3,2 infortuni ogni 1000 ore (spalla e schiena); la fatica sulla tecnica è il fattore chiave.',
    evidence: ['crossfit', 'cfInjury', 'concurrent', 'loads']
  },
  strongman: {
    name: 'Strongman', short: 'SM', tagline: 'Forza brutale con oggetti pesanti e scomodi',
    about: 'Si sollevano e trasportano oggetti non convenzionali: pietre atlas, tronco (log), giogo (yoke), farmer, slitte, pneumatici. Serve forza massima, presa, schiena solida e resistenza a sforzi di 30-60 secondi.',
    goal: 'forza', reps: '3-6', rest: 180,
    params: { reps: '1-5 sulle massimali, 20-60 s sugli eventi a tempo', load: 'Alto sugli eventi, 75-90% sui fondamentali in palestra', rir: '1-3; cedimento raro', rest: '3-5 min', sets: '1 giorno eventi + 2-3 giorni palestra a settimana', freq: '3-4 sedute' },
    core: ['p-atlas-stone', 'p-log-press', 'p-yoke', 'p-farmer-walk', 'p-stacco-da-terra', 'p-squat'],
    staples: ['p-stacco-con-axle', 'p-spinta-della-slitta', 'p-ribaltamento-pneumatico', 'p-trasporto-sacco', 'p-push-press', 'p-front-squat', 'p-rematore-bilanciere', 'p-hip-thrust', 'p-military-press'],
    equip: { Altro: 1.5, Bilanciere: 1.3, Manubri: 0.9, Kettlebell: 0.9, 'Corpo libero': 0.7, Cavi: 0.6, Macchina: 0.7 },
    patterns: { trasporto: 1.6, hinge: 1.3, 'spinta-v': 1.3, squat: 1.15, croci: 0.4, laterali: 0.6, skill: 0.3 },
    advice: ['Un giorno a settimana sugli eventi, il resto sui fondamentali in palestra.', 'Rinforza schiena bassa, presa e core: sono le zone più sollecitate.', 'Impara la tecnica degli attrezzi con carichi bassi.'],
    risks: '5,5 infortuni ogni 1000 ore, il più alto tra gli sport di forza; schiena bassa (24%) e spalla (21%).',
    evidence: ['strongman', 'smInjury', 'minDose']
  }
};
export const DISCIPLINE_IDS = Object.keys(DISCIPLINES);

/** Peso di ogni disciplina scelta: la prima (principale) conta di più. */
export function disciplineWeights(list) {
  const out = {};
  (list || []).forEach((id, i) => { if (DISCIPLINES[id] && out[id] == null) out[id] = i === 0 ? 1 : 0.5; });
  return out;
}
/** Quanto un esercizio è adatto alle discipline scelte (0 = neutro, positivo = molto adatto). */
export function affinity(list, ex) {
  const w = disciplineWeights(list);
  let s = 0;
  for (const [id, k] of Object.entries(w)) {
    const d = DISCIPLINES[id];
    let x = 0;
    if (d.core.includes(ex.id)) x += 2.5;
    else if (d.staples.includes(ex.id)) x += 1.4;
    x += ((d.equip[ex.equip] ?? 1) - 1) * 2;
    x += ((d.patterns[ex.pattern] ?? 1) - 1) * 2;
    s += x * k;
  }
  return s;
}
/** Il perché un esercizio è adatto, per la spiegazione dei consigli. */
export function affinityWhy(list, ex) {
  const main = (list || []).find(id => DISCIPLINES[id]);
  if (!main) return '';
  const d = DISCIPLINES[main];
  if (d.core.includes(ex.id)) return `fondamentale nel ${d.name.toLowerCase()}`;
  if (d.staples.includes(ex.id)) return `tipico del ${d.name.toLowerCase()}`;
  return '';
}
