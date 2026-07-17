"use client";

import { useActionState, useState } from "react";
import type { BodyType, Brand, Vehicle } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  conditionValues,
  driveTypeValues,
  fuelTypeValues,
  mileageUnitValues,
  transmissionValues,
} from "./schema";
import { createVehicleAction, updateVehicleAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

const LABELS: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  OTHER: "Other",
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
  CVT: "CVT",
  SEMI_AUTOMATIC: "Semi-automatic",
  FWD: "Front-wheel drive",
  RWD: "Rear-wheel drive",
  AWD: "All-wheel drive",
  FOUR_WD: "4WD",
  NEW: "New",
  USED: "Used",
  IMPORTED: "Imported",
  CERTIFIED_PRE_OWNED: "Certified pre-owned",
  KM: "Kilometers",
  MILES: "Miles",
};

function toDatetimeLocal(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function VehicleForm({
  vehicle,
  brands,
  bodyTypes,
}: {
  vehicle?: Vehicle;
  brands: Brand[];
  bodyTypes: BodyType[];
}) {
  const action = vehicle ? updateVehicleAction.bind(null, vehicle.id) : createVehicleAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isFeatured, setIsFeatured] = useState(vehicle?.isFeatured ?? false);

  const features = Array.isArray(vehicle?.features) ? (vehicle.features as string[]) : [];

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Toyota Land Cruiser V8 2021"
              defaultValue={vehicle?.title}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brandId">Brand</Label>
            <Select name="brandId" defaultValue={vehicle?.brandId}>
              <SelectTrigger id="brandId">
                <SelectValue placeholder="Choose a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bodyTypeId">Body type</Label>
            <Select name="bodyTypeId" defaultValue={vehicle?.bodyTypeId ?? undefined}>
              <SelectTrigger id="bodyTypeId">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" name="year" type="number" required defaultValue={vehicle?.year} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="condition">Condition</Label>
            <Select name="condition" defaultValue={vehicle?.condition ?? "USED"}>
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionValues.map((c) => (
                  <SelectItem key={c} value={c}>
                    {LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              required
              defaultValue={vehicle?.price.toString()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discountPrice">Discount price</Label>
            <Input
              id="discountPrice"
              name="discountPrice"
              type="number"
              step="0.01"
              defaultValue={vehicle?.discountPrice?.toString() ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              maxLength={3}
              defaultValue={vehicle?.currency ?? "UGX"}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Specs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="mileage">Mileage</Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              defaultValue={vehicle?.mileage ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mileageUnit">Mileage unit</Label>
            <Select name="mileageUnit" defaultValue={vehicle?.mileageUnit ?? "KM"}>
              <SelectTrigger id="mileageUnit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mileageUnitValues.map((u) => (
                  <SelectItem key={u} value={u}>
                    {LABELS[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" defaultValue={vehicle?.color ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Fuel type</Label>
            <Select name="fuelType" defaultValue={vehicle?.fuelType ?? "PETROL"}>
              <SelectTrigger id="fuelType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fuelTypeValues.map((f) => (
                  <SelectItem key={f} value={f}>
                    {LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmission</Label>
            <Select name="transmission" defaultValue={vehicle?.transmission ?? "AUTOMATIC"}>
              <SelectTrigger id="transmission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transmissionValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="driveType">Drive type</Label>
            <Select name="driveType" defaultValue={vehicle?.driveType ?? undefined}>
              <SelectTrigger id="driveType">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {driveTypeValues.map((d) => (
                  <SelectItem key={d} value={d}>
                    {LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seats">Seats</Label>
            <Input id="seats" name="seats" type="number" defaultValue={vehicle?.seats ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doors">Doors</Label>
            <Input id="doors" name="doors" type="number" defaultValue={vehicle?.doors ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="engineSizeCc">Engine size (cc)</Label>
            <Input
              id="engineSizeCc"
              name="engineSizeCc"
              type="number"
              defaultValue={vehicle?.engineSizeCc ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vin">VIN</Label>
            <Input id="vin" name="vin" defaultValue={vehicle?.vin ?? ""} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Description & features</h2>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            required
            defaultValue={vehicle?.description}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="features">Features</Label>
          <Textarea
            id="features"
            name="features"
            rows={4}
            placeholder="One per line, e.g.&#10;Air Conditioning&#10;Bluetooth&#10;Sunroof"
            defaultValue={features.join("\n")}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
            <Switch
              id="isFeatured"
              name="isFeatured"
              value="on"
              checked={isFeatured}
              onCheckedChange={setIsFeatured}
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              Feature on homepage
            </Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="publishAt">Scheduled publish (optional)</Label>
            <Input
              id="publishAt"
              name="publishAt"
              type="datetime-local"
              defaultValue={toDatetimeLocal(vehicle?.publishAt ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to publish manually. A draft with a past/due time flips to Available
              automatically.
            </p>
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && (
        <p className="text-status-available text-sm">{state.message}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : vehicle ? "Save changes" : "Create vehicle"}
      </Button>
    </form>
  );
}
