# CLAUDE.md — Concierge backend phase

## Purpose
AI strategic concierge for beauty centers ("4 Elementi"). Native iOS/Android clients
will consume **Supabase only** (Postgres + RLS + Edge Functions). In this phase there is
**no web UI work**: the existing React/Vite dashboard under `src/` is not touched, except
where a backend contract change would break it.

Working branch for this phase: `feature/concierge-backend` (from `main`).
The step-by-step prompt sequence is `docs/45_SEQUENZA_PROMPT_BETA.md` (FASE 1 = P1.0–P1.8).

## Stack
- Supabase: Postgres + RLS, migrations in `supabase/migrations/`.
- Edge Functions (Deno) in `supabase/functions/<name>/index.ts`; per-function auth mode in
  `supabase/config.toml` (`verify_jwt`).
- Shared helpers in `supabase/functions/_shared/`:
  - `auth.ts` — `requireAuthenticatedUser(req)`, `requireAdminUser(req)`, `HttpError`,
    `toErrorResponse`, `createServiceClient`.
  - `security.ts` — `readJsonBody` (byte cap), `enforceRateLimit`, `getClientIp`,
    `emailIsValid`, `isHoneypotTripped`.
- LLM access goes through the Lovable AI gateway (OpenAI-compatible chat completions,
  `LOVABLE_API_KEY`) from `ai-assistant`. Knowledge base retrieval is lexical
  (`match_training_data_fts`, service-role only), not embeddings.

## ai-assistant tool framework (P1.3)
`supabase/functions/ai-assistant/`: `index.ts` (entry), `agent.ts` (loop, max 5 model calls), `llm.ts` (gateway + SSE
parser), `context.ts` (prompt/KB assembly), `sse.ts`, `tools/` (one module per tool + `run.ts` runner + `schema.ts`
validator). Center context: `_shared/center.ts`; user-scoped client: `createUserClient` in `_shared/auth.ts`.
Tools NEVER take center/user ids as arguments and NEVER get the service-role client. Contract: `docs/CONCIERGE_TOOLS.md`.
Checks: `npm run test:functions` (deno), `npm run test:sql` (scratch Postgres), `npm run verify`.

**Output format is plain prose, never markdown.** The native iOS/Android clients render
assistant replies as typeset editorial prose — there is no markdown renderer client-side.
`context.ts`'s `RESPONSE_STYLE_INSTRUCTIONS` is appended to every system prompt, after
`ai_system_config` and after the tool prompt, specifically so a DB-edited prompt (or a
model mirroring the bullet-heavy formatting of the operational-module instructions) can't
silently reintroduce it: no bold/italic markup, no bulleted/numbered lists, no headings, no
tables, short paragraphs, numbers written inline in the sentence. Any new prompt content —
`ai_system_config` rows, tool prompts, future tools' own instructions to the model — must
follow the same rule; don't rely on `RESPONSE_STYLE_INSTRUCTIONS` alone to fix content that
actively asks for markdown.

## generate-report (P1.6)
`supabase/functions/generate-report/`: a second, separate edge function — NOT part of the
ai-assistant tool-calling framework. One-shot (non-streaming) model call with
`response_format: json_object`, owner-only, assembles a `center_reports` row (KPI snapshot +
diagnostic narrative) and 10 `center_actions` rows (5 urgent, 5 strategic) per call. Its own
prompt carries a hand-kept copy of the plain-prose rule above (`NARRATIVE_STYLE` in its
`index.ts`) since it never goes through `context.ts`'s `RESPONSE_STYLE_INSTRUCTIONS` — keep the
two in sync by hand if the wording changes. Deliberately duplicates a few lines of gateway
config from `ai-assistant/llm.ts` rather than importing across function directories or
refactoring already-shipped code without the ability to run tests; a real `_shared/llm.ts`
extraction is flagged as P1.7 security-pass work, not done blind.

## Rules
1. Never hardcode URLs or secrets. Read them from `Deno.env` / env vars; scripts read env vars.
2. Every sensitive function authenticates through the shared helpers in `_shared/auth.ts`.
   Never write ad-hoc JWT parsing.
3. All business logic lives in SQL views/RPC or in Edge Functions. Clients stay thin.
4. Tenant isolation is the `center_id` column + membership RLS (`is_center_member`,
   `center_role`). New tenant tables MUST have `center_id`, RLS enabled, and policies.
5. Every migration is reversible: ship the down steps as a trailing commented `-- DOWN` block
   (Supabase has no native down migrations), and make the up part idempotent
   (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`).
6. New SQL functions: `REVOKE ALL ... FROM PUBLIC, anon` then `GRANT EXECUTE` only to the roles
   that need it. Supabase default privileges grant `anon`/`authenticated` on new objects, so
   revoking `PUBLIC` alone is not enough.
7. Run `npm run lint` and `npm run typecheck` (and `deno check` on edge function code) before
   declaring any step done.
8. Environment for this phase: code, migrations and scripts only. No `supabase` CLI, no deploys,
   no calls to the live project. Anything that needs the live project goes in
   `scripts/deploy_fase1.sh`, `scripts/test-tools.sh` and `docs/RUN_ON_MAC.md`.

## Key tables (public schema)
| Table | Notes |
|---|---|
| `centers` | tenant; `owner_user_id`, `plan`, `service_durations` |
| `center_members` | `center_id`, `user_id`, `role` (`owner`/`operator`/`receptionist`), `status` (`invited`/`active`) |
| `business_services` | per-center service catalogue (`price`, `duration_minutes`, `category`) |
| `business_appointments` | `client_name` (free text, no client id), `service_id`, `appointment_at`, `price`, `status` (`confermato`/`in_attesa`/`completato`/`annullato`) |
| `inventory_items` | per-center stock |
| `client_metrics` | monthly KPI snapshot; **owner-only** RLS; `client_user_id` is the center owner, not an end client |
| `client_notes` | per-center notes; membership RLS |
| `ai_conversations` | per-user chat history (`user_id`, `messages` jsonb) |
| `ai_system_config` | admin-managed system prompt + operational modules |
| `profiles` | per-user profile (`user_id`) |
| `user_roles` | platform roles (`admin`/`collaborator`/`user`) via `has_role()` |
| `profile_slot_catalog` | fixed reference data, all authenticated read; the 75 Analisi di Valore questions (`docs/PROFILE_SLOTS.md`) |
| `center_profile_slots` | per-center answers to the catalog above; membership RLS |
| `report_thresholds` | fixed reference data, all authenticated read; semaphore bands per KPI metric |
| `center_reports` / `center_actions` | one "lettura del centro" + its 5+5 actions; members read, only `generate-report`'s service-role client writes |

## Repo facts that differ from the prompt doc (adapt to the repo, not the doc)
- `requireAuthenticatedUser`/`requireAdminUser` live in `_shared/auth.ts` (not `security.ts`).
- `requireAuthenticatedUser` returns a **service-role** client: it bypasses RLS. Anything
  scoped to a center must either use a user-scoped client (user JWT) or check membership
  explicitly. See `docs/CONCIERGE_TOOLS.md`.
- The model API is OpenAI-style (`tools` / `tool_calls` / `role: "tool"`), not Anthropic `tool_use`.
- `business_appointments` has no `cabin` column and no client id; the platform has no
  opening-hours data yet. Phase 1 adds what the KPI views need.
