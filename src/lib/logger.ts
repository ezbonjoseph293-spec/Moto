import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Structured application logger. JSON output in production (machine-readable
 * for log aggregation), pretty-printed in development.
 *
 * Reads LOG_LEVEL directly from process.env rather than getEnv() so logging
 * works even while diagnosing a broken environment configuration.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: undefined,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});
