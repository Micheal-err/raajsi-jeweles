import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";
import { Reveal } from "@/components/Reveal";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { TrustStrip } from "@/components/TrustStrip";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { Parallax, ParallaxImage } from "@/components/Parallax";
import { getLenis } from "@/components/SmoothScroll";
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Award,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";

import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroImg from "@/assets/jewellery-hero.png";
import interiorImg from "@/assets/gallery-interior.jpg";
import blog1Img from "@/assets/jewellery-rings.png";
import blog2Img from "@/assets/jewellery-hero.png";
import blog3Img from "@/assets/jewellery-mens.png";
import womenBannerImg from "@/assets/jewellery-rings.png";
import menBannerImg from "@/assets/jewellery-mens.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Raajsi Jewels — Fine Indian Jewellery, Jaipur" },
      {
        name: "description",
        content:
          "Exquisite royal Indian jewellery from Raajsi Jewels, Jaipur. Certified BIS 916 Hallmark, Kundan Jadau, uncut Polki diamonds, Meenakari bangles, and solid 22K gold heirlooms.",
      },
      { property: "og:title", content: "Raajsi Jewels — Fine Indian Jewellery, Jaipur" },
      {
        property: "og:description",
        content:
          "Shop handcrafted royal Indian jewellery. Certified BIS Hallmark on every creation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const SUBCATEGORIES = [
  "All",
  "Rings",
  "Chains",
  "Bracelets",
  "Earrings",
  "Bangles",
  "Pendants",
  "Anklets",
  "Nose Rings",
  "Kadas",
];

const GENDERS = ["All", "Women", "Men", "Unisex"];

// ── GRAND LUXURY HERO SLIDES ─────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: "royal-bridal",
    image: heroSlide1,
    eyebrow: "The Royal Bridal Suite · Jaipur",
    tag: "22K Solid Gold & Polki",
    titlePrefix: "Where Heritage",
    titleEm: "Crowns Royalty",
    titleSuffix: ".",
    description:
      "Handcrafted 22-Karat gold Kundan Jadau chokers, uncut natural Polki diamonds & Colombian emeralds forged by Jaipur's master artisan families.",
    primaryCta: { label: "Explore Bridal Suite", to: "/collection" },
    secondaryCta: { label: "Book Consultation", to: "/contact" },
  },
  {
    id: "temple-gold",
    image: heroSlide2,
    eyebrow: "Imperial Meenakari & Temple Gold",
    tag: "Certified BIS 916 Hallmark",
    titlePrefix: "Eternal Gold,",
    titleEm: "Poetry in Metal",
    titleSuffix: ".",
    description:
      "Centuries-old Rajasthani enamel art, antique floral filigree, and solid 22K kadas alongside brilliant GIA-certified diamond solitaires.",
    primaryCta: { label: "Discover Bangles & Rings", to: "/collection" },
    secondaryCta: { label: "Our Atelier Heritage", to: "/about" },
  },
  {
    id: "mens-imperial",
    image: menBannerImg,
    eyebrow: "The Gentlemen's Imperial Suite",
    tag: "Solid 22K Gold & Platinum",
    titlePrefix: "Regal Power,",
    titleEm: "Modern Legacy",
    titleSuffix: ".",
    description:
      "Heavy hand-forged 22K solid gold kadas, Italian anchor chains, and royal Navratna signet rings engineered for timeless masculine distinction.",
    primaryCta: { label: "Explore Men's Collection", to: "/collection" },
    secondaryCta: { label: "Bespoke Commissions", to: "/inquire" },
  },
  {
    id: "high-jewellery",
    image: heroImg,
    eyebrow: "Jaipur Haute Joaillerie · Est. 2009",
    tag: "Insured Express Delivery",
    titlePrefix: "Masterpieces of",
    titleEm: "Pure Distinction",
    titleSuffix: ".",
    description:
      "Every piece is individually certified by government-approved BIS assaying centres, delivered in velvet presentation caskets with lifetime purity guarantee.",
    primaryCta: { label: "Shop Fine Jewellery", to: "/collection" },
    secondaryCta: { label: "Direct WhatsApp Desk", to: "/contact" },
  },
];

// Blogs / Articles
const BLOG_POSTS = [
  {
    id: "bis-hallmarking-guide",
    title: "Understanding BIS 916 Hallmarking: What Every Buyer Must Know",
    category: "Purity & Trust",
    readTime: "5 min read",
    date: "Sep 10, 2026",
    excerpt:
      "Learn how to inspect hallmarking symbols, verify purity grades (916 22K & 925 Silver), and ensure your investment holds lifetime value.",
    image: blog1Img,
  },
  {
    id: "kundan-vs-polki-guide",
    title: "Bridal Kundan vs. Polki: Craft History & Selecting Your Wedding Jewellery",
    category: "Bridal Style",
    readTime: "7 min read",
    date: "Aug 28, 2026",
    excerpt:
      "Explore the rich Rajasthani heritage of Jaipur's uncut diamonds and gold-foil gemstone settings for your grand wedding look.",
    image: blog2Img,
  },
  {
    id: "mens-jewellery-styling-2026",
    title: "The Modern Gentleman's Guide to Gold Kadas & Silver Chains",
    category: "Men's Styling",
    readTime: "4 min read",
    date: "Aug 15, 2026",
    excerpt:
      "How to effortlessly style handcrafted solid gold kadas and silver chains with traditional sherwanis as well as contemporary suits.",
    image: blog3Img,
  },
];

function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGender, setActiveGender] = useState("All");
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [heroScrollY, setHeroScrollY] = useState(0);
  const touchStartXRef = useRef<number>(0);

  // Parallax tracking for hero background
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight * 1.5) {
        setHeroScrollY(window.scrollY);
      }
    };

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (lenis) lenis.off("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Auto-advance hero slides every 2.75s (reduced by half)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 2750);
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

  // Touch Swipe handlers
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
        .select(
          "id,slug,title,medium,story,primary_image_url,availability,display_price,price,metadata"
        )
        .order("created_at", { ascending: false })
        .limit(48);
      if (!error && data && data.length > 0) return ((data ?? []) as unknown) as JewelleryProduct[];
      return MOCK_JEWELLERY_PRODUCTS;
    },
  });

  const items = products.data ?? [];

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const sub = p.metadata?.subcategory?.toLowerCase() ?? "";
      const gender = p.metadata?.gender?.toLowerCase() ?? "";
      if (activeCategory !== "All" && sub !== activeCategory.toLowerCase()) return false;
      if (activeGender !== "All" && gender !== activeGender.toLowerCase()) return false;
      return true;
    });
  }, [items, activeCategory, activeGender]);

  const currentSlide = HERO_SLIDES[slideIndex];

  return (
    <>
      {/* ── BIG GRAND SLIDING HERO SECTION ────────────────────────── */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[88vh] md:h-[94vh] min-h-[660px] max-h-[1050px] overflow-hidden bg-ink text-paper select-none flex flex-col justify-between"
      >
        {/* Sliding Background Images with Ken Burns and Scroll Parallax */}
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `translate3d(0, ${(heroScrollY * 0.32).toFixed(2)}px, 0)`,
          }}
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === slideIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-600 ease-in-out ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={resolveImage(slide.image)}
                  alt={slide.titlePrefix}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className={`w-full h-full object-cover object-center ${
                    isActive ? "ken-burns scale-105" : "scale-100"
                  } transition-transform duration-[8000ms]`}
                />
                {/* Multi-layered Vignette & Contrast Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/75" />
                <div className="absolute inset-0 bg-radial-vignette opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
              </div>
            );
          })}
        </div>

        {/* Top Gold Live Strip */}
        <div className="relative z-20 pt-6 md:pt-8 container-editorial">
          <div className="flex items-center justify-between text-[10px] md:text-[11px] tracking-[0.26em] uppercase text-paper/85 pb-4 border-b border-paper/15 backdrop-blur-[2px]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[color:var(--gold)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--gold)]" />
              </span>
              <span className="font-medium">Showroom & Atelier Open · C-Scheme, Jaipur</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-paper/70">
              <span>{currentSlide.tag}</span>
              <span className="w-1 h-1 rounded-full bg-paper/40" />
              <span>Est. 2009</span>
            </div>
          </div>
        </div>

        {/* Main Content Box with Subtle Parallax Float */}
        <div className="relative z-20 container-editorial my-auto py-8 md:py-12">
          <div className="max-w-3xl">
            {/* Slide Eyebrow Badge */}
            <div className="flex items-center gap-3 mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 key={slideIndex}">
              <span className="h-px w-8 md:w-12 bg-[color:var(--gold)]" />
              <span className="text-[11px] md:text-xs tracking-[0.24em] uppercase font-semibold text-[color:var(--gold)]">
                {currentSlide.eyebrow}
              </span>
            </div>

            {/* Grand Serif Headline */}
            <h1
              key={`title-${slideIndex}`}
              className="font-serif text-paper tracking-tight leading-[1.06] animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ fontSize: "clamp(2.5rem, 5.8vw, 5.2rem)" }}
            >
              {currentSlide.titlePrefix}{" "}
              <em
                className="italic font-normal transition-colors"
                style={{
                  color: "var(--gold)",
                  textShadow: "0 0 40px rgba(184, 134, 11, 0.4)",
                }}
              >
                {currentSlide.titleEm}
              </em>
              {currentSlide.titleSuffix}
            </h1>

            {/* Subhead Description */}
            <p
              key={`desc-${slideIndex}`}
              className="mt-4 md:mt-6 text-sm md:text-lg text-paper/85 max-w-xl font-sans leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100"
            >
              {currentSlide.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-4">
              <Link
                to={currentSlide.primaryCta.to}
                className="cta-gold shadow-2xl hover:scale-[1.02] transition-transform inline-flex items-center gap-2 py-3.5 px-8 text-xs md:text-sm font-medium tracking-[0.16em]"
              >
                {currentSlide.primaryCta.label} <ArrowRight size={15} />
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

        {/* Bottom Interactive Navigation Bar */}
        <div className="relative z-20 pb-6 md:pb-8 container-editorial">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-paper/15">
            {/* Slide Indicators & Animated Progress Bar */}
            <div className="flex items-center gap-4 md:gap-6">
              <span className="font-mono text-xs tracking-widest text-[color:var(--gold)] font-medium">
                0{slideIndex + 1} <span className="text-paper/40">/ 0{HERO_SLIDES.length}</span>
              </span>

              <div className="flex gap-2 items-center">
                {HERO_SLIDES.map((slide, i) => {
                  const isActive = i === slideIndex;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => setSlideIndex(i)}
                      aria-label={`Slide ${i + 1}: ${slide.eyebrow}`}
                      className="group relative py-2 focus:outline-none"
                    >
                      <div
                        className={`h-1 rounded-full transition-all duration-300 relative overflow-hidden ${
                          isActive ? "w-12 md:w-16 bg-paper/25" : "w-4 md:w-6 bg-paper/20 hover:bg-paper/40"
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

            {/* Desktop Slide Preview Badges & Arrow Controls */}
            <div className="flex items-center gap-4">
              {/* Desktop Slide Label Preview */}
              <div className="hidden lg:block text-right">
                <div className="text-[10px] tracking-[0.2em] uppercase text-paper/50">Next Creation</div>
                <div className="text-xs font-serif italic text-paper/90 truncate max-w-[200px]">
                  {HERO_SLIDES[(slideIndex + 1) % HERO_SLIDES.length].titleEm}
                </div>
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous Slide"
                  className="w-10 h-10 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md text-paper flex items-center justify-center hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] hover:bg-paper/10 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next Slide"
                  className="w-10 h-10 rounded-full border border-paper/20 bg-ink/40 backdrop-blur-md text-paper flex items-center justify-center hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] hover:bg-paper/10 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────── */}
      <TrustStrip />

      {/* ── BIG CATEGORY SHOWCASE (WITH PARALLAX DEPTH) ───────────── */}
      <section className="bg-mist/30 py-16 md:py-28 border-b border-hairline overflow-hidden">
        <div className="container-editorial">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>
              Curated Collections
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-ink">
              Designed for Distinction
            </h2>
            <p className="mt-3 text-sm text-ink/65 leading-relaxed">
              Select your preferred category to explore certified 22K gold, uncut Polki, and sterling silver statement pieces.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* WOMEN'S BIG CARD WITH PARALLAX */}
            <Reveal>
              <div className="group relative h-[500px] md:h-[600px] overflow-hidden border border-hairline bg-ink text-paper flex flex-col justify-end p-8 md:p-12 shadow-xl rounded-sm">
                <Parallax speed={0.14} className="absolute inset-0 w-full h-[120%] -top-[10%]">
                  <img
                    src={resolveImage(womenBannerImg)}
                    alt="Women's Royal Jewellery Collection"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-75"
                  />
                </Parallax>
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[color:var(--gold)] px-3 py-1 bg-ink/80 border border-[color:var(--gold)]/40 inline-block mb-3 backdrop-blur-sm">
                    Royal Heritage
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-paper mb-2">
                    Women's Collection
                  </h3>
                  <p className="text-sm text-paper/85 max-w-md mb-6 leading-relaxed">
                    Handcrafted Kundan necklaces, uncut Polki earrings, Meenakari bangles, and imperial bridal statement sets.
                  </p>
                  <button
                    onClick={() => {
                      setActiveGender("Women");
                      const el = document.getElementById("shop");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="cta-gold inline-flex items-center gap-2"
                  >
                    Explore Women's Suite <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* MEN'S BIG CARD WITH PARALLAX */}
            <Reveal delayMs={100}>
              <div className="group relative h-[500px] md:h-[600px] overflow-hidden border border-hairline bg-ink text-paper flex flex-col justify-end p-8 md:p-12 shadow-xl rounded-sm">
                <Parallax speed={0.14} className="absolute inset-0 w-full h-[120%] -top-[10%]">
                  <img
                    src={resolveImage(menBannerImg)}
                    alt="Men's Heritage Jewellery Collection"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-75"
                  />
                </Parallax>
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[color:var(--gold)] px-3 py-1 bg-ink/80 border border-[color:var(--gold)]/40 inline-block mb-3 backdrop-blur-sm">
                    Classic Distinction
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-paper mb-2">
                    Men's Collection
                  </h3>
                  <p className="text-sm text-paper/85 max-w-md mb-6 leading-relaxed">
                    Solid gold kadas, sterling silver chains, signet rings, and understated bracelets for the modern gentleman.
                  </p>
                  <button
                    onClick={() => {
                      setActiveGender("Men");
                      const el = document.getElementById("shop");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="cta-outline text-paper border-paper hover:bg-paper hover:text-ink inline-flex items-center gap-2"
                  >
                    Explore Men's Suite <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SHOP CATALOGUE ───────────────────────────────────────── */}
      <section id="shop" className="bg-paper py-16 md:py-24">
        <div className="container-editorial">
          {/* Header */}
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>
                Our Live Catalogue
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-ink">
                Fine Jewellery — <em className="italic">every price transparent</em>.
              </h2>
              <p className="mt-2 text-sm text-ink/65 max-w-xl">
                BIS Hallmark certified. Add directly to your bag for seamless checkout with insured pan-India delivery.
              </p>
            </div>
            <Link to="/collection" className="cta-outline self-start md:self-auto">
              Browse Entire Vault →
            </Link>
          </Reveal>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-hairline items-center">
            <SlidersHorizontal size={14} className="text-ink/40 mr-1" />

            {/* Gender filter */}
            <div className="flex gap-1">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGender(g)}
                  className={`text-[11px] tracking-wider uppercase px-3.5 py-1.5 border transition-all ${
                    activeGender === g
                      ? "border-[color:var(--gold)] text-[color:var(--gold)] bg-[color:var(--gold)]/10 font-medium"
                      : "border-hairline text-ink/60 hover:border-ink/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <span className="w-px h-4 bg-hairline" />

            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              {SUBCATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[11px] tracking-wider uppercase px-3 py-1.5 border transition-all ${
                    activeCategory === cat
                      ? "border-[color:var(--gold)] text-[color:var(--gold)] bg-[color:var(--gold)]/10 font-medium"
                      : "border-hairline text-ink/60 hover:border-ink/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="ml-auto text-xs text-ink/40 tabular-nums font-mono">
              {filtered.length} piece{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Product Grid */}
          {products.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-mist animate-pulse rounded-sm" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-xl text-ink/50 mb-4">No pieces in this category yet.</p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setActiveGender("All");
                }}
                className="text-sm underline text-[color:var(--gold)]"
              >
                Show all jewellery pieces →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.slice(0, 24).map((product) => (
                <Reveal key={product.slug}>
                  <JewelleryCard product={product} />
                </Reveal>
              ))}
            </div>
          )}

          {filtered.length > 24 && (
            <div className="text-center mt-12">
              <Link to="/collection" className="cta-gold">
                View all {filtered.length} pieces in collection →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── BRAND STORY & WORKSHOP (WITH DUAL-PLANE PARALLAX) ──────── */}
      <section className="bg-mist/50 py-16 md:py-28 border-t border-b border-hairline overflow-hidden">
        <div className="container-editorial">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Image & Floating Badge with Depth */}
            <div className="lg:col-span-6 relative">
              <div className="aspect-[4/3] bg-paper overflow-hidden border border-hairline shadow-xl relative group">
                <Parallax speed={0.16} className="w-full h-[120%] -top-[10%] absolute inset-0">
                  <img
                    src={resolveImage(interiorImg)}
                    alt="Raajsi Jewels Showroom & Workshop Jaipur"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </Parallax>
              </div>

              {/* Counter-Parallax Floating Card */}
              <Parallax
                speed={-0.12}
                className="absolute -bottom-6 -right-6 md:bottom-6 md:right-6 bg-ink text-paper p-6 max-w-xs border border-hairline shadow-2xl z-20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} style={{ color: "var(--gold)" }} />
                  <span className="text-xs uppercase tracking-widest text-[color:var(--gold)] font-semibold">
                    Jaipur Craftsmanship
                  </span>
                </div>
                <p className="text-xs text-paper/85 leading-relaxed font-sans">
                  Every gold piece is certified at government-approved BIS assaying centres before entering our showcase.
                </p>
              </Parallax>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div>
                <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>
                  Our Heritage & Philosophy
                </div>
                <h2 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
                  Crafted in Rajasthan, <em className="italic">cherished worldwide</em>.
                </h2>
              </div>

              <p className="text-sm md:text-base text-ink/75 leading-relaxed">
                Founded in 2009 in the pink city of Jaipur, Raajsi Jewels bridges generations of royal goldsmithing traditions with transparent, modern retail. We work directly with master karigars to create pieces of enduring purity and grace.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-paper border border-hairline shadow-sm">
                  <ShieldCheck size={20} className="text-[color:var(--gold)] mb-2" />
                  <h4 className="font-serif text-base font-semibold text-ink">100% BIS Hallmarked</h4>
                  <p className="text-xs text-ink/60 mt-1">Guaranteed 916 gold & 925 silver purity on every creation.</p>
                </div>

                <div className="p-4 bg-paper border border-hairline shadow-sm">
                  <Sparkles size={20} className="text-[color:var(--gold)] mb-2" />
                  <h4 className="font-serif text-base font-semibold text-ink">Master Karigars</h4>
                  <p className="text-xs text-ink/60 mt-1">Hand-set Kundan & Polki by Jaipur’s finest artisan families.</p>
                </div>
              </div>

              <div>
                <Link to="/about" className="cta-gold inline-flex items-center gap-2 mt-2">
                  Read Our Full Story <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JEWELLERY JOURNAL (BLOGS) ─────────────────────────────── */}
      <section className="bg-paper py-16 md:py-24">
        <div className="container-editorial">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>
                The Jewellery Journal
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-ink">
                Guides, Styling & Heritage Insights
              </h2>
              <p className="mt-2 text-sm text-ink/65 max-w-xl">
                Expert tips on gold purity, bridal jewellery selection, and caring for heirlooms.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[color:var(--gold)] font-medium">
              <BookOpen size={16} /> 3 Curated Guides
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <Reveal key={post.id}>
                <article className="group bg-paper border border-hairline overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[16/10] overflow-hidden bg-mist relative">
                    <img
                      src={resolveImage(post.image)}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest bg-ink text-paper px-2.5 py-1 font-medium">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/40 mb-2 font-mono">
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="font-serif text-lg font-medium text-ink leading-snug group-hover:text-[color:var(--gold)] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-ink/70 leading-relaxed mt-2 line-clamp-3 font-sans">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-hairline">
                      <Link
                        to="/about"
                        className="text-xs font-medium text-[color:var(--gold)] group-hover:underline flex items-center gap-1"
                      >
                        Read Article <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP WITH RADIAL PARALLAX ──────────────────────── */}
      <section className="bg-ink text-paper py-16 md:py-24 relative overflow-hidden">
        <Parallax speed={0.2} className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full opacity-15"
            style={{
              background: "radial-gradient(circle at 40% 50%, var(--gold), transparent 70%)",
            }}
          />
        </Parallax>
        <div className="container-editorial relative grid md:grid-cols-3 gap-8">
          {[
            { n: "2009", label: "Est. Jaipur", desc: "16 years of fine jewellery craftsmanship in Rajasthan's pink city." },
            { n: "BIS", label: "916 Hallmarked", desc: "Every gold and silver piece certified at government assaying centres." },
            { n: "500+", label: "Pieces Crafted", desc: "From bridal Kundan sets to modern silver — made by master karigars." },
          ].map((stat) => (
            <div key={stat.n} className="flex flex-col gap-2 p-8 bg-paper/5 border border-paper/10 backdrop-blur-sm">
              <div className="font-serif text-4xl md:text-5xl" style={{ color: "var(--gold)" }}>
                {stat.n}
              </div>
              <div className="eyebrow text-paper/60">{stat.label}</div>
              <p className="text-sm text-paper/75 leading-relaxed">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────── */}
      <section className="bg-mist border-t border-hairline py-16">
        <div className="container-editorial grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>Stay updated</div>
            <h2 className="font-serif text-2xl md:text-4xl text-ink">
              New collections, bridal previews & festive offers.
            </h2>
            <p className="mt-2 text-sm text-ink/60">One monthly letter from our atelier directors. Unsubscribe anytime.</p>
          </div>
          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}
