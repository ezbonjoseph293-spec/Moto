import type { Prisma, VehicleCondition, VehicleStatus } from "@prisma/client";
import Papa from "papaparse";

import { forDealership } from "@/features/tenancy";
import { syncReservationOnVehicleRelease } from "@/features/payments/service";
import { recordAuditLog } from "@/lib/audit";
import { generateUniqueSlug, slugify } from "@/lib/slug";
import {
  VEHICLE_STATUS_TRANSITIONS,
  csvVehicleRowSchema,
  type BodyTypeInput,
  type BrandInput,
  type CollectionInput,
  type CollectionRuleConfig,
  type VehicleInput,
} from "./schema";

// ============================================================================
// Vehicles
// ============================================================================

export type VehicleListFilters = {
  search?: string;
  status?: VehicleStatus;
  brandId?: string;
  bodyTypeId?: string;
  condition?: VehicleCondition;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "year_desc";
};

export async function listVehicles(dealershipId: string, filters: VehicleListFilters = {}) {
  const db = forDealership(dealershipId);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.VehicleWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(filters.bodyTypeId ? { bodyTypeId: filters.bodyTypeId } : {}),
    ...(filters.condition ? { condition: filters.condition } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { vin: { contains: filters.search, mode: "insensitive" } },
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
          : { createdAt: "desc" };

  const [vehicles, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: true,
        bodyType: true,
        images: { where: { isCover: true }, take: 1 },
      },
    }),
    db.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getInventoryOverviewStats(dealershipId: string) {
  const db = forDealership(dealershipId);
  const [byStatus, totalViews] = await Promise.all([
    db.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
    db.vehicle.aggregate({ _sum: { viewCount: true } }),
  ]);

  const counts: Record<VehicleStatus, number> = {
    DRAFT: 0,
    AVAILABLE: 0,
    RESERVED: 0,
    SOLD: 0,
    ARCHIVED: 0,
    HIDDEN: 0,
  };
  for (const row of byStatus) counts[row.status] = row._count._all;

  return {
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    byStatus: counts,
    totalViews: totalViews._sum.viewCount ?? 0,
  };
}

export async function getVehicle(dealershipId: string, id: string) {
  const db = forDealership(dealershipId);
  return db.vehicle.findUniqueOrThrow({
    where: { id },
    include: {
      brand: true,
      bodyType: true,
      images: { orderBy: { order: "asc" } },
      videos: { orderBy: { order: "asc" } },
      documents: { orderBy: { order: "asc" } },
    },
  });
}

async function uniqueVehicleSlug(
  db: ReturnType<typeof forDealership>,
  dealershipId: string,
  title: string,
  year: number,
  excludeId?: string,
) {
  const base = `${slugify(title)}-${year}`;
  return generateUniqueSlug(base, async (candidate) => {
    const existing = await db.vehicle.findFirst({
      where: { dealershipId, slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    return Boolean(existing);
  });
}

function vehicleWriteData(input: VehicleInput) {
  return {
    brandId: input.brandId,
    bodyTypeId: input.bodyTypeId ?? null,
    title: input.title,
    year: input.year,
    price: input.price,
    currency: input.currency || "UGX",
    discountPrice: input.discountPrice ?? null,
    mileage: input.mileage ?? null,
    mileageUnit: input.mileageUnit,
    fuelType: input.fuelType,
    transmission: input.transmission,
    driveType: input.driveType ?? null,
    condition: input.condition,
    color: input.color ?? null,
    seats: input.seats ?? null,
    doors: input.doors ?? null,
    engineSizeCc: input.engineSizeCc ?? null,
    vin: input.vin ?? null,
    description: input.description,
    features: input.features,
    isFeatured: input.isFeatured,
    publishAt: input.publishAt ? new Date(input.publishAt) : null,
  };
}

export async function createVehicle(dealershipId: string, actorId: string, input: VehicleInput) {
  const db = forDealership(dealershipId);
  const slug = await uniqueVehicleSlug(db, dealershipId, input.title, input.year);

  const vehicle = await db.vehicle.create({
    data: { dealershipId, slug, status: "DRAFT", ...vehicleWriteData(input) },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.created",
    entityType: "Vehicle",
    entityId: vehicle.id,
    after: vehicle,
  });

  return vehicle;
}

export async function updateVehicle(
  dealershipId: string,
  actorId: string,
  id: string,
  input: VehicleInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.vehicle.findUniqueOrThrow({ where: { id } });

  const slug =
    before.title === input.title && before.year === input.year
      ? before.slug
      : await uniqueVehicleSlug(db, dealershipId, input.title, input.year, id);

  const vehicle = await db.vehicle.update({
    where: { id },
    data: { slug, ...vehicleWriteData(input) },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.updated",
    entityType: "Vehicle",
    entityId: vehicle.id,
    before,
    after: vehicle,
  });

  return vehicle;
}

export async function duplicateVehicle(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const source = await db.vehicle.findUniqueOrThrow({
    where: { id },
    include: { images: true, videos: true, documents: true },
  });

  const slug = await uniqueVehicleSlug(db, dealershipId, `${source.title} copy`, source.year);

  const copy = await db.vehicle.create({
    data: {
      dealershipId,
      brandId: source.brandId,
      bodyTypeId: source.bodyTypeId,
      title: `${source.title} (copy)`,
      slug,
      year: source.year,
      price: source.price,
      currency: source.currency,
      discountPrice: source.discountPrice,
      mileage: source.mileage,
      mileageUnit: source.mileageUnit,
      fuelType: source.fuelType,
      transmission: source.transmission,
      driveType: source.driveType,
      condition: source.condition,
      color: source.color,
      seats: source.seats,
      doors: source.doors,
      engineSizeCc: source.engineSizeCc,
      description: source.description,
      features: source.features ?? undefined,
      status: "DRAFT",
      isFeatured: false,
      images: {
        create: source.images.map((img) => ({
          dealershipId,
          url: img.url,
          publicId: img.publicId,
          altText: img.altText,
          order: img.order,
          isCover: img.isCover,
        })),
      },
      videos: {
        create: source.videos.map((v) => ({
          dealershipId,
          url: v.url,
          provider: v.provider,
          order: v.order,
        })),
      },
      documents: {
        create: source.documents.map((d) => ({
          dealershipId,
          url: d.url,
          label: d.label,
          order: d.order,
        })),
      },
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.duplicated",
    entityType: "Vehicle",
    entityId: copy.id,
    before: { sourceId: source.id },
    after: copy,
  });

  return copy;
}

export async function deleteVehicle(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const before = await db.vehicle.findUniqueOrThrow({ where: { id } });
  await db.vehicle.delete({ where: { id } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.deleted",
    entityType: "Vehicle",
    entityId: id,
    before,
  });
}

/**
 * Every status change goes through here so the transition is validated and
 * audited. `actorId` is null for system-driven transitions (the scheduled
 * publish job) — AuditLog.actorId is a nullable FK, so this must not pass a
 * fake user id.
 */
export async function transitionVehicleStatus(
  dealershipId: string,
  actorId: string | null,
  id: string,
  nextStatus: VehicleStatus,
) {
  const db = forDealership(dealershipId);
  const before = await db.vehicle.findUniqueOrThrow({ where: { id } });

  if (before.status === nextStatus) return before;

  const allowed = VEHICLE_STATUS_TRANSITIONS[before.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot move a vehicle from ${before.status} to ${nextStatus}.`);
  }

  const vehicle = await db.vehicle.update({
    where: { id },
    data: {
      status: nextStatus,
      soldAt:
        nextStatus === "SOLD" ? new Date() : nextStatus === before.status ? before.soldAt : null,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: `vehicle.status.${before.status.toLowerCase()}_to_${nextStatus.toLowerCase()}`,
    entityType: "Vehicle",
    entityId: id,
    before: { status: before.status },
    after: { status: vehicle.status },
  });

  // A dealer completing or releasing a sale from RESERVED must also close
  // out the reservation that put it there — otherwise its hold timer would
  // keep running (or its deposit would never get flagged for refund) after
  // the vehicle has already moved on.
  if (
    before.status === "RESERVED" &&
    actorId &&
    (nextStatus === "SOLD" || nextStatus === "AVAILABLE" || nextStatus === "ARCHIVED")
  ) {
    await syncReservationOnVehicleRelease(dealershipId, actorId, id, nextStatus);
  }

  return vehicle;
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export async function bulkUpdateStatus(
  dealershipId: string,
  actorId: string,
  vehicleIds: string[],
  status: VehicleStatus,
) {
  const results = { updated: 0, skipped: [] as string[] };
  for (const id of vehicleIds) {
    try {
      await transitionVehicleStatus(dealershipId, actorId, id, status);
      results.updated += 1;
    } catch {
      results.skipped.push(id);
    }
  }

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.bulk_status_updated",
    entityType: "Vehicle",
    after: { vehicleIds, status, ...results },
  });

  return results;
}

export async function bulkUpdatePricing(
  dealershipId: string,
  actorId: string,
  vehicleIds: string[],
  mode: "set" | "increase_pct" | "decrease_pct",
  amount: number,
) {
  const db = forDealership(dealershipId);
  const vehicles = await db.vehicle.findMany({ where: { id: { in: vehicleIds } } });

  await db.$transaction(
    vehicles.map((v) => {
      const current = Number(v.price);
      const nextPrice =
        mode === "set"
          ? amount
          : mode === "increase_pct"
            ? current * (1 + amount / 100)
            : current * (1 - amount / 100);

      return db.vehicle.update({
        where: { id: v.id },
        data: { price: Math.max(0, Math.round(nextPrice * 100) / 100) },
      });
    }),
  );

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.bulk_pricing_updated",
    entityType: "Vehicle",
    after: { vehicleIds, mode, amount },
  });

  return { updated: vehicles.length };
}

export async function bulkDeleteVehicles(
  dealershipId: string,
  actorId: string,
  vehicleIds: string[],
) {
  const db = forDealership(dealershipId);
  const result = await db.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.bulk_deleted",
    entityType: "Vehicle",
    after: { vehicleIds },
  });

  return { deleted: result.count };
}

/** Called by the scheduled-publish cron. Flips due DRAFT vehicles to AVAILABLE. */
export async function publishScheduledVehicles(dealershipId: string) {
  const db = forDealership(dealershipId);
  const due = await db.vehicle.findMany({
    where: { status: "DRAFT", publishAt: { lte: new Date() } },
    select: { id: true },
  });

  for (const { id } of due) {
    await transitionVehicleStatus(dealershipId, null, id, "AVAILABLE");
  }

  return { published: due.length };
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function addVehicleImage(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  input: { url: string; publicId: string; altText?: string },
) {
  const db = forDealership(dealershipId);
  const [maxOrder, coverCount] = await Promise.all([
    db.vehicleImage.aggregate({ where: { vehicleId }, _max: { order: true } }),
    db.vehicleImage.count({ where: { vehicleId, isCover: true } }),
  ]);

  const image = await db.vehicleImage.create({
    data: {
      dealershipId,
      vehicleId,
      url: input.url,
      publicId: input.publicId,
      altText: input.altText ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
      isCover: coverCount === 0,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.image_added",
    entityType: "Vehicle",
    entityId: vehicleId,
    after: { imageId: image.id },
  });

  return image;
}

export async function reorderVehicleImages(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  orderedIds: string[],
) {
  const db = forDealership(dealershipId);
  await db.$transaction(
    orderedIds.map((id, order) => db.vehicleImage.update({ where: { id }, data: { order } })),
  );

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.images_reordered",
    entityType: "Vehicle",
    entityId: vehicleId,
    after: { orderedIds },
  });
}

export async function setCoverImage(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  imageId: string,
) {
  const db = forDealership(dealershipId);
  await db.$transaction([
    db.vehicleImage.updateMany({ where: { vehicleId }, data: { isCover: false } }),
    db.vehicleImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.cover_image_set",
    entityType: "Vehicle",
    entityId: vehicleId,
    after: { imageId },
  });
}

export async function deleteVehicleImage(dealershipId: string, actorId: string, imageId: string) {
  const db = forDealership(dealershipId);
  const image = await db.vehicleImage.findUniqueOrThrow({ where: { id: imageId } });
  await db.vehicleImage.delete({ where: { id: imageId } });

  if (image.isCover) {
    const next = await db.vehicleImage.findFirst({
      where: { vehicleId: image.vehicleId },
      orderBy: { order: "asc" },
    });
    if (next) await db.vehicleImage.update({ where: { id: next.id }, data: { isCover: true } });
  }

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.image_deleted",
    entityType: "Vehicle",
    entityId: image.vehicleId,
    before: { imageId },
  });
}

export async function addVehicleVideo(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  url: string,
) {
  const db = forDealership(dealershipId);
  const maxOrder = await db.vehicleVideo.aggregate({ where: { vehicleId }, _max: { order: true } });
  const video = await db.vehicleVideo.create({
    data: { dealershipId, vehicleId, url, order: (maxOrder._max.order ?? -1) + 1 },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.video_added",
    entityType: "Vehicle",
    entityId: vehicleId,
    after: { videoId: video.id },
  });

  return video;
}

export async function deleteVehicleVideo(dealershipId: string, actorId: string, videoId: string) {
  const db = forDealership(dealershipId);
  const video = await db.vehicleVideo.findUniqueOrThrow({ where: { id: videoId } });
  await db.vehicleVideo.delete({ where: { id: videoId } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.video_deleted",
    entityType: "Vehicle",
    entityId: video.vehicleId,
    before: { videoId },
  });
}

export async function addVehicleDocument(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  input: { url: string; label: string },
) {
  const db = forDealership(dealershipId);
  const maxOrder = await db.vehicleDocument.aggregate({
    where: { vehicleId },
    _max: { order: true },
  });
  const document = await db.vehicleDocument.create({
    data: {
      dealershipId,
      vehicleId,
      url: input.url,
      label: input.label,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.document_added",
    entityType: "Vehicle",
    entityId: vehicleId,
    after: { documentId: document.id },
  });

  return document;
}

export async function deleteVehicleDocument(
  dealershipId: string,
  actorId: string,
  documentId: string,
) {
  const db = forDealership(dealershipId);
  const document = await db.vehicleDocument.findUniqueOrThrow({ where: { id: documentId } });
  await db.vehicleDocument.delete({ where: { id: documentId } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.document_deleted",
    entityType: "Vehicle",
    entityId: document.vehicleId,
    before: { documentId },
  });
}

// ============================================================================
// Brands
// ============================================================================

export async function listBrands(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.brand.findMany({
    where: { dealershipId },
    orderBy: { order: "asc" },
    include: { _count: { select: { vehicles: true } } },
  });
}

export async function createBrand(dealershipId: string, actorId: string, input: BrandInput) {
  const db = forDealership(dealershipId);
  const slug = await generateUniqueSlug(input.name, async (candidate) =>
    Boolean(
      await db.brand.findFirst({ where: { dealershipId, slug: candidate }, select: { id: true } }),
    ),
  );
  const maxOrder = await db.brand.aggregate({ where: { dealershipId }, _max: { order: true } });

  const brand = await db.brand.create({
    data: {
      dealershipId,
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      isFeatured: input.isFeatured,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "brand.created",
    entityType: "Brand",
    entityId: brand.id,
    after: brand,
  });

  return brand;
}

export async function updateBrand(
  dealershipId: string,
  actorId: string,
  id: string,
  input: BrandInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.brand.findUniqueOrThrow({ where: { id } });

  const slug =
    before.name === input.name
      ? before.slug
      : await generateUniqueSlug(input.name, async (candidate) =>
          Boolean(
            await db.brand.findFirst({
              where: { dealershipId, slug: candidate, NOT: { id } },
              select: { id: true },
            }),
          ),
        );

  const brand = await db.brand.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      isFeatured: input.isFeatured,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "brand.updated",
    entityType: "Brand",
    entityId: brand.id,
    before,
    after: brand,
  });

  return brand;
}

export async function deleteBrand(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const inUse = await db.vehicle.count({ where: { brandId: id } });
  if (inUse > 0) {
    throw new Error(`Cannot delete: ${inUse} vehicle(s) still use this brand.`);
  }

  const before = await db.brand.findUniqueOrThrow({ where: { id } });
  await db.brand.delete({ where: { id } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "brand.deleted",
    entityType: "Brand",
    entityId: id,
    before,
  });
}

export async function moveBrand(
  dealershipId: string,
  actorId: string,
  id: string,
  direction: "up" | "down",
) {
  const db = forDealership(dealershipId);
  const item = await db.brand.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.brand.findFirst({
    where: { dealershipId, order: direction === "up" ? { lt: item.order } : { gt: item.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return item;

  await db.$transaction([
    db.brand.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    db.brand.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "brand.reordered",
    entityType: "Brand",
    entityId: id,
  });
}

// ============================================================================
// Body types
// ============================================================================

export async function listBodyTypes(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.bodyType.findMany({
    where: { dealershipId },
    orderBy: { order: "asc" },
    include: { _count: { select: { vehicles: true } } },
  });
}

export async function createBodyType(dealershipId: string, actorId: string, input: BodyTypeInput) {
  const db = forDealership(dealershipId);
  const slug = await generateUniqueSlug(input.name, async (candidate) =>
    Boolean(
      await db.bodyType.findFirst({
        where: { dealershipId, slug: candidate },
        select: { id: true },
      }),
    ),
  );
  const maxOrder = await db.bodyType.aggregate({ where: { dealershipId }, _max: { order: true } });

  const bodyType = await db.bodyType.create({
    data: {
      dealershipId,
      name: input.name,
      slug,
      iconUrl: input.iconUrl ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "body_type.created",
    entityType: "BodyType",
    entityId: bodyType.id,
    after: bodyType,
  });

  return bodyType;
}

export async function updateBodyType(
  dealershipId: string,
  actorId: string,
  id: string,
  input: BodyTypeInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.bodyType.findUniqueOrThrow({ where: { id } });

  const slug =
    before.name === input.name
      ? before.slug
      : await generateUniqueSlug(input.name, async (candidate) =>
          Boolean(
            await db.bodyType.findFirst({
              where: { dealershipId, slug: candidate, NOT: { id } },
              select: { id: true },
            }),
          ),
        );

  const bodyType = await db.bodyType.update({
    where: { id },
    data: { name: input.name, slug, iconUrl: input.iconUrl ?? null },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "body_type.updated",
    entityType: "BodyType",
    entityId: bodyType.id,
    before,
    after: bodyType,
  });

  return bodyType;
}

export async function deleteBodyType(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const inUse = await db.vehicle.count({ where: { bodyTypeId: id } });
  if (inUse > 0) {
    throw new Error(`Cannot delete: ${inUse} vehicle(s) still use this body type.`);
  }

  const before = await db.bodyType.findUniqueOrThrow({ where: { id } });
  await db.bodyType.delete({ where: { id } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "body_type.deleted",
    entityType: "BodyType",
    entityId: id,
    before,
  });
}

export async function moveBodyType(
  dealershipId: string,
  actorId: string,
  id: string,
  direction: "up" | "down",
) {
  const db = forDealership(dealershipId);
  const item = await db.bodyType.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.bodyType.findFirst({
    where: { dealershipId, order: direction === "up" ? { lt: item.order } : { gt: item.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return item;

  await db.$transaction([
    db.bodyType.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    db.bodyType.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "body_type.reordered",
    entityType: "BodyType",
    entityId: id,
  });
}

// ============================================================================
// Collections
// ============================================================================

export async function listCollections(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.collection.findMany({
    where: { dealershipId },
    orderBy: { order: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getCollection(dealershipId: string, id: string) {
  const db = forDealership(dealershipId);
  return db.collection.findUniqueOrThrow({ where: { id } });
}

function ruleConfigToWhere(config: CollectionRuleConfig): Prisma.VehicleWhereInput {
  const clauses: Prisma.VehicleWhereInput[] = config.rules.map((rule) => {
    if (rule.field === "brandId" || rule.field === "bodyTypeId") {
      return { [rule.field]: rule.value } as Prisma.VehicleWhereInput;
    }
    if (rule.field === "condition" || rule.field === "status") {
      return { [rule.field]: rule.value } as Prisma.VehicleWhereInput;
    }
    // numeric fields: price, year, mileage
    const num = Number(rule.value);
    const op = { eq: "equals", lt: "lt", lte: "lte", gt: "gt", gte: "gte" }[rule.operator];
    return { [rule.field]: { [op]: num } } as Prisma.VehicleWhereInput;
  });

  return clauses.length > 0 ? { AND: clauses } : {};
}

/** Live membership for a collection — manual join rows, or a rule evaluated on demand. */
export async function getCollectionVehicles(dealershipId: string, collectionId: string) {
  const db = forDealership(dealershipId);
  const collection = await db.collection.findUniqueOrThrow({ where: { id: collectionId } });

  if (collection.ruleType === "MANUAL") {
    const items = await db.collectionVehicle.findMany({
      where: { collectionId },
      orderBy: { order: "asc" },
      include: {
        vehicle: { include: { brand: true, images: { where: { isCover: true }, take: 1 } } },
      },
    });
    return items.map((i) => i.vehicle);
  }

  const config = (collection.ruleConfig ?? { rules: [] }) as unknown as CollectionRuleConfig;
  return db.vehicle.findMany({
    where: { dealershipId, ...ruleConfigToWhere(config) },
    include: { brand: true, images: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCollection(
  dealershipId: string,
  actorId: string,
  input: CollectionInput,
) {
  const db = forDealership(dealershipId);
  const slug = await generateUniqueSlug(input.name, async (candidate) =>
    Boolean(
      await db.collection.findFirst({
        where: { dealershipId, slug: candidate },
        select: { id: true },
      }),
    ),
  );
  const maxOrder = await db.collection.aggregate({
    where: { dealershipId },
    _max: { order: true },
  });
  const ruleConfig =
    input.ruleType === "RULE_BASED" && input.rulesJson ? JSON.parse(input.rulesJson) : undefined;

  const collection = await db.collection.create({
    data: {
      dealershipId,
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      isFeatured: input.isFeatured,
      ruleType: input.ruleType,
      ruleConfig,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.created",
    entityType: "Collection",
    entityId: collection.id,
    after: collection,
  });

  return collection;
}

export async function updateCollection(
  dealershipId: string,
  actorId: string,
  id: string,
  input: CollectionInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.collection.findUniqueOrThrow({ where: { id } });

  const slug =
    before.name === input.name
      ? before.slug
      : await generateUniqueSlug(input.name, async (candidate) =>
          Boolean(
            await db.collection.findFirst({
              where: { dealershipId, slug: candidate, NOT: { id } },
              select: { id: true },
            }),
          ),
        );

  const ruleConfig =
    input.ruleType === "RULE_BASED" && input.rulesJson ? JSON.parse(input.rulesJson) : null;

  const collection = await db.collection.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      isFeatured: input.isFeatured,
      ruleType: input.ruleType,
      ruleConfig,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.updated",
    entityType: "Collection",
    entityId: collection.id,
    before,
    after: collection,
  });

  return collection;
}

export async function deleteCollection(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const before = await db.collection.findUniqueOrThrow({ where: { id } });
  await db.collection.delete({ where: { id } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.deleted",
    entityType: "Collection",
    entityId: id,
    before,
  });
}

export async function moveCollection(
  dealershipId: string,
  actorId: string,
  id: string,
  direction: "up" | "down",
) {
  const db = forDealership(dealershipId);
  const item = await db.collection.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.collection.findFirst({
    where: { dealershipId, order: direction === "up" ? { lt: item.order } : { gt: item.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return item;

  await db.$transaction([
    db.collection.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    db.collection.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.reordered",
    entityType: "Collection",
    entityId: id,
  });
}

export async function addVehicleToCollection(
  dealershipId: string,
  actorId: string,
  collectionId: string,
  vehicleId: string,
) {
  const db = forDealership(dealershipId);
  const maxOrder = await db.collectionVehicle.aggregate({
    where: { collectionId },
    _max: { order: true },
  });

  const item = await db.collectionVehicle.create({
    data: { dealershipId, collectionId, vehicleId, order: (maxOrder._max.order ?? -1) + 1 },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.vehicle_added",
    entityType: "Collection",
    entityId: collectionId,
    after: { vehicleId },
  });

  return item;
}

export async function removeVehicleFromCollection(
  dealershipId: string,
  actorId: string,
  collectionId: string,
  vehicleId: string,
) {
  const db = forDealership(dealershipId);
  await db.collectionVehicle.deleteMany({ where: { collectionId, vehicleId } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "collection.vehicle_removed",
    entityType: "Collection",
    entityId: collectionId,
    before: { vehicleId },
  });
}

// ============================================================================
// CSV import / export
// ============================================================================

const CSV_COLUMNS = [
  "title",
  "brand",
  "bodyType",
  "year",
  "price",
  "discountPrice",
  "currency",
  "mileage",
  "mileageUnit",
  "fuelType",
  "transmission",
  "driveType",
  "condition",
  "color",
  "seats",
  "doors",
  "engineSizeCc",
  "vin",
  "description",
  "features",
  "status",
] as const;

export async function exportVehiclesCsv(dealershipId: string): Promise<string> {
  const db = forDealership(dealershipId);
  const vehicles = await db.vehicle.findMany({
    where: { dealershipId },
    include: { brand: true, bodyType: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = vehicles.map((v) => ({
    title: v.title,
    brand: v.brand.name,
    bodyType: v.bodyType?.name ?? "",
    year: v.year,
    price: v.price.toString(),
    discountPrice: v.discountPrice?.toString() ?? "",
    currency: v.currency,
    mileage: v.mileage ?? "",
    mileageUnit: v.mileageUnit,
    fuelType: v.fuelType,
    transmission: v.transmission,
    driveType: v.driveType ?? "",
    condition: v.condition,
    color: v.color ?? "",
    seats: v.seats ?? "",
    doors: v.doors ?? "",
    engineSizeCc: v.engineSizeCc ?? "",
    vin: v.vin ?? "",
    description: v.description,
    features: Array.isArray(v.features) ? (v.features as string[]).join("; ") : "",
    status: v.status,
  }));

  return Papa.unparse({ fields: [...CSV_COLUMNS], data: rows });
}

export type CsvImportError = { row: number; message: string };
export type CsvImportReport = { imported: number; errors: CsvImportError[] };

export async function importVehiclesCsv(
  dealershipId: string,
  actorId: string,
  csvText: string,
): Promise<CsvImportReport> {
  const db = forDealership(dealershipId);
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const brands = await db.brand.findMany({ where: { dealershipId } });
  const bodyTypes = await db.bodyType.findMany({ where: { dealershipId } });
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b]));
  const bodyTypeByName = new Map(bodyTypes.map((b) => [b.name.toLowerCase(), b]));

  const errors: CsvImportError[] = [];
  let imported = 0;

  for (let i = 0; i < parsed.data.length; i += 1) {
    const rowNumber = i + 2; // account for header row, 1-indexed
    const raw = parsed.data[i];
    if (!raw) continue;
    const rowResult = csvVehicleRowSchema.safeParse(raw);

    if (!rowResult.success) {
      errors.push({
        row: rowNumber,
        message: rowResult.error.issues[0]?.message ?? "Invalid row.",
      });
      continue;
    }

    const row = rowResult.data;
    const brand = brandByName.get(row.brand.toLowerCase());
    if (!brand) {
      errors.push({ row: rowNumber, message: `Unknown brand "${row.brand}".` });
      continue;
    }
    const bodyType = row.bodyType ? bodyTypeByName.get(row.bodyType.toLowerCase()) : undefined;
    if (row.bodyType && !bodyType) {
      errors.push({ row: rowNumber, message: `Unknown body type "${row.bodyType}".` });
      continue;
    }

    try {
      const slug = await uniqueVehicleSlug(db, dealershipId, row.title, row.year);
      await db.vehicle.create({
        data: {
          dealershipId,
          brandId: brand.id,
          bodyTypeId: bodyType?.id ?? null,
          title: row.title,
          slug,
          year: row.year,
          price: row.price,
          discountPrice: row.discountPrice ?? null,
          currency: row.currency || "UGX",
          mileage: row.mileage ?? null,
          mileageUnit: row.mileageUnit ?? "KM",
          fuelType: row.fuelType,
          transmission: row.transmission,
          driveType: row.driveType ?? null,
          condition: row.condition,
          color: row.color ?? null,
          seats: row.seats ?? null,
          doors: row.doors ?? null,
          engineSizeCc: row.engineSizeCc ?? null,
          vin: row.vin ?? null,
          description: row.description,
          features: row.features
            ? row.features
                .split(";")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          status: row.status ?? "DRAFT",
        },
      });
      imported += 1;
    } catch (err) {
      errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : "Could not save row.",
      });
    }
  }

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "vehicle.csv_imported",
    entityType: "Vehicle",
    after: { imported, errorCount: errors.length },
  });

  return { imported, errors };
}
