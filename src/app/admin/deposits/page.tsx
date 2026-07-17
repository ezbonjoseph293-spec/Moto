import Link from "next/link";

import { requireRole } from "@/features/auth/require-role";
import { listReservations } from "@/features/payments/service";
import { reservationStatusValues } from "@/features/payments/schema";
import { DepositStatusBadge, HoldCountdown } from "@/features/payments/deposit-status-badge";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Deposits" };

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const sp = await searchParams;
  const status = (reservationStatusValues as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof reservationStatusValues)[number])
    : undefined;

  const reservations = await listReservations(user.dealershipId, { status });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Deposits &amp; reservations</h1>
        <p className="text-sm text-muted-foreground">
          Every deposit payment and its hold, refund, and dispute status.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/deposits"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!status ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          All
        </Link>
        {reservationStatusValues.map((s) => (
          <Link
            key={s}
            href={`/admin/deposits?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${status === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hold</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    href={`/admin/deposits/${r.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {r.vehicle.year} {r.vehicle.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>{r.buyerName}</div>
                  <div className="text-xs text-muted-foreground">{r.buyerPhone}</div>
                </TableCell>
                <TableCell>{formatPrice(r.depositAmount.toString(), r.currency)}</TableCell>
                <TableCell>
                  <DepositStatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  {r.status === "ACTIVE" ? (
                    <HoldCountdown holdExpiresAt={r.holdExpiresAt?.toISOString() ?? null} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.createdAt.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {reservations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No reservations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
