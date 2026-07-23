"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { createProduct } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, CreateProductPayload } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { extractErrorMessage } from "@/lib/api/client";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(payload: CreateProductPayload) {
    setIsSubmitting(true);
    try {
      await createProduct(payload);
      toast.success("Product created");
      router.push("/seller/products");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not create product"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/seller/products" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-amber-300">
        <ArrowLeft className="size-4" />
        Back to my products
      </Link>
      <div className="mb-8 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <PackagePlus className="size-5" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Add a product</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Fill in the details below to list a new product.</p>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : categories.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
          No categories exist yet. Ask an admin to create one before listing products.
        </p>
      ) : (
        <div className="rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
          <ProductForm categories={categories} submitLabel="Create product" isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </div>
      )}
    </div>
  );
}
