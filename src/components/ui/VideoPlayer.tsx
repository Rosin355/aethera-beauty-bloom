import React from 'react';
import ReactPlayer from 'react-player';
import { SiteVideo, getYouTubeThumbnail, extractYouTubeVideoId } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string; // es. "/video-completo.mp4"
}

// Player unificato basato su ReactPlayer: supporta sia YouTube che MP4 con click-to-play stabile
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  className = '',
  autoPlay = false,
  fallbackLocalPath,
}) => {
  // Costruzione URL sorgente con priorità al file locale (o fallback) per massima affidabilità
  const fileSrc = video.source_type === 'file' && video.file_name ? getVideoUrl(video.file_name) : null;
  // Estrazione robusta ID YouTube (evita passaggi null a extract)
  const rawYtId = (video as any).youtube_video_id as string | undefined;
  const ytUrl = (video as any).youtube_url as string | undefined;
  const ytId = rawYtId ?? (ytUrl ? extractYouTubeVideoId(ytUrl) : null);
  const youtubeSrc = ytId ? `https://www.youtube.com/watch?v=${ytId}` : (ytUrl || null);

  // Se c'è un fallback locale per una sorgente YouTube, usiamolo come priorità
  const resolvedUrl = fileSrc || (video.source_type === 'youtube' && fallbackLocalPath ? fallbackLocalPath : youtubeSrc);

  // Thumbnail/cover per "light" (click to load)
  const thumbnailUrl = (() => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (ytId) return getYouTubeThumbnail(ytId);
    return undefined;
  })();

  if (!resolvedUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex items-center justify-center bg-muted/30">
          <span className="text-sm">Nessuna sorgente video disponibile</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <ReactPlayer
        src={resolvedUrl}
        controls
        width="100%"
        height="auto"
        style={{ aspectRatio: '16/9' }}
        light={thumbnailUrl || (video.source_type === 'youtube' ? true : false)}
        playIcon={
          <div className="bg-background/90 hover:bg-background rounded-full p-4 shadow-sm border border-border transition-transform">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        }
        onError={(e) => {
          try {
            window.open(resolvedUrl as string, '_blank');
          } catch {}
          // eslint-disable-next-line no-console
          console.error('[VideoPlayer] ReactPlayer onError', e);
        }}
      />
    </div>
  );
};

export default VideoPlayer;
