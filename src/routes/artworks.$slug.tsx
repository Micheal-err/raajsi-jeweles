import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { useAddToCart, useCart } from "@/hooks/useCommerce";
import { Reveal } from "@/components/Reveal";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { TrustStrip } from "@/components/TrustStrip";
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Gem,
  Award,
} from "lucide-react";

import {
  SITE_NAME,
  SITE_LOCALE,
  SITE_URL,
  canonical,
  defaultOgImage,
  breadcrumbSchema,
} from "@/components/seo-head";

export const Route = createFileRoute("/artworks/$slug")({
  head: ({ params }) => {
    const formattedTitle = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      meta: [
        {
          title: `${formattedTitle} — Buy Online | Raajsi Jewels, Jaipur`,
        },
        {
          name: "description",
          content: `Buy ${formattedTitle} from Raajsi Jewels. BIS Hallmark certified 925 Sterling Silver & Handcrafted Jewellery. Free delivery above ₹999. 7 days exchange. Handcrafted in Jaipur, India.`,
        },
        {
          name: "keywords",
          content: `${formattedTitle.toLowerCase()}, buy ${formattedTitle.toLowerCase()} online, raajsi jewels ${formattedTitle.toLowerCase()}, silver jewellery jaipur, handcrafted jewellery india`,
        },
        {
          property: "og:title",
          content: `${formattedTitle} — Raajsi Jewels`,
        },
        {
          property: "og:description",
          content: `Exquisite ${formattedTitle}. BIS Hallmark certified. Free delivery above ₹999.`,
        },
        { property: "og:type", content: "product" },
        {
          property: "og:url",
          content: canonical(`/artworks/${params.slug}`),
        },
        { property: "og:image", content: defaultOgImage() },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        {
          property: "product:brand",
          content: SITE_NAME,
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: `${formattedTitle} — Raajsi Jewels`,
        },
        {
          name: "twitter:description",
          content: `Buy ${formattedTitle}. BIS Hallmark certified. Free delivery above ₹999.`,
        },
        { name: "twitter:image", content: defaultOgImage() },
      ],
      links: [
        {
          rel: "canonical",
          href: canonical(`/artworks/${params.slug}`),
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: canonical("/") },
              { name: "Collections", url: canonical("/collection") },
              {
                name: formattedTitle,
                url: canonical(`/artworks/${params.slug}`),
              },
            ]),
          ),
        },
      ],
    };
  },
  component: JewelleryProductDetail,
});

function JewelleryProductDetail() {
  const formatPrice = useFormatPrice();
  const { slug } = Route.useParams();
  const addToCart = useAddToCart();
  const cart = useCart();
  const nav = useNavigate();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedRingSize, setSelectedRingSize] = useState<string>("14");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const productQuery = useQuery({
    queryKey: ["jewellery-product", slug],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!error && data) return data as unknown as JewelleryProduct;
      return MOCK_JEWELLERY_PRODUCTS.find((p) => p.slug === slug) ?? null;
    },
  });

  const product = productQuery.data;

  // Fetch related items
  const relatedQuery = useQuery({
    enabled: !!product,
    queryKey: ["related-jewellery", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,medium,story,primary_image_url,availability,display_price,price,metadata")
        .neq("slug", slug)
        .limit(4);
      if (!error && data && data.length > 0) return (data as unknown) as JewelleryProduct[];
      return MOCK_JEWELLERY_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 4);
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="container-editorial py-32 flex justify-center items-center">
        <div className="text-sm tracking-widest uppercase text-ink/40 animate-pulse">
          Loading jewellery details…
        </div>
      </div>
    );
  }

  if (!product) throw notFound();

  // ── Product JSON-LD (injected client-side for dynamic product data) ──
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.story || `${product.title} — Fine jewellery from Raajsi Jewels, Jaipur.`,
    image: product.primary_image_url
      ? resolveImage(product.primary_image_url)
      : defaultOgImage(),
    url: canonical(`/artworks/${slug}`),
    sku: slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.metadata?.category || "Jewellery",
    material: product.medium || product.metadata?.material || undefined,
    offers: {
      "@type": "Offer",
      url: canonical(`/artworks/${slug}`),
      priceCurrency: "INR",
      price: product.price ?? product.display_price ?? 0,
      availability:
        product.availability === "sold"
          ? "https://schema.org/SoldOut"
          : product.availability === "reserved"
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (product.price ?? 0) >= 999 ? "0" : "99",
          currency: "INR",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  const inCart = (cart.data ?? []).some((item) => item.artwork.slug === slug);

  // Extract structured jewellery fields from metadata or fallback defaults
  const meta = product.metadata ?? {};
  const material = meta.material || product.medium || "22K Gold & Silver";
  const finishing = meta.finishing || "High Polish & Antique Finish";
  const length = meta.length || "18 Inches (Adjustable chain)";
  const width = meta.width || "12 mm";
  const thickness = meta.thickness || "2.5 mm";
  const gemstone = meta.gemstone || "Natural Emerald & Uncut Diamonds (Polki)";
  const stock = product.availability === "available" ? meta.stock ?? "In Stock (Ready to Ship)" : "Made to Order";
  const category = meta.gender || "Unisex";
  const subcategory = meta.subcategory || "Necklace Set";
  const ringSizeOptions = meta.ring_sizes || ["10", "12", "14", "16", "18", "20"];
  const isRing = subcategory.toLowerCase().includes("ring");

  // Multi-image list (guarantee at least 4 perspective angles)
  const rawList: string[] = [
    product.primary_image_url || "",
    ...(Array.isArray(product.gallery_image_urls) ? product.gallery_image_urls : []),
    ...(Array.isArray(meta.gallery_images) ? meta.gallery_images : []),
    ...(Array.isArray(meta.images) ? meta.images : []),
  ];
  const distinctImages: string[] = Array.from(new Set(rawList.filter(Boolean)));
  const fallbackAngles = [
    "/jewellery/jewellery-necklace.jpg",
    "/jewellery/jewellery-hero.png",
    "/jewellery/jewellery-bangles.jpg",
    "/jewellery/jewellery-rings.png",
  ];
  const images = [...distinctImages];
  while (images.length < 4) {
    const fallback = fallbackAngles[images.length % fallbackAngles.length];
    images.push(fallback);
  }

  const ANGLE_LABELS = [
    "Front View",
    "Side Angle",
    "On-Body Look",
    "Craftsmanship Detail",
    "Alternate View",
  ];

  const handleBuyNow = async () => {
    if (!product.id) return;
    if (!inCart) {
      await addToCart.mutateAsync(product.id);
    }
    nav({ to: "/checkout" });
  };

  return (
    <div className="bg-paper pb-24">
      {/* Product JSON-LD for SEO Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Breadcrumb Navigation */}
      <nav className="border-b border-hairline bg-mist/30 py-3">
        <div className="container-editorial flex items-center gap-2 text-[11px] tracking-wider uppercase text-ink/50 overflow-x-auto">
          <Link to="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/collection" className="hover:text-ink transition-colors">
            Collection
          </Link>
          <ChevronRight size={12} />
          <span className="text-ink/40">{category}</span>
          <ChevronRight size={12} />
          <span className="text-ink font-medium truncate">{product.title}</span>
        </div>
      </nav>

      {/* Main Product Layout */}
      <section className="container-editorial pt-5 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* LEFT: Image Gallery (6 cols with 4 angles) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Main Featured Image with Carousel Controls & Zoom */}
            <div className="relative aspect-square w-full bg-mist overflow-hidden border border-hairline group">
              <img
                src={resolveImage(images[activeImageIndex])}
                alt={`${product.title} - ${ANGLE_LABELS[activeImageIndex] || "Angle"}`}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* BIS Hallmark Badge */}
              <div className="absolute top-4 left-4 bg-ink/95 text-paper px-3 py-1.5 text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <Award size={13} style={{ color: "var(--gold)" }} />
                BIS Hallmark 916 Certified
              </div>

              {/* Stock Status Badge */}
              <div className="absolute top-4 right-4 bg-paper/90 backdrop-blur text-ink border border-hairline px-3 py-1 text-[10px] uppercase tracking-widest font-medium">
                {stock}
              </div>

              {/* Carousel Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-paper/85 backdrop-blur border border-hairline flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 hover:bg-paper transition-all"
                    aria-label="Previous angle"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-paper/85 backdrop-blur border border-hairline flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 hover:bg-paper transition-all"
                    aria-label="Next angle"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Active Angle Badge */}
              <div className="absolute bottom-4 left-4 bg-ink/80 backdrop-blur text-paper px-2.5 py-1 text-[10px] uppercase tracking-widest font-medium">
                Angle {activeImageIndex + 1} of {images.length} · {ANGLE_LABELS[activeImageIndex] || "Showcase"}
              </div>

              {/* Zoom Lightbox Trigger */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-4 right-4 bg-paper/90 backdrop-blur text-ink border border-hairline p-2 hover:bg-paper rounded-xs transition-all shadow-sm"
                title="Inspect High-Res Macro"
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* Thumbnails Strip (4 Labeled Angles) */}
            <div className="grid grid-cols-4 gap-2.5">
              {images.slice(0, 4).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square relative overflow-hidden border transition-all rounded-xs group/thumb ${
                    activeImageIndex === idx
                      ? "border-[color:var(--gold)] ring-2 ring-[color:var(--gold)]"
                      : "border-hairline opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={resolveImage(imgUrl)}
                    alt={`${product.title} ${ANGLE_LABELS[idx]}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-ink/80 text-[8px] uppercase tracking-wider text-paper text-center py-0.5 font-medium truncate px-1">
                    {ANGLE_LABELS[idx]}
                  </div>
                </button>
              ))}
            </div>

            {/* Assurance Box under images */}
            <div className="grid grid-cols-3 gap-2 mt-4 p-4 bg-mist/40 border border-hairline text-center text-[11px] text-ink/70">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={18} className="text-[color:var(--gold)]" />
                <span>100% Certified</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={18} className="text-[color:var(--gold)]" />
                <span>Free Delivery &gt; ₹999</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw size={18} className="text-[color:var(--gold)]" />
                <span>7 Days Exchange</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Specs & Purchase Panel (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Header / Category badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[color:var(--gold)] px-2 py-0.5 bg-[color:var(--gold)]/10">
                  {category} Jewellery
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-ink/50">
                  {subcategory}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
                {product.title}
              </h1>

              {/* Price Tag */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  {formatPrice(product)}
                </span>
                <span className="text-xs text-ink/50 uppercase tracking-wider">
                  (Incl. of all taxes & BIS Hallmarking)
                </span>
              </div>
            </div>

            <hr className="border-hairline" />

            {/* Quick Action Buttons (Add to Cart / Buy Now) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => product.id && addToCart.mutate(product.id)}
                disabled={addToCart.isPending || !product.id}
                className="flex-1 cta-gold flex items-center justify-center gap-2 py-4 text-sm font-medium"
              >
                {inCart ? (
                  <>
                    <Check size={18} /> In Your Shopping Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 cta-outline flex items-center justify-center gap-2 py-4 text-sm font-medium border-ink hover:bg-ink hover:text-paper"
              >
                Buy Now (Direct Checkout) →
              </button>
            </div>

            {/* Optional Ring Size Selector */}
            {isRing && (
              <div className="p-4 bg-mist/30 border border-hairline flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink/70 flex justify-between">
                  <span>Select Ring Size (Indian Standard)</span>
                  <a href="#size-guide" className="text-[color:var(--gold)] underline lowercase font-normal">
                    size guide
                  </a>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ringSizeOptions.map((sz: string) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedRingSize(sz)}
                      className={`w-10 h-10 text-xs font-medium border transition-all ${
                        selectedRingSize === sz
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-paper"
                          : "border-hairline bg-paper text-ink hover:border-ink"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COMPREHENSIVE PRODUCT STRUCTURE TABLE */}
            <div className="border border-hairline bg-paper overflow-hidden">
              <div className="bg-mist/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink border-b border-hairline flex items-center justify-between">
                <span>Product Specifications & Details</span>
                <Sparkles size={14} className="text-[color:var(--gold)]" />
              </div>

              <div className="divide-y divide-hairline text-xs">
                {/* Material */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Material / Metal</span>
                  <span className="col-span-2 text-ink font-semibold">{material}</span>
                </div>

                {/* Finishing */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Finishing</span>
                  <span className="col-span-2 text-ink">{finishing}</span>
                </div>

                {/* Gemstone */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider flex items-center gap-1">
                    <Gem size={12} className="text-[color:var(--gold)]" /> Gemstone
                  </span>
                  <span className="col-span-2 text-ink">{gemstone}</span>
                </div>

                {/* Length */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Length</span>
                  <span className="col-span-2 text-ink">{length}</span>
                </div>

                {/* Width */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Width</span>
                  <span className="col-span-2 text-ink">{width}</span>
                </div>

                {/* Thickness */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Thickness</span>
                  <span className="col-span-2 text-ink">{thickness}</span>
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Category</span>
                  <span className="col-span-2 text-ink">
                    {category} · {subcategory}
                  </span>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Stock Status</span>
                  <span className="col-span-2 text-emerald-700 font-semibold">{stock}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/60 mb-2">
                Craftsmanship Description
              </h3>
              <p className="text-sm text-ink/80 leading-relaxed font-sans">
                {product.story || product.description ||
                  `Handcrafted by master artisans in Jaipur, this fine ${subcategory.toLowerCase()} represents the pinnacle of Rajasthani jewellery craftsmanship. Made with premium ${material}, every piece undergoes strict quality and purity checks before receiving BIS Hallmarking.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="mt-16">
        <TrustStrip />
      </div>

      {/* RELATED JEWELLERY SECTION */}
      {relatedQuery.data && relatedQuery.data.length > 0 && (
        <section className="container-editorial pt-16">
          <Reveal className="mb-8">
            <div className="eyebrow mb-1" style={{ color: "var(--gold)" }}>
              More from Raajsi
            </div>
            <h2 className="font-serif text-2xl md:text-3xl">You May Also Admire</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedQuery.data.map((item) => (
              <JewelleryCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* High-Resolution Macro Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-paper p-3 rounded-sm shadow-2xl flex flex-col items-center cursor-default"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 bg-ink text-paper p-2 rounded-full hover:bg-ink/80 z-10 transition-colors"
              aria-label="Close high-res view"
            >
              <X size={18} />
            </button>

            <div className="relative overflow-hidden max-h-[75vh]">
              <img
                src={resolveImage(images[activeImageIndex])}
                alt={`${product.title} - ${ANGLE_LABELS[activeImageIndex] || "Angle"}`}
                className="max-h-[75vh] w-auto object-contain rounded-xs"
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full px-2">
              <span className="text-xs uppercase tracking-widest text-ink font-serif font-medium">
                {product.title} — {ANGLE_LABELS[activeImageIndex] || "Angle"} ({activeImageIndex + 1} of {images.length})
              </span>
              <div className="flex items-center gap-1.5">
                {images.slice(0, 4).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activeImageIndex === idx ? "bg-amber-600 scale-125" : "bg-ink/30 hover:bg-ink/60"
                    }`}
                    aria-label={`View angle ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
