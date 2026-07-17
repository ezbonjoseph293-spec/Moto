import { forPlatform } from "@/features/tenancy";

/** "Kampala Prestige Motors" -> "kampala-prestige-motors" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Turns a dealership name into a unique, URL-safe slug by appending -2, -3,
 * ... until no existing Dealership already owns it. Used once, at onboarding
 * — dealer slugs never change after that (it's the storefront URL).
 */
export async function generateUniqueDealerSlug(name: string): Promise<string> {
  const base = slugify(name) || "dealership";
  const db = forPlatform();

  let candidate = base;
  let suffix = 2;
  while (await db.dealership.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
