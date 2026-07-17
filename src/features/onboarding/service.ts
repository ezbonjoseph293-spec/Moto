import { hash } from "bcryptjs";
import { forPlatform } from "@/features/tenancy";
import { generateUniqueDealerSlug } from "@/lib/slug";
import { recordAuditLog } from "@/lib/audit";
import { sendVerificationEmail } from "@/features/auth/service";
import type { StartOnboardingInput } from "./schema";

export type CreateDealershipResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Bootstraps a brand-new dealership: Dealership + a default Setting row +
 * an OWNER user, all in one transaction, then sends the same email
 * verification flow customer signup uses. This is the only place outside
 * `forPlatform()`'s documented escape hatch where a dealershipId doesn't
 * exist yet — everything after this point goes through `forDealership()`.
 */
export async function createDealership(input: StartOnboardingInput): Promise<CreateDealershipResult> {
  const db = forPlatform();
  const email = input.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Don't reveal whether the email is already registered.
    return { ok: true };
  }

  const slug = await generateUniqueDealerSlug(input.dealershipName);
  const passwordHash = await hash(input.password, 12);

  const { dealership, user } = await db.$transaction(async (tx) => {
    const dealership = await tx.dealership.create({
      data: { name: input.dealershipName, slug },
    });

    await tx.setting.create({
      data: {
        dealershipId: dealership.id,
        businessName: input.dealershipName,
        depositType: "PERCENTAGE",
        depositPercentage: 10,
        depositHoldHours: 48,
        refundPolicyText:
          "Deposits are fully refundable if the vehicle fails inspection or the hold period expires before you complete the purchase.",
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.ownerName,
        email,
        passwordHash,
        role: "OWNER",
        dealershipId: dealership.id,
      },
    });

    return { dealership, user };
  });

  await sendVerificationEmail(user.id, user.email);
  await recordAuditLog({
    dealershipId: dealership.id,
    actorId: user.id,
    action: "dealership.created",
    entityType: "Dealership",
    entityId: dealership.id,
  });

  return { ok: true };
}

export async function completeOnboarding(dealershipId: string, actorId: string): Promise<void> {
  const db = forPlatform();
  await db.dealership.update({
    where: { id: dealershipId },
    data: { onboardingCompletedAt: new Date() },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "dealership.onboarding_completed",
    entityType: "Dealership",
    entityId: dealershipId,
  });
}
