import type { Lead, LeadSource, LeadStatus, Prisma } from "@prisma/client";
import { forDealership } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { sendSms } from "@/lib/sms";
import type {
  AssignLeadInput,
  ContactFormInput,
  LeadNoteInput,
  UpdateLeadStatusInput,
  VehicleInquiryInput,
} from "./schema";

const STAFF_ROLES = ["OWNER", "MANAGER", "SALES"] as const;

/**
 * Best-effort — a notification failure must never break lead creation, so
 * every I/O call here is wrapped and errors are swallowed after logging via
 * sendEmail/sendSms's own internal try/catch.
 */
async function notifyDealerOfNewLead(dealershipId: string, lead: Lead) {
  const db = forDealership(dealershipId);
  const setting = await db.setting.findUnique({ where: { dealershipId } });

  await db.notification.create({
    data: {
      dealershipId,
      type: "NEW_LEAD",
      title: "New lead",
      message: `${lead.name} — ${lead.source.replace(/_/g, " ").toLowerCase()}${lead.message ? `: ${lead.message}` : ""}`,
      link: `/admin/leads/${lead.id}`,
    },
  });

  if (!setting) return;

  if (setting.notifyNewLeadEmail && setting.email) {
    await sendEmail({
      to: setting.email,
      subject: `New lead: ${lead.name}`,
      html: `<p>New lead from <strong>${lead.source.replace(/_/g, " ").toLowerCase()}</strong>.</p>
<p><strong>Name:</strong> ${lead.name}<br/>${lead.phone ? `<strong>Phone:</strong> ${lead.phone}<br/>` : ""}${lead.email ? `<strong>Email:</strong> ${lead.email}<br/>` : ""}</p>
${lead.message ? `<p>${lead.message}</p>` : ""}`,
    });
  }

  if (setting.notifyNewLeadSms && setting.phonePrimary) {
    await sendSms({
      to: setting.phonePrimary,
      message: `New lead: ${lead.name}${lead.phone ? ` (${lead.phone})` : ""} via ${lead.source.replace(/_/g, " ").toLowerCase()}.`,
    });
  }
}

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

  await notifyDealerOfNewLead(dealershipId, lead);

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

  await notifyDealerOfNewLead(dealershipId, lead);

  return lead;
}

// ============================================================================
// Admin inbox
// ============================================================================

export type LeadListFilters = {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToId?: string;
  page?: number;
  pageSize?: number;
};

export async function listLeads(dealershipId: string, filters: LeadListFilters = {}) {
  const db = forDealership(dealershipId);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.LeadWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.assignedToId
      ? filters.assignedToId === "unassigned"
        ? { assignedToId: null }
        : { assignedToId: filters.assignedToId }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vehicle: { select: { id: true, title: true, slug: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { notes: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return { leads, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getLead(dealershipId: string, id: string) {
  const db = forDealership(dealershipId);
  return db.lead.findUnique({
    where: { id },
    include: {
      vehicle: { select: { id: true, title: true, slug: true, year: true } },
      assignedTo: { select: { id: true, name: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
}

/** Staff eligible to be assigned a lead — active OWNER/MANAGER/SALES for this dealership. */
export async function listAssignableStaff(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.user.findMany({
    where: { dealershipId, role: { in: [...STAFF_ROLES] }, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function updateLeadStatus(
  dealershipId: string,
  actorId: string,
  input: UpdateLeadStatusInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.lead.findUniqueOrThrow({ where: { id: input.leadId } });

  const lead = await db.lead.update({
    where: { id: input.leadId },
    data: { status: input.status },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "lead.status_updated",
    entityType: "Lead",
    entityId: lead.id,
    before: { status: before.status },
    after: { status: lead.status },
  });

  return lead;
}

export async function assignLead(dealershipId: string, actorId: string, input: AssignLeadInput) {
  const db = forDealership(dealershipId);
  const before = await db.lead.findUniqueOrThrow({ where: { id: input.leadId } });

  const lead = await db.lead.update({
    where: { id: input.leadId },
    data: { assignedToId: input.assignedToId ?? null },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "lead.assigned",
    entityType: "Lead",
    entityId: lead.id,
    before: { assignedToId: before.assignedToId },
    after: { assignedToId: lead.assignedToId },
  });

  return lead;
}

export async function addLeadNote(dealershipId: string, actorId: string, input: LeadNoteInput) {
  const db = forDealership(dealershipId);
  const note = await db.leadNote.create({
    data: {
      dealershipId,
      leadId: input.leadId,
      authorId: actorId,
      note: input.note,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "lead.note_added",
    entityType: "Lead",
    entityId: input.leadId,
    after: { note: input.note },
  });

  return note;
}
