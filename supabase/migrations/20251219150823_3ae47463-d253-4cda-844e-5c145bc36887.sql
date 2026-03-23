-- Add is_active column to ai_training_data table
ALTER TABLE public.ai_training_data 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_ai_training_data_is_active 
ON public.ai_training_data(is_active) 
WHERE is_active = true;