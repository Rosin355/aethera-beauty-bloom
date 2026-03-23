import { supabase } from "@/integrations/supabase/client";

export interface SiteVideo {
  id: string;
  video_type: 'preview' | 'full';
  source_type: 'file' | 'youtube';
  file_name?: string;
  youtube_url?: string;
  youtube_video_id?: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSiteVideos(): Promise<SiteVideo[]> {
  const { data, error } = await supabase
    .from('site_videos')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching site videos:', error);
    return [];
  }

  return (data || []) as SiteVideo[];
}

export async function getSiteVideo(videoType: 'preview' | 'full'): Promise<SiteVideo | null> {
  const { data, error } = await supabase
    .from('site_videos')
    .select('*')
    .eq('video_type', videoType)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null;
    }
    console.error('Error fetching site video:', error);
    return null;
  }

  return data as SiteVideo;
}

export async function upsertSiteVideo(video: Partial<SiteVideo>): Promise<SiteVideo | null> {
  // First try to update existing record
  const { data: existing } = await supabase
    .from('site_videos')
    .select('id')
    .eq('video_type', video.video_type!)
    .single();

  let result;
  if (existing) {
    // Update existing
    result = await supabase
      .from('site_videos')
      .update({
        source_type: video.source_type,
        file_name: video.file_name,
        youtube_url: video.youtube_url,
        youtube_video_id: video.youtube_video_id,
        thumbnail_url: video.thumbnail_url,
        is_active: video.is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Insert new
    result = await supabase
      .from('site_videos')
      .insert({
        video_type: video.video_type,
        source_type: video.source_type,
        file_name: video.file_name,
        youtube_url: video.youtube_url,
        youtube_video_id: video.youtube_video_id,
        thumbnail_url: video.thumbnail_url,
        is_active: video.is_active ?? true
      })
      .select()
      .single();
  }

  if (result.error) {
    console.error('Error upserting site video:', result.error);
    return null;
  }

  return result.data;
}

export async function deleteSiteVideo(videoType: 'preview' | 'full'): Promise<boolean> {
  const { error } = await supabase
    .from('site_videos')
    .delete()
    .eq('video_type', videoType);

  if (error) {
    console.error('Error deleting site video:', error);
    return false;
  }

  return true;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    modestbranding: '1',
    rel: '0', 
    showinfo: '0',
    controls: '1',
    fs: '0',
    disablekb: '1',
    enablejsapi: '1'
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}