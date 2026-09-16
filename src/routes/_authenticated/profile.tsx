import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Package,
  Heart,
  ShoppingBag,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useWishlist, useCart } from "@/hooks/useCommerce";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Raajsi Jewels" },
      {
        name: "description",
        content: "Manage your collector profile, account preferences, and password.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: wishlist = [] } = useWishlist();
  const { data: cart = [] } = useCart();

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "security">("details");

  // Profile data from database
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [profile, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not logged in");

      // Update profiles table
      const { error: dbErr } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: name,
        updated_at: new Date().toISOString(),
      });

      if (dbErr) throw dbErr;

      // Update auth user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: { display_name: name },
      });

      if (authErr) throw authErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to change password");
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    updateProfileMutation.mutate(displayName.trim());
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0].toUpperCase() ?? "K");

  return (
    <>
      <PageHero
        eyebrow="Collector Portal · Raajsi Jewels"
        title={<KineticTitle>Account & Preferences</KineticTitle>}
        lede="Manage your collector details, review activity, and update security credentials."
        visual="auth"
      />

      <section className="section-padding bg-paper">
        <div className="container-editorial max-w-5xl">
          {/* Header Card */}
          <div className="p-6 md:p-8 bg-paper border border-hairline mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-ink text-paper font-serif text-2xl flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="font-serif text-2xl font-normal text-ink">
                  {displayName || "Valued Collector"}
                </h1>
                <p className="text-sm text-ink/60 mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-medium bg-mist text-ink/80 border border-hairline">
                    <Shield size={11} className="text-[color:var(--accent)]" />
                    {profile?.is_admin ? "Gallery Admin" : "Collector"}
                  </span>
                  <span className="text-xs text-ink/40">
                    Member since{" "}
                    {user?.created_at ? new Date(user.created_at).getFullYear() : "2026"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 border-hairline pt-4 md:pt-0">
              <button
                type="button"
                onClick={signOut}
                className="cta-ghost !py-2.5 !px-4 text-xs flex items-center gap-2"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Activity Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Link
              to="/orders"
              className="p-5 border border-hairline bg-paper hover:border-ink/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center text-ink group-hover:text-[color:var(--accent)] transition-colors">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-[11px] tracking-wider uppercase text-ink/50">My Orders</div>
                  <div className="font-serif text-xl text-ink">
                    {orders.length} Order{orders.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <span className="text-xs text-ink/40 group-hover:text-ink transition-colors">
                View →
              </span>
            </Link>

            <Link
              to="/wishlist"
              className="p-5 border border-hairline bg-paper hover:border-ink/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center text-ink group-hover:text-[color:var(--accent)] transition-colors">
                  <Heart size={18} />
                </div>
                <div>
                  <div className="text-[11px] tracking-wider uppercase text-ink/50">Wishlist</div>
                  <div className="font-serif text-xl text-ink">{wishlist.length} Saved</div>
                </div>
              </div>
              <span className="text-xs text-ink/40 group-hover:text-ink transition-colors">
                View →
              </span>
            </Link>

            <Link
              to="/cart"
              className="p-5 border border-hairline bg-paper hover:border-ink/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center text-ink group-hover:text-[color:var(--accent)] transition-colors">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div className="text-[11px] tracking-wider uppercase text-ink/50">Cart</div>
                  <div className="font-serif text-xl text-ink">
                    {cart.length} Item{cart.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <span className="text-xs text-ink/40 group-hover:text-ink transition-colors">
                View →
              </span>
            </Link>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-hairline mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-3 px-5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === "details"
                  ? "border-[color:var(--accent)] text-ink font-semibold"
                  : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              <User size={15} />
              Personal Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`pb-3 px-5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === "security"
                  ? "border-[color:var(--accent)] text-ink font-semibold"
                  : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              <Key size={15} />
              Account Security
            </button>
          </div>

          {/* Tab 1: Personal Details */}
          {activeTab === "details" && (
            <div className="max-w-2xl bg-paper border border-hairline p-6 md:p-8">
              <h2 className="font-serif text-xl text-ink mb-1">Collector Identity</h2>
              <p className="text-xs text-ink/60 mb-6">
                Update your display name. This will appear on gallery inquiries and order invoices.
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/70 mb-2">
                    Email Address <span className="text-ink/40 font-normal">(Read-only)</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="w-full px-4 py-3 bg-mist/60 border border-hairline text-ink/60 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/70 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full px-4 py-3 bg-paper border border-hairline text-ink text-sm focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="cta-red !py-3 !px-6 text-xs flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Security / Change Password */}
          {activeTab === "security" && (
            <div className="max-w-2xl bg-paper border border-hairline p-6 md:p-8">
              <h2 className="font-serif text-xl text-ink mb-1">Change Password</h2>
              <p className="text-xs text-ink/60 mb-6">
                Ensure your account is using a strong, unique password.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/70 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-paper border border-hairline text-ink text-sm focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/70 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-paper border border-hairline text-ink text-sm focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="cta-red !py-3 !px-6 text-xs flex items-center gap-2"
                  >
                    {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
