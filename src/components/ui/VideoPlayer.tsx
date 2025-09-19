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
  const [currentSource, setCurrentSource] = useState(0); // Indice sorgente corrente
  const [key, setKey] = useState(0); // Per forzare il reload del player
  
  // Costruzione catena di fallback: Supabase MP4 -> YouTube -> Local MP4
  const fileSrc = video.source_type === 'file' && video.file_name ? getVideoUrl(video.file_name) : null;
  const rawYtId = (video as any).youtube_video_id as string | undefined;
  const ytUrl = (video as any).youtube_url as string | undefined;
  const ytId = rawYtId ?? (ytUrl ? extractYouTubeVideoId(ytUrl) : null);
  const youtubeSrc = ytId ? `https://www.youtube.com/watch?v=${ytId}` : (ytUrl || null);
  
  // Array di sorgenti in ordine di priorità
  const sources = [
    fileSrc, // Supabase MP4
    youtubeSrc, // YouTube
    fallbackLocalPath // Local MP4 fallback
  ].filter(Boolean);

  const resolvedUrl = sources[currentSource];

  // Thumbnail/cover per "light" (solo YouTube)
  const thumbnailUrl = (() => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (ytId && resolvedUrl?.includes('youtube')) return getYouTubeThumbnail(ytId);
    return undefined;
  })();

  const handleError = (e: any) => {
    console.error('[VideoPlayer] Errore riproduzione:', e, 'Source:', resolvedUrl);
    
    // Prova la prossima sorgente nella catena
    if (currentSource < sources.length - 1) {
      setCurrentSource(prev => prev + 1);
      setKey(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setCurrentSource(0); // Ricomincia dalla prima sorgente
    setKey(prev => prev + 1);
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

  // Cast ReactPlayer per risolvere problemi di tipo con url prop
  const Player = ReactPlayer as any;

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="w-full aspect-video">
        <Player
          key={key}
          url={resolvedUrl as string}
          controls
          width="100%"
          height="100%"
          light={thumbnailUrl && resolvedUrl?.includes('youtube')} // Light solo per YouTube
          playIcon={
            <div className="bg-background/90 hover:bg-background rounded-full p-4 shadow-sm border border-border transition-transform">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          }
          playsInline={true}
          pip={false}
          crossOrigin="anonymous"
          config={{
            youtube: {
              playerVars: {
                playsinline: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0
              }
            }
          }}
          onReady={() => console.log('[VideoPlayer] Video pronto per la riproduzione')}
          onPlay={() => console.log('[VideoPlayer] Riproduzione iniziata')}
          onError={handleError}
          fallback={
            <div className="w-full aspect-video flex items-center justify-center bg-muted/30">
              <span className="text-sm">Caricamento video...</span>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
