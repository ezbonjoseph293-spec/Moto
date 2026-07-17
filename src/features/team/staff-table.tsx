"use client";

import { useActionState, useTransition } from "react";
import type { User } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setStaffActiveAction, updateStaffRoleAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

const ROLE_LABELS: Record<string, string> = { OWNER: "Owner", MANAGER: "Manager", SALES: "Sales" };

function StaffRow({ member, currentUserId }: { member: User; currentUserId: string }) {
  const [, startTransition] = useTransition();
  const [state, roleAction] = useActionState(updateStaffRoleAction, initialState);

  function submitRole(role: string) {
    const form = new FormData();
    form.set("userId", member.id);
    form.set("role", role);
    startTransition(() => roleAction(form));
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {member.name} {member.id === currentUserId && <span className="text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {!member.isActive && <Badge variant="outline">Deactivated</Badge>}
        {member.role === "OWNER" ? (
          <Badge>{ROLE_LABELS.OWNER}</Badge>
        ) : (
          <Select defaultValue={member.role} onValueChange={submitRole}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="SALES">Sales</SelectItem>
            </SelectContent>
          </Select>
        )}
        {member.role !== "OWNER" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() => void setStaffActiveAction(member.id, !member.isActive))
            }
          >
            {member.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </li>
  );
}

export function StaffTable({
  staff,
  currentUserId,
}: {
  staff: User[];
  currentUserId: string;
}) {
  return (
    <ul className="space-y-2">
      {staff.map((member) => (
        <StaffRow key={member.id} member={member} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}
