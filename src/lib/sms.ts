import { getEnv } from "./env";
import { logger } from "./logger";

export type SendSmsInput = {
  to: string;
  message: string;
};

/**
 * Transactional SMS via Africa's Talking's plain REST messaging endpoint (no
 * SDK dependency — one POST, form-encoded, per their docs). Mirrors
 * mailer.ts's dev-fallback pattern: logs instead of sending when credentials
 * aren't configured, and never throws — a failed SMS must not break a
 * webhook or cron run that's also writing the authoritative DB state.
 */
export async function sendSms({ to, message }: SendSmsInput): Promise<void> {
  const env = getEnv();

  if (!env.AFRICASTALKING_USERNAME || !env.AFRICASTALKING_API_KEY) {
    logger.info(
      { to, message },
      "[dev-sms] AFRICASTALKING_API_KEY not set — logging SMS instead of sending",
    );
    return;
  }

  const isSandbox = env.AFRICASTALKING_USERNAME === "sandbox";
  const url = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const body = new URLSearchParams({
    username: env.AFRICASTALKING_USERNAME,
    to,
    message,
    ...(env.AFRICASTALKING_SENDER_ID ? { from: env.AFRICASTALKING_SENDER_ID } : {}),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apiKey: env.AFRICASTALKING_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    if (!res.ok) {
      logger.error({ to, status: res.status }, "Failed to send SMS via Africa's Talking");
    }
  } catch (error) {
    logger.error({ to, error }, "Failed to send SMS via Africa's Talking");
  }
}
