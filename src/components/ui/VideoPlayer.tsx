import React, { useState } from 'react';
import { SiteVideo } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  className = '',
  autoPlay = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Solo video MP4 da Supabase
  const videoUrl = video.source_type === 'file' && video.file_name 
    ? getVideoUrl(video.file_name) 
    : null;

  const handleLoadStart = () => {
    console.log('[VideoPlayer] Caricamento iniziato');
    setIsLoading(true);
    setHasError(false);
  };

  const handleCanPlay = () => {
    console.log('[VideoPlayer] Video pronto per la riproduzione');
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('[VideoPlayer] Errore riproduzione:', e);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Forza il reload del video
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.load();
    }
  };

  if (!videoUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex items-center justify-center bg-muted/30">
          <span className="text-sm text-muted-foreground">Nessun video disponibile</span>
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
            <p className="text-xs text-muted-foreground">Il video potrebbe non essere disponibile</p>
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
      <div className="w-full aspect-video bg-background">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <span className="text-sm text-muted-foreground">Caricamento video...</span>
          </div>
        )}
        
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          autoPlay={autoPlay}
          className="w-full h-full object-cover"
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          style={{ aspectRatio: '16/9' }}
        >
          Il tuo browser non supporta il tag video.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;