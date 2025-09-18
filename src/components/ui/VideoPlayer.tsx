import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { SiteVideo, getYouTubeThumbnail } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
}

// Funzione per creare URL YouTube embed completamente nascosto
const getHiddenYouTubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    modestbranding: '1',    // Rimuove logo YouTube
    rel: '0',              // No video correlati
    showinfo: '0',         // Nascondi info video
    controls: '0',         // NASCONDI TUTTI I CONTROLLI
    fs: '0',               // Disabilita fullscreen
    disablekb: '1',        // Disabilita controlli tastiera
    enablejsapi: '0',      // Disabilita JS API
    iv_load_policy: '3',   // Nasconde annotazioni
    cc_load_policy: '0',   // Disabilita sottotitoli
    playsinline: '1',      // Inline su mobile
    autoplay: '1',         // Avvio automatico
    mute: '0',             // Non mutato
    origin: window.location.origin  // Per sicurezza
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  className = "", 
  autoPlay = false 
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
    setIsPlaying(true);
  };

  const thumbnailUrl = getThumbnailUrl();

  // SEMPRE mostra la thumbnail inizialmente (anche per YouTube)
  if (!isPlaying) {
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
                e.currentTarget.style.display = 'none';
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
        
        {/* Logo brand opzionale */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
            <span className="text-white text-sm font-medium">4 Elementi Italia</span>
          </div>
        </div>
      </div>
    );
  }

  // Video in riproduzione - con overlay per nascondere branding YouTube
  return (
    <div className={`relative ${className}`}>
      {video.source_type === 'youtube' && video.youtube_video_id ? (
        <div className="relative w-full h-full">
          {/* Player YouTube con controlli nascosti */}
          <iframe
            src={getHiddenYouTubeEmbedUrl(video.youtube_video_id)}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen={false}  // Disabilita fullscreen
            title="Video"
            style={{ backgroundColor: '#000' }}
            frameBorder="0"
          />
          
          {/* Overlay per nascondere eventuali branding residui */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/20 to-transparent pointer-events-none rounded-t-lg" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-lg" />
          
          {/* Controlli personalizzati minimi */}
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setIsPlaying(false)}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            >
              <Play className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      ) : video.source_type === 'file' && video.file_name ? (
        <video 
          controls 
          preload="metadata"
          className="w-full h-full rounded-lg"
          style={{ backgroundColor: '#000' }}
          autoPlay={autoPlay}
        >
          <source src={getVideoUrl(video.file_name)} type="video/mp4" />
          Il tuo browser non supporta il tag video.
        </video>
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center rounded-lg">
          <p className="text-white">Video non disponibile</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;