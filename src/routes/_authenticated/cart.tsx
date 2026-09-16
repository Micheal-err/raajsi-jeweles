import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart, useRemoveFromCart } from "@/hooks/useCommerce";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { PageHero, KineticTitle } from "@/components/PageHero";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Raajsi Jewels" },
      { name: "description", content: "Works you're considering. Request all with one inquiry." },
      { property: "og:title", content: "Your Cart — Raajsi Jewels" },
      { property: "og:description", content: "Works reserved for inquiry." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { data, isLoading } = useCart();
  const remove = useRemoveFromCart();
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const items = data ?? [];
  const total = items.reduce(
    (s, i) => s + (i.artwork.display_price ?? i.artwork.price_min ?? 0),
    0,
  );

  return (
    <>
      <PageHero
        eyebrow="Your considered works"
        title={<KineticTitle>The cart is a shortlist.</KineticTitle>}
        lede="Every acquisition is finalized by inquiry — request all works below in a single note to a jewellery specialist."
        visual="cart"
      />
      <section className="container-editorial py-14 md:py-20">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading…</p>
        ) : items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <p className="font-serif text-2xl mb-6">Your cart is empty.</p>
            <Link to="/collection" className="cta-red">
              Browse the collection →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 divide-y divide-hairline border-t border-b border-hairline">
              {items.map((i) => (
                <div key={i.id} className="py-6 flex gap-5 items-start">
                  <Link
                    to="/artworks/$slug"
                    params={{ slug: i.artwork.slug }}
                    className="block w-24 h-28 flex-shrink-0 bg-mist overflow-hidden"
                  >
                    {i.artwork.primary_image_url && (
                      <img
                        src={resolveImage(i.artwork.primary_image_url)}
                        alt={i.artwork.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/artworks/$slug"
                      params={{ slug: i.artwork.slug }}
                      className="font-serif italic text-xl hover:text-[color:var(--accent)]"
                    >
                      {i.artwork.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {i.artwork.medium || "22K Gold"} · Raajsi Jewels
                    </p>
                    <p className="mt-2 font-serif tabular-nums">{formatPrice(i.artwork)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove.mutate(i.artwork_id)}
                    className="text-[11px] tracking-[0.22em] uppercase text-ink/60 hover:text-[color:var(--accent)]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <aside className="space-y-6">
              <div className="border border-hairline p-6">
                <div className="eyebrow mb-3">Estimated total</div>
                <div className="font-serif text-3xl tabular-nums">
                  ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(total)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Displayed prices are indicative. Final price is confirmed by the gallery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/checkout" })}
                className="cta-red w-full py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-medium"
              >
                {total <= 100000
                  ? "Proceed to Online Checkout →"
                  : "Proceed to Curatorial Acquisition →"}
              </button>
              <p className="text-[11px] text-center text-ink/60">
                {total <= 100000
                  ? "🟢 Eligible for Instant Online Payment (UPI, Cards, NetBanking)"
                  : "🟡 Total exceeds ₹1 Lakh — Reserved via Jewellery Specialist Assistance"}
              </p>
              <Link
                to="/collection"
                className="block text-center text-[11px] tracking-[0.22em] uppercase link-underline"
              >
                Continue browsing
              </Link>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
