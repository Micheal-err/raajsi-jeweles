import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { resolveImage } from "@/lib/images";

/**
 * "View on your wall" — attempts to use the device camera as an AR-lite
 * backdrop, with a room fallback. The artwork floats over the feed and can
 * be resized to match the user's wall.
 */
export function ARWallView({
  open,
  onClose,
  src,
  alt,
  dimensions,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  dimensions: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camOn, setCamOn] = useState(false);
  const [scale, setScale] = useState(1);
  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !camOn) return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCamError("Camera unavailable. Showing a room preview instead.");
        setCamOn(false);
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, camOn]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {camOn ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1920&q=80)",
          }}
        />
      )}

      {/* Floating artwork */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl border-4 border-white/90 max-w-[80vw] max-h-[70vh]"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <img
          src={resolveImage(src)}
          alt={alt}
          className="block max-w-[60vw] max-h-[60vh] object-contain"
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
        <div className="text-white/90 text-[11px] tracking-widest uppercase bg-black/40 backdrop-blur px-3 py-2">
          {dimensions ? `${dimensions} · Preview to scale` : "Wall preview"}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full bg-white/95 text-ink flex items-center justify-center"
        >
          <X size={18} />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 px-4">
        {camError && (
          <div className="text-[11px] text-white/80 bg-black/50 px-3 py-1">{camError}</div>
        )}
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur px-4 py-3 rounded-full">
          <button
            type="button"
            onClick={() => setCamOn((v) => !v)}
            className="text-white text-[11px] tracking-widest uppercase border border-white/60 px-3 py-1.5 hover:bg-white hover:text-ink transition"
          >
            {camOn ? "Use room preview" : "Use my camera"}
          </button>
          <label className="flex items-center gap-2 text-white text-[11px] tracking-widest uppercase">
            Size
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-32 accent-white"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
