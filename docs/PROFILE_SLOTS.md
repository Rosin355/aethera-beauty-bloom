# Profile slots — Analisi di Valore → `center_profile_slots` (P1.5)

Source: `aethera_md_pack/knowledge_base_4E.md`, "Analisi di Valore (questionario diagnostico)"
(the same text is in `ai_training_data`/the knowledge base the concierge already searches via
`ctx.knowledge`). 75 questions, Q1–Q75, grouped into 7 chapters by the questionnaire's own section
headers. Every `slot_key` below is seeded into `public.profile_slot_catalog`
(migration `20260922120000_profile_slots.sql`) — that table, not this file, is what the tools
actually read; this file exists so the mapping is reviewable and has one written rationale.

**The welcome-interview 8** (Q1, Q3, Q6, Q14, Q22, Q26, Q60, Q75 — marked ★ below) are the slots
`generate_first_reading`/`get_missing_slots` treat as highest priority: the concierge should try
to have these before anything else, mirroring the native app's own 8-question welcome interview
(`QuattroElementi/Data/MockData.swift interviewSteps`). They carry 3× the completeness weight of
every other slot (`tools/profile_completeness.ts`) — see "Completeness %" below. This does not
claim a 1:1 topic match with the app's 8 mock questions (e.g. the app's "com'è una tua giornata
piena" has no equivalent question here); it is the backend's own priority set over the full 75.

**Value shape.** `center_profile_slots.value` is `jsonb`: a plain string for a single-choice or
free-text answer, an array for a repeatable one (competitors, team members), an object for a
composite question (a multi-part question stays one slot — e.g. Q46 "cliente target" bundles sex,
age, lifestyle... into one object — because that's how the concierge would naturally learn it in
one exchange, not one interrogation per sub-field). No `jsonb` shape is enforced by a CHECK
constraint: `set_profile_slot` accepts whatever the model captured, matching the framework's
"tools return/accept data, never invent structure the conversation doesn't have" philosophy.

**Source.** Every slot row also carries `source`: `'interview'` (the app's own 8-question
onboarding, once P3.3 wires it), `'conversation'` (mentioned in passing to the concierge —
`set_profile_slot`'s normal path, confirm-not-required, see docs/CONCIERGE_TOOLS.md §4), or
`'computed'` (derived from real data instead of asked — reserved for later; nothing computes one
yet).

**Completeness %.** `answered_weight / total_weight × 100`, rounded. Weight is 3 for a
welcome-interview slot, 1 for every other — so the 8 priority slots (24 of the total 91 weight
points) count for roughly a quarter of completeness on their own, even though they're only
8 of 75 questions. `tools/profile_completeness.ts` is the one implementation; `get_center_profile`
and `generate_first_reading` both call it so the number can never drift between the two.


## Identità del centro (`identita`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 1 | `tipologia` | Tipologia del centro (estetico / spa / benessere / salone / istituto) | ★ |
| 2 | `anno_apertura_orari` | Anno di apertura e orari di lavoro |  |
| 3 | `dimensioni` | Metratura, numero cabine, reception, receptionist, area diagnosi, ufficio | ★ |
| 4 | `localizzazione` | Zona/localizzazione, marchi cosmesi/make-up/nails, tecnologie presenti |  |


## Gestione e organizzazione del lavoro (`gestione`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 5 | `pianificazione_lavoro` | Come pianifichi il lavoro (annuale/mensile/settimanale/giornaliero) |  |
| 6 | `ore_cabina_settimanali` | Ore settimanali passate in cabina | ★ |
| 7 | `ore_gestione_settimanali` | Ore settimanali dedicate alla gestione dell'azienda |  |
| 8 | `protocolli_scritti` | Protocolli scritti per ogni servizio/trattamento |  |
| 9 | `procedure_scritte` | Procedure scritte per le azioni operative (accoglienza, pulizie, telefono...) |  |
| 10 | `organigramma_scritto` | Organigramma e mansionario scritti |  |
| 11 | `responsabili_attivita` | Chi si occupa di ciascuna attività (accoglienza, agenda, marketing, magazzino, contabilità...) e rapporto col commercialista |  |


## I numeri dell'azienda (`numeri`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 12 | `frequenza_controllo_incassi` | Ogni quanto controlli spese e incassi |  |
| 13 | `metodo_controllo_uscite` | Come controlli le uscite (scadenziario/excel/gestionale) |  |
| 14 | `metodo_controllo_incassi` | Come controlli gli incassi (corrispettivi/excel/gestionale, dettaglio per servizio) | ★ |
| 15 | `obiettivi_incasso_pianificati` | Programmi gli obiettivi di incasso su spese + stipendio + utili |  |
| 16 | `stipendio_titolare_regolare` | Ti riservi uno stipendio di almeno 1.500€ regolarmente |  |
| 17 | `copertura_spese_mensili` | Copri tutte le spese (incluso stipendio e tasse) ogni mese |  |
| 18 | `costo_minuto_ora` | Conosci il costo al minuto/ora dell'azienda; margine al minuto e all'ora |  |
| 19 | `utili_ultimo_anno` | L'azienda ha fatto utili nell'ultimo anno, e quanto |  |
| 20 | `obiettivo_utili_anno_corrente` | Hai programmato l'obiettivo di utili per l'anno in corso |  |
| 21 | `andamento_triennale` | Andamento dell'attività negli ultimi 3 anni (cresciuta/diminuita/uguale) |  |


## I clienti (`clienti`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 22 | `clienti_attivi_fascia` | Fascia di clienti attivi (almeno 1 visita/mese) | ★ |
| 23 | `supporto_database_clienti` | Supporto usato per il database clienti (carta/gestionale/excel) |  |
| 24 | `frequenza_aggiornamento_database` | Ogni quanto aggiorni il database clienti |  |
| 25 | `clienti_passivi_fascia` | Fascia di clienti passivi (non visti da mesi) |  |
| 26 | `mix_servizi_trattamenti` | Mix servizi base vs trattamenti ad alta marginalità (% viso/corpo) | ★ |
| 27 | `trattamenti_piu_eseguiti` | Trattamento/i più eseguiti |  |
| 28 | `andamento_agenda` | Com'è l'agenda appuntamenti (piena, a buchi, stagionale...) |  |
| 29 | `modalita_fissazione_appuntamenti` | Come fissi gli appuntamenti ai clienti |  |
| 30 | `pagamento_anticipato_percorsi` | Fai pagare in anticipo programmi/abbonamenti/percorsi |  |
| 31 | `strumenti_fidelizzazione` | Strumenti di fidelizzazione usati (punti/prepagati/abbonamenti) |  |
| 32 | `descrizione_fidelizzazione` | Come funzionano gli strumenti di fidelizzazione |  |
| 33 | `check_diagnosi_iniziale` | Diagnosi/check a tutti i clienti prima di un trattamento |  |
| 34 | `tipologia_check` | Tipologia di check eseguito (visiva/morfologica/Wood/bioimpedenziometria/termografia/IA) |  |
| 35 | `scheda_cliente_compilata` | Scheda cliente compilata regolarmente per ogni cliente |  |
| 36 | `scheda_checkup_utilizzata` | Scheda check-up utilizzata in fase di diagnosi |  |
| 37 | `frequenza_checkup` | Ogni quanto effettui il check-up ai clienti |  |
| 38 | `percorsi_includono_autocura` | I percorsi proposti includono prodotti per l'autocura domiciliare |  |
| 39 | `acquisto_autocura_domiciliare` | I clienti acquistano i prodotti di autocura domiciliare |  |
| 40 | `base_proposta_fidelizzazione` | Su cosa basi la proposta al cliente (diagnosi/promo casa/promo mese/stagione) |  |
| 41 | `tasso_accettazione_proposta` | Percentuale di accettazione delle proposte |  |


## Marketing (`marketing`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 42 | `concorrenti` | Concorrenti (distanza, servizi offerti, clientela) |  |
| 43 | `differenziazione_competitor` | Cosa fai di diverso dai concorrenti, punti di forza/debolezza |  |
| 44 | `trattamenti_piu_richiesti` | Trattamenti per cui sei più conosciuto/richiesto, in ordine |  |
| 45 | `specializzazione_desiderata` | Specializzazione desiderata per il centro |  |
| 46 | `cliente_target` | Cliente target: bisogno, sesso, età, stile di vita, professione, abitudini, modalità d'acquisto |  |
| 47 | `strategie_acquisizione_target` | Hai strategie definite per l'acquisizione del cliente target |  |
| 48 | `strategie_acquisizione_dettaglio` | Quali sono le strategie di acquisizione |  |
| 49 | `strategie_fidelizzazione_marketing` | Utilizzi strategie di fidelizzazione del cliente |  |
| 50 | `strategie_fidelizzazione_dettaglio` | Quali sono le strategie di fidelizzazione |  |
| 51 | `iniziative_promozioni` | Iniziative e promozioni (esempio) |  |
| 52 | `presenza_social` | Pagina social: piattaforme, nome, gestore, fan, recensioni, frequenza post, regola 60/20/20, engagement |  |
| 53 | `pubblicita_facebook` | Pubblicità Facebook: fatta, cosa promosso, targeting, risultati |  |
| 54 | `sito_blog` | Sito/blog presente e frequenza di pubblicazione |  |
| 55 | `canale_youtube` | Canale YouTube presente, frequenza, views medie |  |
| 56 | `altri_canali_comunicazione` | Altri canali di comunicazione usati (Pinterest, newsletter, stampa...) |  |
| 57 | `collaborazioni_partnership` | Collaborazioni/partnership/co-marketing con altre attività |  |
| 58 | `struttura_collaborazioni` | Come sono strutturate le collaborazioni |  |
| 59 | `passaparola_testimonial` | Azioni di passaparola tramite clienti testimonial |  |


## Il team (`team`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 60 | `numero_collaboratori` | Numero di collaboratrici/collaboratori | ★ |
| 61 | `anzianita_ruoli_team` | Da quanto lavorano con te e quali sono i loro ruoli |  |
| 62 | `valutazione_team` | Caratteristiche positive e negative di ciascun membro del team |  |
| 63 | `frequenza_selezione_personale` | Ogni quanto fai ricerca e selezione del personale |  |
| 64 | `metodo_selezione_personale` | Come selezioni le collaboratrici/i collaboratori |  |
| 65 | `frequenza_riunioni_team` | Ogni quanto fai riunione con il team |  |
| 66 | `squadra_affiatata` | Siete una squadra affiatata, perché |  |
| 67 | `metodo_motivazione_team` | Come motivi il team |  |
| 68 | `incentivi_economici` | Sono previsti incentivi economici |  |
| 69 | `struttura_incentivi` | Come sono strutturati gli incentivi (% vendita, a obiettivo...) |  |
| 70 | `lavoro_per_obiettivi` | I collaboratori lavorano per obiettivi (periodicità, controllo) |  |
| 71 | `corsi_formazione_tecnica_anno` | Corsi di formazione tecnica nell'ultimo anno |  |
| 72 | `corsi_formazione_gestionale_anno` | Corsi di marketing/comunicazione/vendita/gestione nell'ultimo anno |  |
| 73 | `collaborazioni_freelance` | Collaborazioni con free lance |  |
| 74 | `regolamento_disciplinare` | Regolamento disciplinare aziendale |  |


## Obiettivi (`obiettivi`)

| Q | slot_key | Domanda (sintesi) | ★ |
|---|---|---|---|
| 75 | `obiettivi_futuri` | Obiettivi strutturali, economici e progetti futuri, aziendali e personali | ★ |

