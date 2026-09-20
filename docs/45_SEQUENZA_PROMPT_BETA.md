# 45 — Sequenza prompt: dalla Fase 1 alla beta TestFlight

Prompt pronti da incollare in Claude Code, in ordine. Regole d'uso:
- **[S] = Sonnet** (default, risparmia crediti) · **[O] = Opus/top model** (solo dove indicato).
- Un prompt alla volta, commit dopo ogni prompt. Se un prompt fallisce due volte, passa a [O] solo per quel prompt.
- Prima di iniziare ogni fase, esegui il prompt di setup della fase (P1.0 / P2.0): crea il CLAUDE.md, così i prompt successivi restano corti.
- Riferimenti: doc 39 (piano), 42 (orb kit), 44 (agenda AI + Percorso), canvas design (esporta le tavole citate come PNG nella cartella `design/` del repo).

---

## FASE 1 — Backend del concierge (repo `aethera-beauty-bloom`)

### P1.0 [S] Setup contesto
```text
Create CLAUDE.md at the repo root for the "Concierge backend" work. Contents:
project purpose (AI strategic concierge for beauty centers; native iOS/Android
clients will consume Supabase only — no web UI work in this phase); stack
(Supabase: Postgres + RLS, Edge Functions in supabase/functions, helpers
_shared/security.ts with requireAuthenticatedUser/requireAdminUser); rules:
never hardcode URLs/secrets, every sensitive function uses the shared auth
helpers, all business logic lives in SQL views/RPC or Edge Functions (thin
clients), every migration is reversible, run lint/typecheck before declaring
done. List the key tables (business_services, business_appointments,
inventory_items, client_metrics, client_notes, ai_conversations,
ai_system_config, profiles, user_roles, centers, center_members). Branch for
this phase: feature/concierge-backend from main.
```
Commit: `chore: CLAUDE.md for concierge backend phase`

### P1.1 [S] Audit e architettura tool-calling
```text
Read supabase/functions/ai-assistant end to end. Write docs/CONCIERGE_TOOLS.md
describing how we will extend it into a tool-calling agent: request loop
(model responds with tool_use → we execute → feed tool_result → repeat, max 5
rounds), a tools/ folder with one module per tool (name, JSON schema, handler
that receives {supabase, centerId, userId, args}), streaming of the final text
via SSE, and how the existing KB/embedding context injection stays unchanged.
No code changes yet — the document is the contract for the next prompts.
```
Commit: `docs: tool-calling architecture for ai-assistant`

### P1.2 [S] Viste KPI e semafori
```text
Migration: create SQL views for per-center KPIs, all filtered by center_id:
- v_center_week_kpi: scontrino medio (avg incasso per appuntamento completato,
  last 7 days), ore vendute vs ore apertura, clienti attivi (>=1 visita in 30gg),
  clienti dormienti (nessuna visita in 60gg, con elenco id), ripresa in cassa
  (% appuntamenti con ribooking).
- v_center_gaps_today: free slots today per cabina from business_appointments.
Add RPC fn_simulate_goal(center_id, goal_amount) returning clients_needed,
avg_ticket_used, hours_needed, current_progress based on the views. SECURITY
DEFINER with is_center_member check, REVOKE PUBLIC. Unit-test the math with a
seed script in supabase/tests.
```
Commit: `feat(kpi): center KPI views + goal simulator RPC`

### P1.3 [S] Tool: leggere e scrivere il centro
```text
Following docs/CONCIERGE_TOOLS.md, implement the tool framework in
ai-assistant plus the first read tools: get_center_kpi (wraps
v_center_week_kpi), simulate_goal (wraps RPC), list_appointments(day),
get_center_profile (analisi-di-valore data slots), get_protocol(name) from
the KB. Every tool validates args with its JSON schema, checks center
membership, and returns compact JSON. Wire the loop with max 5 rounds and
keep SSE streaming for the final answer. Add a curl test script
scripts/test-tools.sh that exercises each tool through the function.
```
Commit: `feat(ai): tool-calling loop + read tools`

### P1.4 [S] Tool: agenda scritta dall'AI
```text
Add write tools to ai-assistant: create_appointment(client_name, service,
datetime, cabina?) with conflict detection (if the slot is taken, return the
2 nearest free alternatives instead of writing), move_appointment(id, new
datetime) returning a draft client message the app will show for approval,
and propose_recall(gap) that picks the best dormant client for a free slot
(from v_center_week_kpi dormienti + storico servizi) and returns a draft
message. Writes always require an explicit confirmed:true arg — the model
must first show the draft/confirmation to the user (document this in the
system prompt addendum). Tenant integrity: service must belong to the same
center (existing trigger). Extend scripts/test-tools.sh.
```
Commit: `feat(ai): agenda write tools with confirm-first pattern`

### P1.5 [S] Intervista e profilo progressivo
```text
Migration: center_profile_slots table (center_id, slot_key, value jsonb,
source 'interview'|'conversation'|'computed', updated_at) with RLS by
membership. Map the Analisi di Valore questionnaire to slot keys in
docs/PROFILE_SLOTS.md (chapters: identita, gestione, numeri, clienti,
marketing, team, obiettivi — key questions Q1,Q3,Q6,Q14,Q22,Q26,Q60,Q75
flagged as the welcome-interview 8). Tools: set_profile_slot,
get_missing_slots(chapter?) so the concierge asks ONLY for missing/stale
(>6 months) data, and generate_first_reading that produces the closing
letter from the interview answers. Completeness % = weighted answered slots.
```
Commit: `feat(profile): progressive analisi-di-valore slots + first reading`

### P1.6 [S] Referto e azioni
```text
Edge function generate-report (auth required, center member): assembles the
"lettura del centro" — KPI snapshot with semaphore levels (thresholds in a
config table), diagnostic narrative via the model using KB context, 5 urgent
actions (30 days) + 5 strategic actions (3-6 months) as structured rows in
new tables center_reports / center_actions (RLS by membership). Tool
get_latest_report for the chat. Weekly action completion toggling via tool
set_action_done. Keep the PDF for later — the app renders the report.
```
Commit: `feat(report): center reading generator + actions storage`

### P1.7 [O] Scheduler, push e security pass
```text
1) Migration: device_tokens (user_id, center_id, platform 'ios'|'android',
token unique, updated_at) with RLS: user writes own rows only.
2) Edge function send-push (service role, internal only): APNs HTTP/2 with
token auth (keys via env), FCM later; helper notifyCenter(centerId, payload).
3) pg_cron jobs calling a scheduler function: Monday 07:30 Europe/Rome
weekly briefing (generate-report light + push), daily recall reminders.
4) SECURITY PASS on everything from P1.2–P1.7: verify every view/RPC/tool
enforces center membership, no service-role leakage to client-callable
paths, write tools cannot cross centers, device_tokens not readable by
other users. Produce docs/SECURITY_REVIEW_FASE1.md with findings and fixes.
```
Commit: `feat(push): device tokens + scheduler · security pass fase 1`

### P1.8 [S] Seed demo e collaudo
```text
Seed script for a demo center "Centro Aurora" (Monza): 3 collaboratrici, 40
clients with realistic visit history (some dormant), services with prices,
this week's appointments with gaps, profile slots ~70% filled. Then run the
full curl test suite and fix anything red. Write docs/FASE1_DONE.md: every
tool with an example request/response — this file is the contract for the
iOS integration (Fase 3).
```
Commit: `chore(seed): demo center + fase 1 acceptance`

---

## FASE 2 — App iOS su dati finti (nuovo repo `Concierge4E`)

### P2.0 [S] Scaffold + CLAUDE.md
Usa **il prompt del doc 42 §4** (scaffold completo). Aggiungi in coda:
```text
Also create CLAUDE.md: art direction (editorial paper journal, Italian copy,
no chat bubbles, no forms), token table (colors/type/spacing/radii from
design/06-tokens.png), orb state animation specs (idle breathe 1→1.045 6s;
listening pulse 1→1.07 + glow 1.8s; thinking swirl 16° 2.4s; replying retreat
to 110pt), architecture rules (views thin, ConciergeStore mock behind
ConciergeBackend protocol, one screen per file, zero warnings). The design/
folder contains the exported boards — always match them.
```
Commit series come da doc 42.

### P2.1 [S] Componenti base
```text
Build the shared component library matching the token sheet exactly:
CapsLabel (letterspaced uppercase), SerifDisplay (two-line roman+italic),
ProsaText, HintItalic, PillButton (terracotta + quiet variants), ChipButton
(single/multi select states), IvoryCard, KPIRow (semaphore dot + caps label
+ tabular serif value), ProgressDots, ThinProgressLine, NumericPad (Playfair
keys, no key surfaces), CompletenessRing. Preview each in a #Preview. Match
design/A2, A4, 03, 05 boards pixel-close.
```
Commit: `feat(ui): component library from token sheet`

### P2.2 [S] Orb kit (porting Metal)
```text
Port the orb kit exactly as specified in docs/42 (file provided): copy
C4EShaders.metal (renamed mm_→c4e_, all three shaders), ConciergeOrbView with
ConciergeOrbState {idle, listening, thinking, replying} and the four state
palettes; keep the fixed-step internal clock, frame throttle, palette lerp
and black-fill rasterization EXACTLY as the source. MetalRippleView with
dotSpacing 26. Demo screen cycling the four states on tap with the animation
specs from CLAUDE.md (breathe/pulse/swirl/retreat). Profile on device sim:
60fps at 220pt.
```
Commit: `feat(orb): Metal orb + ripple ported with concierge states`

### P2.3 [S] Shell di navigazione
```text
App shell: paper background (MetalRippleView) everywhere, custom 3-tab bar
(CONCIERGE · BRIEFING · AGENDA) matching board 02, Profilo pushed from the
concierge header ring button, first-launch routing (onboarding → interview →
home; returning user → home). State in AppRouter. Match boards 01, 02, 04.
```
Commit: `feat(shell): navigation + tab bar + routing`

### P2.4 [S] Onboarding e permessi
```text
Screens: 01 onboarding (orb intro, INIZIAMO), I1 microphone priming and I2
notifications priming — each shows our editorial screen first, then triggers
the real system permission only after the terracotta pill; quiet link paths
("Preferisco scrivere" / "Più tardi") set flags in ConciergeStore. Match
boards 01, I1, I2.
```
Commit: `feat(onboarding): first run + permission priming`

### P2.5 [S] Intervista di benvenuto
```text
WelcomeInterviewView implementing boards A1–A6: 8 questions from
InterviewSpec (chip single: tipologia; chip multi: trattamenti top; numeric:
cabine, team, scontrino, clienti attivi; choice: ore cabina, obiettivo; plus
name as first question), progress dots, "Non lo so" flow (A6 card, slot
marked da-scoprire), voice answer question (A5) using speech recognition
when mic granted with live transcription, else text field. Answers →
ConciergeStore profile slots. State machine unit-tested.
```
Commit: `feat(interview): welcome interview A1–A6`

### P2.6 [S] Prima lettura + domanda progressiva
```text
A7 closing letter: typeset paragraphs generated from the interview answers
(mock generator mirroring the backend's generate_first_reading: scontrino
benchmark, dormant-clients lever, obiettivo echo, one first action card) with
"COMINCIAMO DA QUI". A8 progressive question component: InlineQuestionView
(chip or numeric) usable inside the conversation thread, writing to profile
slots. Match boards A7, A8.
```
Commit: `feat(interview): first reading letter + inline progressive question`

### P2.7 [S] La conversazione (cuore dell'app)
```text
ConciergeView conversation per boards 02, H1–H4: idle (greeting + orb +
starter chips), listening (orb state + ● 0:21/1:00 caps indicator + "Ti
ascolto", live mic RMS driving orb amplitude, tap to stop), thinking (single
italic line), replying (user line italic right-aligned; concierge answer as
typeset serif paragraphs revealed progressively; inline KPIRows; quiet pill
actions). Draft-approval pattern H4: DraftMessageCard with INVIA / Modifica /
Salta and "1 DI 14" counter. MockConciergeBackend returns the scripted
replies (weekly reading, goal simulation from profile scontrino, protocol
steps, recall drafts). Haptics on state changes.
```
Commit: `feat(concierge): live conversation states + draft approval`

### P2.8 [S] Briefing + simulatore
```text
BriefingView per boards 03 and G2 (empty first week with "riprendi
l'intervista" card when profile incomplete): prose intro, three KPIRows,
azione della settimana card, goal card → full SimulatorView per board C
(editable serif amount, computed clients/hours/progress from mock store,
"RENDILO IL MIO OBIETTIVO"). N3 variant: weekly advice card carries "Questo
consiglio viene dal Passo 4" + "Apri la lezione" link (stub to P2.11).
```
Commit: `feat(briefing): weekly brief + goal simulator`

### P2.9 [S] Agenda viva
```text
AgendaView per boards 04, G3, M1–M4: day list with appointment cards, inline
concierge suggestion with PROPONI, dictated-appointment confirmation card
(M1) reachable from conversation ("Segna Marta venerdì alle 15"), conflict
alternatives as chips (M2), reschedule with client draft (M3 reusing
DraftMessageCard), filled-gap outcome state (M4: acqua dot + italic note).
All against mock store with conflict logic unit-tested.
```
Commit: `feat(agenda): AI-run agenda flows M1–M4`

### P2.10 [S] Profilo, team, impostazioni
```text
ProfiloView per boards 05/G4 (ring, chapters with concierge-voice status,
0% state → FACCIAMO L'INTERVISTA), TeamView per J1 (list + invite by email)
and J2 (collaborator code entry, 6 Playfair slots), SettingsView per K
(typographic list: account, notifiche toggles as dots, centro, privacy,
esci). Collaborator role flag in store switches the app to the reduced view
(no owner numbers; coach + agenda + protocolli only).
```
Commit: `feat(profile): profilo + team + impostazioni + ruolo collaboratrice`

### P2.11 [S] Referto, Percorso, IA Coach
```text
ReportView per B1–B3 (lettura, 5 urgenti, 5 strategiche, METTI IN AGENDA
wiring actions into the weekly list). PercorsoView per N1–N4: seven-step
overview with semaphore chapters, micro-lesson reader (caps eyebrow, serif
prose, quiet video card placeholder, "Nel tuo centro" italic paragraph from
center data, action pill), completion state N4. CoachView per E1–E2: day
lesson + chip quiz with gentle wrong-answer state, titolare and
collaboratrice variants. Mock content for Passo 4 and coach day 12 written
in the product voice.
```
Commit: `feat(growth): referto + percorso sette passi + ia coach`

### P2.12 [S] Social, protocollo, stati di sistema
```text
SocialView per D1–D2 (caption/reel/educativo/promo cards with Copia — real
clipboard — and "Chiedi una variante" stub), ProtocolView per F (arm's-length
reading, step numbers terracotta, AVVIA TIMER with live countdown and
screen-always-on), offline state G5 (desaturated orb, RIPROVA), lock-screen
notification content per G6 via UNNotificationContentExtension styling where
possible. App icon from board L (all sizes, asset catalog).
```
Commit: `feat(tools): social + protocollo + offline + icon`

### P2.13 [O] QA sweep Fase 2
```text
Full pass: zero build warnings, every screen vs its design board (list
discrepancies and fix), Dynamic Type up to XL without breakage, Reduce
Motion freezes orb morph to breathe, VoiceOver labels on all interactive
elements, dark-keyboard/status-bar coherence on ivory, memory/fps profile of
orb + ripple together, unit tests green (interview machine, simulator math,
agenda conflicts). Produce docs/FASE2_QA.md.
```
Commit: `chore(qa): fase 2 acceptance`

---

## FASE 3 — Aggancio al backend vero

### P3.1 [S] Auth magic link
```text
Add supabase-swift. Implement G1 login (email → signInWithOTP magic link →
deep link callback), session in Keychain, sign-out from Settings, invited-
collaborator path (J2 code = invite acceptance). Point at the project via
Config.plist (no hardcoded keys; anon key + URL from build config).
```
Commit: `feat(auth): magic link + session`

### P3.2 [S] Backend reale in conversazione
```text
Implement SupabaseConciergeBackend conforming to ConciergeBackend: SSE
streaming call to ai-assistant with center context, tool-result payloads
rendered natively (kpi → KPIRows, draft → DraftMessageCard, appointment →
confirmation card, simulation → simulator block), conversation persisted via
ai_conversations. Feature flag to switch mock/real. Test against the demo
center from P1.8 using docs/FASE1_DONE.md as the contract.
```
Commit: `feat(backend): live concierge conversation`

### P3.3 [S] Dati reali ovunque
```text
Wire interview/profile to center_profile_slots (missing-slots drives the
inline questions), briefing to v_center_week_kpi + latest report, agenda to
business_appointments (writes via the confirm-first tools), referto to
center_reports/center_actions, percorso progress to its table, social plan
from the generator tool. Delete mock data paths behind the flag. Empty
states must appear naturally for a fresh center.
```
Commit: `feat(data): all screens on live Supabase`

### P3.4 [S] Team reale
```text
Owner invite → center_members (status invited) + email via existing hardened
email infra; collaborator code entry binds user and activates membership;
role-based UI (collaboratrice sees coach/agenda/protocolli, no numbers) now
enforced ALSO by RLS-backed queries, not just UI flags. Verify cross-center
isolation manually with two test users and document it.
```
Commit: `feat(team): live invites + role-scoped app`

### P3.5 [S] Push reali
```text
APNs registration → device_tokens upsert on login; handle briefing/recall/
goal push payloads with deep links (briefing tab, draft approval, agenda
day); foreground presentation quiet and coherent with G6 styling. Test end
to end with the P1.7 scheduler firing a manual run.
```
Commit: `feat(push): APNs end to end`

### P3.6 [O] Security e resilienza
```text
Adversarial pass: attempt cross-center reads/writes from the app with a
second account (must fail via RLS), token expiry/refresh handling, offline
G5 behavior on every screen (queued draft approvals never double-send),
input abuse in interview numeric fields, push payload spoofing ignored.
Fix findings; write docs/SECURITY_REVIEW_APP.md.
```
Commit: `chore(sec): app security pass`

---

## FASE 4 — Proattività accesa

### P4.1 [S] Briefing del lunedì reale
```text
Enable the Monday scheduler for pilot centers: generate-report light run +
push at 07:30 Europe/Rome; the app's briefing shows the fresh reading with
"nuovo" state. Add per-center notification preferences from Settings K
(briefing on/off, reminder on/off) respected by the scheduler.
```
### P4.2 [S] Richiami e bozze proattive
```text
Daily job proposes recalls for tomorrow's gaps (propose_recall) and sends
one push max/day; approval flow in app sends via the messaging channel we
have today (start with prepared text → share sheet; WhatsApp API later).
Track outcomes (sent/confirmed) into client history for the KPI views.
```
### P4.3 [S] Piano social settimanale
```text
Sunday job generates D1–D2 content from center specializzazione + KB, stores
it, pushes "Le tue idee sono pronte". Copia uses the pasteboard; "Chiedi una
variante" calls the tool with the card context.
```
### P4.4 [S] Referto PDF
```text
Server-side PDF of the referto (existing report data → typeset PDF via the
edge function; match the editorial style), "Scarica PDF" in B1 shares it.
```
Commit per ciascuno.

---

## FASE 5 — TestFlight

### P5.1 [S] Store readiness
```text
Bundle ids, versioning, privacy manifest + App Privacy answers (mic, speech,
notifications, account), Info.plist purpose strings in the concierge voice,
launch screen (paper + orb static), archive checklist for TestFlight.
```
### P5.2 [S] Pilota
```text
Onboard the 5 pilot centers: per-center seed checklist, a feedback capture
note template, crash/analytics minimal wiring (privacy-safe), and a
docs/PILOT_RUNBOOK.md for the two-week test.
```

---

## Riepilogo modelli
- **Sonnet ovunque** tranne: P1.7 (scheduler+security), P2.13 (QA), P3.6 (security) → **Opus**.
- Se un prompt [S] fallisce due volte di fila, rilancialo una volta con [O] e poi torna a [S].

## Ordine di lancio consigliato
P1.0→P1.8 (backend collaudabile da solo) · P2.0→P2.13 (app completa su mock,
dimostrabile al cliente in qualsiasi momento) · P3 · P4 · P5. Le fasi 1 e 2 possono
correre in parallelo se lavori su due sessioni.
