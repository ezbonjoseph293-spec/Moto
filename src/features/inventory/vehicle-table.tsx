"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VehicleStatus } from "@prisma/client";
import { Car, Copy, MoreHorizontal, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { listVehicles } from "./service";
import {
  bulkDeleteVehiclesAction,
  bulkUpdateStatusAction,
  deleteVehicleAction,
  duplicateVehicleAction,
  updateVehicleStatusAction,
} from "./actions";
import { VEHICLE_STATUS_TRANSITIONS } from "./schema";
import { BulkPricingDialog } from "./bulk-pricing-dialog";

/**
 * `price`/`discountPrice` come back from Prisma as `Decimal` instances,
 * which Next.js refuses to pass across the Server -> Client Component
 * boundary ("Only plain objects... Decimal objects are not supported").
 * The page serializes them to strings before handing vehicles to this
 * client component — this type reflects that post-serialization shape.
 */
type VehicleRow = Omit<
  Awaited<ReturnType<typeof listVehicles>>["vehicles"][number],
  "price" | "discountPrice"
> & { price: string; discountPrice: string | null };

const STATUS_VARIANT: Record<string, "available" | "reserved" | "sold" | "outline"> = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
  DRAFT: "outline",
  ARCHIVED: "outline",
  HIDDEN: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  ARCHIVED: "Archived",
  HIDDEN: "Hidden",
};

function formatPrice(price: string, currency: string) {
  const n = Number(price);
  return `${currency} ${n.toLocaleString()}`;
}

export function VehicleTable({ vehicles }: { vehicles: VehicleRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const router = useRouter();

  const allSelected = vehicles.length > 0 && selected.size === vehicles.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(vehicles.map((v) => v.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulkStatus(status: VehicleStatus) {
    startTransition(async () => {
      await bulkUpdateStatusAction(Array.from(selected), status);
      setSelected(new Set());
      router.refresh();
    });
  }

  function runBulkDelete() {
    startTransition(async () => {
      await bulkDeleteVehiclesAction(Array.from(selected));
      setSelected(new Set());
      router.refresh();
    });
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-16 text-center">
        <Car className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No vehicles match these filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => runBulkStatus("AVAILABLE")}
          >
            Mark available
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => runBulkStatus("SOLD")}
          >
            Mark sold
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => runBulkStatus("ARCHIVED")}
          >
            Archive
          </Button>
          <BulkPricingDialog
            vehicleIds={Array.from(selected)}
            onDone={() => {
              setSelected(new Set());
              router.refresh();
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                className="text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.size} vehicle(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the selected vehicles and their media. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={runBulkDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => {
              const cover = vehicle.images[0];
              const allowedNext = VEHICLE_STATUS_TRANSITIONS[vehicle.status] ?? [];

              return (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(vehicle.id)}
                      onCheckedChange={() => toggleOne(vehicle.id)}
                      aria-label={`Select ${vehicle.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/inventory/${vehicle.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className="size-12 object-cover"
                          />
                        ) : (
                          <Car className="size-5 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{vehicle.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {vehicle.brand.name}
                          {vehicle.bodyType ? ` · ${vehicle.bodyType.name}` : ""}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[vehicle.status]}>
                      {STATUS_LABELS[vehicle.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatPrice(vehicle.price, vehicle.currency)}
                  </TableCell>
                  <TableCell className="text-sm">{vehicle.year}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/inventory/${vehicle.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => startTransition(() => duplicateVehicleAction(vehicle.id))}
                        >
                          <Copy className="size-4" aria-hidden="true" />
                          Duplicate
                        </DropdownMenuItem>
                        {allowedNext.length > 0 && <DropdownMenuSeparator />}
                        {allowedNext
                          .filter((s) => s !== "RESERVED")
                          .map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() =>
                                startTransition(async () => {
                                  const formData = new FormData();
                                  formData.set("status", status);
                                  await updateVehicleStatusAction(
                                    vehicle.id,
                                    { ok: false },
                                    formData,
                                  );
                                  router.refresh();
                                })
                              }
                            >
                              Move to {STATUS_LABELS[status]}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDeleteTarget({ id: vehicle.id, title: vehicle.title });
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this vehicle and its media. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = deleteTarget;
                if (!target) return;
                startTransition(async () => {
                  await deleteVehicleAction(target.id);
                  router.refresh();
                });
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
