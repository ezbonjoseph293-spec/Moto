import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "available" | "reserved" | "sold" | "outline"> = {
  TRIALING: "outline",
  ACTIVE: "available",
  PAST_DUE: "reserved",
  SUSPENDED: "sold",
  CANCELLED: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  TRIALING: "Trialing",
  ACTIVE: "Active",
  PAST_DUE: "Payment due",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

export function SubscriptionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{STATUS_LABELS[status] ?? status}</Badge>
  );
}

const DEALER_STATUS_VARIANT: Record<string, "available" | "reserved" | "sold" | "outline"> = {
  ACTIVE: "available",
  TRIAL_EXPIRED: "reserved",
  SUSPENDED: "sold",
  CANCELLED: "outline",
};

const DEALER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TRIAL_EXPIRED: "Payment due",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

export function DealerStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={DEALER_STATUS_VARIANT[status] ?? "outline"}>
      {DEALER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
