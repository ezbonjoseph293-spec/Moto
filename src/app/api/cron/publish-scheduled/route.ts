import { NextResponse } from "next/server";

import { forPlatform } from "@/features/tenancy";
import { publishScheduledVehicles } from "@/features/inventory/service";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Vercel Cron target (see `vercel.json`) — flips any DRAFT vehicle whose
 * `publishAt` is due to AVAILABLE, dealership by dealership. Protected by
 * `CRON_SECRET` so it can't be triggered by an outside request; if the
 * secret isn't configured yet (local dev), the route still runs so the
 * feature is testable without provisioning one.
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

  let published = 0;
  for (const { id } of dealerships) {
    const result = await publishScheduledVehicles(id);
    published += result.published;
  }

  logger.info({ published, dealershipCount: dealerships.length }, "cron.publish_scheduled");

  return NextResponse.json({ ok: true, published });
}
