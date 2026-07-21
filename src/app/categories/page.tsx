"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
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
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Categories</h1>
      <p className="mt-1 text-sm text-slate-500">Browse products by category.</p>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : categories.length === 0 ? (
          <EmptyState icon={Layers} title="No categories yet" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/?category=${c.id}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                  <Layers className="size-5" />
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
