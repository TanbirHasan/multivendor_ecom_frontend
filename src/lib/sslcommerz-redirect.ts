import { NextResponse, type NextRequest } from "next/server";

export type SslcommerzOutcome = "success" | "fail" | "cancel";

/**
 * SSLCommerz's hosted checkout page sends the buyer back via a browser POST (form
 * auto-submit) to whichever of success_url/fail_url/cancel_url applies — not a normal link
 * click — so these routes have to be real Route Handlers, not page components, and have to
 * accept POST. We don't actually know for certain which fields the backend configured
 * SSLCommerz to echo back (their standard fields are `tran_id`, plus merchant-supplied
 * passthrough fields like `value_a`), so this pulls whatever's there defensively and lets
 * the status page fall back to matching `tran_id` against the buyer's own orders if a
 * direct order id isn't present.
 */
export async function extractSslcommerzParams(request: NextRequest) {
  let tranId: string | null = null;
  let orderId: string | null = null;

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      tranId = (formData.get("tran_id") as string | null) ?? null;
      orderId = (formData.get("value_a") as string | null) ?? null;
    } catch {
      // Not form-encoded — fall through and try the query string instead.
    }
  }

  const searchParams = request.nextUrl.searchParams;
  tranId ??= searchParams.get("tran_id");
  orderId ??= searchParams.get("value_a") ?? searchParams.get("orderId");

  return { tranId, orderId };
}

export async function redirectToStatusPage(request: NextRequest, outcome: SslcommerzOutcome) {
  const { tranId, orderId } = await extractSslcommerzParams(request);

  const url = request.nextUrl.clone();
  url.pathname = "/checkout/sslcommerz/status";
  url.search = "";
  url.searchParams.set("outcome", outcome);
  if (tranId) url.searchParams.set("tranId", tranId);
  if (orderId) url.searchParams.set("orderId", orderId);

  return NextResponse.redirect(url, { status: 303 });
}
