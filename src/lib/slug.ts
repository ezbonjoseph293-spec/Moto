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

/**
 * Generic version of the above for any dealer-scoped model (Vehicle, Brand,
 * BodyType, Collection, ...): appends -2, -3, ... until `exists` reports no
 * conflict. Callers pass a scoped existence check (e.g. excluding the
 * current row's id on edit).
 */
export async function generateUniqueSlug(
  name: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "item";

  let candidate = base;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
