"use client";

import { Suspense, useEffect, useMemo, useState, use as usePromise } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { ArrowLeft, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { RequireAuth } from "@/components/guards/require-auth";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getOrder } from "@/lib/api/orders";
import { stripePromise } from "@/lib/stripe";
import { useCheckoutStore } from "@/store/checkout-store";
import type { Order } from "@/lib/types";
import { PageSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { paymentStatusTone } from "@/lib/order-status";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  return (
    <RequireAuth>
      <Suspense fallback={<PageSpinner label="Loading your order…" />}>
        <CheckoutContent id={id} />
      </Suspense>
    </RequireAuth>
  );
}

function CheckoutContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const storedOrderId = useCheckoutStore((s) => s.orderId);
  const storedClientSecret = useCheckoutStore((s) => s.clientSecret);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const clientSecret = useMemo(() => {
    return (
      searchParams.get("payment_intent_client_secret") ??
      (storedOrderId === id ? storedClientSecret : null)
    );
  }, [searchParams, storedOrderId, storedClientSecret, id]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        setOrder(await getOrder(id));
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <PageSpinner label="Loading your order…" />;

  if (notFound || !order) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-lg font-bold text-stone-950 dark:text-white">Order not found</p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          It may not exist, or you don&apos;t have permission to view it.
        </p>
      </div>
    );
  }

  const paymentStatus = order.payment?.status ?? "PENDING";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cart" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-amber-300">
        <ArrowLeft className="size-4" />
        Back to cart
      </Link>

      <div className="mb-8 flex items-center justify-between gap-4 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <div>
          <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
            <CreditCard className="size-5" />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Checkout</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Order #{order.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <Badge tone={paymentStatusTone(paymentStatus)}>{paymentStatus}</Badge>
          <p className="mt-2 text-xl font-black text-stone-950 dark:text-white">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
        {paymentStatus === "SUCCEEDED" ? (
          <SuccessState orderId={order.id} />
        ) : paymentStatus === "FAILED" ? (
          <FailureState orderId={order.id} />
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0f766e",
                  borderRadius: "10px",
                },
              },
            }}
          >
            <CheckoutForm orderId={order.id} />
          </Elements>
        ) : (
          <UnavailableState orderId={order.id} />
        )}
      </div>
    </div>
  );
}

function SuccessState({ orderId }: { orderId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="size-10 text-emerald-600" />
      <p className="font-bold text-stone-950 dark:text-stone-100">Payment successful</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">Your order is confirmed and being prepared.</p>
      <Link href={`/orders/${orderId}`} className="mt-2">
        <Button size="sm">View order</Button>
      </Link>
    </div>
  );
}

function FailureState({ orderId }: { orderId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <XCircle className="size-10 text-red-600" />
      <p className="font-bold text-stone-950 dark:text-stone-100">Payment failed</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        The order was cancelled and any reserved stock was restored. Add the items back to your cart to try again.
      </p>
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

function UnavailableState({ orderId }: { orderId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="font-bold text-stone-950 dark:text-stone-100">Payment form unavailable</p>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        This checkout session has expired — Stripe client secrets aren&apos;t stored, so a page reload loses them.
        Your order is still on file with payment pending.
      </p>
      <Link href={`/orders/${orderId}`} className="mt-2">
        <Button size="sm">View order status</Button>
      </Link>
    </div>
  );
}
