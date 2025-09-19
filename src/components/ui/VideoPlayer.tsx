import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { SiteVideo, getYouTubeThumbnail } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string; // es. "/video-anteprima.mp4"
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  className = "", 
  autoPlay = false,
  fallbackLocalPath
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Avvia la riproduzione in modo affidabile dopo il click
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          // In alcuni browser è necessario un secondo tentativo
          setTimeout(() => videoRef.current?.play().catch(() => {}), 0);
        });
      }
    }
  }, [isPlaying]);

  // Determina la thumbnail da usare
  const getThumbnailUrl = () => {
    // 1. Thumbnail personalizzata se disponibile
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    // 2. Thumbnail YouTube automatica
    if (video.source_type === 'youtube' && video.youtube_video_id) {
      return getYouTubeThumbnail(video.youtube_video_id);
    }
    
    // 3. Fallback generico
    return null;
  };

  const handlePlay = async () => {
    const canUseNative =
      (video.source_type === 'file' && !!video.file_name) ||
      (video.source_type === 'youtube' && !!fallbackLocalPath);

    const el = videoRef.current;

    if (canUseNative && el) {
      try {
        // Primo tentativo: avvia con audio attivo
        el.muted = false;
        setIsPlaying(true);
        await el.play();
        return;
      } catch (err1) {
        console.warn('[VideoPlayer] play() fallita, ritento in muto', err1);
        try {
          // Secondo tentativo: avvia in muto e poi smuta
          el.muted = true;
          setIsPlaying(true);
          await el.play();
          setTimeout(() => {
            try { el.muted = false; } catch {}
          }, 150);
          return;
        } catch (err2) {
          console.error('[VideoPlayer] secondo tentativo fallito', err2);
          // Fallback finale: apri la sorgente in una nuova scheda
          if (nativeSrc) {
            window.open(nativeSrc, '_blank');
            return;
          }
        }
      }
      return;
    }

    if (video.source_type === 'youtube' && video.youtube_video_id) {
      window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, '_blank');
      return;
    }
  };

  const thumbnailUrl = getThumbnailUrl();

  // Sorgente nativa disponibile (file o fallback locale)
  const nativeSrc: string | null =
    video.source_type === 'file' && video.file_name
      ? getVideoUrl(video.file_name)
      : video.source_type === 'youtube' && fallbackLocalPath
      ? fallbackLocalPath
      : null;

  return (
    <div className={`relative group ${className}`}>
      {/* Video sempre presente nel DOM per compat iOS */}
      {nativeSrc && (
        <video
          ref={videoRef}
          controls={isPlaying}
          preload="metadata"
          className="w-full h-full rounded-lg"
          style={{ backgroundColor: '#000' }}
          playsInline
          muted={!isPlaying}
          poster={thumbnailUrl || undefined}
          onLoadedMetadata={() => {
            if (autoPlay || isPlaying) {
              const el = videoRef.current;
              el?.play().catch(() => {});
            }
          }}
          onCanPlay={() => console.log('[VideoPlayer] onCanPlay')}
          onPlay={() => console.log('[VideoPlayer] onPlay')}
          onPause={() => console.log('[VideoPlayer] onPause')}
          onError={(e) => {
            console.error('[VideoPlayer] onError', e);
          }}
          src={nativeSrc}
        >
          Il tuo browser non supporta il tag video.
        </video>
      )}

      {/* Overlay e UI di anteprima */}
      {!isPlaying && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full bg-gray-900 overflow-hidden rounded-lg">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Anteprima video"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Video disponibile</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 rounded-lg" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center" onClick={handlePlay}>
            <div className="bg-white/90 hover:bg-white rounded-full p-6 transition-all duration-300 group-hover:scale-110 shadow-xl border-2 border-white/20">
              <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg" />

          <div className="absolute bottom-4 left-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">4 Elementi Italia</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;