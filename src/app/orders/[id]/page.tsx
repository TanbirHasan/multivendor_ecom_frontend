"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, CreditCard, PackageCheck, Receipt, RefreshCw } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { getOrder, updateItemStatus } from "@/lib/api/orders";
import { getProduct } from "@/lib/api/products";
import type { Order, OrderItemStatus, Product } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemStatusControl } from "@/components/orders/item-status-control";
import { formatDate, formatPrice } from "@/lib/utils";
import { orderStatusTone, paymentStatusTone } from "@/lib/order-status";
import { extractErrorMessage } from "@/lib/api/client";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  return (
    <RequireAuth>
      <OrderDetailContent id={id} />
    </RequireAuth>
  );
}

function OrderDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [isRefreshingPayment, setIsRefreshingPayment] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const orderData = await getOrder(id);
        setOrder(orderData);

        const uniqueIds = [...new Set(orderData.items.map((i) => i.productId))];
        const results = await Promise.all(
          uniqueIds.map((productId) => getProduct(productId).catch(() => null))
        );
        const map: Record<string, Product> = {};
        results.forEach((p) => {
          if (p) map[p.id] = p;
        });
        setProducts(map);
      } catch {
        setForbidden(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleRefreshPayment() {
    setIsRefreshingPayment(true);
    try {
      setOrder(await getOrder(id));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not refresh payment status"));
    } finally {
      setIsRefreshingPayment(false);
    }
  }

  const canEditItem = useMemo(
    () => (sellerId: string) => user?.role === "ADMIN" || user?.id === sellerId,
    [user]
  );

  async function handleStatusChange(itemId: string, status: OrderItemStatus) {
    setSavingItemId(itemId);
    try {
      const updated = await updateItemStatus(itemId, status);
      setOrder((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.id === itemId ? updated : i)) } : prev
      );
      toast.success(`Item marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Could not update status"));
    } finally {
      setSavingItemId(null);
    }
  }

  if (isLoading) return <PageSpinner label="Loading order…" />;

  if (forbidden || !order) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-bold text-stone-950 dark:text-white">Order not found</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          It may not exist, or you don&apos;t have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/buyer/orders" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-amber-300">
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-stone-900/68">
        <div>
          <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
            <Receipt className="size-5" />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
          <span className="text-2xl font-black text-stone-950 dark:text-white">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {order.payment && (
        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-stone-200/70 bg-white/84 p-5 shadow-sm shadow-stone-950/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-stone-900/78">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <CreditCard className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                Payment{" "}
                <Badge tone={paymentStatusTone(order.payment.status)} className="ml-1 align-middle">
                  {order.payment.status}
                </Badge>
              </p>
              <p className="text-xs font-medium text-stone-400">
                {formatPrice(order.payment.amount)} {order.payment.currency.toUpperCase()}
              </p>
            </div>
          </div>
          {order.payment.status === "PENDING" && (
            <Button variant="outline" size="sm" onClick={handleRefreshPayment} isLoading={isRefreshingPayment}>
              <RefreshCw className="size-3.5" />
              Refresh status
            </Button>
          )}
        </div>
      )}

      <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
        {order.items.map((item) => {
          const product = products[item.productId];
          return (
            <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {product ? (
                  <Link href={`/products/${product.id}`} className="font-bold text-stone-800 hover:text-teal-700 dark:text-stone-100 dark:hover:text-amber-300">
                    {product.name}
                  </Link>
                ) : (
                  <p className="font-bold text-stone-800 dark:text-stone-100">Product no longer available</p>
                )}
                <p className="text-xs font-medium text-stone-400">
                  {item.quantity} × {formatPrice(item.priceAtPurchase)} = {formatPrice(parseFloat(item.priceAtPurchase) * item.quantity)}
                </p>
              </div>

              {canEditItem(item.sellerId) ? (
                <ItemStatusControl
                  status={item.status}
                  isSaving={savingItemId === item.id}
                  onChange={(next) => handleStatusChange(item.id, next)}
                />
              ) : (
                <Badge tone="default">{item.status}</Badge>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-start gap-3 rounded-3xl border border-teal-200/70 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-200">
        <PackageCheck className="mt-0.5 size-5 shrink-0" />
        <p className="font-medium">
          Each line item is fulfilled independently by its own seller — status changes here only affect that
          seller&apos;s item, never the whole order.
        </p>
      </div>
    </div>
  );
}
