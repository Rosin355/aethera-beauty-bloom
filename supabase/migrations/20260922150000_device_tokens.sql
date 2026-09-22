-- Concierge backend, P1.7 (1/3): push device registration.
--
-- Registration itself needs no edge function: the native app upserts its own row directly
-- through Supabase (its own user JWT), matching the P3.5 plan ("device_tokens upsert on login").
-- RLS is "user writes own rows only" per the prompt doc, literally: not even center-scoped --
-- a member cannot see a teammate's device token, only the owning user can. `token` is globally
-- unique (a device can move to a different account, e.g. sign-out/sign-in; the newest owner wins
-- via ON CONFLICT (token) DO UPDATE, which the app should use rather than a plain INSERT).

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  token text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_center ON public.device_tokens (center_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users manage own device tokens"
ON public.device_tokens FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND public.is_center_member(center_id));

DROP TRIGGER IF EXISTS trg_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER trg_device_tokens_updated_at
BEFORE UPDATE ON public.device_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
-- send-push reads across all users/centers, so it goes through the service-role client
-- (requireAuthenticatedUser's default), which bypasses RLS entirely -- no extra grant needed.

-- ============================ DOWN (manual rollback) ============================
-- DROP TABLE IF EXISTS public.device_tokens;
