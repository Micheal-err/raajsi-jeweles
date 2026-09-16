import { type ReactNode } from "react";
import { HeroVisual, type HeroVisualVariant } from "./HeroVisual";
import { Parallax } from "./Parallax";

type Props = {
  eyebrow: string;
  /** Title words. Every other word will render in italic serif for editorial rhythm. */
  title: ReactNode;
  lede?: ReactNode;
  meta?: ReactNode;
  variant?: "light" | "dark";
  align?: "left" | "center";
  /** Right-column editorial visual. Pass a variant name or a custom node. */
  visual?: HeroVisualVariant | ReactNode;
};

/**
 * Cinematic, award-tier page hero shared across every route.
 * Big serif kinetic type, aurora blobs, grain overlay, red accent bar,
 * optional right-column visual (image collage or SVG).
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  meta,
  variant = "light",
  align = "left",
  visual,
}: Props) {
  const dark = variant === "dark";
  const hasVisual = visual != null && align !== "center";
  const visualNode =
    typeof visual === "string" ? <HeroVisual variant={visual as HeroVisualVariant} /> : visual;

  return (
    <section
      className={`chapter relative overflow-hidden ${
        dark ? "bg-ink text-paper" : "bg-paper text-ink"
      } grain-overlay`}
    >
      {/* Parallax Aurora blobs - decorative depth */}
      <Parallax speed={-0.2} className="pointer-events-none absolute inset-0 -z-0">
        <div
          aria-hidden
          className="absolute rounded-full blur-3xl"
          style={{
            width: "36rem",
            height: "36rem",
            top: "-12rem",
            left: "-8rem",
            background: dark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.15)",
            opacity: dark ? 0.15 : 0.6,
          }}
        />
      </Parallax>
      <Parallax speed={0.25} className="pointer-events-none absolute inset-0 -z-0">
        <div
          aria-hidden
          className="absolute rounded-full blur-3xl"
          style={{
            width: "30rem",
            height: "30rem",
            bottom: "-12rem",
            right: "-6rem",
            background: dark ? "rgba(184, 134, 11, 0.06)" : "rgba(230, 190, 138, 0.18)",
            opacity: dark ? 0.18 : 0.5,
          }}
        />
        <div
          aria-hidden
          className="absolute rounded-full blur-3xl"
          style={{
            width: "20rem",
            height: "20rem",
            top: "20%",
            right: "15%",
            background: dark ? "#3a0201" : "#ffd7d5",
            opacity: 0.25,
          }}
        />
      </Parallax>

      <div
        className={`container-editorial relative pt-6 md:pt-10 pb-8 md:pb-12 ${
          align === "center" ? "text-center" : ""
        }`}
      >
        <div className={hasVisual ? "grid md:grid-cols-12 gap-10 lg:gap-16 items-center" : ""}>
          <div className={hasVisual ? "md:col-span-7" : ""}>
            {/* Eyebrow with accent bar */}
            <div
              className={`flex items-center gap-4 mb-8 ${
                align === "center" ? "justify-center" : ""
              }`}
            >
              <span className="h-px w-10 md:w-14" style={{ background: "var(--accent)" }} />
              <span
                className="eyebrow"
                style={dark ? { color: "rgba(255,255,255,.7)" } : undefined}
              >
                {eyebrow}
              </span>
              <span className="dot pulse-dot" aria-hidden style={{ background: "var(--accent)" }} />
            </div>

            {/* Title — kinetic slot */}
            <h1
              className={`display-serif ${align === "center" ? "mx-auto" : ""}`}
              style={{
                fontSize: hasVisual
                  ? "clamp(2.5rem, 6.4vw, 6.5rem)"
                  : "clamp(2.75rem, 9.2vw, 9.5rem)",
                maxWidth: hasVisual ? "36rem" : "88rem",
              }}
            >
              {title}
            </h1>

            {lede && (
              <p
                className={`mt-8 md:mt-10 max-w-2xl text-lg md:text-xl leading-relaxed ${
                  dark ? "text-paper/75" : "text-ink/75"
                } ${align === "center" ? "mx-auto" : ""}`}
              >
                {lede}
              </p>
            )}

            {meta && (
              <div
                className={`mt-10 md:mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs tracking-widest uppercase ${
                  dark ? "text-paper/60" : "text-muted-foreground"
                } ${align === "center" ? "justify-center" : ""}`}
              >
                {meta}
              </div>
            )}
          </div>

          {hasVisual && <div className="md:col-span-5 hero-visual-in">{visualNode}</div>}
        </div>
      </div>

      {/* Base hairline */}
      <div className="chapter-rule" />
    </section>
  );
}

/**
 * Convenience: split a plain string into per-word kinetic-rise spans with
 * every second word italicised. Use as the `title` prop of PageHero.
 */
export function KineticTitle({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string") {
    return (
      <span className="kinetic-line">
        <span style={{ animationDelay: "120ms" }}>{children}</span>
      </span>
    );
  }
  const words = children.split(" ");
  return (
    <span aria-label={children}>
      {words.map((w, i) => (
        <span key={i} className="kinetic-line">
          <span
            className={i % 2 === 1 ? "italic" : ""}
            style={{
              animationDelay: `${120 + i * 90}ms`,
              paddingRight: ".28em",
            }}
          >
            {w}
          </span>
        </span>
      ))}
    </span>
  );
}
