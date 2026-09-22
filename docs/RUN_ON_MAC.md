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

Rate limit: the function allows 30 requests / minute / user; the script stays well below that, but do not
run it twice within the same minute.

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
profile — harmless, an upsert, easy to overwrite again. `get_center_profile` should now show a
`completeness_pct` number.

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

## Notes on what could not be verified without the live project

- Migrations are validated locally against a Supabase stub (roles, `auth.uid()`, default
  privileges) on PostgreSQL 16, not on the managed Supabase image.
