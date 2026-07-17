import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "available" | "reserved" | "sold" | "outline"> = {
  NEW: "reserved",
  CONTACTED: "outline",
  QUALIFIED: "available",
  CLOSED: "sold",
  LOST: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CLOSED: "Closed",
  LOST: "Lost",
};

const SOURCE_LABELS: Record<string, string> = {
  VEHICLE_INQUIRY: "Vehicle inquiry",
  CONTACT_FORM: "Contact form",
  DEPOSIT: "Deposit",
  TRADE_IN: "Trade-in",
  FINANCE_APPLICATION: "Finance application",
  TEST_DRIVE: "Test drive",
  NEWSLETTER: "Newsletter",
  OTHER: "Other",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{STATUS_LABELS[status] ?? status}</Badge>
  );
}

export function leadSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
