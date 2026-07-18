import { notFound } from "next/navigation";

import { getDealerDetail, listPlans } from "@/features/platform/service";
import { DealerStatusBadge, SubscriptionStatusBadge } from "@/features/platform/subscription-status-badge";
import { DealerActionsForm } from "@/features/platform/dealer-actions-form";
import { ImpersonateButton } from "@/features/platform/impersonate-button";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Dealer detail" };

export default async function PlatformDealerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, plans] = await Promise.all([getDealerDetail(id), listPlans()]);
  if (!detail) notFound();

  const { dealership, paymentTxns } = detail;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{dealership.name}</h1>
        <p className="text-sm text-muted-foreground">/{dealership.slug}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-heading text-base font-bold text-ink">Subscription</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dealer status</dt>
              <dd>
                <DealerStatusBadge status={dealership.status} />
              </dd>
            </div>
            {dealership.subscription && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subscription status</dt>
                  <dd>
                    <SubscriptionStatusBadge status={dealership.subscription.status} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="text-ink">{dealership.subscription.plan.name}</dd>
                </div>
                {dealership.subscription.trialEndsAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trial ends</dt>
                    <dd className="text-ink">
                      {dealership.subscription.trialEndsAt.toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {dealership.subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Period ends</dt>
                    <dd className="text-ink">
                      {dealership.subscription.currentPeriodEnd.toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>

          <div className="border-t border-border pt-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Staff</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {dealership.users.map((u) => (
                <li key={u.id} className="flex items-center justify-between">
                  <span className="text-ink">
                    {u.name} <span className="text-muted-foreground">({u.role})</span>
                  </span>
                  {u.isActive && <ImpersonateButton targetUserId={u.id} />}
                </li>
              ))}
              {dealership.users.length === 0 && (
                <li className="text-muted-foreground">No staff yet.</li>
              )}
            </ul>
          </div>
        </div>

        <DealerActionsForm
          dealershipId={dealership.id}
          dealershipStatus={dealership.status}
          plans={plans.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 font-heading text-base font-bold text-ink">Payment history</h2>
        <ul className="space-y-2 text-sm">
          {paymentTxns.map((txn) => (
            <li key={txn.id} className="flex justify-between border-b border-border pb-2 last:border-0">
              <span className="text-muted-foreground">{txn.providerRef}</span>
              <span className="text-ink">
                {formatPrice(txn.amount.toString(), txn.currency)} — {txn.status}
              </span>
            </li>
          ))}
          {paymentTxns.length === 0 && <li className="text-muted-foreground">No payments yet.</li>}
        </ul>
      </div>
    </div>
  );
}
