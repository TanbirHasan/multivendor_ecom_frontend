import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/types";

export interface CartItem {
  productId: string;
  name: string;
  price: string;
  stock: number;
  sellerId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const existing = get().items.find((i) => i.productId === product.id);
        const cappedQuantity = Math.min(
          (existing?.quantity ?? 0) + quantity,
          product.stock
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === product.id ? { ...i, quantity: cappedQuantity, stock: product.stock } : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
                sellerId: product.sellerId,
                quantity: cappedQuantity,
              },
            ],
          });
        }
      },
      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQuantity: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
          ),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "marketa-cart" }
  )
);
