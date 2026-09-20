-- Concierge backend, P1.3: SQL support for the read tools of ai-assistant.
--
-- fn_center_appointments(center, day): the agenda of one LOCAL day (center time zone), so the
-- day boundaries are computed in SQL, next to the KPI/gap functions, instead of in the edge function.
--   * SECURITY INVOKER: runs under the caller's RLS (members read center appointments); plus an
--     explicit is_center_member guard as defense in depth. No privilege elevation.
--   * price is only returned to the center OWNER (per-appointment revenue is a "number" that
--     operators/receptionists must not get through the concierge; see docs/CONCIERGE_TOOLS.md).
--   * NULL day = today in the center time zone. Capped at 200 rows.

CREATE OR REPLACE FUNCTION public.fn_center_appointments(
  _center_id uuid,
  _day date DEFAULT NULL,
  _as_of timestamptz DEFAULT now()
)
RETURNS TABLE (
  id uuid,
  client_name text,
  service_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  cabin integer,
  status text,
  price numeric,
  notes text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_day date;
  v_owner boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_center_member(_center_id) THEN
    RETURN;
  END IF;

  SELECT c.timezone INTO v_tz FROM public.centers c WHERE c.id = _center_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_day := coalesce(_day, (_as_of AT TIME ZONE v_tz)::date);
  v_owner := public.center_role(_center_id) = 'owner';

  RETURN QUERY
  SELECT a.id,
         a.client_name,
         a.service_name,
         a.appointment_at,
         a.appointment_at + make_interval(mins => a.duration_minutes),
         a.duration_minutes,
         a.cabin::integer,
         a.status,
         CASE WHEN v_owner THEN a.price END,
         a.notes
  FROM public.business_appointments a
  WHERE a.center_id = _center_id
    AND a.appointment_at >= (v_day::timestamp AT TIME ZONE v_tz)
    AND a.appointment_at <  ((v_day + 1)::timestamp AT TIME ZONE v_tz)
  ORDER BY a.appointment_at, a.id
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_center_appointments(uuid, date, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_center_appointments(uuid, date, timestamptz) TO authenticated;

-- ============================ DOWN (manual rollback) ============================
-- DROP FUNCTION IF EXISTS public.fn_center_appointments(uuid, date, timestamptz);
