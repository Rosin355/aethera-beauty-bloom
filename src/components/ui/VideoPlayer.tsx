import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { SiteVideo, getYouTubeThumbnail } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { useYouTubeAPI } from '@/hooks/useYouTubeAPI';

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
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const isYouTubeReady = useYouTubeAPI();

  // Avvia la riproduzione in modo affidabile dopo il click
  useEffect(() => {
    if (isPlaying && videoRef.current && video.source_type === 'file') {
      const playPromise = videoRef.current.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          // In alcuni browser è necessario un secondo tentativo
          setTimeout(() => videoRef.current?.play().catch(() => {}), 0);
        });
      }
    }
  }, [isPlaying, video.source_type]);

  // Cleanup YouTube player on unmount
  useEffect(() => {
    return () => {
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
          console.log('[VideoPlayer] YouTube player destroyed');
        } catch (e) {
          console.error('[VideoPlayer] Error destroying YouTube player:', e);
        }
      }
    };
  }, []);

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
    // Per video file, usa il player nativo
    if (video.source_type === 'file' && video.file_name) {
      const el = videoRef.current;
      if (el) {
        try {
          el.muted = false;
          setIsPlaying(true);
          await el.play();
          return;
        } catch (err1) {
          console.warn('[VideoPlayer] play() fallita, ritento in muto', err1);
          try {
            el.muted = true;
            setIsPlaying(true);
            await el.play();
            setTimeout(() => {
              try { el.muted = false; } catch {}
            }, 150);
            return;
          } catch (err2) {
            console.error('[VideoPlayer] secondo tentativo fallito', err2);
            if (nativeSrc) {
              window.open(nativeSrc, '_blank');
              return;
            }
          }
        }
      }
      return;
    }

    // Per video YouTube, usa il player inline se l'API è pronta
    if (video.source_type === 'youtube' && video.youtube_video_id) {
      if (isYouTubeReady && youtubeContainerRef.current && !youtubePlayerRef.current) {
        console.log('[VideoPlayer] Creazione YouTube player inline');
        try {
          youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
            height: '100%',
            width: '100%',
            videoId: video.youtube_video_id,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 0,
              playsinline: 1,
              enablejsapi: 1,
              hl: 'it',
              origin: window.location.origin
            },
            events: {
              onReady: (event: any) => {
                console.log('[VideoPlayer] YouTube onReady');
                setIsPlaying(true);
                event.target.playVideo();
              },
              onStateChange: (event: any) => {
                console.log('[VideoPlayer] YouTube onStateChange:', event.data);
                const isCurrentlyPlaying = event.data === window.YT.PlayerState.PLAYING;
                setIsPlaying(isCurrentlyPlaying);
              },
              onError: (event: any) => {
                console.error('[VideoPlayer] YouTube onError:', event.data);
                setIsPlaying(false);
              }
            }
          });
        } catch (error) {
          console.error('[VideoPlayer] Errore creazione YouTube player:', error);
          setIsPlaying(false);
        }
      } else if (youtubePlayerRef.current) {
        // Player già esistente, riproduci
        console.log('[VideoPlayer] Riproduci video YouTube esistente');
        youtubePlayerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        // API non pronta, aspetta un momento e riprova
        console.warn('[VideoPlayer] YouTube API non pronta, riprovo...');
        setTimeout(() => handlePlay(), 500);
      }
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
      {/* Video nativo per file locali */}
      {nativeSrc && video.source_type === 'file' && (
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

      {/* Container per YouTube player */}
      {video.source_type === 'youtube' && (
        <div
          ref={youtubeContainerRef}
          className="w-full h-full rounded-lg absolute inset-0"
          style={{ 
            backgroundColor: '#000',
            zIndex: isPlaying ? 10 : 5
          }}
        />
      )}

      {/* Overlay e UI di anteprima */}
      {!isPlaying && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
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

          <div className="absolute inset-0 flex items-center justify-center" onClick={handlePlay} style={{ zIndex: 30 }}>
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