"use client";

import { useActionState, useState } from "react";
import type { SerializedSetting } from "./schema";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateNotificationsAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function NotificationsForm({ setting }: { setting: SerializedSetting }) {
  const [state, formAction, isPending] = useActionState(updateNotificationsAction, initialState);
  const [email, setEmail] = useState(setting.notifyNewLeadEmail);
  const [sms, setSms] = useState(setting.notifyNewLeadSms);

  return (
    <form action={formAction} className="max-w-xl space-y-4 border-t border-border pt-6">
      <h2 className="font-heading text-base font-bold text-ink">New lead notifications</h2>

      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div>
          <Label htmlFor="notifyNewLeadEmail">Email me for new leads</Label>
          <p className="text-xs text-muted-foreground">Sent to your Contact email address.</p>
        </div>
        <Switch
          id="notifyNewLeadEmail"
          name="notifyNewLeadEmail"
          value="on"
          checked={email}
          onCheckedChange={setEmail}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div>
          <Label htmlFor="notifyNewLeadSms">SMS me for new leads</Label>
          <p className="text-xs text-muted-foreground">Sent to your primary phone number.</p>
        </div>
        <Switch
          id="notifyNewLeadSms"
          name="notifyNewLeadSms"
          value="on"
          checked={sms}
          onCheckedChange={setSms}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && <p className="text-sm text-available">{state.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save notifications"}
      </Button>
    </form>
  );
}
