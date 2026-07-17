import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/require-role";
import { getReservation, getReservationHistory } from "@/features/payments/service";
import { DepositStatusBadge, HoldCountdown } from "@/features/payments/deposit-status-badge";
import { DepositActionsForm } from "@/features/payments/deposit-actions-form";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Reservation" };

export default async function AdminDepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const { id } = await params;
  const reservation = await getReservation(user.dealershipId, id);
  if (!reservation) notFound();

  const history = await getReservationHistory(user.dealershipId, id);
  const canMarkRefunded = ["REFUND_PENDING", "EXPIRED", "CANCELLED"].includes(reservation.status);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/deposits" className="text-sm text-muted-foreground hover:underline">
          ← Deposits
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
          {reservation.vehicle.year} {reservation.vehicle.title}
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-base font-bold text-ink">Reservation</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <DepositStatusBadge status={reservation.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Buyer</dt>
              <dd className="text-ink">{reservation.buyerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-ink">{reservation.buyerPhone}</dd>
            </div>
            {reservation.buyerEmail && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-ink">{reservation.buyerEmail}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Deposit</dt>
              <dd className="text-ink">
                {formatPrice(reservation.depositAmount.toString(), reservation.currency)}
              </dd>
            </div>
            {reservation.status === "ACTIVE" && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hold</dt>
                <dd>
                  <HoldCountdown holdExpiresAt={reservation.holdExpiresAt?.toISOString() ?? null} />
                </dd>
              </div>
            )}
            {reservation.refundStatus && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Refund</dt>
                <dd className="text-ink">{reservation.refundStatus}</dd>
              </div>
            )}
            {reservation.refundNotes && (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-ink">{reservation.refundNotes}</dd>
              </div>
            )}
          </dl>

          <div className="border-t border-border pt-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Payments</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {reservation.paymentTxns.map((txn) => (
                <li key={txn.id} className="flex justify-between">
                  <span className="text-muted-foreground">{txn.providerRef}</span>
                  <span className="text-ink">
                    {formatPrice(txn.amount.toString(), txn.currency)} — {txn.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DepositActionsForm reservationId={reservation.id} canMarkRefunded={canMarkRefunded} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-base font-bold text-ink">Transition history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {history.map((entry) => (
            <li key={entry.id} className="flex justify-between border-b border-border pb-2 last:border-0">
              <span className="text-ink">{entry.action.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground">
                {entry.actor?.name ?? "System"} · {entry.createdAt.toLocaleString()}
              </span>
            </li>
          ))}
          {history.length === 0 && <li className="text-muted-foreground">No history yet.</li>}
        </ul>
      </div>
    </div>
  );
}
