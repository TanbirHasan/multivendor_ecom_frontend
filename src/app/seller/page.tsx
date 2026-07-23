"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, DollarSign, PackagePlus, PackageSearch } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Category, Product } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default function SellerOverviewPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const myProducts = useMemo(() => products.filter((p) => p.sellerId === user?.id), [products, user]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const outOfStock = useMemo(() => myProducts.filter((p) => p.stock <= 0), [myProducts]);
  const inventoryValue = useMemo(
    () => myProducts.reduce((sum, p) => sum + parseFloat(p.price) * p.stock, 0),
    [myProducts]
  );
  const totalUnits = useMemo(() => myProducts.reduce((sum, p) => sum + p.stock, 0), [myProducts]);

  if (isLoading) return <PageSpinner label="Loading your shop…" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Welcome back, {user?.name}</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Here&apos;s how your shop is doing.</p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <PackagePlus className="size-4" />
            Add product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Listed products" value={myProducts.length} icon={PackageSearch} />
        <StatCard label="Units in stock" value={totalUnits} icon={Boxes} />
        <StatCard label="Out of stock" value={outOfStock.length} icon={AlertTriangle} tone={outOfStock.length > 0 ? "warning" : "default"} />
        <StatCard label="Inventory value" value={formatPrice(inventoryValue)} icon={DollarSign} tone="success" />
      </div>

      {myProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/55 p-10 text-center shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-700 dark:bg-stone-900/45">
          <p className="font-semibold text-stone-950 dark:text-stone-100">You haven&apos;t listed anything yet</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Add your first product to start selling.</p>
          <Link href="/seller/products/new" className="mt-4 inline-block">
            <Button size="sm">
              <PackagePlus className="size-4" />
              Add product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <h3 className="font-bold text-stone-900 dark:text-stone-100">Your latest listings</h3>
            <Link href="/seller/products" className="text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-amber-300">
              Manage all
            </Link>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {[...myProducts]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 5)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <Link href={`/products/${p.id}`} className="font-bold text-stone-800 hover:text-teal-700 dark:text-stone-100 dark:hover:text-amber-300">
                      {p.name}
                    </Link>
                    <p className="text-xs font-medium text-stone-400">{categoryMap.get(p.categoryId) ?? "Uncategorized"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.stock <= 0 ? <Badge tone="danger">Out of stock</Badge> : <Badge tone="success">{p.stock} in stock</Badge>}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{formatPrice(p.price)}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
