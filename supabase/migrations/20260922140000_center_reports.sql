-- Concierge backend, P1.6: "lettura del centro" storage for the generate-report edge function.
--
-- Three tables:
--   report_thresholds   Admin-managed semaphore bands per KPI metric, same shape as
--                        ai_system_config (fixed reference data, not tenant data).
--   center_reports       One row per generated reading: the KPI snapshot (values + status,
--                        already computed against report_thresholds) and the model-written
--                        diagnostic narrative. Members read; nobody writes directly through
--                        PostgREST -- only generate-report's service-role client inserts one,
--                        after it has actually called the model. No INSERT/UPDATE/DELETE grant
--                        to authenticated at all (contrast center_profile_slots, which members
--                        write themselves).
--   center_actions       5 urgent + 5 strategic actions per report. Members read and toggle
--                        `done`; only the edge function inserts them.
--
-- Deviation from docs/45_SEQUENZA_PROMPT_BETA.md, noted here per CLAUDE.md's own convention of
-- recording where the repo differs from the prompt doc: the prompt says generate-report needs
-- only "center member" auth. This migration (and generate-report itself) instead requires the
-- center OWNER, matching every other revenue-derived read in this codebase (fn_center_kpi,
-- fn_simulate_goal, client_metrics) -- the KPI snapshot in a report is exactly that kind of
-- number. set_action_done is owner-only too, matching docs/CONCIERGE_TOOLS.md's own catalogue
-- row (P1.6, access: owner) which is more specific than the prose spec.

-- ============================ 1) report_thresholds ============================
-- Semaphore band per metric: for a higher-is-better metric (avg ticket, occupancy, rebooking,
-- revenue/hour), value >= ok_threshold -> 'ok', >= watch_threshold -> 'watch', else 'act'. For a
-- lower-is-better metric (dormant clients), the comparisons invert.
CREATE TABLE IF NOT EXISTS public.report_thresholds (
  metric_key text PRIMARY KEY,
  label text NOT NULL,
  unit text NOT NULL DEFAULT '',
  higher_is_better boolean NOT NULL DEFAULT true,
  ok_threshold numeric NOT NULL,
  watch_threshold numeric NOT NULL
);

ALTER TABLE public.report_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read report thresholds" ON public.report_thresholds;
CREATE POLICY "Authenticated users read report thresholds"
ON public.report_thresholds FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins manage report thresholds" ON public.report_thresholds;
CREATE POLICY "Admins manage report thresholds"
ON public.report_thresholds FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.report_thresholds TO authenticated;

-- Starting bands -- admin-editable; not tuned on real data yet, just sane defaults so the
-- semaphore has something to say from the first report.
INSERT INTO public.report_thresholds (metric_key, label, unit, higher_is_better, ok_threshold, watch_threshold)
VALUES
  ('avg_ticket_7d', 'Scontrino medio', '€', true, 55, 40),
  ('occupancy_pct_7d', 'Occupazione cabine', '%', true, 70, 50),
  ('rebooking_pct_30d', 'Riprenotazione', '%', true, 50, 30),
  ('revenue_per_hour_7d', 'Ricavo per ora aperta', '€', true, 40, 25),
  ('dormant_clients_count', 'Clienti dormienti', '', false, 10, 25)
ON CONFLICT (metric_key) DO UPDATE SET
  label = EXCLUDED.label,
  unit = EXCLUDED.unit,
  higher_is_better = EXCLUDED.higher_is_better,
  ok_threshold = EXCLUDED.ok_threshold,
  watch_threshold = EXCLUDED.watch_threshold;

-- ============================ 2) center_reports ============================
CREATE TABLE IF NOT EXISTS public.center_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  kpi_snapshot jsonb NOT NULL,
  diagnostic_narrative text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_center_reports_center_generated
  ON public.center_reports (center_id, generated_at DESC);

ALTER TABLE public.center_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read center reports" ON public.center_reports;
CREATE POLICY "Members read center reports"
ON public.center_reports FOR SELECT USING (public.is_center_member(center_id));

-- No INSERT/UPDATE/DELETE policy and no grant to authenticated: only generate-report's
-- service-role client writes these, after actually calling the model.
GRANT SELECT ON public.center_reports TO authenticated;

-- ============================ 3) center_actions ============================
CREATE TABLE IF NOT EXISTS public.center_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.center_reports(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('urgent', 'strategic')),
  number smallint NOT NULL CHECK (number BETWEEN 1 AND 5),
  action_text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, kind, number)
);

CREATE INDEX IF NOT EXISTS idx_center_actions_center ON public.center_actions (center_id);

ALTER TABLE public.center_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read center actions" ON public.center_actions;
CREATE POLICY "Members read center actions"
ON public.center_actions FOR SELECT USING (public.is_center_member(center_id));

-- P1.7 security pass (docs/SECURITY_REVIEW_FASE1.md): this was originally member-level RLS with
-- only the ai-assistant TOOL (set_action_done) restricting to owner -- but RLS is the real
-- boundary (a member's own valid JWT reaches PostgREST directly, no tool in the way), so that
-- left any member able to toggle the strategic checklist by calling PostgREST directly, contrary
-- to the product intent. Tightened to owner-only at the RLS layer too, matching the tool. Widen
-- this again only when a real feature (e.g. a future team dashboard) needs member-level writes --
-- not speculatively ahead of one.
DROP POLICY IF EXISTS "Members update center actions" ON public.center_actions;
DROP POLICY IF EXISTS "Owner updates center actions" ON public.center_actions;
CREATE POLICY "Owner updates center actions"
ON public.center_actions FOR UPDATE
USING (public.center_role(center_id) = 'owner') WITH CHECK (public.center_role(center_id) = 'owner');

GRANT SELECT, UPDATE ON public.center_actions TO authenticated;
-- No INSERT/DELETE grant to authenticated: only generate-report's service-role client creates
-- (or replaces, on a fresh report) these rows.

-- ============================ DOWN (manual rollback) ============================
-- DROP TABLE IF EXISTS public.center_actions;
-- DROP TABLE IF EXISTS public.center_reports;
-- DROP TABLE IF EXISTS public.report_thresholds;
