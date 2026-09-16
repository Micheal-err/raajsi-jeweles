import { useEffect, useRef, useState } from "react";
import { resolveImage } from "@/lib/images";

/**
 * Lightweight 360° spin viewer.
 * Uses gallery_image_urls as frames (drag to rotate). Falls back to
 * an animated CSS spin over a single image when only one frame exists.
 */
export function View360({ frames, alt }: { frames: string[]; alt: string }) {
  const usable = frames.filter(Boolean);
  const single = usable.length < 2;
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const startIdx = useRef(0);

  useEffect(() => {
    if (!single) return;
    const id = setInterval(() => setI((v) => v + 1), 40);
    return () => clearInterval(id);
  }, [single]);

  if (usable.length === 0) {
    return (
      <div className="aspect-square bg-mist flex items-center justify-center text-sm text-muted-foreground">
        No 360° frames available
      </div>
    );
  }

  const frame = usable[Math.abs(i) % usable.length];

  const onDown = (clientX: number) => {
    startX.current = clientX;
    startIdx.current = i;
  };
  const onMove = (clientX: number, width: number) => {
    if (startX.current == null) return;
    const delta = (clientX - startX.current) / Math.max(width / usable.length, 20);
    setI(startIdx.current - Math.round(delta));
  };

  return (
    <div className="relative select-none">
      <div
        className="relative aspect-square bg-mist overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX, e.currentTarget.clientWidth)}
        onMouseUp={() => (startX.current = null)}
        onMouseLeave={() => (startX.current = null)}
        onTouchStart={(e) => e.touches[0] && onDown(e.touches[0].clientX)}
        onTouchMove={(e) =>
          e.touches[0] && onMove(e.touches[0].clientX, e.currentTarget.clientWidth)
        }
        onTouchEnd={() => (startX.current = null)}
        style={single ? { perspective: "1000px" } : undefined}
      >
        <img
          src={resolveImage(frame)}
          alt={alt}
          className="w-full h-full object-cover pointer-events-none"
          style={
            single
              ? { transform: `rotateY(${i * 2}deg)`, transition: "transform 40ms linear" }
              : undefined
          }
          draggable={false}
        />
        <div className="absolute bottom-3 left-3 text-[10px] tracking-widest uppercase bg-paper/85 px-2 py-1">
          {single
            ? "Auto-rotate"
            : `${(Math.abs(i) % usable.length) + 1} / ${usable.length} · Drag to rotate`}
        </div>
      </div>
    </div>
  );
}
