"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pollOrderUntilPaymentResolved } from "@/lib/api/orders";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";

export function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const clearCart = useCartStore((s) => s.clear);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // No redirect was needed (card succeeded/declined without 3D Secure). The webhook is the
    // authoritative source of truth, so poll our own backend rather than trusting this result.
    const order = await pollOrderUntilPaymentResolved(orderId);

    if (order.payment?.status === "SUCCEEDED") {
      toast.success("Payment successful!");
      clearCart();
      clearCheckout();
      router.push(`/orders/${orderId}`);
      return;
    }

    if (order.payment?.status === "FAILED") {
      toast.error("Payment failed — the order was cancelled and stock restored. Your cart is still here to try again.");
      clearCheckout();
      router.push(`/orders/${orderId}`);
      return;
    }

    toast("Still processing — we'll show the final status on your order page.", { icon: "⏳" });
    router.push(`/orders/${orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={!stripe || !elements}>
        Pay now
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
        <ShieldCheck className="size-3.5" />
        Payments are processed securely by Stripe — card details never touch our servers.
      </p>
    </form>
  );
}
