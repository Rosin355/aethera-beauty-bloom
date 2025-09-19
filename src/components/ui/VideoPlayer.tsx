import React, { useState, useEffect, useRef } from 'react';
import { SiteVideo } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string; // Per compatibilità, non utilizzata
}

interface FileCheckResult {
  exists: boolean;
  status?: number;
  contentType?: string;
  error?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  className = '',
  autoPlay = false,
  fallbackLocalPath,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileCheck, setFileCheck] = useState<FileCheckResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Solo video MP4 da Supabase
  const videoUrl = video.source_type === 'file' && video.file_name 
    ? getVideoUrl(video.file_name) 
    : null;

  // Controllo esistenza file
  useEffect(() => {
    const checkFileExists = async () => {
      if (!videoUrl) return;
      
      console.log('[VideoPlayer] Controllo esistenza file:', videoUrl);
      
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        const result: FileCheckResult = {
          exists: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type') || undefined,
        };
        
        if (!response.ok) {
          result.error = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        console.log('[VideoPlayer] Risultato controllo:', result);
        setFileCheck(result);
      } catch (error) {
        console.error('[VideoPlayer] Errore controllo file:', error);
        setFileCheck({
          exists: false,
          error: error instanceof Error ? error.message : 'Errore di rete'
        });
      }
    };

    if (videoUrl) {
      checkFileExists();
    }
  }, [videoUrl]);

  // Reset fallback when source changes
  useEffect(() => {
    setUseFallback(false);
  }, [videoUrl]);
  const handleLoadStart = () => {
    console.log('[VideoPlayer] Caricamento iniziato per:', videoUrl);
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
  };

  const handleLoadedMetadata = () => {
    console.log('[VideoPlayer] Metadata caricati');
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    console.log('[VideoPlayer] Video pronto per la riproduzione');
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.target as HTMLVideoElement;
    const error = target.error;

    let errorMessage = 'Errore sconosciuto';
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Riproduzione interrotta';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Errore di rete durante il caricamento';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Errore decodifica video';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato video non supportato';
          break;
      }
    }

    // Tentativo automatico di fallback locale se disponibile
    if ((error?.code === MediaError.MEDIA_ERR_DECODE || error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) && !useFallback && fallbackLocalPath) {
      console.warn('[VideoPlayer] Problema di codec/sorgente. Attivo fallback locale:', fallbackLocalPath);
      setUseFallback(true);
      setHasError(false);
      setIsLoading(true);
      setErrorDetails('Tentativo con sorgente locale...');
      // Ricarica il player con la nuova sorgente
      setTimeout(() => {
        videoRef.current?.load();
      }, 0);
      return;
    }

    console.error('[VideoPlayer] Errore riproduzione:', errorMessage, error);
    setErrorDetails(errorMessage);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log('[VideoPlayer] Tentativo di retry');
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    setUseFallback(false);
    videoRef.current?.load();
  };

  const openDirectUrl = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
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

  if (fileCheck && !fileCheck.exists) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/30 gap-4 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">File non trovato nel bucket</p>
            <p className="text-xs text-muted-foreground">
              File assente: '{video.file_name}' nel bucket 'videos'
            </p>
            {fileCheck.error && (
              <p className="text-xs text-muted-foreground">
                Dettagli: {fileCheck.error}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={openDirectUrl} variant="outline" size="sm">
              Apri URL direttamente
            </Button>
            <Button onClick={handleRetry} variant="outline" size="sm">
              Riprova
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/30 gap-4 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">Errore riproduzione video</p>
            {errorDetails && (
              <p className="text-xs text-muted-foreground">{errorDetails}</p>
            )}
            {fileCheck && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Status: {fileCheck.status}</p>
                <p>Content-Type: {fileCheck.contentType || 'Non specificato'}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={openDirectUrl} variant="outline" size="sm">
              Apri direttamente 
            </Button>
            <Button onClick={handleRetry} variant="outline" size="sm">
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
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="text-center space-y-2">
              <span className="text-sm text-muted-foreground">Caricamento video...</span>
              {fileCheck?.exists && (
                <div className="text-xs text-muted-foreground">
                  ✓ File trovato ({fileCheck.contentType})
                </div>
              )}
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          autoPlay={autoPlay}
          className="w-full h-full"
          onLoadStart={handleLoadStart}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleError}
        >
          <source src={useFallback && fallbackLocalPath ? fallbackLocalPath : videoUrl} type="video/mp4" />
          Il tuo browser non supporta il tag video.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;