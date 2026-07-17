import { Wallet } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function AdminDepositsPage() {
  return (
    <EmptyState
      icon={Wallet}
      title="Deposits & reservations"
      description="Payment status, hold countdowns, and refund handling are built in Stage 6."
    />
  );
}
