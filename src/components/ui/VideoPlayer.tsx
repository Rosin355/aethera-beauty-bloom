import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { SiteVideo, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/siteVideos';
import { getVideoUrl } from '@/lib/videoStorage';

interface VideoPlayerProps {
  video: SiteVideo;
  className?: string;
  autoPlay?: boolean;
}

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

  // Se non è in riproduzione, mostra la thumbnail con il pulsante play
  if (!isPlaying && thumbnailUrl) {
    return (
      <div className={`relative cursor-pointer group ${className}`}>
        {/* Thumbnail */}
        <div className="w-full h-full bg-gray-900 overflow-hidden rounded-lg">
          <img 
            src={thumbnailUrl} 
            alt="Video thumbnail"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback se l'immagine non si carica
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        {/* Overlay scuro */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300 rounded-lg" />
        
        {/* Pulsante Play */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={handlePlay}
        >
          <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all duration-300 group-hover:scale-110 shadow-lg">
            <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Gradiente bottom per branding */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg" />
      </div>
    );
  }

  // Video in riproduzione
  return (
    <div className={`relative ${className}`}>
      {video.source_type === 'youtube' && video.youtube_video_id ? (
        <iframe
          src={getYouTubeEmbedUrl(video.youtube_video_id)}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video"
          style={{ backgroundColor: '#000' }}
        />
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