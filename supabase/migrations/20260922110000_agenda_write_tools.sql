-- Concierge backend, P1.4: SQL support for the agenda write tools (create_appointment,
-- move_appointment, propose_recall).
--
-- Design, matching P1.2/P1.3 precedent (docs/CONCIERGE_TOOLS.md §4-5):
--   * fn_center_nearest_slots_calc: a `_calc` helper (service_role only), reusing
--     fn_center_gaps_calc's proven overlap/opening-hours math rather than duplicating it.
--   * fn_create_appointment / fn_move_appointment / fn_propose_recall are SECURITY DEFINER
--     wrappers, same shape as fn_simulate_goal: an explicit auth.uid() + membership/role
--     check up front (never trust RLS alone inside a DEFINER function), then free to call the
--     _calc helpers regardless of their own service_role-only grants. create/move are member-
--     level (RLS on business_appointments already lets any active member insert/update);
--     propose_recall is owner-only, because it reads the owner-only dormant-clients list.
--   * Every write is explicitly scoped by the _center_id PARAMETER (server-resolved by the
--     edge function from the caller's own membership, never client input) — SECURITY DEFINER
--     here elevates read access to the _calc helpers, it does not widen the tenant boundary.
--   * confirmed:false (or omitted) NEVER writes: it returns a draft/preview. confirmed:true
--     re-runs the SAME conflict check before writing (each call is independent, so a stale
--     preview can never silently become a write into a slot that filled up meanwhile).
--
-- Known limitation (documented, not fixed here): conflict detection is a check-then-act
-- inside one function call, not a DB-level exclusion constraint — a true concurrent double-
-- booking race is possible in principle. Adding a tstzrange EXCLUDE constraint was considered
-- and rejected for this phase: supabase/tests/10_kpi_math.sql's own gap-merging fixture
-- (Fede 13:00-14:00 / Gigi 13:30-14:30, both cabin 2, both confermato) relies on being able to
-- represent an existing overlap. A single-salon booking volume makes the race negligible; a
-- hard constraint is a P1.7-security-pass-or-later decision, not a P1.4 one.

-- ============================ 1) CALC: nearest free slots (no authorization) ============================
-- Free slots (any cabin) long enough for _duration_minutes on _day, ranked by how close their
-- start is to _preferred_start. Reuses fn_center_gaps_calc so gap-merging/opening-hours math has
-- one source of truth. The suggested start is _preferred_start clamped into the gap's own bounds
-- (closest possible time inside that free window), not just the gap's raw start.
CREATE OR REPLACE FUNCTION public.fn_center_nearest_slots_calc(
  _center_id uuid,
  _day date,
  _duration_minutes integer,
  _preferred_start timestamptz,
  _as_of timestamptz,
  _limit integer DEFAULT 2
)
RETURNS TABLE (cabin integer, slot_start timestamptz, slot_end timestamptz, gap_minutes integer, distance_seconds numeric)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH gaps AS (
    SELECT * FROM public.fn_center_gaps_calc(_center_id, _day, _as_of, _duration_minutes)
  ), candidates AS (
    SELECT
      g.cabin,
      greatest(g.gap_start, least(_preferred_start, g.gap_end - make_interval(mins => _duration_minutes))) AS slot_start,
      g.minutes AS gap_minutes
    FROM gaps g
    WHERE g.minutes >= _duration_minutes
  )
  SELECT
    c.cabin,
    c.slot_start,
    c.slot_start + make_interval(mins => _duration_minutes) AS slot_end,
    c.gap_minutes,
    abs(extract(epoch FROM (c.slot_start - _preferred_start))) AS distance_seconds
  FROM candidates c
  ORDER BY distance_seconds ASC, c.cabin ASC
  LIMIT greatest(_limit, 0)
$$;

-- ============================ 2) create_appointment ============================
-- _cabin NULL = auto-assign the first free cabin at the exact requested time. _cabin given =
-- check only that cabin; a conflict there is reported (with alternatives) even if another cabin
-- happens to be free, since the caller asked for that one specifically.
CREATE OR REPLACE FUNCTION public.fn_create_appointment(
  _center_id uuid,
  _client_name text,
  _service_id uuid,
  _starts_at timestamptz,
  _cabin smallint DEFAULT NULL,
  _notes text DEFAULT NULL,
  _confirmed boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_cabin_count smallint;
  v_service record;
  v_ends_at timestamptz;
  v_cabin smallint;
  v_conflict boolean;
  v_alternatives jsonb;
  v_client_name text;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_center_member(_center_id) THEN
    RAISE EXCEPTION 'Accesso negato al centro' USING ERRCODE = '42501';
  END IF;

  v_client_name := btrim(coalesce(_client_name, ''));
  IF v_client_name = '' THEN
    RAISE EXCEPTION 'client_name obbligatorio' USING ERRCODE = '22023';
  END IF;
  IF _starts_at IS NULL THEN
    RAISE EXCEPTION 'starts_at obbligatorio' USING ERRCODE = '22023';
  END IF;

  SELECT c.timezone, c.cabin_count INTO v_tz, v_cabin_count
  FROM public.centers c WHERE c.id = _center_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro non trovato' USING ERRCODE = '42501';
  END IF;

  IF _cabin IS NOT NULL AND (_cabin < 1 OR _cabin > v_cabin_count) THEN
    RAISE EXCEPTION 'cabin fuori intervallo (1-%)', v_cabin_count USING ERRCODE = '22023';
  END IF;

  SELECT s.id, s.name, s.duration_minutes, s.price INTO v_service
  FROM public.business_services s
  WHERE s.id = _service_id AND s.center_id = _center_id AND s.is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servizio non trovato per questo centro' USING ERRCODE = '22023';
  END IF;

  v_ends_at := _starts_at + make_interval(mins => v_service.duration_minutes);

  IF _cabin IS NOT NULL THEN
    v_cabin := _cabin;
    SELECT EXISTS (
      SELECT 1 FROM public.business_appointments a
      WHERE a.center_id = _center_id AND a.status <> 'annullato'
        AND coalesce(a.cabin, 1) = v_cabin
        AND a.appointment_at < v_ends_at
        AND a.appointment_at + make_interval(mins => a.duration_minutes) > _starts_at
    ) INTO v_conflict;
  ELSE
    v_conflict := true;
    v_cabin := NULL;
    FOR v_cabin IN 1..v_cabin_count LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.business_appointments a
        WHERE a.center_id = _center_id AND a.status <> 'annullato'
          AND coalesce(a.cabin, 1) = v_cabin
          AND a.appointment_at < v_ends_at
          AND a.appointment_at + make_interval(mins => a.duration_minutes) > _starts_at
      ) THEN
        v_conflict := false;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF v_conflict THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
             'cabin', alt.cabin, 'starts_at', alt.slot_start, 'ends_at', alt.slot_end
           ) ORDER BY alt.distance_seconds), '[]'::jsonb)
      INTO v_alternatives
    FROM public.fn_center_nearest_slots_calc(
      _center_id, (_starts_at AT TIME ZONE v_tz)::date, v_service.duration_minutes, _starts_at, now(), 2
    ) alt;

    RETURN jsonb_build_object(
      'status', 'conflict',
      'requested', jsonb_build_object('starts_at', _starts_at, 'ends_at', v_ends_at, 'cabin', _cabin),
      'alternatives', v_alternatives
    );
  END IF;

  IF NOT coalesce(_confirmed, false) THEN
    RETURN jsonb_build_object(
      'status', 'draft',
      'requires_confirmation', true,
      'preview', jsonb_build_object(
        'client_name', v_client_name,
        'service_id', v_service.id,
        'service_name', v_service.name,
        'starts_at', _starts_at,
        'ends_at', v_ends_at,
        'duration_minutes', v_service.duration_minutes,
        'cabin', v_cabin,
        'price', v_service.price
      )
    );
  END IF;

  INSERT INTO public.business_appointments
    (center_id, user_id, client_name, service_id, service_name, appointment_at, duration_minutes, price, status, cabin, notes)
  VALUES
    (_center_id, auth.uid(), v_client_name, v_service.id, v_service.name, _starts_at, v_service.duration_minutes,
     v_service.price, 'confermato', v_cabin, _notes)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'status', 'created',
    'appointment', jsonb_build_object(
      'id', v_new_id,
      'client_name', v_client_name,
      'service_name', v_service.name,
      'starts_at', _starts_at,
      'ends_at', v_ends_at,
      'duration_minutes', v_service.duration_minutes,
      'cabin', v_cabin,
      'price', v_service.price,
      'status', 'confermato'
    )
  );
END;
$$;

-- ============================ 3) move_appointment ============================
-- Same cabin, new time only (P1.4 does not ask for a cabin change on move). Cannot move an
-- appointment already 'completato' or 'annullato'.
CREATE OR REPLACE FUNCTION public.fn_move_appointment(
  _center_id uuid,
  _appointment_id uuid,
  _new_starts_at timestamptz,
  _confirmed boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_appt record;
  v_new_ends_at timestamptz;
  v_conflict boolean;
  v_alternatives jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_center_member(_center_id) THEN
    RAISE EXCEPTION 'Accesso negato al centro' USING ERRCODE = '42501';
  END IF;
  IF _new_starts_at IS NULL THEN
    RAISE EXCEPTION 'new_starts_at obbligatorio' USING ERRCODE = '22023';
  END IF;

  SELECT c.timezone INTO v_tz FROM public.centers c WHERE c.id = _center_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Centro non trovato' USING ERRCODE = '42501';
  END IF;

  SELECT a.* INTO v_appt
  FROM public.business_appointments a
  WHERE a.id = _appointment_id AND a.center_id = _center_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appuntamento non trovato per questo centro' USING ERRCODE = '22023';
  END IF;
  IF v_appt.status IN ('completato', 'annullato') THEN
    RAISE EXCEPTION 'Impossibile spostare un appuntamento %', v_appt.status USING ERRCODE = '22023';
  END IF;

  v_new_ends_at := _new_starts_at + make_interval(mins => v_appt.duration_minutes);

  SELECT EXISTS (
    SELECT 1 FROM public.business_appointments a
    WHERE a.center_id = _center_id AND a.status <> 'annullato' AND a.id <> _appointment_id
      AND coalesce(a.cabin, 1) = coalesce(v_appt.cabin, 1)
      AND a.appointment_at < v_new_ends_at
      AND a.appointment_at + make_interval(mins => a.duration_minutes) > _new_starts_at
  ) INTO v_conflict;

  IF v_conflict THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
             'cabin', alt.cabin, 'starts_at', alt.slot_start, 'ends_at', alt.slot_end
           ) ORDER BY alt.distance_seconds), '[]'::jsonb)
      INTO v_alternatives
    FROM public.fn_center_nearest_slots_calc(
      _center_id, (_new_starts_at AT TIME ZONE v_tz)::date, v_appt.duration_minutes, _new_starts_at, now(), 2
    ) alt;

    RETURN jsonb_build_object(
      'status', 'conflict',
      'requested', jsonb_build_object('starts_at', _new_starts_at, 'ends_at', v_new_ends_at, 'cabin', v_appt.cabin),
      'alternatives', v_alternatives
    );
  END IF;

  IF NOT coalesce(_confirmed, false) THEN
    RETURN jsonb_build_object(
      'status', 'draft',
      'requires_confirmation', true,
      'preview', jsonb_build_object(
        'id', v_appt.id,
        'client_name', v_appt.client_name,
        'service_name', v_appt.service_name,
        'old_starts_at', v_appt.appointment_at,
        'new_starts_at', _new_starts_at,
        'new_ends_at', v_new_ends_at,
        'cabin', v_appt.cabin
      )
    );
  END IF;

  UPDATE public.business_appointments
  SET appointment_at = _new_starts_at
  WHERE id = _appointment_id AND center_id = _center_id;

  RETURN jsonb_build_object(
    'status', 'moved',
    'appointment', jsonb_build_object(
      'id', v_appt.id,
      'client_name', v_appt.client_name,
      'service_name', v_appt.service_name,
      'old_starts_at', v_appt.appointment_at,
      'starts_at', _new_starts_at,
      'ends_at', v_new_ends_at,
      'cabin', v_appt.cabin
    )
  );
END;
$$;

-- ============================ 4) propose_recall ============================
-- Owner-only (reads the owner-only dormant-clients list via fn_center_kpi_calc). Never writes:
-- picks the best-fit dormant client (their last service's duration fits the gap; ranked by
-- loyalty then recency) and returns the data for the caller to compose a draft message from.
CREATE OR REPLACE FUNCTION public.fn_propose_recall(
  _center_id uuid,
  _gap_start timestamptz,
  _gap_end timestamptz,
  _cabin smallint DEFAULT NULL,
  _as_of timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_gap_minutes integer;
  v_kpi record;
  v_pick jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.center_role(_center_id) IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Accesso negato al centro' USING ERRCODE = '42501';
  END IF;
  IF _gap_start IS NULL OR _gap_end IS NULL OR _gap_end <= _gap_start THEN
    RAISE EXCEPTION 'gap non valido' USING ERRCODE = '22023';
  END IF;

  v_gap_minutes := floor(extract(epoch FROM (_gap_end - _gap_start)) / 60);

  SELECT * INTO v_kpi FROM public.fn_center_kpi_calc(_center_id, _as_of);
  IF NOT FOUND OR v_kpi.dormant_clients IS NULL OR jsonb_array_length(v_kpi.dormant_clients) = 0 THEN
    RETURN jsonb_build_object('status', 'no_candidate', 'reason', 'Nessuna cliente dormiente');
  END IF;

  WITH candidates AS (
    SELECT
      d.value ->> 'client_key' AS client_key,
      d.value ->> 'client_name' AS client_name,
      (d.value ->> 'last_visit')::date AS last_visit,
      (d.value ->> 'visits')::integer AS visits,
      d.value ->> 'last_service' AS last_service,
      s.id AS service_id,
      s.duration_minutes AS service_duration_minutes
    FROM jsonb_array_elements(v_kpi.dormant_clients) AS d(value)
    LEFT JOIN public.business_services s
      ON s.center_id = _center_id AND s.name = d.value ->> 'last_service' AND s.is_active
  )
  SELECT jsonb_build_object(
           'client_key', c.client_key,
           'client_name', c.client_name,
           'last_visit', c.last_visit,
           'visits', c.visits,
           'last_service', c.last_service,
           'service_id', c.service_id,
           'service_duration_minutes', c.service_duration_minutes
         )
    INTO v_pick
  FROM candidates c
  WHERE c.service_duration_minutes IS NOT NULL AND c.service_duration_minutes <= v_gap_minutes
  ORDER BY c.visits DESC, c.last_visit DESC
  LIMIT 1;

  IF v_pick IS NULL THEN
    RETURN jsonb_build_object('status', 'no_candidate', 'reason', 'Nessuna cliente dormiente con un servizio che entra nel buco');
  END IF;

  RETURN jsonb_build_object(
    'status', 'proposed',
    'gap', jsonb_build_object('starts_at', _gap_start, 'ends_at', _gap_end, 'cabin', _cabin, 'minutes', v_gap_minutes),
    'client', v_pick
  );
END;
$$;

-- ============================ 5) PRIVILEGES ============================
REVOKE ALL ON FUNCTION public.fn_center_nearest_slots_calc(uuid, date, integer, timestamptz, timestamptz, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_center_nearest_slots_calc(uuid, date, integer, timestamptz, timestamptz, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.fn_create_appointment(uuid, text, uuid, timestamptz, smallint, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_create_appointment(uuid, text, uuid, timestamptz, smallint, text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_move_appointment(uuid, uuid, timestamptz, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_move_appointment(uuid, uuid, timestamptz, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_propose_recall(uuid, timestamptz, timestamptz, smallint, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_propose_recall(uuid, timestamptz, timestamptz, smallint, timestamptz) TO authenticated;

-- ============================ DOWN (manual rollback) ============================
-- DROP FUNCTION IF EXISTS public.fn_propose_recall(uuid, timestamptz, timestamptz, smallint, timestamptz);
-- DROP FUNCTION IF EXISTS public.fn_move_appointment(uuid, uuid, timestamptz, boolean);
-- DROP FUNCTION IF EXISTS public.fn_create_appointment(uuid, text, uuid, timestamptz, smallint, text, boolean);
-- DROP FUNCTION IF EXISTS public.fn_center_nearest_slots_calc(uuid, date, integer, timestamptz, timestamptz, integer);
