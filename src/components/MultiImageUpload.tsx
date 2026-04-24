import { useState } from "react";
import { Loader2, Star, X, Link2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { uploadPublicImage } from "@/lib/supabaseUpload";

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
  const [urlMode, setUrlMode] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploadError, setUploadError] = useState(false);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(slotIndex);
      setUploadError(false);
      const publicUrl = await uploadPublicImage(bucket, "menu", file);
      const newImages = [...images];
      newImages[slotIndex] = publicUrl;
      onChange(newImages);
      toast.success("Image uploaded");
    } catch (err: any) {
      setUploadError(true);
      toast.error(err.message || "Upload failed. Use 'Paste URL' instead.", { duration: 6000 });
      setUrlMode(slotIndex);
      setUrlInput("");
    } finally {
      setUploading(null);
      event.target.value = "";
    }
  };

  const handlePasteUrl = (slotIndex: number) => {
    const trimmed = urlInput.trim();
    if (!trimmed) return toast.error("Enter a valid image URL");
    try {
      new URL(trimmed);
    } catch {
      return toast.error("Invalid URL format");
    }
    const newImages = [...images];
    newImages[slotIndex] = trimmed;
    onChange(newImages);
    setUrlMode(null);
    setUrlInput("");
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    if (urlMode === index) setUrlMode(null);
  };

  const slots = Array.from({ length: maxImages });

  return (
    <div className="space-y-3">
      {uploadError && (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          Storage upload failed. Confirm the <code className="font-mono bg-amber-500/20 px-1 rounded">{bucket}</code> bucket exists,
          is public, and has admin upload policies, or use Paste URL below.
        </div>
      )}
      <p className="text-xs text-zinc-500">
        Up to {maxImages} images - first image is the main display
      </p>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((_, slotIdx) => {
          const url = images[slotIdx];
          const isUploading = uploading === slotIdx;
          const isPrimary = slotIdx === 0;
          const isUrlMode = urlMode === slotIdx;

          if (isUrlMode) {
            return (
              <div key={slotIdx} className="col-span-4 flex gap-2 items-center">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-zinc-950 border-zinc-700 h-9 flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handlePasteUrl(slotIdx)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handlePasteUrl(slotIdx)}
                  className="h-9 px-4 bg-[#FF5A00] text-white text-sm font-bold rounded-lg hover:bg-[#e04f00] shrink-0"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setUrlMode(null)}
                  className="h-9 px-3 text-zinc-400 hover:text-white text-sm rounded-lg border border-zinc-700 shrink-0"
                >
                  Cancel
                </button>
              </div>
            );
          }

          return (
            <div key={slotIdx} className="relative group aspect-square">
              {url ? (
                <>
                  <img
                    src={url}
                    alt={`Image ${slotIdx + 1}`}
                    className={cn(
                      "w-full h-full object-cover rounded-xl border",
                      isPrimary ? "border-[#FF5A00]" : "border-zinc-700"
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
                  <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white font-bold">
                      Replace
                    </div>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload(e, slotIdx)} />
                  </label>
                </>
              ) : (
                <div className={cn(
                  "w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1",
                  images.length === slotIdx
                    ? "border-[#FF5A00]/40 bg-[#FF5A00]/5"
                    : "border-zinc-800 bg-zinc-900/30"
                )}>
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-[#FF5A00] animate-spin" />
                  ) : (
                    <>
                      <label className="flex flex-col items-center cursor-pointer group/upload hover:text-white text-zinc-500 transition-colors">
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-semibold">Upload</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleUpload(e, slotIdx)} />
                      </label>
                      <div className="text-[8px] text-zinc-700">or</div>
                      <button
                        type="button"
                        onClick={() => { setUrlMode(slotIdx); setUrlInput(""); }}
                        className="flex flex-col items-center text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-[9px] font-semibold">URL</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
