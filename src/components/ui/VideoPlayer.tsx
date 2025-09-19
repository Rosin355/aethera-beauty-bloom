import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { SiteVideo, getYouTubeThumbnail } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';
import { useYouTubeAPI } from '@/hooks/useYouTubeAPI';
import VideoModal from '@/components/ui/VideoModal';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
  fallbackLocalPath?: string; // es. "/video-anteprima.mp4"
  openInModal?: boolean; // Se true, apre il video in un modal invece di gestire la riproduzione inline
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  className = "", 
  autoPlay = false,
  fallbackLocalPath,
  openInModal = false
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const { isReady: isYouTubeReady, hasTimeout: youTubeHasTimeout, isSafariMobile } = useYouTubeAPI();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

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
    // Se openInModal è true, apri il modal invece di gestire la riproduzione inline
    if (openInModal && (video.source_type === 'file' || fallbackLocalPath)) {
      setIsModalOpen(true);
      return;
    }

    // Per video file, usa il player nativo
    if (video.source_type === 'file' && video.file_name) {
      const el = videoRef.current;
      if (el) {
        try {
          el.muted = false;
          setIsLoading(true);
          setIsPlaying(true);
          await el.play();
          setIsLoading(false);
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
            setIsLoading(false);
            return;
          } catch (err2) {
            console.error('[VideoPlayer] secondo tentativo fallito', err2);
            setIsLoading(false);
            setIsPlaying(false);
            if (nativeSrc) {
              window.open(nativeSrc, '_blank');
              return;
            }
          }
        }
      }
      return;
    }

    // Per video YouTube
    if (video.source_type === 'youtube' && video.youtube_video_id) {
      console.log('[VideoPlayer] Tentativo play YouTube - Safari Mobile:', isSafariMobile, 'API Ready:', isYouTubeReady, 'Timeout:', youTubeHasTimeout);
      
      // Su Safari Mobile o se l'API ha problemi, apri direttamente YouTube
      if (isSafariMobile || youTubeHasTimeout || !isYouTubeReady) {
        console.log('[VideoPlayer] Apertura diretta YouTube per Safari Mobile o fallback');
        const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
        window.open(youtubeUrl, '_blank');
        return;
      }

      setIsLoading(true);
      
      // Timeout per il loading
      const loadingTimeoutId = setTimeout(() => {
        console.warn('[VideoPlayer] Timeout loading YouTube, fallback a apertura diretta');
        setIsLoading(false);
        setLoadingTimeout(true);
        const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
        window.open(youtubeUrl, '_blank');
      }, 8000);

      if (isYouTubeReady && youtubeContainerRef.current && !youtubePlayerRef.current) {
        console.log('[VideoPlayer] Creazione YouTube player inline');
        try {
          youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
            height: '100%',
            width: '100%',
            videoId: video.youtube_video_id,
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 0,
              playsinline: 1,
              enablejsapi: 1,
              hl: 'it',
              origin: window.location.origin,
              iv_load_policy: 3,
              disablekb: 1
            },
            events: {
              onReady: (event: any) => {
                console.log('[VideoPlayer] YouTube onReady');
                clearTimeout(loadingTimeoutId);
                event.target.playVideo();
              },
              onStateChange: (event: any) => {
                console.log('[VideoPlayer] YouTube onStateChange:', event.data);
                if (event.data === window.YT.PlayerState.PLAYING) {
                  clearTimeout(loadingTimeoutId);
                  setIsLoading(false);
                  setIsPlaying(true);
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  setIsLoading(true);
                } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  setIsLoading(false);
                }
              },
              onError: (event: any) => {
                console.error('[VideoPlayer] YouTube onError:', event.data);
                clearTimeout(loadingTimeoutId);
                setIsPlaying(false);
                setIsLoading(false);
                // Fallback a apertura diretta in caso di errore
                const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
                window.open(youtubeUrl, '_blank');
              }
            }
          });
        } catch (error) {
          console.error('[VideoPlayer] Errore creazione YouTube player:', error);
          clearTimeout(loadingTimeoutId);
          setIsPlaying(false);
          setIsLoading(false);
          // Fallback a apertura diretta
          const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
          window.open(youtubeUrl, '_blank');
        }
      } else if (youtubePlayerRef.current) {
        console.log('[VideoPlayer] Riproduci video YouTube esistente');
        clearTimeout(loadingTimeoutId);
        youtubePlayerRef.current.playVideo();
      } else {
        console.warn('[VideoPlayer] YouTube API non pronta, fallback a apertura diretta');
        clearTimeout(loadingTimeoutId);
        setIsLoading(false);
        const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
        window.open(youtubeUrl, '_blank');
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
    <>
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
            zIndex: 10
          }}
        />
      )}

      {/* Overlay e UI di anteprima */}
      {!isPlaying && (
        <>
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500" 
            style={{ 
              zIndex: 20,
              opacity: isLoading ? 0.5 : 1
            }}
          >
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

          <div 
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300" 
            onClick={!isLoading ? handlePlay : undefined} 
            style={{ 
              zIndex: 30,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            <div className={`bg-white/90 hover:bg-white rounded-full p-6 transition-all duration-300 group-hover:scale-110 shadow-xl border-2 border-white/20 ${isLoading ? 'animate-pulse' : ''}`}>
              <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
            </div>
            
            {/* Messaggio per Safari Mobile */}
            {isSafariMobile && video.source_type === 'youtube' && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded whitespace-nowrap">
                Tocca per aprire su YouTube
              </div>
            )}
            
            {/* Fallback message per timeout */}
            {(loadingTimeout || youTubeHasTimeout) && video.source_type === 'youtube' && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded whitespace-nowrap">
                Tocca per aprire su YouTube
              </div>
            )}
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

      {/* Video Modal */}
      {openInModal && (
        <VideoModal
          video={video}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fallbackLocalPath={fallbackLocalPath}
        />
      )}
    </>
  );
};

export default VideoPlayer;