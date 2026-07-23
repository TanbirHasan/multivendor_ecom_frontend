"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Layers, Package, ShieldCheck, Store, Users } from "lucide-react";
import { listUsers } from "@/lib/api/users";
import { listCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";
import type { Category, Product, User } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/dashboard/stat-card";
import { RoleBadge } from "@/components/ui/badge";
import { formatDate, formatPrice, initials } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [usersData, categoriesData, productsData] = await Promise.all([
          listUsers(),
          listCategories(),
          listProducts(),
        ]);
        setUsers(usersData);
        setCategories(categoriesData);
        setProducts(productsData);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const sellerCount = useMemo(() => users.filter((u) => u.role === "SELLER").length, [users]);
  const buyerCount = useMemo(() => users.filter((u) => u.role === "BUYER").length, [users]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock <= 0).length, [products]);
  const recentUsers = useMemo(
    () => [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [users]
  );

  if (isLoading) return <PageSpinner label="Loading overview…" />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Overview</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">A snapshot of the marketplace right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total users" value={users.length} icon={Users} />
        <StatCard label="Sellers" value={sellerCount} icon={Store} />
        <StatCard label="Buyers" value={buyerCount} icon={ShieldCheck} />
        <StatCard label="Categories" value={categories.length} icon={Layers} />
        <StatCard label="Products" value={products.length} icon={Package} />
      </div>

      {outOfStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="size-5 shrink-0" />
          {outOfStockCount} product{outOfStockCount === 1 ? " is" : "s are"} currently out of stock.
          <Link href="/admin/products" className="ml-auto font-bold underline underline-offset-2">
            View products
          </Link>
        </div>
      )}

      <div className="rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Recently joined</h3>
          <Link href="/admin/users" className="text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-amber-300">
            View all
          </Link>
        </div>
        {recentUsers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500">No users yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-teal-700 text-xs font-black text-white dark:bg-amber-400 dark:text-stone-950">
                    {initials(u.name)}
                  </span>
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">{u.name}</p>
                    <p className="text-xs font-medium text-stone-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={u.role} />
                  <span className="hidden text-xs text-stone-400 sm:inline">{formatDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {products.length > 0 && (
        <div className="rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <h3 className="font-bold text-stone-900 dark:text-stone-100">Highest priced listings</h3>
            <Link href="/admin/products" className="text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-amber-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {[...products]
              .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
              .slice(0, 5)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <p className="font-bold text-stone-800 dark:text-stone-100">{p.name}</p>
                  <span className="font-semibold text-teal-700 dark:text-amber-300">{formatPrice(p.price)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
