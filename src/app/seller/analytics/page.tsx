"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BarChart3, Boxes, Info, Receipt, Wallet } from "lucide-react";
import { getSellerStats } from "@/lib/api/orders";
import type { SellerStats } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";

export default function SellerAnalyticsPage() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setStats(await getSellerStats());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <PageSpinner label="Crunching your numbers…" />;
  if (!stats) return null;

  const topRevenue = stats.bestSellingProducts[0]?.revenue;

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <BarChart3 className="size-5" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Revenue and sales performance across everything you&apos;ve sold.
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-teal-200/70 bg-teal-50/70 p-3.5 text-xs font-medium text-teal-900 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          Only counts orders that actually got paid — a declined card or a checkout still
          sitting unpaid contributes nothing here, even if stock was reserved.
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={formatPrice(stats.totalRevenue)} icon={Wallet} tone="success" />
        <StatCard label="Paid orders" value={stats.totalOrders} icon={Receipt} />
        <StatCard label="Items sold" value={stats.totalItemsSold} icon={Boxes} />
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
        <div className="flex items-center gap-2 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <Award className="size-4.5 text-amber-500" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100">Best sellers</h3>
        </div>

        {stats.bestSellingProducts.length === 0 ? (
          <div className="p-2">
            <EmptyState icon={Boxes} title="No paid sales yet" description="Your top products will show up here once orders are paid." />
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {stats.bestSellingProducts.map((p, index) => (
              <li key={p.productId} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-black text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${p.productId}`}
                    className="font-bold text-stone-800 hover:text-teal-700 dark:text-stone-100 dark:hover:text-amber-300"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs font-medium text-stone-400">{p.quantitySold} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-950 dark:text-white">{formatPrice(p.revenue)}</p>
                  {topRevenue && (
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className="h-full rounded-full bg-teal-600 dark:bg-amber-400"
                        style={{ width: `${Math.max(8, (parseFloat(p.revenue) / parseFloat(topRevenue)) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
