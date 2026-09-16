import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, ChevronDown } from "lucide-react";
import { formatCurrencyWithCode } from "@/lib/currency";

const STATUSES = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/_admin/admin/orders")({
  head: () => ({
    meta: [{ title: "Manage Orders — Raajsi Jewels Admin" }],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      orderItems,
    }: {
      id: string;
      status: string;
      orderItems?: any[];
    }) => {
      const payload: any = {
        fulfillment_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === "cancelled") {
        payload.cancelled_at = new Date().toISOString();
      }
      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (error) throw error;

      // Synchronize artwork availability in stock
      if (orderItems && orderItems.length > 0) {
        const artworkIds = orderItems.map((i: any) => i.artwork_id || i.id).filter(Boolean);
        if (artworkIds.length > 0) {
          let newAvail: "available" | "reserved" | "sold" = "available";
          if (status === "confirmed" || status === "shipped" || status === "delivered") {
            newAvail = "sold";
          } else if (status === "inquiry_sent") {
            newAvail = "reserved";
          } else if (status === "cancelled") {
            newAvail = "available";
          }
          await supabase.from("artworks").update({ availability: newAvail }).in("id", artworkIds);
          qc.invalidateQueries({ queryKey: ["collection"] });
          qc.invalidateQueries({ queryKey: ["artworks"] });
          qc.invalidateQueries({ queryKey: ["artwork"] });
          qc.invalidateQueries({ queryKey: ["home-artworks"] });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-acquisitions"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const updateFulfillment = useMutation({
    mutationFn: async (payload: {
      id: string;
      carrier_name?: string | null;
      tracking_number?: string | null;
      estimated_delivery?: string | null;
      cancel_reason?: string | null;
      notes?: string | null;
    }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from("orders")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Shipping & fulfillment details saved");
    },
    onError: () => toast.error("Failed to save shipping details"),
  });

  const rows: any[] = (data ?? []) as any[];
  const filtered =
    filterStatus === "all"
      ? rows
      : rows.filter((o: any) => (o.fulfillment_status || o.status) === filterStatus);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} total ·{" "}
            {
              rows.filter(
                (o) =>
                  (o.fulfillment_status || o.status) === "pending" ||
                  (o.fulfillment_status || o.status) === "processing",
              ).length
            }{" "}
            pending
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!filtered.length}
            onClick={() => {
              if (!filtered.length) return;
              const csvRows = [
                [
                  "Order ID",
                  "Date",
                  "Customer Name",
                  "Email",
                  "Total",
                  "Currency",
                  "Status",
                  "Carrier",
                  "Tracking",
                  "Est Delivery",
                  "Shipping Address",
                ],
                ...filtered.map((o: any) => [
                  o.id,
                  new Date(o.created_at).toISOString(),
                  o.customer_name || o.shipping_name || "",
                  o.customer_email || o.shipping_email || "",
                  o.total_amount || o.total || 0,
                  o.currency || "INR",
                  o.fulfillment_status || o.status || "",
                  o.carrier_name || "",
                  o.tracking_number || "",
                  o.estimated_delivery || "",
                  typeof o.shipping_address === "object"
                    ? JSON.stringify(o.shipping_address)
                    : [o.shipping_address, o.shipping_city, o.shipping_country]
                        .filter(Boolean)
                        .join(", "),
                ]),
              ];
              const csvString = csvRows
                .map((row) =>
                  row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","),
                )
                .join("\n");
              const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `raajsi_orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="cta-ghost text-xs border border-hairline px-3 py-2 bg-paper hover:bg-mist disabled:opacity-40"
          >
            Export CSV
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-hairline px-3 py-2 text-sm bg-paper"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading orders…</div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border border-dashed border-hairline p-8">
          No orders found.
        </div>
      ) : (
        <div className="border border-hairline overflow-hidden bg-paper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-mist/50">
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  onUpdateStatus={(status) =>
                    updateStatus.mutate({
                      id: o.id,
                      status,
                      orderItems: (o.items as any[]) ?? [],
                    })
                  }
                  onSaveFulfillment={(payload) =>
                    updateFulfillment.mutate({ id: o.id, ...payload })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  onUpdateStatus,
  onSaveFulfillment,
}: {
  order: Record<string, unknown>;
  onUpdateStatus: (status: string) => void;
  onSaveFulfillment: (payload: {
    carrier_name: string | null;
    tracking_number: string | null;
    estimated_delivery: string | null;
    cancel_reason: string | null;
    notes: string | null;
  }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const o = order as {
    id: string;
    created_at: string;
    shipping_name: string | null;
    shipping_email: string | null;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_postal: string | null;
    shipping_country: string | null;
    status: string;
    total: number | null;
    subtotal: number | null;
    shipping_cost: number | null;
    tax_cost: number | null;
    currency: string;
    items: { artwork_id: string; slug: string; title: string; price: number }[] | null;
    notes: string | null;
    carrier_name: string | null;
    tracking_number: string | null;
    estimated_delivery: string | null;
    cancel_reason: string | null;
  };

  const [carrier, setCarrier] = useState(o.carrier_name ?? "");
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const [delivery, setDelivery] = useState(o.estimated_delivery ?? "");
  const [cancelReason, setCancelReason] = useState(o.cancel_reason ?? "");
  const [notes, setNotes] = useState(o.notes ?? "");

  const items = (o.items as { title: string; price: number }[]) ?? [];
  const code = (o.currency || "INR").toUpperCase();
  const fmt = (n: number) => formatCurrencyWithCode(n, code);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFulfillment({
      carrier_name: carrier || null,
      tracking_number: tracking || null,
      estimated_delivery: delivery || null,
      cancel_reason: cancelReason || null,
      notes: notes || null,
    });
  };

  const customerName = (o as any).customer_name || o.shipping_name || "—";
  const customerEmail = (o as any).customer_email || o.shipping_email || "";
  const totalAmount = Number((o as any).total_amount ?? o.total ?? 0);
  const currentStatus = (o as any).fulfillment_status || o.status || "pending";

  return (
    <>
      <tr className="hover:bg-mist/30 transition-colors">
        <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </td>
        <td className="px-4 py-3">
          <div>{customerName}</div>
          <div className="text-xs text-muted-foreground">{customerEmail}</div>
        </td>
        <td className="px-4 py-3">
          {items.length} piece{items.length !== 1 ? "s" : ""}
        </td>
        <td className="px-4 py-3 text-right tabular-nums font-serif">
          {fmt(totalAmount)}
        </td>
        <td className="px-4 py-3">
          <select
            value={currentStatus}
            onChange={(e) => onUpdateStatus(e.target.value)}
            className="bg-transparent border border-hairline px-2 py-1 text-xs rounded-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-mist rounded-sm"
            aria-label="Toggle details"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-mist/30">
            <div className="grid md:grid-cols-4 gap-6 text-xs mb-6">
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  Items
                </div>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="italic font-serif">{item.title}</span>
                      <span className="tabular-nums">{fmt(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  Shipping Destination
                </div>
                <p className="font-medium">{o.shipping_name}</p>
                <p>{o.shipping_address}</p>
                <p>
                  {[o.shipping_city, o.shipping_postal, o.shipping_country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  Price Breakdown
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmt(Number(o.subtotal ?? 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="tabular-nums">{fmt(Number(o.shipping_cost ?? 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">{fmt(Number(o.tax_cost ?? 0))}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-hairline pt-1 mt-1">
                    <span>Total</span>
                    <span className="tabular-nums">{fmt(Number(o.total ?? 0))}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  Current Shipping & Transit Info
                </div>
                <p>
                  <span className="text-muted-foreground">Carrier:</span> {o.carrier_name || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Tracking #:</span>{" "}
                  {o.tracking_number || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Est. Delivery:</span>{" "}
                  {o.estimated_delivery || "—"}
                </p>
                {o.cancel_reason && (
                  <p className="text-red-700 mt-1">
                    <span className="font-semibold">Cancel Reason:</span> {o.cancel_reason}
                  </p>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="border-t border-hairline pt-4 grid md:grid-cols-4 gap-4 items-end"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Logistics Carrier
                </label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart / DHL / White-Glove"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full border border-hairline px-2 py-1.5 text-xs bg-paper"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Tracking Number / Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. BD987654321IN"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className="w-full border border-hairline px-2 py-1.5 text-xs bg-paper"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aug 8, 2026 or 7-10 Days"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full border border-hairline px-2 py-1.5 text-xs bg-paper"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-black text-white text-xs px-4 py-1.5 border border-black hover:bg-zinc-800"
                >
                  Save Details
                </button>
              </div>
              {o.status === "cancelled" && (
                <div className="md:col-span-4 mt-2">
                  <label className="block text-[10px] uppercase tracking-wider text-red-800 mb-1 font-semibold">
                    Cancellation Reason (Visible to Customer)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer requested cancellation / Out of stock"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-red-200 px-2 py-1.5 text-xs bg-red-50/50 text-red-900"
                  />
                </div>
              )}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
