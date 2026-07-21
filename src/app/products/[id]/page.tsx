"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Package, Pencil, Trash2 } from "lucide-react";
import { getProduct, deleteProduct } from "@/lib/api/products";
import { getCategory } from "@/lib/api/categories";
import type { Category, Product } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatPrice } from "@/lib/utils";
import { PageSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { extractErrorMessage } from "@/lib/api/client";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const productData = await getProduct(id);
        setProduct(productData);
        try {
          const categoryData = await getCategory(productData.categoryId);
          setCategory(categoryData);
        } catch {
          // category lookup is best-effort
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const canManage = product && user && (user.id === product.sellerId || user.role === "ADMIN");

  async function handleDelete() {
    if (!product) return;
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");
      router.push(user?.role === "SELLER" ? "/dashboard" : "/");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete product"));
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (isLoading) return <PageSpinner label="Loading product…" />;

  if (notFound || !product) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Product not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been removed by its seller.</p>
        <Link href="/" className="mt-6">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-400 to-violet-500 sm:h-96">
          <Package className="size-16 text-white/80" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col">
          {category && <Badge className="mb-3 w-fit">{category.name}</Badge>}
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-indigo-600">{formatPrice(product.price)}</p>

          <div className="mt-4 flex items-center gap-2">
            {outOfStock ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : (
              <Badge tone="success">{product.stock} in stock</Badge>
            )}
            <span className="text-xs text-slate-400">Listed {formatDate(product.createdAt)}</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-slate-600 dark:text-slate-300">{product.description}</p>

          {canManage && (
            <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
              <Link href={`/dashboard/${product.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this product?"
        description="This action can't be undone."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
