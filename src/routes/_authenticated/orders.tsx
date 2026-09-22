import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Package,
  MapPin,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { useFormatPrice } from "@/lib/currency-format";
import { resolveImage } from "@/lib/images";
import { formatCurrencyWithCode } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Raajsi Jewels" },
      {
        name: "description",
        content: "Order history and tracking for your Raajsi Jewels acquisitions.",
      },
      { property: "og:title", content: "My orders" },
      { property: "og:description", content: "Order history and tracking." },
    ],
  }),
  component: OrdersPage,
});

interface OrderItem {
  id?: string;
  artwork_id?: string;
  slug?: string;
  title?: string;
  artistName?: string;
  price?: number;
  image?: string;
  payment_id?: string | null;
}

interface Order {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  total_amount?: number | null;
  total?: number | null;
  currency?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_name?: string | null;
  shipping_address?: unknown;
  shipping_city?: string | null;
  shipping_country?: string | null;
  items: unknown;
  payment_status?: string | null;
  payment_method?: string | null;
  fulfillment_status?: string | null;
  status?: string | null;
  tracking_number?: string | null;
  carrier_name?: string | null;
  estimated_delivery?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
}

const STATUS_STEPS = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing & Hallmarking", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

function renderShippingAddressContent(addr: unknown, city?: string | null, country?: string | null) {
  if (!addr) {
    const fallback = [city, country].filter(Boolean).join(", ");
    return fallback ? <p>{fallback}</p> : <p className="text-ink/50 italic">Standard registered address</p>;
  }
  if (typeof addr === "string") {
    return <p>{[addr, city, country].filter(Boolean).join(", ")}</p>;
  }
  if (typeof addr === "object" && addr !== null) {
    const a = addr as Record<string, string>;
    const lineStr = [a.line1, a.line2].filter(Boolean).join(", ");
    const cityStr = [a.city, a.state, a.postal].filter(Boolean).join(", ");
    const cStr = a.country || country || "India";
    return (
      <div className="space-y-0.5">
        {lineStr && <p>{lineStr}</p>}
        {cityStr && <p>{cityStr}</p>}
        {cStr && <p>{cStr}</p>}
      </div>
    );
  }
  return null;
}

function OrdersPage() {
  const { user } = useSession();
  const fmt = useFormatPrice();
  const qc = useQueryClient();
  const [selectedCoa, setSelectedCoa] = useState<{
    item: OrderItem;
    orderId: string;
    date: string;
  } | null>(null);

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ order, reason }: { order: Order; reason: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          fulfillment_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      if (error) throw error;

      // Revert artwork availability back to available
      const rawItems = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
      const artworkIds = rawItems.map((i) => i.artwork_id || i.id).filter(Boolean) as string[];
      if (artworkIds.length > 0) {
        await supabase.from("artworks").update({ availability: "available" }).in("id", artworkIds);
        qc.invalidateQueries({ queryKey: ["collection"] });
        qc.invalidateQueries({ queryKey: ["artworks"] });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast.success("Order cancelled successfully.");
      setCancelModalOrder(null);
      setCancelReasonInput("");
    },
    onError: (err: any) => {
      console.error("Cancel order error:", err);
      toast.error("Could not cancel order: " + (err?.message || "Please contact support."));
    },
  });

  return (
    <>
      <PageHero
        eyebrow="My orders"
        title={
          <KineticTitle>
            Your <em className="italic">acquisitions</em>.
          </KineticTitle>
        }
        lede="Every order tracked from confirmation to installation."
        visual="cart"
      />
      <section className="container-editorial py-16">
        {isLoading ? (
          <div className="py-20 text-center text-ink/40 text-sm tracking-widest uppercase">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl mb-4">No orders yet.</p>
            <p className="text-sm text-ink/60 mb-6 max-w-md mx-auto">
              When you inquire or purchase works from Raajsi Jewels, your acquisition
              progress will appear here.
            </p>
            <Link to="/collection" className="cta-red">
              Browse the collection →
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {orders.map((o) => {
              const rawItems = Array.isArray(o.items) ? (o.items as OrderItem[]) : [];
              const orderStatus = o.fulfillment_status || o.status || "confirmed";
              const isCancelled = orderStatus === "cancelled";
              const activeStepIdx = STATUS_STEPS.findIndex((s) => s.key === orderStatus);
              const currentStepIdx = activeStepIdx >= 0 ? activeStepIdx : 0;
              const customerName = o.customer_name || o.shipping_name || "Valued Collector";
              const totalDisplay = Number(o.total_amount ?? o.total ?? 0);
              const isPaid = (o.payment_status || "paid").toLowerCase() === "paid";
              const orderTracking = o.tracking_number;
              const paymentId = rawItems.find((i) => i.payment_id)?.payment_id;

              return (
                <div
                  key={o.id}
                  className="border border-hairline bg-paper p-6 md:p-8 shadow-sm space-y-8"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-hairline">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <span className="eyebrow">
                          Order #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-red-100 text-red-800 border border-red-200 rounded">
                            <XCircle size={12} />
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-mist border border-hairline text-ink/80 rounded">
                            {STATUS_STEPS.find((s) => s.key === orderStatus)?.label ??
                              orderStatus.replace(/_/g, " ")}
                          </span>
                        )}

                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 rounded">
                            <ShieldCheck size={12} className="text-emerald-600" />
                            Razorpay Verified
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl text-ink">
                        Placed on{" "}
                        {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </h3>
                      <p className="text-xs text-ink/60 mt-0.5">
                        Customer: <span className="font-medium text-ink">{customerName}</span>
                        {o.customer_phone ? ` · ${o.customer_phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">
                        Total Amount
                      </div>
                      <div className="font-serif text-2xl text-ink font-medium">
                        {formatCurrencyWithCode(totalDisplay, o.currency || "INR")}
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Free Insured Delivery
                      </span>
                    </div>
                  </div>

                  {/* Status Progress Bar or Cancellation Notice */}
                  <div>
                    <h4 className="text-[10px] tracking-[0.22em] uppercase text-ink/40 mb-4">
                      Fulfillment &amp; Hallmarking Status
                    </h4>
                    {isCancelled ? (
                      <div className="p-4 border border-red-200 bg-red-50/80 text-red-900 rounded-sm flex items-start gap-3">
                        <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-red-800">
                            Order Cancelled
                          </div>
                          <div className="text-xs text-red-700 mt-1">
                            This jewellery order has been cancelled. For any questions, please contact our
                            concierge team at care@raajsi.com or WhatsApp +91 98290 12345.
                            {o.cancel_reason && (
                              <p className="mt-1 font-medium italic">Reason: {o.cancel_reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            const StepIcon = step.icon;
                            return (
                              <div
                                key={step.key}
                                className={`p-3 border transition-colors ${
                                  isCurrent
                                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/5 text-ink shadow-sm"
                                    : isDone
                                      ? "border-hairline bg-mist/50 text-ink/70"
                                      : "border-hairline/40 opacity-40 text-ink/40"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <StepIcon
                                    size={14}
                                    className={isCurrent ? "text-[color:var(--accent)]" : ""}
                                  />
                                  <span className="text-xs font-medium tracking-wide">
                                    {step.label}
                                  </span>
                                </div>
                                <div className="text-[10px] text-ink/40">
                                  {isDone ? (isCurrent ? "In progress" : "Completed") : "Pending"}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tracking Details */}
                        {(orderTracking || paymentId) && (
                          <div className="mt-4 p-4 border border-hairline bg-mist/30 rounded-sm grid sm:grid-cols-2 gap-4 text-xs">
                            {orderTracking && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-ink/40 font-medium">
                                  Tracking Number
                                </div>
                                <div className="font-mono text-ink mt-0.5 select-all font-semibold">
                                  {orderTracking}
                                </div>
                              </div>
                            )}
                            {paymentId && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-ink/40 font-medium">
                                  Razorpay Payment ID
                                </div>
                                <div className="font-mono text-ink/80 mt-0.5 select-all">
                                  {paymentId}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Order Items & Shipping info */}
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Item list */}
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="text-[10px] tracking-[0.22em] uppercase text-ink/40 mb-2">
                        Acquired Jewellery Pieces ({rawItems.length})
                      </h4>
                      {rawItems.length === 0 ? (
                        <p className="text-xs text-ink/50 italic">
                          Piece details recorded in order file.
                        </p>
                      ) : (
                        rawItems.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 p-3 bg-mist/30 border border-hairline"
                          >
                            {item.image && (
                              <img
                                src={resolveImage(item.image)}
                                alt={item.title || "Jewellery piece"}
                                className="w-14 h-16 object-cover border border-hairline shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-sm font-medium text-ink truncate">
                                {item.title || "Heritage Jewellery"}
                              </p>
                              {item.artistName && (
                                <p className="text-xs text-ink/60">{item.artistName}</p>
                              )}
                              {item.price && (
                                <p className="text-xs font-serif mt-0.5 text-ink/70">
                                  {formatCurrencyWithCode(item.price, o.currency || "INR")}
                                </p>
                              )}
                            </div>
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCoa({ item, orderId: o.id, date: o.created_at })
                                }
                                className="px-3 py-1.5 border border-ink/20 text-[10px] tracking-widest uppercase hover:bg-ink hover:text-paper transition flex items-center gap-1.5 shrink-0"
                              >
                                <Award size={12} /> Certificate
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Shipping Destination */}
                    <div className="border-l border-hairline md:pl-6 space-y-3">
                      <h4 className="text-[10px] tracking-[0.22em] uppercase text-ink/40 flex items-center gap-1">
                        <MapPin size={12} /> Insured Delivery Destination
                      </h4>
                      <div className="text-xs space-y-1 text-ink/80">
                        <p className="font-medium text-ink">{customerName}</p>
                        {renderShippingAddressContent(o.shipping_address, o.shipping_city, o.shipping_country)}
                      </div>
                      <div className="pt-3 border-t border-hairline flex items-center gap-1.5 text-[11px] text-ink/50">
                        <ShieldCheck size={14} className="text-emerald-700" /> Insured White-Glove
                        Delivery &amp; BIS Hallmark Included
                      </div>
                    </div>
                  </div>

                  {/* Order Cancellation Controls */}
                  {(() => {
                    const hoursSinceOrder =
                      (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
                    const isCancelEligible =
                      hoursSinceOrder <= 24 &&
                      (orderStatus === "inquiry_sent" || orderStatus === "confirmed");
                    if (isCancelled) return null;
                    return (
                      <div className="pt-4 border-t border-hairline flex items-center justify-between gap-4 text-xs">
                        <div className="text-ink/60 text-[11px]">
                          {isCancelEligible ? (
                            <span className="text-emerald-800 font-medium">
                              Eligible for 24-hour self-cancellation
                            </span>
                          ) : (
                            <span className="text-ink/40">Order in active fulfillment process</span>
                          )}
                        </div>
                        {isCancelEligible ? (
                          <button
                            type="button"
                            onClick={() => setCancelModalOrder(o)}
                            className="text-xs text-red-700 hover:text-red-900 border border-red-200 hover:border-red-300 bg-red-50/50 px-3 py-1.5 rounded transition font-medium flex items-center gap-1.5"
                          >
                            <X size={13} /> Cancel Order
                          </button>
                        ) : (
                          <a
                            href="mailto:care@raajsi.com"
                            className="text-[11px] text-ink/60 hover:text-ink link-underline"
                          >
                            Request Cancellation via Support
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* COA Certificate Modal */}
      {selectedCoa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-paper border-2 border-hairline p-8 md:p-10 shadow-2xl relative">
            <button
              onClick={() => setSelectedCoa(null)}
              className="absolute top-4 right-4 p-2 text-ink/50 hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>

            {/* Certificate Header */}
            <div className="text-center border-b border-hairline pb-6 mb-6">
              <div className="text-[10px] tracking-[0.3em] uppercase text-ink/40 mb-1">
                Official Document
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-ink">
                Certificate of Authenticity
              </h2>
              <p className="text-xs text-ink/60 mt-1 italic font-serif">
                Raajsi Jewels · Jaipur, India
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-6 text-center">
              {selectedCoa.item.image && (
                <img
                  src={resolveImage(selectedCoa.item.image)}
                  alt={selectedCoa.item.title}
                  className="w-28 h-32 object-cover border border-hairline mx-auto shadow-sm"
                />
              )}
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-ink/50 mb-1">
                  Work Title
                </p>
                <h3 className="font-serif text-xl font-medium text-ink">
                  {selectedCoa.item.title || "Untitled Artwork"}
                </h3>
                {selectedCoa.item.artistName && (
                  <p className="text-sm text-ink/70 mt-0.5">By {selectedCoa.item.artistName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs py-4 border-y border-hairline text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink/40 block">
                    Gallery Registry ID
                  </span>
                  <span className="font-mono text-ink text-xs">
                    {selectedCoa.orderId.slice(0, 12).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink/40 block">
                    Acquisition Date
                  </span>
                  <span className="text-ink">
                    {new Date(selectedCoa.date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink/40 block">
                    Provenance
                  </span>
                  <span className="text-ink font-medium">Direct Artist Studio</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink/40 block">
                    Guarantee
                  </span>
                  <span className="text-ink font-medium">Lifetime Authenticity</span>
                </div>
              </div>

              <p className="text-[11px] text-ink/60 leading-relaxed italic">
                This document certifies that the work described above is an authentic piece created
                by the named artist and verified by the curatorial team at Raajsi Jewels.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-hairline">
              <button
                onClick={() => window.print()}
                className="cta-ghost flex items-center gap-2 text-xs"
              >
                <Printer size={14} /> Print Certificate
              </button>
              <button onClick={() => setSelectedCoa(null)} className="cta-red text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Cancellation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-paper border border-hairline p-6 md:p-8 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setCancelModalOrder(null)}
              className="absolute top-4 right-4 p-2 text-ink/50 hover:text-ink"
            >
              <X size={18} />
            </button>
            <div className="eyebrow text-red-800">Cancel Acquisition</div>
            <h3 className="font-serif text-xl">
              Cancel Order #{cancelModalOrder.id.slice(0, 8).toUpperCase()}?
            </h3>
            <p className="text-xs text-ink/70">
              You are within the 24-hour self-cancellation window. Please let us know why you wish
              to cancel this order.
            </p>
            <div>
              <label className="block text-xs font-medium text-ink/80 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Changed my mind, ordered by mistake, etc."
                className="w-full border border-hairline p-2 text-xs bg-transparent focus:outline-none focus:border-ink"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-xs border border-hairline hover:bg-mist"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelOrderMutation.isPending}
                onClick={() =>
                  cancelOrderMutation.mutate({
                    order: cancelModalOrder,
                    reason: cancelReasonInput,
                  })
                }
                className="px-4 py-2 text-xs bg-red-700 hover:bg-red-800 text-paper font-medium disabled:opacity-50"
              >
                {cancelOrderMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
