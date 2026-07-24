"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function CartIndicator() {
  const items = useCartStore((s) => s.items);
  const mounted = useHasMounted();

  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return (
    <Link
      href="/cart"
      className="relative flex size-9 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-stone-900/5 dark:text-stone-300 dark:hover:bg-white/10"
      aria-label="Cart"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-black text-white dark:bg-amber-400 dark:text-stone-950">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
