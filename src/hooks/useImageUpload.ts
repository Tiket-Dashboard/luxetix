import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, folder: string = "concerts"): Promise<string | null> => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return null;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Ukuran file maksimal 5MB");
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      setProgress(30);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("concert-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setProgress(80);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("concert-images")
        .getPublicUrl(data.path);

      setProgress(100);
      toast.success("Gambar berhasil diupload!");

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Gagal mengupload gambar", { description: error.message });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex((p) => p === "concert-images");
      if (bucketIndex === -1) return false;

      const filePath = pathParts.slice(bucketIndex + 1).join("/");

      const { error } = await supabase.storage
        .from("concert-images")
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
  };
};
