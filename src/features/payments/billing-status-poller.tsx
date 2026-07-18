"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import {
  getSubscriptionPaymentStatusAction,
  type SubscriptionPaymentStatusResult,
} from "./actions";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

export function BillingStatusPoller({ txRef }: { txRef: string }) {
  const [result, setResult] = useState<SubscriptionPaymentStatusResult>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const status = await getSubscriptionPaymentStatusAction(txRef);
      if (cancelled) return;
      setResult(status);
      pollCount.current += 1;

      const isSettled = status?.paymentStatus && status.paymentStatus !== "PENDING";
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

  if (result.paymentStatus === "SUCCESSFUL") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-available" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-ink">Payment confirmed</h2>
        <p className="text-sm text-muted-foreground">Your subscription is now active.</p>
        <Link href="/admin/billing" className="text-sm font-medium text-brand underline">
          Back to Billing
        </Link>
      </div>
    );
  }

  if (result.paymentStatus === "FAILED") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="size-10 text-destructive" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-ink">Payment didn&apos;t go through</h2>
        <p className="text-sm text-muted-foreground">
          You can try again any time from the Billing page.
        </p>
        <Link href="/admin/billing" className="text-sm font-medium text-brand underline">
          Back to Billing
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Clock className="size-8 text-brand" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Still confirming your payment — this can take a minute.
      </p>
      <Link href="/admin/billing" className="text-sm font-medium text-brand underline">
        Back to Billing
      </Link>
    </div>
  );
}
