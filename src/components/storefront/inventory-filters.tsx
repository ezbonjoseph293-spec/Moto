"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { BodyType, Brand } from "@prisma/client";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  conditionValues,
  fuelTypeValues,
  transmissionValues,
} from "@/features/inventory/schema";
import { conditionLabel, fuelLabel, transmissionLabel } from "@/lib/format";

const FIELD_KEYS = [
  "search",
  "brandId",
  "bodyTypeId",
  "condition",
  "fuelType",
  "transmission",
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
] as const;

function FilterFields({
  brands,
  bodyTypes,
  values,
  onChange,
}: {
  brands: Brand[];
  bodyTypes: BodyType[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="inv-search">Search</Label>
        <div className="relative">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="inv-search"
            placeholder="Make, model, keyword…"
            className="pl-9"
            defaultValue={values.search ?? ""}
            onChange={(e) => onChange("search", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Select value={values.brandId || "all"} onValueChange={(v) => onChange("brandId", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Body style</Label>
        <Select value={values.bodyTypeId || "all"} onValueChange={(v) => onChange("bodyTypeId", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All body styles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All body styles</SelectItem>
            {bodyTypes.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Condition</Label>
        <Select value={values.condition || "all"} onValueChange={(v) => onChange("condition", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any condition</SelectItem>
            {conditionValues.map((c) => (
              <SelectItem key={c} value={c}>
                {conditionLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Fuel type</Label>
        <Select value={values.fuelType || "all"} onValueChange={(v) => onChange("fuelType", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any fuel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any fuel type</SelectItem>
            {fuelTypeValues.map((f) => (
              <SelectItem key={f} value={f}>
                {fuelLabel(f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Transmission</Label>
        <Select
          value={values.transmission || "all"}
          onValueChange={(v) => onChange("transmission", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any transmission</SelectItem>
            {transmissionValues.map((t) => (
              <SelectItem key={t} value={t}>
                {transmissionLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Price range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            defaultValue={values.minPrice ?? ""}
            onChange={(e) => onChange("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            defaultValue={values.maxPrice ?? ""}
            onChange={(e) => onChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Year range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="From"
            defaultValue={values.minYear ?? ""}
            onChange={(e) => onChange("minYear", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="To"
            defaultValue={values.maxYear ?? ""}
            onChange={(e) => onChange("maxYear", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export function InventoryFilters({ brands, bodyTypes }: { brands: Brand[]; bodyTypes: BodyType[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentValues = Object.fromEntries(
    FIELD_KEYS.map((k) => [k, searchParams.get(k) ?? ""]),
  ) as Record<string, string>;
  const [draft, setDraft] = useState(currentValues);

  const activeCount = FIELD_KEYS.filter((k) => currentValues[k]).length;

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FIELD_KEYS) {
      const value = draft[key];
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FIELD_KEYS) params.delete(key);
    params.delete("page");
    setDraft(Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])) as Record<string, string>);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      {/* Mobile: filter drawer */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="size-4" aria-hidden="true" />
              Filters {activeCount > 0 && `(${activeCount})`}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter inventory</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <FilterFields
                brands={brands}
                bodyTypes={bodyTypes}
                values={draft}
                onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
              />
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={clear} className="flex-1">
                  <X className="size-4" aria-hidden="true" />
                  Clear
                </Button>
                <Button onClick={apply} className="flex-1">
                  Apply filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: sidebar */}
      <aside className="hidden w-64 shrink-0 rounded-lg border border-border bg-card p-5 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-ink">Filters</h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-brand hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterFields
          brands={brands}
          bodyTypes={bodyTypes}
          values={draft}
          onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
        />
        <Button onClick={apply} className="mt-6 w-full">
          Apply filters
        </Button>
      </aside>
    </>
  );
}
