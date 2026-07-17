"use client";

import { useActionState } from "react";

import {
  markReservationDisputedAction,
  markReservationRefundedAction,
  type FormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FormState = { ok: false };

export function DepositActionsForm({
  reservationId,
  canMarkRefunded,
}: {
  reservationId: string;
  canMarkRefunded: boolean;
}) {
  const [refundState, refundAction, refundPending] = useActionState(
    markReservationRefundedAction,
    initialState,
  );
  const [disputeState, disputeAction, disputePending] = useActionState(
    markReservationDisputedAction,
    initialState,
  );

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-base font-bold text-ink">Dealer actions</h2>

      {canMarkRefunded && (
        <form action={refundAction} className="space-y-2">
          <input type="hidden" name="reservationId" value={reservationId} />
          <Label htmlFor="refund-notes">Mark refunded</Label>
          <Textarea id="refund-notes" name="notes" rows={2} placeholder="Refund notes (optional)" />
          {refundState.error && <p className="text-sm text-destructive">{refundState.error}</p>}
          {refundState.message && <p className="text-sm text-available">{refundState.message}</p>}
          <Button type="submit" disabled={refundPending} size="sm">
            {refundPending ? "Saving…" : "Mark refunded"}
          </Button>
        </form>
      )}

      <form action={disputeAction} className="space-y-2 border-t border-border pt-4">
        <input type="hidden" name="reservationId" value={reservationId} />
        <Label htmlFor="dispute-notes">Flag a dispute</Label>
        <Textarea id="dispute-notes" name="notes" rows={2} placeholder="What's the issue?" />
        {disputeState.error && <p className="text-sm text-destructive">{disputeState.error}</p>}
        {disputeState.message && <p className="text-sm text-available">{disputeState.message}</p>}
        <Button type="submit" disabled={disputePending} size="sm" variant="outline">
          {disputePending ? "Saving…" : "Mark disputed"}
        </Button>
      </form>
    </div>
  );
}
