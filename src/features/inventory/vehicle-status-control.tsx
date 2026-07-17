"use client";

import { useActionState } from "react";
import type { VehicleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateVehicleStatusAction, type FormState } from "./actions";
import { VEHICLE_STATUS_TRANSITIONS } from "./schema";

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

const initialState: FormState = { ok: false };

export function VehicleStatusControl({
  vehicleId,
  status,
}: {
  vehicleId: string;
  status: VehicleStatus;
}) {
  const action = updateVehicleStatusAction.bind(null, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const allowedNext = (VEHICLE_STATUS_TRANSITIONS[status] ?? []).filter((s) => s !== "RESERVED");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
      <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>

      {allowedNext.length > 0 && (
        <form action={formAction} className="flex items-center gap-2">
          <Select name="status" defaultValue={allowedNext[0]}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedNext.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "Updating…" : "Change status"}
          </Button>
        </form>
      )}

      {status === "RESERVED" && (
        <p className="text-xs text-muted-foreground">
          Reserved automatically by a paid deposit (Stage 6).
        </p>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
