"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Brand } from "@prisma/client";
import { ArrowDown, ArrowUp, Building2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { deleteBrandAction, moveBrandAction } from "./actions";
import { BrandFormDialog } from "./brand-form-dialog";

type BrandRow = Brand & { _count: { vehicles: number } };

export function BrandManager({ brands }: { brands: BrandRow[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-ink">Brands</h2>
        <BrandFormDialog />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {brands.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No brands yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {brands.map((brand, index) => (
            <li
              key={brand.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 object-contain"
                    />
                  ) : (
                    <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {brand._count.vehicles} vehicle(s)
                    {brand.isFeatured && (
                      <>
                        {" "}
                        · <Badge variant="gold">Featured</Badge>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => startTransition(() => void moveBrandAction(brand.id, "up"))}
                  aria-label={`Move ${brand.name} up`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === brands.length - 1}
                  onClick={() => startTransition(() => void moveBrandAction(brand.id, "down"))}
                  aria-label={`Move ${brand.name} down`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <BrandFormDialog brand={brand} />
                <ConfirmActionButton
                  title={`Delete ${brand.name}?`}
                  description={
                    brand._count.vehicles > 0
                      ? `${brand._count.vehicles} vehicle(s) currently use this brand. This cannot be undone.`
                      : "This cannot be undone."
                  }
                  confirmLabel="Delete"
                  onConfirm={() =>
                    startTransition(async () => {
                      const result = await deleteBrandAction(brand.id);
                      if (!result.ok) setError(result.error ?? "Could not delete brand.");
                      else setError(null);
                    })
                  }
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Delete ${brand.name}`}
                    >
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
