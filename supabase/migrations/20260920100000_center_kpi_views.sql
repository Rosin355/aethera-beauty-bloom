-- Concierge backend, P1.2: per-center KPI views, free-slot (gap) computation and goal simulator.
--
-- Design (see docs/CONCIERGE_TOOLS.md):
--   * "calc" functions hold the logic and do NO authorization; they are callable by service_role
--     only (the future scheduler/report job has no user session).
--   * Public wrappers (fn_center_kpi, fn_center_gaps, fn_simulate_goal) are SECURITY DEFINER and
--     authorize on auth.uid(): KPI/simulator = center OWNER (they expose revenue, like the
--     owner-only client_metrics table), gaps = any active center member.
--   * Views are thin, security_invoker, one row per center the caller may see.
--   * Every function: REVOKE from PUBLIC *and anon* (Supabase default privileges grant anon).
--
-- Repo adaptations (the prompt assumed data the schema does not have):
--   * business_appointments has no client id  -> a client is identified by client_key(client_name)
--     (lower-cased, whitespace-collapsed name); "ids" in the dormant list are these keys.
--   * no cabin column                         -> business_appointments.cabin (nullable; NULL = cabin 1)
--   * no opening hours / cabin count          -> centers.opening_hours / cabin_count / timezone
--   Semaphore levels are NOT computed here: their thresholds live in a config table (P1.6).
--
-- Definitions ("completed" = status 'completato'; 7d window = 7 local calendar days ending today):
--   avg_ticket_7d          avg price of completed appointments in the 7d window
--   hours_sold_7d          sum(duration) of those / 60
--   hours_open_7d          opening hours over the window (today clipped to "now"), single cabin
--   cabin_hours_open_7d    hours_open_7d * cabin_count;  occupancy_pct_7d = hours_sold / that
--   active_clients_30d     distinct clients with >= 1 completed visit in the last 30 days
--   dormant_clients        clients with completed visits, none in the last 60 days and no future booking
--   rebooking_pct_30d      % of completed appointments of the last 30 days whose client has a LATER
--                          non-cancelled appointment
--   revenue_mtd            revenue of completed appointments since the start of the local month

-- ============================ 1) SCHEMA ADDITIONS ============================
ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Rome',
  ADD COLUMN IF NOT EXISTS cabin_count smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT
    '{"1":[["09:00","19:00"]],"2":[["09:00","19:00"]],"3":[["09:00","19:00"]],"4":[["09:00","19:00"]],"5":[["09:00","19:00"]],"6":[["09:00","19:00"]]}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.centers ADD CONSTRAINT centers_cabin_count_range CHECK (cabin_count BETWEEN 1 AND 20);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.business_appointments ADD COLUMN IF NOT EXISTS cabin smallint;
DO $$ BEGIN
  ALTER TABLE public.business_appointments
    ADD CONSTRAINT business_appointments_cabin_check CHECK (cabin IS NULL OR cabin >= 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- opening_hours format: {"<isodow 1-7>": [["HH:MM","HH:MM"], ...]}, missing day = closed.
-- The columns are owner-editable (RLS "Owner updates center"), and the KPI functions cast them,
-- so validate shape on write instead of letting garbage break the center's own KPIs.
CREATE OR REPLACE FUNCTION public.validate_center_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  k text;
  slot jsonb;
BEGIN
  PERFORM now() AT TIME ZONE NEW.timezone;  -- raises for an unknown time zone

  IF jsonb_typeof(NEW.opening_hours) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'opening_hours deve essere un oggetto JSON' USING ERRCODE = '22023';
  END IF;

  FOR k IN SELECT jsonb_object_keys(NEW.opening_hours) LOOP
    IF k !~ '^[1-7]$' THEN
      RAISE EXCEPTION 'opening_hours: giorno non valido (%)', k USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(NEW.opening_hours -> k) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'opening_hours: il giorno % deve essere un elenco di fasce', k USING ERRCODE = '22023';
    END IF;
    FOR slot IN SELECT jsonb_array_elements(NEW.opening_hours -> k) LOOP
      IF jsonb_typeof(slot) IS DISTINCT FROM 'array'
         OR jsonb_array_length(slot) <> 2
         OR (slot ->> 0) IS NULL OR (slot ->> 1) IS NULL
         OR (slot ->> 0) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         OR (slot ->> 1) !~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
         OR (slot ->> 0)::time >= (slot ->> 1)::time THEN
        RAISE EXCEPTION 'opening_hours: fascia non valida per il giorno %', k USING ERRCODE = '22023';
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_center_validate_schedule ON public.centers;
CREATE TRIGGER trg_center_validate_schedule
BEFORE INSERT OR UPDATE OF timezone, opening_hours ON public.centers
FOR EACH ROW EXECUTE FUNCTION public.validate_center_schedule();

-- ============================ 2) CLIENT KEY ============================
CREATE OR REPLACE FUNCTION public.client_key(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT pg_catalog.lower(pg_catalog.btrim(pg_catalog.regexp_replace(coalesce(_name, ''), '\s+', ' ', 'g')))
$$;

CREATE INDEX IF NOT EXISTS idx_business_appointments_center_client
  ON public.business_appointments (center_id, public.client_key(client_name), appointment_at);

-- ============================ 3) CALC: KPI (no authorization) ============================
CREATE OR REPLACE FUNCTION public.fn_center_kpi_calc(_center_id uuid, _as_of timestamptz)
RETURNS TABLE (
  as_of timestamptz,
  window_start timestamptz,
  completed_appointments_7d integer,
  revenue_7d numeric,
  avg_ticket_7d numeric,
  hours_sold_7d numeric,
  hours_open_7d numeric,
  cabin_hours_open_7d numeric,
  occupancy_pct_7d numeric,
  active_clients_30d integer,
  dormant_clients_count integer,
  dormant_clients jsonb,
  rebooking_pct_30d numeric,
  revenue_mtd numeric
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_cabins integer;
  v_hours jsonb;
  v_local_now timestamp;
  v_w_start timestamptz;
  v_month_start timestamptz;
  v_n7 integer;
  v_rev7 numeric;
  v_min7 numeric;
  v_open numeric;
  v_cabin_hours numeric;
  v_active integer;
  v_dorm_n integer;
  v_dorm jsonb;
  v_rebook numeric;
  v_mtd numeric;
BEGIN
  SELECT c.timezone, c.cabin_count, c.opening_hours
    INTO v_tz, v_cabins, v_hours
  FROM public.centers c
  WHERE c.id = _center_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_local_now   := _as_of AT TIME ZONE v_tz;
  v_w_start     := (date_trunc('day', v_local_now) - interval '6 days') AT TIME ZONE v_tz;
  v_month_start := date_trunc('month', v_local_now) AT TIME ZONE v_tz;

  -- 7-day sales -----------------------------------------------------------------
  SELECT count(*)::integer, coalesce(sum(a.price), 0), coalesce(sum(a.duration_minutes), 0)
    INTO v_n7, v_rev7, v_min7
  FROM public.business_appointments a
  WHERE a.center_id = _center_id
    AND a.status = 'completato'
    AND a.appointment_at >= v_w_start
    AND a.appointment_at <= _as_of;

  -- opening hours over the same window (today clipped to "now") ---------------------
  SELECT coalesce(sum(greatest(extract(epoch FROM (least(x.iv_e, _as_of) - x.iv_s)), 0)) / 3600.0, 0)
    INTO v_open
  FROM (
    SELECT ((d::date + (slot ->> 0)::time) AT TIME ZONE v_tz) AS iv_s,
           ((d::date + (slot ->> 1)::time) AT TIME ZONE v_tz) AS iv_e
    FROM generate_series(date_trunc('day', v_local_now) - interval '6 days',
                         date_trunc('day', v_local_now),
                         interval '1 day') AS d
    CROSS JOIN LATERAL jsonb_array_elements(
      coalesce(v_hours -> (extract(isodow FROM d))::integer::text, '[]'::jsonb)
    ) AS slot
  ) x
  WHERE x.iv_s < _as_of;
  v_cabin_hours := v_open * v_cabins;

  -- active clients (30d) ------------------------------------------------------------
  SELECT count(DISTINCT public.client_key(a.client_name))::integer
    INTO v_active
  FROM public.business_appointments a
  WHERE a.center_id = _center_id
    AND a.status = 'completato'
    AND a.appointment_at > _as_of - interval '30 days'
    AND a.appointment_at <= _as_of
    AND public.client_key(a.client_name) <> '';

  -- dormant clients (no visit in 60d, nothing booked) -------------------------------
  WITH visits AS (
    SELECT public.client_key(a.client_name) AS k,
           (array_agg(a.client_name ORDER BY a.appointment_at DESC))[1] AS display_name,
           (array_agg(a.service_name ORDER BY a.appointment_at DESC))[1] AS last_service,
           max(a.appointment_at) AS last_visit,
           count(*) AS n_visits
    FROM public.business_appointments a
    WHERE a.center_id = _center_id
      AND a.status = 'completato'
      AND a.appointment_at <= _as_of
    GROUP BY 1
  ), booked AS (
    SELECT DISTINCT public.client_key(a.client_name) AS k
    FROM public.business_appointments a
    WHERE a.center_id = _center_id
      AND a.status IN ('confermato', 'in_attesa')
      AND a.appointment_at > _as_of
  ), dormant AS (
    SELECT v.*
    FROM visits v
    WHERE v.k <> ''
      AND v.last_visit < _as_of - interval '60 days'
      AND NOT EXISTS (SELECT 1 FROM booked b WHERE b.k = v.k)
  )
  SELECT (SELECT count(*)::integer FROM dormant),
         coalesce((
           SELECT jsonb_agg(jsonb_build_object(
                    'client_key', t.k,
                    'client_name', t.display_name,
                    'last_visit', (t.last_visit AT TIME ZONE v_tz)::date,
                    'visits', t.n_visits,
                    'last_service', t.last_service
                  ) ORDER BY t.n_visits DESC, t.last_visit DESC)
           FROM (SELECT * FROM dormant ORDER BY n_visits DESC, last_visit DESC LIMIT 50) t
         ), '[]'::jsonb)
    INTO v_dorm_n, v_dorm;

  -- rebooking rate (30d) ------------------------------------------------------------
  SELECT CASE WHEN count(*) = 0 THEN NULL
              ELSE round(100.0 * count(*) FILTER (WHERE EXISTS (
                     SELECT 1
                     FROM public.business_appointments b
                     WHERE b.center_id = _center_id
                       AND b.id <> a.id
                       AND b.status <> 'annullato'
                       AND b.appointment_at > a.appointment_at
                       AND public.client_key(b.client_name) = public.client_key(a.client_name)
                   )) / count(*), 1)
         END
    INTO v_rebook
  FROM public.business_appointments a
  WHERE a.center_id = _center_id
    AND a.status = 'completato'
    AND a.appointment_at > _as_of - interval '30 days'
    AND a.appointment_at <= _as_of
    AND public.client_key(a.client_name) <> '';

  -- month to date -------------------------------------------------------------------
  SELECT coalesce(sum(a.price), 0)
    INTO v_mtd
  FROM public.business_appointments a
  WHERE a.center_id = _center_id
    AND a.status = 'completato'
    AND a.appointment_at >= v_month_start
    AND a.appointment_at <= _as_of;

  RETURN QUERY SELECT
    _as_of,
    v_w_start,
    v_n7,
    v_rev7,
    CASE WHEN v_n7 > 0 THEN round(v_rev7 / v_n7, 2) END,
    round(v_min7 / 60.0, 2),
    round(v_open, 2),
    round(v_cabin_hours, 2),
    CASE WHEN v_cabin_hours > 0 THEN round(100.0 * (v_min7 / 60.0) / v_cabin_hours, 1) END,
    v_active,
    v_dorm_n,
    v_dorm,
    v_rebook,
    v_mtd;
END;
$$;

-- ============================ 4) CALC: GAPS (no authorization) ============================
-- Free slots per cabin for one local day: opening intervals minus non-cancelled appointments
-- (overlaps are merged; NULL cabin = cabin 1). For "today" the past is clipped to _as_of.
-- Gaps shorter than _min_minutes are dropped as noise.
CREATE OR REPLACE FUNCTION public.fn_center_gaps_calc(
  _center_id uuid,
  _day date,
  _as_of timestamptz,
  _min_minutes integer
)
RETURNS TABLE (day date, cabin integer, gap_start timestamptz, gap_end timestamptz, minutes integer)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH c AS (
    SELECT ce.id, ce.timezone AS tz, ce.cabin_count, ce.opening_hours,
           coalesce(_day, (_as_of AT TIME ZONE ce.timezone)::date) AS d,
           (_as_of AT TIME ZONE ce.timezone)::date AS today
    FROM public.centers ce
    WHERE ce.id = _center_id
  ), iv AS (
    SELECT c.id, c.tz, c.cabin_count, c.d, c.today,
           ((c.d + (slot ->> 0)::time) AT TIME ZONE c.tz) AS s,
           ((c.d + (slot ->> 1)::time) AT TIME ZONE c.tz) AS e
    FROM c
    CROSS JOIN LATERAL jsonb_array_elements(
      coalesce(c.opening_hours -> (extract(isodow FROM c.d))::integer::text, '[]'::jsonb)
    ) AS slot
  ), cab AS (
    SELECT iv.*, g.cabin
    FROM iv
    CROSS JOIN LATERAL generate_series(1, iv.cabin_count) AS g(cabin)
  ), busy AS (
    SELECT cab.cabin, cab.s, cab.e,
           greatest(a.appointment_at, cab.s) AS b_start,
           least(a.appointment_at + make_interval(mins => a.duration_minutes), cab.e) AS b_end
    FROM cab
    JOIN public.business_appointments a
      ON a.center_id = cab.id
     AND a.status <> 'annullato'
     AND coalesce(a.cabin, 1) = cab.cabin
     AND a.appointment_at < cab.e
     AND a.appointment_at + make_interval(mins => a.duration_minutes) > cab.s
  ), edges AS (
    SELECT cabin, s, e, s AS b_start, s AS b_end FROM cab
    UNION ALL
    SELECT cabin, s, e, b_start, b_end FROM busy
    UNION ALL
    SELECT cabin, s, e, e AS b_start, e AS b_end FROM cab
  ), gaps AS (
    SELECT cabin, s, b_start,
           max(b_end) OVER (
             PARTITION BY cabin, s
             ORDER BY b_start, b_end
             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
           ) AS prev_end
    FROM edges
  ), clipped AS (
    SELECT c.d AS day, g.cabin,
           greatest(g.prev_end, CASE WHEN c.d = c.today THEN _as_of ELSE g.prev_end END) AS gap_start,
           g.b_start AS gap_end
    FROM gaps g
    CROSS JOIN c
    WHERE g.prev_end IS NOT NULL
  ), sized AS (
    SELECT cl.*, floor(extract(epoch FROM (cl.gap_end - cl.gap_start)) / 60)::integer AS minutes
    FROM clipped cl
    WHERE cl.gap_end > cl.gap_start
  )
  SELECT sz.day, sz.cabin, sz.gap_start, sz.gap_end, sz.minutes
  FROM sized sz
  WHERE sz.minutes >= coalesce(_min_minutes, 0)
  ORDER BY sz.cabin, sz.gap_start
$$;

-- ============================ 5) PUBLIC WRAPPERS ============================
-- Owner-only: exposes revenue-derived numbers. Returns no rows for anyone else.
CREATE OR REPLACE FUNCTION public.fn_center_kpi(_center_id uuid, _as_of timestamptz DEFAULT now())
RETURNS TABLE (
  as_of timestamptz,
  window_start timestamptz,
  completed_appointments_7d integer,
  revenue_7d numeric,
  avg_ticket_7d numeric,
  hours_sold_7d numeric,
  hours_open_7d numeric,
  cabin_hours_open_7d numeric,
  occupancy_pct_7d numeric,
  active_clients_30d integer,
  dormant_clients_count integer,
  dormant_clients jsonb,
  rebooking_pct_30d numeric,
  revenue_mtd numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.center_role(_center_id) IS DISTINCT FROM 'owner' THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.fn_center_kpi_calc(_center_id, _as_of);
END;
$$;

-- Any active member of the center. Returns no rows for everyone else.
CREATE OR REPLACE FUNCTION public.fn_center_gaps(
  _center_id uuid,
  _day date DEFAULT NULL,
  _as_of timestamptz DEFAULT now(),
  _min_minutes integer DEFAULT 15
)
RETURNS TABLE (day date, cabin integer, gap_start timestamptz, gap_end timestamptz, minutes integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_center_member(_center_id) THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.fn_center_gaps_calc(_center_id, _day, _as_of, _min_minutes);
END;
$$;

-- Goal simulator. goal_amount = revenue target for the current calendar month (center time zone).
--   current_progress  percent of the goal already earned this month (0-100+)
--   clients_needed    additional client visits needed at avg_ticket_used
--   hours_needed      cabin hours those visits take (avg completed-visit duration, last 90 days,
--                     falling back to the service catalogue)
--   avg_ticket_source last_7_days | last_90_days | service_catalog | NULL (nothing to base it on;
--                     clients_needed / hours_needed are then NULL, never invented)
-- Owner-only: raises 42501 for anyone else, 22023 for an invalid goal.
CREATE OR REPLACE FUNCTION public.fn_simulate_goal(
  _center_id uuid,
  _goal_amount numeric,
  _as_of timestamptz DEFAULT now()
)
RETURNS TABLE (
  goal_amount numeric,
  revenue_mtd numeric,
  remaining_amount numeric,
  current_progress numeric,
  avg_ticket_used numeric,
  avg_ticket_source text,
  clients_needed integer,
  hours_needed numeric,
  days_left integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  k record;
  v_tz text;
  v_local_now timestamp;
  v_ticket numeric;
  v_source text;
  v_dur numeric;
  v_remaining numeric;
  v_clients integer;
  v_hours numeric;
BEGIN
  IF auth.uid() IS NULL OR public.center_role(_center_id) IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Accesso negato al centro' USING ERRCODE = '42501';
  END IF;
  IF _goal_amount IS NULL OR _goal_amount <= 0 OR _goal_amount > 10000000 THEN
    RAISE EXCEPTION 'goal_amount non valido (atteso 0 < importo <= 10000000)' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO k FROM public.fn_center_kpi_calc(_center_id, _as_of);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro non trovato' USING ERRCODE = '42501';
  END IF;

  SELECT c.timezone INTO v_tz FROM public.centers c WHERE c.id = _center_id;
  v_local_now := _as_of AT TIME ZONE v_tz;

  -- average ticket: 7d, else 90d, else catalogue; a zero average is unusable
  IF coalesce(k.avg_ticket_7d, 0) > 0 THEN
    v_ticket := k.avg_ticket_7d;
    v_source := 'last_7_days';
  ELSE
    SELECT round(nullif(avg(a.price), 0), 2) INTO v_ticket
    FROM public.business_appointments a
    WHERE a.center_id = _center_id AND a.status = 'completato'
      AND a.appointment_at > _as_of - interval '90 days' AND a.appointment_at <= _as_of;
    IF v_ticket IS NOT NULL THEN
      v_source := 'last_90_days';
    ELSE
      SELECT round(avg(s.price), 2) INTO v_ticket
      FROM public.business_services s
      WHERE s.center_id = _center_id AND s.is_active AND s.price > 0;
      IF v_ticket IS NOT NULL THEN
        v_source := 'service_catalog';
      END IF;
    END IF;
  END IF;

  SELECT avg(a.duration_minutes) INTO v_dur
  FROM public.business_appointments a
  WHERE a.center_id = _center_id AND a.status = 'completato'
    AND a.appointment_at > _as_of - interval '90 days' AND a.appointment_at <= _as_of;
  IF v_dur IS NULL THEN
    SELECT avg(s.duration_minutes) INTO v_dur
    FROM public.business_services s
    WHERE s.center_id = _center_id AND s.is_active;
  END IF;

  v_remaining := greatest(_goal_amount - k.revenue_mtd, 0);
  IF v_ticket IS NOT NULL THEN
    v_clients := ceil(v_remaining / v_ticket)::integer;
    IF v_dur IS NOT NULL THEN
      v_hours := round(v_clients * v_dur / 60.0, 1);
    END IF;
  END IF;

  RETURN QUERY SELECT
    _goal_amount,
    k.revenue_mtd,
    v_remaining,
    round(100.0 * k.revenue_mtd / _goal_amount, 1),
    v_ticket,
    v_source,
    v_clients,
    v_hours,
    ((date_trunc('month', v_local_now) + interval '1 month')::date - v_local_now::date);
END;
$$;

-- ============================ 6) VIEWS ============================
-- security_invoker: RLS on centers narrows the driving rows to the caller's centers; the
-- wrappers then enforce owner/member on top. The center_id predicate pushes down to centers.
CREATE OR REPLACE VIEW public.v_center_week_kpi
WITH (security_invoker = true) AS
SELECT c.id AS center_id, k.*
FROM public.centers c
CROSS JOIN LATERAL public.fn_center_kpi(c.id) k;

CREATE OR REPLACE VIEW public.v_center_gaps_today
WITH (security_invoker = true) AS
SELECT c.id AS center_id, g.day, g.cabin, g.gap_start, g.gap_end, g.minutes
FROM public.centers c
CROSS JOIN LATERAL public.fn_center_gaps(c.id) g;

-- ============================ 7) PRIVILEGES ============================
REVOKE ALL ON FUNCTION public.fn_center_kpi_calc(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_center_gaps_calc(uuid, date, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_center_kpi_calc(uuid, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_center_gaps_calc(uuid, date, timestamptz, integer) TO service_role;

REVOKE ALL ON FUNCTION public.fn_center_kpi(uuid, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_center_gaps(uuid, date, timestamptz, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_simulate_goal(uuid, numeric, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_center_kpi(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_center_gaps(uuid, date, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_simulate_goal(uuid, numeric, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.validate_center_schedule() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.client_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_key(text) TO authenticated, service_role;

REVOKE ALL ON public.v_center_week_kpi FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.v_center_gaps_today FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_center_week_kpi TO authenticated, service_role;
GRANT SELECT ON public.v_center_gaps_today TO authenticated, service_role;

-- ============================ DOWN (manual rollback) ============================
-- DROP VIEW IF EXISTS public.v_center_gaps_today, public.v_center_week_kpi;
-- DROP FUNCTION IF EXISTS public.fn_simulate_goal(uuid, numeric, timestamptz);
-- DROP FUNCTION IF EXISTS public.fn_center_gaps(uuid, date, timestamptz, integer);
-- DROP FUNCTION IF EXISTS public.fn_center_kpi(uuid, timestamptz);
-- DROP FUNCTION IF EXISTS public.fn_center_gaps_calc(uuid, date, timestamptz, integer);
-- DROP FUNCTION IF EXISTS public.fn_center_kpi_calc(uuid, timestamptz);
-- DROP INDEX IF EXISTS public.idx_business_appointments_center_client;
-- DROP FUNCTION IF EXISTS public.client_key(text);
-- DROP TRIGGER IF EXISTS trg_center_validate_schedule ON public.centers;
-- DROP FUNCTION IF EXISTS public.validate_center_schedule();
-- ALTER TABLE public.business_appointments DROP CONSTRAINT IF EXISTS business_appointments_cabin_check;
-- ALTER TABLE public.business_appointments DROP COLUMN IF EXISTS cabin;
-- ALTER TABLE public.centers DROP CONSTRAINT IF EXISTS centers_cabin_count_range;
-- ALTER TABLE public.centers DROP COLUMN IF EXISTS opening_hours, DROP COLUMN IF EXISTS cabin_count, DROP COLUMN IF EXISTS timezone;
