import Link from "next/link";
import { redirect } from "next/navigation";
import { Car, Eye, Inbox, Wallet } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";
import { getInventoryOverviewStats } from "@/features/inventory/service";
import { getLeadStats } from "@/features/leads/service";
import { getDepositOverviewStats } from "@/features/payments/service";
import { getSettings } from "@/features/settings/service";
import { listTeamActivity } from "@/features/team/service";
import { ActivityLog } from "@/features/team/activity-log";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  if (user.role === "OWNER") {
    const dealership = await forPlatform().dealership.findUniqueOrThrow({
      where: { id: user.dealershipId },
      select: { onboardingCompletedAt: true },
    });
    if (!dealership.onboardingCompletedAt) {
      redirect("/admin/onboarding");
    }
  }

  const [inventory, leads, deposits, setting, activity] = await Promise.all([
    getInventoryOverviewStats(user.dealershipId),
    getLeadStats(user.dealershipId),
    getDepositOverviewStats(user.dealershipId),
    getSettings(user.dealershipId),
    listTeamActivity(user.dealershipId, 8),
  ]);

  const stats = [
    {
      label: "Available vehicles",
      value: inventory.byStatus.AVAILABLE,
      hint: `${inventory.total} total`,
      icon: Car,
      href: "/admin/inventory",
    },
    {
      label: "New leads",
      value: leads.newCount,
      hint: `${leads.total} total`,
      icon: Inbox,
      href: "/admin/leads",
    },
    {
      label: "Active reservations",
      value: deposits.activeCount,
      hint: `${deposits.depositsCount} deposits captured`,
      icon: Wallet,
      href: "/admin/deposits",
    },
    {
      label: "Vehicle views",
      value: inventory.totalViews,
      hint: "across all listings",
      icon: Eye,
      href: "/admin/inventory",
    },
  ];

  const statusRows: { label: string; value: number }[] = [
    { label: "Draft", value: inventory.byStatus.DRAFT },
    { label: "Available", value: inventory.byStatus.AVAILABLE },
    { label: "Reserved", value: inventory.byStatus.RESERVED },
    { label: "Sold", value: inventory.byStatus.SOLD },
    { label: "Archived", value: inventory.byStatus.ARCHIVED },
    { label: "Hidden", value: inventory.byStatus.HIDDEN },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Overview</h1>
        <p className="text-sm text-muted-foreground">
          {setting.businessName ?? "Your dealership"} at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <div className="mt-2 font-heading text-2xl font-bold text-ink">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground/70">{hint}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-base font-bold text-ink">Inventory status</h2>
          <dl className="space-y-2 text-sm">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deposit revenue (all time)</span>
              <span className="font-medium text-ink">
                {/* No per-dealership default currency setting exists yet (Phase 2
                    multi-currency); every seeded/real dealer currently uses UGX,
                    matching the schema's default on every currency column. */}
                {formatPrice(deposits.totalRevenue, "UGX")}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-base font-bold text-ink">Recent activity</h2>
          <ActivityLog entries={activity} />
        </div>
      </div>
    </div>
  );
}
