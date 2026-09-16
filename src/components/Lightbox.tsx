import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox({
  images,
  index,
  onClose,
  onNav,
}: {
  images: { src: string; alt: string }[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNav((index - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onNav]);

  const [zoom, setZoom] = useState(false);
  const img = images[index];
  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-paper p-2 hover:opacity-70"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
      >
        <X />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-paper p-2 hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onNav((index - 1 + images.length) % images.length);
            }}
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-paper p-2 hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onNav((index + 1) % images.length);
            }}
            aria-label="Next"
          >
            <ChevronRight />
          </button>
        </>
      )}
      <img
        src={img.src}
        alt={img.alt}
        onClick={(e) => {
          e.stopPropagation();
          setZoom((z) => !z);
        }}
        className={`max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-500 ${zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-paper text-[11px] tracking-widest uppercase">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
