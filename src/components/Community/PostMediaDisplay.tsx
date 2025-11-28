import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";

interface PostMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
}

interface PostMediaDisplayProps {
  media: PostMedia[];
  compact?: boolean;
}

export function PostMediaDisplay({ media, compact = false }: PostMediaDisplayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const images = media.filter(m => m.media_type === "image");
  const videos = media.filter(m => m.media_type === "video_embed");

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Compact view for post list
  if (compact) {
    const totalMedia = media.length;
    const previewMedia = media.slice(0, 3);
    const remaining = totalMedia - 3;

    return (
      <div className="mt-3">
        <div className={`grid gap-2 ${
          previewMedia.length === 1 ? "grid-cols-1" : 
          previewMedia.length === 2 ? "grid-cols-2" : 
          "grid-cols-3"
        }`}>
          {previewMedia.map((item, index) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-lg bg-muted cursor-pointer ${
                previewMedia.length === 1 ? "aspect-video" : "aspect-square"
              }`}
              onClick={() => item.media_type === "image" && openLightbox(images.findIndex(i => i.id === item.id))}
            >
              {item.media_type === "image" ? (
                <img
                  src={item.media_url}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}
              {index === 2 && remaining > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">+{remaining}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black border-none">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              <img
                src={images[currentIndex]?.media_url}
                alt=""
                className="w-full max-h-[80vh] object-contain"
              />

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? "bg-white w-4" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full view for post detail page
  return (
    <div className="space-y-4">
      {/* Images Gallery */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${
          images.length === 1 ? "grid-cols-1" : 
          images.length === 2 ? "grid-cols-2" : 
          images.length <= 4 ? "grid-cols-2" :
          "grid-cols-3"
        }`}>
          {images.map((item, index) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-lg bg-muted cursor-pointer ${
                images.length === 1 ? "aspect-video max-h-96" : "aspect-square"
              }`}
              onClick={() => openLightbox(index)}
            >
              <img
                src={item.media_url}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      {/* Video Embeds */}
      {videos.map((video) => (
        <div key={video.id} className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={video.media_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ))}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <img
              src={images[currentIndex]?.media_url}
              alt=""
              className="w-full max-h-[80vh] object-contain"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
