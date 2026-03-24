import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Image, Video, X, Upload, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaItem {
  type: "image" | "video_embed";
  url: string;
  file?: File;
  thumbnailUrl?: string;
}

interface PostMediaUploaderProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  maxImages?: number;
}

export function PostMediaUploader({ media, onMediaChange, maxImages = 5 }: PostMediaUploaderProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageCount = media.filter(m => m.type === "image").length;
    const remainingSlots = maxImages - imageCount;

    if (remainingSlots <= 0) {
      toast({
        title: "Limite raggiunto",
        description: `Puoi caricare massimo ${maxImages} immagini per post`,
        variant: "destructive",
      });
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newMedia: MediaItem[] = [];

    for (const file of filesToAdd) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: `${file.name} supera il limite di 5MB`,
          variant: "destructive",
        });
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newMedia.push({
        type: "image",
        url: previewUrl,
        file: file,
      });
    }

    onMediaChange([...media, ...newMedia]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const extractVideoId = (url: string): { platform: string; id: string } | null => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    if (youtubeMatch) {
      return { platform: "youtube", id: youtubeMatch[1] };
    }

    // Instagram - simplified match
    const instagramMatch = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (instagramMatch) {
      return { platform: "instagram", id: instagramMatch[1] };
    }

    return null;
  };

  const addVideoEmbed = () => {
    if (!videoUrl.trim()) return;

    const videoInfo = extractVideoId(videoUrl);
    if (!videoInfo) {
      toast({
        title: "URL non valido",
        description: "Inserisci un link YouTube o Instagram valido",
        variant: "destructive",
      });
      return;
    }

    let embedUrl = "";
    let thumbnailUrl = "";

    if (videoInfo.platform === "youtube") {
      embedUrl = `https://www.youtube.com/embed/${videoInfo.id}`;
      thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`;
    } else if (videoInfo.platform === "instagram") {
      embedUrl = `https://www.instagram.com/p/${videoInfo.id}/embed`;
    }

    const newMedia: MediaItem = {
      type: "video_embed",
      url: embedUrl,
      thumbnailUrl,
    };

    onMediaChange([...media, newMedia]);
    setVideoUrl("");
  };

  const removeMedia = (index: number) => {
    const item = media[index];
    // Revoke object URL if it's a local preview
    if (item.type === "image" && item.file) {
      URL.revokeObjectURL(item.url);
    }
    onMediaChange(media.filter((_, i) => i !== index));
  };

  const imageCount = media.filter(m => m.type === "image").length;

  return (
    <div className="space-y-4">
      <Label>Media (opzionale)</Label>
      
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="gap-2">
            <Image className="h-4 w-4" />
            Immagini ({imageCount}/{maxImages})
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageCount >= maxImages}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Carica immagini (max 5MB ciascuna)
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="video" className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Incolla link YouTube o Instagram..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addVideoEmbed}
              disabled={!videoUrl.trim()}
            >
              <Link className="h-4 w-4 mr-2" />
              Aggiungi
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supportati: YouTube, Instagram Reels/Post
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {media.map((item, index) => (
            <Card key={index} className="relative group overflow-hidden aspect-video">
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
