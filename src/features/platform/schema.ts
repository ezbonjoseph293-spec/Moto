import { z } from "zod";

export const dealerStatusFilterValues = ["ACTIVE", "TRIAL_EXPIRED", "SUSPENDED", "CANCELLED"] as const;

export const extendTrialSchema = z.object({
  dealershipId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365),
});
export type ExtendTrialInput = z.infer<typeof extendTrialSchema>;

export const suspendDealerSchema = z.object({
  dealershipId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});
export type SuspendDealerInput = z.infer<typeof suspendDealerSchema>;

export const reactivateDealerSchema = z.object({
  dealershipId: z.string().min(1),
});
export type ReactivateDealerInput = z.infer<typeof reactivateDealerSchema>;

export const changeDealerPlanSchema = z.object({
  dealershipId: z.string().min(1),
  planId: z.string().min(1),
});
export type ChangeDealerPlanInput = z.infer<typeof changeDealerPlanSchema>;

export const impersonateUserSchema = z.object({
  targetUserId: z.string().min(1),
});
export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>;
