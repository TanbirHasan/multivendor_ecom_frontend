"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { listMyOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/utils";
import { orderStatusTone } from "@/lib/order-status";

export default function BuyerOrdersPage() {
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

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">My orders</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Every order you&apos;ve placed, newest first.</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            description="Your purchases will show up here once you check out."
            action={
              <Link href="/">
                <Button size="sm">Start shopping</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-stone-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-stone-800/40">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs font-medium text-stone-400">
                      {formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={orderStatusTone(o.status)}>{o.status}</Badge>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">{formatPrice(o.totalAmount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
