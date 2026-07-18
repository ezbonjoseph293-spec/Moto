import Link from "next/link";
import { Building2, CreditCard, TrendingUp, Users } from "lucide-react";

import { getPlatformMetrics, listDealers } from "@/features/platform/service";
import { DealerStatusBadge } from "@/features/platform/subscription-status-badge";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PlatformOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [metrics, dealers] = await Promise.all([getPlatformMetrics(), listDealers({ search })]);

  const stats = [
    { label: "Dealers", value: metrics.totalDealers, icon: Building2 },
    { label: "Trialing", value: metrics.trialingCount, icon: Users },
    { label: "Active subscriptions", value: metrics.activeSubscriptionCount, icon: CreditCard },
    { label: "Past due", value: metrics.pastDueCount, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Dealers, subscriptions, and revenue.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <div className="mt-2 font-heading text-2xl font-bold text-ink">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs text-muted-foreground">
            Deposits captured (all dealers, UGX equivalent)
          </div>
          <div className="mt-1 font-heading text-xl font-bold text-ink">
            {formatPrice(metrics.depositsVolume, "UGX")}
          </div>
          <div className="text-xs text-muted-foreground">{metrics.depositsCount} payments</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-xs text-muted-foreground">Subscription revenue (UGX equivalent)</div>
          <div className="mt-1 font-heading text-xl font-bold text-ink">
            {formatPrice(metrics.subscriptionRevenue, "UGX")}
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.subscriptionPaymentsCount} payments
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Dealers</h2>
        <form className="mb-3">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search dealers…"
            className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </form>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealers.map((dealer) => (
                <TableRow key={dealer.id}>
                  <TableCell>
                    <Link
                      href={`/platform/dealers/${dealer.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {dealer.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{dealer.slug}</div>
                  </TableCell>
                  <TableCell>
                    <DealerStatusBadge status={dealer.status} />
                  </TableCell>
                  <TableCell>{dealer.subscription?.plan.name ?? "—"}</TableCell>
                  <TableCell>{dealer.subscription?.status ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dealer.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {dealers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No dealers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
