import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadPublicImage(bucket: string, folder: string, file: File) {
  if (!SAFE_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, or GIF image.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${randomPart}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
