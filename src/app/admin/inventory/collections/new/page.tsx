import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { listBrands, listBodyTypes } from "@/features/inventory/service";
import { CollectionForm } from "@/features/inventory/collection-form";

export const metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const [brands, bodyTypes] = await Promise.all([
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/inventory/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to collections
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-ink">New collection</h1>
      </div>

      <CollectionForm brands={brands} bodyTypes={bodyTypes} />
    </div>
  );
}
