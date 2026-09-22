-- Concierge backend, P1.7 (2/3): pg_cron scheduler for the weekly briefing and daily recall
-- reminders. Cannot be replayed against supabase/tests/run_local.sh's scratch Postgres (pg_cron
-- and pg_net are Supabase-platform extensions, not present in a stock local install) -- this
-- file's name is added to that script's SKIP_RE, same treatment as the pgvector migration.
--
-- KNOWN, UNVERIFIED CAVEAT (cannot be checked without the live project): the two cron schedules
-- below are plain UTC cron expressions, not "07:30 Europe/Rome" -- pg_cron has no confirmed,
-- version-independent way to pin a job to a local time zone that shifts for CET/CEST DST from
-- this sandbox. 06:30 UTC is 07:30 CET (winter) / 08:30 CEST (summer); 08:00 UTC similarly drifts
-- an hour across DST. Fix properly once the live pg_cron version's timezone support (if any) is
-- confirmed; flagged again in docs/SECURITY_REVIEW_FASE1.md.
--
-- internal_config is plain-table secret storage (functions_base_url, service_role_key), NOT
-- Supabase's own `vault` extension: RLS is enabled with zero policies (no role can read/write it
-- through PostgREST at all; only a SECURITY DEFINER function, or direct SQL as the migration
-- role, bypasses RLS the way a table owner always does). A production hardening pass should move
-- this to `vault.decrypted_secrets` instead -- also flagged in the security review, not attempted
-- blind here. The two values are NOT set by this migration (there is nothing to hardcode them to
-- that would be true for every environment) -- see docs/RUN_ON_MAC.md's new §7 for the one-time
-- manual INSERT this needs after deploy.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

-- ============================ 1) internal_config ============================
CREATE TABLE IF NOT EXISTS public.internal_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_config ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: RLS enabled + zero policies means SELECT/INSERT/UPDATE/DELETE are
-- denied to every role, full stop -- there is no "no one matches" gap to close later.
REVOKE ALL ON public.internal_config FROM PUBLIC, anon, authenticated;

-- ============================ 2) push helper ============================
-- Fire-and-forget: net.http_post queues the request and returns immediately (pg_net's own
-- design, a background worker performs the actual call), so a cron job's runtime never depends
-- on send-push's latency. Silently no-ops (with a WARNING) if internal_config isn't populated
-- yet, rather than failing the whole cron job over a deploy step that hasn't happened.
CREATE OR REPLACE FUNCTION public.fn_call_send_push(_center_id uuid, _title text, _body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
DECLARE
  v_base_url text;
  v_service_key text;
BEGIN
  SELECT value INTO v_base_url FROM public.internal_config WHERE key = 'functions_base_url';
  SELECT value INTO v_service_key FROM public.internal_config WHERE key = 'service_role_key';
  IF v_base_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'fn_call_send_push: internal_config not populated yet, skipping push for center %', _center_id;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_base_url || '/send-push',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_service_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('centerId', _center_id, 'title', _title, 'body', _body)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_call_send_push(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ============================ 3) scheduled jobs ============================
-- Weekly briefing: simple, warm copy -- no numbers, no narrative. This is infrastructure (does
-- the push pipeline fire on schedule at all); the real personalised Monday briefing is P4.1's
-- job, matching docs/45_SEQUENZA_PROMPT_BETA.md's own phase split.
CREATE OR REPLACE FUNCTION public.fn_run_weekly_briefing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN SELECT id, name FROM public.centers LOOP
    PERFORM public.fn_call_send_push(
      c.id,
      'Il tuo lunedì',
      'Il briefing della settimana è pronto: una cosa va bene, una va guardata.'
    );
  END LOOP;
END;
$$;

-- Daily recall reminder: only for centers that actually have dormant clients to recall, reusing
-- the same owner-gated KPI calc the report and the chat's get_center_kpi both already trust.
CREATE OR REPLACE FUNCTION public.fn_run_daily_recall_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c RECORD;
  k RECORD;
BEGIN
  FOR c IN SELECT id, name FROM public.centers LOOP
    SELECT * INTO k FROM public.fn_center_kpi_calc(c.id, now());
    CONTINUE WHEN NOT FOUND OR coalesce(k.dormant_clients_count, 0) = 0;

    PERFORM public.fn_call_send_push(
      c.id,
      'Clienti da richiamare',
      CASE
        WHEN k.dormant_clients_count = 1 THEN 'Hai una cliente ferma da richiamare. Te la preparo io.'
        ELSE format('Hai %s clienti ferme da richiamare. Te le preparo io.', k.dormant_clients_count)
      END
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_run_weekly_briefing() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_run_daily_recall_reminders() FROM PUBLIC, anon, authenticated;

-- 06:30 UTC every Monday -- see the DST caveat at the top of this file.
SELECT cron.schedule(
  'weekly-briefing-monday',
  '30 6 * * 1',
  $$ SELECT public.fn_run_weekly_briefing(); $$
);

-- 08:00 UTC every day -- see the DST caveat at the top of this file.
SELECT cron.schedule(
  'daily-recall-reminders',
  '0 8 * * *',
  $$ SELECT public.fn_run_daily_recall_reminders(); $$
);

-- Created but PARKED. cron.schedule() arms a job the moment it returns, and there is no APNs
-- credential on this project yet (no .p8 key / key id / team id -- see docs/RUN_ON_MAC.md §7),
-- so every firing would only walk all centers to reach a push that cannot be delivered. The
-- schedules, the functions and the wiring are all in place; flip `active` to true once APNs is
-- configured and internal_config is populated. Idempotent, and re-running this migration
-- re-parks the jobs rather than silently re-arming them.
UPDATE cron.job SET active = false
WHERE jobname IN ('weekly-briefing-monday', 'daily-recall-reminders');

-- ============================ DOWN (manual rollback) ============================
-- SELECT cron.unschedule('daily-recall-reminders');
-- SELECT cron.unschedule('weekly-briefing-monday');
-- DROP FUNCTION IF EXISTS public.fn_run_daily_recall_reminders();
-- DROP FUNCTION IF EXISTS public.fn_run_weekly_briefing();
-- DROP FUNCTION IF EXISTS public.fn_call_send_push(uuid, text, text);
-- DROP TABLE IF EXISTS public.internal_config;
-- (pg_cron / pg_net are left installed: other jobs/consumers may depend on them.)
