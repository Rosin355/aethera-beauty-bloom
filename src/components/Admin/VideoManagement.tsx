import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Trash2, Eye } from "lucide-react";
import { uploadVideo, deleteVideo, getVideoUrl, checkVideoExists } from "@/lib/videoStorage";

const VideoManagement = () => {
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFull, setUploadingFull] = useState(false);
  const [previewExists, setPreviewExists] = useState(false);
  const [fullExists, setFullExists] = useState(false);
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
    
    setUploading(true);
    try {
      const url = await uploadVideo(file, fileName);
      if (url) {
        toast({
          title: "Successo",
          description: `Video ${isPreview ? 'anteprima' : 'completo'} caricato con successo!`,
        });
        checkVideos();
      } else {
        throw new Error('Upload fallito');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: `Errore durante il caricamento del video: ${error}`,
        variant: "destructive",
      });
    } finally {
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
    onUpload, 
    onDelete 
  }: {
    title: string;
    fileName: string;
    exists: boolean;
    isUploading: boolean;
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
          {exists ? 'Video presente' : 'Video mancante'}
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
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="w-4 h-4 animate-spin" />
              Caricamento in corso...
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
          onUpload={(file) => handleVideoUpload(file, true)}
          onDelete={() => handleVideoDelete(true)}
        />
        
        <VideoCard
          title="Video Completo"
          fileName="video-completo.mp4"
          exists={fullExists}
          isUploading={uploadingFull}
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
          <p>• Dimensione massima consigliata: 100MB per video</p>
          <p>• I video sono pubblicamente accessibili una volta caricati</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;