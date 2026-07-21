"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { deleteProduct, listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, Product } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function DashboardPage() {
  return (
    <RequireAuth roles={["SELLER"]}>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([listProducts(), listCategories()]);
        setProducts(productsData);
        setCategories(categoriesData);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const myProducts = useMemo(
    () => products.filter((p) => p.sellerId === user?.id),
    [products, user]
  );
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteProduct(target.id);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete product"));
    } finally {
      setIsDeleting(false);
      setTarget(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the products you have listed for sale.</p>
        </div>
        <Link href="/dashboard/new">
          <Button>
            <Plus className="size-4" />
            Add product
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : myProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="List your first product to start selling."
          action={
            <Link href="/dashboard/new">
              <Button size="sm">
                <Plus className="size-4" />
                Add product
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {myProducts.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                    <Link href={`/products/${p.id}`} className="hover:text-indigo-600">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{categoryMap.get(p.categoryId) ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{formatPrice(p.price)}</td>
                  <td className="px-5 py-3">
                    {p.stock <= 0 ? <Badge tone="danger">Out of stock</Badge> : <Badge tone="success">{p.stock}</Badge>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/${p.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="size-3.5" />
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setTarget(p)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={`Delete "${target?.name}"?`}
        description="This action can't be undone."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
