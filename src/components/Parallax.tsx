import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { getLenis } from "./SmoothScroll";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // e.g. 0.15 for subtle lag, -0.15 to lead scroll
  className?: string;
  style?: CSSProperties;
}

/**
 * High-performance GPU-accelerated Parallax wrapper.
 * Integrates directly with Lenis smooth-scroll when active.
 */
export function Parallax({ children, speed = 0.15, className = "", style }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const element = ref.current;
    if (!element) return;

    let ticking = false;
    const update = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const vh = window.innerHeight;
          if (rect.bottom >= -150 && rect.top <= vh + 150) {
            const centerY = rect.top + rect.height / 2;
            const delta = (centerY - vh / 2) * speed;
            setOffset(delta);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", update);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      if (lenis) lenis.off("scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{
        transform: `translate3d(0, ${offset.toFixed(2)}px, 0)`,
        transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface ParallaxImageProps {
  src: string;
  alt?: string;
  speed?: number;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string;
  children?: ReactNode;
}

/**
 * Editorial Parallax Image Window:
 * The image is slightly scaled and glides vertically inside an overflow-hidden frame
 * as the user scrolls, creating a rich luxury depth effect.
 */
export function ParallaxImage({
  src,
  alt = "",
  speed = 0.15,
  className = "",
  imageClassName = "",
  aspectRatio = "aspect-[16/9]",
  children,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          if (rect.bottom >= -100 && rect.top <= vh + 100) {
            const centerY = rect.top + rect.height / 2;
            const delta = (centerY - vh / 2) * speed;
            setOffset(delta);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", update);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      if (lenis) lenis.off("scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [speed]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover will-change-transform ${imageClassName}`}
        style={{
          transform: `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.15)`,
          transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      />
      {children}
    </div>
  );
}
