import { apiClient } from "./client";
import type { Review, ReviewPayload } from "@/lib/types";

export async function listReviews(productId: string) {
  const { data } = await apiClient.get<Review[]>("/reviews", { params: { productId } });
  return data;
}

/** POST /api/reviews is an upsert — creates on first call, updates on any repeat for the same product. */
export async function upsertReview(payload: ReviewPayload) {
  const { data } = await apiClient.post<Review>("/reviews", payload);
  return data;
}

export async function deleteReview(id: string) {
  await apiClient.delete(`/reviews/${id}`);
}
