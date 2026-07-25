"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useAuth } from "@/hooks/use-auth";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { checkout } from "@/lib/api/orders";
import { extractErrorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCartStore();
  const setCheckout = useCheckoutStore((s) => s.setCheckout);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const mounted = useHasMounted();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
      const { order, clientSecret } = await checkout({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setCheckout(order.id, clientSecret);
      router.push(`/checkout/${order.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Checkout failed"));
    } finally {
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
            <Button className="mt-6 w-full" size="lg" onClick={handleCheckout} isLoading={isCheckingOut}>
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
