"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteStaffAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function InviteStaffForm() {
  const [state, formAction, isPending] = useActionState(inviteStaffAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1 space-y-1">
        <Label htmlFor="invite-email" className="text-xs">
          Email
        </Label>
        <Input id="invite-email" name="email" type="email" required placeholder="staff@example.com" />
      </div>
      <div className="w-32 space-y-1">
        <Label htmlFor="invite-role" className="text-xs">
          Role
        </Label>
        <Select name="role" defaultValue="SALES">
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="SALES">Sales</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Invite"}
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="w-full text-sm text-available">{state.message}</p>}
    </form>
  );
}
