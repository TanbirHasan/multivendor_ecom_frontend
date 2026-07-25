import { create } from "zustand";

interface CheckoutState {
  orderId: string | null;
  clientSecret: string | null;
  setCheckout: (orderId: string, clientSecret: string) => void;
  clear: () => void;
}

/**
 * Deliberately NOT persisted — a Stripe clientSecret is single-use and short-lived,
 * so it only ever needs to survive the in-memory hop from /cart to /checkout/[orderId]
 * within the same SPA session, never a page reload.
 */
export const useCheckoutStore = create<CheckoutState>((set) => ({
  orderId: null,
  clientSecret: null,
  setCheckout: (orderId, clientSecret) => set({ orderId, clientSecret }),
  clear: () => set({ orderId: null, clientSecret: null }),
}));
