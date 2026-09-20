-- Unit tests for the P1.2 KPI views / gaps / goal simulator (run by supabase/tests/run_local.sh).
-- Deterministic: every call passes a fixed _as_of = Wed 2026-09-16 12:00 Europe/Rome (CEST, +02:00).
-- Expected values were computed by hand; see the comment above each assertion.
--
-- Fixture center T1 (2 cabins, Mon-Sat 09:00-19:00):
--   completed in the 7-day window (Thu 10 .. Wed 16 Sep):
--     Anna Rossi   A 50/60  Thu 10 10:00        Bianca Verdi B 100/90 Fri 11 11:00
--     "anna  rossi " A 50/60 Tue 15 15:00       Carla Neri   A 50/60  Wed 16 10:00
--   completed earlier: Lucia Blu A 3 Sep; Anna Rossi A 30 Aug; Hilda A 20 Jul (58 d ago, not dormant);
--     Giulia Bassi A 20 Jun + B 1 Jul (77 d ago, DORMANT); Irene Nero A 1 Jun (107 d) but booked 20 Sep.
--   other: cancelled Dora 12 Sep, Carla cancelled 30 Sep (must NOT count as rebooking),
--     Bianca confirmed 25 Sep (rebooked). Sep 16 afternoon: Elisa cab1 14:00-15:30,
--     Fede cab2 13:00-14:00, Gigi cab2 13:30-14:30 (overlaps Fede).

\set ON_ERROR_STOP on
SET search_path = public, extensions;

-- ---------- fixtures (superuser, idempotent) ----------
DO $$
DECLARE
  u1 uuid := '11111111-1111-4111-8111-111111111111';  -- T1 owner
  u2 uuid := '22222222-2222-4222-8222-222222222222';  -- T1 operator
  u3 uuid := '33333333-3333-4333-8333-333333333333';  -- T2 owner (other tenant)
  u4 uuid := '44444444-4444-4444-8444-444444444444';  -- T3 owner (catalogue-only center)
  u5 uuid := '55555555-5555-4555-8555-555555555555';  -- T4 owner (empty center)
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  t2 uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  t3 uuid := 'aaaaaaaa-0000-4000-8000-000000000003';
  t4 uuid := 'aaaaaaaa-0000-4000-8000-000000000004';
  sa uuid; sb uuid;
BEGIN
  INSERT INTO auth.users (id, email) VALUES
    (u1, 'kpi.owner@example.test'), (u2, 'kpi.operator@example.test'),
    (u3, 'other.owner@example.test'), (u4, 'catalog.owner@example.test'), (u5, 'empty.owner@example.test')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.centers (id, name, owner_user_id, cabin_count) VALUES
    (t1, 'T1 KPI', u1, 2), (t2, 'T2 other tenant', u3, 1), (t3, 'T3 catalogue only', u4, 1), (t4, 'T4 empty', u5, 1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.center_members (center_id, user_id, role, status) VALUES
    (t1, u1, 'owner', 'active'), (t1, u2, 'operator', 'active'),
    (t2, u3, 'owner', 'active'), (t3, u4, 'owner', 'active'), (t4, u5, 'owner', 'active')
  ON CONFLICT (center_id, user_id) DO NOTHING;

  DELETE FROM public.business_appointments WHERE center_id IN (t1, t2, t3, t4);
  DELETE FROM public.business_services WHERE center_id IN (t1, t2, t3, t4);

  INSERT INTO public.business_services (center_id, user_id, name, category, duration_minutes, price)
  VALUES (t1, u1, 'A', 'Viso', 60, 50) RETURNING id INTO sa;
  INSERT INTO public.business_services (center_id, user_id, name, category, duration_minutes, price)
  VALUES (t1, u1, 'B', 'Viso', 90, 100) RETURNING id INTO sb;
  INSERT INTO public.business_services (center_id, user_id, name, category, duration_minutes, price) VALUES
    (t3, u4, 'A', 'Viso', 60, 50), (t3, u4, 'B', 'Viso', 90, 100);
  -- T2 has data too: it must never show up in T1's numbers
  INSERT INTO public.business_appointments
    (center_id, user_id, client_name, service_name, appointment_at, duration_minutes, price, status)
  VALUES (t2, u3, 'Zoe Estranea', 'A', '2026-09-15 10:00+02', 60, 9999, 'completato');

  INSERT INTO public.business_appointments
    (center_id, user_id, client_name, service_id, service_name, appointment_at, duration_minutes, price, status, cabin)
  SELECT t1, u1, v.client, CASE v.svc WHEN 'A' THEN sa ELSE sb END, v.svc, v.at::timestamptz,
         CASE v.svc WHEN 'A' THEN 60 ELSE 90 END, CASE v.svc WHEN 'A' THEN 50 ELSE 100 END, v.st, v.cab
  FROM (VALUES
    -- 7-day window, completed
    ('Anna Rossi',    'A', '2026-09-10 10:00+02', 'completato', NULL::smallint),
    ('Bianca Verdi',  'B', '2026-09-11 11:00+02', 'completato', NULL),
    ('anna  rossi ',  'A', '2026-09-15 15:00+02', 'completato', NULL),
    ('Carla Neri',    'A', '2026-09-16 10:00+02', 'completato', NULL),
    -- earlier completed
    ('Lucia Blu',     'A', '2026-09-03 10:00+02', 'completato', NULL),
    ('Anna Rossi',    'A', '2026-08-30 10:00+02', 'completato', NULL),
    ('Hilda Grigi',   'A', '2026-07-20 10:00+02', 'completato', NULL),
    ('Giulia Bassi',  'A', '2026-06-20 10:00+02', 'completato', NULL),
    ('Giulia Bassi',  'B', '2026-07-01 10:00+02', 'completato', NULL),
    ('Irene Nero',    'A', '2026-06-01 10:00+02', 'completato', NULL),
    -- not completed / future
    ('Dora Cancel',   'A', '2026-09-12 10:00+02', 'annullato',  NULL),
    ('Carla Neri',    'A', '2026-09-30 10:00+02', 'annullato',  NULL),
    ('Bianca Verdi',  'A', '2026-09-25 10:00+02', 'confermato', NULL),
    ('Irene Nero',    'A', '2026-09-20 10:00+02', 'confermato', NULL),
    -- Sep 16 afternoon (gap fixture)
    ('Elisa Bruni',   'B', '2026-09-16 14:00+02', 'confermato', 1),
    ('Fede Sala',     'A', '2026-09-16 13:00+02', 'confermato', 2),
    ('Gigi Riva',     'A', '2026-09-16 13:30+02', 'confermato', 2)
  ) AS v(client, svc, at, st, cab);
END $$;

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION pg_temp.as_user(_uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
END $$;

-- ---------- 1) KPI math (owner) ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  k record;
BEGIN
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;

  SELECT * INTO k FROM public.fn_center_kpi(t1, '2026-09-16 12:00+02');
  ASSERT FOUND, 'owner must get a KPI row';
  ASSERT k.completed_appointments_7d = 4,      format('completed_7d expected 4 got %s', k.completed_appointments_7d);
  ASSERT k.revenue_7d = 250,                   format('revenue_7d expected 250 got %s', k.revenue_7d);
  ASSERT k.avg_ticket_7d = 62.50,              format('avg_ticket_7d expected 62.50 got %s', k.avg_ticket_7d);
  ASSERT k.hours_sold_7d = 4.50,               format('hours_sold_7d expected 4.50 got %s', k.hours_sold_7d);
  -- open: Thu10+Fri11+Sat12 (10h each) + Sun13 closed + Mon14+Tue15 (10h each) + today 09:00-12:00 clipped (3h) = 53h
  ASSERT k.hours_open_7d = 53.00,              format('hours_open_7d expected 53.00 got %s', k.hours_open_7d);
  ASSERT k.cabin_hours_open_7d = 106.00,       format('cabin_hours_open_7d expected 106.00 got %s', k.cabin_hours_open_7d);
  ASSERT k.occupancy_pct_7d = 4.2,             format('occupancy expected 4.2 (4.5/106) got %s', k.occupancy_pct_7d);
  -- active 30d (> 17 Aug): Anna (3 visits, one client), Bianca, Carla, Lucia = 4
  ASSERT k.active_clients_30d = 4,             format('active_30d expected 4 got %s', k.active_clients_30d);
  -- dormant: Giulia only (Hilda 58d, Irene has a future booking)
  ASSERT k.dormant_clients_count = 1,          format('dormant expected 1 got %s', k.dormant_clients_count);
  ASSERT k.dormant_clients -> 0 ->> 'client_key' = 'giulia bassi', 'dormant key';
  ASSERT (k.dormant_clients -> 0 ->> 'visits')::int = 2, 'dormant visits';
  ASSERT k.dormant_clients -> 0 ->> 'last_visit' = '2026-07-01', 'dormant last_visit';
  ASSERT k.dormant_clients -> 0 ->> 'last_service' = 'B', 'dormant last_service';
  -- rebooking: completed in 30d = Anna 30/8, Lucia, Anna 10/9, Bianca, Anna 15/9, Carla = 6;
  -- rebooked: Anna 30/8 (later Anna), Anna 10/9, Bianca (25 Sep) = 3; Lucia/Anna 15/9/Carla not
  -- (Carla's later booking is cancelled) -> 50.0
  ASSERT k.rebooking_pct_30d = 50.0,           format('rebooking expected 50.0 got %s', k.rebooking_pct_30d);
  -- month to date: 250 + Lucia 50 = 300 (Anna 30 Aug is August)
  ASSERT k.revenue_mtd = 300,                  format('revenue_mtd expected 300 got %s', k.revenue_mtd);

  -- the other tenant's 9999 never leaks into T1 (revenue is 250, asserted above); also via the view
  RESET ROLE;
END $$;

-- ---------- 2) gaps ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  n integer;
  total integer;
  g record;
BEGIN
  PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;   -- operator: members may read gaps

  -- today (from 12:00): cab1 12:00-14:00 (120) + 15:30-19:00 (210); cab2 12:00-13:00 (60) + 14:30-19:00 (270; Fede/Gigi overlap merged)
  SELECT count(*), sum(minutes) INTO n, total FROM public.fn_center_gaps(t1, NULL, '2026-09-16 12:00+02');
  ASSERT n = 4, format('gap rows expected 4 got %s', n);
  ASSERT total = 660, format('gap minutes expected 660 got %s', total);

  SELECT * INTO g FROM public.fn_center_gaps(t1, NULL, '2026-09-16 12:00+02') WHERE cabin = 2 ORDER BY gap_start LIMIT 1;
  ASSERT g.minutes = 60 AND g.gap_start = '2026-09-16 12:00+02'::timestamptz AND g.gap_end = '2026-09-16 13:00+02'::timestamptz,
    'cabin 2 first gap 12:00-13:00';

  -- a different, fully free day (Tue 22 Sep): 2 cabins x 600 min
  SELECT count(*), sum(minutes) INTO n, total FROM public.fn_center_gaps(t1, '2026-09-22', '2026-09-16 12:00+02');
  ASSERT n = 2 AND total = 1200, format('free day expected 2 rows / 1200 min got %s / %s', n, total);

  -- Sunday: closed
  SELECT count(*) INTO n FROM public.fn_center_gaps(t1, '2026-09-20', '2026-09-16 12:00+02');
  ASSERT n = 0, 'Sunday has no opening hours';

  -- cancelled appointments do not block: Dora (Sat 12 Sep 10:00-11:00, cabin 1, cancelled) leaves the day fully free
  SELECT sum(minutes) INTO total FROM public.fn_center_gaps(t1, '2026-09-12', '2026-09-16 12:00+02') WHERE cabin = 1;
  ASSERT total = 600, format('12 Sep cabin 1 expected 600 free min (cancelled ignored) got %s', total);

  -- the view (as of now(), so only shape/permission checked here)
  PERFORM 1 FROM public.v_center_gaps_today LIMIT 1;
  RESET ROLE;
END $$;

-- ---------- 3) simulator ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  t3 uuid := 'aaaaaaaa-0000-4000-8000-000000000003';
  t4 uuid := 'aaaaaaaa-0000-4000-8000-000000000004';
  s record;
BEGIN
  -- T1 owner: goal 1000, mtd 300 -> remaining 700; ticket 62.5 (7d) -> ceil(11.2) = 12 visits;
  -- avg duration last 90d = (7x60 + 2x90)/9 = 66.667 -> 12 x 66.667 / 60 = 13.3 h; progress 30.0; 15 days left (16..30 Sep)
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT * INTO s FROM public.fn_simulate_goal(t1, 1000, '2026-09-16 12:00+02');
  ASSERT s.revenue_mtd = 300 AND s.remaining_amount = 700, format('mtd/remaining got %s/%s', s.revenue_mtd, s.remaining_amount);
  ASSERT s.current_progress = 30.0, format('progress expected 30.0 got %s', s.current_progress);
  ASSERT s.avg_ticket_used = 62.50 AND s.avg_ticket_source = 'last_7_days', 'ticket 62.5 / last_7_days';
  ASSERT s.clients_needed = 12, format('clients_needed expected 12 got %s', s.clients_needed);
  ASSERT s.hours_needed = 13.3, format('hours_needed expected 13.3 got %s', s.hours_needed);
  ASSERT s.days_left = 15, format('days_left expected 15 got %s', s.days_left);

  -- goal already reached: remaining 0, progress > 100, no more clients needed
  SELECT * INTO s FROM public.fn_simulate_goal(t1, 200, '2026-09-16 12:00+02');
  ASSERT s.remaining_amount = 0 AND s.clients_needed = 0 AND s.current_progress = 150.0, 'goal reached case';

  -- 90-day fallback: as of 1 Oct nothing completed in the last 7 days -> 90d average
  -- completed in (2 Jul, 1 Oct]: Hilda 50 (20 Jul), Anna 30/8 50, Lucia 50, Anna 50, Bianca 100, Anna 50, Carla 50 = 400 / 7
  SELECT * INTO s FROM public.fn_simulate_goal(t1, 1000, '2026-10-01 12:00+02');
  ASSERT s.avg_ticket_source = 'last_90_days' AND s.avg_ticket_used = 57.14, format('90d fallback got %s / %s', s.avg_ticket_source, s.avg_ticket_used);

  -- invalid goals
  BEGIN
    PERFORM * FROM public.fn_simulate_goal(t1, 0);
    ASSERT false, 'goal 0 must raise';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  BEGIN
    PERFORM * FROM public.fn_simulate_goal(t1, -5);
    ASSERT false, 'negative goal must raise';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  BEGIN
    PERFORM * FROM public.fn_simulate_goal(t1, 1e12);
    ASSERT false, 'absurd goal must raise';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  RESET ROLE;

  -- T3: no completed appointments -> catalogue (avg price 75, avg duration 75): goal 750 -> 10 visits, 12.5 h
  PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT * INTO s FROM public.fn_simulate_goal(t3, 750, '2026-09-16 12:00+02');
  ASSERT s.avg_ticket_source = 'service_catalog' AND s.avg_ticket_used = 75.00, 'catalogue ticket';
  ASSERT s.clients_needed = 10 AND s.hours_needed = 12.5, format('catalogue result got %s / %s', s.clients_needed, s.hours_needed);
  RESET ROLE;

  -- T4: nothing at all -> NULLs, never invented numbers
  PERFORM set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT * INTO s FROM public.fn_simulate_goal(t4, 500, '2026-09-16 12:00+02');
  ASSERT s.avg_ticket_used IS NULL AND s.avg_ticket_source IS NULL AND s.clients_needed IS NULL AND s.hours_needed IS NULL,
    'empty center must return NULLs';
  ASSERT s.remaining_amount = 500 AND s.current_progress = 0.0, 'empty center progress';
  RESET ROLE;
END $$;

-- ---------- 4) authorization ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  n integer;
BEGIN
  -- operator (member, not owner): no KPI rows, no simulator; gaps allowed
  PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_kpi(t1, '2026-09-16 12:00+02');
  ASSERT n = 0, 'operator must not read KPI (revenue) numbers';
  SELECT count(*) INTO n FROM public.v_center_week_kpi WHERE center_id = t1;
  ASSERT n = 0, 'operator must not see v_center_week_kpi';
  BEGIN
    PERFORM * FROM public.fn_simulate_goal(t1, 1000);
    ASSERT false, 'operator must not run the simulator';
  EXCEPTION WHEN sqlstate '42501' THEN NULL; END;
  RESET ROLE;

  -- owner of ANOTHER center: sees nothing of T1
  PERFORM set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_kpi(t1, '2026-09-16 12:00+02');
  ASSERT n = 0, 'foreign owner must not read T1 KPI';
  SELECT count(*) INTO n FROM public.fn_center_gaps(t1, NULL, '2026-09-16 12:00+02');
  ASSERT n = 0, 'foreign owner must not read T1 gaps';
  SELECT count(*) INTO n FROM public.v_center_gaps_today WHERE center_id = t1;
  ASSERT n = 0, 'foreign owner must not see T1 in v_center_gaps_today';
  BEGIN
    PERFORM * FROM public.fn_simulate_goal(t1, 1000);
    ASSERT false, 'foreign owner must not run the simulator on T1';
  EXCEPTION WHEN sqlstate '42501' THEN NULL; END;
  -- but sees only its own center in the KPI view
  SELECT count(*) INTO n FROM public.v_center_week_kpi;
  ASSERT n = 1, format('foreign owner should see exactly its own center in the KPI view, got %s', n);
  RESET ROLE;

  -- unauthenticated JWT (no sub) as authenticated role: nothing
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_kpi(t1, '2026-09-16 12:00+02');
  ASSERT n = 0, 'no uid -> nothing';
  RESET ROLE;

  -- anon: cannot execute any of it, cannot select the views
  SET LOCAL ROLE anon;
  BEGIN PERFORM * FROM public.fn_center_kpi(t1); ASSERT false, 'anon executed fn_center_kpi';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.fn_center_gaps(t1); ASSERT false, 'anon executed fn_center_gaps';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.fn_simulate_goal(t1, 10); ASSERT false, 'anon executed fn_simulate_goal';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.v_center_week_kpi; ASSERT false, 'anon read v_center_week_kpi';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.v_center_gaps_today; ASSERT false, 'anon read v_center_gaps_today';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  -- the internal calc functions are not callable by end users at all
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  BEGIN PERFORM * FROM public.fn_center_kpi_calc(t1, now()); ASSERT false, 'authenticated executed fn_center_kpi_calc';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.fn_center_gaps_calc(t1, NULL, now(), 15); ASSERT false, 'authenticated executed fn_center_gaps_calc';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  -- the owner sees its own row through the view
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.v_center_week_kpi WHERE center_id = t1;
  ASSERT n = 1, 'owner sees its KPI row through the view';
  RESET ROLE;
END $$;

-- ---------- 5) schedule validation ----------
DO $$
DECLARE t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
BEGIN
  BEGIN
    UPDATE public.centers SET opening_hours = '{"9":[["09:00","19:00"]]}' WHERE id = t1;
    ASSERT false, 'invalid weekday must be rejected';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  BEGIN
    UPDATE public.centers SET opening_hours = '{"1":[["19:00","09:00"]]}' WHERE id = t1;
    ASSERT false, 'inverted interval must be rejected';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  BEGIN
    UPDATE public.centers SET opening_hours = '{"1":"9-19"}' WHERE id = t1;
    ASSERT false, 'non-array day must be rejected';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  BEGIN
    UPDATE public.centers SET timezone = 'Mars/Olympus' WHERE id = t1;
    ASSERT false, 'unknown timezone must be rejected';
  EXCEPTION WHEN sqlstate '22023' THEN NULL; END;
  UPDATE public.centers SET opening_hours = '{"1":[["09:00","13:00"],["14:30","24:00"]]}' WHERE id = t1;
  UPDATE public.centers SET opening_hours = '{"1":[["09:00","19:00"]],"2":[["09:00","19:00"]],"3":[["09:00","19:00"]],"4":[["09:00","19:00"]],"5":[["09:00","19:00"]],"6":[["09:00","19:00"]]}' WHERE id = t1;
END $$;

SELECT 'KPI / gaps / simulator tests passed' AS result;
