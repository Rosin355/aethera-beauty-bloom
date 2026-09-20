-- Tests for fn_center_appointments (P1.3). Reuses the fixtures created by 10_kpi_math.sql
-- (center T1 with owner u1 and operator u2; other tenant owner u3). Runs after it (file order).
\set ON_ERROR_STOP on
SET search_path = public, extensions;

-- extra boundary rows in T1: 23:30 local on the 16th (belongs to the 16th) and 00:10 on the 17th
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';
BEGIN
  DELETE FROM public.business_appointments WHERE center_id = t1 AND client_name IN ('Notte Tarda', 'Notte Presto');
  INSERT INTO public.business_appointments (center_id, user_id, client_name, service_name, appointment_at, duration_minutes, price, status, notes)
  VALUES
    (t1, u1, 'Notte Tarda',  'A', '2026-09-16 23:30+02', 30, 10, 'confermato', 'ultimo della sera'),
    (t1, u1, 'Notte Presto', 'A', '2026-09-17 00:10+02', 30, 10, 'confermato', NULL);
END $$;

DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  n integer;
  r record;
BEGIN
  -- owner: 16 Sep has Carla 10:00, Fede 13:00, Gigi 13:30, Elisa 14:00, Notte Tarda 23:30 = 5 rows, ordered, with prices
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, '2026-09-16');
  ASSERT n = 5, format('owner expected 5 appointments on 16 Sep got %s', n);
  SELECT * INTO r FROM public.fn_center_appointments(t1, '2026-09-16') ORDER BY starts_at LIMIT 1;
  ASSERT r.client_name = 'Carla Neri' AND r.price = 50 AND r.status = 'completato', 'first row is Carla, price visible to owner';
  ASSERT r.ends_at = r.starts_at + interval '60 minutes', 'ends_at = starts_at + duration';
  -- 17 Sep local day contains only the 00:10 row (the Europe/Rome boundary, not UTC)
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, '2026-09-17');
  ASSERT n = 1, format('expected exactly the 00:10 appointment on 17 Sep got %s', n);
  -- default day = today in the center time zone, driven by _as_of
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, NULL, '2026-09-16 12:00+02');
  ASSERT n = 5, 'NULL day = local day of _as_of';
  RESET ROLE;

  -- operator: same rows, but no prices
  PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, '2026-09-16');
  ASSERT n = 5, 'operator can read the agenda';
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, '2026-09-16') WHERE price IS NOT NULL;
  ASSERT n = 0, 'operator must not receive appointment prices';
  RESET ROLE;

  -- other tenant's owner: nothing
  PERFORM set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.fn_center_appointments(t1, '2026-09-16');
  ASSERT n = 0, 'foreign owner must see no appointments of T1';
  RESET ROLE;

  -- anon: not executable
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM * FROM public.fn_center_appointments(t1, '2026-09-16');
    ASSERT false, 'anon executed fn_center_appointments';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
END $$;

SELECT 'fn_center_appointments tests passed' AS result;
