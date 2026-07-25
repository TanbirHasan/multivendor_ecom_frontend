"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Info, Package, Pencil, Trash2 } from "lucide-react";
import { deleteProduct, listAllProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { listUsers } from "@/lib/api/users";
import type { Category, Product, User } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [productsData, categoriesData, usersData] = await Promise.all([
          listAllProducts(),
          listCategories(),
          listUsers(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setUsers(usersData);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  async function handleDelete() {
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteProduct(target.id);
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
      toast.success("Product deleted");
      setTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not delete product"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Products</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Edit or remove any listing across the marketplace, regardless of seller.
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-teal-200/70 bg-teal-50/70 p-3.5 text-xs font-medium text-teal-900 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          Admins can&apos;t create new products — listing a product requires a seller account. This page can only edit or remove existing listings.
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products yet" />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-stone-500 dark:border-stone-800 dark:bg-stone-950/40">
                <tr>
                  <th className="px-5 py-3 font-bold">Product</th>
                  <th className="px-5 py-3 font-bold">Seller</th>
                  <th className="px-5 py-3 font-bold">Category</th>
                  <th className="px-5 py-3 font-bold">Price</th>
                  <th className="px-5 py-3 font-bold">Stock</th>
                  <th className="px-5 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {products.map((p) => {
                  const seller = userMap.get(p.sellerId);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                      <td className="px-5 py-4 font-bold text-stone-800 dark:text-stone-100">
                        <Link href={`/products/${p.id}`} className="hover:text-teal-700 dark:hover:text-amber-300">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {seller ? (
                          <div>
                            <p className="font-semibold text-stone-700 dark:text-stone-300">{seller.name}</p>
                            <p className="text-xs text-stone-400">{seller.email}</p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-stone-400">{p.sellerId}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-stone-500">{categoryMap.get(p.categoryId) ?? "—"}</td>
                      <td className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-300">{formatPrice(p.price)}</td>
                      <td className="px-5 py-4">
                        {p.stock <= 0 ? <Badge tone="danger">Out of stock</Badge> : <Badge tone="success">{p.stock}</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/products/${p.id}/edit`}>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
