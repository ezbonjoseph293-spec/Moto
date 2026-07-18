"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import { initiateSubscriptionPaymentAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export type BillingPlanOption = {
  id: string;
  name: string;
  currency: string;
  priceMonthly: string;
  priceYearly: string;
};

export function BillingPayForm({
  plans,
  currentPlanId,
  currentBillingInterval,
}: {
  plans: BillingPlanOption[];
  currentPlanId: string;
  currentBillingInterval: "MONTHLY" | "YEARLY";
}) {
  const [state, formAction, isPending] = useActionState(
    initiateSubscriptionPaymentAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="planId">Plan</Label>
        <Select name="planId" defaultValue={currentPlanId}>
          <SelectTrigger id="planId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} — {formatPrice(plan.priceMonthly, plan.currency)}/mo
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="billingInterval">Billing interval</Label>
        <Select name="billingInterval" defaultValue={currentBillingInterval}>
          <SelectTrigger id="billingInterval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly (2 months free)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Starting payment…" : "Pay now"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to Flutterwave to pay via MTN Mobile Money, Airtel Money, or
        card.
      </p>
    </form>
  );
}
