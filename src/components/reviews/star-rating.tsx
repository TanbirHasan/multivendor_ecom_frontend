"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  rating,
  size = "md",
  showValue = false,
}: {
  rating: number | null;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}) {
  const sizes = { sm: "size-3.5", md: "size-4", lg: "size-5" };
  const rounded = rating !== null ? Math.round(rating) : 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizes[size],
              star <= rounded ? "fill-amber-400 text-amber-400" : "fill-transparent text-stone-300 dark:text-stone-600"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          {rating !== null ? rating.toFixed(1) : "No ratings"}
        </span>
      )}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "size-5", md: "size-6", lg: "size-8" };
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
        >
          <Star
            className={cn(
              sizes[size],
              star <= active ? "fill-amber-400 text-amber-400" : "fill-transparent text-stone-300 dark:text-stone-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}
