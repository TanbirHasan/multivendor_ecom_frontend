"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Receipt } from "lucide-react";
import { listSellerItems, updateItemStatus } from "@/lib/api/orders";
import type { OrderItem, OrderItemStatus } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemStatusControl } from "@/components/orders/item-status-control";
import { formatDate, formatPrice } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api/client";

export default function SellerOrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setItems(await listSellerItems());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleStatusChange(itemId: string, status: OrderItemStatus) {
    setSavingId(itemId);
    try {
      const updated = await updateItemStatus(itemId, status);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updated } : i)));
      toast.success(`Item marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update status"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Orders</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Line items sold from your products — each order is split by seller, so you only see your own items.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState icon={Receipt} title="No sales yet" description="Items customers buy from you will show up here." />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-stone-800 dark:text-stone-100">{item.product?.name ?? "Product"}</p>
                  <p className="text-xs font-medium text-stone-400">
                    Order{" "}
                    <Link href={`/orders/${item.orderId}`} className="font-semibold text-teal-700 hover:text-teal-600 dark:text-amber-300">
                      #{item.orderId.slice(-8).toUpperCase()}
                    </Link>{" "}
                    · {formatDate(item.createdAt)} · {item.quantity} × {formatPrice(item.priceAtPurchase)}
                  </p>
                </div>
                <ItemStatusControl
                  status={item.status}
                  isSaving={savingId === item.id}
                  onChange={(next) => handleStatusChange(item.id, next)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
