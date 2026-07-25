import type { NextRequest } from "next/server";
import { redirectToStatusPage } from "@/lib/sslcommerz-redirect";

export async function POST(request: NextRequest) {
  return redirectToStatusPage(request, "fail");
}

export async function GET(request: NextRequest) {
  return redirectToStatusPage(request, "fail");
}
