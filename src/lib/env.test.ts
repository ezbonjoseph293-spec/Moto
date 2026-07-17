import { describe, expect, it } from "vitest";

import { envSchema } from "@/lib/env";

const validEnv = {
  DATABASE_URL: "postgresql://moto:moto@localhost:5432/moto?schema=public",
  DIRECT_URL: "postgresql://moto:moto@localhost:5432/moto?schema=public",
  AUTH_SECRET: "a".repeat(32),
};

describe("envSchema", () => {
  it("accepts a minimal valid environment and applies defaults", () => {
    const parsed = envSchema.parse(validEnv);

    expect(parsed.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.LOG_LEVEL).toBe("info");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => envSchema.parse({})).toThrow();
  });

  it("rejects a malformed DATABASE_URL", () => {
    expect(() => envSchema.parse({ DATABASE_URL: "not-a-url" })).toThrow();
  });

  it("rejects an AUTH_SECRET that is too short", () => {
    expect(() => envSchema.parse({ ...validEnv, AUTH_SECRET: "short" })).toThrow(
      /at least 32 characters/,
    );
  });

  it("accepts a fully populated environment", () => {
    const parsed = envSchema.parse({
      ...validEnv,
      NODE_ENV: "production",
      AUTH_SECRET: "a".repeat(48),
      AUTH_URL: "https://moto.example.com",
      CLOUDINARY_CLOUD_NAME: "moto",
      FLUTTERWAVE_SECRET_KEY: "FLWSECK_TEST-xxxx",
    });

    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.AUTH_URL).toBe("https://moto.example.com");
  });
});
