import Link from "next/link";
import { Plus } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { Button } from "@/components/ui/button";
import { listCollections } from "@/features/inventory/service";
import { InventorySubNav } from "@/features/inventory/inventory-sub-nav";
import { CollectionList } from "@/features/inventory/collection-list";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const collections = await listCollections(user.dealershipId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Curated groups of vehicles for your storefront.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/inventory/collections/new">
            <Plus className="size-4" aria-hidden="true" />
            New collection
          </Link>
        </Button>
      </div>

      <InventorySubNav />

      <CollectionList collections={collections} />
    </div>
  );
}
