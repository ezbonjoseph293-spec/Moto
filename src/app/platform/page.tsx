import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function PlatformOverviewPage() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="Platform overview"
      description="Dealers table, plan management, and platform metrics are built in Stage 8."
    />
  );
}
