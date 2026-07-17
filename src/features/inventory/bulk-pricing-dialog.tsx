"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkUpdatePricingAction } from "./actions";

type Mode = "set" | "increase_pct" | "decrease_pct";

export function BulkPricingDialog({
  vehicleIds,
  onDone,
}: {
  vehicleIds: string[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("set");
  const [amount, setAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a positive amount.");
      return;
    }
    setIsPending(true);
    setError(null);
    const result = await bulkUpdatePricingAction(vehicleIds, mode, value);
    setIsPending(false);
    if (!result.ok) {
      setError(result.error ?? "Could not update pricing.");
      return;
    }
    setOpen(false);
    setAmount("");
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <DollarSign className="size-4" aria-hidden="true" />
          Reprice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk pricing</DialogTitle>
          <DialogDescription>Applies to {vehicleIds.length} selected vehicle(s).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-pricing-mode">Action</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger id="bulk-pricing-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Set price to</SelectItem>
                <SelectItem value="increase_pct">Increase by %</SelectItem>
                <SelectItem value="decrease_pct">Decrease by %</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-pricing-amount">
              {mode === "set" ? "New price" : "Percentage"}
            </Label>
            <Input
              id="bulk-pricing-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
