import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { VehicleCondition, FuelType, TransmissionType } from "@prisma/client";

import {
  getDealerBySlug,
  listPublicBodyTypes,
  listPublicBrands,
  listPublicVehicles,
} from "@/features/storefront/service";
import { VehicleCard } from "@/components/storefront/vehicle-card";
import { InventoryFilters } from "@/components/storefront/inventory-filters";
import { InventorySort } from "@/components/storefront/inventory-sort";
import { StorefrontPagination } from "@/components/storefront/storefront-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Car } from "lucide-react";
import { dealerUrl } from "@/lib/seo";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) return {};
  const name = dealer.setting?.businessName || dealer.name;

  return {
    title: "Inventory",
    description: `Browse the full vehicle inventory at ${name}.`,
    alternates: { canonical: dealerUrl(dealerSlug, "/inventory") },
  };
}

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealerSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { dealerSlug } = await params;
  const sp = await searchParams;
  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer) notFound();

  const filters = {
    search: str(sp.search),
    brandId: str(sp.brandId),
    bodyTypeId: str(sp.bodyTypeId),
    condition: str(sp.condition) as VehicleCondition | undefined,
    fuelType: str(sp.fuelType) as FuelType | undefined,
    transmission: str(sp.transmission) as TransmissionType | undefined,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minYear: num(sp.minYear),
    maxYear: num(sp.maxYear),
    page: num(sp.page),
    sort: str(sp.sort) as
      | "newest"
      | "price_asc"
      | "price_desc"
      | "year_desc"
      | "mileage_asc"
      | undefined,
  };

  const [{ vehicles, total, page, totalPages }, brands, bodyTypes] = await Promise.all([
    listPublicVehicles(dealer.id, filters),
    listPublicBrands(dealer.id),
    listPublicBodyTypes(dealer.id),
  ]);

  const flatSearchParams = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  ) as Record<string, string | undefined>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "vehicle" : "vehicles"} available
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <InventoryFilters brands={brands} bodyTypes={bodyTypes} />

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-end">
            <InventorySort />
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No vehicles match your filters"
              description="Try widening your search or clearing some filters."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  dealerSlug={dealerSlug}
                  priority={index < 2}
                />
              ))}
            </div>
          )}

          <div className="mt-10">
            <StorefrontPagination
              pathname={`/${dealerSlug}/inventory`}
              searchParams={flatSearchParams}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
