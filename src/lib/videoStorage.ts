import { supabase } from "@/integrations/supabase/client";

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
    // Validate file size (400MB limit)
    const maxSize = 400 * 1024 * 1024; // 400MB
    if (file.size > maxSize) {
      throw new Error('Il file supera la dimensione massima di 400MB');
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('Formato file non supportato. Utilizzare MP4, MOV, AVI o altri formati video');
    }

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      // Handle specific Supabase errors
      if (error.message?.includes('exceeded the maximum allowed size')) {
        throw new Error('File troppo grande per il server. Comprimere il video o ridurne la dimensione');
      }
      if (error.message?.includes('not allowed')) {
        throw new Error('Formato file non permesso. Utilizzare MP4, MOV, AVI o WebM');
      }
      throw new Error(`Errore durante il caricamento: ${error.message}`);
    }
    
    return getVideoUrl(fileName);
  } catch (error: any) {
    console.error('Error uploading video:', error);
    throw error; // Re-throw to let the component handle the error display
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