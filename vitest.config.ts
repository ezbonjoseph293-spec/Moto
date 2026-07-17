import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // Integration tests hit a real (sometimes remote/pooled) Postgres — the
    // 10s default can be too tight for a cold connection.
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
