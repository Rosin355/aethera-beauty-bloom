-- Per-center, Italian service/inventory taxonomies + configurable durations.
-- Requires the tenant foundation (centers/center_members, is_center_member, center_role).

-- 1) TABLES ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, name)
);

CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (center_id, name)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_center ON public.service_categories(center_id, active, sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_center ON public.inventory_categories(center_id, active, sort_order);

-- Durations kept simple: an int[] on the center rather than a table.
ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS service_durations int[] NOT NULL DEFAULT '{30,45,60,75,90,120}';

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_categories TO authenticated;

-- 2) RLS: members read; owner (or platform admin) write; center_id enforced ------
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['service_categories', 'inventory_categories'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Members read %1$s" ON public.%1$s', tbl);
    EXECUTE format(
      'CREATE POLICY "Members read %1$s" ON public.%1$s FOR SELECT USING (public.is_center_member(center_id))', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Owner inserts %1$s" ON public.%1$s', tbl);
    EXECUTE format(
      'CREATE POLICY "Owner inserts %1$s" ON public.%1$s FOR INSERT WITH CHECK (public.center_role(center_id) = ''owner'' OR has_role(auth.uid(), ''admin''::app_role))', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Owner updates %1$s" ON public.%1$s', tbl);
    EXECUTE format(
      'CREATE POLICY "Owner updates %1$s" ON public.%1$s FOR UPDATE USING (public.center_role(center_id) = ''owner'' OR has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.center_role(center_id) = ''owner'' OR has_role(auth.uid(), ''admin''::app_role))', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Owner deletes %1$s" ON public.%1$s', tbl);
    EXECUTE format(
      'CREATE POLICY "Owner deletes %1$s" ON public.%1$s FOR DELETE USING (public.center_role(center_id) = ''owner'' OR has_role(auth.uid(), ''admin''::app_role))', tbl);
  END LOOP;
END $$;

-- 3) DEFAULT SEED per center (Italian). A trigger covers every creation path
--    (onboarding, demo seed, invites); the migration backfills existing centers.
CREATE OR REPLACE FUNCTION public.seed_center_taxonomies(_center_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.service_categories (center_id, name, sort_order) VALUES
    (_center_id, 'Viso', 1),
    (_center_id, 'Corpo', 2),
    (_center_id, 'Epilazione', 3),
    (_center_id, 'Mani & Piedi', 4),
    (_center_id, 'Sguardo', 5),
    (_center_id, 'Make-up', 6)
  ON CONFLICT (center_id, name) DO NOTHING;

  INSERT INTO public.inventory_categories (center_id, name, sort_order) VALUES
    (_center_id, 'Viso', 1),
    (_center_id, 'Corpo', 2),
    (_center_id, 'Epilazione', 3),
    (_center_id, 'Mani & Piedi', 4),
    (_center_id, 'Consumabili', 5)
  ON CONFLICT (center_id, name) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_center_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_center_taxonomies(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_center_seed_taxonomies ON public.centers;
CREATE TRIGGER trg_center_seed_taxonomies
AFTER INSERT ON public.centers
FOR EACH ROW EXECUTE FUNCTION public.on_center_created();

-- Backfill existing centers.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN SELECT id FROM public.centers LOOP
    PERFORM public.seed_center_taxonomies(c.id);
  END LOOP;
END $$;
