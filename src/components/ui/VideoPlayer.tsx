import React, { useState } from 'react';
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

  const handlePlay = () => {
    if (video.source_type === 'file' && video.file_name) {
      setIsPlaying(true);
      return;
    }
    if (video.source_type === 'youtube') {
      if (fallbackLocalPath) {
        setIsPlaying(true); // userà il fallback locale nel player nativo
        return;
      }
      if (video.youtube_video_id) {
        window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, '_blank');
        return;
      }
    }
  };

  const thumbnailUrl = getThumbnailUrl();

  // Se è in riproduzione e abbiamo una sorgente file (reale o fallback), usa il player nativo HTML5
  if (isPlaying) {
    let src: string | null = null;
    if (video.source_type === 'file' && video.file_name) {
      src = getVideoUrl(video.file_name);
    } else if (video.source_type === 'youtube' && fallbackLocalPath) {
      src = fallbackLocalPath; // usa il file locale come fallback
    }

    if (src) {
      return (
        <div className={`relative ${className}`}>
          <video
            controls
            preload="metadata"
            className="w-full h-full rounded-lg"
            style={{ backgroundColor: '#000' }}
            playsInline
            muted
            poster={thumbnailUrl || undefined}
            autoPlay
          >
            <source src={src} type="video/mp4" />
            Il tuo browser non supporta il tag video.
          </video>
        </div>
      );
    }
  }

  // Altrimenti, mostra la thumbnail con overlay e bottone play
  return (
    <div className={`relative cursor-pointer group ${className}`}>
      {/* Thumbnail */}
      <div className="w-full h-full bg-gray-900 overflow-hidden rounded-lg">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback se l'immagine non si carica
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          // Thumbnail di fallback con gradiente
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-center text-white/80">
              <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Video disponibile</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay scuro */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 rounded-lg" />
      
      {/* Pulsante Play */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        onClick={handlePlay}
      >
        <div className="bg-white/90 hover:bg-white rounded-full p-6 transition-all duration-300 group-hover:scale-110 shadow-xl border-2 border-white/20">
          <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Gradiente bottom per branding */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg" />
      
      {/* Logo brand */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-white text-sm font-medium">4 Elementi Italia</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;