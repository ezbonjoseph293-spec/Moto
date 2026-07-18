"use client";

import { useActionState, useEffect } from "react";
import type { SerializedSetting } from "./schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateContactAction, type FormState } from "./actions";
import type { BusinessHours, SocialLinks } from "./schema";

const initialState: FormState = { ok: false };

export function ContactForm({
  setting,
  onSaved,
}: {
  setting: SerializedSetting;
  onSaved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateContactAction, initialState);

  useEffect(() => {
    if (state.ok) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const hours = (setting.businessHours as BusinessHours | null) ?? {
    mon_fri: "08:00-18:00",
    sat: "09:00-16:00",
    sun: "closed",
  };
  const socials = (setting.socialLinks as SocialLinks | null) ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phonePrimary">Primary phone</Label>
          <Input
            id="phonePrimary"
            name="phonePrimary"
            defaultValue={setting.phonePrimary ?? ""}
            placeholder="+256700000000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phoneSecondary">Secondary phone</Label>
          <Input
            id="phoneSecondary"
            name="phoneSecondary"
            defaultValue={setting.phoneSecondary ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsappNumber">WhatsApp number</Label>
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={setting.whatsappNumber ?? ""}
            placeholder="+256700000000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Public email</Label>
          <Input id="email" name="email" type="email" defaultValue={setting.email ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={setting.address ?? ""}
          placeholder="Plot 12, Kampala Road, Kampala"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={setting.latitude ?? ""}
            placeholder="0.347596"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={setting.longitude ?? ""}
            placeholder="32.582520"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Find coordinates by right-clicking the location on{" "}
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>{" "}
        and copying the lat/lng shown.
      </p>

      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium text-ink">Business hours</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="hoursMonFri">Mon–Fri</Label>
            <Input
              id="hoursMonFri"
              name="hoursMonFri"
              defaultValue={hours.mon_fri}
              placeholder="08:00-18:00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hoursSat">Saturday</Label>
            <Input
              id="hoursSat"
              name="hoursSat"
              defaultValue={hours.sat}
              placeholder="09:00-16:00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hoursSun">Sunday</Label>
            <Input
              id="hoursSun"
              name="hoursSun"
              defaultValue={hours.sun}
              placeholder="closed"
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use &quot;closed&quot; or a range like 08:00-18:00.
        </p>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-medium text-ink">Social links</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="socialFacebook">Facebook</Label>
            <Input
              id="socialFacebook"
              name="socialFacebook"
              defaultValue={socials.facebook ?? ""}
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socialInstagram">Instagram</Label>
            <Input
              id="socialInstagram"
              name="socialInstagram"
              defaultValue={socials.instagram ?? ""}
              placeholder="https://instagram.com/yourpage"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socialTwitter">X / Twitter</Label>
            <Input
              id="socialTwitter"
              name="socialTwitter"
              defaultValue={socials.twitter ?? ""}
              placeholder="https://x.com/yourpage"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socialTiktok">TikTok</Label>
            <Input
              id="socialTiktok"
              name="socialTiktok"
              defaultValue={socials.tiktok ?? ""}
              placeholder="https://tiktok.com/@yourpage"
            />
          </div>
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && (
        <p className="text-status-available text-sm">{state.message}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save contact details"}
      </Button>
    </form>
  );
}
