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
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { uploadProductImage } from "@/lib/storage";
import { resolveImage } from "@/lib/images";
import { toast } from "sonner";

export interface ImageSlotDefinition {
  label: string;
  role: string;
  description: string;
  presetKey?: string;
}

const DEFAULT_SLOTS: ImageSlotDefinition[] = [
  {
    label: "1. Primary / Front View",
    role: "Cover & Catalogue",
    description: "Main front-facing shot used across catalogue and search.",
  },
  {
    label: "2. Side / Angle Perspective",
    role: "Dimensional View",
    description: "45-degree angle showing depth, band profile, and height.",
  },
  {
    label: "3. Model / On-Body View",
    role: "Lifestyle & Proportion",
    description: "Styled on a model to show scale, drape, and proportion.",
  },
  {
    label: "4. Close-Up Craftsmanship",
    role: "Hallmark & Detailing",
    description: "Macro shot of BIS hallmark, stone setting, and engraving.",
  },
];

// Curated 4-image preset sets for instant luxury jewellery setup
export const PRESET_COLLECTIONS = [
  {
    name: "Royal Kundan Choker (4 Views)",
    images: [
      "/jewellery/jewellery-necklace.jpg",
      "/jewellery/jewellery-hero.png",
      "/jewellery/jewellery-bangles.jpg",
      "/jewellery/jewellery-rings.png",
    ],
  },
  {
    name: "Padmavati Bridal Suite (4 Views)",
    images: [
      "/jewellery/jewellery-hero.png",
      "/jewellery/jewellery-necklace.jpg",
      "/jewellery/jewellery-rings.png",
      "/jewellery/jewellery-mens.png",
    ],
  },
  {
    name: "Imperial Rajput Kada & Band (4 Views)",
    images: [
      "/jewellery/jewellery-mens.png",
      "/jewellery/jewellery-rings.png",
      "/jewellery/jewellery-hero.png",
      "/jewellery/jewellery-bangles.jpg",
    ],
  },
  {
    name: "Heritage Polki Solitaire (4 Views)",
    images: [
      "/jewellery/jewellery-rings.png",
      "/jewellery/jewellery-hero.png",
      "/jewellery/jewellery-necklace.jpg",
      "/jewellery/jewellery-bangles.jpg",
    ],
  },
];

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  requiredCount?: number;
}

export function MultiImageUploader({
  images,
  onChange,
  requiredCount = 4,
}: MultiImageUploaderProps) {
  // Ensure array has at least requiredCount items
  const currentImages = [...images];
  while (currentImages.length < requiredCount) {
    currentImages.push("");
  }

  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isBatchDragging, setIsBatchDragging] = useState(false);
  const [activeUrlSlot, setActiveUrlSlot] = useState<number | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Count configured images
  const validCount = currentImages.filter((url) => Boolean(url && url.trim())).length;

  const updateSlot = (index: number, url: string) => {
    const updated = [...currentImages];
    updated[index] = url;
    onChange(updated);
  };

  const removeSlot = (index: number) => {
    const updated = [...currentImages];
    if (updated.length > requiredCount) {
      updated.splice(index, 1);
    } else {
      updated[index] = "";
    }
    onChange(updated);
  };

  const handleSlotFileUpload = async (file: File, slotIndex: number) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image (PNG, JPG, WebP, GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    updateSlot(slotIndex, localUrl);
    setUploadingSlot(slotIndex);

    try {
      const { url, error } = await uploadProductImage(file);
      if (error || !url) {
        toast.error(error || `Upload for view ${slotIndex + 1} failed.`);
      } else {
        updateSlot(slotIndex, url);
        toast.success(`View ${slotIndex + 1} uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Unknown error"}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  // Batch drop handler: uploads up to 4+ files sequentially into slots
  const handleBatchFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Please select valid image files.");
      return;
    }

    toast.info(`Processing and uploading ${files.length} images...`);

    const updated = [...currentImages];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slotIndex = i;
      if (slotIndex >= updated.length) {
        updated.push("");
      }

      setUploadingSlot(slotIndex);
      try {
        const { url, error } = await uploadProductImage(file);
        if (url) {
          updated[slotIndex] = url;
        } else {
          console.warn(`File ${file.name} upload error:`, error);
        }
      } catch (e) {
        console.error("Batch upload failed for file", file.name, e);
      }
    }
    setUploadingSlot(null);
    onChange(updated);
    toast.success(`Batch upload finished! ${files.length} views updated.`);
  };

  const handleAddSlot = () => {
    onChange([...currentImages, ""]);
  };

  return (
    <div className="md:col-span-2 space-y-4 border border-hairline bg-mist/20 p-5 rounded-sm">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-medium flex items-center gap-2">
              <ImageIcon size={16} className="text-[color:var(--gold,#b8860b)]" />
              Product Photography (At least 4 Angles Required)
            </h3>
            <span
              className={`text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-full border ${
                validCount >= requiredCount
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-700 border-amber-300"
              }`}
            >
              {validCount} of {requiredCount} Configured
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Luxury jewellery buyers expect 4 clear perspectives: Front, 45° Angle, On-Body, and Craftsmanship Detail.
          </p>
        </div>

        {/* Quick Batch Upload Button */}
        <div className="flex items-center gap-2">
          <input
            ref={batchInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleBatchFiles(e.target.files);
            }}
          />
          <button
            type="button"
            onClick={() => batchInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-ink text-paper hover:bg-ink/90 uppercase tracking-wider transition-colors"
          >
            <UploadCloud size={13} /> Drop / Select All 4 Files
          </button>
        </div>
      </div>

      {/* Preset Auto-fill Bar */}
      <div className="bg-paper/70 border border-hairline p-3 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-600" />
          Quick Demo Auto-Fills (4 High-Res Angles):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLLECTIONS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onChange([...preset.images]);
                toast.success(`Loaded 4 angles for: ${preset.name}`);
              }}
              className="text-[10px] uppercase tracking-wider border border-hairline bg-paper hover:bg-mist px-2.5 py-1 text-ink/80 hover:text-ink transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Image Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentImages.map((imageUrl, idx) => {
          const slotDef = DEFAULT_SLOTS[idx] || {
            label: `${idx + 1}. Additional Angle`,
            role: "Additional Perspective",
            description: "Additional jewellery showcase view.",
          };
          const isSlotUploading = uploadingSlot === idx;
          const hasImage = Boolean(imageUrl && imageUrl.trim());
          const resolved = resolveImage(imageUrl);

          return (
            <div
              key={idx}
              className={`relative border rounded-sm p-3 bg-paper transition-all flex flex-col justify-between ${
                hasImage
                  ? "border-hairline shadow-sm"
                  : "border-dashed border-hairline hover:border-amber-500/60"
              }`}
            >
              {/* Slot Header */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-ink">
                    {slotDef.label}
                  </span>
                  {hasImage ? (
                    <span className="text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Slot {idx + 1} Empty
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{slotDef.role}</p>
              </div>

              {/* Slot Media Box */}
              {hasImage ? (
                /* Filled Image State */
                <div className="relative aspect-square w-full rounded-sm overflow-hidden border border-hairline bg-mist/50 group">
                  <img
                    src={resolved}
                    alt={slotDef.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400/f5f2eb/1a1a1a?text=Image+View";
                    }}
                  />

                  {isSlotUploading && (
                    <div className="absolute inset-0 bg-ink/70 backdrop-blur-xs flex flex-col items-center justify-center text-paper text-xs">
                      <Loader2 size={24} className="animate-spin text-amber-400 mb-1" />
                      <span className="text-[10px] uppercase tracking-widest">Uploading…</span>
                    </div>
                  )}

                  {/* Hover Overlay Controls */}
                  <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(resolved)}
                      className="p-2 bg-paper/90 text-ink rounded-full hover:bg-paper transition-transform hover:scale-105"
                      title="Inspect View"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      className="p-2 bg-paper/90 text-ink rounded-full hover:bg-paper transition-transform hover:scale-105"
                      title="Replace Image"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="p-2 bg-red-600 text-paper rounded-full hover:bg-red-700 transition-transform hover:scale-105"
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Dropzone State */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files?.[0]) {
                      handleSlotFileUpload(e.dataTransfer.files[0], idx);
                    }
                  }}
                  onClick={() => fileInputRefs.current[idx]?.click()}
                  className="relative aspect-square w-full rounded-sm border-2 border-dashed border-hairline hover:border-amber-600 hover:bg-amber-50/20 cursor-pointer flex flex-col items-center justify-center p-3 text-center transition-all"
                >
                  {isSlotUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={24} className="animate-spin text-amber-600 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Uploading…
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-mist flex items-center justify-center text-muted-foreground mb-1.5">
                        <UploadCloud size={18} />
                      </div>
                      <span className="text-[11px] font-medium text-ink">Drag & Drop</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        or click to select file
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Hidden File Input for this slot */}
              <input
                ref={(el) => {
                  fileInputRefs.current[idx] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleSlotFileUpload(e.target.files[0], idx);
                  }
                }}
              />

              {/* Footer / Manual URL Toggle */}
              <div className="mt-2 pt-2 border-t border-hairline/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setActiveUrlSlot(activeUrlSlot === idx ? null : idx)}
                  className="hover:text-ink flex items-center gap-1 transition-colors"
                >
                  <LinkIcon size={10} />
                  {activeUrlSlot === idx ? "Hide Link" : "Paste URL"}
                </button>
                {hasImage && (
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    className="hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Manual URL input modal inline */}
              {activeUrlSlot === idx && (
                <div className="mt-2 space-y-1 animate-in fade-in">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => updateSlot(idx, e.target.value)}
                    placeholder="https://... or /jewellery/..."
                    className="w-full border border-hairline px-2 py-1 text-[11px] bg-paper font-mono"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning if fewer than 4 images */}
      {validCount < requiredCount && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 border border-amber-200/80 p-3 rounded-sm">
          <AlertCircle size={15} className="shrink-0 text-amber-600" />
          <span>
            <strong>Reminder:</strong> Fine jewellery customers require all 4 perspective angles (Front,
            Side Profile, On-Body, and Hallmark Close-up) to inspect craftsmanship before making a purchase.
          </span>
        </div>
      )}

      {/* Add Additional Angle Button */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleAddSlot}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink border border-hairline px-3 py-1.5 hover:bg-mist transition-colors"
        >
          <Plus size={13} /> Add Additional Angle Slot
        </button>
      </div>

      {/* Inspect Lightbox Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-paper p-2 rounded-sm shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 bg-ink text-paper p-1.5 rounded-full hover:bg-ink/80 z-10"
            >
              <X size={16} />
            </button>
            <img
              src={previewModalUrl}
              alt="High-Res Inspection"
              className="max-h-[80vh] w-auto object-contain rounded-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
