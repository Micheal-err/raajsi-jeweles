import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ExternalLink } from "lucide-react";

const STATUSES = ["new", "contacted", "closed"] as const;

export const Route = createFileRoute("/_admin/admin/inquiries")({
  head: () => ({
    meta: [{ title: "Manage Inquiries — Raajsi Jewels Admin" }],
  }),
  component: InquiriesPage,
});

function InquiriesPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Admin inquiries fetch error:", error);
        throw error;
      }
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "new" | "contacted" | "closed" }) => {
      const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      toast.success("Inquiry status updated");
    },
    onError: (err: any) => {
      console.error("[Admin] Inquiry update failed:", err);
      const msg = err?.code === "42501"
        ? "Permission denied — run the RLS fix SQL in Supabase."
        : `Failed to update: ${err?.message || "Unknown error"}`;
      toast.error(msg);
    },
  });

  const rows = data ?? [];
  const filtered = filterStatus === "all" ? rows : rows.filter((i) => i.status === filterStatus);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Inquiries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} total · {rows.filter((i) => i.status === "new").length} new
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-hairline px-3 py-2 text-sm bg-paper"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-20 text-center">Loading inquiries…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-20 text-center">No inquiries found.</p>
      ) : (
        <div className="border border-hairline bg-paper rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-mist/50">
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Type / Subject
                </th>
                <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((inq) => (
                <InquiryRow
                  key={inq.id}
                  inquiry={inq}
                  onUpdateStatus={(status) => updateStatus.mutate({ id: inq.id, status })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InquiryRow({
  inquiry,
  onUpdateStatus,
}: {
  inquiry: Record<string, unknown>;
  onUpdateStatus: (status: "new" | "contacted" | "closed") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const i = inquiry as {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: string;
    type?: string;
  };

  return (
    <>
      <tr
        className={`hover:bg-mist/30 transition-colors ${i.status === "new" ? "bg-amber-50/30" : ""}`}
      >
        <td className="px-4 py-3 font-mono text-xs">#{i.id.slice(0, 8).toUpperCase()}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {new Date(i.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </td>
        <td className="px-4 py-3 font-medium">{i.name || "Customer"}</td>
        <td className="px-4 py-3 space-y-0.5">
          <div>
            <a href={`mailto:${i.email}`} className="text-blue-600 hover:underline text-xs">
              {i.email}
            </a>
          </div>
          {i.phone && (
            <div className="text-[11px] text-muted-foreground">
              Tel: {i.phone}
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-[10px] uppercase tracking-wider bg-mist px-2 py-0.5 rounded text-ink/75 font-mono">
            {i.type || "Inquiry"}
          </span>
        </td>
        <td className="px-4 py-3">
          <select
            value={i.status}
            onChange={(e) => onUpdateStatus(e.target.value as "new" | "contacted" | "closed")}
            className="bg-transparent border border-hairline px-2 py-1 text-xs rounded-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 hover:bg-mist rounded-sm"
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
            <div className="grid md:grid-cols-2 gap-6 text-xs">
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">
                  Message
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed max-w-lg">{i.message}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-1">
                    Contact & Direct Reply
                  </div>
                  <p className="font-medium text-ink">
                    {i.name}
                  </p>
                  <p className="mt-1">
                    Email:{" "}
                    <a href={`mailto:${i.email}`} className="text-blue-600 hover:underline">
                      {i.email}
                    </a>
                  </p>
                  {i.phone && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span>Phone: {i.phone}</span>
                      <a
                        href={`https://wa.me/${i.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Reply on WhatsApp →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
