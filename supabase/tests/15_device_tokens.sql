-- Tests for the P1.7 device_tokens table: RLS is per-USER, not per-center (a teammate must not
-- see another member's token, unlike every other table in this repo which is membership-scoped).
-- Reuses the T1 fixture from 10_kpi_math.sql (owner u1, operator u2; other tenant T2 owner u3).
\set ON_ERROR_STOP on
SET search_path = public, extensions;

DO $$
DECLARE
  t1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  u1 uuid := '11111111-1111-4111-8111-111111111111';  -- T1 owner
  u2 uuid := '22222222-2222-4222-8222-222222222222';  -- T1 operator
  n integer;
BEGIN
  DELETE FROM public.device_tokens WHERE center_id = t1;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.device_tokens (user_id, center_id, platform, token) VALUES (u1, t1, 'ios', 'owner-token-1');
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.device_tokens (user_id, center_id, platform, token) VALUES (u2, t1, 'ios', 'operator-token-1');

  -- u2 sees only their own row, not u1's -- unlike every membership-scoped table in this repo
  SELECT count(*) INTO n FROM public.device_tokens WHERE center_id = t1;
  ASSERT n = 1, format('operator must see only their own device token, saw %s', n);
  SELECT count(*) INTO n FROM public.device_tokens WHERE token = 'owner-token-1';
  ASSERT n = 0, 'operator must not see the owner''s token';

  -- and cannot update or delete it either -- RLS hides the row from u2 entirely, so both
  -- statements silently affect 0 rows; re-authenticating as the owner below proves it.
  UPDATE public.device_tokens SET platform = 'android' WHERE token = 'owner-token-1';
  DELETE FROM public.device_tokens WHERE token = 'owner-token-1';
  RESET ROLE;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.device_tokens WHERE token = 'owner-token-1' AND platform = 'ios';
  ASSERT n = 1, 'the operator''s blocked update/delete must not have touched the owner''s row';
  RESET ROLE;

  -- WITH CHECK also requires real membership: a token can't be registered against a center the
  -- caller doesn't belong to, even under their own user_id
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.device_tokens (user_id, center_id, platform, token)
    VALUES (u1, 'aaaaaaaa-0000-4000-8000-000000000002', 'ios', 'cross-tenant-token');
    ASSERT false, 'registering a token against a center the caller is not a member of must be rejected';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  SET LOCAL ROLE anon;
  BEGIN
    PERFORM * FROM public.device_tokens WHERE center_id = t1;
    ASSERT false, 'anon must not be able to query device_tokens';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END $$;

SELECT 'device tokens tests passed' AS result;
