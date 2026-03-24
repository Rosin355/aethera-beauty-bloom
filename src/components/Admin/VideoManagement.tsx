import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload, Play, Info, Youtube, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadVideo, deleteVideo, checkVideoExists, getVideoUrl } from '@/lib/videoStorage';
import { 
  getSiteVideo, 
  upsertSiteVideo, 
  deleteSiteVideo, 
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  type SiteVideo 
} from '@/lib/siteVideos';

interface VideoCardProps {
  title: string;
  video: SiteVideo | null;
  isUploading: boolean;
  progress: number;
  error?: string;
  onUpload: (file: File) => void;
  onYouTubeSubmit: (url: string, thumbnail?: File | null) => void;
  onDelete: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  video,
  isUploading,
  progress,
  error,
  onUpload,
  onYouTubeSubmit,
  onDelete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'file' | 'youtube'>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (400MB = 419,430,400 bytes)
      if (file.size > 419430400) {
        alert('Il file è troppo grande. La dimensione massima consentita è 400MB.');
        return;
      }
      
      // Check file type
      if (!file.type.includes('video/')) {
        alert('Seleziona un file video valido.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      // Reset the input
      const input = document.querySelector(`input[type="file"]`) as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleYouTubeUpload = () => {
    if (youtubeUrl.trim()) {
      onYouTubeSubmit(youtubeUrl.trim(), thumbnailFile);
      setYoutubeUrl('');
      setThumbnailFile(null);
    }
  };

  const handleView = () => {
    if (!video) return;
    
    if (video.source_type === 'youtube' && video.youtube_video_id) {
      window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, '_blank');
    } else if (video.source_type === 'file' && video.file_name) {
      const videoUrl = getVideoUrl(video.file_name);
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Gestisci il {title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${video ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            {video ? (
              <span className="flex items-center gap-2">
                {video.source_type === 'youtube' ? (
                  <>
                    <Youtube className="h-4 w-4" />
                    Video YouTube presente
                  </>
                ) : (
                  <>Video file presente</>
                )}
              </span>
            ) : (
              'Nessun video configurato'
            )}
          </span>
        </div>

        {/* Actions for existing video */}
        {video && !isUploading && (
          <div className="flex gap-2">
            <Button onClick={handleView} size="sm" variant="outline">
              {video.source_type === 'youtube' ? (
                <ExternalLink className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Visualizza
            </Button>
            <Button onClick={onDelete} size="sm" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          </div>
        )}

        {/* Source type selector */}
        {!isUploading && (
          <div className="space-y-2">
            <Label>Tipo di sorgente</Label>
            <Select value={sourceType} onValueChange={(value: 'file' | 'youtube') => setSourceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">File (Supabase)</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* File upload section */}
        {!isUploading && sourceType === 'file' && (
          <div className="space-y-2">
            <Label htmlFor={`video-file-${title}`}>
              {video?.source_type === 'file' ? 'Sostituisci video' : 'Carica nuovo video'}
            </Label>
            <Input
              id={`video-file-${title}`}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{selectedFile.name}</span>
                <Button onClick={handleUpload} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Carica
                </Button>
              </div>
            )}
          </div>
        )}

        {/* YouTube URL section */}
        {!isUploading && sourceType === 'youtube' && (
          <div className="space-y-2">
            <Label htmlFor={`youtube-${title}`}>URL YouTube</Label>
            <div className="flex gap-2">
              <Input
                id={`youtube-${title}`}
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <Button 
                onClick={handleYouTubeUpload} 
                size="sm" 
                disabled={!youtubeUrl.trim()}
              >
                <Youtube className="h-4 w-4 mr-2" />
                Salva
              </Button>
            </div>
            {/* Thumbnail Upload for YouTube */}
            <div className="mt-2">
              <Label htmlFor={`thumbnail-${title}`}>Thumbnail personalizzata (opzionale)</Label>
              <Input
                id={`thumbnail-${title}`}
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {thumbnailFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  File selezionato: {thumbnailFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Caricamento in corso...</span>
            </div>
            <Progress value={progress} className="w-full" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const VideoManagement = () => {
  const [previewVideo, setPreviewVideo] = useState<SiteVideo | null>(null);
  const [fullVideo, setFullVideo] = useState<SiteVideo | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const getErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : 'Errore sconosciuto';
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const preview = await getSiteVideo('preview');
    const full = await getSiteVideo('full');
    
    setPreviewVideo(preview);
    setFullVideo(full);
  };

  const handleVideoUpload = async (file: File, isPreview: boolean) => {
    const videoKey = isPreview ? 'preview' : 'full';
    const fileName = isPreview ? 'video-anteprima.mp4' : 'video-completo.mp4';
    
    // Reset previous errors
    setUploadErrors(prev => ({ ...prev, [videoKey]: '' }));
    setIsUploading(prev => ({ ...prev, [videoKey]: true }));
    setUploadProgress(prev => ({ ...prev, [videoKey]: 0 }));

    try {
      const url = await uploadVideo(file, fileName, (progress) => {
        setUploadProgress(prev => ({ ...prev, [videoKey]: progress }));
      });

      if (url) {
        // Save to site_videos table
        await upsertSiteVideo({
          video_type: isPreview ? 'preview' : 'full',
          source_type: 'file',
          file_name: fileName,
          youtube_url: null,
          youtube_video_id: null
        });

        toast({
          title: "Successo",
          description: `Video ${isPreview ? 'anteprima' : 'completo'} caricato con successo!`,
        });
        
        // Reload videos
        await loadVideos();
      } else {
        throw new Error('Upload fallito');
      }
    } catch (error: unknown) {
      console.error('Errore upload:', error);
      const errorMessage = getErrorMessage(error);
      setUploadErrors(prev => ({ ...prev, [videoKey]: errorMessage }));
      
      toast({
        variant: "destructive",
        title: "Errore",
        description: `Errore durante il caricamento: ${errorMessage}`,
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [videoKey]: false }));
      setUploadProgress(prev => ({ ...prev, [videoKey]: 0 }));
    }
  };

  const handleYouTubeSubmit = async (url: string, thumbnailFile: File | null, isPreview: boolean) => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "URL YouTube non valido. Inserisci un link valido di YouTube.",
      });
      return;
    }

    let thumbnailUrl = null;
    
    // Se c'è un file thumbnail, caricalo
    if (thumbnailFile) {
      try {
        const fileName = `thumbnail-${isPreview ? 'preview' : 'full'}-${Date.now()}.${thumbnailFile.name.split('.').pop()}`;
        const thumbnailUploadUrl = await uploadVideo(thumbnailFile, fileName, () => {});
        thumbnailUrl = thumbnailUploadUrl;
      } catch (error) {
        console.error('Errore upload thumbnail:', error);
        toast({
          variant: "destructive",
          title: "Avviso",
          description: "Errore durante il caricamento della thumbnail, ma il video è stato salvato.",
        });
      }
    }

    try {
      await upsertSiteVideo({
        video_type: isPreview ? 'preview' : 'full',
        source_type: 'youtube',
        file_name: null,
        youtube_url: url,
        youtube_video_id: videoId,
        thumbnail_url: thumbnailUrl
      });

      toast({
        title: "Successo",
        description: `Video YouTube ${isPreview ? 'anteprima' : 'completo'} salvato con successo!`,
      });

      await loadVideos();
    } catch (error: unknown) {
      console.error('Errore YouTube:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore durante il salvataggio del video YouTube",
      });
    }
  };

  const handleVideoDelete = async (isPreview: boolean) => {
    const videoType = isPreview ? 'anteprima' : 'completo';
    const currentVideo = isPreview ? previewVideo : fullVideo;
    
    try {
      // Delete from site_videos table
      const success = await deleteSiteVideo(isPreview ? 'preview' : 'full');
      
      // If it was a file, also delete from storage
      if (success && currentVideo?.source_type === 'file' && currentVideo.file_name) {
        await deleteVideo(currentVideo.file_name);
      }
      
      if (success) {
        toast({
          title: "Successo",
          description: `Video ${videoType} eliminato con successo!`,
        });
        
        await loadVideos();
      } else {
        throw new Error('Eliminazione fallita');
      }
    } catch (error: unknown) {
      console.error('Errore eliminazione:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: `Errore durante l'eliminazione: ${getErrorMessage(error)}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestione Video</h2>
          <p className="text-muted-foreground">
            Carica video locali o configura video YouTube per la piattaforma
          </p>
        </div>
        <Button onClick={loadVideos} variant="outline">
          Aggiorna
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VideoCard
          title="Video Anteprima"
          video={previewVideo}
          isUploading={isUploading.preview || false}
          progress={uploadProgress.preview || 0}
          error={uploadErrors.preview}
          onUpload={(file) => handleVideoUpload(file, true)}
          onYouTubeSubmit={(url, thumbnailFile) => handleYouTubeSubmit(url, thumbnailFile, true)}
          onDelete={() => handleVideoDelete(true)}
        />

        <VideoCard
          title="Video Completo"
          video={fullVideo}
          isUploading={isUploading.full || false}
          progress={uploadProgress.full || 0}
          error={uploadErrors.full}
          onUpload={(file) => handleVideoUpload(file, false)}
          onYouTubeSubmit={(url, thumbnailFile) => handleYouTubeSubmit(url, thumbnailFile, false)}
          onDelete={() => handleVideoDelete(false)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="space-y-1">
            <h4 className="font-medium text-foreground">Caricamento File:</h4>
            <p>• Formato consigliato: MP4 con codec H.264 per la migliore compatibilità</p>
            <p>• Dimensione massima: 400MB per video (upload resumable supportato)</p>
            <p>• Upload chunked con TUS per migliore affidabilità</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-foreground">Video YouTube:</h4>
            <p>• Inserisci l'URL completo del video YouTube</p>
            <p>• Formati supportati: watch?v=, youtu.be/, embed/</p>
            <p>• I video YouTube non hanno limiti di dimensione</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-foreground">Generale:</h4>
            <p>• I video configurati sono accessibili ai tuoi utenti nella sezione Formazione</p>
            <p>• È possibile avere un video anteprima e un video completo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;
