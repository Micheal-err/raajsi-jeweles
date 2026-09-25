import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, Gem } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { useAddToCart, useIsInCart, useIsWishlisted, useToggleWishlist } from "@/hooks/useCommerce";

export interface JewelleryProduct {
  id?: string;
  slug: string;
  title: string;
  medium: string | null;          // Material: Gold/Silver/etc.
  story?: string | null;
  description?: string | null;
  primary_image_url: string | null;
  gallery_image_urls?: string[] | null;
  availability: string;
  price_min?: number | null;
  price_max?: number | null;
  price_display?: string;
  display_price?: number | null;
  price?: number | null;
  // Jewellery-specific fields stored in metadata JSON
  metadata?: {
    material?: string;
    finishing?: string;
    length?: string;
    width?: string;
    thickness?: string;
    dimensions?: string;
    gemstone?: string;
    ring_size?: string;
    ring_sizes?: string[];
    subcategory?: string;
    category?: string;
    collection?: string;
    gender?: "men" | "women" | "unisex" | string;
    stock?: string;
    images?: string[];
    gallery_images?: string[];
  } | null;
}

const SUBCATEGORY_COLORS: Record<string, string> = {
  rings: "bg-amber-50 text-amber-800",
  chains: "bg-blue-50 text-blue-800",
  bracelets: "bg-rose-50 text-rose-800",
  earrings: "bg-violet-50 text-violet-800",
  bangles: "bg-emerald-50 text-emerald-800",
  necklaces: "bg-teal-50 text-teal-800",
  pendants: "bg-orange-50 text-orange-800",
  anklets: "bg-pink-50 text-pink-800",
  anklet: "bg-pink-50 text-pink-800",
  "nose rings": "bg-indigo-50 text-indigo-800",
  "nose ring": "bg-indigo-50 text-indigo-800",
  "nose pin": "bg-indigo-50 text-indigo-800",
  kadas: "bg-yellow-50 text-yellow-800",
};

export function JewelleryCard({ product }: { product: JewelleryProduct }) {
  const navigate = useNavigate();
  const productId = product.id ?? "";
  const inCart = useIsInCart(productId);
  const wishlisted = useIsWishlisted(productId);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const formatPrice = useFormatPrice();
  const available = product.availability === "available";
  const priceLabel = formatPrice(product);

  const subcategory = product.metadata?.subcategory?.toLowerCase() ?? "";
  const badgeClass = SUBCATEGORY_COLORS[subcategory] ?? "bg-stone-100 text-stone-700";

  const primaryImg = product.primary_image_url;
  const secondaryImg =
    (product.gallery_image_urls && product.gallery_image_urls.find((u) => u && u !== primaryImg)) ||
    (product.metadata?.gallery_images && product.metadata.gallery_images.find((u) => u && u !== primaryImg)) ||
    null;

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicked on an interactive control (button or link), let it handle its own event
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return;
    }
    navigate({ to: "/artworks/$slug", params: { slug: product.slug } });
  };

  return (
    <article
      onClick={handleCardClick}
      className="jewellery-card group relative flex flex-col bg-paper border border-hairline overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Image Container with 2-Angle Hover Effect */}
      <div className="relative overflow-hidden bg-mist aspect-square">
        <Link to="/artworks/$slug" params={{ slug: product.slug }} className="block w-full h-full relative">
          <img
            src={resolveImage(primaryImg)}
            alt={product.title}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              secondaryImg ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
            }`}
            loading="lazy"
          />
          {secondaryImg && (
            <img
              src={resolveImage(secondaryImg)}
              alt={`${product.title} alternate angle`}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              loading="lazy"
            />
          )}
        </Link>

        {/* 4 Angles Photography Badge on Hover */}
        <span className="absolute bottom-2.5 left-2.5 bg-ink/80 backdrop-blur-xs text-paper text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          4 Angles
        </span>

        {/* Subcategory Badge */}
        {subcategory && (
          <span
            className={`absolute top-3 left-3 text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded-sm ${badgeClass}`}
          >
            {product.metadata?.subcategory}
          </span>
        )}

        {/* Wishlist Button */}
        {productId && (
          <button
            type="button"
            onClick={() => toggleWishlist.mutate({ artworkId: productId, on: wishlisted })}
            disabled={toggleWishlist.isPending}
            aria-label="Save piece"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-paper/90 backdrop-blur border border-hairline flex items-center justify-center text-ink/70 hover:text-rose-600 transition-colors shadow-sm"
          >
            <Heart size={15} className={wishlisted ? "fill-rose-600 text-rose-600" : ""} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-1 flex items-center gap-1">
            <Gem size={10} className="text-[color:var(--gold)]" />
            <span>{product.medium || "Fine Jewellery"}</span>
          </div>

          <h3 className="font-serif text-base font-medium text-ink leading-snug line-clamp-1 group-hover:text-[color:var(--gold)] transition-colors">
            <Link to="/artworks/$slug" params={{ slug: product.slug }}>
              {product.title}
            </Link>
          </h3>
        </div>

        {/* Price & Action */}
        <div className="mt-2 pt-2 border-t border-hairline flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-ink">{priceLabel}</div>
            <div className="text-[9px] uppercase tracking-wider text-emerald-700 font-medium">
              {available ? "In Stock" : "Out of Stock"}
            </div>
          </div>

          {available && productId && (
            <button
              type="button"
              onClick={() => addToCart.mutate(productId)}
              disabled={addToCart.isPending}
              className={`px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase transition-all flex items-center gap-1 ${
                inCart
                  ? "bg-emerald-800 text-paper"
                  : "bg-[color:var(--gold)] text-paper hover:opacity-90"
              }`}
            >
              <ShoppingBag size={12} />
              {inCart ? "In Bag" : "Add"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
