import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Mail,
  X,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — Raajsi Jewels" }],
  }),
  component: DashboardPage,
});

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  customer_name: string | null;
  total_amount: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}

function DashboardPage() {
  const [subscribersOpen, setSubscribersOpen] = useState(false);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, inquiries, artworks, subscribers] = await Promise.all([
        supabase
          .from("orders")
          .select("id,customer_name,total_amount,payment_status,fulfillment_status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("inquiries")
          .select("id,name,email,message,status,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("artworks").select("id,availability,stock_quantity"),
        supabase
          .from("newsletter_subscribers")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      return {
        orders: (orders.data ?? []) as unknown as OrderRow[],
        inquiries: (inquiries.data ?? []) as unknown as {
          id: string;
          name: string;
          email: string;
          message: string;
          status: string;
          created_at: string;
        }[],
        artworks: (artworks.data ?? []) as unknown as { id: string; availability: string }[],
        subscribers: (subscribers.data ?? []) as Subscriber[],
      };
    },
  });

  const d = stats.data;
  const newInquiries = d?.inquiries.filter((i) => i.status === "new").length ?? 0;
  const pendingOrders =
    d?.orders.filter((o) => o.payment_status === "completed" || o.fulfillment_status === "processing" || o.fulfillment_status === "pending").length ?? 0;
  const availableWorks = d?.artworks.filter((a) => a.availability === "available").length ?? 0;
  const totalSubscribers = d?.subscribers.length ?? 0;
  const totalRevenue =
    d?.orders
      .filter((o) => o.fulfillment_status !== "cancelled")
      .reduce((s, o) => s + Number(o.total_amount ?? 0), 0) ?? 0;

  const recentOrders = (d?.orders ?? []).slice(0, 5);
  const recentInquiries = (d?.inquiries ?? []).slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of Raajsi Jewels operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard
          icon={MessageSquare}
          label="New inquiries"
          value={newInquiries}
          accent={newInquiries > 0}
        />
        <StatCard
          icon={ShoppingBag}
          label="Active orders"
          value={pendingOrders}
          accent={pendingOrders > 0}
        />
        <StatCard
          icon={Mail}
          label="Subscribers"
          value={totalSubscribers}
          onClick={() => setSubscribersOpen(true)}
          clickable
        />
        <StatCard icon={Sparkles} label="Available pieces" value={availableWorks} />
        <StatCard
          icon={TrendingUp}
          label="Total revenue"
          value={`₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(totalRevenue)}`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="border border-hairline bg-paper rounded-sm">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <h2 className="font-serif text-lg">Recent Orders</h2>
            <span className="text-xs text-muted-foreground">{d?.orders.length ?? 0} total</span>
          </div>
          <div className="divide-y divide-hairline">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No orders yet</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className="font-medium ml-2">{o.customer_name || "Customer"}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      ₹{Number(o.total_amount ?? 0).toLocaleString("en-IN")}
                    </span>
                    <StatusBadge status={o.payment_status || o.fulfillment_status || "pending"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="border border-hairline bg-paper rounded-sm">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <h2 className="font-serif text-lg">Recent Inquiries</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{d?.inquiries.length ?? 0} total</span>
              <Link to="/admin/inquiries" className="text-xs text-[color:var(--gold)] hover:underline font-medium">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-hairline">
            {recentInquiries.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                No inquiries yet
              </p>
            ) : (
              recentInquiries.map((i) => (
                <div key={i.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{i.id.slice(0, 8).toUpperCase()}</span>
                      <span className="font-medium text-ink truncate">{i.name || "Customer"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString("en-IN", { dateStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-sm">
                      {i.message || i.email || "Inquiry received"}
                    </p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Total Jewellery Pieces" value={d?.artworks.length ?? 0} />
        <MiniStat label="Available In Stock" value={availableWorks} />
        <MiniStat label="Total Orders" value={d?.orders.length ?? 0} />
        <MiniStat
          label="Completed Orders"
          value={d?.orders.filter((o) => o.payment_status === "completed").length ?? 0}
        />
      </div>

      {/* Newsletter Subscribers Modal */}
      {subscribersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-paper border border-hairline p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-hairline">
              <div>
                <h2 className="font-serif text-xl">Newsletter Subscribers</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d?.subscribers.length ?? 0} total subscribed emails
                </p>
              </div>
              <button
                onClick={() => setSubscribersOpen(false)}
                className="p-1 text-muted-foreground hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {d?.subscribers.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No subscribers yet.
                </p>
              ) : (
                <div className="divide-y divide-hairline">
                  {d?.subscribers.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-ink">{s.email}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Subscribed on{" "}
                          {new Date(s.created_at).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })}
                        </div>
                      </div>
                      {s.source && (
                        <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 bg-mist rounded-sm text-muted-foreground">
                          {s.source}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-hairline flex justify-between items-center text-xs text-muted-foreground">
              <span>Export CSV capability available via database</span>
              <button
                onClick={() => setSubscribersOpen(false)}
                className="px-4 py-1.5 bg-ink text-paper text-xs uppercase tracking-wider hover:bg-ink/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
  onClick,
  clickable = false,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`border border-hairline bg-paper p-5 rounded-sm transition-all ${
        clickable ? "cursor-pointer hover:border-ink hover:shadow-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon
            size={15}
            className={accent ? "text-amber-600" : "text-muted-foreground"}
          />
          <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        {clickable && (
          <span className="text-[9px] text-amber-600 uppercase tracking-wider">
            View
          </span>
        )}
      </div>
      <div
        className={`font-serif text-3xl tabular-nums ${accent ? "text-amber-600" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-hairline bg-paper p-4 rounded-sm">
      <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-1">
        {label}
      </div>
      <div className="font-serif text-xl tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-amber-100 text-amber-800",
    inquiry_sent: "bg-blue-100 text-blue-800",
    contacted: "bg-sky-100 text-sky-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    shipped: "bg-violet-100 text-violet-800",
    delivered: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    pending: "bg-amber-100 text-amber-800",
    closed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 rounded-sm ${colors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
