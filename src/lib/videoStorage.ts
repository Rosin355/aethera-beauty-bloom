import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionUrl, getSupabasePublishableKey } from "@/lib/supabaseConfig";
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

    const uploadEndpoint = getEdgeFunctionUrl("video-upload", { mode: "subdomain" });
    const apiKey = getSupabasePublishableKey();

    // Use TUS for chunked resumable upload
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: uploadEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        metadata: {
          filename: fileName,
          filetype: file.type,
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': apiKey,
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
              `${uploadEndpoint}?finalize=true&id=${upload.url?.split('/').pop()}&filename=${encodeURIComponent(fileName)}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'apikey': apiKey,
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

  } catch (error) {
    console.error('Error uploading video:', error);
    throw error instanceof Error ? error : new Error("Errore sconosciuto durante il caricamento video");
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
