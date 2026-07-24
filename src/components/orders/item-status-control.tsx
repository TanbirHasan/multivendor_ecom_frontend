"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { itemStatusTone, nextItemStatuses } from "@/lib/order-status";
import type { OrderItemStatus } from "@/lib/types";

interface ItemStatusControlProps {
  status: OrderItemStatus;
  isSaving?: boolean;
  onChange: (next: OrderItemStatus) => void;
}

const LABELS: Record<OrderItemStatus, string> = {
  PENDING: "Mark as pending",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel item",
};

export function ItemStatusControl({ status, isSaving, onChange }: ItemStatusControlProps) {
  const [pending, setPending] = useState<OrderItemStatus | null>(null);
  const options = nextItemStatuses(status);

  if (options.length === 0) {
    return <Badge tone={itemStatusTone(status)}>{status}</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={itemStatusTone(status)}>{status}</Badge>
      {options.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === "CANCELLED" ? "danger" : "outline"}
          isLoading={isSaving && pending === next}
          disabled={isSaving}
          onClick={() => {
            setPending(next);
            onChange(next);
          }}
        >
          {LABELS[next]}
        </Button>
      ))}
    </div>
  );
}
