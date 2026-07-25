import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey && process.env.NODE_ENV !== "production") {
  console.warn(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — the checkout payment form will fail to load."
  );
}

export const stripePromise = loadStripe(publishableKey ?? "");
