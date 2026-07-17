import { forDealership } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import type {
  AnnouncementInput,
  ContactInput,
  DepositInput,
  IdentityInput,
  MenuItemInput,
} from "./schema";

export async function getSettings(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.setting.findUniqueOrThrow({ where: { dealershipId } });
}

export async function updateIdentity(
  dealershipId: string,
  actorId: string,
  input: IdentityInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.setting.findUniqueOrThrow({ where: { dealershipId } });

  const setting = await db.setting.update({
    where: { dealershipId },
    data: {
      businessName: input.businessName,
      tagline: input.tagline ?? null,
      logoLightUrl: input.logoLightUrl ?? null,
      logoDarkUrl: input.logoDarkUrl ?? null,
      faviconUrl: input.faviconUrl ?? null,
      brandColor: input.brandColor,
      fontChoice: input.fontChoice,
      borderRadius: input.borderRadius,
      buttonStyle: input.buttonStyle,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.identity.updated",
    entityType: "Setting",
    entityId: setting.id,
    before,
    after: setting,
  });

  return setting;
}

export async function updateContact(dealershipId: string, actorId: string, input: ContactInput) {
  const db = forDealership(dealershipId);
  const before = await db.setting.findUniqueOrThrow({ where: { dealershipId } });

  const setting = await db.setting.update({
    where: { dealershipId },
    data: {
      phonePrimary: input.phonePrimary ?? null,
      phoneSecondary: input.phoneSecondary ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      businessHours: { mon_fri: input.hoursMonFri, sat: input.hoursSat, sun: input.hoursSun },
      socialLinks: {
        facebook: input.socialFacebook ?? "",
        instagram: input.socialInstagram ?? "",
        twitter: input.socialTwitter ?? "",
        tiktok: input.socialTiktok ?? "",
      },
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.contact.updated",
    entityType: "Setting",
    entityId: setting.id,
    before,
    after: setting,
  });

  return setting;
}

export async function updateDeposit(dealershipId: string, actorId: string, input: DepositInput) {
  const db = forDealership(dealershipId);
  const before = await db.setting.findUniqueOrThrow({ where: { dealershipId } });

  const setting = await db.setting.update({
    where: { dealershipId },
    data: {
      depositType: input.depositType,
      depositFixedAmount: input.depositType === "FIXED" ? input.depositFixedAmount : null,
      depositPercentage: input.depositType === "PERCENTAGE" ? input.depositPercentage : null,
      depositHoldHours: input.depositHoldHours,
      refundPolicyText: input.refundPolicyText ?? null,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.deposit.updated",
    entityType: "Setting",
    entityId: setting.id,
    before,
    after: setting,
  });

  return setting;
}

export async function updateAnnouncement(
  dealershipId: string,
  actorId: string,
  input: AnnouncementInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.setting.findUniqueOrThrow({ where: { dealershipId } });

  const setting = await db.setting.update({
    where: { dealershipId },
    data: {
      announcementBarText: input.announcementBarText ?? null,
      announcementBarActive: input.announcementBarActive,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.announcement.updated",
    entityType: "Setting",
    entityId: setting.id,
    before,
    after: setting,
  });

  return setting;
}

export async function listMenuItems(dealershipId: string) {
  const db = forDealership(dealershipId);
  const items = await db.menu.findMany({ where: { dealershipId }, orderBy: { order: "asc" } });
  return {
    header: items.filter((m) => m.location === "HEADER"),
    footer: items.filter((m) => m.location === "FOOTER"),
  };
}

export async function createMenuItem(
  dealershipId: string,
  actorId: string,
  input: MenuItemInput,
) {
  const db = forDealership(dealershipId);
  const maxOrder = await db.menu.aggregate({
    where: { dealershipId, location: input.location },
    _max: { order: true },
  });

  const item = await db.menu.create({
    data: {
      dealershipId,
      location: input.location,
      label: input.label,
      url: input.url,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.menu.created",
    entityType: "Menu",
    entityId: item.id,
    after: item,
  });

  return item;
}

export async function updateMenuItem(
  dealershipId: string,
  actorId: string,
  id: string,
  input: MenuItemInput,
) {
  const db = forDealership(dealershipId);
  const before = await db.menu.findUniqueOrThrow({ where: { id } });

  const item = await db.menu.update({
    where: { id },
    data: { location: input.location, label: input.label, url: input.url },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.menu.updated",
    entityType: "Menu",
    entityId: item.id,
    before,
    after: item,
  });

  return item;
}

export async function deleteMenuItem(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const before = await db.menu.findUniqueOrThrow({ where: { id } });

  await db.menu.delete({ where: { id } });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.menu.deleted",
    entityType: "Menu",
    entityId: id,
    before,
  });
}

/** Swaps `order` with the adjacent item in the same location so the list re-sorts. */
export async function moveMenuItem(
  dealershipId: string,
  actorId: string,
  id: string,
  direction: "up" | "down",
) {
  const db = forDealership(dealershipId);
  const item = await db.menu.findUniqueOrThrow({ where: { id } });

  const neighbor = await db.menu.findFirst({
    where: {
      dealershipId,
      location: item.location,
      order: direction === "up" ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) return item;

  await db.$transaction([
    db.menu.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    db.menu.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "settings.menu.reordered",
    entityType: "Menu",
    entityId: item.id,
  });

  return item;
}
