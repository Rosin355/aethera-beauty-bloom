-- Multi-tenant isolation lives in the database: membership-based RLS on the five
-- business tables, policies for centers/center_members, and a tenant-integrity trigger.
-- Platform-admin (has_role admin) policies from earlier migrations are left in place.

-- ============================ centers ============================
DROP POLICY IF EXISTS "Members or owner read center" ON public.centers;
CREATE POLICY "Members or owner read center"
ON public.centers FOR SELECT
USING (owner_user_id = auth.uid() OR public.is_center_member(id) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users create own center" ON public.centers;
CREATE POLICY "Users create own center"
ON public.centers FOR INSERT
WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owner updates center" ON public.centers;
CREATE POLICY "Owner updates center"
ON public.centers FOR UPDATE
USING (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owner deletes center" ON public.centers;
CREATE POLICY "Owner deletes center"
ON public.centers FOR DELETE
USING (owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ============================ center_members ============================
-- SELECT: active members, the row's own user, an invitee matching their JWT email, or admin.
DROP POLICY IF EXISTS "Read center members" ON public.center_members;
CREATE POLICY "Read center members"
ON public.center_members FOR SELECT
USING (
  public.is_center_member(center_id)
  OR user_id = auth.uid()
  OR lower(invited_email) = lower(auth.jwt() ->> 'email')
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: only the center's owner (covers onboarding's own owner row + owner adding members).
DROP POLICY IF EXISTS "Owner adds center members" ON public.center_members;
CREATE POLICY "Owner adds center members"
ON public.center_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.centers c WHERE c.id = center_id AND c.owner_user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: owner manages members; an invitee may claim their own invite (bind user_id + activate).
DROP POLICY IF EXISTS "Owner manages or invitee claims membership" ON public.center_members;
CREATE POLICY "Owner manages or invitee claims membership"
ON public.center_members FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.centers c WHERE c.id = center_id AND c.owner_user_id = auth.uid())
  OR user_id = auth.uid()
  OR lower(invited_email) = lower(auth.jwt() ->> 'email')
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.centers c WHERE c.id = center_id AND c.owner_user_id = auth.uid())
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Owner removes center members" ON public.center_members;
CREATE POLICY "Owner removes center members"
ON public.center_members FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.centers c WHERE c.id = center_id AND c.owner_user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ============================ business_services ============================
DROP POLICY IF EXISTS "Users can view own business services" ON public.business_services;
DROP POLICY IF EXISTS "Users can insert own business services" ON public.business_services;
DROP POLICY IF EXISTS "Users can update own business services" ON public.business_services;
DROP POLICY IF EXISTS "Users can delete own business services" ON public.business_services;

CREATE POLICY "Members read center services"
ON public.business_services FOR SELECT USING (public.is_center_member(center_id));
CREATE POLICY "Members insert center services"
ON public.business_services FOR INSERT WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Members update center services"
ON public.business_services FOR UPDATE
USING (public.is_center_member(center_id)) WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Owner deletes center services"
ON public.business_services FOR DELETE USING (public.center_role(center_id) = 'owner');

-- ============================ inventory_items ============================
DROP POLICY IF EXISTS "Users can view own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON public.inventory_items;

CREATE POLICY "Members read center inventory"
ON public.inventory_items FOR SELECT USING (public.is_center_member(center_id));
CREATE POLICY "Members insert center inventory"
ON public.inventory_items FOR INSERT WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Members update center inventory"
ON public.inventory_items FOR UPDATE
USING (public.is_center_member(center_id)) WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Owner deletes center inventory"
ON public.inventory_items FOR DELETE USING (public.center_role(center_id) = 'owner');

-- ============================ business_appointments ============================
DROP POLICY IF EXISTS "Users can view own appointments" ON public.business_appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.business_appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.business_appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.business_appointments;

CREATE POLICY "Members read center appointments"
ON public.business_appointments FOR SELECT USING (public.is_center_member(center_id));
CREATE POLICY "Members insert center appointments"
ON public.business_appointments FOR INSERT WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Members update center appointments"
ON public.business_appointments FOR UPDATE
USING (public.is_center_member(center_id)) WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Owner deletes center appointments"
ON public.business_appointments FOR DELETE USING (public.center_role(center_id) = 'owner');

-- ============================ client_metrics (owner-only) ============================
DROP POLICY IF EXISTS "Users can view own client metrics" ON public.client_metrics;

CREATE POLICY "Owner reads center client metrics"
ON public.client_metrics FOR SELECT USING (public.center_role(center_id) = 'owner');
CREATE POLICY "Owner inserts center client metrics"
ON public.client_metrics FOR INSERT WITH CHECK (public.center_role(center_id) = 'owner');
CREATE POLICY "Owner updates center client metrics"
ON public.client_metrics FOR UPDATE
USING (public.center_role(center_id) = 'owner') WITH CHECK (public.center_role(center_id) = 'owner');
CREATE POLICY "Owner deletes center client metrics"
ON public.client_metrics FOR DELETE USING (public.center_role(center_id) = 'owner');

-- ============================ client_notes (membership; owner delete) ============================
CREATE POLICY "Members read center client notes"
ON public.client_notes FOR SELECT USING (public.is_center_member(center_id));
CREATE POLICY "Members insert center client notes"
ON public.client_notes FOR INSERT WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Members update center client notes"
ON public.client_notes FOR UPDATE
USING (public.is_center_member(center_id)) WITH CHECK (public.is_center_member(center_id));
CREATE POLICY "Owner deletes center client notes"
ON public.client_notes FOR DELETE USING (public.center_role(center_id) = 'owner');

-- ============================ tenant integrity ============================
-- An appointment's service must belong to the SAME center (closes the audit gap where
-- service_id could point at another tenant's service).
CREATE OR REPLACE FUNCTION public.check_appointment_service_center()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.business_services s
      WHERE s.id = NEW.service_id AND s.center_id = NEW.center_id
    ) THEN
      RAISE EXCEPTION 'Il servizio (%) non appartiene allo stesso centro dell''appuntamento (%)',
        NEW.service_id, NEW.center_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_service_center ON public.business_appointments;
CREATE TRIGGER trg_appointment_service_center
BEFORE INSERT OR UPDATE ON public.business_appointments
FOR EACH ROW EXECUTE FUNCTION public.check_appointment_service_center();
