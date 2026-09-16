import { useEffect, useRef, useState } from "react";

function HandPointerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M22 68 C16 62 8 50 6 44 C4 38 5 32 10 30 C14 28 18 30 22 36 L22 16 C22 10 26 6 31 6 C36 6 39 10 39 16 L39 20 C39 17 42 15 46 15 C50 15 53 18 53 22 L53 26 C53 24 56 22 59 23 C62 24 64 28 63 32 L60 52 C58 62 52 72 42 74 L34 74 C29 74 25 72 22 68 Z"
        fill="white"
        stroke="black"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M31 28 V12" stroke="black" strokeWidth="4" strokeLinecap="round" />
      <path d="M43 34 V24" stroke="black" strokeWidth="3" strokeLinecap="round" />
      <path d="M53 38 V30" stroke="black" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CursorHalo() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest("a, button, [data-cursor='hover']");
      setHover(interactive);
    };
    window.addEventListener("mousemove", onMove);

    let rafId = 0;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 z-[90] pointer-events-none rounded-full flex items-center justify-center"
      style={{
        width: hover ? 90 : 22,
        height: hover ? 90 : 22,
        background: hover
          ? "radial-gradient(circle, rgba(228,7,0,.25), rgba(228,7,0,0) 70%)"
          : "radial-gradient(circle, rgba(228,7,0,.55), rgba(228,7,0,0) 70%)",
        transition:
          "width 400ms cubic-bezier(.2,.7,.2,1), height 400ms cubic-bezier(.2,.7,.2,1), background 300ms ease",
      }}
    >
      <span
        className="flex items-center justify-center rounded-full bg-white text-ink shadow-sm overflow-hidden border border-ink/10"
        style={{
          width: 34,
          height: 34,
          opacity: hover ? 1 : 0,
          transform: hover ? "scale(1)" : "scale(0.4)",
          transition: "opacity 300ms ease, transform 400ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <HandPointerIcon className="w-5 h-5" />
      </span>
    </div>
  );
}
