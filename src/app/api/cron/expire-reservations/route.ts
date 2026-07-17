import { NextResponse } from "next/server";

import { forPlatform } from "@/features/tenancy";
import { expireStaleReservations } from "@/features/payments/service";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Vercel Cron target (see vercel.json) — releases ACTIVE reservations whose
 * hold has passed (flags the deposit for refund, frees the vehicle) and
 * cancels PENDING_PAYMENT reservations abandoned mid-checkout. Same
 * CRON_SECRET-guarded pattern as /api/cron/publish-scheduled.
 */
export async function GET(request: Request) {
  const env = getEnv();

  if (env.CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = forPlatform();
  const dealerships = await db.dealership.findMany({ select: { id: true } });

  let expired = 0;
  let abandonedCancelled = 0;
  for (const { id } of dealerships) {
    const result = await expireStaleReservations(id);
    expired += result.expired;
    abandonedCancelled += result.abandonedCancelled;
  }

  logger.info(
    { expired, abandonedCancelled, dealershipCount: dealerships.length },
    "cron.expire_reservations",
  );

  return NextResponse.json({ ok: true, expired, abandonedCancelled });
}
