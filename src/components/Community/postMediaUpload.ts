import { supabase } from "@/integrations/supabase/client";

type UploadMediaItem = {
  type: "image" | "video_embed";
  url: string;
  file?: File;
  thumbnailUrl?: string;
};

type UploadedMedia = {
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
};

export async function uploadPostMedia(
  postId: string,
  userId: string,
  media: UploadMediaItem[],
): Promise<{ success: boolean; uploadedMedia: UploadedMedia[] }> {
  const uploadedMedia: UploadedMedia[] = [];

  for (let i = 0; i < media.length; i++) {
    const item = media[i];

    if (item.type === "image" && item.file) {
      const fileExt = item.file.name.split(".").pop();
      const fileName = `${userId}/${postId}/${Date.now()}-${i}.${fileExt}`;

      const { error } = await supabase.storage.from("forum-media").upload(fileName, item.file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Error uploading image:", error);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("forum-media").getPublicUrl(fileName);

      uploadedMedia.push({
        media_type: "image",
        media_url: publicUrl,
      });
    } else if (item.type === "video_embed") {
      uploadedMedia.push({
        media_type: "video_embed",
        media_url: item.url,
        thumbnail_url: item.thumbnailUrl,
      });
    }
  }

  return { success: true, uploadedMedia };
}
