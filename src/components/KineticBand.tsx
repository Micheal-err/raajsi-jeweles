type Props = {
  reverse?: boolean;
  /** override words if a page wants topic-specific text */
  words?: { t: string; c?: "" | "solid" | "red" }[];
  variant?: "paper" | "ink";
};

const DEFAULT_WORDS: Props["words"] = [
  { t: "Authenticity", c: "solid" },
  { t: "is", c: "" },
  { t: "Priceless", c: "red" },
  { t: "·", c: "solid" },
  { t: "Contemporary", c: "" },
  { t: "Indian", c: "red" },
  { t: "Art", c: "solid" },
  { t: "·", c: "red" },
  { t: "Since", c: "" },
  { t: "2009", c: "solid" },
  { t: "·", c: "solid" },
  { t: "Jaipur", c: "red" },
  { t: "—", c: "" },
  { t: "World", c: "solid" },
  { t: "·", c: "red" },
];

/**
 * Cinematic scrolling marquee — outlined serif + solid ink + red accent.
 * Drop between sections for kinetic rhythm.
 */
export function KineticBand({ reverse = false, words = DEFAULT_WORDS, variant = "paper" }: Props) {
  const dark = variant === "ink";
  return (
    <section
      className={`relative border-y border-hairline py-8 md:py-12 overflow-hidden ${
        dark ? "bg-ink" : "bg-paper"
      }`}
    >
      <div className={`marquee ${reverse ? "marquee-reverse" : ""}`}>
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track" aria-hidden={k === 1}>
            {words!.map((w, i) => (
              <span
                key={i}
                className={`marquee-word ${w.c ?? ""}`}
                style={
                  dark && (!w.c || w.c === "solid")
                    ? {
                        WebkitTextStroke: w.c === "solid" ? "0" : "1px rgba(255,255,255,.85)",
                        color: w.c === "solid" ? "#fff" : "transparent",
                      }
                    : undefined
                }
              >
                {w.t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
