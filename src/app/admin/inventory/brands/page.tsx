import { requireRole } from "@/features/auth/require-role";
import { listBrands, listBodyTypes } from "@/features/inventory/service";
import { InventorySubNav } from "@/features/inventory/inventory-sub-nav";
import { BrandManager } from "@/features/inventory/brand-manager";
import { BodyTypeManager } from "@/features/inventory/body-type-manager";

export const metadata = { title: "Brands & body types" };

export default async function BrandsPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const [brands, bodyTypes] = await Promise.all([
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Brands and body types used across your listings.
        </p>
      </div>

      <InventorySubNav />

      <div className="grid gap-8 lg:grid-cols-2">
        <BrandManager brands={brands} />
        <BodyTypeManager bodyTypes={bodyTypes} />
      </div>
    </div>
  );
}
