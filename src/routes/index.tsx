import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";
import { Reveal } from "@/components/Reveal";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { TrustStrip } from "@/components/TrustStrip";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { Parallax, ParallaxImage } from "@/components/Parallax";
import { getLenis } from "@/components/SmoothScroll";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Instagram,
  Facebook,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
} from "lucide-react";

import slider1 from "@/assets/slider-1.webp";
import slider2 from "@/assets/slider-2.webp";
import slider3 from "@/assets/slider-3.webp";
import slider4 from "@/assets/slider-4.webp";
import slider5 from "@/assets/slider-5.webp";

import {
  SITE_URL,
  SITE_NAME,
  SITE_LOCALE,
  canonical,
  defaultOgImage,
  localBusinessSchema,
  breadcrumbSchema,
} from "@/components/seo-head";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Raajsi Jewels — Buy 925 Sterling Silver & Handcrafted Jewellery Online | Jaipur, India",
      },
      {
        name: "description",
        content:
          "Shop 925 Sterling Silver & Handcrafted Jewellery online from Raajsi Jewels, Jaipur. BIS Hallmark certified. Free delivery on all orders. 7 days easy exchange. Kundan, Polki, Meenakari & modern silver jewellery.",
      },
      {
        name: "keywords",
        content:
          "raajsi jewels, buy 925 sterling silver jewellery online, handcrafted jewellery jaipur, fine jewellery india, BIS hallmark silver jewellery, kundan polki meenakari, free delivery jewellery india",
      },
      {
        property: "og:title",
        content:
          "Raajsi Jewels — Buy 925 Sterling Silver & Handcrafted Jewellery | Jaipur",
      },
      {
        property: "og:description",
        content:
          "Two distinctive collections: refined Sterling Silver 925 and artistic Handcrafted Jewels. BIS Hallmark certified. Free delivery on all orders.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical("/") },
      { property: "og:image", content: defaultOgImage() },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: SITE_LOCALE },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Raajsi Jewels — 925 Silver & Handcrafted Jewellery | Jaipur",
      },
      {
        name: "twitter:description",
        content:
          "Shop BIS Hallmark certified jewellery. Free delivery on all orders. 7 days exchange.",
      },
      { name: "twitter:image", content: defaultOgImage() },
    ],
    links: [{ rel: "canonical", href: canonical("/") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessSchema()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([{ name: "Home", url: canonical("/") }]),
        ),
      },
    ],
  }),
  component: Home,
});

// ── GRAND HERO SLIDES (POWERED BY USER BANNERS SLIDER 1 TO 5) ────────
const HERO_SLIDES = [
  {
    id: "sterling-silver-clover",
    image: slider5,
    eyebrow: "Collection 01 · Sterling Silver 925",
    tag: "Modern • Minimal • Elegant",
    titlePrefix: "Modern. Elegant.",
    titleEm: "Timeless",
    titleSuffix: ".",
    description:
      "Our Sterling Silver collection is crafted in 925 Sterling Silver, offering a refined and versatile aesthetic for everyday elegance and special occasions. Designed with a modern, minimal approach.",
    primaryCta: { label: "Explore Sterling Silver", to: "/collection", search: { category: "sterling-silver" } },
    secondaryCta: { label: "About Raajsi", to: "/about" },
    caption: "925 Silver Clover Bracelet",
  },
  {
    id: "handcrafted-sunburst-onyx",
    image: slider1,
    eyebrow: "Collection 02 · Handcrafted Jewels",
    tag: "Artistic • Whimsical • Expressive",
    titlePrefix: "Artistic. Expressive.",
    titleEm: "Unique",
    titleSuffix: ".",
    description:
      "Our Handcrafted collection celebrates jewellery with character. Each piece is inspired by artistry, distinctive forms, colours, and traditional Jaipur craftsmanship designed for a contemporary wardrobe.",
    primaryCta: { label: "Explore Handcrafted", to: "/collection", search: { category: "handcrafted" } },
    secondaryCta: { label: "Our Philosophy", to: "/about" },
    caption: "Jaipur Sunburst Onyx Dangles",
  },
  {
    id: "jaipur-heritage-payal",
    image: slider3,
    eyebrow: "Raajsi · Jaipur, Rajasthan, India",
    tag: "Timeless Luxury, Crafted for You",
    titlePrefix: "Timeless Luxury,",
    titleEm: "Crafted for You",
    titleSuffix: ".",
    description:
      "Raajsi is a jewellery brand inspired by the beauty of timeless design, Indian craftsmanship, and modern elegance. We believe jewellery should reflect your individuality and cherish your finest moments.",
    primaryCta: { label: "Explore Both Collections", to: "/collection" },
    secondaryCta: { label: "Connect With Us", to: "/contact" },
    caption: "Heritage Artisan Payal",
  },
  {
    id: "understated-emerald-drops",
    image: slider2,
    eyebrow: "Collection 01 · Understated Luxury",
    tag: "Delicate Everyday Jewellery",
    titlePrefix: "Simplicity with",
    titleEm: "Sophisticated Detailing",
    titleSuffix: ".",
    description:
      "From delicate jewellery to contemporary statement pieces, the collection combines simplicity with sophisticated detailing. Made for those who appreciate understated everyday luxury.",
    primaryCta: { label: "Explore Sterling Silver", to: "/collection", search: { category: "sterling-silver" } },
    secondaryCta: { label: "Made to Be Yours", to: "/about" },
    caption: "Emerald Petal Drops",
  },
  {
    id: "artisan-leaf-ring",
    image: slider4,
    eyebrow: "Collection 02 · Artisan Form",
    tag: "Artistic • Expressive • Unique",
    titlePrefix: "Inspired by Artistry,",
    titleEm: "Shaped by Hand",
    titleSuffix: ".",
    description:
      "Created for those who want jewellery that feels expressive, unconventional, and personal. Distinctive forms, natural gemstone hues, and contemporary interpretations of traditional inspiration.",
    primaryCta: { label: "Explore Handcrafted", to: "/collection", search: { category: "handcrafted" } },
    secondaryCta: { label: "Our Atelier", to: "/about" },
    caption: "Golden Leaf & Tiger-Eye Ring",
  },
];

function Home() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [heroScrollY, setHeroScrollY] = useState(0);
  const touchStartXRef = useRef<number>(0);

  // Parallax tracking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight * 1.5) {
        setHeroScrollY(window.scrollY);
      }
    };
    const lenis = getLenis();
    if (lenis) lenis.on("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (lenis) lenis.off("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Slide interval
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 3200);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slideIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  // Products Query
  const products = useQuery({
    queryKey: ["jewellery-products"],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,medium,story,primary_image_url,gallery_image_urls,availability,display_price,price,metadata")
        .order("created_at", { ascending: false })
        .limit(48);
      if (!error && data && data.length > 0) return (data as unknown) as JewelleryProduct[];
      return MOCK_JEWELLERY_PRODUCTS;
    },
  });

  const allItems = products.data ?? [];

  // STAGE STRICT SEPARATION (PDF Section 6: "The two collections should not be mixed on the homepage or collection pages")
  const isSilver = (p: JewelleryProduct) => {
    const medium = (p.medium || "").toLowerCase();
    const material = (p.metadata?.material || "").toLowerCase();
    const title = (p.title || "").toLowerCase();
    const category = (p.metadata?.category || "").toLowerCase();
    return (
      medium.includes("silver") ||
      material.includes("silver") ||
      title.includes("silver") ||
      category.includes("silver")
    );
  };

  const silverItems = useMemo(() => allItems.filter(isSilver), [allItems]);
  const handcraftedItems = useMemo(() => allItems.filter((p) => !isSilver(p)), [allItems]);

  const currentSlide = HERO_SLIDES[slideIndex];

  return (
    <>
      {/* ── 1. GRAND SLIDING HERO SECTION ─────────────────────────── */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[88vh] md:h-[94vh] min-h-[640px] max-h-[1050px] overflow-hidden bg-ink text-paper select-none flex flex-col justify-between"
      >
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `translate3d(0, ${(heroScrollY * 0.3).toFixed(2)}px, 0)`,
          }}
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === slideIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={resolveImage(slide.image)}
                  alt={slide.titlePrefix}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className={`w-full h-full object-cover object-center ${
                    isActive ? "scale-105" : "scale-100"
                  } transition-transform duration-[8000ms]`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/70" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/50 to-transparent" />
              </div>
            );
          })}
        </div>

        {/* Top Live Brand Strip */}
        <div className="relative z-20 pt-6 md:pt-8 container-editorial">
          <div className="flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-paper/85 pb-4 border-b border-paper/15 backdrop-blur-[2px]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-[color:var(--gold)] text-sm tracking-widest">
                RAAJSI
              </span>
              <span className="text-paper/40">·</span>
              <span>Timeless Luxury</span>
              <span className="text-paper/40">·</span>
              <span>Jaipur, India</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-paper/70 font-mono text-[10px]">
              <span>Two Distinct Expressions</span>
              <span className="w-1 h-1 rounded-full bg-[color:var(--gold)]" />
              <span>925 Silver & Handcrafted</span>
            </div>
          </div>
        </div>

        {/* Main Content Box */}
        <div className="relative z-20 container-editorial my-auto py-8 md:py-12">
          <div className="max-w-3xl">
            {/* Live Jewellery Highlight Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-paper/15 border border-paper/20 rounded-full backdrop-blur-md mb-4 text-[11px] text-paper/90 shadow-sm">
              <Sparkles size={12} className="text-[color:var(--gold)]" />
              <span className="font-serif italic text-paper">{currentSlide.caption}</span>
              <span className="text-paper/40">·</span>
              <span className="text-[10px] tracking-wider uppercase text-[color:var(--gold)] font-medium">Jaipur Atelier</span>
            </div>

            <div className="flex items-center gap-3 mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="h-px w-8 md:w-12 bg-[color:var(--gold)]" />
              <span className="text-[11px] md:text-xs tracking-[0.24em] uppercase font-semibold text-[color:var(--gold)]">
                {currentSlide.eyebrow}
              </span>
            </div>

            <h1
              key={`title-${slideIndex}`}
              className="font-serif text-paper tracking-tight leading-[1.06] animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 5rem)" }}
            >
              {currentSlide.titlePrefix}{" "}
              <em
                className="italic font-normal transition-colors"
                style={{
                  color: "var(--gold)",
                  textShadow: "0 0 35px rgba(184, 134, 11, 0.4)",
                }}
              >
                {currentSlide.titleEm}
              </em>
              {currentSlide.titleSuffix}
            </h1>

            <p
              key={`desc-${slideIndex}`}
              className="mt-4 md:mt-6 text-sm md:text-lg text-paper/85 max-w-xl font-sans leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 font-light"
            >
              {currentSlide.description}
            </p>

            <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-4">
              <Link
                to={currentSlide.primaryCta.to}
                search={currentSlide.primaryCta.search}
                className="cta-gold shadow-2xl hover:scale-[1.02] transition-transform inline-flex items-center gap-2 py-3.5 px-8 text-xs md:text-sm font-medium tracking-[0.16em]"
              >
                <span>{currentSlide.primaryCta.label}</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                to={currentSlide.secondaryCta.to}
                className="cta-outline text-paper border-paper/40 hover:border-paper hover:bg-paper/10 py-3.5 px-7 text-xs md:text-sm tracking-[0.16em] backdrop-blur-sm"
              >
                {currentSlide.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Slide Controls & Interactive Thumbnails */}
        <div className="relative z-20 pb-6 md:pb-8 container-editorial">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-paper/15 backdrop-blur-[2px]">
            {/* Progress & Slide Count */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs tracking-widest text-[color:var(--gold)] font-medium">
                0{slideIndex + 1} <span className="text-paper/40">/ 0{HERO_SLIDES.length}</span>
              </span>

              <div className="flex gap-1.5 items-center">
                {HERO_SLIDES.map((slide, i) => {
                  const isActive = i === slideIndex;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => setSlideIndex(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="group relative py-2 focus:outline-none"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 relative overflow-hidden ${
                          isActive ? "w-10 md:w-14 bg-paper/25" : "w-3 md:w-5 bg-paper/20 hover:bg-paper/40"
                        }`}
                      >
                        {isActive && (
                          <div
                            key={`progress-${slideIndex}-${isPaused ? "p" : "r"}`}
                            className={`h-full bg-[color:var(--gold)] rounded-full ${
                              !isPaused ? "animate-hero-progress" : "w-full"
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Luxury Thumbnails Strip (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              {HERO_SLIDES.map((slide, i) => {
                const isActive = i === slideIndex;
                return (
                  <button
                    key={`thumb-${slide.id}`}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    className={`flex items-center gap-2.5 p-1.5 pr-3 rounded border text-left transition-all backdrop-blur-md ${
                      isActive
                        ? "bg-paper/25 border-[color:var(--gold)] text-paper shadow-md scale-[1.03]"
                        : "bg-ink/50 border-paper/15 text-paper/70 hover:bg-paper/15 hover:border-paper/30"
                    }`}
                  >
                    <div className="w-10 h-7 rounded overflow-hidden relative shrink-0 border border-paper/20">
                      <img
                        src={resolveImage(slide.image)}
                        alt={slide.caption}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-wider text-[color:var(--gold)] font-mono font-medium">
                        0{i + 1}
                      </span>
                      <span className="text-[10px] font-serif font-medium leading-tight text-paper truncate max-w-[90px]">
                        {slide.caption}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="w-10 h-10 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md text-paper flex items-center justify-center hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Slide"
                className="w-10 h-10 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md text-paper flex items-center justify-center hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────────── */}
      <TrustStrip />

      {/* ── 2. TWO DISTINCT EXPRESSIONS INTRO BANNER ────────────────── */}
      <section className="bg-mist/30 py-16 md:py-20 border-b border-hairline">
        <div className="container-editorial">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-2">
              Our Collections
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-ink">
              Two Distinct Expressions
            </h2>
            <p className="mt-3 text-sm text-ink/75 leading-relaxed font-light">
              Explore two distinctive expressions of Raajsi jewellery — refined Sterling Silver and artistic handcrafted pieces.
              Never mixed, each crafted with its own character.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Card 1: Sterling Silver 925 with visual banner */}
            <div className="border border-hairline bg-paper overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group">
              <div className="relative aspect-[16/7] overflow-hidden">
                <img
                  src={resolveImage(slider5)}
                  alt="Collection 01 · Sterling Silver 925"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-mono bg-paper/90 backdrop-blur text-ink px-2.5 py-1 rounded-xs uppercase tracking-widest font-semibold">
                    Collection 01
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-paper">
                  <div className="text-xs uppercase tracking-widest text-[color:var(--gold)] font-medium">
                    Modern • Minimal • Elegant
                  </div>
                  <div className="font-serif text-xl font-medium text-paper">
                    Sterling Silver 925
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-sm text-ink/80 leading-relaxed font-light">
                  Our Sterling Silver collection is crafted in 925 Sterling Silver, offering a refined and versatile aesthetic for everyday elegance and special occasions.
                </p>
                <div className="pt-2">
                  <Link
                    to="/collection"
                    search={{ category: "sterling-silver" }}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] bg-ink text-paper px-6 py-3 hover:bg-ink/90 transition-colors rounded-xs"
                  >
                    <span>Explore Sterling Silver</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Handcrafted Jewels with visual banner */}
            <div className="border border-hairline bg-paper overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group">
              <div className="relative aspect-[16/7] overflow-hidden">
                <img
                  src={resolveImage(slider1)}
                  alt="Collection 02 · Handcrafted Jewels"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-mono bg-paper/90 backdrop-blur text-ink px-2.5 py-1 rounded-xs uppercase tracking-widest font-semibold">
                    Collection 02
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-paper">
                  <div className="text-xs uppercase tracking-widest text-[color:var(--gold)] font-medium">
                    Artistic • Whimsical • Expressive
                  </div>
                  <div className="font-serif text-xl font-medium text-paper">
                    Handcrafted Jewels
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-sm text-ink/80 leading-relaxed font-light">
                  Our Handcrafted collection celebrates jewellery with character. Inspired by artistry, distinctive forms, colours, textures, and traditional Indian craftsmanship.
                </p>
                <div className="pt-2">
                  <Link
                    to="/collection"
                    search={{ category: "handcrafted" }}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] border border-ink text-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors rounded-xs"
                  >
                    <span>Explore Handcrafted</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. COLLECTION 01: STERLING SILVER 925 (SEPARATE SECTION) ── */}
      <section className="bg-paper py-16 md:py-24 border-b border-hairline">
        <div className="container-editorial">
          <Reveal className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-hairline">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[color:var(--gold)] font-semibold mb-1">
                  Collection 01
                </div>
                <h2 className="font-serif text-3xl md:text-4xl text-ink">
                  Sterling Silver 925
                </h2>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1 font-medium">
                  Modern. Elegant. Timeless.
                </p>
                <p className="text-sm text-ink/75 max-w-2xl mt-2 leading-relaxed font-light">
                  Our Sterling Silver collection is crafted in 925 Sterling Silver, offering a refined and versatile aesthetic
                  for everyday elegance and special occasions. Designed with a modern and minimal approach, these pieces are
                  made for those who appreciate understated luxury.
                </p>
              </div>

              <Link
                to="/collection"
                search={{ category: "sterling-silver" }}
                className="cta-gold self-start md:self-auto text-xs uppercase tracking-widest px-6 py-3 inline-flex items-center gap-2"
              >
                <span>Explore Sterling Silver</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          {/* Editorial Banner for Silver Collection (Using slider-2) */}
          <div className="relative overflow-hidden rounded-xs border border-hairline mb-8 group shadow-xs">
            <div className="aspect-[24/8] md:aspect-[32/9] max-h-[260px] w-full relative">
              <img
                src={resolveImage(slider2)}
                alt="Sterling Silver 925 - Modern, Minimal, Elegant"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent flex items-center">
                <div className="p-6 md:p-10 max-w-xl text-paper space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-mono font-semibold">
                    The Modern Minimalist Edit
                  </span>
                  <h3 className="font-serif text-xl md:text-3xl text-paper">
                    Understated Luxury for Every Moment
                  </h3>
                  <p className="text-xs md:text-sm text-paper/85 leading-relaxed line-clamp-2 font-light">
                    From delicate everyday pieces to contemporary statement designs, each piece is hallmarked for purity and crafted for timeless longevity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 p-4 bg-mist/30 border border-hairline text-xs">
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span className="font-medium">925 Sterling Silver</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Modern & minimal</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Elegant everyday</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Versatile styling</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Timeless aesthetic</span>
            </div>
          </div>

          {/* Silver Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {silverItems.slice(0, 8).map((product) => (
              <Reveal key={product.id || product.slug}>
                <JewelleryCard product={product} />
              </Reveal>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/collection"
              search={{ category: "sterling-silver" }}
              className="text-xs uppercase tracking-[0.2em] font-medium text-ink hover:text-[color:var(--gold)] underline transition-colors"
            >
              View all {silverItems.length} Sterling Silver 925 pieces →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. COLLECTION 02: HANDCRAFTED JEWELS (SEPARATE SECTION) ── */}
      <section className="bg-mist/40 py-16 md:py-24 border-b border-hairline">
        <div className="container-editorial">
          <Reveal className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-hairline">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[color:var(--gold)] font-semibold mb-1">
                  Collection 02
                </div>
                <h2 className="font-serif text-3xl md:text-4xl text-ink">
                  Handcrafted Jewels
                </h2>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1 font-medium">
                  Artistic. Expressive. Unique.
                </p>
                <p className="text-sm text-ink/75 max-w-2xl mt-2 leading-relaxed font-light">
                  Our Handcrafted collection celebrates jewellery with character. Each piece is inspired by artistry,
                  distinctive forms, colours, textures, and traditional influences while being designed to complement a
                  contemporary wardrobe. These pieces are created for those who want jewellery that feels expressive,
                  unconventional, and personal.
                </p>
              </div>

              <Link
                to="/collection"
                search={{ category: "handcrafted" }}
                className="bg-ink text-paper hover:bg-ink/90 text-xs uppercase tracking-widest px-6 py-3 inline-flex items-center gap-2 transition-colors rounded-xs"
              >
                <span>Explore Handcrafted</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          {/* Editorial Banner for Handcrafted Jewels (Using slider-4) */}
          <div className="relative overflow-hidden rounded-xs border border-hairline mb-8 group shadow-xs">
            <div className="aspect-[24/8] md:aspect-[32/9] max-h-[260px] w-full relative">
              <img
                src={resolveImage(slider4)}
                alt="Handcrafted Jewels - Artistic, Whimsical, Expressive"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent flex items-center">
                <div className="p-6 md:p-10 max-w-xl text-paper space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-mono font-semibold">
                    The Artisan Heritage Edit
                  </span>
                  <h3 className="font-serif text-xl md:text-3xl text-paper">
                    Jewellery with Distinct Character & Soul
                  </h3>
                  <p className="text-xs md:text-sm text-paper/85 leading-relaxed line-clamp-2 font-light">
                    Inspired by traditional Rajasthani craft, sculptural textures, and warm gemstone hues shaped into wearable art.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 p-4 bg-paper border border-hairline text-xs">
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span className="font-medium">Handcrafted designs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Artistic forms</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Expressive styling</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Statement & occasion</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Check size={13} className="text-[color:var(--gold)]" />
              <span>Traditional inspiration</span>
            </div>
          </div>

          {/* Handcrafted Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {handcraftedItems.slice(0, 8).map((product) => (
              <Reveal key={product.id || product.slug}>
                <JewelleryCard product={product} />
              </Reveal>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/collection"
              search={{ category: "handcrafted" }}
              className="text-xs uppercase tracking-[0.2em] font-medium text-ink hover:text-[color:var(--gold)] underline transition-colors"
            >
              View all {handcraftedItems.length} Handcrafted pieces →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. ABOUT RAAJSI & OUR PHILOSOPHY (EXACT COPY FROM PDF) ─── */}
      <section className="bg-paper py-20 md:py-28 border-b border-hairline">
        <div className="container-editorial">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Image with Atelier Details (Using slider-3) */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] bg-paper overflow-hidden border border-hairline shadow-lg relative group rounded-xs">
                <img
                  src={resolveImage(slider3)}
                  alt="Raajsi Traditional Indian Jewellery Craftsmanship, Jaipur"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 bg-paper/95 backdrop-blur p-4 border border-hairline shadow-md">
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold)] font-semibold">
                    Jaipur Atelier & Origin
                  </div>
                  <div className="font-serif text-lg text-ink font-medium">
                    Jaipur, Rajasthan, India
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Where traditional Indian craftsmanship meets modern elegance.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Exact PDF Content */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-2">
                  1. About Us
                </span>
                <h2 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
                  About Raajsi
                </h2>
                <p className="font-serif text-xl md:text-2xl text-ink/90 italic mt-2">
                  Timeless Luxury, Crafted for You
                </p>
              </div>

              <p className="text-sm md:text-base text-ink/85 leading-relaxed font-light">
                Raajsi is a jewellery brand inspired by the beauty of timeless design, Indian craftsmanship,
                and modern elegance.
              </p>

              <p className="text-sm md:text-base text-ink/85 leading-relaxed font-light">
                We believe jewellery should be more than an accessory — it should reflect your personality,
                complement your individuality, and become a part of the moments you cherish.
              </p>

              <p className="text-sm md:text-base text-ink/85 leading-relaxed font-light">
                From minimal everyday pieces to distinctive handcrafted designs, Raajsi brings together
                contemporary aesthetics and traditional craftsmanship to create jewellery that feels both
                elegant and personal.
              </p>

              {/* Our Philosophy Box */}
              <div className="border border-hairline bg-mist/40 p-6 md:p-8 space-y-3 rounded-sm">
                <h3 className="font-serif text-xl text-ink font-medium">
                  Our Philosophy
                </h3>
                <p className="text-sm text-ink/80 italic font-serif leading-relaxed">
                  "At Raajsi, we believe luxury does not always have to be extravagant. True luxury lies in
                  thoughtful design, quality, craftsmanship, and the feeling a piece gives you when you wear it."
                </p>
                <div className="pt-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ink block mb-2">
                    Our pieces are created with an emphasis on:
                  </span>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs text-ink/80">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Timeless aesthetics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Thoughtful craftsmanship</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Contemporary design</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Individual expression</span>
                    </li>
                    <li className="flex items-center gap-2 col-span-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Versatility for everyday and occasion wear</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Made to Be Yours Note */}
              <div className="pt-2">
                <p className="text-sm text-ink/80 font-serif italic mb-4">
                  "Every piece carries its own character. From the clean elegance of our Sterling Silver collection
                  to the artistic charm of our handcrafted jewellery, Raajsi celebrates different expressions of beauty."
                </p>
                <div className="flex items-center gap-4">
                  <Link to="/about" className="cta-gold text-xs uppercase tracking-widest py-3 px-6 inline-flex items-center gap-2">
                    <span>Read Full About Story</span>
                    <ArrowRight size={14} />
                  </Link>
                  <span className="font-serif text-sm font-medium text-ink">
                    Raajsi — Timeless Luxury.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CONNECT WITH RAAJSI SECTION (PDF Section 3 & 10) ──────── */}
      <section className="bg-mist/30 py-16 md:py-20 border-b border-hairline">
        <div className="container-editorial">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block">
                Connect With Raajsi
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-ink">
                We'd Love to Hear From You
              </h2>
              <p className="text-sm text-ink/75 leading-relaxed font-light max-w-xl">
                Have a question about a product, your order, shipping, or anything else? Our team would be happy to help.
                Whether you're looking for more information about a piece or simply want to connect with Raajsi, feel free to reach out.
              </p>

              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-ink block mb-2">
                  Follow us on social media for:
                </span>
                <ul className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>New collection launches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>New arrivals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Styling inspiration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Jewellery stories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Special offers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Behind-the-scenes content</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Clickable Action Buttons (Page 4 & 7) */}
            <div className="md:col-span-5 bg-paper p-6 md:p-8 border border-hairline space-y-4 rounded-sm shadow-xs">
              <h3 className="font-serif text-lg text-ink font-medium border-b border-hairline pb-2">
                Direct Contact & Social Links
              </h3>
              <p className="text-xs text-muted-foreground">
                Jaipur, Rajasthan, India
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="https://instagram.com/raajsi_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-hairline hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs"
                >
                  <Instagram size={14} className="text-pink-600" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://facebook.com/raajsiofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-hairline hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs"
                >
                  <Facebook size={14} className="text-blue-600" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://wa.me/919829012345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-hairline hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs"
                >
                  <MessageCircle size={14} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+919829012345"
                  className="p-3 border border-hairline hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs"
                >
                  <Phone size={14} />
                  <span>Call Us</span>
                </a>
              </div>

              <div className="pt-3 border-t border-hairline text-center">
                <Link
                  to="/contact"
                  className="text-xs uppercase tracking-widest text-[color:var(--gold)] hover:text-ink font-medium underline"
                >
                  Open Contact Form →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
