import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Star,
  CheckCircle2,
  PenLine,
  Lock,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  X,
  ShieldCheck,
} from "lucide-react";
import { useProductReviews, type ReviewItem } from "@/hooks/useProductReviews";
import { useSession } from "@/hooks/useSession";
import { Reveal } from "@/components/Reveal";

interface ProductReviewsProps {
  artworkId?: string;
  slug: string;
  productTitle: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Exceptional / Masterpiece",
};

export function ProductReviews({ artworkId, slug, productTitle }: ProductReviewsProps) {
  const { user } = useSession();
  const path = useRouterState({ select: (s) => s.location.href });
  const { reviews, totalReviews, averageRating, distribution, isLoading, submitReview } =
    useProductReviews(artworkId, slug);

  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""
  );
  const [likedReviews, setLikedReviews] = useState<Record<string, number>>({});

  const handleToggleLike = (id: string) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) return;

    await submitReview.mutateAsync({
      rating,
      title: title.trim(),
      comment: comment.trim(),
      authorName: authorName.trim() || undefined,
    });

    setTitle("");
    setComment("");
    setFormOpen(false);
  };

  const authRedirectUrl = `/auth?next=${encodeURIComponent(path)}`;

  return (
    <section id="reviews-section" className="border-t border-hairline pt-16 mt-16 scroll-mt-24">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="eyebrow mb-1 text-[color:var(--gold)] flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Patron Testimonials</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-ink">Customer Reviews & Ratings</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Real impressions from lovers of fine handcrafted and 925 sterling silver jewellery.
            </p>
          </div>

          <div>
            {user ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="cta-gold text-xs px-6 py-3 inline-flex items-center gap-2 shadow-sm"
              >
                <PenLine size={14} />
                <span>Write a Review</span>
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ next: path }}
                className="cta-gold text-xs px-6 py-3 inline-flex items-center gap-2 shadow-sm"
              >
                <Lock size={14} />
                <span>Sign In to Review</span>
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      {/* RATING SUMMARY CARD */}
      <div className="bg-paper border border-hairline p-6 md:p-8 mb-12 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Average Score */}
          <div className="md:col-span-4 text-center md:border-r md:border-hairline md:pr-8">
            <div className="font-serif text-5xl md:text-6xl font-semibold text-ink leading-none mb-3">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={
                    star <= Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-stone-300"
                  }
                />
              ))}
            </div>
            <div className="text-xs text-ink/70">
              Based on <span className="font-medium text-ink">{totalReviews}</span> verified patron ratings
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>100% Authentic Customer Feedback</span>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="md:col-span-8 flex flex-col gap-2">
            {distribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-ink/70 flex items-center gap-1 font-medium">
                  <span>{stars}</span>
                  <Star size={11} className="fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 bg-mist rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] text-ink/60">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WRITE A REVIEW MODAL / DRAWER */}
      {formOpen && (
        <div
          onClick={() => setFormOpen(false)}
          className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper border border-hairline w-full max-w-lg p-6 sm:p-8 rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-2 text-ink/50 hover:text-ink transition-colors"
              aria-label="Close review dialog"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="eyebrow text-[color:var(--gold)] text-[10px] mb-1">
                Share Your Experience
              </div>
              <h3 className="font-serif text-2xl text-ink leading-tight">
                Review: {productTitle}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Signed in as <span className="font-medium text-ink">{user?.email}</span>. Anyone with an account can review this piece.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-2">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          size={24}
                          className={
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-stone-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-[color:var(--gold)] font-medium ml-2 font-serif italic">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1.5">
                  Your Name (Displayed on Review)
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full text-xs px-3.5 py-2.5 bg-paper border border-hairline focus:border-[color:var(--gold)] focus:outline-none rounded-xs"
                />
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1.5">
                  Review Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Beautiful finish & exquisite detail"
                  className="w-full text-xs px-3.5 py-2.5 bg-paper border border-hairline focus:border-[color:var(--gold)] focus:outline-none rounded-xs"
                />
              </div>

              {/* Review Body */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1.5">
                  Your Review & Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others what you love about this piece — its luster, comfort, hallmark clarity, or craftsmanship..."
                  className="w-full text-xs p-3.5 bg-paper border border-hairline focus:border-[color:var(--gold)] focus:outline-none rounded-xs leading-relaxed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Buying this item is not mandatory. Honest reviews help our patrons make informed decisions.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2.5 text-xs text-ink/70 hover:text-ink font-medium tracking-wider uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitReview.isPending || !title.trim() || !comment.trim()}
                  className="cta-gold text-xs px-6 py-2.5 shadow-sm disabled:opacity-50"
                >
                  {submitReview.isPending ? "Publishing…" : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOT SIGNED IN PROMPT */}
      {!user && (
        <div className="mb-10 p-5 bg-mist/50 border border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Have thoughts on this piece?</div>
              <div className="text-xs text-muted-foreground">
                Sign in to post your review. Anyone with an account can share their perspective (purchasing is not required).
              </div>
            </div>
          </div>
          <Link
            to="/auth"
            search={{ next: path }}
            className="cta-outline text-xs px-5 py-2.5 shrink-0"
          >
            Sign In to Review
          </Link>
        </div>
      )}

      {/* REVIEWS LIST */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-paper border border-dashed border-hairline p-8">
            <Star size={28} className="mx-auto text-amber-400 mb-2" />
            <h3 className="font-serif text-lg text-ink font-medium">No reviews yet for this piece</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Be the first to share your thoughts on the craftsmanship, finish, and design of {productTitle}.
            </p>
            {user ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="cta-gold text-xs px-6 py-2.5 inline-flex items-center gap-1.5"
              >
                <PenLine size={13} />
                <span>Write the First Review</span>
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ next: path }}
                className="cta-gold text-xs px-6 py-2.5 inline-flex items-center gap-1.5"
              >
                <Lock size={13} />
                <span>Sign In &amp; Write Review</span>
              </Link>
            )}
          </div>
        ) : (
          reviews.map((rev) => {
            const formattedDate = rev.created_at
              ? new Date(rev.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recent";

            const likes = likedReviews[rev.id] || 0;

            return (
              <article
                key={rev.id}
                className="bg-paper border border-hairline p-5 sm:p-6 transition-all hover:border-[color:var(--gold)]/40 hover:shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  {/* Rating Stars & Title */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-ink/50 ml-1">
                        {rev.rating}.0
                      </span>
                    </div>
                    <h4 className="font-serif text-base sm:text-lg text-ink font-medium leading-snug">
                      {rev.title}
                    </h4>
                  </div>

                  {/* Date */}
                  <div className="text-[11px] text-muted-foreground shrink-0">{formattedDate}</div>
                </div>

                {/* Review Body */}
                <p className="text-xs sm:text-sm text-ink/85 leading-relaxed font-sans mb-4">
                  {rev.comment}
                </p>

                {/* Author Info & Verified Tag */}
                <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold)] flex items-center justify-center font-serif text-[11px] font-semibold uppercase">
                      {rev.user_name.charAt(0) || "P"}
                    </div>
                    <span className="font-medium text-ink text-xs">{rev.user_name}</span>
                    {rev.verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                        <CheckCircle2 size={11} /> Verified Buyer
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLike(rev.id)}
                    className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-[11px] px-2.5 py-1 rounded-xs hover:bg-mist transition-colors"
                    aria-label="Helpful review"
                  >
                    <ThumbsUp size={12} className={likes > 0 ? "text-[color:var(--gold)]" : ""} />
                    <span>Helpful {likes > 0 && `(${likes})`}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
