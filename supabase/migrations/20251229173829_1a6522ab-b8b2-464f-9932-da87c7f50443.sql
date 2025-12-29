-- Enable pgvector extension in public schema for compatibility
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Add embedding column to ai_training_data (if not exists from previous migration)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_training_data' 
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE public.ai_training_data ADD COLUMN embedding vector(768);
  END IF;
END $$;

-- Drop function if exists to recreate it
DROP FUNCTION IF EXISTS public.search_training_data;

-- Create function for semantic search
CREATE OR REPLACE FUNCTION public.search_training_data(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  description text,
  data_type text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    atd.id,
    atd.title,
    atd.content,
    atd.description,
    atd.data_type,
    (1 - (atd.embedding <=> query_embedding))::float as similarity
  FROM ai_training_data atd
  WHERE atd.is_active = true 
    AND atd.embedding IS NOT NULL
    AND (1 - (atd.embedding <=> query_embedding)) > match_threshold
  ORDER BY atd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;