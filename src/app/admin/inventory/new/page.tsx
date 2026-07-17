import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { listBrands, listBodyTypes } from "@/features/inventory/service";
import { VehicleForm } from "@/features/inventory/vehicle-form";

export const metadata = { title: "Add vehicle" };

export default async function NewVehiclePage() {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const [brands, bodyTypes] = await Promise.all([
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to inventory
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-ink">Add vehicle</h1>
        <p className="text-sm text-muted-foreground">
          Saved as a draft first — add photos, then publish when ready.
        </p>
      </div>

      {brands.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Add at least one brand before creating a vehicle.{" "}
          <Link href="/admin/inventory/brands" className="text-primary underline">
            Manage brands
          </Link>
          .
        </p>
      ) : (
        <VehicleForm brands={brands} bodyTypes={bodyTypes} />
      )}
    </div>
  );
}
