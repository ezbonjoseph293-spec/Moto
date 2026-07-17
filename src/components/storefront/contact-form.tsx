"use client";

import { useActionState } from "react";

import { submitContactFormAction, type FormState } from "@/features/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FormState = { ok: false };

export function ContactForm({ dealershipId }: { dealershipId: string }) {
  const boundAction = submitContactFormAction.bind(null, dealershipId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="font-heading text-lg font-semibold text-ink">Message sent</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required maxLength={120} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" maxLength={30} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" maxLength={200} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required rows={4} maxLength={2000} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
