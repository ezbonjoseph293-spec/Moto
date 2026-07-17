import { z } from "zod";

export const startOnboardingSchema = z.object({
  dealershipName: z.string().trim().min(2, "Dealership name is too short.").max(120),
  ownerName: z.string().trim().min(2, "Name is too short.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});
export type StartOnboardingInput = z.infer<typeof startOnboardingSchema>;
