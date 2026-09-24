import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart, useRemoveFromCart, useUpdateCartQuantity } from "@/hooks/useCommerce";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Raajsi Jewels" },
      { name: "description", content: "Review your selected jewellery pieces and proceed to secure checkout." },
      { property: "og:title", content: "Your Cart — Raajsi Jewels" },
      { property: "og:description", content: "Review your jewellery shopping bag." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { data, isLoading } = useCart();
  const remove = useRemoveFromCart();
  const updateQty = useUpdateCartQuantity();
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const items = data ?? [];
  const total = items.reduce(
    (s, i) => s + (i.artwork.display_price ?? i.artwork.price_min ?? 0) * (i.quantity ?? 1),
    0,
  );

  return (
    <>
      <PageHero
        eyebrow="Your Shopping Bag"
        title={<KineticTitle>Selected Fine Jewellery</KineticTitle>}
        lede="Review your pieces, adjust quantities, and proceed to insured delivery with official BIS Hallmark certification."
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
              {items.map((i) => {
                const qty = i.quantity ?? 1;
                const unitPrice = i.artwork.display_price ?? i.artwork.price_min ?? 0;
                const lineTotal = unitPrice * qty;

                return (
                  <div key={i.id} className="py-6 flex gap-5 items-start">
                    <Link
                      to="/artworks/$slug"
                      params={{ slug: i.artwork.slug }}
                      className="block w-24 h-28 flex-shrink-0 bg-mist overflow-hidden border border-hairline/60 rounded-xs"
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {i.artwork.medium || "925 Sterling Silver"} · Raajsi Jewels
                      </p>
                      
                      {/* Price & Quantity Controls */}
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center border border-hairline bg-paper">
                          <button
                            type="button"
                            onClick={() => updateQty.mutate({ artworkId: i.artwork_id, quantity: qty - 1 })}
                            disabled={updateQty.isPending}
                            className="w-8 h-8 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-mist transition-colors disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-9 text-center text-xs font-mono font-semibold tabular-nums text-ink">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty.mutate({ artworkId: i.artwork_id, quantity: qty + 1 })}
                            disabled={updateQty.isPending}
                            className="w-8 h-8 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-mist transition-colors disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="font-serif tabular-nums text-ink font-medium">
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(lineTotal)}
                          {qty > 1 && (
                            <span className="text-[11px] text-muted-foreground font-sans ml-1.5 font-normal">
                              ({new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(unitPrice)} each)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove.mutate(i.artwork_id)}
                      disabled={remove.isPending}
                      className="text-[11px] tracking-[0.2em] uppercase text-ink/50 hover:text-red-700 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="space-y-6">
              <div className="border border-hairline p-6 bg-paper space-y-4">
                <div className="eyebrow mb-1">Order Subtotal</div>
                <div className="font-serif text-3xl tabular-nums text-ink">
                  ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(total)}
                </div>
                <div className="text-xs pt-1 border-t border-hairline/60 space-y-2">
                  {total >= 999 ? (
                    <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Eligible for Free Delivery (Order &gt; ₹999)</span>
                    </div>
                  ) : (
                    <div className="text-amber-800 text-[11px] leading-snug">
                      Add ₹{999 - total} more for <strong>Free Delivery</strong> (Standard delivery: ₹99)
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground">
                    • GST Free / Inclusive of all taxes<br />
                    • 7 Days Exchange Policy<br />
                    • 100% BIS Hallmark &amp; 925 Silver Certified
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/checkout" })}
                className="cta-gold w-full py-3.5 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-medium shadow-sm hover:shadow-md transition-all"
              >
                Proceed to Checkout →
              </button>
              <p className="text-[11px] text-center text-ink/70">
                🔒 Secure Razorpay Checkout (UPI, Cards, NetBanking)
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
