import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, GitCompare } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { useAddToCart, useIsInCart, useIsWishlisted, useToggleWishlist } from "@/hooks/useCommerce";
import { useCompare } from "@/lib/compare";

export interface ArtworkCardData {
  id?: string;
  slug: string;
  title: string;
  medium: string | null;
  year_created?: number | null;
  primary_image_url: string | null;
  availability: string;
  price_min?: number | null;
  price_max?: number | null;
  price_display?: string;
  display_price?: number | null;
  price?: number | null;
  artist?: { name: string; slug: string } | null;
}

export function ArtworkCard({ art }: { art: ArtworkCardData }) {
  const artworkId = art.id ?? "";
  const inCart = useIsInCart(artworkId);
  const wishlisted = useIsWishlisted(artworkId);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const compare = useCompare();
  const isComparing = compare.has(art.slug);
  const available = art.availability === "available";
  const formatPrice = useFormatPrice();
  const priceLabel = formatPrice(art);

  return (
    <article className="art-tile group block">
      <div className="relative overflow-hidden bg-mist aspect-[4/5]">
        <Link to="/artworks/$slug" params={{ slug: art.slug }} className="block w-full h-full">
          {art.primary_image_url && (
            <img
              src={resolveImage(art.primary_image_url)}
              alt={art.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          )}
        </Link>
        {art.availability !== "available" && (
          <span
            className={`absolute top-3 left-3 text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 pointer-events-none font-medium border shadow-sm ${
              art.availability === "sold"
                ? "bg-ink text-paper border-ink"
                : art.availability === "reserved"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-paper text-ink border-hairline"
            }`}
          >
            {art.availability === "sold"
              ? "Sold"
              : art.availability === "reserved"
                ? "Reserved"
                : art.availability.replace("_", " ")}
          </span>
        )}
        {artworkId && (
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist.mutate({ artworkId, on: wishlisted });
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-paper/95 backdrop-blur border border-hairline flex items-center justify-center hover:border-[color:var(--accent)] transition-colors"
          >
            <Heart
              size={15}
              className={wishlisted ? "text-[color:var(--accent)]" : "text-ink/70"}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>
        )}
        <button
          type="button"
          aria-label={isComparing ? "Remove from compare" : "Add to compare"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isComparing) compare.remove(art.slug);
            else compare.add(art.slug);
          }}
          className="absolute top-14 right-3 w-9 h-9 rounded-full bg-paper/95 backdrop-blur border border-hairline flex items-center justify-center hover:border-[color:var(--accent)] transition-colors"
        >
          <GitCompare
            size={14}
            className={isComparing ? "text-[color:var(--accent)]" : "text-ink/70"}
          />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-lg leading-snug truncate">
            <Link
              to="/artworks/$slug"
              params={{ slug: art.slug }}
              className="hover:text-[color:var(--accent)] transition-colors"
            >
              <em className="italic">{art.title}</em>
              {art.year_created ? (
                <span className="not-italic text-muted-foreground">, {art.year_created}</span>
              ) : null}
            </Link>
          </h3>
          {art.medium && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {art.medium} · Raajsi Jewels
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="font-serif text-base text-ink tabular-nums whitespace-nowrap">
          {priceLabel}
        </div>
        {available && artworkId ? (
          <button
            type="button"
            onClick={() => addToCart.mutate(artworkId)}
            disabled={inCart || addToCart.isPending}
            className="inline-flex items-center gap-1.5 bg-[color:var(--gold)] text-white text-[11px] tracking-[0.18em] uppercase px-3 py-2 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            <ShoppingBag size={12} />
            {inCart ? "In cart" : "Add"}
          </button>
        ) : (
          <span className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 bg-mist text-ink/60 border border-hairline font-medium">
            Out of Stock
          </span>
        )}
      </div>

      <div className="mt-2">
        <Link
          to="/artworks/$slug"
          params={{ slug: art.slug }}
          className="text-[11px] tracking-[0.18em] uppercase text-ink/60 hover:text-[color:var(--gold)] transition-colors"
        >
          View piece →
        </Link>
      </div>
    </article>
  );
}
