"use client";

import { useActionState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadStatusValues } from "./schema";
import { addLeadNoteAction, assignLeadAction, updateLeadStatusAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CLOSED: "Closed",
  LOST: "Lost",
};

export function LeadActions({
  leadId,
  status,
  assignedToId,
  staff,
}: {
  leadId: string;
  status: string;
  assignedToId: string | null;
  staff: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();
  const [statusState, statusAction] = useActionState(updateLeadStatusAction, initialState);
  const [assignState, assignAction] = useActionState(assignLeadAction, initialState);

  function submitStatus(next: string) {
    const form = new FormData();
    form.set("leadId", leadId);
    form.set("status", next);
    startTransition(() => statusAction(form));
  }

  function submitAssign(next: string) {
    const form = new FormData();
    form.set("leadId", leadId);
    if (next !== "unassigned") form.set("assignedToId", next);
    startTransition(() => assignAction(form));
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-base font-bold text-ink">Lead actions</h2>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select defaultValue={status} onValueChange={submitStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leadStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusState.error && <p className="text-sm text-destructive">{statusState.error}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Assigned to</Label>
        <Select defaultValue={assignedToId ?? "unassigned"} onValueChange={submitAssign}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {assignState.error && <p className="text-sm text-destructive">{assignState.error}</p>}
      </div>
    </div>
  );
}

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const [state, formAction, isPending] = useActionState(addLeadNoteAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Label htmlFor="note">Add a note</Label>
      <Textarea id="note" name="note" rows={2} placeholder="Called, left voicemail…" required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
