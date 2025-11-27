-- Create ai_training_data table for AI training content
CREATE TABLE public.ai_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  data_type TEXT DEFAULT 'manual',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Only admins can manage AI training data
CREATE POLICY "Admins can manage ai_training_data"
ON public.ai_training_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add user_type column to profiles for differentiating users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'professional';

-- Create storage bucket for AI training files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-training-data', 'ai-training-data', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ai-training-data bucket
CREATE POLICY "Admins can upload ai training files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ai-training-data' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read ai training files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ai-training-data' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ai training files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ai-training-data' AND has_role(auth.uid(), 'admin'::app_role));