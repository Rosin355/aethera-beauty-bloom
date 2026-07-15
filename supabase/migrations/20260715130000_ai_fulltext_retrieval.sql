-- Lexical (full-text) retrieval over ai_training_data — replaces the fake-embedding
-- path for go-live. No external providers; real semantic embeddings return in phase 2.

-- Italian tsvector over title/description/content, kept in sync automatically.
ALTER TABLE public.ai_training_data
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'italian',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_ai_training_data_search_tsv
  ON public.ai_training_data USING gin (search_tsv);

-- Service-role-only lexical search. Mirrors the search_training_data lockdown from
-- phase 1: SECURITY DEFINER, EXECUTE revoked from PUBLIC/anon/authenticated and granted
-- only to service_role (the ai-assistant edge function calls it with the service role).
CREATE OR REPLACE FUNCTION public.match_training_data_fts(
  query_text text,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  content text,
  data_type text,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  -- websearch_to_tsquery safely tolerates arbitrary user input.
  ts_query := websearch_to_tsquery('italian', coalesce(query_text, ''));

  IF ts_query IS NULL OR numnode(ts_query) = 0 THEN
    RETURN; -- nothing searchable in the query
  END IF;

  RETURN QUERY
  SELECT
    atd.id,
    atd.title,
    atd.description,
    atd.content,
    atd.data_type,
    ts_rank(atd.search_tsv, ts_query) AS rank
  FROM public.ai_training_data atd
  WHERE atd.is_active = true
    AND atd.search_tsv @@ ts_query
  ORDER BY rank DESC
  LIMIT greatest(1, coalesce(match_count, 4));
END;
$$;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'match_training_data_fts'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
