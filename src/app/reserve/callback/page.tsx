import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { ReservationStatusPoller } from "@/components/storefront/reservation-status-poller";

export const metadata: Metadata = { title: "Confirming your reservation", robots: { index: false } };

export default async function ReserveCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ tx_ref?: string }>;
}) {
  const { tx_ref: txRef } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">Your reservation</h1>

        {txRef ? (
          <ReservationStatusPoller txRef={txRef} />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            We couldn&apos;t find that payment reference.
          </p>
        )}
      </div>
    </main>
  );
}
