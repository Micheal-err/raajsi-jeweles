import randomImg1 from "@/assets/random-img-1.webp";
import randomImg2 from "@/assets/random-img-2.webp";
import randomImg3 from "@/assets/random-img-3.webp";
import randomImg4 from "@/assets/random-img-4.webp";
import randomImg5 from "@/assets/random-img-5.webp";
import interior from "@/assets/gallery-interior.jpg";
import hero from "@/assets/hero-artwork.jpg";

export type HeroVisualVariant =
  | "gallery"
  | "location"
  | "editorial"
  | "studios"
  | "collection"
  | "inquire"
  | "cart"
  | "wishlist"
  | "auth";

const ACCENT = "var(--accent)";

/**
 * Editorial hero right-column visual. Each variant is a small
 * composition of framed imagery, geometric marks and typographic
 * artefacts that echoes the page's theme.
 */
export function HeroVisual({ variant }: { variant: HeroVisualVariant }) {
  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[5/6] max-w-[36rem] mx-auto">
      {/* faint number, gives every hero an editorial 'plate' */}
      <div
        className="absolute -top-4 -right-2 md:-top-6 md:right-0 font-serif italic text-ink/10 select-none pointer-events-none leading-none"
        style={{ fontSize: "clamp(6rem, 14vw, 12rem)" }}
        aria-hidden
      >
        {PLATE_NUMBER[variant]}
      </div>
      {renderVariant(variant)}
      {/* corner tick marks */}
      <Ticks />
    </div>
  );
}

const PLATE_NUMBER: Record<HeroVisualVariant, string> = {
  gallery: "09",
  location: "01",
  editorial: "07",
  studios: "04",
  collection: "II",
  inquire: "→",
  cart: "◻",
  wishlist: "♡",
  auth: "◈",
};

function Ticks() {
  const t = "absolute w-4 h-4 border-ink/40";
  return (
    <>
      <span className={`${t} top-0 left-0 border-t border-l`} aria-hidden />
      <span className={`${t} top-0 right-0 border-t border-r`} aria-hidden />
      <span className={`${t} bottom-0 left-0 border-b border-l`} aria-hidden />
      <span className={`${t} bottom-0 right-0 border-b border-r`} aria-hidden />
    </>
  );
}

function Frame({
  src,
  alt,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] ring-1 ring-ink/5 bg-paper ${className}`}
      style={style}
    >
      <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
    </div>
  );
}

function renderVariant(v: HeroVisualVariant) {
  switch (v) {
    case "gallery":
      return (
        <>
          <Frame
            src={randomImg1}
            alt="Raajsi Fine Royal Kundan Jewellery"
            className="left-0 top-[6%] w-[68%] h-[64%]"
          />
          <Frame
            src={randomImg2}
            alt="925 Sterling Silver Ring"
            className="right-0 top-0 w-[44%] h-[40%]"
            style={{ transform: "rotate(2deg)" }}
          />
          <Frame
            src={randomImg4}
            alt="Handcrafted Choker & Necklace"
            className="right-[2%] bottom-[4%] w-[54%] h-[48%]"
            style={{ transform: "rotate(-1.5deg)" }}
          />
          <div className="absolute left-[2%] bottom-0 eyebrow bg-paper/95 px-3 py-1.5 backdrop-blur border border-hairline shadow-sm">
            Timeless Luxury · Jaipur
          </div>
          <span
            className="absolute left-[70%] top-[4%] w-2 h-2 rounded-full"
            style={{ background: ACCENT }}
            aria-hidden
          />
        </>
      );
    case "location":
      return (
        <>
          <div className="absolute inset-0 bg-mist" />
          <MapSVG />
          <Frame
            src={interior}
            alt="Gallery facade"
            className="left-[6%] bottom-[6%] w-[46%] h-[36%]"
          />
          <div className="absolute right-[6%] top-[8%] bg-paper border border-hairline px-3 py-2 text-[10px] tracking-[0.22em] uppercase font-medium">
            <div className="text-muted-foreground">Coordinates</div>
            <div>26.912°N · 75.787°E</div>
          </div>
          <div className="absolute right-[8%] bottom-[10%] flex items-center gap-2">
            <span className="dot pulse-dot" style={{ background: ACCENT }} />
            <span className="eyebrow">C-Scheme</span>
          </div>
        </>
      );
    case "editorial":
      return (
        <>
          <Frame
            src={randomImg3}
            alt="Journal cover"
            className="left-0 top-0 w-[62%] h-[70%]"
            style={{ transform: "rotate(-2deg)" }}
          />
          <div
            className="absolute right-0 top-[8%] w-[48%] h-[58%] bg-paper ring-1 ring-hairline shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)] p-5 flex flex-col justify-between"
            style={{ transform: "rotate(2deg)" }}
          >
            <div className="eyebrow" style={{ color: ACCENT }}>
              Issue N°07
            </div>
            <div
              className="font-serif italic leading-none"
              style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)" }}
            >
              on <br /> patience, <br /> and craft.
            </div>
            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Raajsi Jewels · Journal
            </div>
          </div>
          <div className="absolute left-[10%] bottom-0 flex items-center gap-3 bg-paper/95 backdrop-blur px-3 py-1.5">
            <span className="h-px w-8" style={{ background: ACCENT }} />
            <span className="eyebrow">Heritage · Atelier</span>
          </div>
        </>
      );
    case "studios":
      return (
        <>
          <Frame src={randomImg1} alt="Raajsi Workshop Jaipur" className="left-0 top-[6%] w-[46%] h-[54%]" />
          <Frame
            src={randomImg3}
            alt="Handcrafted Silver Casting"
            className="right-[2%] top-0 w-[44%] h-[48%]"
            style={{ transform: "rotate(2deg)" }}
          />
          <Frame
            src={randomImg4}
            alt="Artisan Benchwork"
            className="left-[14%] bottom-0 w-[52%] h-[48%]"
            style={{ transform: "rotate(-1.5deg)" }}
          />
          <div
            className="absolute right-0 bottom-[10%] font-serif italic leading-none text-ink/80"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)" }}
          >
            jaipur <br /> atelier.
          </div>
          <span
            className="absolute right-[6%] top-[52%] w-2 h-2 rounded-full"
            style={{ background: ACCENT }}
          />
        </>
      );
    case "collection":
      return (
        <>
          <Frame src={randomImg1} alt="Raajsi Jewellery" className="left-0 top-0 w-[46%] h-[46%]" />
          <Frame src={randomImg2} alt="Raajsi Jewellery" className="right-0 top-[4%] w-[46%] h-[38%]" />
          <Frame src={randomImg3} alt="Raajsi Jewellery" className="left-[4%] bottom-0 w-[46%] h-[44%]" />
          <Frame src={randomImg4} alt="Raajsi Jewellery" className="right-0 bottom-[2%] w-[46%] h-[50%]" />
          <div className="absolute inset-x-0 top-[47%] flex items-center justify-center pointer-events-none">
            <span className="bg-paper px-3 py-1 eyebrow border border-hairline">112 works</span>
          </div>
        </>
      );
    case "inquire":
      return (
        <>
          <div
            className="absolute left-[4%] top-[8%] w-[80%] h-[78%] bg-paper ring-1 ring-hairline shadow-[0_40px_80px_-30px_rgba(0,0,0,0.3)] p-8 flex flex-col justify-between"
            style={{ transform: "rotate(-2deg)" }}
          >
            <div>
              <div className="eyebrow mb-4" style={{ color: ACCENT }}>
                Directors · Personal Reply
              </div>
              <div
                className="font-serif italic leading-tight"
                style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.6rem)" }}
              >
                Dear <br /> collector,
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-px bg-ink/20 w-full" />
              <div className="h-px bg-ink/20 w-[90%]" />
              <div className="h-px bg-ink/20 w-[70%]" />
              <div className="h-px bg-ink/20 w-[85%]" />
              <div className="h-px bg-ink/20 w-[40%]" />
            </div>
            <div className="flex items-end justify-between">
              <div className="font-serif italic text-ink/70">— The Gallery</div>
              <div
                className="w-14 h-14 rounded-full grid place-items-center text-paper text-lg font-serif italic"
                style={{ background: ACCENT }}
              >
                K
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-[4%] eyebrow bg-paper/95 backdrop-blur px-3 py-1.5 border border-hairline">
            Reply within 1 day
          </div>
        </>
      );
    case "cart":
      return (
        <>
          <Frame src={randomImg3} alt="Selected jewellery piece" className="left-0 top-0 w-[52%] h-[42%]" />
          <Frame
            src={randomImg5}
            alt="Selected jewellery piece"
            className="right-0 top-[8%] w-[46%] h-[38%]"
            style={{ transform: "rotate(1.5deg)" }}
          />
          <Frame
            src={randomImg4}
            alt="Selected jewellery piece"
            className="left-[8%] bottom-[4%] w-[56%] h-[42%]"
            style={{ transform: "rotate(-1.5deg)" }}
          />
          <div className="absolute right-0 bottom-[10%] bg-paper border border-hairline px-4 py-3 text-[10px] tracking-[0.22em] uppercase">
            <div className="text-muted-foreground mb-1">Raajsi</div>
            <div
              className="font-serif italic text-2xl normal-case tracking-normal"
              style={{ color: ACCENT }}
            >
              03
            </div>
          </div>
        </>
      );
    case "wishlist":
      return (
        <>
          <Frame src={randomImg4} alt="Saved jewellery piece" className="left-0 top-[6%] w-[54%] h-[62%]" />
          <Frame
            src={randomImg5}
            alt="Saved jewellery piece"
            className="right-0 bottom-[6%] w-[52%] h-[54%]"
            style={{ transform: "rotate(2deg)" }}
          />
          <div
            className="absolute right-[6%] top-[4%] w-16 h-16 grid place-items-center rounded-full"
            style={{ background: ACCENT, color: "var(--accent-foreground)" }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
              <path d="M12 21s-7-4.35-9.5-8.5C.85 9.6 2.6 5.5 6.5 5.5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.9 0 5.65 4.1 4 7-2.5 4.15-9.5 8.5-9.5 8.5z" />
            </svg>
          </div>
          <div className="absolute left-[10%] bottom-0 eyebrow bg-paper/95 px-3 py-1.5 backdrop-blur">
            Kept, for later
          </div>
        </>
      );
    case "auth":
      return (
        <>
          <div className="absolute inset-[6%] bg-mist ring-1 ring-hairline" />
          <div className="absolute inset-[12%] bg-paper ring-1 ring-hairline grid place-items-center">
            <div className="text-center px-6">
              <div
                className="mx-auto mb-6 w-20 h-20 rounded-full grid place-items-center font-serif italic text-3xl text-paper"
                style={{ background: ACCENT }}
              >
                K
              </div>
              <div
                className="font-serif italic leading-none mb-3"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
              >
                Raajsi Jewels
              </div>
              <div className="eyebrow text-muted-foreground">Members · since 2009</div>
              <div className="mt-6 h-px w-24 mx-auto" style={{ background: ACCENT }} />
              <div className="mt-3 text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                Authenticity is Priceless
              </div>
            </div>
          </div>
        </>
      );
  }
}

function MapSVG() {
  return (
    <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full" aria-hidden>
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(26,26,26,0.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill="url(#grid)" />
      {/* streets */}
      <path
        d="M0 120 Q 200 100 400 160"
        stroke="rgba(26,26,26,0.25)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M0 280 Q 180 260 400 300"
        stroke="rgba(26,26,26,0.2)"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M80 0 L 120 500" stroke="rgba(26,26,26,0.18)" strokeWidth="1" fill="none" />
      <path d="M260 0 Q 240 250 300 500" stroke="rgba(26,26,26,0.18)" strokeWidth="1" fill="none" />
      <path
        d="M180 40 L 210 480"
        stroke="rgba(26,26,26,0.12)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
      {/* blocks */}
      <rect x="140" y="140" width="60" height="70" fill="rgba(26,26,26,0.06)" />
      <rect x="220" y="180" width="80" height="50" fill="rgba(26,26,26,0.05)" />
      <rect x="90" y="320" width="70" height="60" fill="rgba(26,26,26,0.05)" />
      {/* pin */}
      <g transform="translate(230,220)">
        <circle r="26" fill="rgba(228,7,0,0.15)" />
        <circle r="14" fill="rgba(228,7,0,0.3)" />
        <circle r="6" fill="#e40700" />
      </g>
    </svg>
  );
}
