import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === undefined ? undefined : v);
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());

export const reservationStatusValues = [
  "PENDING_PAYMENT",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
  "REFUND_PENDING",
  "REFUNDED",
  "DISPUTED",
] as const;

/** Buyer-facing reserve form on the vehicle detail / /reserve page. */
export const reserveVehicleSchema = z.object({
  vehicleId: z.string().min(1),
  buyerName: z.string().trim().min(2, "Enter your full name.").max(120),
  buyerPhone: z.string().trim().min(6, "Enter a valid phone number.").max(30),
  buyerEmail: optionalString(z.string().trim().email("Enter a valid email address.")),
});
export type ReserveVehicleInput = z.infer<typeof reserveVehicleSchema>;

/** Admin "mark refunded" / dispute-note actions on a reservation. */
export const reservationNoteSchema = z.object({
  reservationId: z.string().min(1),
  notes: optionalString(z.string().trim().max(2000)),
});
export type ReservationNoteInput = z.infer<typeof reservationNoteSchema>;

/** Dealer-facing "pay now" / "change plan and pay" form on /admin/billing. */
export const initiateSubscriptionPaymentSchema = z.object({
  planId: z.string().min(1),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]),
});
export type InitiateSubscriptionPaymentInput = z.infer<typeof initiateSubscriptionPaymentSchema>;
