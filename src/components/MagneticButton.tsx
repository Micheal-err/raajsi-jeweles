import { forwardRef, useEffect, useRef, type ReactNode, type CSSProperties } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "button" | "a" | "div";
  strength?: number;
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export const MagneticButton = forwardRef<HTMLElement, Props>(function MagneticButton(
  { children, className, as = "button", strength = 24, href, onClick, style },
  _ref,
) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate3d(${(x / r.width) * strength}px, ${(y / r.height) * strength}px, 0)`;
    };
    const onLeave = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  const props = {
    ref: (n: HTMLElement | null) => {
      ref.current = n;
    },
    className,
    style: {
      transition: "transform 500ms cubic-bezier(.2,.7,.2,1)",
      display: "inline-flex",
      ...style,
    },
    onClick,
  } as any;
  if (as === "a")
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  if (as === "div") return <div {...props}>{children}</div>;
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
});
