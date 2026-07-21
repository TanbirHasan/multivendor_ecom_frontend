"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { listCategories } from "@/lib/api/categories";
import type { Category } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-stone-200/70 bg-white/76 p-8 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <Layers className="size-6" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Categories</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">
          Browse the marketplace by product category and jump straight into filtered storefront views.
        </p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : categories.length === 0 ? (
        <EmptyState icon={Layers} title="No categories yet" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, index) => (
            <Link
              key={c.id}
              href={`/?category=${c.id}`}
              className="group flex min-h-44 flex-col justify-between rounded-3xl border border-stone-200/75 bg-white/84 p-6 shadow-sm shadow-stone-950/5 backdrop-blur transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl hover:shadow-stone-950/10 dark:border-stone-800 dark:bg-stone-900/78"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 dark:bg-amber-400 dark:text-stone-950">
                <Layers className="size-5" />
              </span>
              <div>
                <p className="text-lg font-black text-stone-950 dark:text-stone-100">{c.name}</p>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-stone-500 dark:text-stone-400">
                  <span>Collection {String(index + 1).padStart(2, "0")}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
