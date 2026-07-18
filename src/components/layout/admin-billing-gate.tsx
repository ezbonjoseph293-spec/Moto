"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Full-block "pay now" wall shown across /admin once a dealership's grace
 * period has fully lapsed (SUSPENDED/CANCELLED) — everything except the
 * Billing page itself (where they'd actually pay) is replaced by this.
 * A client component so it can read the current route via usePathname();
 * server layouts don't have a clean way to do that.
 */
export function AdminBillingGate({
  dealershipStatus,
  children,
}: {
  dealershipStatus: "ACTIVE" | "TRIAL_EXPIRED" | "SUSPENDED" | "CANCELLED";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBillingPage = pathname.startsWith("/admin/billing");
  const isBlocked = dealershipStatus === "SUSPENDED" || dealershipStatus === "CANCELLED";

  if (!isBlocked || isBillingPage) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-20 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Lock className="size-6" aria-hidden="true" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-ink">
        {dealershipStatus === "CANCELLED" ? "Subscription cancelled" : "Account suspended"}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Your storefront is offline due to non-payment. Pay now to reactivate your account
        immediately.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin/billing">Go to Billing</Link>
      </Button>
    </div>
  );
}
