import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SiteVideo } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';

interface VideoModalProps {
  video: SiteVideo;
  isOpen: boolean;
  onClose: () => void;
  fallbackLocalPath?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  video, 
  isOpen, 
  onClose,
  fallbackLocalPath 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determina la sorgente video con fallback
  const videoSrc = video.source_type === 'file' && video.file_name
    ? getVideoUrl(video.file_name)
    : fallbackLocalPath;

  // Se il video Supabase fallisce, usa il fallback locale
  const [hasVideoError, setHasVideoError] = useState(false);
  const finalVideoSrc = hasVideoError && fallbackLocalPath ? fallbackLocalPath : videoSrc;

  // Auto-play quando il modal si apre
  useEffect(() => {
    if (isOpen && videoRef.current && finalVideoSrc) {
      const playVideo = async () => {
        try {
          setIsLoading(true);
          videoRef.current!.currentTime = 0;
          await videoRef.current!.play();
          setIsPlaying(true);
          setIsLoading(false);
        } catch (error) {
          console.error('[VideoModal] Errore durante il play:', error);
          setIsLoading(false);
        }
      };
      
      // Piccolo delay per assicurare che il modal sia completamente aperto
      const timer = setTimeout(playVideo, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, finalVideoSrc]);

  // Pausa il video quando il modal si chiude
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  if (!finalVideoSrc) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-white/10">
        {/* Header con pulsante chiudi */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleClose}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors duration-200"
            aria-label="Chiudi video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-white text-sm">Caricamento video...</p>
              </div>
            </div>
          )}

          {/* Video Player */}
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            preload="metadata"
            playsInline
            onLoadedData={() => setIsLoading(false)}
            onCanPlay={() => setIsLoading(false)}
            onPlay={() => {
              setIsPlaying(true);
              setIsLoading(false);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('[VideoModal] Errore video:', e);
              setIsLoading(false);
              // Se c'è un fallback locale e il video Supabase fallisce, prova il fallback
              if (!hasVideoError && fallbackLocalPath && videoSrc !== fallbackLocalPath) {
                console.log('[VideoModal] Tentativo fallback al video locale');
                setHasVideoError(true);
              }
            }}
            src={finalVideoSrc}
          >
            Il tuo browser non supporta la riproduzione video.
          </video>

          {/* Branding overlay */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">4 Elementi Italia</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;