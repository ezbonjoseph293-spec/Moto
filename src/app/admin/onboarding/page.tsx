import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";
import { getSettings } from "@/features/settings/service";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { getEnv } from "@/lib/env";

export const metadata = { title: "Finish setting up your dealership" };

export default async function AdminOnboardingPage() {
  const user = await requireRole(["OWNER"]);
  if (!user.dealershipId) {
    throw new Error("This account has no dealership.");
  }

  const dealership = await forPlatform().dealership.findUniqueOrThrow({
    where: { id: user.dealershipId },
  });

  if (dealership.onboardingCompletedAt) {
    redirect("/admin");
  }

  const setting = await getSettings(user.dealershipId);
  const storefrontUrl = `${getEnv().NEXT_PUBLIC_APP_URL}/${dealership.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s get {dealership.name} ready to go live — this takes about 10 minutes.
        </p>
      </div>

      <OnboardingWizard setting={setting} storefrontUrl={storefrontUrl} dealershipName={dealership.name} />
    </div>
  );
}
