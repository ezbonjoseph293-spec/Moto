"use client";

import { useActionState, useState } from "react";
import type { Setting } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateAnnouncementAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function AnnouncementForm({ setting }: { setting: Setting }) {
  const [state, formAction, isPending] = useActionState(updateAnnouncementAction, initialState);
  const [active, setActive] = useState(setting.announcementBarActive);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div>
          <Label htmlFor="announcementBarActive">Show announcement bar</Label>
          <p className="text-xs text-muted-foreground">
            Displays a thin banner at the top of every storefront page.
          </p>
        </div>
        <Switch
          id="announcementBarActive"
          name="announcementBarActive"
          value="on"
          checked={active}
          onCheckedChange={setActive}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="announcementBarText">Announcement text</Label>
        <Input
          id="announcementBarText"
          name="announcementBarText"
          defaultValue={setting.announcementBarText ?? ""}
          placeholder="Free delivery on all reservations this month!"
          maxLength={200}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && <p className="text-sm text-status-available">{state.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save announcement bar"}
      </Button>
    </form>
  );
}
