import type { Prisma } from "@prisma/client";

/**
 * Every Prisma model that carries a required `dealershipId` column. The
 * scoped client (scoped-client.ts) auto-filters/stamps these on every query.
 *
 * User, Notification, and AuditLog are deliberately excluded: their
 * dealershipId is nullable (platform admins, platform-wide customer
 * accounts, and platform-level audit entries have none), so they need
 * hand-written scoping rather than a blanket rule.
 */
export const DEALER_OWNED_MODELS = [
  "Subscription",
  "Branch",
  "Brand",
  "BodyType",
  "Vehicle",
  "VehicleImage",
  "VehicleVideo",
  "VehicleDocument",
  "Collection",
  "CollectionVehicle",
  "Reservation",
  "PaymentTransaction",
  "Lead",
  "LeadNote",
  "Testimonial",
  "BlogCategory",
  "BlogPost",
  "Page",
  "Menu",
  "Setting",
  "MediaAsset",
  "Favorite",
  "TradeInRequest",
  "FinanceApplication",
  "Appointment",
  "ServiceBooking",
  "NewsletterSubscriber",
  "Redirect",
  "AnalyticsEvent",
] as const satisfies readonly Prisma.ModelName[];

export type DealerOwnedModel = (typeof DEALER_OWNED_MODELS)[number];

const DEALER_OWNED_MODEL_SET: ReadonlySet<string> = new Set(DEALER_OWNED_MODELS);

export function isDealerOwnedModel(model: string): model is DealerOwnedModel {
  return DEALER_OWNED_MODEL_SET.has(model);
}
