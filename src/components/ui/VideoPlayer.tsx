import React, { useState, useEffect, useRef } from 'react';

import { SiteVideo } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
}

interface FileCheckResult {
  exists: boolean;
  contentType: string | null;
  size: number | null;
  status: number;
  error?: string;
}

interface CodecInfo {
  codec: string;
  isH264: boolean;
  isHEVC: boolean;
  browserSupport: string;
  canPlay: boolean;
}

interface VideoDebugInfo {
  currentSrc: string;
  readyState: number;
  networkState: number;
  error: MediaError | null;
  videoWidth: number;
  videoHeight: number;
  duration: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  className = '',
  autoPlay = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [useYouTube, setUseYouTube] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoUrl = video.source_type === 'file' && video.file_name 
    ? getVideoUrl(video.file_name) 
    : null;
  const youtubeUrl = video.youtube_video_id
    ? `https://www.youtube.com/watch?v=${video.youtube_video_id}`
    : (video.youtube_url ?? null);
  const youtubeEmbedUrl = video.youtube_video_id
    ? `https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1&controls=1`
    : null;

  // Timeout di sicurezza per nascondere il loading
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        console.log('[VideoPlayer] Timeout di sicurezza - nascondo loading');
        setIsLoading(false);
      }, 10000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading]);

  const handleLoadStart = () => {
    console.log('[VideoPlayer] Caricamento iniziato');
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
  };

  const handleLoadedData = () => {
    console.log('[VideoPlayer] Dati video caricati - nascondo loading');
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleCanPlay = () => {
    console.log('[VideoPlayer] Video pronto per riproduzione');
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleYouTubeReady = () => {
    console.log('[VideoPlayer] YouTube pronto per riproduzione');
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.target as HTMLVideoElement;
    const error = target.error;
    
    let errorMessage = 'Errore sconosciuto';
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Riproduzione interrotta dall\'utente';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Errore di rete durante il download';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Errore decodifica video';
          break;  
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato video non supportato dal browser';
          break;
      }
      
      console.error('[VideoPlayer] Errore caricamento:', {
        code: error.code,
        message: error.message,
        url: videoUrl
      });

      // Fallback automatico a YouTube se disponibile per errori di decodifica/formato
      if (
        (error.code === MediaError.MEDIA_ERR_DECODE || error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
        && youtubeUrl
      ) {
        console.info('[VideoPlayer] Attivo fallback YouTube:', youtubeUrl);
        setUseYouTube(true);
        setHasError(false);
        setIsLoading(true);
        return;
      }
    }

    console.error('[VideoPlayer] Errore finale:', errorMessage);
    setErrorDetails(errorMessage);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log('[VideoPlayer] Retry manuale');
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    videoRef.current?.load();
  };

  const openDirectUrl = () => {
    if (videoUrl) window.open(videoUrl, '_blank');
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
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-destructive">Errore riproduzione video</p>
            <p className="text-xs text-muted-foreground">{errorDetails}</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={openDirectUrl} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Apri direttamente
            </Button>
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Riprova
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="w-full aspect-video bg-background">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <span className="text-sm text-muted-foreground">Caricamento video...</span>
            </div>
          </div>
        )}
        {useYouTube && youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            onLoad={handleYouTubeReady}
          />
        ) : (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            autoPlay={autoPlay}
            className="w-full h-full"
            onLoadStart={handleLoadStart}
            onLoadedData={handleLoadedData}
            onCanPlay={handleCanPlay}
            onError={handleError}
          >
            <source src={videoUrl} type="video/mp4" />
            Il tuo browser non supporta il tag video.
          </video>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;