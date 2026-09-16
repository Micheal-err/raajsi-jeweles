import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Image,
  Users,
  Calendar,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      throw redirect({ to: "/auth", search: { next: location.href } });
    }
    // Check admin flag
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      throw redirect({ to: "/" });
    }
    return { user: authData.user };
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/artworks", label: "Jewellery Products", icon: Image },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-paper flex-shrink-0 flex flex-col">
        <div className="px-6 py-6 border-b border-paper/10">
          <div className="font-serif text-lg">Raajsi Jewels</div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-paper/50 mt-1">
            Admin Panel
          </div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  active
                    ? "bg-paper/10 text-paper font-medium"
                    : "text-paper/60 hover:text-paper hover:bg-paper/5"
                }`}
              >
                <n.icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-paper/10">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-paper/50 hover:text-paper transition-colors"
          >
            <ArrowLeft size={13} />
            Back to gallery
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
