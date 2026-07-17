import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function AdminOverviewPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Dashboard overview"
      description="Leads, deposits, inventory status, and revenue charts arrive alongside their respective modules (Stages 4, 6, and 7)."
    />
  );
}
