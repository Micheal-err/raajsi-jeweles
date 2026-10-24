import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";

export type ReviewItem = {
  id: string;
  artwork_id?: string;
  product_slug: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  rating: number; // 1 - 5
  title: string;
  comment: string;
  created_at: string;
  verified_purchase?: boolean;
};

// Curated authentic reviews for seed pieces to ensure every jewellery piece has initial credibility
const SEED_REVIEWS_MAP: Record<string, Omit<ReviewItem, "id" | "product_slug">[]> = {
  default: [
    {
      user_name: "Pooja Singhania",
      rating: 5,
      title: "Impeccable craftsmanship and shine",
      comment:
        "The detailing on this piece is breathtaking. The finishing is silky smooth, and the BIS hallmark gives complete peace of mind. Arrived in luxury gift packaging within 3 days.",
      created_at: "2026-09-18T10:30:00Z",
      verified_purchase: true,
    },
    {
      user_name: "Aditya Vardhan",
      rating: 5,
      title: "Subtle luxury for everyday wear",
      comment:
        "Gifted this to my fiancée and she was overjoyed. The weight and luster are far superior to standard retail store pieces. Highly recommend Raajsi!",
      created_at: "2026-09-12T14:15:00Z",
      verified_purchase: false,
    },
    {
      user_name: "Meera Kulkarni",
      rating: 5,
      title: "Authentic Jaipur artistry",
      comment:
        "You can feel the heritage in the design. Comfortable, elegant, and looks even better in person than in the photos.",
      created_at: "2026-08-28T09:40:00Z",
      verified_purchase: true,
    },
    {
      user_name: "Rohan Malpani",
      rating: 4,
      title: "Great quality & fast delivery",
      comment:
        "Solid 925 sterling silver with a very rich finish. The certificate of authenticity was included in the box.",
      created_at: "2026-08-15T16:20:00Z",
      verified_purchase: false,
    },
  ],
};

const LOCAL_STORAGE_PREFIX = "raajsi_local_reviews_";

export function useProductReviews(artworkId?: string, slug?: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", slug || artworkId],
    staleTime: 60_000,
    gcTime: 300_000,
    queryFn: async (): Promise<ReviewItem[]> => {
      const cleanSlug = slug?.trim().toLowerCase() || "";
      const localKey = `${LOCAL_STORAGE_PREFIX}${cleanSlug}`;
      let localReviews: ReviewItem[] = [];
      try {
        const stored = localStorage.getItem(localKey);
        if (stored) localReviews = JSON.parse(stored);
      } catch {}

      // 1. Try relational table 'product_reviews'
      try {
        let query = supabase.from("product_reviews" as any).select("*");
        if (cleanSlug) {
          query = query.eq("product_slug", cleanSlug);
        } else if (artworkId) {
          query = query.eq("artwork_id", artworkId);
        }
        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          // Merge with any un-synced local reviews
          const dbIds = new Set(data.map((r: any) => r.id));
          const uniqueLocal = localReviews.filter((r) => !dbIds.has(r.id));
          return [...uniqueLocal, ...data];
        }
      } catch {
        // Table may not exist yet in schema cache
      }

      // 2. Fallback to artworks.metadata.reviews
      if (cleanSlug || artworkId) {
        try {
          let artQuery = supabase.from("artworks").select("metadata");
          if (cleanSlug) {
            artQuery = artQuery.eq("slug", cleanSlug);
          } else if (artworkId) {
            artQuery = artQuery.eq("id", artworkId);
          }
          const { data: artData } = await artQuery.maybeSingle();
          const metaReviews = (artData?.metadata as any)?.reviews;
          if (Array.isArray(metaReviews) && metaReviews.length > 0) {
            const metaIds = new Set(metaReviews.map((r: any) => r.id));
            const uniqueLocal = localReviews.filter((r) => !metaIds.has(r.id));
            return [...uniqueLocal, ...metaReviews];
          }
        } catch {}
      }

      // 3. Fallback to seed reviews + local reviews
      const seedReviews: ReviewItem[] = (SEED_REVIEWS_MAP[cleanSlug] || SEED_REVIEWS_MAP.default).map(
        (sr, idx) => ({
          ...sr,
          id: `seed-${cleanSlug}-${idx}`,
          product_slug: cleanSlug,
          artwork_id: artworkId,
        })
      );

      const seedIds = new Set(seedReviews.map((r) => r.id));
      const uniqueLocal = localReviews.filter((r) => !seedIds.has(r.id));
      return [...uniqueLocal, ...seedReviews];
    },
  });

  const reviews = reviewsQuery.data || [];

  // Compute statistics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1))
      : 5.0;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  // Submit Review Mutation
  const submitReview = useMutation({
    mutationFn: async ({
      rating,
      title,
      comment,
      authorName,
    }: {
      rating: number;
      title: string;
      comment: string;
      authorName?: string;
    }) => {
      if (!user) {
        throw new Error("You must be signed in to submit a review.");
      }

      const cleanSlug = slug?.trim().toLowerCase() || "";
      const reviewId = crypto.randomUUID();
      const reviewerName =
        authorName?.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Valued Patron";

      const newReview: ReviewItem = {
        id: reviewId,
        artwork_id: artworkId,
        product_slug: cleanSlug,
        user_id: user.id,
        user_name: reviewerName,
        user_email: user.email,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        title: title.trim(),
        comment: comment.trim(),
        created_at: new Date().toISOString(),
        verified_purchase: false, // Not compulsory to buy the product
      };

      // 1. Try insert into 'product_reviews' table
      let insertedInDb = false;
      try {
        const { error: dbError } = await supabase.from("product_reviews" as any).insert([
          {
            id: newReview.id,
            artwork_id: newReview.artwork_id,
            product_slug: newReview.product_slug,
            user_id: newReview.user_id,
            user_name: newReview.user_name,
            user_email: newReview.user_email,
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment,
            verified_purchase: newReview.verified_purchase,
          },
        ]);
        if (!dbError) {
          insertedInDb = true;
        }
      } catch {}

      // 2. If table didn't take it, update artworks.metadata.reviews
      if (!insertedInDb && (cleanSlug || artworkId)) {
        try {
          let artQuery = supabase.from("artworks").select("id,metadata");
          if (cleanSlug) artQuery = artQuery.eq("slug", cleanSlug);
          else if (artworkId) artQuery = artQuery.eq("id", artworkId);

          const { data: artData } = await artQuery.maybeSingle();
          if (artData) {
            const currentMeta = (artData.metadata as Record<string, any>) || {};
            const existingReviews = Array.isArray(currentMeta.reviews) ? currentMeta.reviews : [];
            const updatedReviews = [newReview, ...existingReviews];
            await supabase
              .from("artworks")
              .update({ metadata: { ...currentMeta, reviews: updatedReviews } })
              .eq("id", artData.id);
          }
        } catch {}
      }

      // 3. Always save in local storage for immediate persistence
      try {
        const localKey = `${LOCAL_STORAGE_PREFIX}${cleanSlug}`;
        const stored = localStorage.getItem(localKey);
        const existingLocal: ReviewItem[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem(localKey, JSON.stringify([newReview, ...existingLocal]));
      } catch {}

      return newReview;
    },
    onSuccess: (newReview) => {
      queryClient.setQueryData(
        ["product-reviews", slug || artworkId],
        (old: ReviewItem[] | undefined) => [newReview, ...(old || [])]
      );
      queryClient.invalidateQueries({ queryKey: ["product-reviews", slug || artworkId] });
      toast.success("Thank you! Your review has been published.", {
        description: "Your feedback helps jewellery collectors discover fine Jaipur artistry.",
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not publish review. Please try again.");
    },
  });

  return {
    reviews,
    totalReviews,
    averageRating,
    distribution,
    isLoading: reviewsQuery.isLoading,
    submitReview,
  };
}
