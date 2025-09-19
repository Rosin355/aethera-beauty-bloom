import React, { useState, useEffect, useRef } from 'react';
import { SiteVideo } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw, ExternalLink, AlertCircle, Info } from 'lucide-react';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string;
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
  fallbackLocalPath,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileCheck, setFileCheck] = useState<FileCheckResult | null>(null);
  const [codecInfo, setCodecInfo] = useState<CodecInfo | null>(null);
  const [debugInfo, setDebugInfo] = useState<VideoDebugInfo | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [useFallback, setUseFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = video.source_type === 'file' && video.file_name 
    ? getVideoUrl(video.file_name) 
    : null;

  // Funzione per rilevare il codec del video
  const detectCodec = async (url: string): Promise<CodecInfo | null> => {
    try {
      console.log('[VideoPlayer] Rilevamento codec per:', url);
      
      // Fetch primi 1024 bytes per analizzare header
      const response = await fetch(url, {
        headers: { 'Range': 'bytes=0-1023' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Converti in stringa per cercare codec
      const hexString = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      let codec = 'sconosciuto';
      let isH264 = false;
      let isHEVC = false;
      
      // Cerca pattern per H.264 (avc1, mp42)
      if (hexString.includes('61766331') || hexString.includes('6d703432')) {
        codec = 'H.264 (AVC)';
        isH264 = true;
      }
      // Cerca pattern per HEVC (hvc1, hev1)
      else if (hexString.includes('68766331') || hexString.includes('68657631')) {
        codec = 'HEVC (H.265)';
        isHEVC = true;
      }
      
      // Test supporto browser
      const testElement = document.createElement('video');
      let browserSupport = 'Non testato';
      let canPlay = false;
      
      if (isH264) {
        const support = testElement.canPlayType('video/mp4; codecs="avc1.42E01E"');
        browserSupport = support || 'Non supportato';
        canPlay = support === 'probably' || support === 'maybe';
      } else if (isHEVC) {
        const support = testElement.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"');
        browserSupport = support || 'Non supportato';
        canPlay = support === 'probably' || support === 'maybe';
      }
      
      console.log('[VideoPlayer] Codec rilevato:', { codec, isH264, isHEVC, browserSupport, canPlay });
      
      return { codec, isH264, isHEVC, browserSupport, canPlay };
    } catch (error) {
      console.error('[VideoPlayer] Errore rilevamento codec:', error);
      return null;
    }
  };

  // Controllo esistenza file e codec
  useEffect(() => {
    const checkFileAndCodec = async () => {
      if (!videoUrl) return;
      
      console.log('[VideoPlayer] Controllo file e codec:', videoUrl);
      
      try {
        // Controllo esistenza file
        const response = await fetch(videoUrl, { method: 'HEAD' });
        const fileResult: FileCheckResult = {
          exists: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type'),
          size: parseInt(response.headers.get('content-length') || '0'),
        };
        
        if (!response.ok) {
          fileResult.error = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        console.log('[VideoPlayer] Risultato controllo file:', fileResult);
        setFileCheck(fileResult);
        
        // Se il file esiste, rileva il codec
        if (response.ok) {
          const codec = await detectCodec(videoUrl);
          setCodecInfo(codec);
        }
      } catch (error) {
        console.error('[VideoPlayer] Errore controllo:', error);
        setFileCheck({
          exists: false,
          status: 0,
          contentType: null,
          size: null,
          error: error instanceof Error ? error.message : 'Errore di rete'
        });
      }
    };

    if (videoUrl) {
      checkFileAndCodec();
    }
  }, [videoUrl]);

  // Aggiorna info debug del video
  const updateDebugInfo = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setDebugInfo({
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration || 0,
      });
    }
  };

  const handleLoadStart = () => {
    console.log('[VideoPlayer] Caricamento iniziato');
    setIsLoading(true);
    setHasError(false);
    setErrorDetails('');
    updateDebugInfo();
  };

  const handleLoadedMetadata = () => {
    console.log('[VideoPlayer] Metadata caricati');
    updateDebugInfo();
  };

  const handleCanPlay = () => {
    console.log('[VideoPlayer] Video pronto per riproduzione');
    setIsLoading(false);
    updateDebugInfo();
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.target as HTMLVideoElement;
    const error = target.error;
    updateDebugInfo();
    
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
          errorMessage = 'Errore decodifica video - Possibile problema codec';
          break;  
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato video non supportato dal browser';
          break;
      }
    }

    // Tentativo automatico di fallback se codec non supportato
    if ((error?.code === MediaError.MEDIA_ERR_DECODE || error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) 
        && !useFallback && fallbackLocalPath) {
      console.warn('[VideoPlayer] Tentativo fallback:', fallbackLocalPath);
      setUseFallback(true);
      setHasError(false);
      setIsLoading(true);
      setErrorDetails('Tentativo con video locale...');
      setTimeout(() => videoRef.current?.load(), 100);
      return;
    }

    console.error('[VideoPlayer] Errore finale:', errorMessage, error);
    setErrorDetails(errorMessage);
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log('[VideoPlayer] Retry manuale');
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    setUseFallback(false);
    videoRef.current?.load();
  };

  const openDirectUrl = () => {
    const url = useFallback && fallbackLocalPath ? fallbackLocalPath : videoUrl;
    if (url) window.open(url, '_blank');
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
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">File video non trovato</p>
            <p className="text-xs text-muted-foreground">
              File: '{video.file_name}' (Status: {fileCheck.status})
            </p>
            {fileCheck.error && (
              <p className="text-xs text-muted-foreground">{fileCheck.error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={openDirectUrl} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Apri URL
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

  if (hasError) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/30 gap-4 p-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-destructive">Errore riproduzione video</p>
            <p className="text-xs text-muted-foreground">{errorDetails}</p>
            
            {/* Info dettagliate codec */}
            {codecInfo && (
              <div className="bg-muted/50 rounded p-3 text-xs text-left space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Diagnostica Codec</span>
                </div>
                <div>Codec rilevato: <span className="font-medium">{codecInfo.codec}</span></div>
                <div>Supporto browser: <span className={codecInfo.canPlay ? 'text-green-600' : 'text-red-600'}>
                  {codecInfo.browserSupport}
                </span></div>
                {codecInfo.isHEVC && !codecInfo.canPlay && (
                  <div className="text-amber-600 mt-2 p-2 bg-amber-50 rounded text-xs">
                    ⚠️ Video in formato HEVC/H.265 non supportato da questo browser.
                    <br />È necessario convertire in H.264 per la compatibilità.
                  </div>
                )}
              </div>
            )}
            
            {/* Info debug video */}
            {debugInfo && (
              <details className="text-xs text-left bg-muted/30 rounded p-2">
                <summary className="cursor-pointer font-medium mb-1">Debug Info</summary>
                <div className="space-y-1 text-muted-foreground">
                  <div>ReadyState: {debugInfo.readyState}/4</div>
                  <div>NetworkState: {debugInfo.networkState}/3</div>
                  <div>Dimensioni: {debugInfo.videoWidth}x{debugInfo.videoHeight}</div>
                  <div>Durata: {debugInfo.duration.toFixed(1)}s</div>
                  <div>Sorgente: {useFallback ? 'Fallback locale' : 'Supabase'}</div>
                </div>
              </details>
            )}
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
              {fileCheck?.exists && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>✓ File trovato ({fileCheck.contentType})</div>
                  {codecInfo && (
                    <div className={codecInfo.canPlay ? 'text-green-600' : 'text-amber-600'}>
                      Codec: {codecInfo.codec} ({codecInfo.browserSupport})
                    </div>
                  )}
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