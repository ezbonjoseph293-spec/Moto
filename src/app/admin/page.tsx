import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";

export default async function AdminOverviewPage() {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);

  if (user.role === "OWNER" && user.dealershipId) {
    const dealership = await forPlatform().dealership.findUniqueOrThrow({
      where: { id: user.dealershipId },
      select: { onboardingCompletedAt: true },
    });
    if (!dealership.onboardingCompletedAt) {
      redirect("/admin/onboarding");
    }
  }

  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Dashboard overview"
      description="Leads, deposits, inventory status, and revenue charts arrive alongside their respective modules (Stages 4, 6, and 7)."
    />
  );
}
