import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ShieldCheck } from "lucide-react";

import { getDealerBySlug, getPublicVehicleBySlug } from "@/features/storefront/service";
import { computeDepositAmount } from "@/features/payments/service";
import { ReserveForm } from "@/components/storefront/reserve-form";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reserve a vehicle", robots: { index: false } };
}

export default async function ReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealerSlug: string }>;
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { dealerSlug } = await params;
  const { vehicle: vehicleSlug } = await searchParams;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const setting = dealer.setting;
  const vehicle = vehicleSlug ? await getPublicVehicleBySlug(dealer.id, vehicleSlug) : null;

  const price = vehicle ? Number(vehicle.discountPrice ?? vehicle.price) : null;
  const depositAmount = price !== null ? computeDepositAmount(setting, price) : null;
  const holdHours = setting?.depositHoldHours ?? 48;
  const env = getEnv();
  const paymentsConfigured = Boolean(env.FLUTTERWAVE_SECRET_KEY);
  const canReserveNow =
    vehicle && vehicle.status === "AVAILABLE" && depositAmount !== null && depositAmount > 0;

  return (
    <main className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">Reserve this vehicle</h1>

        {vehicle ? (
          <p className="mt-2 text-muted-foreground">
            {vehicle.year} {vehicle.title}
            {depositAmount !== null && depositAmount > 0 && (
              <>
                {" "}
                — a deposit of{" "}
                <span className="font-semibold text-ink">
                  {formatPrice(depositAmount, vehicle.currency)}
                </span>{" "}
                holds this car for you.
              </>
            )}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Pick a vehicle from the inventory to see its deposit amount.
          </p>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-md bg-surface p-4 text-sm text-ink/80">
          <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <p>
            Once paid, we hold this vehicle for {holdHours} hours.{" "}
            {setting?.refundPolicyText || "Deposits are refundable per our reservation policy."}
          </p>
        </div>

        {canReserveNow && paymentsConfigured ? (
          <div className="mt-6">
            <ReserveForm dealershipId={dealer.id} vehicleId={vehicle!.id} />
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            {vehicle && vehicle.status !== "AVAILABLE"
              ? "This vehicle is no longer available to reserve."
              : !paymentsConfigured
                ? "Online payment isn't configured for this dealership yet — for now, reach out to the dealer directly to reserve this vehicle."
                : "Pick a vehicle from the inventory to reserve it."}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/${dealerSlug}/contact`}>Contact the dealer</Link>
          </Button>
          {vehicle && (
            <Button asChild variant="outline">
              <Link href={`/${dealerSlug}/inventory/${vehicle.slug}`}>Back to listing</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
