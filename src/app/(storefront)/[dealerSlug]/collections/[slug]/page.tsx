import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Car } from "lucide-react";

import {
  getDealerBySlug,
  getPublicCollectionBySlug,
  getPublicCollectionVehicles,
} from "@/features/storefront/service";
import { VehicleCard } from "@/components/storefront/vehicle-card";
import { EmptyState } from "@/components/ui/empty-state";
import { dealerUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};

  const collection = await getPublicCollectionBySlug(dealer.id, slug);
  if (!collection) return {};

  return {
    title: collection.name,
    description: collection.description ?? undefined,
    alternates: { canonical: dealerUrl(dealerSlug, `/collections/${slug}`) },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ dealerSlug: string; slug: string }>;
}) {
  const { dealerSlug, slug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const collection = await getPublicCollectionBySlug(dealer.id, slug);
  if (!collection) notFound();

  const vehicles = await getPublicCollectionVehicles(dealer.id, collection.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{collection.name}</h1>
      {collection.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{collection.description}</p>
      )}

      <div className="mt-8">
        {vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles in this collection yet"
            description="Check back soon, or browse the full inventory instead."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} dealerSlug={dealerSlug} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
