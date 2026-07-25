import { NextResponse, type NextRequest } from "next/server";

export type SslcommerzOutcome = "success" | "fail" | "cancel";

/**
 * SSLCommerz's hosted checkout page sends the buyer back via a browser POST (form
 * auto-submit) to whichever of success_url/fail_url/cancel_url applies — not a normal link
 * click — so these routes have to be real Route Handlers, not page components, and have to
 * accept POST. The backend does not set any custom passthrough fields (`value_a`/b/c/d) —
 * only `tran_id` (SSLCommerz's own core transaction reference, always present) is reliable,
 * so that's the only thing worth extracting here; the status page resolves the actual order
 * by matching it against `payment.providerTransactionId` in the buyer's own order list.
 */
export async function extractSslcommerzTranId(request: NextRequest): Promise<string | null> {
  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const tranId = formData.get("tran_id") as string | null;
      if (tranId) return tranId;
    } catch {
      // Not form-encoded — fall through and try the query string instead.
    }
  }

  return request.nextUrl.searchParams.get("tran_id");
}

export async function redirectToStatusPage(request: NextRequest, outcome: SslcommerzOutcome) {
  const tranId = await extractSslcommerzTranId(request);

  const url = request.nextUrl.clone();
  url.pathname = "/checkout/sslcommerz/status";
  url.search = "";
  url.searchParams.set("outcome", outcome);
  if (tranId) url.searchParams.set("tranId", tranId);

  return NextResponse.redirect(url, { status: 303 });
}
