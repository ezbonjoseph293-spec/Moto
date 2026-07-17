"use client";

import { useActionState, useEffect, useState } from "react";
import type { Setting } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateDepositAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function DepositForm({ setting, onSaved }: { setting: Setting; onSaved?: () => void }) {
  const [state, formAction, isPending] = useActionState(updateDepositAction, initialState);
  const [depositType, setDepositType] = useState(setting.depositType);

  useEffect(() => {
    if (state.ok) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="depositType">Deposit type</Label>
        <Select name="depositType" defaultValue={setting.depositType} onValueChange={setDepositType}>
          <SelectTrigger id="depositType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Fixed amount</SelectItem>
            <SelectItem value="PERCENTAGE">Percentage of price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {depositType === "FIXED" ? (
        <div className="space-y-1.5">
          <Label htmlFor="depositFixedAmount">Fixed deposit amount</Label>
          <Input
            id="depositFixedAmount"
            name="depositFixedAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={setting.depositFixedAmount?.toString() ?? ""}
            required
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="depositPercentage">Deposit percentage</Label>
          <Input
            id="depositPercentage"
            name="depositPercentage"
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            defaultValue={setting.depositPercentage?.toString() ?? ""}
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="depositHoldHours">Hold period (hours)</Label>
        <Input
          id="depositHoldHours"
          name="depositHoldHours"
          type="number"
          min="1"
          max="720"
          defaultValue={setting.depositHoldHours}
          required
        />
        <p className="text-xs text-muted-foreground">
          How long a car stays reserved for a buyer before the hold auto-expires.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="refundPolicyText">Refund policy (shown to buyers before they pay)</Label>
        <Textarea
          id="refundPolicyText"
          name="refundPolicyText"
          rows={5}
          defaultValue={setting.refundPolicyText ?? ""}
          placeholder="Deposits are fully refundable if the vehicle fails inspection or the hold period expires before you complete the purchase."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && <p className="text-sm text-status-available">{state.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save deposit policy"}
      </Button>
    </form>
  );
}
