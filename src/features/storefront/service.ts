import type { Prisma, VehicleCondition, FuelType, TransmissionType, DriveType } from "@prisma/client";

import { forDealership, forPlatform } from "@/features/tenancy";

/** Resolves a dealer for the public `[dealerSlug]` route tree — branding, contacts, nav. */
export async function getDealerBySlug(slug: string) {
  const db = forPlatform();
  return db.dealership.findUnique({
    where: { slug },
    include: {
      setting: true,
      menus: { orderBy: { order: "asc" } },
    },
  });
}

// ============================================================================
// Vehicles
// ============================================================================

/** Only these statuses are ever visible on the public storefront. */
const PUBLIC_VEHICLE_STATUSES = ["AVAILABLE", "RESERVED"] as const;

export type PublicVehicleFilters = {
  search?: string;
  brandId?: string;
  bodyTypeId?: string;
  condition?: VehicleCondition;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  driveType?: DriveType;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";
};

const vehicleCardInclude = {
  brand: true,
  bodyType: true,
  images: { where: { isCover: true }, take: 1 as const },
} satisfies Prisma.VehicleInclude;

export async function listPublicVehicles(dealershipId: string, filters: PublicVehicleFilters = {}) {
  const db = forDealership(dealershipId);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));

  const where: Prisma.VehicleWhereInput = {
    status: "AVAILABLE",
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(filters.bodyTypeId ? { bodyTypeId: filters.bodyTypeId } : {}),
    ...(filters.condition ? { condition: filters.condition } : {}),
    ...(filters.fuelType ? { fuelType: filters.fuelType } : {}),
    ...(filters.transmission ? { transmission: filters.transmission } : {}),
    ...(filters.driveType ? { driveType: filters.driveType } : {}),
    ...(filters.color ? { color: { equals: filters.color, mode: "insensitive" } } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.minYear !== undefined || filters.maxYear !== undefined
      ? {
          year: {
            ...(filters.minYear !== undefined ? { gte: filters.minYear } : {}),
            ...(filters.maxYear !== undefined ? { lte: filters.maxYear } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { price: "asc" }
      : filters.sort === "price_desc"
        ? { price: "desc" }
        : filters.sort === "year_desc"
          ? { year: "desc" }
          : filters.sort === "mileage_asc"
            ? { mileage: "asc" }
            : { createdAt: "desc" };

  const [vehicles, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: vehicleCardInclude,
    }),
    db.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPublicVehicleBySlug(dealershipId: string, slug: string) {
  const db = forDealership(dealershipId);
  return db.vehicle.findFirst({
    where: { slug, status: { in: [...PUBLIC_VEHICLE_STATUSES] } },
    include: {
      brand: true,
      bodyType: true,
      images: { orderBy: { order: "asc" } },
      videos: { orderBy: { order: "asc" } },
      documents: { orderBy: { order: "asc" } },
    },
  });
}

/** Fire-and-forget: bumps viewCount and logs a VEHICLE_VIEW analytics event. Never throws. */
export async function recordVehicleView(dealershipId: string, vehicleId: string, path: string) {
  try {
    const db = forDealership(dealershipId);
    await Promise.all([
      db.vehicle.update({ where: { id: vehicleId }, data: { viewCount: { increment: 1 } } }),
      db.analyticsEvent.create({
        data: { dealershipId, vehicleId, type: "VEHICLE_VIEW", path },
      }),
    ]);
  } catch {
    // Analytics is best-effort — never break the page for it.
  }
}

/** Best-effort click/pageview tracking used by CTAs (WhatsApp, call, reserve). Never throws. */
export async function recordAnalyticsEvent(
  dealershipId: string,
  type: "PAGE_VIEW" | "RESERVE_CLICK" | "WHATSAPP_CLICK" | "CALL_CLICK" | "LEAD_SUBMITTED",
  opts: { vehicleId?: string; path?: string } = {},
) {
  try {
    const db = forDealership(dealershipId);
    await db.analyticsEvent.create({
      data: { dealershipId, type, vehicleId: opts.vehicleId ?? null, path: opts.path ?? null },
    });
  } catch {
    // best-effort
  }
}

export async function listFeaturedVehicles(dealershipId: string, limit = 8) {
  const db = forDealership(dealershipId);
  const featured = await db.vehicle.findMany({
    where: { status: "AVAILABLE", isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: vehicleCardInclude,
  });
  if (featured.length >= limit) return featured;

  const fill = await db.vehicle.findMany({
    where: { status: "AVAILABLE", isFeatured: false },
    orderBy: { createdAt: "desc" },
    take: limit - featured.length,
    include: vehicleCardInclude,
  });
  return [...featured, ...fill];
}

export async function listLatestVehicles(dealershipId: string, limit = 8) {
  const db = forDealership(dealershipId);
  return db.vehicle.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: vehicleCardInclude,
  });
}

export async function getRelatedVehicles(
  dealershipId: string,
  vehicle: { id: string; brandId: string; bodyTypeId: string | null },
  limit = 4,
) {
  const db = forDealership(dealershipId);
  return db.vehicle.findMany({
    where: {
      status: "AVAILABLE",
      NOT: { id: vehicle.id },
      OR: [{ brandId: vehicle.brandId }, ...(vehicle.bodyTypeId ? [{ bodyTypeId: vehicle.bodyTypeId }] : [])],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: vehicleCardInclude,
  });
}

// ============================================================================
// Brands & body types
// ============================================================================

export async function listPublicBrands(dealershipId: string, opts: { featuredOnly?: boolean } = {}) {
  const db = forDealership(dealershipId);
  return db.brand.findMany({
    where: { dealershipId, ...(opts.featuredOnly ? { isFeatured: true } : {}) },
    orderBy: { order: "asc" },
  });
}

export async function listPublicBodyTypes(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.bodyType.findMany({ where: { dealershipId }, orderBy: { order: "asc" } });
}

// ============================================================================
// Collections
// ============================================================================

export async function listPublicCollections(dealershipId: string, opts: { featuredOnly?: boolean } = {}) {
  const db = forDealership(dealershipId);
  return db.collection.findMany({
    where: { dealershipId, ...(opts.featuredOnly ? { isFeatured: true } : {}) },
    orderBy: { order: "asc" },
  });
}

export async function getPublicCollectionBySlug(dealershipId: string, slug: string) {
  const db = forDealership(dealershipId);
  return db.collection.findFirst({ where: { dealershipId, slug } });
}

function ruleConfigToWhere(config: { rules: { field: string; operator: string; value: string }[] }) {
  const clauses: Prisma.VehicleWhereInput[] = config.rules.map((rule) => {
    if (rule.field === "brandId" || rule.field === "bodyTypeId" || rule.field === "condition") {
      return { [rule.field]: rule.value } as Prisma.VehicleWhereInput;
    }
    const num = Number(rule.value);
    const op = { eq: "equals", lt: "lt", lte: "lte", gt: "gt", gte: "gte" }[rule.operator] ?? "equals";
    return { [rule.field]: { [op]: num } } as Prisma.VehicleWhereInput;
  });
  return clauses.length > 0 ? { AND: clauses } : {};
}

/** Live membership for a collection, filtered to publicly visible vehicles only. */
export async function getPublicCollectionVehicles(dealershipId: string, collectionId: string) {
  const db = forDealership(dealershipId);
  const collection = await db.collection.findUniqueOrThrow({ where: { id: collectionId } });

  if (collection.ruleType === "MANUAL") {
    const items = await db.collectionVehicle.findMany({
      where: { collectionId, vehicle: { status: "AVAILABLE" } },
      orderBy: { order: "asc" },
      include: { vehicle: { include: vehicleCardInclude } },
    });
    return items.map((i) => i.vehicle);
  }

  const config = (collection.ruleConfig ?? { rules: [] }) as unknown as {
    rules: { field: string; operator: string; value: string }[];
  };
  return db.vehicle.findMany({
    where: { dealershipId, status: "AVAILABLE", ...ruleConfigToWhere(config) },
    include: vehicleCardInclude,
    orderBy: { createdAt: "desc" },
  });
}

// ============================================================================
// Pages & testimonials
// ============================================================================

export async function getPageByKey(
  dealershipId: string,
  key: "ABOUT" | "PRIVACY" | "TERMS" | "COOKIE_POLICY" | "WARRANTY" | "RETURNS" | "FINANCING",
) {
  const db = forDealership(dealershipId);
  return db.page.findFirst({ where: { dealershipId, key } });
}

export async function getPageBySlug(dealershipId: string, slug: string) {
  const db = forDealership(dealershipId);
  return db.page.findFirst({ where: { dealershipId, slug } });
}

export async function listPolicyPages(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.page.findMany({
    where: { dealershipId, key: { not: "ABOUT" } },
    orderBy: { title: "asc" },
  });
}

export async function listTestimonials(dealershipId: string, opts: { featuredOnly?: boolean } = {}) {
  const db = forDealership(dealershipId);
  return db.testimonial.findMany({
    where: { dealershipId, ...(opts.featuredOnly ? { isFeatured: true } : {}) },
    orderBy: { order: "asc" },
  });
}
