import { Car } from "lucide-react";

import { forPlatform } from "@/features/tenancy";

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const setting = await forPlatform().setting.findFirst({
    where: { dealership: { slug: dealerSlug } },
  });

  const dealerName = setting?.businessName || dealerSlug;

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Car className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          {dealerName}&apos;s storefront is ready
        </h1>
        {setting?.tagline && (
          <p className="mt-2 max-w-md text-muted-foreground">{setting.tagline}</p>
        )}
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          Inventory, collections, and the reservation flow arrive in Stages 4–6. Branding and
          contact details set in the dashboard already appear in the header and footer above.
        </p>
      </div>
    </main>
  );
}
