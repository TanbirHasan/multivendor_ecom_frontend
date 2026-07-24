"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (!isAuthenticated) {
      toast.error("Log in to add items to your cart");
      router.push("/login");
      return;
    }
    addItem(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
    setQuantity(1);
  }

  if (outOfStock) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-stone-300/80 bg-white/85 shadow-sm shadow-stone-950/5 dark:border-stone-700 dark:bg-stone-950/70">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex size-10 items-center justify-center text-stone-500 transition-colors hover:text-teal-700 disabled:opacity-40 dark:hover:text-amber-300"
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center text-sm font-bold text-stone-900 dark:text-stone-100">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          className="flex size-10 items-center justify-center text-stone-500 transition-colors hover:text-teal-700 disabled:opacity-40 dark:hover:text-amber-300"
          disabled={quantity >= product.stock}
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={handleAdd} size="lg">
        <ShoppingCart className="size-4" />
        Add to cart
      </Button>
    </div>
  );
}
