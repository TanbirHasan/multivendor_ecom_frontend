"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Package, Pencil, ShieldCheck, Trash2 } from "lucide-react";
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
          // Category lookup is best-effort.
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
      router.push(user?.role === "SELLER" ? "/seller/products" : user?.role === "ADMIN" ? "/admin/products" : "/");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete product"));
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (isLoading) return <PageSpinner label="Loading product..." />;

  if (notFound || !product) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-bold text-stone-950 dark:text-white">Product not found</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">It may have been removed by its seller.</p>
        <Link href="/" className="mt-6">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-amber-300">
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden rounded-[2rem] bg-linear-to-br from-teal-700 via-teal-600 to-amber-400 shadow-2xl shadow-stone-950/15 sm:min-h-[31rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgb(255_255_255/0.38),transparent_16rem),radial-gradient(circle_at_82%_90%,rgb(17_24_39/0.24),transparent_18rem)]" />
          <div className="relative rounded-[2rem] border border-white/25 bg-white/16 p-12 shadow-2xl shadow-stone-950/20 backdrop-blur">
            <Package className="size-24 text-white/88" strokeWidth={1.25} />
          </div>
          <div className="absolute left-5 top-5 rounded-full bg-white/18 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur">
            Marketa listing
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200/70 bg-white/82 p-6 shadow-xl shadow-stone-950/8 backdrop-blur sm:p-8 dark:border-stone-800 dark:bg-stone-900/78">
          {category && <Badge className="mb-4 w-fit">{category.name}</Badge>}
          <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-4xl font-black text-teal-700 dark:text-amber-300">{formatPrice(product.price)}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {outOfStock ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : (
              <Badge tone="success">{product.stock} in stock</Badge>
            )}
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
              Listed {formatDate(product.createdAt)}
            </span>
          </div>

          <div className="mt-8 rounded-3xl border border-stone-200/70 bg-stone-50/70 p-5 dark:border-stone-800 dark:bg-stone-950/35">
            <p className="whitespace-pre-line leading-7 text-stone-600 dark:text-stone-300">{product.description}</p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-3xl border border-teal-200/70 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-200">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p className="font-medium">Product ownership and stock changes are protected by the backend role rules.</p>
          </div>

          {canManage && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-stone-200 pt-6 dark:border-stone-800">
              <Link href={`/products/${product.id}/edit`}>
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
