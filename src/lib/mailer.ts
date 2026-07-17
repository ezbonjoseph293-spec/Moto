import { Resend } from "resend";
import { getEnv } from "./env";
import { logger } from "./logger";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Transactional email. Sends via Resend when RESEND_API_KEY is configured;
 * otherwise logs the email (subject + a plain-text rendering) so auth flows
 * (verification, password reset) are fully testable in local dev without a
 * Resend account. Never throws — a failed send must not surface as a 500 to
 * the user who just tried to sign up or reset their password.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const env = getEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.info(
      { to, subject, html },
      "[dev-mailer] RESEND_API_KEY not set — logging email instead of sending",
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (result.error) {
      logger.error({ to, subject, error: result.error }, "Failed to send email via Resend");
    }
  } catch (error) {
    logger.error({ to, subject, error }, "Failed to send email via Resend");
  }
}
