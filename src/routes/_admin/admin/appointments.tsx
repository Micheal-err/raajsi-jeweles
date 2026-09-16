import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/appointments")({
  head: () => ({
    meta: [{ title: "Manage Appointments — Raajsi Jewels Admin" }],
  }),
  component: AppointmentsPage,
});

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  slot_start: string;
  slot_end: string | null;
  party_size: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

function AppointmentsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("slot_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Appointment status updated");
    },
    onError: () => toast.error("Failed to update appointment status"),
  });

  const filtered =
    filterStatus === "all" ? appointments : appointments.filter((a) => a.status === filterStatus);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl">Gallery Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {appointments.length} total requests ·{" "}
            {appointments.filter((a) => a.status === "requested").length} pending confirmation
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-hairline px-3 py-2 text-sm bg-paper"
        >
          <option value="all">All statuses</option>
          <option value="requested">Requested</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-20 text-center">Loading appointments...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-20 text-center">No appointments found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="border border-hairline bg-paper p-5 rounded-sm flex flex-wrap items-start justify-between gap-4"
            >
              <div className="space-y-2 min-w-[240px]">
                <div className="flex items-center gap-2 font-serif text-lg font-medium text-ink">
                  <User size={16} className="text-muted-foreground" />
                  {apt.name}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail size={13} /> {apt.email}
                  </span>
                  {apt.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} /> {apt.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <UsersIcon size={13} /> Party of {apt.party_size ?? 1}
                  </span>
                </div>
                {apt.notes && (
                  <p className="text-xs italic text-ink/70 bg-mist/50 p-2 border border-hairline mt-2">
                    "{apt.notes}"
                  </p>
                )}
              </div>

              {/* Date Slot */}
              <div className="text-xs space-y-1">
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground">
                  Requested Slot
                </div>
                <div className="font-medium text-ink flex items-center gap-1.5">
                  <Calendar size={14} className="text-[color:var(--accent)]" />
                  {new Date(apt.slot_start).toLocaleDateString("en-IN", { dateStyle: "full" })}
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={13} />
                  {new Date(apt.slot_start).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 self-center">
                <span
                  className={`text-[10px] tracking-widest uppercase px-2.5 py-1 font-medium rounded-sm ${
                    apt.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : apt.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {apt.status}
                </span>

                {apt.status !== "confirmed" && (
                  <button
                    onClick={() => updateStatus.mutate({ id: apt.id, status: "confirmed" })}
                    className="p-1.5 border border-hairline hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    title="Confirm appointment"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}

                {apt.status !== "cancelled" && (
                  <button
                    onClick={() => updateStatus.mutate({ id: apt.id, status: "cancelled" })}
                    className="p-1.5 border border-hairline hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Cancel appointment"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
