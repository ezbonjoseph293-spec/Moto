"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeDealerPlanAction,
  extendTrialAction,
  reactivateDealerAction,
  suspendDealerAction,
  type FormState,
} from "./actions";

const initialState: FormState = { ok: false };

export function DealerActionsForm({
  dealershipId,
  dealershipStatus,
  plans,
}: {
  dealershipId: string;
  dealershipStatus: string;
  plans: { id: string; name: string }[];
}) {
  const [extendState, extendAction, extendPending] = useActionState(extendTrialAction, initialState);
  const [suspendState, suspendAction, suspendPending] = useActionState(
    suspendDealerAction,
    initialState,
  );
  const [reactivateState, reactivateAction, reactivatePending] = useActionState(
    reactivateDealerAction,
    initialState,
  );
  const [planState, planAction, planPending] = useActionState(
    changeDealerPlanAction,
    initialState,
  );

  const isSuspendedOrCancelled = dealershipStatus === "SUSPENDED" || dealershipStatus === "CANCELLED";

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="font-heading text-base font-bold text-ink">Manual controls</h2>

      <form action={extendAction} className="flex items-end gap-2">
        <input type="hidden" name="dealershipId" value={dealershipId} />
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="days">Extend trial (days)</Label>
          <Input id="days" name="days" type="number" min="1" max="365" defaultValue={14} />
        </div>
        <Button type="submit" size="sm" disabled={extendPending}>
          {extendPending ? "Saving…" : "Extend"}
        </Button>
      </form>
      {extendState.error && <p className="text-sm text-destructive">{extendState.error}</p>}
      {extendState.message && <p className="text-sm text-available">{extendState.message}</p>}

      <div className="border-t border-border pt-4">
        <form action={planAction} className="flex items-end gap-2">
          <input type="hidden" name="dealershipId" value={dealershipId} />
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="planId">Change plan</Label>
            <Select name="planId">
              <SelectTrigger id="planId">
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={planPending}>
            {planPending ? "Saving…" : "Change"}
          </Button>
        </form>
        {planState.error && <p className="text-sm text-destructive">{planState.error}</p>}
        {planState.message && <p className="text-sm text-available">{planState.message}</p>}
      </div>

      <div className="border-t border-border pt-4">
        {isSuspendedOrCancelled ? (
          <form action={reactivateAction} className="space-y-2">
            <input type="hidden" name="dealershipId" value={dealershipId} />
            <Button type="submit" size="sm" disabled={reactivatePending}>
              {reactivatePending ? "Saving…" : "Reactivate dealer"}
            </Button>
            {reactivateState.error && (
              <p className="text-sm text-destructive">{reactivateState.error}</p>
            )}
            {reactivateState.message && (
              <p className="text-sm text-available">{reactivateState.message}</p>
            )}
          </form>
        ) : (
          <form action={suspendAction} className="space-y-2">
            <input type="hidden" name="dealershipId" value={dealershipId} />
            <Label htmlFor="reason">Suspend dealer</Label>
            <Textarea id="reason" name="reason" rows={2} placeholder="Reason (optional)" />
            <Button type="submit" size="sm" variant="destructive" disabled={suspendPending}>
              {suspendPending ? "Saving…" : "Suspend"}
            </Button>
            {suspendState.error && <p className="text-sm text-destructive">{suspendState.error}</p>}
            {suspendState.message && (
              <p className="text-sm text-available">{suspendState.message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
