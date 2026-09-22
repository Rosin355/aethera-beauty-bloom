-- Data-hygiene fix for the demo account's display name — not a security fix.
--
-- Live round-trip test on 2026-09-22 (docs/TEST_RESULTS_FASE1.md) found the assistant
-- greeting the tester by the wrong name while signed in as
-- demo.aurora@4elementiitalia.it. Audit of the code path
-- (supabase/functions/ai-assistant/index.ts -> requireAuthenticatedUser ->
-- loadUserContext in context.ts) confirms `ai-assistant` only ever loads
-- `public.profiles` filtered by the SERVER-VERIFIED caller's own id
-- (`supabase.auth.getUser(token).data.user.id`, never a client-supplied id) — there is no
-- code path that reads another user's profile. So the wrong name is not a cross-tenant
-- leak: it is whatever this ONE account's own `profiles.display_name` actually holds.
--
-- Most likely origin: this row (fixed uuid '0a0a0a0a-0000-4000-8000-000000000001') predates
-- 20260716120000_seed_demo_center_aurora.sql, which intentionally never overwrites an
-- existing row (`IF NOT EXISTS` on auth.users, `ON CONFLICT (user_id) DO NOTHING` on
-- profiles — correct for a real user, since re-running the seed must never clobber
-- someone's own edits). That guard also means a stale placeholder from before the
-- "Aurora Demo" persona existed is never self-corrected by re-seeding.
--
-- This account exists only to present that persona, so — unlike the seed — this
-- explicitly re-asserts the value with UPDATE rather than an insert-if-absent. Scoped by
-- BOTH the fixed id and the known email, so it can never touch any other row even if the
-- id were ever reused. Idempotent: safe to re-run.
DO $$
DECLARE
  v_user_id uuid := '0a0a0a0a-0000-4000-8000-000000000001';
  v_email   text := 'demo.aurora@4elementiitalia.it';
BEGIN
  UPDATE public.profiles
  SET display_name = 'Aurora Demo'
  WHERE user_id = v_user_id AND email = v_email;

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"display_name":"Aurora Demo"}'::jsonb
  WHERE id = v_user_id AND email = v_email;
END $$;

-- ============================ DOWN (manual rollback) ============================
-- No automated down: reverting would mean restoring an unknown prior display name for a
-- demo-only account, which serves no purpose. To roll back by hand:
--   UPDATE public.profiles SET display_name = '<previous value>'
--   WHERE user_id = '0a0a0a0a-0000-4000-8000-000000000001';
