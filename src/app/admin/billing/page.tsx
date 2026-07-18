import { CreditCard } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { forDealership } from "@/features/tenancy";
import { listPlans } from "@/features/platform/service";
import { SubscriptionStatusBadge } from "@/features/platform/subscription-status-badge";
import { BillingPayForm } from "@/features/payments/billing-pay-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Billing" };

const GRACE_PERIOD_DAYS = 7;

export default async function AdminBillingPage() {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const db = forDealership(user.dealershipId);
  const [subscription, plans, invoices] = await Promise.all([
    db.subscription.findUnique({ where: { dealershipId: user.dealershipId }, include: { plan: true } }),
    listPlans(),
    db.paymentTransaction.findMany({
      where: { purpose: "SUBSCRIPTION" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!subscription) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No subscription yet"
        description="Contact the platform operator to get a subscription set up for your account."
      />
    );
  }

  const daysPastDue = subscription.pastDueSince
    ? (Date.now() - subscription.pastDueSince.getTime()) / 86_400_000
    : null;
  const graceDaysLeft =
    daysPastDue !== null ? Math.max(0, Math.ceil(GRACE_PERIOD_DAYS - daysPastDue)) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your plan, payment status, and subscription history.
        </p>
      </div>

      {subscription.status === "PAST_DUE" && (
        <div className="rounded-lg border border-reserved/40 bg-reserved/10 p-4 text-sm text-ink">
          <p className="font-semibold">Payment due</p>
          <p className="mt-1 text-muted-foreground">
            {graceDaysLeft !== null && graceDaysLeft > 0
              ? `Pay within ${graceDaysLeft} day(s) to keep your storefront online.`
              : "Your storefront will be suspended shortly unless payment is received."}
          </p>
        </div>
      )}

      {subscription.status === "SUSPENDED" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-ink">
          <p className="font-semibold">Account suspended</p>
          <p className="mt-1 text-muted-foreground">
            Your storefront is offline. Pay below to reactivate immediately.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-base font-bold text-ink">Current plan</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="text-ink">{subscription.plan.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <SubscriptionStatusBadge status={subscription.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Billing interval</dt>
              <dd className="text-ink">
                {subscription.billingInterval === "YEARLY" ? "Yearly" : "Monthly"}
              </dd>
            </div>
            {subscription.status === "TRIALING" && subscription.trialEndsAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Trial ends</dt>
                <dd className="text-ink">{subscription.trialEndsAt.toLocaleDateString()}</dd>
              </div>
            )}
            {subscription.status === "ACTIVE" && subscription.currentPeriodEnd && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Renews on</dt>
                <dd className="text-ink">{subscription.currentPeriodEnd.toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-heading text-base font-bold text-ink">
            {subscription.status === "ACTIVE" ? "Change plan" : "Pay now"}
          </h2>
          <BillingPayForm
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              currency: p.currency,
              priceMonthly: p.priceMonthly.toString(),
              priceYearly: p.priceYearly.toString(),
            }))}
            currentPlanId={subscription.planId}
            currentBillingInterval={subscription.billingInterval}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-heading text-base font-bold text-ink">Payment history</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {txn.providerRef}
                  </TableCell>
                  <TableCell>{formatPrice(txn.amount.toString(), txn.currency)}</TableCell>
                  <TableCell>{txn.status}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {txn.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No payments yet.
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
