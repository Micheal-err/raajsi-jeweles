import { useEffect, useRef } from "react";

interface Props {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}

export function SplitReveal({
  text,
  as: Tag = "h2",
  className,
  wordClassName,
  delay = 0,
  stagger = 60,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = el.querySelectorAll<HTMLElement>("[data-word]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      spans.forEach((s) => (s.style.transform = "translateY(0)"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            spans.forEach((s, i) => {
              s.style.transitionDelay = `${delay + i * stagger}ms`;
              s.style.transform = "translateY(0)";
              s.style.opacity = "1";
            });
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, stagger, text]);

  const words = text.split(" ");
  return (
    <Tag ref={ref as any} className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline pb-[0.12em]">
          <span
            data-word
            className={"inline-block will-change-transform " + (wordClassName ?? "")}
            style={{
              transform: "translateY(110%)",
              opacity: 0,
              transition:
                "transform 1000ms cubic-bezier(.2,.7,.2,1), opacity 800ms cubic-bezier(.2,.7,.2,1)",
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
