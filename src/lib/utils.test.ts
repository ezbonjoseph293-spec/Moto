import { describe, expect, it } from "vitest";

import { cn, titleCaseSlug } from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, last one wins", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy values", () => {
    expect(cn("text-ink", false, undefined, "bg-surface")).toBe("text-ink bg-surface");
  });
});

describe("titleCaseSlug", () => {
  it("converts a slug to title case", () => {
    expect(titleCaseSlug("kampala-prestige-motors")).toBe("Kampala Prestige Motors");
  });

  it("handles single-word slugs and stray hyphens", () => {
    expect(titleCaseSlug("demo")).toBe("Demo");
    expect(titleCaseSlug("--demo--motors-")).toBe("Demo Motors");
  });
});
