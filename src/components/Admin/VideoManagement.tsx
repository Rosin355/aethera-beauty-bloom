import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Trash2, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";
import { uploadVideo, deleteVideo, getVideoUrl, checkVideoExists } from "@/lib/videoStorage";

const VideoManagement = () => {
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFull, setUploadingFull] = useState(false);
  const [previewExists, setPreviewExists] = useState(false);
  const [fullExists, setFullExists] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ preview: 0, full: 0 });
  const [uploadError, setUploadError] = useState({ preview: '', full: '' });
  const { toast } = useToast();

  useEffect(() => {
    checkVideos();
  }, []);

  const checkVideos = async () => {
    const previewCheck = await checkVideoExists('video-anteprima.mp4');
    const fullCheck = await checkVideoExists('video-completo.mp4');
    setPreviewExists(previewCheck);
    setFullExists(fullCheck);
  };

  const handleVideoUpload = async (file: File, isPreview: boolean) => {
    const fileName = isPreview ? 'video-anteprima.mp4' : 'video-completo.mp4';
    const setUploading = isPreview ? setUploadingPreview : setUploadingFull;
    const progressKey = isPreview ? 'preview' : 'full';
    const errorKey = isPreview ? 'preview' : 'full';
    
    // Reset error state
    setUploadError(prev => ({ ...prev, [errorKey]: '' }));
    
    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
    
    // Interval declared outside to ensure cleanup
    let progressInterval: number | undefined;
    try {
      // Enhanced progress simulation with time estimates
      const startTime = Date.now();
      const fileSize = file.size;
      const estimatedUploadTimeMs = Math.max(fileSize / (2 * 1024 * 1024), 3000); // Rough estimate: 2MB/s min 3s
      
      progressInterval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercentage = Math.min((elapsed / estimatedUploadTimeMs) * 85, 85);
        
        setUploadProgress(prev => ({
          ...prev,
          [progressKey]: progressPercentage
        }));
      }, 200);

      // Call upload (finalization depends on server)
      const url = await uploadVideo(file, fileName);
      
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      toast({
        title: "Successo",
        description: `Video ${isPreview ? 'anteprima' : 'completo'} caricato con successo!`,
      });
      checkVideos();
      
      // Reset progress after success
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      }, 2000);
      
    } catch (error: any) {
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      const errorMsg = error?.message || 'Errore sconosciuto durante il caricamento';
      setUploadError(prev => ({ ...prev, [errorKey]: errorMsg }));
      toast({
        title: "Errore caricamento",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploading(false);
    }
  };

  const handleVideoDelete = async (isPreview: boolean) => {
    const fileName = isPreview ? 'video-anteprima.mp4' : 'video-completo.mp4';
    
    try {
      const success = await deleteVideo(fileName);
      if (success) {
        toast({
          title: "Successo",
          description: `Video ${isPreview ? 'anteprima' : 'completo'} eliminato con successo!`,
        });
        checkVideos();
      } else {
        throw new Error('Eliminazione fallita');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: `Errore durante l'eliminazione del video: ${error}`,
        variant: "destructive",
      });
    }
  };

  const VideoCard = ({ 
    title, 
    fileName, 
    exists, 
    isUploading, 
    progress,
    error,
    onUpload, 
    onDelete 
  }: {
    title: string;
    fileName: string;
    exists: boolean;
    isUploading: boolean;
    progress: number;
    error: string;
    onUpload: (file: File) => void;
    onDelete: () => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`} />
          {exists ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              Video presente
            </span>
          ) : (
            'Video mancante'
          )}
        </div>
        
        {exists && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getVideoUrl(fileName), '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizza
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`video-${fileName}`}>
            {exists ? 'Sostituisci video' : 'Carica video'}
          </Label>
          <Input
            id={`video-${fileName}`}
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
                e.target.value = '';
              }
            }}
            disabled={isUploading}
          />
          
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Upload className="w-4 h-4 animate-spin" />
                  Caricamento in corso...
                </div>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress < 20 && "Preparazione upload..."}
                  {progress >= 20 && progress < 50 && "Invio dati..."}
                  {progress >= 50 && progress < 85 && "Upload in corso..."}
                  {progress >= 85 && progress < 100 && "Finalizzazione (potrebbe richiedere alcuni minuti)..."}
                  {progress === 100 && "Completato!"}
                </span>
                <span>
                  {progress < 85 && "Tempo stimato: " + Math.max(1, Math.round((100 - progress) / 8)) + "s"}
                  {progress >= 85 && progress < 100 && "In attesa del server..."}
                  {progress === 100 && "✓ Fatto"}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestione Video</h2>
        <Button onClick={checkVideos} variant="outline">
          Aggiorna stato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VideoCard
          title="Video Anteprima"
          fileName="video-anteprima.mp4"
          exists={previewExists}
          isUploading={uploadingPreview}
          progress={uploadProgress.preview}
          error={uploadError.preview}
          onUpload={(file) => handleVideoUpload(file, true)}
          onDelete={() => handleVideoDelete(true)}
        />
        
        <VideoCard
          title="Video Completo"
          fileName="video-completo.mp4"
          exists={fullExists}
          isUploading={uploadingFull}
          progress={uploadProgress.full}
          error={uploadError.full}
          onUpload={(file) => handleVideoUpload(file, false)}
          onDelete={() => handleVideoDelete(false)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• I video vengono serviti tramite Supabase Storage per migliori performance</p>
          <p>• Formato consigliato: MP4 con codec H.264</p>
          <p>• Dimensione massima consentita: 400MB per video (upload chunked)</p>
          <p>• Upload resumable: puoi interrompere e riprendere il caricamento</p>
          <p>• I video sono pubblicamente accessibili una volta caricati</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;