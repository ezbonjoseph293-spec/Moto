import { timingSafeEqual } from "node:crypto";

import { getEnv } from "./env";
import { logger } from "./logger";

const BASE_URL = "https://api.flutterwave.com/v3";

export class FlutterwaveConfigError extends Error {}

function secretKey(): string {
  const env = getEnv();
  if (!env.FLUTTERWAVE_SECRET_KEY) {
    throw new FlutterwaveConfigError("FLUTTERWAVE_SECRET_KEY is not configured.");
  }
  return env.FLUTTERWAVE_SECRET_KEY;
}

export type InitiatePaymentInput = {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email: string; phoneNumber: string; name: string };
  meta?: Record<string, string>;
  title: string;
  description: string;
};

export type InitiatePaymentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Initiates a Flutterwave Standard (hosted) checkout — the single flow that
 * offers MTN MoMo, Airtel Money, and card without us having to build
 * separate integrations per payment method. Returns the URL to redirect the
 * buyer to; payment confirmation itself only ever comes from the webhook
 * (see /api/webhooks/flutterwave), never from this call succeeding.
 */
export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl,
      customer: {
        email: input.customer.email,
        phonenumber: input.customer.phoneNumber,
        name: input.customer.name,
      },
      meta: input.meta,
      customizations: {
        title: input.title,
        description: input.description,
      },
    }),
  });

  const body = (await res.json().catch(() => null)) as {
    status?: string;
    data?: { link?: string };
    message?: string;
  } | null;

  if (!res.ok || body?.status !== "success" || !body.data?.link) {
    logger.error({ status: res.status, body }, "flutterwave.initiate_payment_failed");
    return { ok: false, error: body?.message ?? "Could not start the payment." };
  }

  return { ok: true, checkoutUrl: body.data.link };
}

export type VerifyTransactionResult =
  | {
      ok: true;
      status: "successful" | "failed" | "other";
      amount: number;
      currency: string;
      txRef: string;
      flwTransactionId: string;
      raw: unknown;
    }
  | { ok: false; error: string };

/**
 * Re-fetches the transaction directly from Flutterwave's API using our
 * secret key — the only source of truth for whether a payment actually
 * succeeded. The webhook payload itself (and its verif-hash header) is only
 * ever treated as a trigger to call this, never as proof of payment on its
 * own, since a payload's amount/status fields could be forged if the hash
 * were ever guessed or leaked.
 */
export async function verifyTransaction(
  flwTransactionId: string,
): Promise<VerifyTransactionResult> {
  const res = await fetch(`${BASE_URL}/transactions/${encodeURIComponent(flwTransactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });

  const body = (await res.json().catch(() => null)) as {
    status?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      tx_ref?: string;
      id?: number;
    };
    message?: string;
  } | null;

  if (!res.ok || body?.status !== "success" || !body.data) {
    logger.error({ status: res.status, body }, "flutterwave.verify_transaction_failed");
    return { ok: false, error: body?.message ?? "Could not verify the transaction." };
  }

  const data = body.data;
  return {
    ok: true,
    status:
      data.status === "successful" ? "successful" : data.status === "failed" ? "failed" : "other",
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? ""),
    txRef: String(data.tx_ref ?? ""),
    flwTransactionId: String(data.id ?? flwTransactionId),
    raw: body,
  };
}

/**
 * Constant-time comparison of the webhook's `verif-hash` header against our
 * configured secret hash, so a request with a valid-looking but wrong header
 * can't be distinguished from a mismatch by response-time side channel.
 */
export function isValidWebhookHash(headerValue: string | null): boolean {
  const env = getEnv();
  if (!env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || !headerValue) return false;

  const expected = Buffer.from(env.FLUTTERWAVE_WEBHOOK_SECRET_HASH);
  const actual = Buffer.from(headerValue);
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}
