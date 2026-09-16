import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";

export type CartItem = {
  id: string;
  artwork_id: string;
  created_at: string;
  artwork: {
    id: string;
    slug: string;
    title: string;
    medium: string | null;
    primary_image_url: string | null;
    availability: string;
    price_min?: number | null;
    price_max?: number | null;
    price_display?: string;
    display_price: number | null;
  };
};

const artworkSelect =
  "id,slug,title,medium,primary_image_url,availability,display_price,price_display";

export function useCart() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async (): Promise<CartItem[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select(`id,artwork_id,created_at,artwork:artworks(${artworkSelect})`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CartItem[];
    },
  });
}

export function useWishlist() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async (): Promise<CartItem[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`id,artwork_id,created_at,artwork:artworks(${artworkSelect})`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CartItem[];
    },
  });
}

function useAuthGuard() {
  const { user } = useSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.href });
  return () => {
    if (user) return true;
    navigate({ to: "/auth", search: { next: path } });
    toast("Sign in to save works to your cart or wishlist.");
    return false;
  };
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { user } = useSession();
  const guard = useAuthGuard();
  return useMutation({
    mutationFn: async (artworkId: string) => {
      if (!guard()) throw new Error("auth");
      const { error } = await supabase
        .from("cart_items")
        .insert({ artwork_id: artworkId, user_id: user!.id });
      if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (e: Error) => {
      if (e.message !== "auth") toast.error("Couldn't add to cart");
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (artworkId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("artwork_id", artworkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const { user } = useSession();
  const guard = useAuthGuard();
  return useMutation({
    mutationFn: async ({ artworkId, on }: { artworkId: string; on: boolean }) => {
      if (!guard()) throw new Error("auth");
      if (on) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("artwork_id", artworkId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ artwork_id: artworkId, user_id: user!.id });
        if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast(v.on ? "Removed from wishlist" : "Saved to wishlist");
    },
    onError: (e: Error) => {
      if (e.message !== "auth") toast.error("Couldn't update wishlist");
    },
  });
}

export function useIsInCart(artworkId: string) {
  const { data } = useCart();
  return !!data?.some((i) => i.artwork_id === artworkId);
}
export function useIsWishlisted(artworkId: string) {
  const { data } = useWishlist();
  return !!data?.some((i) => i.artwork_id === artworkId);
}
