import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";

import { requireRole } from "@/features/auth/require-role";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getVehicle, listBrands, listBodyTypes } from "@/features/inventory/service";
import { deleteVehicleAction, duplicateVehicleAction } from "@/features/inventory/actions";
import { VehicleForm } from "@/features/inventory/vehicle-form";
import { VehicleStatusControl } from "@/features/inventory/vehicle-status-control";
import { VehicleImageManager } from "@/features/inventory/vehicle-image-manager";
import { VehicleVideoManager } from "@/features/inventory/vehicle-video-manager";
import { VehicleDocumentManager } from "@/features/inventory/vehicle-document-manager";

export const metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["OWNER", "MANAGER", "SALES"]);
  if (!user.dealershipId) throw new Error("This account has no dealership.");

  const { id } = await params;

  const [vehicle, brands, bodyTypes] = await Promise.all([
    getVehicle(user.dealershipId, id).catch(() => null),
    listBrands(user.dealershipId),
    listBodyTypes(user.dealershipId),
  ]);

  if (!vehicle) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to inventory
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-ink">{vehicle.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <form action={duplicateVehicleAction.bind(null, vehicle.id)}>
            <Button type="submit" variant="outline" size="sm">
              <Copy className="size-4" aria-hidden="true" />
              Duplicate
            </Button>
          </form>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes {vehicle.title} and its photos, videos, and documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={deleteVehicleAction.bind(null, vehicle.id)}>
                  <AlertDialogAction type="submit">Delete</AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <VehicleStatusControl vehicleId={vehicle.id} status={vehicle.status} />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Photos</h2>
        <VehicleImageManager vehicleId={vehicle.id} images={vehicle.images} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Video</h2>
        <VehicleVideoManager vehicleId={vehicle.id} videos={vehicle.videos} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Brochures & documents</h2>
        <VehicleDocumentManager vehicleId={vehicle.id} documents={vehicle.documents} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Details</h2>
        <VehicleForm
          vehicle={{
            ...vehicle,
            price: vehicle.price.toString(),
            discountPrice: vehicle.discountPrice?.toString() ?? null,
          }}
          brands={brands}
          bodyTypes={bodyTypes}
        />
      </section>
    </div>
  );
}
