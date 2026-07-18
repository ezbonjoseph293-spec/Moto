import Link from "next/link";
import { Plus } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { Button } from "@/components/ui/button";
import { listBrands, listBodyTypes, listVehicles } from "@/features/inventory/service";
import { InventorySubNav } from "@/features/inventory/inventory-sub-nav";
import { VehicleFilters } from "@/features/inventory/vehicle-filters";
import { VehicleTable } from "@/features/inventory/vehicle-table";
import { VehiclePagination } from "@/features/inventory/vehicle-pagination";
import { CsvTools } from "@/features/inventory/csv-tools";

export const metadata = { title: "Inventory" };

type SearchParams = Record<string, string | undefined>;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;

  const [{ vehicles, totalPages }, brands, bodyTypes] = await Promise.all([
    listVehicles(user.dealershipId, {
      search: sp.search,
      status: sp.status as never,
      brandId: sp.brandId,
      bodyTypeId: sp.bodyTypeId,
      sort: sp.sort as never,
      page,
    }),
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage your vehicle listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvTools />
          <Button asChild size="sm">
            <Link href="/admin/inventory/new">
              <Plus className="size-4" aria-hidden="true" />
              Add vehicle
            </Link>
          </Button>
        </div>
      </div>

      <InventorySubNav />

      <VehicleFilters brands={brands} bodyTypes={bodyTypes} />

      <VehicleTable
        vehicles={vehicles.map((v) => ({
          ...v,
          price: v.price.toString(),
          discountPrice: v.discountPrice?.toString() ?? null,
        }))}
      />

      <VehiclePagination page={page} totalPages={totalPages} searchParams={sp} />
    </div>
  );
}
