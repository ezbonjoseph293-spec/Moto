import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car } from "lucide-react";
import Image from "next/image";

import { requireRole } from "@/features/auth/require-role";
import {
  getCollection,
  getCollectionVehicles,
  listBodyTypes,
  listBrands,
  listVehicles,
} from "@/features/inventory/service";
import { CollectionForm } from "@/features/inventory/collection-form";
import { CollectionMembershipManager } from "@/features/inventory/collection-membership-manager";

export const metadata = { title: "Edit collection" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const { id } = await params;

  const [collection, brands, bodyTypes] = await Promise.all([
    getCollection(user.dealershipId, id).catch(() => null),
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  if (!collection) notFound();

  const memberVehicles = await getCollectionVehicles(user.dealershipId, id);

  const candidates =
    collection.ruleType === "MANUAL"
      ? (await listVehicles(user.dealershipId, { pageSize: 100 })).vehicles.map((v) => ({
          id: v.id,
          title: v.title,
        }))
      : [];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/inventory/collections"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to collections
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-ink">{collection.name}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">
          {collection.ruleType === "MANUAL"
            ? "Vehicles in this collection"
            : "Vehicles currently matching the rules"}
        </h2>
        {collection.ruleType === "MANUAL" ? (
          <CollectionMembershipManager
            collectionId={collection.id}
            members={memberVehicles.map((v) => ({
              id: v.id,
              title: v.title,
              brand: { name: v.brand.name },
              images: v.images.map((img) => ({ url: img.url })),
            }))}
            candidates={candidates}
          />
        ) : memberVehicles.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No vehicles currently match these rules.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {memberVehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {v.images[0] ? (
                    <Image
                      src={v.images[0].url}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      className="size-9 object-cover"
                    />
                  ) : (
                    <Car className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{v.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.brand.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Collection details</h2>
        <CollectionForm collection={collection} brands={brands} bodyTypes={bodyTypes} />
      </section>
    </div>
  );
}
