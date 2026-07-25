"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, HelpCircle, Landmark, XCircle } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { getOrder, findOrderByProviderTransactionId, pollOrderUntilPaymentResolved } from "@/lib/api/orders";
import { useCartStore } from "@/store/cart-store";
import type { Order } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paymentStatusTone } from "@/lib/order-status";

export default function SslcommerzStatusPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageSpinner label="Confirming your payment…" />}>
        <SslcommerzStatusContent />
      </Suspense>
    </RequireAuth>
  );
}

function SslcommerzStatusContent() {
  const searchParams = useSearchParams();
  const outcome = searchParams.get("outcome");
  const tranId = searchParams.get("tranId");
  const orderIdParam = searchParams.get("orderId");
  const clearCart = useCartStore((s) => s.clear);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unresolved, setUnresolved] = useState(false);

  useEffect(() => {
    async function resolve() {
      setIsLoading(true);
      try {
        let resolvedOrder: Order | null = null;

        if (orderIdParam) {
          resolvedOrder = await getOrder(orderIdParam).catch(() => null);
        }

        if (!resolvedOrder && tranId) {
          // The order is created synchronously at checkout, before the buyer ever reaches
          // SSLCommerz's page, so it should already exist — but allow a couple of quick
          // retries in case this page loads faster than the DB write settles.
          for (let i = 0; i < 3 && !resolvedOrder; i++) {
            resolvedOrder = await findOrderByProviderTransactionId(tranId);
            if (!resolvedOrder) await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!resolvedOrder) {
          setUnresolved(true);
          return;
        }

        if (resolvedOrder.payment?.status === "PENDING") {
          resolvedOrder = await pollOrderUntilPaymentResolved(resolvedOrder.id);
        }

        setOrder(resolvedOrder);
        if (resolvedOrder.payment?.status === "SUCCEEDED") {
          clearCart();
        }
      } finally {
        setIsLoading(false);
      }
    }
    resolve();
  }, [orderIdParam, tranId, clearCart]);

  if (isLoading) return <PageSpinner label="Confirming your payment…" />;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <Landmark className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-black tracking-tight text-stone-950 dark:text-white">SSLCommerz checkout</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            SSLCommerz reported: <span className="font-semibold capitalize">{outcome ?? "unknown"}</span>
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
        {unresolved || !order ? (
          <UnresolvedState />
        ) : order.payment?.status === "SUCCEEDED" ? (
          <ResultState
            icon={<CheckCircle2 className="size-10 text-emerald-600" />}
            title="Payment successful"
            description="Your order is confirmed and being prepared."
            orderId={order.id}
          />
        ) : order.payment?.status === "FAILED" ? (
          <ResultState
            icon={<XCircle className="size-10 text-red-600" />}
            title="Payment failed"
            description="The order was cancelled and any reserved stock was restored. Your cart is still here if you'd like to try again."
            orderId={order.id}
          />
        ) : (
          <ResultState
            icon={<HelpCircle className="size-10 text-amber-500" />}
            title="Still confirming"
            description="SSLCommerz hasn't finished notifying our backend yet. Check your order in a moment — this page won't keep checking on its own."
            orderId={order.id}
          />
        )}

        {order?.payment && (
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-stone-100 pt-4 dark:border-stone-800">
            <span className="text-sm text-stone-500 dark:text-stone-400">Backend status:</span>
            <Badge tone={paymentStatusTone(order.payment.status)}>{order.payment.status}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultState({
  icon,
  title,
  description,
  orderId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  orderId: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      {icon}
      <p className="font-bold text-stone-950 dark:text-stone-100">{title}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
      <div className="mt-2 flex gap-2">
        <Link href="/">
          <Button variant="outline" size="sm">Browse products</Button>
        </Link>
        <Link href={`/orders/${orderId}`}>
          <Button size="sm">View order</Button>
        </Link>
      </div>
    </div>
  );
}

function UnresolvedState() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <HelpCircle className="size-10 text-stone-400" />
      <p className="font-bold text-stone-950 dark:text-stone-100">Couldn&apos;t match this to an order</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Check your order history — the payment may still have gone through.
      </p>
      <Link href="/buyer/orders" className="mt-2">
        <Button size="sm">View my orders</Button>
      </Link>
    </div>
  );
}
