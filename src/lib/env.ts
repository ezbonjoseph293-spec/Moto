import { z } from "zod";

/**
 * `.env.example` ships every not-yet-required variable present but blank
 * (`FOO=`), so a freshly-copied `.env` has them as `""`, not absent. Wrap
 * optional string schemas with this so `""` is treated the same as unset,
 * instead of failing `.min(1)`.
 */
function optionalEnvString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === "" ? undefined : val), schema.optional());
}

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
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: optionalEnvString(z.string().url()),

  // Cloudinary (Stage 3)
  CLOUDINARY_CLOUD_NAME: optionalEnvString(z.string().min(1)),
  CLOUDINARY_API_KEY: optionalEnvString(z.string().min(1)),
  CLOUDINARY_API_SECRET: optionalEnvString(z.string().min(1)),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optionalEnvString(z.string().min(1)),

  // Flutterwave (Stages 6 & 8)
  FLUTTERWAVE_PUBLIC_KEY: optionalEnvString(z.string().min(1)),
  FLUTTERWAVE_SECRET_KEY: optionalEnvString(z.string().min(1)),
  FLUTTERWAVE_WEBHOOK_SECRET_HASH: optionalEnvString(z.string().min(1)),

  // Africa's Talking (Stage 6)
  AFRICASTALKING_USERNAME: optionalEnvString(z.string().min(1)),
  AFRICASTALKING_API_KEY: optionalEnvString(z.string().min(1)),
  AFRICASTALKING_SENDER_ID: optionalEnvString(z.string().min(1)),

  // Resend (Stage 2)
  RESEND_API_KEY: optionalEnvString(z.string().min(1)),
  EMAIL_FROM: optionalEnvString(z.string().min(1)),
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
