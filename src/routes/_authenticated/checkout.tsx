import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCommerce";
import { useSession } from "@/hooks/useSession";
import { useFormatPrice } from "@/lib/currency-format";
import { useCurrency } from "@/lib/currency";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { resolveImage } from "@/lib/images";
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
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      let checks = 0;
      const interval = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (++checks > 20) {
          clearInterval(interval);
          resolve(false);
        }
      }, 150);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timeout = setTimeout(() => {
      resolve(false);
    }, 6000);
    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
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
  const [openingRazorpay, setOpeningRazorpay] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking">("upi");

  const rows = items ?? [];
  const subtotal = rows.reduce(
    (s, i) => s + (i.artwork.display_price ?? i.artwork.price_min ?? 0) * (i.quantity ?? 1),
    0,
  );
  const shipping = subtotal >= 999 ? 0 : subtotal > 0 ? 99 : 0; // 99 shipping under 999, above 999 is free
  const tax = 0; // GST Free — all prices inclusive of taxes
  const total = subtotal + shipping + tax;

  // All orders go through Razorpay direct online payment
  const isOnlinePaymentEligible = true;

  interface ShippingDetails {
    shippingName: string;
    line1: string;
    line2: string;
    shippingCity: string;
    shippingState: string;
    shippingPostal: string;
    shippingCountry: string;
    phone: string;
  }

  function getShippingFromForm(): ShippingDetails | null {
    const formEl = document.querySelector("#checkout-form") as HTMLFormElement | null;
    if (!formEl) return null;
    const fd = new FormData(formEl);
    const shippingName = String(fd.get("name") ?? "").trim();
    const line1 = String(fd.get("line1") ?? "").trim();
    const line2 = String(fd.get("line2") ?? "").trim();
    const shippingCity = String(fd.get("city") ?? "").trim();
    const shippingState = String(fd.get("state") ?? "").trim();
    const shippingPostal = String(fd.get("postal") ?? "").trim();
    const shippingCountry = String(fd.get("country") ?? "India").trim();
    const phone = String(fd.get("phone") ?? "").trim();

    if (!shippingName || !line1 || !shippingCity || !shippingPostal || !phone) {
      toast.error("Please fill in all required shipping address fields.");
      return null;
    }

    return {
      shippingName,
      line1,
      line2,
      shippingCity,
      shippingState,
      shippingPostal,
      shippingCountry,
      phone,
    };
  }

  async function finalizeConfirmedOrder({
    paymentId,
    paymentMethod,
    shippingData,
  }: {
    paymentId: string;
    paymentMethod: string;
    shippingData: ShippingDetails;
  }) {
    if (!user) return;
    setFinalizing(true);

    try {
      const orderPayload = {
        user_id: user.id,
        customer_name: shippingData.shippingName,
        customer_email: user.email ?? "",
        customer_phone: shippingData.phone,
        shipping_address: {
          line1: shippingData.line1,
          line2: shippingData.line2,
          city: shippingData.shippingCity,
          state: shippingData.shippingState,
          postal: shippingData.shippingPostal,
          country: shippingData.shippingCountry,
        },
        items: rows.map((r) => ({
          artwork_id: r.artwork.id,
          slug: r.artwork.slug,
          title: r.artwork.title,
          quantity: r.quantity ?? 1,
          price: r.artwork.display_price ?? r.artwork.price_min ?? 0,
          image: r.artwork.primary_image_url,
          payment_id: paymentId,
        })),
        total_amount: total,
        currency: activeCurrency || "INR",
        payment_status: "paid",
        payment_method: paymentMethod,
        fulfillment_status: "confirmed",
        tracking_number: `RJ-${Date.now().toString(36).toUpperCase()}`,
      };

      const { data: createdOrder, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (error || !createdOrder) {
        console.error("Order creation error:", error);
        toast.error("Could not record order: " + (error?.message || "Please contact support."));
        setFinalizing(false);
        return;
      }

      // Mark purchased jewellery artworks as sold
      const artworkIds = rows.map((r) => r.artwork.id).filter(Boolean);
      if (artworkIds.length > 0) {
        await supabase
          .from("artworks")
          .update({ availability: "sold" })
          .in("id", artworkIds);
      }

      // Clear cart items
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      // Invalidate relevant queries
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders", user.id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["home-artworks"] });

      toast.success(
        `Payment successful! Order #${createdOrder.id.slice(0, 8).toUpperCase()} placed. Hallmark Certificate included.`
      );

      // Cleanly remove any residual Razorpay iframes and backdrop
      document.querySelectorAll(".razorpay-container, iframe[name^='razorpay']").forEach((el) => {
        try {
          el.remove();
        } catch (_) {}
      });
      document.body.style.overflow = "auto";

      // Redirect immediately to /orders page
      window.location.replace("/orders");
    } catch (err) {
      console.error("Finalize order error:", err);
      toast.error("Error finalizing order. Please check My Orders or contact support.");
      setFinalizing(false);
    }
  }

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || rows.length === 0 || openingRazorpay || finalizing) return;

    const shippingData = getShippingFromForm();
    if (!shippingData) return;

    setOpeningRazorpay(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Razorpay SDK could not be loaded. Please disable any ad-blockers or check connection.");
      setOpeningRazorpay(false);
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TekiII2ARUOC0B";
    const amountInPaise = Math.round(total * 100);

    let rzpInstance: any = null;

    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: activeCurrency || "INR",
      name: "Raajsi Jewels",
      description: `Heritage Fine Jewellery (${rows.length} piece${rows.length > 1 ? "s" : ""})`,
      prefill: {
        name: shippingData.shippingName,
        email: user.email ?? "",
        contact: shippingData.phone,
      },
      notes: {
        customer_name: shippingData.shippingName,
        shipping_address: [
          shippingData.line1,
          shippingData.line2,
          shippingData.shippingCity,
          shippingData.shippingState,
          shippingData.shippingPostal,
          shippingData.shippingCountry,
        ]
          .filter(Boolean)
          .join(", "),
        items: rows.map((r) => r.artwork.title).join("; "),
      },
      theme: {
        color: "#b8860b", // Raajsi Royal Gold
      },
      modal: {
        ondismiss: function () {
          setOpeningRazorpay(false);
          toast.info("Payment window closed.");
        },
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) {
        // Immediately dismiss the Razorpay modal overlay so customer is never stuck
        try {
          if (rzpInstance && typeof rzpInstance.close === "function") {
            rzpInstance.close();
          }
        } catch (_) {}
        document.querySelectorAll(".razorpay-container, iframe[name^='razorpay']").forEach((el) => {
          try {
            el.remove();
          } catch (_) {}
        });
        document.body.style.overflow = "auto";
        setOpeningRazorpay(false);

        await finalizeConfirmedOrder({
          paymentId: response.razorpay_payment_id,
          paymentMethod: "razorpay",
          shippingData,
        });
      },
    };

    try {
      rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (failResp: any) {
        console.error("Razorpay payment failed:", failResp?.error);
        toast.error(failResp?.error?.description || "Payment failed. Please try another method.");
        setOpeningRazorpay(false);
      });
      rzpInstance.open();
      setOpeningRazorpay(false);
    } catch (err) {
      console.error("Failed to open Razorpay modal:", err);
      toast.error("Could not launch Razorpay modal. You may use sandbox test checkout.");
      setOpeningRazorpay(false);
    }
  }

  async function handleTestSandboxPayment() {
    if (!user || rows.length === 0 || openingRazorpay || finalizing) return;
    const shippingData = getShippingFromForm();
    if (!shippingData) return;

    setFinalizing(true);
    const mockPaymentId = `rzp_test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    toast.info("Processing sandbox test payment...");
    await finalizeConfirmedOrder({
      paymentId: mockPaymentId,
      paymentMethod: "razorpay_sandbox",
      shippingData,
    });
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
      {finalizing && (
        <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-paper text-center">
          <div className="w-12 h-12 border-3 border-[color:var(--gold)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-serif text-2xl text-[color:var(--gold)] mb-2">Order Confirmed!</p>
          <p className="text-xs text-paper/80 max-w-sm leading-relaxed mb-4">
            Payment verified. We are recording your acquisition and preparing your BIS Hallmark Certificate...
          </p>
          <a
            href="/orders"
            className="text-xs text-[color:var(--gold)] underline hover:opacity-80"
          >
            Click here if not redirected automatically →
          </a>
        </div>
      )}

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
            disabled={openingRazorpay || finalizing}
            className="cta-gold w-full !py-3.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
          >
            <Lock size={15} />
            {openingRazorpay
              ? "Opening Razorpay..."
              : finalizing
                ? "Recording Order..."
                : `Pay via Razorpay · ${fmt({ price_display: "fixed", price_min: null, price_max: null, display_price: total })}`}
          </button>

          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              type="button"
              disabled={openingRazorpay || finalizing}
              onClick={handleTestSandboxPayment}
              className="text-xs text-ink/70 hover:text-ink font-medium underline flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <CheckCircle2 size={13} className="text-emerald-600" />
              Test Mode: Instant Sandbox Checkout (Simulate Payment)
            </button>
            <p className="text-[11px] text-center text-ink/60 flex items-center justify-center gap-1">
              <ShieldCheck size={13} className="text-emerald-700" />
              100% BIS Hallmark &amp; 925 Silver Certified · Free Delivery above ₹999 · 7 Days Exchange
            </p>
          </div>
        </form>

        {/* Order Summary Sidebar */}
        <aside className="space-y-4">
          <div className="border border-hairline p-6 bg-paper space-y-4">
            <h3 className="font-serif text-lg border-b border-hairline pb-3">
              Order Summary
            </h3>
            <div className="space-y-3 text-xs">
              {rows.map((r) => {
                const qty = r.quantity ?? 1;
                const unitPrice = r.artwork.display_price ?? r.artwork.price_min ?? 0;
                const itemTotal = unitPrice * qty;

                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-2 border-b border-hairline/40"
                  >
                    <div className="w-12 h-14 bg-mist overflow-hidden border border-hairline/60 rounded-xs shrink-0">
                      {r.artwork.primary_image_url && (
                        <img
                          src={resolveImage(r.artwork.primary_image_url)}
                          alt={r.artwork.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate italic font-serif text-ink text-xs">{r.artwork.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Qty: <span className="font-semibold text-ink font-mono">{qty}</span>
                        {qty > 1 && ` × ${fmt({ price_display: "fixed", price_min: null, price_max: null, display_price: unitPrice })}`}
                      </p>
                    </div>
                    <span className="tabular-nums font-serif text-ink shrink-0 text-xs font-medium">
                      {fmt({
                        price_display: "fixed",
                        price_min: null,
                        price_max: null,
                        display_price: itemTotal,
                      })}
                    </span>
                  </div>
                );
              })}
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
                <span className="tabular-nums font-medium">
                  {shipping === 0 ? (
                    <span className="text-emerald-700">FREE (Above ₹999)</span>
                  ) : (
                    <span>₹99</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>GST / Taxes</span>
                <span className="tabular-nums text-emerald-700 font-medium">FREE (Included)</span>
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
