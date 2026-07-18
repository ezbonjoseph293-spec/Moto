import { CreditCard } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { BillingStatusPoller } from "@/features/payments/billing-status-poller";

export const metadata = { title: "Confirming your payment" };

export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ tx_ref?: string }>;
}) {
  await requireRole(["OWNER", "MANAGER", "SALES"]);
  const { tx_ref: txRef } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CreditCard className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">Your payment</h1>

        {txRef ? (
          <BillingStatusPoller txRef={txRef} />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            We couldn&apos;t find that payment reference.
          </p>
        )}
      </div>
    </div>
  );
}
