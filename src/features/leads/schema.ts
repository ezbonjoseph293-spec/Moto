import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === undefined ? undefined : v);
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());

export const leadStatusValues = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"] as const;

/** Public contact-form submission (About/Contact pages). */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  phone: optionalString(z.string().trim().max(30)),
  email: optionalString(z.string().trim().email("Enter a valid email address.")),
  message: z.string().trim().min(5, "Add a short message.").max(2000),
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;

/** Public vehicle-inquiry form (vehicle detail page). */
export const vehicleInquirySchema = z.object({
  vehicleId: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short.").max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number.").max(30),
  email: optionalString(z.string().trim().email("Enter a valid email address.")),
  message: optionalString(z.string().trim().max(2000)),
});
export type VehicleInquiryInput = z.infer<typeof vehicleInquirySchema>;

export const leadSourceValues = [
  "VEHICLE_INQUIRY",
  "CONTACT_FORM",
  "DEPOSIT",
  "TRADE_IN",
  "FINANCE_APPLICATION",
  "TEST_DRIVE",
  "NEWSLETTER",
  "OTHER",
] as const;

/** Admin: change a lead's status (New → Contacted → Closed, etc). */
export const updateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(leadStatusValues),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

/** Admin: assign or unassign a lead to a staff member. */
export const assignLeadSchema = z.object({
  leadId: z.string().min(1),
  assignedToId: optionalString(z.string().min(1)),
});
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

/** Admin: add a follow-up note to a lead. */
export const leadNoteSchema = z.object({
  leadId: z.string().min(1),
  note: z.string().trim().min(1, "Add a note.").max(2000),
});
export type LeadNoteInput = z.infer<typeof leadNoteSchema>;
