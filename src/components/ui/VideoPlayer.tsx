import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { SiteVideo, getYouTubeThumbnail, extractYouTubeVideoId } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { Button } from '@/components/ui/button';

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
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0); // Per forzare il reload del player
  
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

  const handleRetry = () => {
    setHasError(false);
    setKey(prev => prev + 1); // Forza il remount del ReactPlayer
  };

  if (!resolvedUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex items-center justify-center bg-muted/30">
          <span className="text-sm">Nessuna sorgente video disponibile</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/30 gap-4 p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Errore durante il caricamento del video</p>
            <p className="text-xs text-muted-foreground">Il video potrebbe non essere disponibile al momento</p>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <ReactPlayer
        key={key}
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
        // Ottimizzazioni per Safari Mobile e compatibilità inline
        playsInline={true}
        pip={false}
        onError={(e) => {
          console.error('[VideoPlayer] Errore riproduzione:', e);
          setHasError(true);
        }}
        fallback={
          <div className="w-full aspect-video flex items-center justify-center bg-muted/30">
            <span className="text-sm">Caricamento video...</span>
          </div>
        }
      />
    </div>
  );
};

export default VideoPlayer;
