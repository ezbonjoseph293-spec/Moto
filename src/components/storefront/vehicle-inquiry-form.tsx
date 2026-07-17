"use client";

import { useActionState } from "react";

import { submitVehicleInquiryAction, type FormState } from "@/features/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FormState = { ok: false };

export function VehicleInquiryForm({
  dealershipId,
  vehicleId,
  vehicleTitle,
}: {
  dealershipId: string;
  vehicleId: string;
  vehicleTitle: string;
}) {
  const boundAction = submitVehicleInquiryAction.bind(null, dealershipId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm font-medium text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="space-y-1.5">
        <Label htmlFor="inq-name">Your name</Label>
        <Input id="inq-name" name="name" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inq-phone">Phone</Label>
        <Input id="inq-phone" name="phone" type="tel" required maxLength={30} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inq-email">Email (optional)</Label>
        <Input id="inq-email" name="email" type="email" maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inq-message">Message</Label>
        <Textarea
          id="inq-message"
          name="message"
          rows={3}
          maxLength={2000}
          defaultValue={`Hi, I'm interested in the ${vehicleTitle}. Is it still available?`}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending…" : "Send inquiry"}
      </Button>
    </form>
  );
}
