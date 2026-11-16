import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { useAddToCart, useCart } from "@/hooks/useCommerce";
import { Reveal } from "@/components/Reveal";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { TrustStrip } from "@/components/TrustStrip";
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Gem,
  Minus,
  Plus,
  Star,
  PenLine,
} from "lucide-react";
import { ProductReviews } from "@/components/ProductReviews";
import { useProductReviews } from "@/hooks/useProductReviews";

import {
  SITE_NAME,
  SITE_LOCALE,
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

    let seoTitle = `${formattedTitle} | Raajsi Jewels`;
    if (seoTitle.length > 60) {
      seoTitle = `${formattedTitle} | Raajsi`;
    }
    if (seoTitle.length > 60) {
      seoTitle = `${formattedTitle.slice(0, 50).trim()}… | Raajsi`;
    }

    let seoDesc = `Explore ${formattedTitle} from Raajsi Jewels. View product details, materials, availability and pricing.`;
    if (seoDesc.length > 155) {
      seoDesc = `Explore ${formattedTitle} at Raajsi Jewels. View product details and availability.`;
    }

    return {
      meta: [
        {
          title: seoTitle,
        },
        {
          name: "description",
          content: seoDesc,
        },
        {
          name: "keywords",
          content: `${formattedTitle.toLowerCase()}, buy ${formattedTitle.toLowerCase()} online, raajsi jewels ${formattedTitle.toLowerCase()}, silver jewellery jaipur, handcrafted jewellery india`,
        },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        {
          property: "og:title",
          content: seoTitle,
        },
        {
          property: "og:description",
          content: seoDesc,
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
          content: seoTitle,
        },
        {
          name: "twitter:description",
          content: seoDesc,
        },
        { name: "twitter:image", content: defaultOgImage() },
        { name: "twitter:site", content: "@jewels_raajsi" },
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
  errorComponent: () => (
    <div className="container-editorial py-24 text-center space-y-4">
      <h2 className="font-serif text-2xl text-ink">Jewellery Collection</h2>
      <p className="text-sm text-muted-foreground">Unable to load this piece right now.</p>
      <Link to="/collection" className="inline-block cta-gold text-xs px-6 py-2.5">
        Explore Collections
      </Link>
    </div>
  ),
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

  const { totalReviews, averageRating, reviews } = useProductReviews(undefined, slug);
  const realReviews = (reviews || []).filter((r) => !r.id?.startsWith("seed-"));
  const hasRealReviews = realReviews.length > 0;

  const productQuery = useQuery({
    queryKey: ["jewellery-product", slug],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async (): Promise<JewelleryProduct | null> => {
      const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (error) throw error;
      // A missing record is a genuine not-found result, not a reason to
      // substitute an unrelated sample product.
      return data ? (data as unknown as JewelleryProduct) : null;
    },
  });

  const product = productQuery.data ?? null;

  // Fetch related items
  const relatedQuery = useQuery({
    enabled: !!product,
    queryKey: ["related-jewellery", product?.id],
    queryFn: async (): Promise<JewelleryProduct[]> => {
      if (!product) return [];
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,medium,story,primary_image_url,availability,display_price,price,metadata")
        .neq("slug", slug)
        .limit(4);
      if (error) return [];
      return (data ?? []) as unknown as JewelleryProduct[];
    },
  });

  if (productQuery.isPending) {
    return (
      <div className="container-editorial py-32 flex justify-center items-center" aria-live="polite">
        <div className="text-sm tracking-widest uppercase text-ink/40 animate-pulse">
          Loading jewellery details…
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <section className="container-editorial py-32 text-center">
        <p className="eyebrow mb-3">Product unavailable</p>
        <h1 className="font-serif text-3xl md:text-4xl text-ink">We couldn't find this piece.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          It may have been removed or the product details may be temporarily unavailable.
        </p>
        <Link to="/collection" className="cta-gold inline-flex mt-8 px-6 py-3 text-xs">
          Browse the collection
        </Link>
      </section>
    );
  }

  // ── Product JSON-LD (injected client-side for dynamic product data) ──
  const rawMinPrice = product.price_min ?? product.price ?? product.display_price ?? null;
  const rawMaxPrice = product.price_max ?? rawMinPrice;
  const numericPrice = rawMinPrice === null || rawMinPrice === "" ? null : Number(rawMinPrice);
  const numericMaxPrice = rawMaxPrice === null || rawMaxPrice === "" ? null : Number(rawMaxPrice);
  const isPriceRange = product.price_display === "range" &&
    numericPrice !== null && Number.isFinite(numericPrice) && numericPrice > 0 &&
    numericMaxPrice !== null && Number.isFinite(numericMaxPrice) && numericMaxPrice >= numericPrice;
  const hasValidPrice = product.price_display !== "on_request" && numericPrice !== null &&
    Number.isFinite(numericPrice) && numericPrice > 0 && (isPriceRange || product.price_display !== "range");
  const schemaAvailability: Record<string, string> = {
    available: "https://schema.org/InStock",
    reserved: "https://schema.org/LimitedAvailability",
    sold: "https://schema.org/SoldOut",
  };

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical(`/artworks/${slug}`)}#product`,
    name: product.title,
    description: product.story || product.description || product.title,
    image: product.primary_image_url ? resolveImage(product.primary_image_url) : defaultOgImage(),
    url: canonical(`/artworks/${slug}`),
    sku: product.id || slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.metadata?.category || "Jewellery",
    material: product.medium || product.metadata?.material || undefined,
    ...(hasRealReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: realReviews.length,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(hasValidPrice && schemaAvailability[product.availability]
      ? {
          offers: {
            "@type": isPriceRange ? "AggregateOffer" : "Offer",
            url: canonical(`/artworks/${slug}`),
            priceCurrency: "INR",
            ...(isPriceRange
              ? { lowPrice: numericPrice, highPrice: numericMaxPrice, offerCount: 1 }
              : { price: numericPrice }),
            itemCondition: "https://schema.org/NewCondition",
            availability: schemaAvailability[product.availability],
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
  };

  const inCart = (cart.data ?? []).some(
    (item) => item?.artwork?.slug === slug || (product?.id && item?.artwork_id === product.id)
  );

  // Extract structured jewellery fields from metadata or fallback defaults
  const meta = product.metadata ?? {};
  const material = meta.material || product.medium || "";
  const finishing = meta.finishing || "";
  const length = meta.length || "";
  const width = meta.width || "";
  const thickness = meta.thickness || "";
  const gemstone = meta.gemstone || "";
  const availabilityLabels: Record<string, string> = {
    available: "In Stock",
    reserved: "Reserved",
    sold: "Sold",
    not_for_sale: "Not for sale",
  };
  const stock = meta.stock || availabilityLabels[product.availability] || "Check availability";
  const category = meta.gender || "";
  const subcategory = meta.subcategory || "";
  const ringSizeOptions = meta.ring_sizes || [];
  const isRing = `${subcategory} ${product.title}`.toLowerCase().includes("ring");

  // Multi-image list (guarantee at least 4 perspective angles)
  const rawList: string[] = [
    product.primary_image_url || "",
    ...(Array.isArray(product.gallery_image_urls) ? product.gallery_image_urls : []),
    ...(Array.isArray(meta.gallery_images) ? meta.gallery_images : []),
    ...(Array.isArray(meta.images) ? meta.images : []),
  ];
  const distinctImages = Array.from(new Set(rawList.filter(Boolean))).map((u) => resolveImage(u));
  const images = distinctImages.length > 0 ? distinctImages : [defaultOgImage()];
  const ANGLE_LABELS = images.map((_, index) => `Product image ${index + 1}`);

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const handleBuyNow = async () => {
    if (!product.id) return;
    await addToCart.mutateAsync({ artworkId: product.id, quantity: selectedQuantity });
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
                <span>Product Details</span>
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
                  {category ? `${category} Jewellery` : "Jewellery"}
                </span>
                {subcategory && (
                  <span className="text-[10px] tracking-[0.2em] uppercase text-ink/50">
                    {subcategory}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
                {product.title}
              </h1>

              {/* Patron Rating & Write Review Link */}
              <div className="flex items-center gap-3 mt-2.5">
                <a
                  href="#reviews-section"
                  className="flex items-center gap-1.5 text-xs text-ink/80 hover:text-[color:var(--gold)] transition-colors group"
                >
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={
                          s <= Math.round(averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-stone-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-ink text-xs">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground group-hover:underline">
                    ({totalReviews} reviews)
                  </span>
                </a>
                <span className="text-hairline">·</span>
                <a
                  href="#reviews-section"
                  className="text-[11px] uppercase tracking-wider text-[color:var(--gold)] font-medium hover:underline flex items-center gap-1"
                >
                  <PenLine size={11} />
                  <span>Write a review</span>
                </a>
              </div>

              {/* Price Tag */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  {formatPrice(product)}
                </span>
                <span className="text-xs text-ink/50 uppercase tracking-wider">
                  (Price in INR)
                </span>
              </div>
            </div>

            <hr className="border-hairline" />

            {/* Quantity Selector & Action Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-ink/70 font-medium">Quantity:</span>
                <div className="flex items-center border border-hairline bg-paper">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-mist transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-mono font-semibold tabular-nums text-ink">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-mist transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  ({stock})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => product.id && addToCart.mutate({ artworkId: product.id, quantity: selectedQuantity })}
                  disabled={addToCart.isPending || !product.id}
                  className="flex-1 cta-gold flex items-center justify-center gap-2 py-4 text-sm font-medium"
                >
                  <ShoppingBag size={18} />
                  {inCart
                    ? `Add More To Bag (+${selectedQuantity})`
                    : `Add to Cart ${selectedQuantity > 1 ? `(${selectedQuantity})` : ""}`}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 cta-outline flex items-center justify-center gap-2 py-4 text-sm font-medium border-ink hover:bg-ink hover:text-paper"
                >
                  Buy Now (Direct Checkout) →
                </button>
              </div>
            </div>

            {/* Optional Ring Size Selector */}
            {isRing && ringSizeOptions.length > 0 && (
              <div className="p-4 bg-mist/30 border border-hairline flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink/70">
                  Select Ring Size (Indian Standard)
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
                {material && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Material / Metal</span>
                    <span className="col-span-2 text-ink font-semibold">{material}</span>
                  </div>
                )}
                {finishing && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Finishing</span>
                    <span className="col-span-2 text-ink">{finishing}</span>
                  </div>
                )}
                {gemstone && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider flex items-center gap-1">
                      <Gem size={12} className="text-[color:var(--gold)]" /> Gemstone
                    </span>
                    <span className="col-span-2 text-ink">{gemstone}</span>
                  </div>
                )}
                {length && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Length</span>
                    <span className="col-span-2 text-ink">{length}</span>
                  </div>
                )}
                {width && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Width</span>
                    <span className="col-span-2 text-ink">{width}</span>
                  </div>
                )}
                {thickness && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Thickness</span>
                    <span className="col-span-2 text-ink">{thickness}</span>
                  </div>
                )}
                {(category || subcategory) && (
                  <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                    <span className="font-medium text-ink/60 uppercase tracking-wider">Category</span>
                    <span className="col-span-2 text-ink">
                      {[category, subcategory].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 p-3 hover:bg-mist/20">
                  <span className="font-medium text-ink/60 uppercase tracking-wider">Stock Status</span>
                  <span className="col-span-2 text-ink font-semibold">{stock}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/60 mb-2">
                Craftsmanship Description
              </h3>
              <p className="text-sm text-ink/80 leading-relaxed font-sans">
                {product.story || product.description || "Contact Raajsi Jewels for further product details."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS & RATINGS SECTION ──────────────────────── */}
      <div className="container-editorial">
        <ProductReviews artworkId={product?.id} slug={slug} productTitle={product.title} />
      </div>

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
