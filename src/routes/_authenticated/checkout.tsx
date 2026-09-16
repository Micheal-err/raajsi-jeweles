import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCommerce";
import { useSession } from "@/hooks/useSession";
import { useFormatPrice } from "@/lib/currency-format";
import { useCurrency } from "@/lib/currency";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { toast } from "sonner";
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  Info,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Raajsi Jewels" },
      {
        name: "description",
        content:
          "Complete your jewellery purchase securely with insured delivery and BIS Hallmark Certificate on every piece.",
      },
      { property: "og:title", content: "Checkout — Raajsi Jewels" },
      { property: "og:description", content: "Complete your jewellery purchase." },
    ],
  }),
  component: CheckoutPage,
});

// GST Rate for jewellery in India (3%)
const JEWELLERY_GST_RATE = 0.03;

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const { data: items } = useCart();
  const { user } = useSession();
  const { currency: activeCurrency } = useCurrency();
  const fmt = useFormatPrice();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [placing, setPlacing] = useState(false);
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking">("upi");

  const rows = items ?? [];
  const subtotal = rows.reduce(
    (s, i) => s + (i.artwork.display_price ?? i.artwork.price_min ?? 0),
    0,
  );
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping on all orders
  const tax = Math.round(subtotal * JEWELLERY_GST_RATE); // 3% GST on jewellery
  const total = subtotal + shipping + tax;

  // All orders go through Razorpay direct online payment
  const isOnlinePaymentEligible = true;

  async function saveOrder(status: "confirmed" | "inquiry_sent", paymentId?: string) {
    if (!user) return;

    // Retrieve form element data from current state
    const formEl = document.querySelector("#checkout-form") as HTMLFormElement | null;
    const fd = formEl ? new FormData(formEl) : new FormData();
    const line1 = String(fd.get("line1") ?? "");
    const line2 = String(fd.get("line2") ?? "");
    const shippingName = String(fd.get("name") ?? "");
    const shippingCity = String(fd.get("city") ?? "");
    const shippingPostal = String(fd.get("postal") ?? "");
    const shippingCountry = String(fd.get("country") ?? "India");
    const phone = String(fd.get("phone") ?? "");

    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status,
        subtotal,
        shipping_cost: shipping,
        tax_cost: tax,
        total,
        currency: activeCurrency,
        shipping_name: shippingName,
        shipping_email: user.email ?? "",
        shipping_address: [line1, line2].filter(Boolean).join(", "),
        shipping_city: shippingCity,
        shipping_postal: shippingPostal,
        shipping_country: shippingCountry,
        notes: `Phone: ${phone}`,
        items: rows.map((r) => ({
          artwork_id: r.artwork.id,
          slug: r.artwork.slug,
          title: r.artwork.title,
          price: r.artwork.display_price ?? r.artwork.price_min ?? 0,
          image: r.artwork.primary_image_url,
          payment_id: paymentId ?? null,
        })),
      })
      .select("id")
      .single();

    if (error || !createdOrder) {
      toast.error("Could not record order. Please contact support.");
      setPlacing(false);
      return;
    }

    // Atomic Stock Reservation & Availability Update
    const artworkIds = rows.map((r) => r.artwork.id).filter(Boolean);
    if (artworkIds.length > 0) {
      for (const artId of artworkIds) {
        await supabase.rpc("reserve_artwork", {
          p_artwork_id: artId,
          p_order_id: createdOrder.id,
          p_ttl_minutes: 4320,
        });
      }

      await supabase.rpc("update_artworks_availability", {
        p_artwork_ids: artworkIds,
        p_availability: "reserved",
      });

      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork"] });
      qc.invalidateQueries({ queryKey: ["home-artworks"] });
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["cart"] });

    toast.success("Order submitted! Our jewellery specialist will contact you shortly.");
    nav({ to: "/orders" });
  }

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || rows.length === 0 || placing) return;
    setPlacing(true);

    const fd = new FormData(e.currentTarget);
    const line1 = String(fd.get("line1") ?? "");
    const line2 = String(fd.get("line2") ?? "");
    const shippingName = String(fd.get("name") ?? "");
    const shippingCity = String(fd.get("city") ?? "");
    const shippingPostal = String(fd.get("postal") ?? "");
    const shippingCountry = String(fd.get("country") ?? "India");
    const phone = String(fd.get("phone") ?? "");

    if (isOnlinePaymentEligible) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load. Are you connected to the internet?");
        setPlacing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          artwork_ids: rows.map((r) => r.artwork.id),
          shipping: {
            name: shippingName,
            email: user.email ?? "",
            address: [line1, line2].filter(Boolean).join(", "),
            city: shippingCity,
            postal: shippingPostal,
            country: shippingCountry,
            phone,
          },
        },
      });

      if (error || data?.error) {
        toast.error(data?.error ?? "Could not start checkout.");
        setPlacing(false);
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "Raajsi Jewels",
        description: `Fine Jewellery Purchase (${rows.length} item${rows.length > 1 ? "s" : ""})`,
        prefill: {
          name: shippingName,
          email: user.email ?? "",
          contact: phone,
        },
        theme: {
          color: "#b8860b",
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                db_order_id: data.db_order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            },
          );

          if (verifyErr || !verifyData?.success) {
            toast.error("Payment could not be verified. Please contact support before retrying.");
            setPlacing(false);
            return;
          }

          await supabase.from("cart_items").delete().eq("user_id", user.id);
          qc.invalidateQueries({ queryKey: ["cart"] });
          qc.invalidateQueries({ queryKey: ["collection"] });
          qc.invalidateQueries({ queryKey: ["artworks"] });

          toast.success("Payment successful! Order confirmed. Your hallmark certificate will be included.");
          nav({ to: "/orders" });
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
            toast.info("Payment window closed.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      // Over 1 Lakh -> Director Acquisition Inquiry
      await saveOrder("inquiry_sent");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="container-editorial py-24 text-center">
        <p className="font-serif text-2xl mb-4">Your cart is empty.</p>
        <Link to="/collection" className="cta-gold">
          Browse jewellery →
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Checkout & Purchase"
        title={
          <KineticTitle>
            Secure Online Checkout
          </KineticTitle>
        }
        lede="Complete your jewellery purchase securely via Razorpay (UPI, Google Pay, Cards, NetBanking). Free insured shipping on all orders with BIS Hallmark Certificate included."
        visual="cart"
      />

      <section className="container-editorial py-16 grid md:grid-cols-[1fr_380px] gap-12 items-start">
        <form id="checkout-form" onSubmit={place} className="space-y-8">
          {/* Shipping Address */}
          <div className="space-y-4 border border-hairline p-6 bg-paper">
            <h2 className="font-serif text-2xl text-ink">1. Delivery Address</h2>
            <F label="Full Name" name="name" required placeholder="Full Name" />
            <F
              label="Address Line 1"
              name="line1"
              required
              placeholder="Street address or P.O. Box"
            />
            <F
              label="Address Line 2 (Optional)"
              name="line2"
              placeholder="Apartment, suite, unit, etc."
            />
            <div className="grid md:grid-cols-2 gap-4">
              <F label="City" name="city" required placeholder="City" />
              <F label="State" name="state" required placeholder="State" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <F label="Postal Code" name="postal" required placeholder="Pincode / Postal Code" />
              <F label="Country" name="country" defaultValue="India" required />
            </div>
            <F label="Phone Number" name="phone" required placeholder="+91 98290 00000" />
          </div>

          {/* Payment Section (Conditional) */}
          <div className="border border-hairline p-6 bg-paper space-y-4">
            <h2 className="font-serif text-2xl text-ink">2. Payment Method (Razorpay Secured)</h2>

            {/* All orders eligible for online payment */}
              <>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>All orders eligible for instant Razorpay payment — UPI, Cards, NetBanking</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("upi")}
                    className={`p-3 border text-xs flex flex-col items-center gap-2 transition-colors ${
                      payMethod === "upi"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5 text-ink font-medium"
                        : "border-hairline text-ink/70 hover:border-ink"
                    }`}
                  >
                    <QrCode
                      size={18}
                      className={payMethod === "upi" ? "text-[color:var(--gold)]" : ""}
                    />
                    <span>UPI / GPay / PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`p-3 border text-xs flex flex-col items-center gap-2 transition-colors ${
                      payMethod === "card"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5 text-ink font-medium"
                        : "border-hairline text-ink/70 hover:border-ink"
                    }`}
                  >
                    <CreditCard
                      size={18}
                      className={payMethod === "card" ? "text-[color:var(--gold)]" : ""}
                    />
                    <span>Cards (Visa/Master/Amex)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("netbanking")}
                    className={`p-3 border text-xs flex flex-col items-center gap-2 transition-colors ${
                      payMethod === "netbanking"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5 text-ink font-medium"
                        : "border-hairline text-ink/70 hover:border-ink"
                    }`}
                  >
                    <Building2
                      size={18}
                      className={payMethod === "netbanking" ? "text-[color:var(--gold)]" : ""}
                    />
                    <span>Net Banking</span>
                  </button>
                </div>

                <div className="p-4 bg-mist/40 border border-hairline space-y-2 text-xs">
                  <p className="font-medium text-ink flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-700" />
                    Razorpay 256-Bit SSL Encrypted Payment Window
                  </p>
                  <p className="text-ink/60">
                    Clicking "Pay via Razorpay" will securely launch the payment modal to complete
                    via UPI, Cards, or NetBanking. BIS Hallmark Certificate included with every piece.
                  </p>
                </div>
              </>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="cta-gold w-full !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock size={15} />
            {placing
              ? "Launching Razorpay..."
              : `Pay via Razorpay · ${fmt({ price_display: "fixed", price_min: null, price_max: null, display_price: total })}`}
          </button>

          <p className="text-xs text-center text-ink/50 flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-emerald-700" />
            Every piece includes BIS Hallmark Certificate &amp; Free Insured Delivery.
          </p>
        </form>

        {/* Order Summary Sidebar */}
        <aside className="space-y-4">
          <div className="border border-hairline p-6 bg-paper space-y-4">
            <h3 className="font-serif text-lg border-b border-hairline pb-3">
              Order Summary
            </h3>
            <div className="space-y-3 text-xs">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between gap-4 py-1 border-b border-hairline/40"
                >
                  <span className="truncate italic font-serif text-ink">{r.artwork.title}</span>
                  <span className="tabular-nums font-serif text-ink shrink-0">
                    {fmt({
                      price_display: "fixed",
                      price_min: null,
                      price_max: null,
                      display_price: r.artwork.display_price ?? r.artwork.price_min ?? 0,
                    })}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs pt-2">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {fmt({
                    price_display: "fixed",
                    price_min: null,
                    price_max: null,
                    display_price: subtotal,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Shipping</span>
                <span className="tabular-nums text-emerald-700 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>GST (3%)</span>
                <span className="tabular-nums">
                  {fmt({
                    price_display: "fixed",
                    price_min: null,
                    price_max: null,
                    display_price: tax,
                  })}
                </span>
              </div>
              <div className="flex justify-between font-serif text-xl pt-3 border-t border-hairline text-ink font-medium">
                <span>Total</span>
                <span className="tabular-nums">
                  {fmt({
                    price_display: "fixed",
                    price_min: null,
                    price_max: null,
                    display_price: total,
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-hairline text-[11px] text-ink/60 space-y-1">
              <p>• Payment Gateway: Razorpay (All Amounts)</p>
              <p>• GST Rate: 3% (Jewellery)</p>
              <p>• BIS Hallmark: Included</p>
              <p>• Free Insured Shipping: All Orders</p>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

function F({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1">
      <span className="text-xs uppercase tracking-wider text-ink/60 font-medium">{label}</span>
      <input
        {...rest}
        className="border border-hairline bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink"
      />
    </label>
  );
}
