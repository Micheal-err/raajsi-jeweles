import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/audit-logs")({
  head: () => ({
    meta: [{ title: "Audit Logs — Raajsi Jewels Admin" }],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      (log.actor_id && log.actor_id.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="eyebrow text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> Security & Integrity Audit
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-ink">System Audit Trail</h1>
          <p className="text-xs text-ink/60 mt-1">
            Immutable log of all administrative actions, stock status overrides, and security
            events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or entity..."
              className="pl-9 pr-3 py-2 border border-hairline text-xs bg-paper font-medium focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs tracking-widest text-ink/40 uppercase">
          Loading system audit logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-hairline p-8 text-xs text-ink/50">
          No audit log entries recorded yet.
        </div>
      ) : (
        <div className="border border-hairline bg-paper overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline bg-mist/50 text-[10px] tracking-[0.18em] uppercase text-ink/50 font-medium">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-mist/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-ink/70 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-mist border border-hairline text-ink/80 rounded">
                      {log.actor_type || "system"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink font-medium">{log.action}</td>
                  <td className="px-4 py-3 text-ink/80">
                    <span className="font-serif capitalize">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="font-mono text-[10px] text-ink/40 block">
                        #{log.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/60 font-mono text-[11px]">
                    {log.new_value ? JSON.stringify(log.new_value) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
