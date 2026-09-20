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
| `SUPABASE_URL` | `test-tools.sh` (from P1.3) | Project settings → API → Project URL |
| `SUPABASE_ANON_KEY` | `test-tools.sh` (from P1.3) | Project settings → API → `anon` `public` key |

## 1. Local checks (no Supabase needed)

```bash
npm run verify        # lint + typecheck + build
npm run test:sql      # replays migrations on a scratch local Postgres and runs supabase/tests/*.sql
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

## Notes on what could not be verified without the live project

- Migrations are validated locally against a Supabase stub (roles, `auth.uid()`, default
  privileges) on PostgreSQL 16, not on the managed Supabase image.
