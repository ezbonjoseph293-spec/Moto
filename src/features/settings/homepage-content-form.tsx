"use client";

import { useActionState } from "react";
import type { SerializedSetting } from "./schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateHomepageContentAction, type FormState } from "./actions";
import type { WhyChooseUsItem } from "./schema";

const initialState: FormState = { ok: false };

const DEFAULT_WHY_CHOOSE_US: WhyChooseUsItem[] = [
  {
    title: "Verified inventory",
    body: "Every listing is inspected and accurately described before it goes live.",
  },
  {
    title: "Fair, transparent pricing",
    body: "The price you see is the price you pay.",
  },
  {
    title: "Responsive support",
    body: "Reach us by phone or WhatsApp and get a real answer, fast.",
  },
  {
    title: "Easy online reservation",
    body: "Secure your car with a deposit from your phone, in minutes.",
  },
];

export function HomepageContentForm({ setting }: { setting: SerializedSetting }) {
  const [state, formAction, isPending] = useActionState(updateHomepageContentAction, initialState);

  const items = (setting.whyChooseUsItems as WhyChooseUsItem[] | null) ?? DEFAULT_WHY_CHOOSE_US;

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="heroSubtitle">Hero subtitle</Label>
        <Textarea
          id="heroSubtitle"
          name="heroSubtitle"
          rows={2}
          maxLength={300}
          defaultValue={setting.heroSubtitle ?? ""}
          placeholder="Browse verified, quality-checked vehicles and secure the one you want with a refundable online deposit."
        />
        <p className="text-xs text-muted-foreground">
          Shown under your headline on the homepage. Leave blank to use the default.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Why choose us (4 highlights)</Label>
        {([0, 1, 2, 3] as const).map((i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`why${i + 1}Title`} className="text-xs">
                Title
              </Label>
              <Input
                id={`why${i + 1}Title`}
                name={`why${i + 1}Title`}
                defaultValue={items[i]?.title ?? DEFAULT_WHY_CHOOSE_US[i]!.title}
                maxLength={60}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`why${i + 1}Body`} className="text-xs">
                Description
              </Label>
              <Input
                id={`why${i + 1}Body`}
                name={`why${i + 1}Body`}
                defaultValue={items[i]?.body ?? DEFAULT_WHY_CHOOSE_US[i]!.body}
                maxLength={200}
                required
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ctaTitle">Closing banner title</Label>
        <Input
          id="ctaTitle"
          name="ctaTitle"
          maxLength={120}
          defaultValue={setting.ctaTitle ?? ""}
          placeholder="Ready to find your next car?"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ctaBodyText">Closing banner text</Label>
        <Textarea
          id="ctaBodyText"
          name="ctaBodyText"
          rows={2}
          maxLength={300}
          defaultValue={setting.ctaBodyText ?? ""}
          placeholder="Browse the full inventory, filter by what matters to you, and reserve online with a deposit."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && (
        <p className="text-status-available text-sm">{state.message}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save homepage content"}
      </Button>
    </form>
  );
}
