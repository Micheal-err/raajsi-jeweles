import { createFileRoute, Link } from "@tanstack/react-router";
import { useWishlist } from "@/hooks/useCommerce";
import { ArtworkCard } from "@/components/ArtworkCard";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Raajsi Jewels" },
      { name: "description", content: "Works you've saved for later." },
      { property: "og:title", content: "Your Wishlist — Raajsi Jewels" },
      { property: "og:description", content: "Works saved for later." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const items = data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Saved for later"
        title={<KineticTitle>Your wishlist.</KineticTitle>}
        lede="A quiet corner of the archive — kept, so you can return."
        visual="wishlist"
      />
      <section className="container-editorial py-14 md:py-20">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading…</p>
        ) : items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <p className="font-serif text-2xl mb-6">No works saved yet.</p>
            <Link to="/collection" className="cta-red">
              Browse the collection →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {items.map((i, idx) => (
              <Reveal key={i.id} delayMs={Math.min(idx, 6) * 50}>
                <ArtworkCard
                  art={{
                    id: i.artwork.id,
                    slug: i.artwork.slug,
                    title: i.artwork.title,
                    medium: i.artwork.medium,
                    year_created: null,
                    primary_image_url: i.artwork.primary_image_url,
                    availability: i.artwork.availability,
                    price_min: i.artwork.price_min,
                    price_max: i.artwork.price_max,
                    price_display: i.artwork.price_display ?? "fixed",
                    display_price: i.artwork.display_price,
                  }}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
