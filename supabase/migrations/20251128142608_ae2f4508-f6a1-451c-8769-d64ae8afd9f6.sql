-- Create forum_post_media table for storing images and video embeds in posts
CREATE TABLE public.forum_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video_embed')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_post_media ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view media for approved posts
CREATE POLICY "Media for approved posts are viewable"
ON public.forum_post_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.forum_posts
    WHERE forum_posts.id = forum_post_media.post_id
    AND (forum_posts.is_approved = true OR forum_posts.author_id = auth.uid())
  )
);

-- Policy: Users can create media for their own posts
CREATE POLICY "Users can create media for own posts"
ON public.forum_post_media
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_posts
    WHERE forum_posts.id = forum_post_media.post_id
    AND forum_posts.author_id = auth.uid()
  )
);

-- Policy: Users can delete media from their own posts
CREATE POLICY "Users can delete media from own posts"
ON public.forum_post_media
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.forum_posts
    WHERE forum_posts.id = forum_post_media.post_id
    AND forum_posts.author_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_forum_post_media_post_id ON public.forum_post_media(post_id);

-- Create storage bucket for forum media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-media',
  'forum-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for forum media
CREATE POLICY "Forum media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-media');

CREATE POLICY "Authenticated users can upload forum media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'forum-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own forum media"
ON storage.objects FOR DELETE
USING (bucket_id = 'forum-media' AND auth.uid()::text = (storage.foldername(name))[1]);