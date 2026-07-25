"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Banknote, CreditCard, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useAuth } from "@/hooks/use-auth";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { checkout } from "@/lib/api/orders";
import { extractErrorMessage } from "@/lib/api/client";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import type { PaymentProvider } from "@/lib/types";

const PAYMENT_METHODS: { provider: PaymentProvider; label: string; description: string; icon: typeof CreditCard }[] = [
  { provider: "STRIPE", label: "Card (Stripe)", description: "Visa, Mastercard — pay on this page", icon: CreditCard },
  { provider: "SSLCOMMERZ", label: "SSLCommerz", description: "bKash, Nagad, cards — redirects to a hosted page", icon: Banknote },
];

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCartStore();
  const setCheckout = useCheckoutStore((s) => s.setCheckout);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const mounted = useHasMounted();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>("STRIPE");

  const total = useMemo(
    () => items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    [items]
  );

  async function handleCheckout() {
    if (!isAuthenticated) {
      toast.error("Log in to check out");
      router.push("/login");
      return;
    }
    setIsCheckingOut(true);
    try {
      const result = await checkout({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        provider,
      });

      if ("clientSecret" in result) {
        setCheckout(result.order.id, result.clientSecret);
        router.push(`/checkout/${result.order.id}`);
        return;
      }

      // SSLCommerz has no embedded form — the entire browser has to leave our app and land
      // on their hosted checkout page, so this is a full navigation, not a router push.
      window.location.href = result.gatewayPageUrl;
    } catch (err) {
      toast.error(extractErrorMessage(err, "Checkout failed"));
      setIsCheckingOut(false);
    }
  }

  if (!mounted) return <PageSpinner label="Loading your cart…" />;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-amber-300">
        <ArrowLeft className="size-4" />
        Continue shopping
      </Link>

      <div className="mb-8 rounded-[2rem] border border-stone-200/70 bg-white/76 p-6 shadow-sm shadow-stone-950/5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/68">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white dark:bg-amber-400 dark:text-stone-950">
          <ShoppingCart className="size-5" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-white">Your cart</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Review your items before checking out.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse products and add something you like."
          action={
            <Link href="/">
              <Button size="sm">Browse products</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-3xl border border-stone-200/70 bg-white/84 shadow-xl shadow-stone-950/8 backdrop-blur dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/78">
            {items.map((item) => (
              <li key={item.productId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/products/${item.productId}`} className="font-bold text-stone-800 hover:text-teal-700 dark:text-stone-100 dark:hover:text-amber-300">
                    {item.name}
                  </Link>
                  <p className="text-xs font-medium text-stone-400">{formatPrice(item.price)} each · {item.stock} in stock</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border border-stone-300/80 bg-white/85 dark:border-stone-700 dark:bg-stone-950/70">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex size-8 items-center justify-center text-stone-500 hover:text-teal-700 disabled:opacity-40 dark:hover:text-amber-300"
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-stone-900 dark:text-stone-100">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="flex size-8 items-center justify-center text-stone-500 hover:text-teal-700 disabled:opacity-40 dark:hover:text-amber-300"
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="w-20 text-right font-bold text-stone-900 dark:text-white">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="h-fit rounded-3xl border border-stone-200/70 bg-white/84 p-6 shadow-xl shadow-stone-950/8 backdrop-blur dark:border-stone-800 dark:bg-stone-900/78">
            <h3 className="font-bold text-stone-900 dark:text-stone-100">Order summary</h3>
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
              <span>Items</span>
              <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-4 text-lg font-black text-stone-950 dark:border-stone-800 dark:text-white">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Pay with</p>
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.provider}
                  type="button"
                  onClick={() => setProvider(method.provider)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                    provider === method.provider
                      ? "border-teal-600 bg-teal-50 dark:border-amber-400 dark:bg-amber-400/10"
                      : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-950/40"
                  )}
                >
                  <method.icon className="size-4.5 shrink-0 text-stone-500 dark:text-stone-400" />
                  <span>
                    <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">{method.label}</span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400">{method.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <Button className="mt-4 w-full" size="lg" onClick={handleCheckout} isLoading={isCheckingOut}>
              Checkout
            </Button>
            <p className="mt-3 text-center text-xs text-stone-400">
              Stock is confirmed at checkout — quantities may be adjusted if another buyer purchased first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
