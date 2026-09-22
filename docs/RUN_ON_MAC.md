# What to run from your Mac (Fase 1)

The coding sandbox has no Supabase secrets and never touches the live project. Everything that
needs the live project is scripted here. Run the sections **in order**; each prompt of Fase 1
appends to this file.

## 0. One-time setup

```bash
brew install supabase/tap/supabase   # if not installed
supabase login
git fetch origin && git checkout feature/concierge-backend && git pull
npm ci
```

Environment variables used by the scripts (never committed):

| Variable | Used by | Where to find it |
|---|---|---|
| `SUPABASE_PROJECT_REF` *(optional)* | `deploy_fase1.sh` | defaults to `project_id` in `supabase/config.toml` |
| `SUPABASE_URL` | `test-tools.sh` | Project settings → API → Project URL |
| `SUPABASE_ANON_KEY` | `test-tools.sh` | Project settings → API → `anon` `public` key |
| `ACCESS_TOKEN` *or* `TEST_EMAIL` + `TEST_PASSWORD` | `test-tools.sh` | a real user that is a member (ideally owner) of a center |
| `CENTER_ID` *(optional)* | `test-tools.sh` | needed only if that user belongs to several centers |
| `OTHER_CENTER_ID` *(optional)* | `test-tools.sh` | a center that user is NOT a member of (expects 403) |
| `OPERATOR_ACCESS_TOKEN` *(optional)* | `test-tools.sh` | JWT of a non-owner member of `CENTER_ID` (owner-only tools must be refused) |
| `RUN_CHAT=0` *(optional)* | `test-tools.sh` | skip the natural-language round trip (uses model credits) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions by
Supabase itself; the only function secret you must have set is `LOVABLE_API_KEY` (already used before).

## 1. Local checks (no Supabase needed)

```bash
npm run verify        # lint + typecheck + build
npm run test:sql      # replays migrations on a scratch local Postgres and runs supabase/tests/*.sql
npm run test:functions  # deno check + deno test of the edge functions (needs `brew install deno`)
```

`test:sql` needs a local PostgreSQL 15+ (`brew install postgresql@16`). It starts and destroys its
own throw-away cluster; it does not use your Supabase project.

## 2. After P1.2 — KPI views + goal simulator (migration only)

```bash
./scripts/deploy_fase1.sh migrations
```

This links the project, shows a dry run of the pending migration
(`20260920100000_center_kpi_views.sql`), asks for confirmation, then runs `supabase db push`.

What the migration changes on the live database: adds `centers.timezone / cabin_count /
opening_hours`, `business_appointments.cabin`, the helper `client_key()`, the functions
`fn_center_kpi`, `fn_center_gaps`, `fn_simulate_goal` (+ two internal `*_calc` functions) and the
views `v_center_week_kpi`, `v_center_gaps_today`. It does not alter existing data.

Quick check in the SQL editor (run as the project owner, not through the API):

```sql
select table_name from information_schema.views
where table_schema = 'public' and table_name in ('v_center_week_kpi', 'v_center_gaps_today');
-- expected: 2 rows

select has_function_privilege('anon', 'public.fn_center_kpi(uuid, timestamptz)', 'execute');
-- expected: false
```

Set your real center's data so the numbers mean something (the defaults are 1 cabin, Mon–Sat 09–19,
Europe/Rome):

```sql
update public.centers
set cabin_count = 2,
    opening_hours = '{"2":[["09:00","19:00"]],"3":[["09:00","19:00"]],"4":[["09:00","19:00"]],"5":[["09:00","19:00"]],"6":[["09:00","19:00"]]}'
where id = '<your center id>';
```

## 3. After P1.3 — tool-calling `ai-assistant` (migration + function deploy + live tests)

**Order matters: migrations first (the function calls `fn_center_appointments`), then the function, then the tests.**

```bash
# 3a. apply the new migration (20260920110000_concierge_tool_support.sql) and deploy ai-assistant
./scripts/deploy_fase1.sh all
```

```bash
# 3b. live tests. Minimum: owner of one center.
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_ANON_KEY="<anon key>"
export TEST_EMAIL="<owner email>"          # or: export ACCESS_TOKEN="<user jwt>"
export TEST_PASSWORD="<owner password>"
# recommended extras (each enables more checks):
export CENTER_ID="<owner's center id>"
export OTHER_CENTER_ID="<id of a center the owner is not in>"
export OPERATOR_ACCESS_TOKEN="<jwt of a non-owner member of CENTER_ID>"
./scripts/test-tools.sh
```

Expected: every line `PASS`, final line `passed: N   failed: 0`, exit code 0.
`RUN_CHAT=0 ./scripts/test-tools.sh` runs everything except the model round trip.

**Send me the full output of `./scripts/test-tools.sh`** (it prints no secrets) before I continue with P1.4.
Things I could not verify from the sandbox and that this run confirms:

1. The Lovable gateway streams `tool_calls` for `google/gemini-2.5-flash` the way `llm.ts` expects
   (fragments by `index`, possibly no `id`). Look at the last lines of the chat check:
   `tools the model called:` should list `get_center_kpi` (or another tool), and the answer should quote real numbers.
2. The forced-final 5th model call (history containing `tool_calls` but no `tools` array) is accepted by the gateway.
   If the chat check ever shows an in-band `"type":"error"` frame after tool calls, that is the first suspect.
3. `verify_jwt = true` plus the new `apikey` header handling for direct tool mode.

Rate limit: the function allows 30 requests / minute / user. A full run issues 40–55 of them
(more with `OTHER_CENTER_ID` / `OPERATOR_ACCESS_TOKEN` set, or once the write round trip starts
executing for real from P1.4 on), so `test-tools.sh` paces itself at `RATE_MAX` requests/minute
(default 20, a real margin under 30) and, belt and suspenders, retries once more on an actual 429
after a real cool-down (`RETRY_COOLDOWN`, default 8s) rather than letting one rate-limit trip
cascade into every check after it — the 2026-09-22 run (`docs/TEST_RESULTS_FASE1B.md`) is exactly
that failure mode. Still: do not run it twice within the same minute.

## 4. After P1.4 — agenda write tools (migration + local SQL test + live tests)

```bash
npm run test:sql   # replays supabase/tests/12_agenda_write_fn.sql locally first
./scripts/deploy_fase1.sh migrations   # 20260922110000_agenda_write_tools.sql
./scripts/deploy_fase1.sh functions
RUN_CHAT=0 ./scripts/test-tools.sh
```

The new checks are validation-only (see the script's own comment): no real appointment gets
written into the live demo calendar. Watch for `create_appointment` / `move_appointment` /
`propose_recall` in the output, all `PASS`. To see the real conflict/draft/confirm/write path,
either exercise it through the chat (`RUN_CHAT=1`, ask the concierge to book something) or trust
`supabase/tests/12_agenda_write_fn.sql`, which already covers it against fixture data.

## 5. After P1.5 — progressive profile slots (migration + local SQL test + live tests)

```bash
npm run test:sql   # replays supabase/tests/13_profile_slots.sql locally first
./scripts/deploy_fase1.sh migrations   # 20260922120000_profile_slots.sql
./scripts/deploy_fase1.sh functions
RUN_CHAT=0 ./scripts/test-tools.sh
```

This run's `set_profile_slot` check writes a real (tagged) value into the live demo center's
profile, but reads the slot's own current value first and restores it (or deletes the row, if it
didn't have one) on every exit path via the script's cleanup trap — normal completion, an
assertion failure, or Ctrl-C. `get_center_profile` should now show a `completeness_pct` number,
and `get_missing_slots` returns at most 8 slots by default (`limit`, up to 20) even though the
full catalogue is 75 questions — `missing_count` still reports the true total.

## 6. After P1.6 — referto e azioni (migration + new function deploy + live tests)

```bash
npm run test:sql   # replays supabase/tests/14_center_reports.sql locally first
./scripts/deploy_fase1.sh migrations   # 20260922140000_center_reports.sql
./scripts/deploy_fase1.sh functions    # now also deploys generate-report
RUN_CHAT=0 ./scripts/test-tools.sh
```

`generate-report` is a **separate** edge function, not part of `ai-assistant` — `test-tools.sh`
does not call it (it uses model credits and writes a real report + 10 actions into the live demo
center, same caution as the chat round trip). Call it once by hand to confirm the whole thing:

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/generate-report" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" --data '{}' | jq .
```

Expected: `{"ok":true,"report":{...},"actions":[...10 rows...]}`. Check `report.diagnostic_narrative`
reads as plain prose (no `**`, no `- ` bullets, no `#` headings) — that's `generate-report`'s own
hand-kept copy of the plain-prose rule (CLAUDE.md), separate from `ai-assistant`'s
`RESPONSE_STYLE_INSTRUCTIONS`, worth double-checking specifically because it's not shared code.
Then confirm from the chat: ask the concierge "cosa dice il mio ultimo referto?" and expect it to
call `get_latest_report` and quote from it.

## 7. After P1.7 — push, scheduler, security pass (migrations + new function deploy + manual steps)

```bash
npm run test:sql   # replays supabase/tests/14_center_reports.sql (RLS fix, see below) and
                    # supabase/tests/15_device_tokens.sql locally first; scheduler migration is
                    # skipped locally (needs pg_cron/pg_net, Supabase-only extensions)
./scripts/deploy_fase1.sh migrations   # 20260922150000_device_tokens.sql, 20260922160000_scheduler.sql
./scripts/deploy_fase1.sh functions    # now also deploys send-push
RUN_CHAT=0 ./scripts/test-tools.sh
```

**Re-run `supabase/tests/14_center_reports.sql` even though P1.6 is already deployed** — the
security pass (`docs/SECURITY_REVIEW_FASE1.md`, finding 1) tightened `center_actions`' UPDATE RLS
from member-level to owner-only, in the same migration file P1.6 already shipped
(`20260922140000_center_reports.sql` is edited in place, not a new migration — Supabase reruns it
via `CREATE POLICY`'s `DROP POLICY IF EXISTS` guard, so `supabase db push` picks up the change on
a project that already ran the old version of this file). If a non-owner member of your live demo
center was relying on toggling a checklist item directly (not through the chat), that will now
get a permission error — expected, that's the fix.

### 7a. Enable `pg_cron` and `pg_net` on the project (dashboard, one-time)

**Not needed in the end** — settled on 2026-09-22 against the live project: the migration role
(`postgres`, not a superuser) installed both extensions itself, so no dashboard toggle was
required. Neither was enabled beforehand and the migration created both.

What *did* matter is the target schema. `CREATE EXTENSION` validates it before running, and
`net` does not exist yet — pg_net creates and owns that schema itself, so pre-creating it fails
with `schema net is not a member of extension "pg_net"`. The migration installs pg_net into
`extensions` (Supabase's usual home); its functions still land in `net`, so `net.http_post`
resolves either way. pg_cron goes into `pg_catalog`, which is what its control file wants.

If a future project *does* refuse the `CREATE EXTENSION` lines, the dashboard toggle
(Database → Extensions) is the fallback.

### 7b. Populate `internal_config` (manual, one-time — needed before either cron job can push)

```sql
insert into public.internal_config (key, value) values
  ('functions_base_url', 'https://<project-ref>.functions.supabase.co'),
  ('service_role_key', '<service role key, from Project settings -> API>')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

Run this in the SQL editor as the project owner — `internal_config` has zero RLS policies, so it
is not reachable any other way (see `docs/SECURITY_REVIEW_FASE1.md` finding 2 for why this is a
plain table rather than Vault, and the follow-up to move it there).

### 7b-bis. The two cron jobs are deployed PARKED — what you need before switching them on

`20260922160000_scheduler.sql` creates both jobs and then deactivates them in the same
migration, so nothing fires on a project that cannot deliver a push. Deployed state (2026-09-22):

```
weekly-briefing-monday   30 6 * * 1   active = false
daily-recall-reminders   0 8 * * *    active = false
```

Checklist before flipping them on — all three are prerequisites, not optional:

| # | What | Where it comes from |
|---|---|---|
| 1 | **Apple `.p8` private key** (`AuthKey_XXXXXXXXXX.p8`) | Apple Developer → Certificates, Identifiers & Profiles → Keys → new key with **APNs** enabled. Downloadable **once** — keep it safe. |
| 2 | **Key ID** (10 chars) | shown next to that key |
| 3 | **Team ID** (10 chars) | Apple Developer → Membership details |
| 4 | *(also needed)* **Bundle ID** of the iOS app | the native app's identifier |
| 5 | `internal_config` populated | §7b above — without it `fn_call_send_push` only logs a WARNING and skips |

Then set the secrets (§7c), and only then enable the jobs:

```sql
select cron.alter_job(jobid, active := true)
from cron.job where jobname in ('weekly-briefing-monday', 'daily-recall-reminders');
```

Use `cron.alter_job`, not `update cron.job` — that table is owned by `supabase_admin` and a
direct UPDATE is denied to the migration role. Re-running the migration parks them again.

Remember the DST caveat at the top of that migration: these are UTC clock times, so 06:30 UTC is
07:30 in winter and 08:30 in summer Italian time.

### 7c. Set the APNs function secrets

```bash
supabase secrets set APNS_TEAM_ID="<team id>" APNS_KEY_ID="<key id>" \
  APNS_BUNDLE_ID="<app bundle id>" APNS_ENVIRONMENT="sandbox" \
  APNS_PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)" --project-ref <project-ref>
```

`APNS_PRIVATE_KEY` can be the `.p8` file's contents with real newlines (the multi-line form above)
or a single-line value with literal `\n` — `apns.ts` accepts either. Use `APNS_ENVIRONMENT=sandbox`
until you have production APNs credentials; omit it (or set anything else) for production.

### 7d. Manual smoke test of `send-push` (needs a real device token — none exist yet from the app)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/send-push" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  --data '{"centerId":"<a real center id>","title":"Prova","body":"Solo un test."}' | jq .
```

Expected with no rows in `device_tokens` yet: `{"ok":true,"sent":0,"failed":0,"skipped_android":0}`.
Register a real iOS device token in `device_tokens` (once the native app implements APNs
registration) and re-run to confirm `sent:1` and that a push actually arrives — this is the one
part of P1.7 that has **never been exercised against real Apple infrastructure** from this sandbox
(no developer account, `.p8` key, or device available there); see `apns.ts`'s own header.

### 7e. Manually trigger each cron job once, instead of waiting for the schedule

```sql
select public.fn_run_weekly_briefing();
select public.fn_run_daily_recall_reminders();
```

Both are fire-and-forget (`pg_net.http_post`), so check `net._http_response` for the async result
rather than the `SELECT`'s own (empty) return value:

```sql
select status_code, content from net._http_response order by created desc limit 5;
```

Also confirm the schedules themselves registered:

```sql
select jobname, schedule, active from cron.job;
-- expected: weekly-briefing-monday | 30 6 * * 1 | t
--           daily-recall-reminders | 0 8 * * *   | t
```

Both are UTC clock times, not DST-aware "Europe/Rome" as the spec's prose describes — confirm
whether `cron.schedule` on your project's Postgres version supports a timezone-aware form
(`cron.schedule_in_database` / a `timezone` parameter varies by pg_cron version); if not, the
Monday-07:30-Rome / daily-recall times will drift by an hour across the DST change twice a year.
Flagged in the migration's own header and `docs/SECURITY_REVIEW_FASE1.md`; not fixed blind.

### 7f. Read `docs/SECURITY_REVIEW_FASE1.md`

One real RLS gap found and fixed (covered above, 7 and its re-run note), two deferrals documented
with rationale (plaintext secrets in `internal_config`, unexercised APNs delivery). Nothing else
needs action beyond what steps 7a–7e already cover, but worth reading in full before considering
Fase 1 closed.

## Notes on what could not be verified without the live project

- Migrations are validated locally against a Supabase stub (roles, `auth.uid()`, default
  privileges) on PostgreSQL 16, not on the managed Supabase image.
