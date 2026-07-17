import { Car } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { titleCaseSlug } from "@/lib/utils";

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealerName = titleCaseSlug(dealerSlug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={Car}
        title={`${dealerName}'s storefront is ready`}
        description="Hero, inventory, and collections arrive in Stage 5 once branding (Stage 3) and inventory (Stage 4) exist."
      />
    </main>
  );
}
