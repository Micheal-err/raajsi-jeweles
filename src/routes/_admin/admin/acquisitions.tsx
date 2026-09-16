import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormatPrice } from "@/lib/currency-format";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Package,
  UserX,
  AlertTriangle,
  Globe,
  DollarSign,
} from "lucide-react";

const STAGES = [
  { key: "new", label: "New Lead", color: "bg-blue-100 text-blue-900 border-blue-200" },
  { key: "contacted", label: "Contacted", color: "bg-amber-100 text-amber-900 border-amber-200" },
  {
    key: "negotiating",
    label: "Negotiating",
    color: "bg-purple-100 text-purple-900 border-purple-200",
  },
  {
    key: "kyc_pending",
    label: "KYC / ID Review",
    color: "bg-orange-100 text-orange-900 border-orange-200",
  },
  {
    key: "payment_pending",
    label: "Payment Pending",
    color: "bg-yellow-100 text-yellow-900 border-yellow-200",
  },
  {
    key: "payment_received",
    label: "Payment Received",
    color: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  { key: "closed_lost", label: "Closed / Lost", color: "bg-red-100 text-red-900 border-red-200" },
] as const;

import {
  formatCurrencyWithCode,
  convertCurrency,
  SYMBOL,
  LOCALE,
  type Currency,
} from "@/lib/currency";

function extractPhone(order: any): string {
  if (!order) return "N/A";

  if (order.notes) {
    const match = order.notes.match(/Phone:\s*([^\n,]+)/i);
    if (match && match[1]) return match[1].trim();
  }

  if (order.shipping_address) {
    const match = order.shipping_address.match(/Phone:\s*([^\n,]+)/i);
    if (match && match[1]) return match[1].trim();

    const phoneDigits = order.shipping_address.match(/(\+?\d[\d\s-]{7,}\d)/);
    if (phoneDigits && phoneDigits[1]) return phoneDigits[1].trim();
  }

  return "Provided in checkout";
}

export const Route = createFileRoute("/_admin/admin/acquisitions")({
  head: () => ({
    meta: [{ title: "Acquisition Queue (≥ ₹1L / Multi-Currency) — Raajsi Jewels Admin" }],
  }),
  component: AcquisitionQueuePage,
});

function AcquisitionQueuePage() {
  const [filterStage, setFilterStage] = useState<string>("all");
  const qc = useQueryClient();
  const fmt = useFormatPrice();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["admin-acquisitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acquisition_cases")
        .select("*,orders(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateCase = useMutation({
    mutationFn: async (payload: {
      id: string;
      order_id: string;
      stage: string;
      agreed_amount?: number | null;
      payment_method?: string | null;
      payment_reference?: string | null;
      notes?: string | null;
      hold_expires_at?: string | null;
      artwork_ids?: string[];
    }) => {
      if (!payload.id) {
        throw new Error("Missing acquisition case ID.");
      }

      // 1. Update the target acquisition case strictly by payload.id
      const { error } = await supabase
        .from("acquisition_cases")
        .update({
          stage: payload.stage as any,
          agreed_amount: payload.agreed_amount,
          payment_method: payload.payment_method,
          payment_reference: payload.payment_reference,
          notes: payload.notes,
          hold_expires_at: payload.hold_expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id);

      if (error) throw error;

      // 2. Handle linked order update ONLY if order_id is valid
      if (payload.order_id) {
        if (payload.stage === "payment_received") {
          await supabase
            .from("orders")
            .update({ status: "confirmed", updated_at: new Date().toISOString() })
            .eq("id", payload.order_id);

          if (payload.artwork_ids && payload.artwork_ids.length > 0) {
            await supabase
              .from("artworks")
              .update({ availability: "sold" })
              .in("id", payload.artwork_ids);

            try {
              await supabase.rpc("update_artworks_availability", {
                p_artwork_ids: payload.artwork_ids,
                p_availability: "sold",
              });
            } catch (e) {
              console.warn("RPC update_artworks_availability warning:", e);
            }
          }
        } else if (payload.stage === "closed_lost") {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancel_reason: payload.notes || "Acquisition case closed/lost",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payload.order_id);

          if (payload.artwork_ids && payload.artwork_ids.length > 0) {
            // DIRECT TABLE UPDATE: Automatically restore stock/availability to 'available'
            const { error: artErr } = await supabase
              .from("artworks")
              .update({ availability: "available" })
              .in("id", payload.artwork_ids);

            if (artErr) {
              console.error("Error restoring artworks availability:", artErr);
            }

            try {
              await supabase.rpc("update_artworks_availability", {
                p_artwork_ids: payload.artwork_ids,
                p_availability: "available",
              });
            } catch (e) {
              console.warn("RPC update_artworks_availability warning:", e);
            }
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-acquisitions"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork"] });
      qc.invalidateQueries({ queryKey: ["home-artworks"] });
      toast.success("Acquisition case updated successfully.");
    },
    onError: (err: any) => {
      console.error("Acquisition update error:", err);
      toast.error(err?.message || "Could not update acquisition case.");
    },
  });

  const uniqueCases = useMemo(() => {
    const seen = new Set<string>();
    return cases.filter((c: any) => {
      const key = c.order_id || c.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [cases]);

  const filtered =
    filterStage === "all" ? uniqueCases : uniqueCases.filter((c: any) => c.stage === filterStage);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="eyebrow text-[color:var(--accent)]">
            High-Value Multi-Currency Pipeline
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-ink">
            Acquisition Queue (≥ ₹1 Lakh / Multi-Currency)
          </h1>
          <p className="text-xs text-ink/60 mt-1">
            White-glove negotiation, international collector contact verification, shipping
            calculation &amp; wire transfer confirmation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-ink/70">Filter Stage:</label>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="border border-hairline px-3 py-2 text-xs bg-paper font-medium"
          >
            <option value="all">All Stages ({uniqueCases.length})</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({uniqueCases.filter((c: any) => c.stage === s.key).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs tracking-widest text-ink/40 uppercase">
          Loading acquisition pipeline...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-hairline p-8 space-y-2">
          <p className="font-serif text-xl">No acquisition cases found.</p>
          <p className="text-xs text-ink/60 max-w-sm mx-auto">
            High-value orders submitted by collectors in domestic or international currencies will
            automatically land in this queue.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((item) => {
            const order = item.orders as any;
            const currentStageObj = STAGES.find((s) => s.key === item.stage) ?? STAGES[0];
            return (
              <AcquisitionCard
                key={item.id}
                item={item}
                order={order}
                currentStageObj={currentStageObj}
                fmt={fmt}
                onUpdate={(payload) =>
                  updateCase.mutate({ id: item.id, order_id: item.order_id, ...payload })
                }
                isPending={updateCase.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function AcquisitionCard({
  item,
  order,
  currentStageObj,
  fmt,
  onUpdate,
  isPending,
}: {
  item: any;
  order: any;
  currentStageObj: { key: string; label: string; color: string };
  fmt: any;
  onUpdate: (payload: any) => void;
  isPending: boolean;
}) {
  const orderCurrency = (order?.currency || "INR").toUpperCase() as Currency;
  const currencySymbol = SYMBOL[orderCurrency] || "₹";

  const defaultConvertedTotal = useMemo(() => {
    return convertCurrency(order?.total ?? 0, orderCurrency).toFixed(2);
  }, [order?.total, orderCurrency]);

  const [stage, setStage] = useState(item.stage);
  const [agreedAmount, setAgreedAmount] = useState(item.agreed_amount ?? defaultConvertedTotal);
  const [method, setMethod] = useState(item.payment_method ?? "bank_transfer");
  const [reference, setReference] = useState(item.payment_reference ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");

  useEffect(() => {
    setStage(item.stage);
    setAgreedAmount(item.agreed_amount ?? defaultConvertedTotal);
    setMethod(item.payment_method ?? "bank_transfer");
    setReference(item.payment_reference ?? "");
    setNotes(item.notes ?? "");
  }, [
    item.stage,
    item.agreed_amount,
    item.payment_method,
    item.payment_reference,
    item.notes,
    defaultConvertedTotal,
  ]);

  const itemsList = useMemo(() => {
    if (!order?.items) return [];
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === "string") {
      try {
        const parsed = JSON.parse(order.items);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [order?.items]);

  const artworkIds = itemsList.map((i: any) => i.artwork_id || i.id).filter(Boolean);
  const isOrderCancelled = order?.status === "cancelled";

  const handleSave = (customStage?: string) => {
    const targetStage = customStage || stage;
    onUpdate({
      stage: targetStage,
      agreed_amount: agreedAmount ? Number(agreedAmount) : null,
      payment_method: method,
      payment_reference: reference,
      notes,
      hold_expires_at: item.hold_expires_at,
      artwork_ids: artworkIds,
    });
  };

  const handleExtendHold = () => {
    const newHold = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    onUpdate({
      stage,
      agreed_amount: agreedAmount ? Number(agreedAmount) : null,
      payment_method: method,
      payment_reference: reference,
      notes,
      hold_expires_at: newHold,
      artwork_ids: artworkIds,
    });
    toast.success("Hold extended by 48 hours.");
  };

  return (
    <div
      className={`border p-6 shadow-sm space-y-6 bg-paper ${isOrderCancelled ? "border-red-300 bg-red-50/20" : "border-hairline"}`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">Case #{item.id.slice(0, 8).toUpperCase()}</span>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded ${currentStageObj.color}`}
            >
              {currentStageObj.label}
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900 rounded flex items-center gap-1">
              <Globe size={11} /> Currency: {orderCurrency} ({currencySymbol})
            </span>
            {isOrderCancelled && (
              <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                <AlertTriangle size={12} /> Cancelled by Collector
              </span>
            )}
          </div>
          <h3 className="font-serif text-xl font-medium text-ink">
            Collector: {order?.shipping_name || "Anonymous Collector"}
          </h3>
          <p className="text-xs text-ink/60 mt-0.5">
            Order #{order?.id?.slice(0, 8).toUpperCase()} · Created{" "}
            {new Date(item.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-ink/40 mb-0.5">
            Total Acquisition Value ({orderCurrency})
          </div>
          <div className="font-serif text-2xl font-medium text-ink">
            {formatCurrencyWithCode(Number(order?.total ?? 0), orderCurrency)}
          </div>
        </div>
      </div>

      {/* Collector Details, Address & Financial Breakdown Box */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-mist/40 border border-hairline text-xs">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1">
            <Phone size={12} /> Contact Information
          </div>
          <div>
            <span className="font-medium text-ink/70">Collector Name:</span>{" "}
            {order?.shipping_name || "N/A"}
          </div>
          <div>
            <span className="font-medium text-ink/70">Email:</span>{" "}
            <a href={`mailto:${order?.shipping_email}`} className="text-amber-900 underline">
              {order?.shipping_email || "N/A"}
            </a>
          </div>
          <div>
            <span className="font-medium text-ink/70">Phone Number:</span>{" "}
            <span className="font-mono text-ink font-semibold">{extractPhone(order)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1">
            <MapPin size={12} /> Shipping Destination
          </div>
          <div>{order?.shipping_address || "Address provided at inquiry"}</div>
          <div className="font-semibold text-ink">
            {[order?.shipping_city, order?.shipping_postal, order?.shipping_country]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>

        <div className="space-y-1.5 border-l border-hairline pl-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1">
            <DollarSign size={12} /> Financial Breakdown ({orderCurrency})
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Subtotal:</span>
            <span className="font-mono">
              {formatCurrencyWithCode(Number(order?.subtotal ?? 0), orderCurrency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Shipping:</span>
            <span className="font-mono">
              {formatCurrencyWithCode(Number(order?.shipping_cost ?? 0), orderCurrency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Tax:</span>
            <span className="font-mono">
              {formatCurrencyWithCode(Number(order?.tax_cost ?? 0), orderCurrency)}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-hairline font-bold text-ink">
            <span>Total:</span>
            <span className="font-mono">
              {formatCurrencyWithCode(Number(order?.total ?? 0), orderCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Artworks Included */}
      {itemsList.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink/50 flex items-center gap-1">
            <Package size={12} /> Requested Artworks ({itemsList.length})
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {itemsList.map((art: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 border border-hairline bg-paper text-xs"
              >
                {art.image && (
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-12 h-12 object-cover border border-hairline flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-serif font-medium truncate">{art.title}</div>
                  <div className="text-ink/60 font-mono text-[11px]">
                    {formatCurrencyWithCode(Number(art.price ?? 0), orderCurrency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Alert Banner */}
      {isOrderCancelled && (
        <div className="p-4 bg-red-100/60 border border-red-200 text-red-900 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <UserX size={14} /> Acquisition Cancelled
          </div>
          <p>
            Reason: {order.cancel_reason || "Cancelled by collector"}. Artwork availability has been
            automatically restored to AVAILABLE.
          </p>
        </div>
      )}

      {/* Editing Form Grid */}
      <div className="grid md:grid-cols-3 gap-6 text-xs">
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-medium text-ink/60">
            Pipeline Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            disabled={isOrderCancelled}
            className="w-full border border-hairline p-2 bg-transparent text-ink focus:outline-none focus:border-ink"
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-medium text-ink/60">
            Agreed Sale Amount ({currencySymbol} {orderCurrency})
          </label>
          <input
            type="number"
            value={agreedAmount}
            onChange={(e) => setAgreedAmount(e.target.value)}
            disabled={isOrderCancelled}
            placeholder={`e.g. ${orderCurrency === "USD" ? "10500" : "850000"}`}
            className="w-full border border-hairline p-2 bg-transparent text-ink focus:outline-none focus:border-ink font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-medium text-ink/60">
            Payment Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={isOrderCancelled}
            className="w-full border border-hairline p-2 bg-transparent text-ink focus:outline-none focus:border-ink"
          >
            <option value="bank_transfer">Wire Transfer / SWIFT / NEFT</option>
            <option value="rtgs">RTGS</option>
            <option value="cheque">Cheque / Demand Draft</option>
            <option value="other">Other Direct Method</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-medium text-ink/60">
            Payment Reference / SWIFT / UTR Number
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={isOrderCancelled}
            placeholder="e.g. SWIFT12345678 / UTR9876543210"
            className="w-full border border-hairline p-2 bg-transparent text-ink focus:outline-none focus:border-ink font-mono"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-medium text-ink/60">
            Curatorial, Location &amp; Shipping Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isOrderCancelled}
            placeholder="e.g. Verified international destination in US. Calculated custom shipping duties."
            className="w-full border border-hairline p-2 bg-transparent text-ink focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-ink/60 flex items-center gap-2">
          <Clock size={14} className="text-amber-700" />
          Hold Expiry:{" "}
          <span className="font-medium text-ink">
            {item.hold_expires_at
              ? new Date(item.hold_expires_at).toLocaleString("en-IN")
              : "Standard 72-Hour Hold Active"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isOrderCancelled && (
            <>
              <button
                type="button"
                onClick={handleExtendHold}
                disabled={isPending}
                className="px-3 py-1.5 border border-hairline hover:bg-mist text-xs font-medium transition"
              >
                + Extend Hold (48h)
              </button>

              <button
                type="button"
                onClick={() => handleSave("closed_lost")}
                disabled={isPending}
                className="px-3 py-1.5 border border-red-200 text-red-800 hover:bg-red-50 text-xs font-medium transition"
              >
                Cancel Acquisition
              </button>

              <button
                type="button"
                onClick={() => handleSave("payment_received")}
                disabled={isPending}
                className="px-3 py-1.5 bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-medium transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Confirm Sale &amp; Mark Paid ({currencySymbol})
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isPending}
            className="cta-red text-xs !py-1.5 !px-4"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
