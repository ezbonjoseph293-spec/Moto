"use server";

import { recordAnalyticsEvent } from "./service";

/** Fire-and-forget click tracking for storefront CTAs (WhatsApp, call, reserve). */
export async function trackClickAction(
  dealershipId: string,
  type: "RESERVE_CLICK" | "WHATSAPP_CLICK" | "CALL_CLICK",
  vehicleId?: string,
): Promise<void> {
  await recordAnalyticsEvent(dealershipId, type, { vehicleId });
}
