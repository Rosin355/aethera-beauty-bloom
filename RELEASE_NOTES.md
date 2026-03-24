# Release Notes - Stabilization & Hardening Pass

## Cosa è cambiato
- Consolidata la gestione auth/ruoli lato frontend con una base condivisa:
  - `useAuth` come fonte principale di stato sessione + ruoli.
  - `useSecureAuth` allineato a `useAuth` per evitare duplicazione logica.
- Sistemati errori tecnici introdotti durante i refactor recenti:
  - Hook `useEffect` fuori componente in `ClientNotes` riposizionato correttamente.
  - Ridotti usi di `any` in punti critici (`ClientDetail`, `LandingPage`, `RecentFilesList`, `videoStorage`, `BecomeAdminButton`).
- Allineata la chiamata AI assistant frontend alle policy di hardening backend:
  - `ChatAssistant` usa ora JWT di sessione (Bearer token utente) e URL edge function centralizzato.

## Cosa è stato hardenizzato
- Coerenza auth/role-end-to-end:
  - Frontend `ChatAssistant` non usa più anon key come Authorization.
  - Edge Functions continuano a validare JWT e ruolo tramite helper condivisi in `supabase/functions/_shared/auth.ts`.
- Bootstrap admin più sicuro (già introdotto nel pass precedente, validato in questo pass):
  - Flag env per abilitazione in produzione.
  - Verifica email confermata.
  - Domain allowlist opzionale.
  - Doppio controllo presenza admin prima dell’insert.
- Verifica centralizzazione URL Edge Functions:
  - Nessun endpoint hardcoded residuo nel frontend fuori da `supabaseConfig`.

## Cosa è stato spostato su Supabase
- Confermata la migrazione CMS/public content su tabelle Supabase:
  - `site_settings`, `site_sections`, `testimonials`, `legal_links`.
- Confermata la migrazione management/admin mock -> DB:
  - `business_services`, `inventory_items`, `business_appointments`, `client_notes`, `client_metrics`, `admin_content_items`.
- Verificata coerenza tra migration e tipi generati in `src/integrations/supabase/types.ts`.

## Verifiche finali eseguite
- `npx tsc --noEmit`: OK
- `npm run build`: OK (exit code 0)
- ESLint mirato sui file toccati nel pass finale: OK
- Audit route/link principali:
  - Nessun riferimento attivo residuo a route note come non esistenti (`/training`, `/features`, `/management`, `/community`, `/support`, `/about`, `/blog`, `/careers`, `/privacy`, `/terms`, `/dashboard/settings`, `/admin/forgot-password`).
  - Link non disponibili mantenuti disabilitati in UI dove previsto.
- Verifica env/segreti:
  - `.env` ignorato da git.
  - `.env.example` presente con sole variabili pubbliche/sicure.

## Limiti noti residui
- `npm run lint` globale del repository riporta ancora diversi warning/error legacy fuori dallo scope di questa passata finale (componenti/community/UI non toccati in questo ciclo).
- In alcuni componenti CMS restano fallback editoriali locali intenzionali (resilienza in assenza dati DB), non usati come sorgente primaria quando Supabase restituisce contenuto.
