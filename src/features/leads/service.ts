import { forDealership } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import type { ContactFormInput, VehicleInquiryInput } from "./schema";

export async function createContactLead(dealershipId: string, input: ContactFormInput) {
  const db = forDealership(dealershipId);
  const lead = await db.lead.create({
    data: {
      dealershipId,
      source: "CONTACT_FORM",
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      message: input.message,
    },
  });

  await recordAuditLog({
    dealershipId,
    action: "lead.created",
    entityType: "Lead",
    entityId: lead.id,
    after: { source: lead.source },
  });

  return lead;
}

export async function createVehicleInquiryLead(dealershipId: string, input: VehicleInquiryInput) {
  const db = forDealership(dealershipId);
  const lead = await db.lead.create({
    data: {
      dealershipId,
      source: "VEHICLE_INQUIRY",
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      message: input.message ?? null,
      vehicleId: input.vehicleId,
    },
  });

  await recordAuditLog({
    dealershipId,
    action: "lead.created",
    entityType: "Lead",
    entityId: lead.id,
    after: { source: lead.source, vehicleId: input.vehicleId },
  });

  return lead;
}
