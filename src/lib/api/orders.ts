import { apiClient } from "./client";
import type { CheckoutPayload, Order, OrderItem, OrderItemStatus } from "@/lib/types";

export async function checkout(payload: CheckoutPayload) {
  const { data } = await apiClient.post<Order>("/orders", payload);
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
