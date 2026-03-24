-- Business management models (minimal additive schema)

CREATE TABLE IF NOT EXISTS public.business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  supplier TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  service_id UUID REFERENCES public.business_services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  appointment_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'generale',
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  active_clients INTEGER NOT NULL DEFAULT 0,
  services_count INTEGER NOT NULL DEFAULT 0,
  bookings_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  retention_returning INTEGER NOT NULL DEFAULT 0,
  retention_new INTEGER NOT NULL DEFAULT 0,
  business_health_score INTEGER,
  sessions_count INTEGER,
  training_progress JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_user_id, metric_date)
);

CREATE TABLE IF NOT EXISTS public.admin_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  category TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all',
  duration TEXT,
  file_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_services_user ON public.business_services(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON public.inventory_items(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_business_appointments_user_date ON public.business_appointments(user_id, appointment_at);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_date ON public.client_notes(client_user_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_metrics_client_date ON public.client_metrics(client_user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_content_items_active ON public.admin_content_items(is_active, created_at DESC);

ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_content_items ENABLE ROW LEVEL SECURITY;

-- business_services policies
DROP POLICY IF EXISTS "Users can view own business services" ON public.business_services;
CREATE POLICY "Users can view own business services"
ON public.business_services
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business services" ON public.business_services;
CREATE POLICY "Users can insert own business services"
ON public.business_services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business services" ON public.business_services;
CREATE POLICY "Users can update own business services"
ON public.business_services
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own business services" ON public.business_services;
CREATE POLICY "Users can delete own business services"
ON public.business_services
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all business services" ON public.business_services;
CREATE POLICY "Admins can manage all business services"
ON public.business_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- inventory_items policies
DROP POLICY IF EXISTS "Users can view own inventory items" ON public.inventory_items;
CREATE POLICY "Users can view own inventory items"
ON public.inventory_items
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own inventory items" ON public.inventory_items;
CREATE POLICY "Users can insert own inventory items"
ON public.inventory_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own inventory items" ON public.inventory_items;
CREATE POLICY "Users can update own inventory items"
ON public.inventory_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own inventory items" ON public.inventory_items;
CREATE POLICY "Users can delete own inventory items"
ON public.inventory_items
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all inventory items" ON public.inventory_items;
CREATE POLICY "Admins can manage all inventory items"
ON public.inventory_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- business_appointments policies
DROP POLICY IF EXISTS "Users can view own appointments" ON public.business_appointments;
CREATE POLICY "Users can view own appointments"
ON public.business_appointments
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.business_appointments;
CREATE POLICY "Users can insert own appointments"
ON public.business_appointments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.business_appointments;
CREATE POLICY "Users can update own appointments"
ON public.business_appointments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.business_appointments;
CREATE POLICY "Users can delete own appointments"
ON public.business_appointments
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.business_appointments;
CREATE POLICY "Admins can manage all appointments"
ON public.business_appointments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- client_notes policies (admin-only)
DROP POLICY IF EXISTS "Admins can manage client notes" ON public.client_notes;
CREATE POLICY "Admins can manage client notes"
ON public.client_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- client_metrics policies
DROP POLICY IF EXISTS "Users can view own client metrics" ON public.client_metrics;
CREATE POLICY "Users can view own client metrics"
ON public.client_metrics
FOR SELECT
USING (auth.uid() = client_user_id);

DROP POLICY IF EXISTS "Admins can manage client metrics" ON public.client_metrics;
CREATE POLICY "Admins can manage client metrics"
ON public.client_metrics
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- admin_content_items policies
DROP POLICY IF EXISTS "Authenticated can read active admin content items" ON public.admin_content_items;
CREATE POLICY "Authenticated can read active admin content items"
ON public.admin_content_items
FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage admin content items" ON public.admin_content_items;
CREATE POLICY "Admins can manage admin content items"
ON public.admin_content_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- trigger updated_at
DROP TRIGGER IF EXISTS trg_business_services_updated_at ON public.business_services;
CREATE TRIGGER trg_business_services_updated_at
BEFORE UPDATE ON public.business_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_business_appointments_updated_at ON public.business_appointments;
CREATE TRIGGER trg_business_appointments_updated_at
BEFORE UPDATE ON public.business_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_notes_updated_at ON public.client_notes;
CREATE TRIGGER trg_client_notes_updated_at
BEFORE UPDATE ON public.client_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_metrics_updated_at ON public.client_metrics;
CREATE TRIGGER trg_client_metrics_updated_at
BEFORE UPDATE ON public.client_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_admin_content_items_updated_at ON public.admin_content_items;
CREATE TRIGGER trg_admin_content_items_updated_at
BEFORE UPDATE ON public.admin_content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_content_items TO authenticated;
