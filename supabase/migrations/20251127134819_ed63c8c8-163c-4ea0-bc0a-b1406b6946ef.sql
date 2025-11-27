-- Create ai_system_config table for configurable AI instructions
CREATE TABLE public.ai_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage AI config
CREATE POLICY "Admins can manage ai_system_config"
ON public.ai_system_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert the 11 operational modules as AI instructions
INSERT INTO public.ai_system_config (config_key, config_value, description, sort_order) VALUES
('module_1_standardizzazione', 
'STANDARDIZZAZIONE SISTEMI OPERATIVI (Manuale Digitale Unificato):
- Creazione di template per ogni funzione aziendale
- Protocolli cabina per ogni trattamento
- Procedure reception (accoglienza, check-out, gestione emergenze)
- Mansionari per ogni ruolo (Titolare, Receptionist, Specialiste, Marketing)
- Routine operative: briefing, riunioni settimanali, report mensili
- Output: Manuale operativo digitale integrabile nella piattaforma IA e aggiornabile',
'Modulo 1: Standardizzazione sistemi operativi', 1),

('module_2_dashboard_kpi',
'DASHBOARD KPI INTERATTIVA:
- Dati raccolti: Costo orario medio e per operatore, Fish media e scontrino medio, % vendite trattamenti/prodotti, Obiettivi giornalieri/settimanali/mensili
- Visualizzazione: Semafori (verde-giallo-rosso), Grafici andamento per KPI, Report automatico IA settimanale',
'Modulo 2: Dashboard KPI interattiva', 2),

('module_3_automazioni_clienti',
'MODULO AUTOMAZIONI CLIENTI (CRM & WhatsApp API):
- Follow-up post trattamento con promemoria e ringraziamento
- Recupero clienti passivi (segmentati per tempo di inattività)
- Reminder pacchetti, abbonamenti, scadenze
- Proposte automatiche in base a diagnosi, storico e profilo cliente',
'Modulo 3: Automazioni clienti', 3),

('module_4_raccomandazione_dinamico',
'MOTORE DI RACCOMANDAZIONE DINAMICO (AI Engine):
- Input: storico cliente, check-up, acquisti, appuntamenti
- Output IA: Trattamenti suggeriti, Prodotti consigliati, Calendario percorso ideale',
'Modulo 4: Motore di raccomandazione dinamico', 4),

('module_5_valutazione_staff',
'SISTEMA VALUTAZIONE STAFF + INCENTIVI:
- KPI tracciati per operatore: % di proposte accettate, Trattamenti venduti, Recensioni ricevute, Schedatura clienti aggiornata
- Generazione automatica report e bonus',
'Modulo 5: Valutazione staff e incentivi', 5),

('module_6_piano_editoriale',
'INTELLIGENZA EDITORIALE SOCIAL (Piano Editoriale IA):
- Proposta settimanale IA: 3 caption ottimizzate, 1 idea Reel, 1 contenuto educativo o ispirazionale, 1 promozione mensile legata ai servizi forti
- Automazione post su Meta Suite e IG',
'Modulo 6: Piano editoriale social', 6),

('module_7_simulatore_obiettivi',
'SIMULATORE OBIETTIVI RAGGIUNGIBILITÀ:
- Calcolo automatico: Clienti necessari per target € mensile, Scontrino medio richiesto, Ore vendute necessarie
- Visualizzazione: schema semplice e intuitivo',
'Modulo 7: Simulatore obiettivi', 7),

('module_8_libreria_protocolli',
'LIBRERIA PROTOCOLLI "IA Ready":
- Trasformazione di ogni protocollo in formato strutturato (json o schema testo)
- Accesso on-demand da parte delle operatrici tramite comando chat IA
- Versione stampabile per cabina + aggiornata ogni trimestre',
'Modulo 8: Libreria protocolli', 8),

('module_9_onboarding_collaboratori',
'SISTEMA ONBOARDING COLLABORATORI (IA Coach 30 Giorni):
- Programma IA: Giorno 1–5: introduzione, ruolo, protocolli base; Giorno 6–15: affiancamento + micro quiz giornalieri; Giorno 16–30: feedback, verifica competenze, autonomia operativa',
'Modulo 9: Onboarding collaboratori', 9),

('module_10_versione_light',
'VERSIONE LIGHT per Centri Piccoli + App Mobile:
- Funzionalità essenziali: Calcolo costo orario e listino, Agenda semplificata, Statistiche base (entrate/uscite, clienti attivi), Social post + reminder WhatsApp
- App Mobile: notifiche push, dashboard in tempo reale, suggerimenti IA',
'Modulo 10: Versione light', 10),

('module_11_analisi_benessere',
'MODULO ANALISI BENESSERE AZIENDALE (IA Audit + Piano d''Azione):
- Input richiesti: Bilancio analitico del centro, Costo orario operativo aggiornato, Listino prezzi completo con durata e margini, Inventario materiali e valore materiale fermo
- Output IA: Analisi stato attuale (equilibrio economico, redditività, efficienza prezzi, valore immobilizzato in magazzino), Semafori (rosso=criticità, giallo=migliorabile, verde=efficiente)
- Report PDF automatico con: Commento diagnostico, 5 Azioni urgenti (30 giorni), 5 Azioni strategiche (3-6 mesi), Suggerimenti per revisione listino, Proposte di ottimizzazione magazzino',
'Modulo 11: Analisi benessere aziendale', 11),

('general_context',
'Sei l''assistente AI di 4 Elementi Italia, una piattaforma dedicata ai professionisti del settore estetica e bellezza. Il tuo ruolo è supportare titolari di centri estetici, estetiste e operatori del settore fornendo consulenza operativa, strategica e formativa basata sui moduli sopra descritti.',
'Contesto generale dell''assistente', 0);

-- Trigger for updated_at
CREATE TRIGGER update_ai_system_config_updated_at
BEFORE UPDATE ON public.ai_system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();