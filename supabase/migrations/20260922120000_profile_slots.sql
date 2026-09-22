-- Concierge backend, P1.5: progressive Analisi di Valore profile (docs/PROFILE_SLOTS.md).
--
-- Two tables:
--   profile_slot_catalog   Fixed reference data (which questions exist, their chapter, whether
--                           they're one of the welcome-interview 8). Not tenant data: readable by
--                           any authenticated user, like ai_system_config's own reference rows.
--   center_profile_slots   The actual per-center answers. Tenant data: RLS by membership, same
--                           shape as client_notes (members read/insert/update, owner deletes).
--
-- The catalog seed below is generated 1:1 from docs/PROFILE_SLOTS.md, which is itself generated
-- from the same source list as this file (see that doc's own header) -- if the two ever need to
-- change, change both from that one list, not by hand in two places.

-- ============================ 1) profile_slot_catalog ============================
CREATE TABLE IF NOT EXISTS public.profile_slot_catalog (
  slot_key text PRIMARY KEY,
  chapter text NOT NULL CHECK (chapter IN ('identita', 'gestione', 'numeri', 'clienti', 'marketing', 'team', 'obiettivi')),
  question_number smallint NOT NULL CHECK (question_number BETWEEN 1 AND 75),
  label text NOT NULL,
  is_welcome_interview boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL
);

ALTER TABLE public.profile_slot_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read the slot catalog" ON public.profile_slot_catalog;
CREATE POLICY "Authenticated users read the slot catalog"
ON public.profile_slot_catalog FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins manage the slot catalog" ON public.profile_slot_catalog;
CREATE POLICY "Admins manage the slot catalog"
ON public.profile_slot_catalog FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.profile_slot_catalog TO authenticated;

-- Idempotent reseed: this table is 75 fixed rows, not user data, so a plain upsert-by-key is
-- simpler and safer to re-run than the seed_demo_center_aurora.sql "never touch an existing row"
-- pattern (there is no "someone's own edit" to protect here).
INSERT INTO public.profile_slot_catalog (slot_key, chapter, question_number, label, is_welcome_interview, sort_order)
VALUES
  ('tipologia', 'identita', 1, 'Tipologia del centro (estetico / spa / benessere / salone / istituto)', true, 1),
  ('anno_apertura_orari', 'identita', 2, 'Anno di apertura e orari di lavoro', false, 2),
  ('dimensioni', 'identita', 3, 'Metratura, numero cabine, reception, receptionist, area diagnosi, ufficio', true, 3),
  ('localizzazione', 'identita', 4, 'Zona/localizzazione, marchi cosmesi/make-up/nails, tecnologie presenti', false, 4),
  ('pianificazione_lavoro', 'gestione', 5, 'Come pianifichi il lavoro (annuale/mensile/settimanale/giornaliero)', false, 5),
  ('ore_cabina_settimanali', 'gestione', 6, 'Ore settimanali passate in cabina', true, 6),
  ('ore_gestione_settimanali', 'gestione', 7, 'Ore settimanali dedicate alla gestione dell''azienda', false, 7),
  ('protocolli_scritti', 'gestione', 8, 'Protocolli scritti per ogni servizio/trattamento', false, 8),
  ('procedure_scritte', 'gestione', 9, 'Procedure scritte per le azioni operative (accoglienza, pulizie, telefono...)', false, 9),
  ('organigramma_scritto', 'gestione', 10, 'Organigramma e mansionario scritti', false, 10),
  ('responsabili_attivita', 'gestione', 11, 'Chi si occupa di ciascuna attività (accoglienza, agenda, marketing, magazzino, contabilità...) e rapporto col commercialista', false, 11),
  ('frequenza_controllo_incassi', 'numeri', 12, 'Ogni quanto controlli spese e incassi', false, 12),
  ('metodo_controllo_uscite', 'numeri', 13, 'Come controlli le uscite (scadenziario/excel/gestionale)', false, 13),
  ('metodo_controllo_incassi', 'numeri', 14, 'Come controlli gli incassi (corrispettivi/excel/gestionale, dettaglio per servizio)', true, 14),
  ('obiettivi_incasso_pianificati', 'numeri', 15, 'Programmi gli obiettivi di incasso su spese + stipendio + utili', false, 15),
  ('stipendio_titolare_regolare', 'numeri', 16, 'Ti riservi uno stipendio di almeno 1.500€ regolarmente', false, 16),
  ('copertura_spese_mensili', 'numeri', 17, 'Copri tutte le spese (incluso stipendio e tasse) ogni mese', false, 17),
  ('costo_minuto_ora', 'numeri', 18, 'Conosci il costo al minuto/ora dell''azienda; margine al minuto e all''ora', false, 18),
  ('utili_ultimo_anno', 'numeri', 19, 'L''azienda ha fatto utili nell''ultimo anno, e quanto', false, 19),
  ('obiettivo_utili_anno_corrente', 'numeri', 20, 'Hai programmato l''obiettivo di utili per l''anno in corso', false, 20),
  ('andamento_triennale', 'numeri', 21, 'Andamento dell''attività negli ultimi 3 anni (cresciuta/diminuita/uguale)', false, 21),
  ('clienti_attivi_fascia', 'clienti', 22, 'Fascia di clienti attivi (almeno 1 visita/mese)', true, 22),
  ('supporto_database_clienti', 'clienti', 23, 'Supporto usato per il database clienti (carta/gestionale/excel)', false, 23),
  ('frequenza_aggiornamento_database', 'clienti', 24, 'Ogni quanto aggiorni il database clienti', false, 24),
  ('clienti_passivi_fascia', 'clienti', 25, 'Fascia di clienti passivi (non visti da mesi)', false, 25),
  ('mix_servizi_trattamenti', 'clienti', 26, 'Mix servizi base vs trattamenti ad alta marginalità (% viso/corpo)', true, 26),
  ('trattamenti_piu_eseguiti', 'clienti', 27, 'Trattamento/i più eseguiti', false, 27),
  ('andamento_agenda', 'clienti', 28, 'Com''è l''agenda appuntamenti (piena, a buchi, stagionale...)', false, 28),
  ('modalita_fissazione_appuntamenti', 'clienti', 29, 'Come fissi gli appuntamenti ai clienti', false, 29),
  ('pagamento_anticipato_percorsi', 'clienti', 30, 'Fai pagare in anticipo programmi/abbonamenti/percorsi', false, 30),
  ('strumenti_fidelizzazione', 'clienti', 31, 'Strumenti di fidelizzazione usati (punti/prepagati/abbonamenti)', false, 31),
  ('descrizione_fidelizzazione', 'clienti', 32, 'Come funzionano gli strumenti di fidelizzazione', false, 32),
  ('check_diagnosi_iniziale', 'clienti', 33, 'Diagnosi/check a tutti i clienti prima di un trattamento', false, 33),
  ('tipologia_check', 'clienti', 34, 'Tipologia di check eseguito (visiva/morfologica/Wood/bioimpedenziometria/termografia/IA)', false, 34),
  ('scheda_cliente_compilata', 'clienti', 35, 'Scheda cliente compilata regolarmente per ogni cliente', false, 35),
  ('scheda_checkup_utilizzata', 'clienti', 36, 'Scheda check-up utilizzata in fase di diagnosi', false, 36),
  ('frequenza_checkup', 'clienti', 37, 'Ogni quanto effettui il check-up ai clienti', false, 37),
  ('percorsi_includono_autocura', 'clienti', 38, 'I percorsi proposti includono prodotti per l''autocura domiciliare', false, 38),
  ('acquisto_autocura_domiciliare', 'clienti', 39, 'I clienti acquistano i prodotti di autocura domiciliare', false, 39),
  ('base_proposta_fidelizzazione', 'clienti', 40, 'Su cosa basi la proposta al cliente (diagnosi/promo casa/promo mese/stagione)', false, 40),
  ('tasso_accettazione_proposta', 'clienti', 41, 'Percentuale di accettazione delle proposte', false, 41),
  ('concorrenti', 'marketing', 42, 'Concorrenti (distanza, servizi offerti, clientela)', false, 42),
  ('differenziazione_competitor', 'marketing', 43, 'Cosa fai di diverso dai concorrenti, punti di forza/debolezza', false, 43),
  ('trattamenti_piu_richiesti', 'marketing', 44, 'Trattamenti per cui sei più conosciuto/richiesto, in ordine', false, 44),
  ('specializzazione_desiderata', 'marketing', 45, 'Specializzazione desiderata per il centro', false, 45),
  ('cliente_target', 'marketing', 46, 'Cliente target: bisogno, sesso, età, stile di vita, professione, abitudini, modalità d''acquisto', false, 46),
  ('strategie_acquisizione_target', 'marketing', 47, 'Hai strategie definite per l''acquisizione del cliente target', false, 47),
  ('strategie_acquisizione_dettaglio', 'marketing', 48, 'Quali sono le strategie di acquisizione', false, 48),
  ('strategie_fidelizzazione_marketing', 'marketing', 49, 'Utilizzi strategie di fidelizzazione del cliente', false, 49),
  ('strategie_fidelizzazione_dettaglio', 'marketing', 50, 'Quali sono le strategie di fidelizzazione', false, 50),
  ('iniziative_promozioni', 'marketing', 51, 'Iniziative e promozioni (esempio)', false, 51),
  ('presenza_social', 'marketing', 52, 'Pagina social: piattaforme, nome, gestore, fan, recensioni, frequenza post, regola 60/20/20, engagement', false, 52),
  ('pubblicita_facebook', 'marketing', 53, 'Pubblicità Facebook: fatta, cosa promosso, targeting, risultati', false, 53),
  ('sito_blog', 'marketing', 54, 'Sito/blog presente e frequenza di pubblicazione', false, 54),
  ('canale_youtube', 'marketing', 55, 'Canale YouTube presente, frequenza, views medie', false, 55),
  ('altri_canali_comunicazione', 'marketing', 56, 'Altri canali di comunicazione usati (Pinterest, newsletter, stampa...)', false, 56),
  ('collaborazioni_partnership', 'marketing', 57, 'Collaborazioni/partnership/co-marketing con altre attività', false, 57),
  ('struttura_collaborazioni', 'marketing', 58, 'Come sono strutturate le collaborazioni', false, 58),
  ('passaparola_testimonial', 'marketing', 59, 'Azioni di passaparola tramite clienti testimonial', false, 59),
  ('numero_collaboratori', 'team', 60, 'Numero di collaboratrici/collaboratori', true, 60),
  ('anzianita_ruoli_team', 'team', 61, 'Da quanto lavorano con te e quali sono i loro ruoli', false, 61),
  ('valutazione_team', 'team', 62, 'Caratteristiche positive e negative di ciascun membro del team', false, 62),
  ('frequenza_selezione_personale', 'team', 63, 'Ogni quanto fai ricerca e selezione del personale', false, 63),
  ('metodo_selezione_personale', 'team', 64, 'Come selezioni le collaboratrici/i collaboratori', false, 64),
  ('frequenza_riunioni_team', 'team', 65, 'Ogni quanto fai riunione con il team', false, 65),
  ('squadra_affiatata', 'team', 66, 'Siete una squadra affiatata, perché', false, 66),
  ('metodo_motivazione_team', 'team', 67, 'Come motivi il team', false, 67),
  ('incentivi_economici', 'team', 68, 'Sono previsti incentivi economici', false, 68),
  ('struttura_incentivi', 'team', 69, 'Come sono strutturati gli incentivi (% vendita, a obiettivo...)', false, 69),
  ('lavoro_per_obiettivi', 'team', 70, 'I collaboratori lavorano per obiettivi (periodicità, controllo)', false, 70),
  ('corsi_formazione_tecnica_anno', 'team', 71, 'Corsi di formazione tecnica nell''ultimo anno', false, 71),
  ('corsi_formazione_gestionale_anno', 'team', 72, 'Corsi di marketing/comunicazione/vendita/gestione nell''ultimo anno', false, 72),
  ('collaborazioni_freelance', 'team', 73, 'Collaborazioni con free lance', false, 73),
  ('regolamento_disciplinare', 'team', 74, 'Regolamento disciplinare aziendale', false, 74),
  ('obiettivi_futuri', 'obiettivi', 75, 'Obiettivi strutturali, economici e progetti futuri, aziendali e personali', true, 75)
ON CONFLICT (slot_key) DO UPDATE SET
  chapter = EXCLUDED.chapter,
  question_number = EXCLUDED.question_number,
  label = EXCLUDED.label,
  is_welcome_interview = EXCLUDED.is_welcome_interview,
  sort_order = EXCLUDED.sort_order;

-- ============================ 2) center_profile_slots ============================
CREATE TABLE IF NOT EXISTS public.center_profile_slots (
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  slot_key text NOT NULL REFERENCES public.profile_slot_catalog(slot_key),
  value jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('interview', 'conversation', 'computed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (center_id, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_center_profile_slots_center ON public.center_profile_slots (center_id);

ALTER TABLE public.center_profile_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read center profile slots" ON public.center_profile_slots;
CREATE POLICY "Members read center profile slots"
ON public.center_profile_slots FOR SELECT USING (public.is_center_member(center_id));

DROP POLICY IF EXISTS "Members insert center profile slots" ON public.center_profile_slots;
CREATE POLICY "Members insert center profile slots"
ON public.center_profile_slots FOR INSERT WITH CHECK (public.is_center_member(center_id));

DROP POLICY IF EXISTS "Members update center profile slots" ON public.center_profile_slots;
CREATE POLICY "Members update center profile slots"
ON public.center_profile_slots FOR UPDATE
USING (public.is_center_member(center_id)) WITH CHECK (public.is_center_member(center_id));

DROP POLICY IF EXISTS "Owner deletes center profile slots" ON public.center_profile_slots;
CREATE POLICY "Owner deletes center profile slots"
ON public.center_profile_slots FOR DELETE USING (public.center_role(center_id) = 'owner');

DROP TRIGGER IF EXISTS trg_center_profile_slots_updated_at ON public.center_profile_slots;
CREATE TRIGGER trg_center_profile_slots_updated_at
BEFORE UPDATE ON public.center_profile_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.center_profile_slots TO authenticated;

-- ============================ DOWN (manual rollback) ============================
-- DROP TRIGGER IF EXISTS trg_center_profile_slots_updated_at ON public.center_profile_slots;
-- DROP TABLE IF EXISTS public.center_profile_slots;
-- DROP TABLE IF EXISTS public.profile_slot_catalog;
