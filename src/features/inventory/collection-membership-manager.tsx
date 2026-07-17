"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Car, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addVehicleToCollectionAction, removeVehicleFromCollectionAction } from "./actions";

type MemberVehicle = {
  id: string;
  title: string;
  brand: { name: string };
  images: { url: string }[];
};

export function CollectionMembershipManager({
  collectionId,
  members,
  candidates,
}: {
  collectionId: string;
  members: MemberVehicle[];
  candidates: { id: string; title: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const available = candidates.filter((c) => !memberIds.has(c.id));

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      await addVehicleToCollectionAction(collectionId, selected);
      setSelected("");
    });
  }

  function handleRemove(vehicleId: string) {
    startTransition(() => {
      void removeVehicleFromCollectionAction(collectionId, vehicleId);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Add a vehicle…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          disabled={!selected || isPending}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No vehicles in this collection yet.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {vehicle.images[0] ? (
                    <Image
                      src={vehicle.images[0].url}
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
                  <p className="truncate text-sm font-medium text-ink">{vehicle.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{vehicle.brand.name}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => handleRemove(vehicle.id)}
                aria-label={`Remove ${vehicle.title}`}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
