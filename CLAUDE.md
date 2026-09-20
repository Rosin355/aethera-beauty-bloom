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

## Repo facts that differ from the prompt doc (adapt to the repo, not the doc)
- `requireAuthenticatedUser`/`requireAdminUser` live in `_shared/auth.ts` (not `security.ts`).
- `requireAuthenticatedUser` returns a **service-role** client: it bypasses RLS. Anything
  scoped to a center must either use a user-scoped client (user JWT) or check membership
  explicitly. See `docs/CONCIERGE_TOOLS.md`.
- The model API is OpenAI-style (`tools` / `tool_calls` / `role: "tool"`), not Anthropic `tool_use`.
- `business_appointments` has no `cabin` column and no client id; the platform has no
  opening-hours data yet. Phase 1 adds what the KPI views need.
