"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Layers, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listMyOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import { orderStatusTone } from "@/lib/order-status";

export default function BuyerOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setOrders(await listMyOrders());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const activeOrders = useMemo(() => orders.filter((o) => o.status === "PLACED"), [orders]);
  const totalSpent = useMemo(
    () => orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
    [orders]
  );
  const pendingItems = useMemo(
    () => orders.flatMap((o) => o.items).filter((i) => i.status === "PENDING" || i.status === "SHIPPED").length,
    [orders]
  );
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [orders]
  );

  if (isLoading) return <PageSpinner label="Loading your dashboard…" />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Welcome back, {user?.name}</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Here&apos;s a look at your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total orders" value={orders.length} icon={Receipt} />
        <StatCard label="Active orders" value={activeOrders.length} icon={ShoppingBag} />
        <StatCard label="In progress items" value={pendingItems} icon={Clock3} tone={pendingItems > 0 ? "warning" : "default"} />
        <StatCard label="Total spent" value={formatPrice(totalSpent)} icon={Wallet} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          href="/"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-sm shadow-stone-950/5 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900/78"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 dark:bg-amber-400 dark:text-stone-950">
            <ShoppingBag className="size-5" />
          </span>
          <div className="mt-6">
            <p className="text-lg font-black text-stone-950 dark:text-stone-100">Browse products</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Explore listings from every seller on Marketa.</p>
          </div>
        </Link>

        <Link
          href="/categories"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-sm shadow-stone-950/5 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-stone-800 dark:bg-stone-900/78"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
            <Layers className="size-5" />
          </span>
          <div className="mt-6">
            <p className="text-lg font-black text-stone-950 dark:text-stone-100">Shop by category</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Jump straight into a filtered storefront view.</p>
          </div>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300/80 bg-white/55 p-10 text-center shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-700 dark:bg-stone-900/45">
          <p className="font-semibold text-stone-950 dark:text-stone-100">No orders yet</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Your purchases will show up here once you check out.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm">Start shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
            <h3 className="font-bold text-stone-900 dark:text-stone-100">Recent orders</h3>
            <Link href="/buyer/orders" className="text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-amber-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs font-medium text-stone-400">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={orderStatusTone(o.status)}>{o.status}</Badge>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{formatPrice(o.totalAmount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
