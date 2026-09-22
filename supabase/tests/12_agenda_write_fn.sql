-- Tests for the P1.4 agenda write tools (fn_create_appointment, fn_move_appointment,
-- fn_propose_recall). Reuses the T1 fixture from 10_kpi_math.sql (center T1: owner u1,
-- operator u2, 2 cabins, Mon-Sat 09:00-19:00, service A 60min/50EUR, service B 90min/100EUR;
-- other tenant T2 owner u3). Wed 16 Sep afternoon already has Elisa 14:00-15:30 cabin 1,
-- Fede 13:00-14:00 + Gigi 13:30-14:30 (overlapping) cabin 2 -- see that file's header comment.
-- Dormant clients as of 2026-09-16 12:00+02 (the SAME fixed as_of 10_kpi_math.sql uses):
-- Giulia Bassi (last service B, 90 min, 77 days dormant) is the only one past the 60-day cutoff.
\set ON_ERROR_STOP on
SET search_path = public, extensions;

DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';  -- T1 owner
  sa uuid;
  r jsonb;
  new_id uuid;
BEGIN
  SELECT id INTO sa FROM public.business_services WHERE center_id = t1 AND name = 'A';

  -- ---------- create_appointment: conflict, alternatives ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- cabin 1 explicitly requested at 14:00, 60 min -> overlaps Elisa (14:00-15:30) -> conflict
  r := public.fn_create_appointment(t1, 'Nuova Cliente', sa, '2026-09-16 14:00+02', 1, NULL, false);
  ASSERT r ->> 'status' = 'conflict', format('expected conflict on cabin1 14:00, got %s', r);
  ASSERT jsonb_array_length(r -> 'alternatives') = 2, 'expected exactly 2 alternatives';
  ASSERT (SELECT count(*) FROM public.business_appointments WHERE client_name = 'Nuova Cliente') = 0,
    'a conflict must never write, confirmed or not';

  r := public.fn_create_appointment(t1, 'Nuova Cliente', sa, '2026-09-16 14:00+02', 1, NULL, true);
  ASSERT r ->> 'status' = 'conflict', 'confirmed:true must not bypass a real conflict';

  -- cabin 1 at 10:00, free -> draft, then confirm and check the row lands with the right shape
  r := public.fn_create_appointment(t1, 'Nuova Cliente', sa, '2026-09-16 10:00+02', 1, 'note test', false);
  ASSERT r ->> 'status' = 'draft', format('expected draft, got %s', r);
  ASSERT (r -> 'preview' ->> 'cabin')::int = 1, 'preview should name cabin 1';
  ASSERT (SELECT count(*) FROM public.business_appointments WHERE client_name = 'Nuova Cliente') = 0,
    'confirmed:false (draft) must never write';

  r := public.fn_create_appointment(t1, 'Nuova Cliente', sa, '2026-09-16 10:00+02', 1, 'note test', true);
  ASSERT r ->> 'status' = 'created', format('expected created, got %s', r);
  new_id := (r -> 'appointment' ->> 'id')::uuid;
  ASSERT EXISTS (
    SELECT 1 FROM public.business_appointments
    WHERE id = new_id AND center_id = t1 AND user_id = u1 AND client_name = 'Nuova Cliente'
      AND cabin = 1 AND status = 'confermato' AND price = 50 AND notes = 'note test'
  ), 'created row must match center/user/cabin/status/price/notes';

  -- cabin omitted at 13:00 (60 min): cabin1 free until 14:00, cabin2 busy (Fede) -> auto-picks cabin 1
  r := public.fn_create_appointment(t1, 'Auto Cabina', sa, '2026-09-16 13:00+02', NULL, NULL, true);
  ASSERT r ->> 'status' = 'created' AND (r -> 'appointment' ->> 'cabin')::int = 1,
    format('expected auto-assign to cabin 1, got %s', r);

  -- validation before any conflict logic
  BEGIN
    PERFORM public.fn_create_appointment(t1, '   ', sa, '2026-09-16 10:00+02', NULL, NULL, false);
    ASSERT false, 'empty client_name must raise';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '22023', format('expected 22023 for empty client_name, got %s: %s', SQLSTATE, SQLERRM);
  END;
  RESET ROLE;
END $$;

DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  t2 uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  u1 uuid := '11111111-1111-4111-8111-111111111111';
  u3 uuid := '33333333-3333-4333-8333-333333333333';
  sa uuid; s_foreign uuid;
  r jsonb;
BEGIN
  SELECT id INTO sa FROM public.business_services WHERE center_id = t1 AND name = 'A';
  SELECT id INTO s_foreign FROM public.business_services WHERE center_id = t2 LIMIT 1;

  -- a foreign-tenant service_id must be rejected even for the correct center's own member
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.fn_create_appointment(t1, 'X', s_foreign, '2026-09-16 10:00+02', NULL, NULL, false);
    ASSERT false, 'a foreign-center service_id must raise';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '22023', format('expected 22023 for foreign service_id, got %s', SQLSTATE);
  END;
  RESET ROLE;

  -- a non-member (T2's own owner) must be refused for T1, regardless of the arguments
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.fn_create_appointment(t1, 'X', sa, '2026-09-16 10:00+02', NULL, NULL, false);
    ASSERT false, 'a non-member must be refused';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '42501', format('expected 42501 for a non-member, got %s', SQLSTATE);
  END;
  RESET ROLE;

  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.fn_create_appointment(t1, 'X', sa, '2026-09-16 10:00+02', NULL, NULL, false);
    ASSERT false, 'anon executed fn_create_appointment';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
END $$;

-- ---------- move_appointment ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';
  u2 uuid := '22222222-2222-4222-8222-222222222222';
  sa uuid;
  r jsonb;
  movable_id uuid;
  completed_id uuid;
  cancelled_id uuid;
BEGIN
  SELECT id INTO sa FROM public.business_services WHERE center_id = t1 AND name = 'A';
  SELECT id INTO completed_id FROM public.business_appointments
    WHERE center_id = t1 AND client_name = 'Anna Rossi' AND status = 'completato' LIMIT 1;
  SELECT id INTO cancelled_id FROM public.business_appointments
    WHERE center_id = t1 AND client_name = 'Dora Cancel' LIMIT 1;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  INSERT INTO public.business_appointments
    (center_id, user_id, client_name, service_id, service_name, appointment_at, duration_minutes, price, status, cabin)
  VALUES (t1, u1, 'Da Spostare', sa, 'A', '2026-09-16 10:00+02', 60, 50, 'confermato', 1)
  RETURNING id INTO movable_id;

  -- moving into Elisa's window (cabin 1, 14:00-15:30) conflicts
  r := public.fn_move_appointment(t1, movable_id, '2026-09-16 14:30+02', false);
  ASSERT r ->> 'status' = 'conflict', format('expected conflict moving into cabin1 14:30, got %s', r);
  ASSERT (SELECT appointment_at FROM public.business_appointments WHERE id = movable_id) = '2026-09-16 10:00+02',
    'a conflicting move must never write';

  -- moving to a free slot: draft, then confirm and verify the row actually moved
  r := public.fn_move_appointment(t1, movable_id, '2026-09-16 11:00+02', false);
  ASSERT r ->> 'status' = 'draft', format('expected draft, got %s', r);
  ASSERT (SELECT appointment_at FROM public.business_appointments WHERE id = movable_id) = '2026-09-16 10:00+02',
    'confirmed:false (draft) must never write';

  r := public.fn_move_appointment(t1, movable_id, '2026-09-16 11:00+02', true);
  ASSERT r ->> 'status' = 'moved', format('expected moved, got %s', r);
  ASSERT (SELECT appointment_at FROM public.business_appointments WHERE id = movable_id) = '2026-09-16 11:00+02',
    'confirmed:true must write the new time';

  -- an operator (member, not owner) may move too
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  r := public.fn_move_appointment(t1, movable_id, '2026-09-16 11:30+02', true);
  ASSERT r ->> 'status' = 'moved', 'operator must be able to move a member-level appointment';
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM public.fn_move_appointment(t1, completed_id, '2026-09-20 10:00+02', false);
    ASSERT false, 'moving a completed appointment must raise';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '22023', format('expected 22023 for completed, got %s', SQLSTATE);
  END;
  BEGIN
    PERFORM public.fn_move_appointment(t1, cancelled_id, '2026-09-20 10:00+02', false);
    ASSERT false, 'moving a cancelled appointment must raise';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '22023', format('expected 22023 for cancelled, got %s', SQLSTATE);
  END;
  RESET ROLE;
END $$;

-- ---------- propose_recall ----------
DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';
  u2 uuid := '22222222-2222-4222-8222-222222222222';
  as_of timestamptz := '2026-09-16 12:00+02';
  r jsonb;
BEGIN
  -- owner: a 90-minute gap fits Giulia Bassi's last service (B, 90 min) -> she's the pick
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  r := public.fn_propose_recall(t1, as_of + interval '3 hours', as_of + interval '4 hours 30 minutes', 1, as_of);
  ASSERT r ->> 'status' = 'proposed', format('expected proposed, got %s', r);
  ASSERT r -> 'client' ->> 'client_name' = 'Giulia Bassi', format('expected Giulia Bassi, got %s', r -> 'client');
  ASSERT (r -> 'client' ->> 'service_duration_minutes')::int = 90, 'expected her 90-minute service';

  -- a gap too short for any dormant client's last service (Giulia's is 90 min)
  r := public.fn_propose_recall(t1, as_of, as_of + interval '30 minutes', NULL, as_of);
  ASSERT r ->> 'status' = 'no_candidate', format('expected no_candidate for a 30-minute gap, got %s', r);
  RESET ROLE;

  -- operator (member, not owner): refused -- this reads the owner-only dormant-clients list
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.fn_propose_recall(t1, as_of, as_of + interval '90 minutes', NULL, as_of);
    ASSERT false, 'an operator must be refused';
  EXCEPTION WHEN OTHERS THEN
    ASSERT SQLSTATE = '42501', format('expected 42501 for operator, got %s', SQLSTATE);
  END;
  RESET ROLE;
END $$;

SELECT 'agenda write tool tests passed' AS result;
