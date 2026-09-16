import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "figure" | "li";
  delayMs?: number;
}

export function Reveal({ children, className = "", as = "div", delayMs = 0 }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const t = setTimeout(() => el.classList.add("is-in"), delayMs);
            io.disconnect();
            return () => clearTimeout(t);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);

  const Tag = as as "div";
  return (
    <Tag ref={ref as never} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
