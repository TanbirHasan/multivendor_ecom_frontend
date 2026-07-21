"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { ProductForm } from "@/components/products/product-form";
import { getProduct, updateProduct } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, CreateProductPayload, Product } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/client";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  return (
    <RequireAuth roles={["SELLER", "ADMIN"]}>
      <EditProductContent id={id} />
    </RequireAuth>
  );
}

function EditProductContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [productData, categoriesData] = await Promise.all([getProduct(id), listCategories()]);
        if (user && user.role !== "ADMIN" && user.id !== productData.sellerId) {
          setForbidden(true);
        } else {
          setProduct(productData);
        }
        setCategories(categoriesData);
      } catch {
        setForbidden(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) load();
  }, [id, user]);

  async function handleSubmit(payload: CreateProductPayload) {
    setIsSubmitting(true);
    try {
      await updateProduct(id, payload);
      toast.success("Product updated");
      router.push(`/products/${id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update product"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <PageSpinner />;

  if (forbidden || !product) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">You can&apos;t edit this product</p>
        <p className="mt-1 text-sm text-slate-500">Only the product&apos;s seller or an admin can make changes.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={`/products/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="size-4" />
        Back to product
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">Edit product</h1>
      <p className="mb-8 text-sm text-slate-500">Update the details for {product.name}.</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ProductForm
          categories={categories}
          initialValues={{
            name: product.name,
            description: product.description,
            price: String(parseFloat(product.price)),
            stock: String(product.stock),
            categoryId: product.categoryId,
          }}
          submitLabel="Save changes"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
