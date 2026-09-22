-- Tests for the P1.5 profile-slot tables (profile_slot_catalog, center_profile_slots). The
-- three new tools (set_profile_slot, get_missing_slots, generate_first_reading) query these
-- tables directly from TS, no new SQL functions -- what's worth testing here is the seed data
-- and the RLS, which the tools rely on. Reuses the T1 fixture from 10_kpi_math.sql (owner u1,
-- operator u2; other tenant T2 owner u3).
\set ON_ERROR_STOP on
SET search_path = public, extensions;

DO $$
DECLARE
  n integer;
BEGIN
  -- catalog: all 75 seeded, one row per question 1..75, the welcome-8 are exactly the ones the doc names
  SELECT count(*) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 75, format('expected 75 catalog rows, got %s', n);

  SELECT count(DISTINCT question_number) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 75, 'question_number must be unique 1..75';

  SELECT count(*) INTO n FROM public.profile_slot_catalog WHERE is_welcome_interview;
  ASSERT n = 8, format('expected 8 welcome-interview slots, got %s', n);

  SELECT count(*) INTO n FROM public.profile_slot_catalog
    WHERE is_welcome_interview AND question_number NOT IN (1, 3, 6, 14, 22, 26, 60, 75);
  ASSERT n = 0, 'the welcome-interview flag must be exactly Q1,3,6,14,22,26,60,75';

  -- every chapter from docs/PROFILE_SLOTS.md is represented
  SELECT count(DISTINCT chapter) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 7, format('expected 7 chapters, got %s', n);

  -- reseeding (as the migration itself does via ON CONFLICT DO UPDATE) must never duplicate
  INSERT INTO public.profile_slot_catalog (slot_key, chapter, question_number, label, is_welcome_interview, sort_order)
  VALUES ('tipologia', 'identita', 1, 'Tipologia del centro (estetico / spa / benessere / salone / istituto)', true, 1)
  ON CONFLICT (slot_key) DO UPDATE SET label = EXCLUDED.label;
  SELECT count(*) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 75, 'reseeding must not duplicate rows';
END $$;

-- catalog is readable by ANY authenticated user, not center-scoped
DO $$
DECLARE
  u1 uuid := '11111111-1111-4111-8111-111111111111';
  u3 uuid := '33333333-3333-4333-8333-333333333333';
  n integer;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 75, 'any T1 member reads the whole catalog';
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 75, 'a completely unrelated user (T2 owner) also reads the whole catalog -- it is not tenant data';
  RESET ROLE;

  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM public.profile_slot_catalog;
  ASSERT n = 0, 'anon reads nothing (RLS requires auth.uid())';
  RESET ROLE;
END $$;

-- center_profile_slots: membership RLS, tenant isolation, FK on slot_key
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  t2 uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  u1 uuid := '11111111-1111-4111-8111-111111111111';  -- T1 owner
  u2 uuid := '22222222-2222-4222-8222-222222222222';  -- T1 operator
  u3 uuid := '33333333-3333-4333-8333-333333333333';  -- T2 owner
  n integer;
BEGIN
  DELETE FROM public.center_profile_slots WHERE center_id IN (t1, t2);

  -- an operator (member, not owner) can insert and update
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.center_profile_slots (center_id, slot_key, value, source, updated_by)
  VALUES (t1, 'tipologia', '"Centro estetico"'::jsonb, 'conversation', u2);
  UPDATE public.center_profile_slots SET value = '"Spa"'::jsonb WHERE center_id = t1 AND slot_key = 'tipologia';
  SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'tipologia' AND value = '"Spa"'::jsonb;
  ASSERT n = 1, 'operator insert + update must both succeed and be visible';

  -- an operator cannot delete (owner-only)
  BEGIN
    DELETE FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'tipologia';
    SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'tipologia';
    ASSERT n = 1, 'an operator delete must be silently blocked by RLS (0 rows affected), not actually delete';
  END;
  RESET ROLE;

  -- the owner CAN delete
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  DELETE FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'tipologia';
  SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'tipologia';
  ASSERT n = 0, 'owner delete must succeed';

  -- an unknown slot_key is rejected by the FK, regardless of role
  BEGIN
    INSERT INTO public.center_profile_slots (center_id, slot_key, value, source, updated_by)
    VALUES (t1, 'not_a_real_slot', '"x"'::jsonb, 'conversation', u1);
    ASSERT false, 'an unknown slot_key must raise a foreign key violation';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  RESET ROLE;

  -- T2's owner cannot see or write into T1's slots
  INSERT INTO public.center_profile_slots (center_id, slot_key, value, source, updated_by)
  VALUES (t1, 'obiettivi_futuri', '"crescere"'::jsonb, 'conversation', u1);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1;
  ASSERT n = 0, 'a foreign-tenant owner must see none of T1''s slots';

  BEGIN
    INSERT INTO public.center_profile_slots (center_id, slot_key, value, source, updated_by)
    VALUES (t1, 'numero_collaboratori', '3'::jsonb, 'conversation', u3);
    ASSERT false, 'a non-member insert into T1 must be blocked by RLS';
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN NULL;
  END;
  SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1 AND slot_key = 'numero_collaboratori';
  ASSERT n = 0, 'the blocked insert must not have landed';
  RESET ROLE;

  SET LOCAL ROLE anon;
  BEGIN
    PERFORM * FROM public.center_profile_slots WHERE center_id = t1;
    SELECT count(*) INTO n FROM public.center_profile_slots WHERE center_id = t1;
    -- anon has no GRANT at all on this table, so even the SELECT itself should fail
    ASSERT false, 'anon must not be able to query center_profile_slots';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END $$;

SELECT 'profile slots tests passed' AS result;
