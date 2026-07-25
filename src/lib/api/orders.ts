import { apiClient } from "./client";
import type { CheckoutPayload, CheckoutResponse, Order, OrderItem, OrderItemStatus } from "@/lib/types";

export async function checkout(payload: CheckoutPayload) {
  const { data } = await apiClient.post<CheckoutResponse>("/orders", payload);
  return data;
}

export async function listMyOrders() {
  const { data } = await apiClient.get<Order[]>("/orders");
  return data;
}

export async function listAllOrdersAdmin() {
  const { data } = await apiClient.get<Order[]>("/orders/admin");
  return data;
}

export async function getOrder(id: string) {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export async function listSellerItems() {
  const { data } = await apiClient.get<OrderItem[]>("/orders/seller-items");
  return data;
}

export async function updateItemStatus(id: string, status: OrderItemStatus) {
  const { data } = await apiClient.patch<OrderItem>(`/orders/items/${id}/status`, { status });
  return data;
}

/**
 * The webhook/IPN that finalizes payment status can land a moment after the gateway's
 * client-side confirmation resolves, so the backend order record is briefly still "PENDING"
 * even on a successful payment. Poll a few times before giving up and showing whatever the
 * last known state was.
 */
export async function pollOrderUntilPaymentResolved(
  id: string,
  { attempts = 5, intervalMs = 1500 }: { attempts?: number; intervalMs?: number } = {}
) {
  for (let i = 0; i < attempts; i++) {
    const order = await getOrder(id);
    if (!order.payment || order.payment.status !== "PENDING") {
      return order;
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } else {
      return order;
    }
  }
  return getOrder(id);
}

/**
 * SSLCommerz redirects the browser back with its own `tran_id`, not our order id — there's
 * no "get order by transaction id" endpoint, so we resolve it client-side against the
 * buyer's own order list (which is all `GET /api/orders` ever returns anyway).
 */
export async function findOrderByProviderTransactionId(tranId: string) {
  const orders = await listMyOrders();
  return orders.find((o) => o.payment?.providerTransactionId === tranId) ?? null;
}
