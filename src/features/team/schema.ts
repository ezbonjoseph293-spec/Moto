import { z } from "zod";

/**
 * OWNER is unique per dealership (created at onboarding) and PLATFORM_ADMIN/
 * CUSTOMER are never dealership staff — invites can only grant MANAGER or
 * SALES.
 */
export const inviteRoleValues = ["MANAGER", "SALES"] as const;

export const inviteStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(inviteRoleValues),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short.").max(120),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const updateStaffRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(inviteRoleValues),
});
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
