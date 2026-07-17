import { NextResponse } from "next/server";

import { isValidWebhookHash } from "@/lib/flutterwave";
import { logger } from "@/lib/logger";
import { processFlutterwaveWebhookEvent, type WebhookEvent } from "@/features/payments/service";

/**
 * Flutterwave webhook target — the only path allowed to move a Reservation
 * out of PENDING_PAYMENT. Flutterwave sends a shared secret in the
 * `verif-hash` header (not an HMAC signature); anything that doesn't match
 * FLUTTERWAVE_WEBHOOK_SECRET_HASH is rejected before the body is even
 * parsed for business logic. The payload itself is still never trusted for
 * the payment's actual status/amount — processFlutterwaveWebhookEvent
 * re-verifies with Flutterwave's API before mutating anything.
 */
export async function POST(request: Request) {
  const hash = request.headers.get("verif-hash");
  if (!isValidWebhookHash(hash)) {
    logger.warn("flutterwave.webhook_invalid_hash");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookEvent;
  try {
    payload = (await request.json()) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await processFlutterwaveWebhookEvent(payload);
  } catch (error) {
    logger.error({ error, payload }, "flutterwave.webhook_processing_failed");
    // 500 so Flutterwave retries — this is an unexpected error, not a
    // deliberate rejection, and the handler is idempotent so a retry is safe.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
