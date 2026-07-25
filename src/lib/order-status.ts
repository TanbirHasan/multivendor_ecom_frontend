import type { OrderItemStatus, OrderStatus, PaymentStatus } from "@/lib/types";

const NEXT_STATUSES: Record<OrderItemStatus, OrderItemStatus[]> = {
  PENDING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function nextItemStatuses(current: OrderItemStatus): OrderItemStatus[] {
  return NEXT_STATUSES[current];
}

export function isTerminalItemStatus(status: OrderItemStatus): boolean {
  return NEXT_STATUSES[status].length === 0;
}

export function itemStatusTone(status: OrderItemStatus): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "SHIPPED":
      return "default";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "danger";
  }
}

export function orderStatusTone(status: OrderStatus): "default" | "success" | "warning" | "danger" {
  return status === "PLACED" ? "success" : "danger";
}

export function paymentStatusTone(status: PaymentStatus): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "SUCCEEDED":
      return "success";
    case "FAILED":
      return "danger";
  }
}
