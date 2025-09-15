import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

export const getVideoUrl = (fileName: string): string => {
  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

export const checkVideoExists = async (fileName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .list('', { search: fileName });
    
    if (error) return false;
    return data?.some(file => file.name === fileName) || false;
  } catch {
    return false;
  }
};

export const uploadVideo = async (
  file: File, 
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    // Validate file size (now supports up to 400MB with chunked upload)
    const maxSize = 400 * 1024 * 1024; // 400MB
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    
    if (file.size > maxSize) {
      throw new Error(`Il file è troppo grande (${fileSizeMB}MB). La dimensione massima consentita è 400MB.`);
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('Formato file non supportato. Utilizzare MP4, MOV, AVI o altri formati video');
    }

    // Get current user session for auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Devi essere autenticato per caricare video');
    }

    // Use TUS for chunked resumable upload
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${window.location.origin}/functions/v1/video-upload`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        metadata: {
          filename: fileName,
          filetype: file.type,
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmV3b2dqbmNhb3Njcm5scXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDYyOTEsImV4cCI6MjA3MDE4MjI5MX0.a47M0UR_QBAHoBGV5iIxwoGB4JgkhWPLew0hsjfOZdI',
        },
        onError: (error: Error) => {
          console.error('TUS Upload error:', error);
          if (error.message.includes('413')) {
            reject(new Error(`File troppo grande (${fileSizeMB}MB). Comprimi il video prima di caricarlo.`));
          } else if (error.message.includes('not allowed')) {
            reject(new Error('Formato file non permesso. Utilizzare MP4, MOV, AVI o WebM'));
          } else {
            reject(new Error(`Errore durante il caricamento: ${error.message}`));
          }
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          if (onProgress) {
            onProgress(percentage);
          }
        },
        onSuccess: async () => {
          try {
            // Finalize the upload
            const finalizeResponse = await fetch(
              `${window.location.origin}/functions/v1/video-upload?finalize=true&id=${upload.url?.split('/').pop()}&filename=${fileName}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmV3b2dqbmNhb3Njcm5scXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDYyOTEsImV4cCI6MjA3MDE4MjI5MX0.a47M0UR_QBAHoBGV5iIxwoGB4JgkhWPLew0hsjfOZdI',
                }
              }
            );

            if (!finalizeResponse.ok) {
              throw new Error('Errore durante la finalizzazione del caricamento');
            }

            // Wait a moment for the file to be assembled
            setTimeout(() => {
              resolve(getVideoUrl(fileName));
            }, 2000);
          } catch (error) {
            reject(error);
          }
        },
      });

      // Start the upload
      upload.start();
    });

  } catch (error: any) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const deleteVideo = async (fileName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('videos')
      .remove([fileName]);
    
    return !error;
  } catch {
    return false;
  }
};