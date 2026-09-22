# Security review — Fase 1 (P1.2–P1.7)

Static code review only — no live project, no `supabase` CLI, no `psql`/`deno` in this sandbox
(same limitation as every other phase of this branch, see `docs/RUN_ON_MAC.md`). Scope, per the
P1.7 spec: every view/RPC/tool built from P1.2 through P1.7 enforces center membership; no
service-role leakage to a client-callable path; write tools cannot cross centers; `device_tokens`
is not readable by another user. Migrations covered: `20260920100000_center_kpi_views.sql`
through `20260922160000_scheduler.sql`.

**Verdict: one real gap found and fixed (finding 1). Two things flagged as documented, deliberate
deferrals rather than fixes (findings 2–3). Everything else checked out.** All four are detailed
below with what to verify live before treating Fase 1 as closed.

## Finding 1 (fixed) — `center_actions` UPDATE was member-level RLS, owner-only only at the tool layer

`center_actions` (P1.6, `20260922140000_center_reports.sql`) is the strategic checklist attached
to a `center_reports` reading. The ai-assistant tool `set_action_done` restricts it to
`access: "owner"`, and that was the only place the owner-only rule was enforced — the table's own
RLS UPDATE policy allowed any center **member** (operator or receptionist, not just the owner) to
flip `done`/`done_at` on any of the center's actions. The original P1.6 migration comment called
this intentional, reasoning that "an operator toggling a to-do is not a revenue number" and that a
hypothetical future dashboard might want broader access.

Under this security pass that reasoning doesn't hold: RLS is the actual boundary, because a
member's own valid JWT reaches PostgREST directly — the ai-assistant tool is not in the way of a
direct API call. So the tool-layer "owner-only" claim was not actually true end-to-end; any
operator with API access (which every member has, by design, for their own center) could
override the owner-only checklist without going through the chat at all.

**Fix applied:** `supabase/migrations/20260922140000_center_reports.sql` — the UPDATE policy is
now `public.center_role(center_id) = 'owner'`, matching the tool. Widen it again only when a real
feature actually needs member-level writes, not speculatively ahead of one.
`supabase/tests/14_center_reports.sql` was updated to assert the operator's UPDATE now affects 0
rows and the owner's still succeeds. **Not run in this sandbox — verify with
`npm run test:sql` on your Mac before deploying.**

## Finding 2 (deferred, documented) — `internal_config` stores secrets in a plain table, not Vault

`internal_config` (P1.7, `20260922160000_scheduler.sql`) holds `functions_base_url` and
`service_role_key` as plaintext `text` columns so `fn_call_send_push` can reach the `send-push`
edge function from a `pg_cron` job. RLS is enabled with zero policies and `REVOKE ALL FROM
PUBLIC, anon, authenticated`, so no client role can read it through PostgREST — only a
`SECURITY DEFINER` function owned by the migration role, or a superuser/service session, can ever
see the row. That closes the client-facing hole, but the value still sits in cleartext in a table
any database-level access (a `pg_dump`, a support engineer with DB console access, a misconfigured
read replica) can read directly, unlike Supabase's `vault.secrets` (encrypted at rest via
pgsodium).

**Not fixed in this pass.** Supabase's `vault` extension needs to be confirmed enabled on the live
project and its `vault.create_secret`/`vault.decrypted_secrets` API needs to be exercised for real
— neither is possible from this sandbox, and migrating blind risks a broken scheduler with no way
to test the fix. Left as `internal_config`, documented in three places now (this file, the
migration's own header, `CLAUDE.md`). **Before or shortly after going live:** confirm `vault` is
available on the project, migrate `internal_config`'s two rows into it, and change
`fn_call_send_push` to read via `vault.decrypted_secrets` instead. Low urgency (DB-level access is
already privileged), not zero.

## Finding 3 (deferred, documented) — non-`HttpError` exceptions could leak raw messages (fixed for the general case, not exhaustively audited)

`_shared/auth.ts`'s `toErrorResponse` — the catch-all every edge function in this repo funnels
into, including `ai-assistant`, `generate-report`, and `send-push` — previously returned
`error.message` for **any** `Error` instance, not just the app's own deliberately-thrown
`HttpError`. An unexpected exception (a driver error, a network failure, a `TypeError` from a bug)
would have had its raw message serialized straight into the HTTP response body. I did not find a
concrete instance where this actually fires in the P1.2–P1.7 code paths — they're careful to wrap
Supabase errors in `HttpError` or log only `.code` (see `ai-assistant/tools/db.ts`'s `unwrap()`,
`generate-report/index.ts`'s KPI/threshold error logging) — but it's a real gap in the general
case, so:

**Fixed:** `toErrorResponse` now returns the generic `"Errore interno"` for anything that isn't an
`HttpError`, and logs the real error server-side via `console.error` first. This is a shared file
used by every edge function in the repo (not just Fase 1's three), so the blast radius of the
change is wider than P1.2–P1.7, but the change is additive-safe: it can only ever make a response
**less** detailed than before, never break a currently-working call. **Verify:** exercise at least
one deliberate-error path per function (`npm run test:functions` covers `ai-assistant`,
`generate-report`, `send-push` at the type level only — an actual malformed request against each
locally-served function would confirm the response body still reads sensibly to a client, just
without a raw exception message on the 500 path).

**Not fixed / out of scope:** `video-upload/index.ts:90-96` (pre-existing, unrelated to Fase 1)
independently returns `error.message` directly rather than going through `toErrorResponse` at all
— flagged here for visibility since the sweep found it, but it predates P1.2 and touches an
unrelated feature; left untouched rather than making an out-of-scope change blind.

## Checked and confirmed correct (no fix needed)

**Center-membership enforcement.** Every `SECURITY DEFINER` RPC reachable by `authenticated`
(`fn_center_kpi`, `fn_center_gaps`, `fn_simulate_goal`, `fn_center_appointments`,
`fn_create_appointment`, `fn_move_appointment`, `fn_propose_recall`) checks `auth.uid()` and
either `is_center_member(_center_id)` or `center_role(_center_id) = 'owner'` as its first
statement, before touching any data. The `_calc` helper functions that skip this check
(`fn_center_kpi_calc`, `fn_center_gaps_calc`, `fn_center_nearest_slots_calc`) are correctly
unreachable by `authenticated`/`anon` — `GRANT EXECUTE` is `service_role`-only, matching the
established pre-P1.2 pattern in this codebase.

**No service-role leakage to client-callable paths.** None of the 13 ai-assistant tool files use
a service-role client (`types.ts` documents `ToolContext.supabase` as user-scoped, RLS-enforced;
confirmed no `serviceClient`/`createServiceClient` usage anywhere under
`ai-assistant/tools/`). The one privileged capability wired into tool context, KB lexical search,
returns only `title`/`description`/`content` fields, nothing tenant-scoped. `generate-report`'s
service-role writes are gated by exactly one owner check at request entry, done through the
user-scoped client first (double enforcement: the RPC re-checks owner-only internally too).
`send-push` never returns token values or `internal_config` contents in its response, only
send/fail counts.

**Write tools cannot cross centers.** `fn_move_appointment` re-scopes the target appointment by
`center_id` on both the lookup and the `UPDATE` (`WHERE id = _appointment_id AND center_id =
_center_id`, twice). `fn_create_appointment` validates the referenced service belongs to the
same center before inserting. The `set_action_done` tool (application layer, on top of the RLS
fix in finding 1) re-filters by `center_id` on both its lookup and its update. `set_profile_slot`
relies on `center_profile_slots`' own membership RLS plus a `(center_id, slot_key)` primary key,
so there's no bare-id lookup to leak across tenants in the first place.

**`device_tokens` not readable by other users.** RLS is `user_id = auth.uid()` for
`USING` (read/update/delete eligibility) and additionally requires real `is_center_member`
membership on `WITH CHECK` (insert/update validity) — a teammate cannot see or touch another
member's token, matching the P1.7 spec's explicit requirement. `send-push` reads across all of a
center's tokens via its service-role client, which is the one legitimate cross-user read path and
is itself gated by the service-role-only check in finding-free review below.

**`internal_config` has zero policies.** Confirmed by a repo-wide grep for `CREATE POLICY`
mentioning `internal_config` — none exist. RLS enabled + no policies + `REVOKE ALL FROM PUBLIC,
anon, authenticated` denies every client role outright; only `fn_call_send_push` (`SECURITY
DEFINER`, no grants to any client role either — reachable only from the two cron-scheduled
functions) or a migration/superuser session can read it. See finding 2 for the plaintext-storage
caveat, which is a different concern from readability.

**`send-push` really is internal-only.** Two independent layers: `supabase/config.toml` sets
`verify_jwt = true` (the platform itself rejects a request without a valid JWT before the function
even runs), and the function's own handler additionally requires the bearer token to literally
equal `SUPABASE_SERVICE_ROLE_KEY` — a stolen user access token, however valid, is not the service
role key and is rejected with `403`.

**`requireAuthenticatedUser` naming.** Despite the name, it returns a **service-role** client
alongside the verified `user` — already called out in `CLAUDE.md`'s "Repo facts that differ from
the prompt doc" section from before this phase. Both call sites that need RLS enforcement
(`ai-assistant/index.ts`, `generate-report/index.ts`) correctly build a *separate* user-scoped
client via `createUserClient(getBearerToken(req))` rather than relying on the service client for
anything tenant-scoped. No new instance of this trap found in P1.7's `send-push` (which is
deliberately service-role-only throughout, by design).

## Not covered by this pass

- **APNs push delivery** (`send-push/apns.ts`) — JWT construction is unit-tested against a
  throwaway key pair (`apns_test.ts`), but the actual HTTP/2 call to `api.push.apple.com` has
  never been exercised against a real Apple developer account, `.p8` key, or device. This is a
  correctness/reachability risk, not the access-control risk this review is about — see the
  file's own header and `docs/RUN_ON_MAC.md` §7.
- **pg_cron timezone behavior** — the two schedules are UTC clock times, not confirmed
  DST-aware "Europe/Rome" as the spec's prose says. Also a correctness concern, not access
  control; see the migration's own header.
- This review is a static read of the code as committed on `feature/concierge-backend`. It does
  not cover the live project's actual deployed state, IAM/dashboard access to the Supabase
  project itself, or secrets handling outside this repo (e.g. how `APNS_PRIVATE_KEY` reaches
  the function's env in production).
