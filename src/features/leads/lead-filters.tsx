"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadSourceValues } from "./schema";
import { leadSourceLabel } from "./lead-status-badge";

export function LeadFilters({ staff }: { staff: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/admin/leads?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search by name, phone, or email…"
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("search", e.currentTarget.value);
          }}
          onBlur={(e) => setParam("search", e.currentTarget.value)}
        />
      </div>

      <Select
        defaultValue={searchParams.get("source") ?? "all"}
        onValueChange={(v) => setParam("source", v)}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {leadSourceValues.map((s) => (
            <SelectItem key={s} value={s}>
              {leadSourceLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("assignedToId") ?? "all"}
        onValueChange={(v) => setParam("assignedToId", v)}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Assigned to" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everyone</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
