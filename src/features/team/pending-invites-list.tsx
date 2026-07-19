"use client";

import { useTransition } from "react";
import type { StaffInvite } from "@prisma/client";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { revokeInviteAction } from "./actions";

type InviteRow = StaffInvite & { invitedBy: { name: string } };

export function PendingInvitesList({ invites }: { invites: InviteRow[] }) {
  const [, startTransition] = useTransition();

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Pending invites
      </h3>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{invite.email}</p>
              <p className="text-xs text-muted-foreground">
                {invite.role === "MANAGER" ? "Manager" : "Sales"} · invited by{" "}
                {invite.invitedBy.name} · expires {invite.expiresAt.toLocaleDateString()}
              </p>
            </div>
            <ConfirmActionButton
              title="Revoke this invite?"
              description={`${invite.email} will no longer be able to accept this invite and join your team.`}
              confirmLabel="Revoke"
              onConfirm={() => startTransition(() => void revokeInviteAction(invite.id))}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Revoke invite to ${invite.email}`}
                >
                  <X className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
