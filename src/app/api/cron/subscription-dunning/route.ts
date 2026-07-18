import { NextResponse } from "next/server";

import { forPlatform } from "@/features/tenancy";
import { runSubscriptionDunning } from "@/features/payments/service";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Vercel Cron target (see vercel.json) — advances every dealership's
 * subscription through the trial/renewal -> past due -> suspended lifecycle,
 * sending dunning reminders along the way. Same CRON_SECRET-guarded pattern
 * as /api/cron/expire-reservations.
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

  const totals = { trialExpired: 0, renewalDue: 0, reminderSent: 0, suspended: 0, cancelled: 0 };
  for (const { id } of dealerships) {
    const result = await runSubscriptionDunning(id);
    totals.trialExpired += result.trialExpired;
    totals.renewalDue += result.renewalDue;
    totals.reminderSent += result.reminderSent;
    totals.suspended += result.suspended;
    totals.cancelled += result.cancelled;
  }

  logger.info({ ...totals, dealershipCount: dealerships.length }, "cron.subscription_dunning");

  return NextResponse.json({ ok: true, ...totals });
}
