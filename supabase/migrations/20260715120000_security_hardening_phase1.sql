-- Security hardening (phase 1): unsubscribe tokens, rate limiting, AI log policy,
-- and lockdown of the knowledge-base semantic-search RPC.

-- 1) UNSUBSCRIBE SUPPORT ---------------------------------------------------------
-- Per-recipient unsubscribe tokens on both the newsletter subscribers and the
-- mailing-list leads (the welcome email also needs a real unsubscribe link).
-- Adding a NOT NULL column with a volatile default backfills every existing row
-- with its own uuid.
ALTER TABLE public.newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

ALTER TABLE public.mailing_list
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_unsub_token
  ON public.newsletter_subscriptions(unsubscribe_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mailing_list_unsub_token
  ON public.mailing_list(unsubscribe_token);

-- 2) RATE LIMITING ---------------------------------------------------------------
-- Simple windowed counter keyed by "<function>:<ip>". Only the service role (edge
-- functions) touches it: RLS is enabled with NO policies, so anon/authenticated
-- are denied while the service role bypasses RLS.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created
  ON public.rate_limits(key, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies (deny to anon/authenticated; service role bypasses RLS).

-- 3) AI USAGE LOG POLICY ---------------------------------------------------------
-- Only the ai-assistant edge function writes here, and it uses the service role
-- (which bypasses RLS). Drop the permissive WITH CHECK (true) client INSERT policy
-- so no client can forge usage rows.
DROP POLICY IF EXISTS "Allow insert from edge function" ON public.ai_usage_logs;

-- 4) LOCK DOWN search_training_data ---------------------------------------------
-- The RPC is SECURITY DEFINER and bypasses RLS on ai_training_data, so it must not
-- be executable by anon/authenticated. Only the ai-assistant edge function (service
-- role) calls it. Revoke broadly, grant execute to service_role only. The DO block
-- resolves the exact signature(s) regardless of argument-type qualification.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'search_training_data'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
