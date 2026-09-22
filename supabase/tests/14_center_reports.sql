-- Tests for the P1.6 report tables (report_thresholds, center_reports, center_actions).
-- generate-report itself (a single one-shot model call) is not exercised here -- there is no
-- live model to call from a scratch Postgres -- what's worth testing at this layer is the seed
-- data and the RLS/grants the tool layer and the edge function both rely on. Reuses the T1
-- fixture from 10_kpi_math.sql (owner u1, operator u2; other tenant T2 owner u3).
\set ON_ERROR_STOP on
SET search_path = public, extensions;

DO $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM public.report_thresholds;
  ASSERT n = 5, format('expected 5 threshold rows, got %s', n);

  SELECT count(*) INTO n FROM public.report_thresholds WHERE metric_key = 'dormant_clients_count' AND NOT higher_is_better;
  ASSERT n = 1, 'dormant_clients_count must be the one lower-is-better metric';

  -- reseeding must not duplicate
  INSERT INTO public.report_thresholds (metric_key, label, unit, higher_is_better, ok_threshold, watch_threshold)
  VALUES ('avg_ticket_7d', 'Scontrino medio', '€', true, 55, 40)
  ON CONFLICT (metric_key) DO UPDATE SET label = EXCLUDED.label;
  SELECT count(*) INTO n FROM public.report_thresholds;
  ASSERT n = 5, 'reseeding must not duplicate rows';
END $$;

-- thresholds readable by any authenticated user (not tenant data), not by anon
DO $$
DECLARE
  u3 uuid := '33333333-3333-4333-8333-333333333333';
  n integer;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.report_thresholds;
  ASSERT n = 5, 'any authenticated user reads the whole thresholds table';
  RESET ROLE;

  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM public.report_thresholds;
  ASSERT n = 0, 'anon reads nothing';
  RESET ROLE;
END $$;

-- center_reports / center_actions: members read, tenant isolation, no direct writes by authenticated
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';  -- T1 owner
  u2 uuid := '22222222-2222-4222-8222-222222222222';  -- T1 operator
  u3 uuid := '33333333-3333-4333-8333-333333333333';  -- T2 owner
  v_report_id uuid;
  n integer;
BEGIN
  DELETE FROM public.center_reports WHERE center_id = t1;

  -- only service_role creates a report (matching what generate-report's service client does)
  INSERT INTO public.center_reports (center_id, period_start, period_end, kpi_snapshot, diagnostic_narrative, generated_by)
  VALUES (t1, '2026-09-16', '2026-09-22', '[{"metric_key":"avg_ticket_7d","value":61,"status":"ok"}]'::jsonb, 'Tutto bene.', u1)
  RETURNING id INTO v_report_id;

  INSERT INTO public.center_actions (report_id, center_id, kind, number, action_text)
  VALUES
    (v_report_id, t1, 'urgent', 1, 'Richiama le dormienti'),
    (v_report_id, t1, 'strategic', 1, 'Rivedi il listino');

  -- the owner reads it
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.center_reports WHERE center_id = t1;
  ASSERT n = 1, 'owner reads the report';
  SELECT count(*) INTO n FROM public.center_actions WHERE center_id = t1;
  ASSERT n = 2, 'owner reads both actions';

  -- authenticated (even the owner) cannot INSERT a report directly -- no grant at all
  BEGIN
    INSERT INTO public.center_reports (center_id, period_start, period_end, kpi_snapshot, diagnostic_narrative)
    VALUES (t1, '2026-09-16', '2026-09-22', '[]'::jsonb, 'x');
    ASSERT false, 'an authenticated direct insert into center_reports must be rejected';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  -- an operator (member, not owner) can UPDATE an action's done flag
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.center_actions SET done = true, done_at = now() WHERE report_id = v_report_id AND kind = 'urgent' AND number = 1;
  SELECT count(*) INTO n FROM public.center_actions WHERE report_id = v_report_id AND kind = 'urgent' AND number = 1 AND done;
  ASSERT n = 1, 'operator can toggle an action done (RLS is member-level; the chat TOOL is the owner-only gate)';

  -- but an operator cannot INSERT a new action directly -- no grant at all
  BEGIN
    INSERT INTO public.center_actions (report_id, center_id, kind, number, action_text)
    VALUES (v_report_id, t1, 'urgent', 2, 'sneaky');
    ASSERT false, 'an authenticated direct insert into center_actions must be rejected';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  -- T2's owner sees none of T1's report or actions
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.center_reports WHERE center_id = t1;
  ASSERT n = 0, 'a foreign-tenant owner sees no reports of T1';
  SELECT count(*) INTO n FROM public.center_actions WHERE center_id = t1;
  ASSERT n = 0, 'a foreign-tenant owner sees no actions of T1';
  RESET ROLE;

  SET LOCAL ROLE anon;
  BEGIN
    PERFORM * FROM public.center_reports WHERE center_id = t1;
    ASSERT false, 'anon must not be able to query center_reports';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END $$;

SELECT 'center reports tests passed' AS result;
