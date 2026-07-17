"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { BodyType, Brand } from "@prisma/client";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleStatusValues } from "./schema";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  ARCHIVED: "Archived",
  HIDDEN: "Hidden",
};

export function VehicleFilters({ brands, bodyTypes }: { brands: Brand[]; bodyTypes: BodyType[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/admin/inventory?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search by title or VIN…"
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("search", e.currentTarget.value);
          }}
          onBlur={(e) => setParam("search", e.currentTarget.value)}
        />
      </div>

      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {vehicleStatusValues.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("brandId") ?? "all"}
        onValueChange={(v) => setParam("brandId", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Brand" />
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

      <Select
        defaultValue={searchParams.get("bodyTypeId") ?? "all"}
        onValueChange={(v) => setParam("bodyTypeId", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Body type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All body types</SelectItem>
          {bodyTypes.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("sort") ?? "newest"}
        onValueChange={(v) => setParam("sort", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="price_asc">Price: low to high</SelectItem>
          <SelectItem value="price_desc">Price: high to low</SelectItem>
          <SelectItem value="year_desc">Year: newest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
