-- Create table for site videos configuration
CREATE TABLE public.site_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_type TEXT NOT NULL CHECK (video_type IN ('preview', 'full')),
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'youtube')) DEFAULT 'file',
  file_name TEXT,
  youtube_url TEXT,
  youtube_video_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_type)
);

-- Enable RLS
ALTER TABLE public.site_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Site videos are viewable by everyone" 
ON public.site_videos 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage site videos" 
ON public.site_videos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_site_videos_updated_at
BEFORE UPDATE ON public.site_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();