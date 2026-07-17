"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { getReservationStatusAction, type ReservationStatusResult } from "@/features/payments/actions";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

export function ReservationStatusPoller({ txRef }: { txRef: string }) {
  const [result, setResult] = useState<ReservationStatusResult>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const status = await getReservationStatusAction(txRef);
      if (cancelled) return;
      setResult(status);
      pollCount.current += 1;

      const isSettled = status?.reservationStatus && status.reservationStatus !== "PENDING_PAYMENT";
      if (!isSettled && pollCount.current < MAX_POLLS) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    let timer: ReturnType<typeof setTimeout>;
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [txRef]);

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Clock className="size-8 animate-pulse text-brand" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  const backHref = `/${result.dealerSlug}${result.vehicleSlug ? `/inventory/${result.vehicleSlug}` : ""}`;

  if (result.reservationStatus === "ACTIVE") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-available" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-ink">Reservation confirmed</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation to your phone and email. The dealer will be in touch
          shortly.
        </p>
        <Link href={backHref} className="text-sm font-medium text-brand underline">
          Back to the listing
        </Link>
      </div>
    );
  }

  if (result.reservationStatus === "REFUND_PENDING") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="size-10 text-reserved" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-ink">Vehicle already taken</h2>
        <p className="text-sm text-muted-foreground">
          Sorry — someone else&apos;s payment was confirmed just before yours. Your deposit will
          be refunded; the dealer will contact you shortly.
        </p>
        <Link href={backHref} className="text-sm font-medium text-brand underline">
          Browse other vehicles
        </Link>
      </div>
    );
  }

  if (result.reservationStatus === "CANCELLED") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="size-10 text-destructive" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-ink">Payment didn&apos;t go through</h2>
        <p className="text-sm text-muted-foreground">
          Your payment wasn&apos;t completed, so this vehicle wasn&apos;t reserved. You can try
          again from the listing.
        </p>
        <Link href={backHref} className="text-sm font-medium text-brand underline">
          Back to the listing
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Clock className="size-8 text-brand" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Still confirming your payment — this can take a minute. We&apos;ll SMS and email you as
        soon as it&apos;s done either way.
      </p>
      <Link href={backHref} className="text-sm font-medium text-brand underline">
        Back to the listing
      </Link>
    </div>
  );
}
