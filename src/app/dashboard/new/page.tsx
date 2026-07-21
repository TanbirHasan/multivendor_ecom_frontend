"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { ProductForm } from "@/components/products/product-form";
import { createProduct } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, CreateProductPayload } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { extractErrorMessage } from "@/lib/api/client";

export default function NewProductPage() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <NewProductContent />
    </RequireAuth>
  );
}

function NewProductContent() {
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
      router.push("/dashboard");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not create product"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="size-4" />
        Back to my products
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Add a product</h1>
      <p className="mb-8 text-sm text-slate-500">Fill in the details below to list a new product.</p>

      {isLoading ? (
        <PageSpinner />
      ) : categories.length === 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          No categories exist yet. Ask an admin to create one before listing products.
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ProductForm categories={categories} submitLabel="Create product" isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </div>
      )}
    </div>
  );
}
