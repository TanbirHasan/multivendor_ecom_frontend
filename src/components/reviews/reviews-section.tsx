"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquareText, Trash2 } from "lucide-react";
import { deleteReview, listReviews, upsertReview } from "@/lib/api/reviews";
import { useAuth } from "@/hooks/use-auth";
import type { Review } from "@/lib/types";
import { StarRatingDisplay, StarRatingInput } from "./star-rating";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageSpinner } from "@/components/ui/spinner";
import { formatDate, initials } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export function ReviewsSection({ productId, onChanged }: { productId: string; onChanged?: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const myReview = reviews.find((r) => r.buyerId === user?.id) ?? null;

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setReviews(await listReviews(productId));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteReview(target.id);
      setReviews((prev) => prev.filter((r) => r.id !== target.id));
      toast.success("Review deleted");
      onChanged?.();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete review"));
    } finally {
      setIsDeleting(false);
      setTarget(null);
    }
  }

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center gap-2">
        <MessageSquareText className="size-5 text-stone-500 dark:text-stone-400" />
        <h2 className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
          Reviews {reviews.length > 0 && <span className="text-stone-400">({reviews.length})</span>}
        </h2>
      </div>

      {isAuthenticated && (
        <ReviewForm
          key={myReview?.id ?? "new"}
          productId={productId}
          existing={myReview}
          onSaved={(saved) => {
            setReviews((prev) => {
              const withoutMine = prev.filter((r) => r.buyerId !== saved.buyerId);
              return [saved, ...withoutMine];
            });
            onChanged?.();
          }}
        />
      )}

      <div className="mt-6">
        {isLoading ? (
          <PageSpinner label="Loading reviews…" />
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300/80 bg-white/50 px-5 py-8 text-center text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-sm shadow-stone-950/5 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
            {reviews.map((review) => {
              const canDelete = user && (user.id === review.buyerId || user.role === "ADMIN");
              return (
                <li key={review.id} className="flex gap-3 px-5 py-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-xs font-black text-white dark:bg-amber-400 dark:text-stone-950">
                    {initials(review.buyer.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-stone-800 dark:text-stone-100">{review.buyer.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <StarRatingDisplay rating={review.rating} size="sm" />
                          <span className="text-xs text-stone-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => setTarget(review)}>
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      )}
                    </div>
                    {review.comment && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600 dark:text-stone-300">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete this review?"
        description="This action can't be undone."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

function ReviewForm({
  productId,
  existing,
  onSaved,
}: {
  productId: string;
  existing: Review | null;
  onSaved: (review: Review) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Choose a star rating first");
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = await upsertReview({ productId, rating, comment: comment.trim() || undefined });
      toast.success(existing ? "Review updated" : "Review submitted");
      onSaved(saved);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not submit review"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-stone-200/70 bg-white/84 p-5 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78"
    >
      <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
        {existing ? "Update your review" : "Write a review"}
      </p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Only buyers who&apos;ve received this product can leave a review.
      </p>
      <div className="mt-3">
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <Textarea
        id="review-comment"
        className="mt-3"
        placeholder="Share details about your experience (optional)"
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" size="sm" className="mt-3" isLoading={isSubmitting}>
        {existing ? "Update review" : "Submit review"}
      </Button>
    </form>
  );
}
