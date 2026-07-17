import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Fuel, Gauge, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMileage, formatPrice, fuelLabel, transmissionLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export type VehicleCardData = Prisma.VehicleGetPayload<{
  include: { brand: true; bodyType: true; images: { where: { isCover: true }; take: 1 } };
}>;

export function VehicleCard({
  vehicle,
  dealerSlug,
  className,
}: {
  vehicle: VehicleCardData;
  dealerSlug: string;
  className?: string;
}) {
  const cover = vehicle.images[0];

  return (
    <Link
      href={`/${dealerSlug}/inventory/${vehicle.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.altText || vehicle.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No photo yet
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {vehicle.status === "RESERVED" && <Badge variant="reserved">Reserved</Badge>}
          {vehicle.isFeatured && <Badge variant="gold">Featured</Badge>}
        </div>
        {vehicle.discountPrice && (
          <Badge variant="sold" className="absolute top-2 right-2">
            Sale
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {vehicle.brand.name}
          {vehicle.bodyType ? ` · ${vehicle.bodyType.name}` : ""}
        </p>
        <h3 className="font-heading text-base leading-snug font-semibold text-ink">
          {vehicle.year} {vehicle.title}
        </h3>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="size-3.5" aria-hidden="true" />
            {formatMileage(vehicle.mileage, vehicle.mileageUnit)}
          </span>
          <span className="flex items-center gap-1">
            <Fuel className="size-3.5" aria-hidden="true" />
            {fuelLabel(vehicle.fuelType)}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="size-3.5" aria-hidden="true" />
            {transmissionLabel(vehicle.transmission)}
          </span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          {vehicle.discountPrice ? (
            <>
              <span className="font-sans text-lg font-bold tabular-nums text-brand">
                {formatPrice(vehicle.discountPrice.toString(), vehicle.currency)}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground line-through">
                {formatPrice(vehicle.price.toString(), vehicle.currency)}
              </span>
            </>
          ) : (
            <span className="font-sans text-lg font-bold tabular-nums text-ink">
              {formatPrice(vehicle.price.toString(), vehicle.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
