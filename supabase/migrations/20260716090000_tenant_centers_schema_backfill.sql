-- Multi-tenant foundation (schema + backfill).
-- tenant = beauty center; each center has an owner and invited members. Business data
-- moves from per-user isolation to per-center isolation. RLS rewrite is a separate
-- migration; here we only create the schema, helpers, tenant column and backfill.

-- 1) CENTERS + MEMBERSHIPS -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.center_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text,
  role text NOT NULL CHECK (role IN ('owner', 'operator', 'receptionist')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_center_members_user ON public.center_members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_center_members_center ON public.center_members(center_id);
CREATE INDEX IF NOT EXISTS idx_center_members_invited_email ON public.center_members(lower(invited_email)) WHERE invited_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_centers_owner ON public.centers(owner_user_id);

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_members ENABLE ROW LEVEL SECURITY;
-- Policies are added in the RLS migration; RLS-on-with-no-policies denies
-- anon/authenticated meanwhile (the backfill below runs as the migration role).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.centers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.center_members TO authenticated;

-- 2) HELPERS (SECURITY DEFINER to avoid RLS recursion) ---------------------------
CREATE OR REPLACE FUNCTION public.is_center_member(_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.center_members cm
    WHERE cm.center_id = _center_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.center_role(_center_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.role
  FROM public.center_members cm
  WHERE cm.center_id = _center_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_center_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.center_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_center_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.center_role(uuid) TO authenticated;

-- 3) TENANT COLUMN (nullable first; NOT NULL after backfill) ---------------------
ALTER TABLE public.business_services     ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_items       ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE public.business_appointments ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE public.client_metrics        ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;
ALTER TABLE public.client_notes          ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE CASCADE;

-- 4) BACKFILL: one center per distinct owning user, owner membership, set center_id.
-- user_id columns are KEPT for audit (who created a row) but are no longer the
-- isolation key. Idempotent: re-running reuses an existing center per owner.
DO $$
DECLARE
  rec record;
  v_center_id uuid;
  v_owner_name text;
BEGIN
  FOR rec IN
    SELECT DISTINCT owner_id FROM (
      SELECT user_id AS owner_id FROM public.business_services
      UNION SELECT user_id FROM public.inventory_items
      UNION SELECT user_id FROM public.business_appointments
      UNION SELECT client_user_id FROM public.client_metrics
      UNION SELECT client_user_id FROM public.client_notes
    ) owners
    WHERE owner_id IS NOT NULL
  LOOP
    SELECT id INTO v_center_id FROM public.centers WHERE owner_user_id = rec.owner_id LIMIT 1;

    IF v_center_id IS NULL THEN
      SELECT coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.email), ''), 'senza nome')
        INTO v_owner_name
      FROM public.profiles p
      WHERE p.user_id = rec.owner_id
      LIMIT 1;
      v_owner_name := coalesce(v_owner_name, 'senza nome');

      INSERT INTO public.centers (name, owner_user_id)
      VALUES ('Centro di ' || v_owner_name, rec.owner_id)
      RETURNING id INTO v_center_id;

      INSERT INTO public.center_members (center_id, user_id, role, status)
      VALUES (v_center_id, rec.owner_id, 'owner', 'active')
      ON CONFLICT (center_id, user_id) DO NOTHING;
    END IF;

    UPDATE public.business_services     SET center_id = v_center_id WHERE user_id = rec.owner_id AND center_id IS NULL;
    UPDATE public.inventory_items       SET center_id = v_center_id WHERE user_id = rec.owner_id AND center_id IS NULL;
    UPDATE public.business_appointments SET center_id = v_center_id WHERE user_id = rec.owner_id AND center_id IS NULL;
    UPDATE public.client_metrics        SET center_id = v_center_id WHERE client_user_id = rec.owner_id AND center_id IS NULL;
    UPDATE public.client_notes          SET center_id = v_center_id WHERE client_user_id = rec.owner_id AND center_id IS NULL;
  END LOOP;
END $$;

-- 5) NOT NULL (guarded) + tenant indexes ----------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.business_services WHERE center_id IS NULL) THEN
    ALTER TABLE public.business_services ALTER COLUMN center_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE center_id IS NULL) THEN
    ALTER TABLE public.inventory_items ALTER COLUMN center_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.business_appointments WHERE center_id IS NULL) THEN
    ALTER TABLE public.business_appointments ALTER COLUMN center_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.client_metrics WHERE center_id IS NULL) THEN
    ALTER TABLE public.client_metrics ALTER COLUMN center_id SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.client_notes WHERE center_id IS NULL) THEN
    ALTER TABLE public.client_notes ALTER COLUMN center_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_business_services_center ON public.business_services(center_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_center ON public.inventory_items(center_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_business_appointments_center_date ON public.business_appointments(center_id, appointment_at);
CREATE INDEX IF NOT EXISTS idx_client_metrics_center_date ON public.client_metrics(center_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_notes_center_date ON public.client_notes(center_id, note_date DESC);
