"use client";

import { useActionState } from "react";

import { initiateReservationAction, type FormState } from "@/features/payments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { ok: false };

export function ReserveForm({
  dealershipId,
  vehicleId,
}: {
  dealershipId: string;
  vehicleId: string;
}) {
  const boundAction = initiateReservationAction.bind(null, dealershipId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="space-y-1.5">
        <Label htmlFor="res-name">Your name</Label>
        <Input id="res-name" name="buyerName" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="res-phone">Phone (MTN or Airtel Money number)</Label>
        <Input id="res-phone" name="buyerPhone" type="tel" required maxLength={30} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="res-email">Email (optional, for your receipt)</Label>
        <Input id="res-email" name="buyerEmail" type="email" maxLength={200} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Starting payment…" : "Pay deposit now"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to Flutterwave to complete payment via MTN Mobile Money, Airtel
        Money, or card.
      </p>
    </form>
  );
}
