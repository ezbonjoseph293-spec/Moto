"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VehicleStatus } from "@prisma/client";

import { requireRole } from "@/features/auth/require-role";
import * as inventoryService from "./service";
import {
  bodyTypeSchema,
  brandSchema,
  bulkDeleteSchema,
  bulkPricingSchema,
  bulkStatusSchema,
  collectionSchema,
  vehicleSchema,
  vehicleStatusSchema,
} from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

const INVENTORY_STAFF_ROLES = ["OWNER", "MANAGER", "SALES"] as const;
const CATALOG_STAFF_ROLES = ["OWNER", "MANAGER"] as const;

async function requireInventoryStaff() {
  const user = await requireRole(INVENTORY_STAFF_ROLES);
  if (!user.dealershipId) throw new Error("This account has no dealership.");
  return { ...user, dealershipId: user.dealershipId };
}

async function requireCatalogStaff() {
  const user = await requireRole(CATALOG_STAFF_ROLES);
  if (!user.dealershipId) throw new Error("This account has no dealership.");
  return { ...user, dealershipId: user.dealershipId };
}

function revalidateInventory() {
  revalidatePath("/admin/inventory");
  revalidatePath("/[dealerSlug]", "layout");
}

// ============================================================================
// Vehicles
// ============================================================================

export async function createVehicleAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInventoryStaff();
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const vehicle = await inventoryService.createVehicle(user.dealershipId, user.id, parsed.data);
  revalidateInventory();
  redirect(`/admin/inventory/${vehicle.id}`);
}

export async function updateVehicleAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInventoryStaff();
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await inventoryService.updateVehicle(user.dealershipId, user.id, id, parsed.data);
  revalidateInventory();
  revalidatePath(`/admin/inventory/${id}`);

  return { ok: true, message: "Vehicle saved." };
}

export async function duplicateVehicleAction(id: string): Promise<void> {
  const user = await requireInventoryStaff();
  const copy = await inventoryService.duplicateVehicle(user.dealershipId, user.id, id);
  revalidateInventory();
  redirect(`/admin/inventory/${copy.id}`);
}

export async function deleteVehicleAction(id: string): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.deleteVehicle(user.dealershipId, user.id, id);
  revalidateInventory();
}

export async function updateVehicleStatusAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireInventoryStaff();
  const parsed = vehicleStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Invalid status." };
  }

  try {
    await inventoryService.transitionVehicleStatus(
      user.dealershipId,
      user.id,
      id,
      parsed.data.status,
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update status." };
  }

  revalidateInventory();
  revalidatePath(`/admin/inventory/${id}`);
  return { ok: true, message: "Status updated." };
}

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

export type BulkActionState = { ok: boolean; error?: string; message?: string };

export async function bulkUpdateStatusAction(
  vehicleIds: string[],
  status: VehicleStatus,
): Promise<BulkActionState> {
  const user = await requireInventoryStaff();
  const parsed = bulkStatusSchema.safeParse({ vehicleIds, status });
  if (!parsed.success) return { ok: false, error: "Invalid selection." };

  const result = await inventoryService.bulkUpdateStatus(
    user.dealershipId,
    user.id,
    parsed.data.vehicleIds,
    parsed.data.status,
  );
  revalidateInventory();
  return { ok: true, message: `Updated ${result.updated} vehicle(s).` };
}

export async function bulkUpdatePricingAction(
  vehicleIds: string[],
  mode: "set" | "increase_pct" | "decrease_pct",
  amount: number,
): Promise<BulkActionState> {
  const user = await requireCatalogStaff();
  const parsed = bulkPricingSchema.safeParse({ vehicleIds, mode, amount });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const result = await inventoryService.bulkUpdatePricing(
    user.dealershipId,
    user.id,
    parsed.data.vehicleIds,
    parsed.data.mode,
    parsed.data.amount,
  );
  revalidateInventory();
  return { ok: true, message: `Repriced ${result.updated} vehicle(s).` };
}

export async function bulkDeleteVehiclesAction(vehicleIds: string[]): Promise<BulkActionState> {
  const user = await requireCatalogStaff();
  const parsed = bulkDeleteSchema.safeParse({ vehicleIds });
  if (!parsed.success) return { ok: false, error: "Invalid selection." };

  const result = await inventoryService.bulkDeleteVehicles(
    user.dealershipId,
    user.id,
    parsed.data.vehicleIds,
  );
  revalidateInventory();
  return { ok: true, message: `Deleted ${result.deleted} vehicle(s).` };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export async function exportVehiclesCsvAction(): Promise<string> {
  const user = await requireCatalogStaff();
  return inventoryService.exportVehiclesCsv(user.dealershipId);
}

export async function importVehiclesCsvAction(
  csvText: string,
): Promise<inventoryService.CsvImportReport> {
  const user = await requireCatalogStaff();
  const report = await inventoryService.importVehiclesCsv(user.dealershipId, user.id, csvText);
  revalidateInventory();
  return report;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function addVehicleImageAction(
  vehicleId: string,
  input: { url: string; publicId: string; altText?: string },
): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.addVehicleImage(user.dealershipId, user.id, vehicleId, input);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function reorderVehicleImagesAction(
  vehicleId: string,
  orderedIds: string[],
): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.reorderVehicleImages(user.dealershipId, user.id, vehicleId, orderedIds);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function setCoverImageAction(vehicleId: string, imageId: string): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.setCoverImage(user.dealershipId, user.id, vehicleId, imageId);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function deleteVehicleImageAction(vehicleId: string, imageId: string): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.deleteVehicleImage(user.dealershipId, user.id, imageId);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function addVehicleVideoAction(vehicleId: string, url: string): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.addVehicleVideo(user.dealershipId, user.id, vehicleId, url);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function deleteVehicleVideoAction(vehicleId: string, videoId: string): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.deleteVehicleVideo(user.dealershipId, user.id, videoId);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function addVehicleDocumentAction(
  vehicleId: string,
  input: { url: string; label: string },
): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.addVehicleDocument(user.dealershipId, user.id, vehicleId, input);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

export async function deleteVehicleDocumentAction(
  vehicleId: string,
  documentId: string,
): Promise<void> {
  const user = await requireInventoryStaff();
  await inventoryService.deleteVehicleDocument(user.dealershipId, user.id, documentId);
  revalidatePath(`/admin/inventory/${vehicleId}`);
}

// ============================================================================
// Brands
// ============================================================================

export async function createBrandAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await inventoryService.createBrand(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/inventory/brands");
  return { ok: true, message: "Brand added." };
}

export async function updateBrandAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await inventoryService.updateBrand(user.dealershipId, user.id, id, parsed.data);
  revalidatePath("/admin/inventory/brands");
  return { ok: true, message: "Brand updated." };
}

export async function deleteBrandAction(id: string): Promise<FormState> {
  const user = await requireCatalogStaff();
  try {
    await inventoryService.deleteBrand(user.dealershipId, user.id, id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete brand." };
  }
  revalidatePath("/admin/inventory/brands");
  return { ok: true };
}

export async function moveBrandAction(id: string, direction: "up" | "down"): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.moveBrand(user.dealershipId, user.id, id, direction);
  revalidatePath("/admin/inventory/brands");
}

// ============================================================================
// Body types
// ============================================================================

export async function createBodyTypeAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = bodyTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await inventoryService.createBodyType(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/inventory/body-types");
  return { ok: true, message: "Body type added." };
}

export async function updateBodyTypeAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = bodyTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await inventoryService.updateBodyType(user.dealershipId, user.id, id, parsed.data);
  revalidatePath("/admin/inventory/body-types");
  return { ok: true, message: "Body type updated." };
}

export async function deleteBodyTypeAction(id: string): Promise<FormState> {
  const user = await requireCatalogStaff();
  try {
    await inventoryService.deleteBodyType(user.dealershipId, user.id, id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete body type." };
  }
  revalidatePath("/admin/inventory/body-types");
  return { ok: true };
}

export async function moveBodyTypeAction(id: string, direction: "up" | "down"): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.moveBodyType(user.dealershipId, user.id, id, direction);
  revalidatePath("/admin/inventory/body-types");
}

// ============================================================================
// Collections
// ============================================================================

export async function createCollectionAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const collection = await inventoryService.createCollection(
    user.dealershipId,
    user.id,
    parsed.data,
  );
  revalidatePath("/admin/inventory/collections");
  redirect(`/admin/inventory/collections/${collection.id}`);
}

export async function updateCollectionAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCatalogStaff();
  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await inventoryService.updateCollection(user.dealershipId, user.id, id, parsed.data);
  revalidatePath("/admin/inventory/collections");
  revalidatePath(`/admin/inventory/collections/${id}`);
  return { ok: true, message: "Collection saved." };
}

export async function deleteCollectionAction(id: string): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.deleteCollection(user.dealershipId, user.id, id);
  revalidatePath("/admin/inventory/collections");
}

export async function moveCollectionAction(id: string, direction: "up" | "down"): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.moveCollection(user.dealershipId, user.id, id, direction);
  revalidatePath("/admin/inventory/collections");
}

export async function addVehicleToCollectionAction(
  collectionId: string,
  vehicleId: string,
): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.addVehicleToCollection(
    user.dealershipId,
    user.id,
    collectionId,
    vehicleId,
  );
  revalidatePath(`/admin/inventory/collections/${collectionId}`);
}

export async function removeVehicleFromCollectionAction(
  collectionId: string,
  vehicleId: string,
): Promise<void> {
  const user = await requireCatalogStaff();
  await inventoryService.removeVehicleFromCollection(
    user.dealershipId,
    user.id,
    collectionId,
    vehicleId,
  );
  revalidatePath(`/admin/inventory/collections/${collectionId}`);
}
