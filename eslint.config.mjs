import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    // Dealer-owned data must only ever be touched through the tenant-scoped
    // client (forDealership()/forPlatform()) in src/features/tenancy — never
    // by importing the raw Prisma singleton elsewhere, which would bypass
    // tenant isolation.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/**", "src/features/tenancy/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message:
                "Don't import the raw Prisma client directly. Use forDealership(dealershipId) or forPlatform() from @/features/tenancy so tenant isolation is enforced.",
            },
            {
              name: "@prisma/client",
              importNames: ["PrismaClient"],
              message:
                "Don't instantiate PrismaClient directly. Use forDealership(dealershipId) or forPlatform() from @/features/tenancy.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
