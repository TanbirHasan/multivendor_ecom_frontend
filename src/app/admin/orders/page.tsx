"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { listAllOrdersAdmin } from "@/lib/api/orders";
import { listUsers } from "@/lib/api/users";
import type { Order, User } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { orderStatusTone } from "@/lib/order-status";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [ordersData, usersData] = await Promise.all([listAllOrdersAdmin(), listUsers()]);
        setOrders(ordersData);
        setUsers(usersData);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  return (
    <div>
      <div className="rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Orders</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Every order placed across the marketplace, from every buyer and seller.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <PageSpinner />
        ) : orders.length === 0 ? (
          <EmptyState icon={Receipt} title="No orders yet" />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-[0.14em] text-stone-500 dark:border-stone-800 dark:bg-stone-950/40">
                <tr>
                  <th className="px-5 py-3 font-bold">Order</th>
                  <th className="px-5 py-3 font-bold">Buyer</th>
                  <th className="px-5 py-3 font-bold">Items</th>
                  <th className="px-5 py-3 font-bold">Total</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {[...orders]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((o) => {
                    const buyer = userMap.get(o.buyerId);
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                        <td className="px-5 py-4 font-bold text-stone-800 dark:text-stone-100">
                          <Link href={`/orders/${o.id}`} className="hover:text-teal-700 dark:hover:text-amber-300">
                            #{o.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-stone-500">
                          {buyer ? (
                            <div>
                              <p className="font-semibold text-stone-700 dark:text-stone-300">{buyer.name}</p>
                              <p className="text-xs text-stone-400">{buyer.email}</p>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-stone-400">{o.buyerId}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-stone-500">{o.items.length}</td>
                        <td className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-300">{formatPrice(o.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <Badge tone={orderStatusTone(o.status)}>{o.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-stone-500">{formatDate(o.createdAt)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
