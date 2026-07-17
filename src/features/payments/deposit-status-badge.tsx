"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "available" | "reserved" | "sold" | "outline"> = {
  PENDING_PAYMENT: "outline",
  ACTIVE: "reserved",
  EXPIRED: "outline",
  CANCELLED: "outline",
  COMPLETED: "sold",
  REFUND_PENDING: "reserved",
  REFUNDED: "available",
  DISPUTED: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  ACTIVE: "Active hold",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  REFUND_PENDING: "Refund needed",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export function DepositStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{STATUS_LABELS[status] ?? status}</Badge>
  );
}

/** Live "Xh Ym left" countdown for an ACTIVE reservation's hold. Ticks client-side only. */
export function HoldCountdown({ holdExpiresAt }: { holdExpiresAt: string | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!holdExpiresAt || now === null) return <span className="text-muted-foreground">—</span>;

  const diffMs = new Date(holdExpiresAt).getTime() - now;
  if (diffMs <= 0) return <span className="text-destructive">Expired</span>;

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  return (
    <span className="text-ink">
      {hours}h {minutes}m left
    </span>
  );
}
