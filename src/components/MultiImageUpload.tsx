import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  bucket?: string;
}

export function MultiImageUpload({
  images,
  onChange,
  maxImages = 4,
  bucket = "product-images",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState<number | null>(null);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(slotIndex);
      const ext = file.name.split(".").pop();
      const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const newImages = [...images];
      newImages[slotIndex] = data.publicUrl;
      onChange(newImages);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
      // reset input so same file can be re-selected
      event.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const slots = Array.from({ length: maxImages });

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Upload up to {maxImages} images. First image is the primary display.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((_, slotIdx) => {
          const url = images[slotIdx];
          const isUploading = uploading === slotIdx;
          const isPrimary = slotIdx === 0;

          return (
            <div key={slotIdx} className="relative group aspect-square">
              {url ? (
                <>
                  <img
                    src={url}
                    alt={`Image ${slotIdx + 1}`}
                    className={cn(
                      "w-full h-full object-cover rounded-xl border",
                      isPrimary
                        ? "border-[#FF5A00]"
                        : "border-zinc-700"
                    )}
                  />
                  {isPrimary && (
                    <div className="absolute top-1 left-1 bg-[#FF5A00] text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" /> Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(slotIdx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Re-upload overlay */}
                  <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-xs text-white font-bold">
                      Replace
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleUpload(e, slotIdx)}
                    />
                  </label>
                </>
              ) : (
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                    slotIdx < images.length
                      ? "border-zinc-600 bg-zinc-800/30 hover:bg-zinc-800/60"
                      : images.length === slotIdx
                      ? "border-[#FF5A00]/40 bg-[#FF5A00]/5 hover:bg-[#FF5A00]/10"
                      : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/30"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-[#FF5A00] animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Plus className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">
                        {isPrimary ? "Main" : `Img ${slotIdx + 1}`}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploading !== null}
                    onChange={(e) => handleUpload(e, slotIdx)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
