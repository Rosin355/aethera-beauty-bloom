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

export const uploadVideo = async (file: File, fileName: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    return getVideoUrl(fileName);
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
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