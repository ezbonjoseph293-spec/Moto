import { z } from "zod";

/**
 * Single source of truth for environment variables.
 * Every variable in `.env.example` is declared here. Variables belonging to
 * later stages are optional for now and tightened to required when the stage
 * that consumes them is built.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Auth.js (Stage 2)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters").optional(),
  AUTH_URL: z.string().url().optional(),

  // Cloudinary (Stage 3)
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),

  // Flutterwave (Stages 6 & 8)
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1).optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1).optional(),
  FLUTTERWAVE_WEBHOOK_SECRET_HASH: z.string().min(1).optional(),

  // Africa's Talking (Stage 6)
  AFRICASTALKING_USERNAME: z.string().min(1).optional(),
  AFRICASTALKING_API_KEY: z.string().min(1).optional(),
  AFRICASTALKING_SENDER_ID: z.string().min(1).optional(),

  // Resend (Stage 2)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Parse and cache the process environment. Throws a readable, aggregated
 * error listing every invalid/missing variable instead of failing one at
 * a time.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration (did you copy .env.example to .env?):\n${details}`,
    );
  }

  cached = result.data;
  return cached;
}
