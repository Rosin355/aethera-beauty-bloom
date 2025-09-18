-- Add thumbnail_url column to site_videos table
ALTER TABLE public.site_videos 
ADD COLUMN thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.site_videos.thumbnail_url IS 'URL for custom video thumbnail image';