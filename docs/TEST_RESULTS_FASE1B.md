# Fase 1B — security review, deploy and live verification (P1.4–P1.7)

Date: 2026-09-22 · branch `feature/concierge-backend` · project `4elementi` (`jybewogjncaoscrnlqum`).

P1.4–P1.7 was written in a sandbox with no `npm`, `deno`, `psql` or `supabase` CLI, so **none of it
had ever been executed** before this pass — not the code, not the migrations, not its own tests.
§§1–6 record what running it turned up, what was verified independently, and what was deployed
that morning. §7 records the two live test runs that followed. §8 is a same-day follow-up pass,
written after reading §7's results: four fixes (test-script pacing, `get_missing_slots`'s cap, the
write round trip's center resolution, profile-slot cleanup), **code and docs only** — the live
project had an unrelated client demo scheduled that afternoon, so nothing in §8 was deployed or
run live; it is queued for the next deploy + live-test pass.

Companion documents: `docs/SECURITY_REVIEW_FASE1.md` (the static review this pass audits) and
`docs/RUN_ON_MAC.md` (the operational steps).

## 1. Local checks

| Check | First run | After fixes |
|---|---|---|
| `npm run lint` | stalled indefinitely | **0 problems** |
| `npm run typecheck` | pass | pass |
| `deno check` | **failed** | pass |
| `deno test` | could not run | **90 passed / 0 failed** (92 after §8's fixes) |
| `npm run test:sql` | **4 of 6 files failed** | **6 of 6 pass** |
| `npm run build` | — | pass |

The lint stall is environmental, not a lint error: the repo lives under an iCloud-synced Desktop
path and `eslint` blocks on `node_modules` reads (`ditto` reports `Operation timed out` on
individual files; `curl` to the same registry is instant). Running it from an off-iCloud mirror
with its own `npm ci` completes in **5 seconds, exit 0**. `tsc`, `deno` and `vite` are unaffected.

## 2. Defects found

Eight real defects, every one of them invisible until the code was actually executed.

### 2.1 `fn_create_appointment` silently double-booked cabin 1

`FOR v_cabin IN 1..v_cabin_count` auto-declares a **new** loop-scoped integer that shadows the
`v_cabin` declared above it, so the auto-assign branch never carried the cabin it found to the
`INSERT`. Confirmed end to end: with cabin 1 busy, the row stored `cabin = NULL`. Because every
conflict check reads `coalesce(cabin, 1)`, such a row *is* cabin 1 from then on — so the next
booking for cabin 1 at that time would have been accepted on top of it.

The repo's own test asserted the auto-assign case correctly, but could never run (see 2.5).

### 2.2 The demo display-name fix was a no-op — in exactly the case it was written for

The migration keyed its `UPDATE` on `profiles.email`, which is **NULL** for this account: the
`on_auth_user_created` trigger creates the profiles row from auth metadata without an email, and
the seed's `INSERT ... ON CONFLICT (user_id) DO NOTHING` never backfills it. `email = '…'`
evaluates to NULL, so the statement matched zero rows.

Verified against production before deploying: `display_name` was `Romesh Singha`, `profiles.email`
was `NULL`, `auth.users.email` was correct. It now checks `auth.users.email`, which is
authoritative and always populated. After deploy the value reads `Aurora Demo`.

### 2.3 `create_appointment` could not be called by the model at all

`create_appointment` requires a `service_id`, and its own parameter description tells the model to
take it "da get_center_profile". `get_center_profile` is the only tool that reads
`business_services` — and it selected `name, category, price, duration_minutes`, **not `id`**. No
tool anywhere returned a service id, so there was no way for the model to produce a valid one.
The write tool was unreachable in normal use. `id` is now included.

### 2.4 `get_missing_slots` returned an unusable blob on a new center

It was the only list-returning tool with no cap on its output (siblings all have `MAX_SERVICES`,
`MAX_APPOINTMENTS`, `MAX_GAPS`, …). The catalogue is 75 questions with long labels, so a center
that has answered nothing serialises past `run.ts`'s 6 KB limit and `capResult` replaces the list
with `{truncated, preview}` — a string, not data. That is the brand-new-center case, which is
precisely what the tool exists for. Fixed that morning to return the first 15 (welcome-interview
slots sort first) while still reporting the true `missing_count`; further tightened same-day to a
configurable, smaller default — see §8.2.

### 2.5 The test suites could not run

Four separate problems, all in the tests rather than the code — but they were what hid 2.1:

- `smallint` arguments passed as bare integer literals, so PL/pgSQL matched no overload
  (`int4 → int2` is an assignment cast, not an implicit one). PostgREST casts named JSON arguments
  to declared types, so the edge functions were never affected.
- The `anon` blocks switched role without clearing `request.jwt.claims`, leaving `auth.uid()`
  pointing at the previous user — testing a state no anonymous request can be in.
- Three of those blocks expected `insufficient_privilege`; see 3.2 for why that is the wrong
  expectation in this project.
- `12_agenda_write_fn.sql` treated cabin 1 at 10:00 as free, but the fixture's `Carla Neri` sits
  there with `cabin NULL`, which the conflict check reads as cabin 1.
- Tool tests passed short ids where the schemas require `format: uuid`, so validation rejected
  them before any handler ran. One consequence worth noting: the `set_action_done` cross-tenant
  test was **passing for the wrong reason** — rejected on id format, never reaching the center
  check it claims to verify. It now exercises the real path.
- `deno test` needs `--allow-env` for the APNs env-var cases.

### 2.6 `deno check` failed outright

`crypto.subtle.importKey` rejects a bare `Uint8Array` (it widens to `ArrayBufferLike`, which
`BufferSource` excludes). P1.7 could not have passed its own gate. Same pattern in the test.

### 2.7 Two scheduler statements fail against the live project

Both found by rehearsing the migration in a rolled-back transaction, and neither reachable from
the local SQL harness, which skips that file for want of `pg_cron`/`pg_net`:

- `CREATE EXTENSION ... WITH SCHEMA net` — `CREATE EXTENSION` validates its target schema first
  and `net` does not exist. pg_net creates and owns that schema itself, so pre-creating it fails
  too (`schema net is not a member of extension "pg_net"`). Installing into `extensions` works and
  still places the functions in `net`, so `net.http_post` resolves unchanged.
- `UPDATE cron.job SET active = false` — the table is owned by `supabase_admin` and the UPDATE is
  denied to the migration role. `cron.alter_job` is pg_cron's supported entry point.

### 2.8 The live script exceeded the function's own rate limit

`ai-assistant` allows 30 requests/minute/user. The script now makes well over 30 and was bursting
them, so a run died part-way with `429`s and every later check "failed" for reasons unrelated to
the code — including skipping the write round trip entirely, because the profile lookup it depends
on was one of the rejected calls. Requests are now paced evenly below the limit.

## 3. Security review — independent verification

`docs/SECURITY_REVIEW_FASE1.md` was audited rather than trusted; claims were checked against a
scratch database and then against the live project. **It holds up.** Its Finding 1 fix is real:
`center_actions` UPDATE is owner-only in the deployed schema, an operator's UPDATE affects 0 rows,
the owner's affects 1, and a foreign-tenant owner reads 0 reports and 0 actions.

### 3.1 Confirmed correct

- **RLS on all six new tables** — enabled with the intended policies. A genuinely unauthenticated
  request (no JWT claims at all) reads **0 rows** from every one of them.
- **Write tools** — `confirmed:true` gating and center scoping hold; `anon` gets
  `insufficient_privilege` on `fn_create_appointment` / `fn_move_appointment` / `fn_propose_recall`,
  which are `SECURITY DEFINER` with `authenticated`-only EXECUTE.
- **`send-push`** — reachable only with the service-role key, with `verify_jwt = true` as a second
  layer. Verified post-deploy: an unauthenticated POST returns 401.
- **`internal_config`** — RLS enabled, zero policies, explicit `REVOKE`; `anon` and `authenticated`
  both denied SELECT, and `fn_call_send_push` is not executable by `anon`.
- **`generate-report`** — owner gate is real: identity from `auth.getUser`, membership resolved
  through an RLS-scoped client, explicit `role !== "owner"` → 403, and the KPI read goes through
  the user-scoped client too.
- **anon EXECUTE on `is_center_member` / `center_role`** — benign. Probed directly: they return
  `false` and `NULL` without `auth.uid()`. The grant is also load-bearing, since policies that call
  them are evaluated as the caller.

### 3.2 Not in the doc — `anon` holds table privileges on every new table

`anon` has `SELECT/INSERT/UPDATE/DELETE` on all six new tables, inherited from Supabase's default
grants, with RLS as the only barrier. Before treating this as a P1.4–P1.7 regression, all **40**
public tables were checked: **every one is the same**, including the 34 that predate this phase.
So it is the project's standing posture, not something this phase introduced, and tightening it is
a platform-wide hardening pass rather than a special case on six tables. Recorded here because the
review does not mention it, and because the repo's own tests asserted the opposite.

No data is exposed: with no claims, `anon` reads 0 rows everywhere, and writes fail the
`WITH CHECK`.

### 3.3 Not in the doc — the scheduler armed itself on apply

`cron.schedule()` activates a job the moment it returns, so applying the migration as written
would have started both jobs against a project with no APNs credential. They are now created and
parked in the same migration. See §5.

### 3.4 Minor, not fixed

`isServiceRoleCaller` compares the bearer token with `===`, which is not constant-time. Low
severity over HTTP and not fixed blind; noted for a future pass.

## 4. The "Romesh" greeting

**It was never a cross-tenant leak, and the fix for it did not work.**

Re-verified independently rather than taken from the migration's comment: `loadUserContext`
filters `profiles` by `authenticatedUserId`, which comes from `supabase.auth.getUser(token)` —
server-verified, never client-supplied. Conversation history is scoped the same way. No code path
reads another user's profile. The wrong name was simply that one account's own stale
`profiles.display_name`.

The fix shipped for it, however, was a no-op for the reason in §2.2, and would have left the demo
account greeting "Romesh Singha" after a successful-looking deploy. Corrected and confirmed live.

## 5. Deploy record

Because the remote migration history has drifted from the local files (56 migration files locally,
~25 versions recorded remotely), `supabase db push` was not used. Each migration was instead
rehearsed inside a transaction that rolls back, applied on its own, and recorded with only its own
history row — all through `supabase db query --linked` on the already-linked CLI.

| # | Migration | Rehearsal | Applied |
|---|---|---|---|
| 1 | `20260922090000_fix_demo_profile_display_name` | `Romesh Singha` → `Aurora Demo` | yes |
| 2 | `20260922110000_agenda_write_tools` | 3 SECDEF functions, `anon` has no EXECUTE | yes |
| 3 | `20260922120000_profile_slots` | 75 catalogue rows, 8 welcome, RLS + 4 policies | yes |
| 4 | `20260922140000_center_reports` | 5 thresholds, owner-only UPDATE confirmed | yes |
| 5 | `20260922150000_device_tokens` | per-user RLS with membership `WITH CHECK` | yes |
| 6 | `20260922160000_scheduler` | failed twice, fixed (§2.7), then clean | yes |

Six history rows recorded, and only those six. Edge functions deployed: `ai-assistant` (changed),
`generate-report` and `send-push` (new). All three answer 401 unauthenticated.

`pg_cron` and `pg_net` did **not** need the dashboard toggle that `RUN_ON_MAC.md` §7a anticipated —
the non-superuser migration role installed both itself. That section has been corrected.

One transient obstacle worth recording: the first `functions deploy` failed with
`Fetch 'https://esm.sh/@supabase/supabase-js@2' timed out after 10s` from Supabase's bundler,
twice, while the same URL answered in 0.15s locally. It succeeded on retry; the import is
pre-existing and unchanged.

## 6. Scheduler: created, parked

```
weekly-briefing-monday   30 6 * * 1   active = false
daily-recall-reminders   0 8 * * *    active = false
```

`internal_config` is deliberately empty, and no APNs secrets are set. Nothing can fire. What is
needed before switching them on — Apple `.p8` key, key id, team id, bundle id, plus populating
`internal_config` — is listed as a checklist in `docs/RUN_ON_MAC.md` §7b-bis, together with the
`cron.alter_job` command that enables them and the UTC/DST caveat.

## 7. Live test results

Two runs against the deployed project, both saved under `logs/` (gitignored).

### 7.1 `logs/live_test_fase1_20260922_091502.log` — P1.3 only, 22 passed / 0 failed

Run before P1.4–P1.7 were deployed, so it only exercises the tool-calling loop itself. This is
the run that answers `RUN_ON_MAC.md` §3's two open risk items:

1. **Gateway `tool_calls` streaming for `gemini-2.5-flash`** — confirmed. The chat check shows
   `tools the model called: get_center_kpi`: the gateway streamed a real tool call, `agent.ts`
   assembled it correctly, and the tool result was fed back.
2. **The forced-final tool-less call** — confirmed for the common case (one tool round, then a
   final answer): 1732 chars of coherent Italian prose, `no in-band error frame`, stream ends
   with `[DONE]`. This one interaction happened to need only 2 model calls, so it does not by
   itself prove round 5 specifically (all `tools` omitted, mid-conversation `tool_calls`/`tool`
   history present) — but the same code path handles every round the same way, and nothing in
   `agent.ts` branches on which round number triggers `forceFinal`.

Side finding, not a new defect: the answer opens "Ciao Romesh!" and continues "Romesh,
dall'analisi..." — this is the stale-`profiles.display_name` issue already tracked in §4/§2.2,
predating this run; the display-name fix was deployed after it.

### 7.2 `logs/live_test_fase1_20260922_122328.log` — full P1.4–P1.7 run, 33 passed / 8 failed

Run right after deploying P1.4–P1.7, before the pacing fix existed. The user's read of the
failures — **confirmed, with one clarification**: 7 of the 8 are the same root cause (the script
burst well past the function's 30 req/min limit), but they are not 7 independent rate-limit hits.
Exactly **5** show `HTTP 429` directly (`get_latest_report`, `set_action_done` × 3, the chat round
trip's first check); the other 2 (`stream ends with [DONE]`, `final answer text streamed`) are not
separate 429s, they are consequences of that *same* chat request having failed — without a real
SSE body there was never a `[DONE]` line or streamed text to find. So: **7 checks sharing one root
cause** (5 direct 429s + 2 cascading from the single chat request that got one of them) **+ 1
checked-but-not-rate-limited failure** (`get_missing_slots` returning `{truncated, preview}`
instead of a list — a real, distinct defect, already understood per §2.4 and further addressed
today, §8.2) **= the 8 in the log.**

There is also a **silent, uncounted symptom of the same rate-limiting** that never showed up as a
`FAIL` at all: `skip write round trip: center is '', not the demo center`. The `get_center_profile`
precheck for that section landed inside the same rate-limited stretch, came back as a 429 JSON
error, and `.data.center.name // empty` silently read as `""`. It was misreported as "wrong
center" — never counted among the 8 — only because that code path treated any non-matching name
the same way, whether the lookup had actually succeeded or not. Fixed today, §8.3.

Because the chat request itself never reached the model (429 before any gateway call), this run
neither confirms nor refutes the two risk items above — it is inconclusive on both, not negative.
§7.1 remains the only live confirmation of them so far.

## 8. Today's follow-up (2026-09-22, code and docs only — nothing deployed)

Per instruction: the live project has a client demo this afternoon on the currently-deployed
version, so today's four fixes are **not deployed and were not run live**. Everything below was
verified locally: `deno check` + `deno test` (92 passed / 0 failed, up from 90 — two new cases for
§8.2), `npm run test:sql` (6/6), `npm run lint` / `npm run typecheck` clean, plus a disposable local
HTTP mock standing in for the deployed function so `scripts/test-tools.sh`'s own control flow —
not the server logic, which the `deno test` suite already covers — could be exercised end to end
without touching Supabase. The mock and its runs are not committed (scratch only).

### 8.1 Pacing: a real margin, plus a retry as a safety net

`RATE_MAX` (requests/minute the script paces itself to) is 25 → **20**, and `post_json` now
retries once (`RATE_LIMIT_RETRIES=2`, so up to 3 attempts) after a real cool-down
(`RETRY_COOLDOWN=8s`, not just the normal pacing gap) if a 429 gets through anyway — including the
SSE chat call, which bypassed `post_json` and got its own copy of the same retry loop. This is
belt-and-suspenders on top of the pacing that already existed (`e204463`, landed after §7.2's run,
never deployed): pacing alone should already keep any 60-second window under 30 requests with
`RATE_MAX=20` (10 of margin), but a retry means a single stray 429 — clock drift, one slow
request, an extra optional check — self-heals instead of cascading, which is what actually
happened in §7.2. Verified: a local run with two 429s injected on the very first tool check still
finished with the exact same pass/fail count as a clean run (only the ~2×`RETRY_COOLDOWN` extra
wall-clock time), confirming the retry recovers without side effects on the checks around it.
Purely client-side (`scripts/test-tools.sh`); takes effect on the next run with no redeploy.

### 8.2 `get_missing_slots`: configurable `limit`, default 8 (was a fixed 15)

§2.4's fix (fixed cap of 15) was correct in kind but had not been exercised: 15 long Italian
labels is still close enough to `run.ts`'s 6 KB cap that it isn't a comfortable margin, and a
fixed number gives a caller no way to ask for more when it genuinely wants the fuller list. Now
`limit` (1–20, default 8) is a real parameter, validated by the same schema mechanism as every
other tool. Two new `deno test` cases: default is ≤ 8 out of 75 (`missing_count` still 75), and
`limit` is honoured up to 20 with out-of-range values (0, negative, 21, non-integer) rejected
before any query runs. `scripts/test-tools.sh` checks the new default and the limit's boundaries.
**This one touches `ai-assistant`'s own code, unlike 8.1/8.3/8.4** — it needs tonight's redeploy
to take effect against the live project; the deploy is already the plan for tonight regardless.

### 8.3 Write round trip: a failed lookup is no longer mistaken for "wrong center"

Root cause of the silent symptom in §7.2: the precheck read `.data.center.name // empty` without
first checking whether the request had actually succeeded, so a 429 (or any other failure) and a
genuine "you're not on the demo center" case produced the identical, ambiguous message. The
precheck's HTTP status and `.ok` are now checked explicitly; a real failure is a visible `FAIL`
naming the HTTP code and body, and the "not the demo center" skip only fires once the lookup is
known to have actually succeeded. Verified against the local mock in four scenarios: matching
center (full round trip runs and passes), mismatched center (skip message, no write attempted),
and a `get_center_profile` failure (`FAIL "resolve the demo center..."`, not a skip). Purely
client-side; no redeploy needed.

### 8.4 Profile slot write: restored or removed automatically, not left as "harmless, an upsert"

The `set_profile_slot` check overwrote `trattamenti_piu_eseguiti` with tagged test data and never
put anything back — acceptable for a one-off run, not for a script meant to be re-run against the
same live demo center repeatedly. It now reads the slot's real current value via PostgREST
*before* writing (skipping the write entirely if that read itself fails, rather than guessing),
and the same EXIT trap that already cleaned up the test appointment restores the original value
(`PATCH`, member-level) or deletes the row if it never had one (`DELETE`, owner-level) — on normal
completion, an assertion failure, or Ctrl-C. The trap is now armed from the very start of the
script instead of only once the appointment section is reached, so it also covers the profile-slot
write if the script is ever interrupted before reaching 2e. Verified against the local mock in
both directions — restore (the mock's canned prior value came back exactly in the `PATCH` body)
and delete (fresh slot, `DELETE` fires) — end to end, trap included. Purely client-side; no
redeploy needed.

## 9. Not covered

- **APNs delivery** — still never exercised against real Apple infrastructure: no developer
  account, `.p8` key or device. The JWT signing is unit-tested against a throwaway key pair; the
  HTTP/2 call to `api.push.apple.com` is not.
- **The cron jobs actually firing** — parked by design, so neither schedule has ever run.
- **`generate-report` end to end** — not called live (model credits, and it writes a real report);
  `get_latest_report` covers the read side.
- **pg_cron timezone behaviour** — schedules are UTC clock times, so they drift an hour across
  CET/CEST. Unchanged from the original caveat.
- **Cross-center 403 and non-owner role scoping** — the live run had no `OTHER_CENTER_ID` or
  `OPERATOR_ACCESS_TOKEN`, so those checks were skipped there. Both are covered deterministically
  in the SQL suite against fixture data.
