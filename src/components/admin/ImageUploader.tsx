import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { uploadProductImage } from "@/lib/storage";
import { resolveImage } from "@/lib/images";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  name?: string;
}

const PRESET_IMAGES = [
  {
    name: "Kundan Necklace",
    url: "/jewellery/jewellery-necklace.jpg",
  },
  {
    name: "Polki Bangles",
    url: "/jewellery/jewellery-bangles.jpg",
  },
  {
    name: "Temple Gold Kada",
    url: "/jewellery/jewellery-kada.png",
  },
  {
    name: "Heritage Rings",
    url: "/jewellery/jewellery-gold-rings.png",
  },
  {
    name: "Bridal Choker",
    url: "/jewellery/jewellery-hero.png",
  },
];

export function ImageUploader({
  value,
  onChange,
  label = "Product Image",
  required = false,
  name = "primary_image_url",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = useCallback(
    async (file: File) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file (PNG, JPG, WebP, GIF)");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }

      // Create instant preview
      const localPreview = URL.createObjectURL(file);
      onChange(localPreview);
      setIsUploading(true);
      setUploadProgress("Uploading to cloud storage…");

      try {
        const { url, error } = await uploadProductImage(file);
        if (error || !url) {
          toast.error(error || "Upload failed. Please try again or paste image URL.");
          // Keep local preview if available or revert
        } else {
          onChange(url);
          toast.success("Image uploaded successfully to cloud storage!");
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error("Upload failed: " + (err.message || "Unknown error"));
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleFileProcess(file);
      }
    },
    [handleFileProcess]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        handleFileProcess(file);
      }
    },
    [handleFileProcess]
  );

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resolved = resolveImage(value);

  return (
    <div className="grid gap-2 md:col-span-2">
      {/* Hidden input to ensure FormData receives the field value */}
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center justify-between">
        <label className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium flex items-center gap-1.5">
          <ImageIcon size={12} className="text-amber-700/70" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-muted-foreground hover:text-ink flex items-center gap-1 transition-colors"
        >
          <LinkIcon size={11} />
          {showUrlInput ? "Hide URL field" : "Or enter URL manually"}
        </button>
      </div>

      {/* Manual URL Input (collapsible) */}
      {showUrlInput && (
        <div className="p-3 bg-mist/40 border border-hairline rounded-sm mb-1 space-y-1 animate-in fade-in duration-200">
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
            Direct Image Link / URL:
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... or /jewellery/example.jpg"
              className="flex-1 border border-hairline px-3 py-1.5 text-xs bg-paper font-mono"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 text-xs border border-hairline hover:bg-mist text-muted-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Uploader Box */}
      {value ? (
        /* Image Preview State with Replace Option */
        <div className="relative border border-hairline bg-mist/20 rounded-sm p-4 flex flex-col sm:flex-row items-center gap-4 group">
          <div className="relative w-28 h-28 shrink-0 rounded-sm overflow-hidden border border-hairline bg-paper shadow-sm">
            <img
              src={resolved}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback display
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x400/f5f2eb/1a1a1a?text=Preview+Image";
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-paper text-xs">
                <Loader2 size={20} className="animate-spin mb-1 text-amber-300" />
                <span className="text-[10px] uppercase tracking-widest">Uploading</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} /> Image Ready
              </span>
              {isUploading && (
                <span className="text-xs text-amber-700 font-medium">
                  {uploadProgress || "Uploading…"}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate font-mono bg-paper/80 px-2 py-1 border border-hairline rounded-sm">
              {value}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-hairline bg-paper hover:bg-mist tracking-wider uppercase text-ink transition-colors"
              >
                <RefreshCw size={12} /> Replace File
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-hairline text-red-600 hover:bg-red-50 tracking-wider uppercase transition-colors"
              >
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer transition-all duration-200 border-2 border-dashed rounded-sm p-8 text-center flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-amber-600 bg-amber-500/10 scale-[0.99]"
              : "border-hairline bg-mist/20 hover:bg-mist/40 hover:border-ink/40"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragging
                ? "bg-amber-100 text-amber-800"
                : "bg-paper border border-hairline text-muted-foreground group-hover:text-ink"
            }`}
          >
            {isUploading ? (
              <Loader2 size={24} className="animate-spin text-amber-600" />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide uppercase">
              {isUploading
                ? "Uploading image…"
                : isDragging
                ? "Drop file to upload"
                : "Drag & drop jewellery image here, or click to browse"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Supports high-resolution PNG, JPG, WebP, or GIF up to 10MB
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            className="mt-1 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] border border-hairline bg-paper hover:bg-ink hover:text-paper transition-colors"
          >
            Select Image File
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Quick Curated Preset Jewellery Images */}
      {!value && (
        <div className="mt-1">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
            <Sparkles size={11} className="text-amber-600" /> Or pick from sample catalogue presets:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_IMAGES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.url)}
                className="text-[11px] border border-hairline px-2.5 py-1 bg-paper hover:bg-mist/80 text-muted-foreground hover:text-ink transition-colors rounded-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
